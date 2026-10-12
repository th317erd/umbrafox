/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#include <thread>
#include <vector>

#include "GPUVideoImage.h"
#include "gtest/gtest.h"
#include "mozilla/Atomics.h"
#include "mozilla/PRemoteMediaManagerParent.h"
#include "mozilla/RemoteMediaManagerChild.h"
#include "mozilla/ScopeExit.h"
#include "mozilla/SpinEventLoopUntil.h"
#include "mozilla/SyncRunnable.h"
#include "mozilla/gfx/2D.h"
#include "mozilla/ipc/Endpoint.h"
#include "nsThreadUtils.h"

namespace mozilla::layers {
namespace {

using namespace gfx;

class ReadbackTestManager final : public IGPUVideoSurfaceManager {
 public:
  NS_INLINE_DECL_THREADSAFE_REFCOUNTING(ReadbackTestManager, override)

  bool CanReadback() override {
    ++mAvailabilityChecks;
    if (mAvailabilityReenter) {
      auto* image = mAvailabilityReenter;
      mAvailabilityReenter = nullptr;
      RefPtr<SourceSurface> nested = mAvailabilitySized
                                         ? image->GetAsSourceSurface(mFullSize)
                                         : image->GetAsSourceSurface();
      EXPECT_TRUE(nested);
    }
    return mThreadAvailable && mConnected;
  }

  already_AddRefed<SourceSurface> Readback(
      const SurfaceDescriptorGPUVideo& aSD) override {
    ++mFullReads;
    if (!mThreadAvailable || !mConnected) {
      return nullptr;
    }
    if (mFailNext.exchange(false)) {
      return nullptr;
    }
    if (mReenter) {
      GPUVideoImage* image = mReenter;
      mReenter = nullptr;
      RefPtr<SourceSurface> nested = image->GetAsSourceSurface();
      EXPECT_TRUE(nested);
    }
    if (mNonData) {
      return MakeRefPtr<NonDataSurface>(mFullSize).forget();
    }
    return MakeSurface(mWrongSize ? IntSize(1, 1) : mFullSize, aSD);
  }

  already_AddRefed<SourceSurface> Readback(const SurfaceDescriptorGPUVideo& aSD,
                                           const IntSize& aSize) override {
    ++mSizedReads;
    if (!mThreadAvailable || !mConnected) {
      return nullptr;
    }
    if (mFailNext.exchange(false)) {
      return nullptr;
    }
    if (mReenter) {
      GPUVideoImage* image = mReenter;
      mReenter = nullptr;
      RefPtr<SourceSurface> nested = image->GetAsSourceSurface(aSize);
      EXPECT_TRUE(nested);
    }
    return MakeSurface(mWrongSize || aSize.IsEmpty() ? IntSize(1, 1) : aSize,
                       aSD);
  }

  already_AddRefed<Image> TransferToImage(const SurfaceDescriptorGPUVideo&,
                                          const IntSize&, const ColorDepth&,
                                          YUVColorSpace, ColorSpace2,
                                          TransferFunction,
                                          ColorRange) override {
    return nullptr;
  }

  void DeallocateSurfaceDescriptor(const SurfaceDescriptorGPUVideo&) override {
    ++mDeallocations;
  }

  void OnSetCurrent(const SurfaceDescriptorGPUVideo&) override {}

  Atomic<uint32_t> mSizedReads{0};
  Atomic<uint32_t> mFullReads{0};
  Atomic<uint32_t> mDestroyedSurfaces{0};
  Atomic<uint32_t> mDeallocations{0};
  Atomic<uint32_t> mAvailabilityChecks{0};
  Atomic<bool> mThreadAvailable{true};
  Atomic<bool> mConnected{true};
  Atomic<bool> mFailNext{false};
  bool mWrongSize = false;
  bool mNonData = false;
  IntSize mFullSize{32, 32};
  int32_t mStride = 0;
  GPUVideoImage* mReenter = nullptr;  // Borrowed only during the reentry test.
  GPUVideoImage* mAvailabilityReenter = nullptr;
  bool mAvailabilitySized = false;

 private:
  ~ReadbackTestManager() = default;

  class NonDataSurface final : public SourceSurface {
   public:
    explicit NonDataSurface(const IntSize& aSize) : mSize(aSize) {}
    SurfaceType GetType() const override { return SurfaceType::RECORDING; }
    IntSize GetSize() const override { return mSize; }
    SurfaceFormat GetFormat() const override { return SurfaceFormat::B8G8R8A8; }
    already_AddRefed<DataSourceSurface> GetDataSurface() override {
      ADD_FAILURE() << "Non-data readbacks must not be mapped for caching";
      return nullptr;
    }

   private:
    IntSize mSize;
  };

  struct Storage {
    RefPtr<ReadbackTestManager> mManager;
    std::vector<uint8_t> mBytes;
    ~Storage() { ++mManager->mDestroyedSurfaces; }
  };

  already_AddRefed<SourceSurface> MakeSurface(
      const IntSize& aSize, const SurfaceDescriptorGPUVideo& aSD) {
    const int32_t stride = mStride ? mStride : aSize.width * 4;
    auto storage = MakeUnique<Storage>();
    storage->mManager = this;
    storage->mBytes.assign(
        size_t(stride) * aSize.height,
        uint8_t(aSD.get_SurfaceDescriptorRemoteDecoder().handle()));
    RefPtr<DataSourceSurface> surface =
        Factory::CreateWrappingDataSourceSurface(
            storage->mBytes.data(), stride, aSize, SurfaceFormat::B8G8R8A8);
    if (!surface) {
      return nullptr;
    }
    static UserDataKey key;
    surface->AddUserData(&key, storage.release(), [](void* aData) {
      delete static_cast<Storage*>(aData);
    });
    return surface.forget();
  }
};

RefPtr<GPUVideoImage> MakeReadbackImage(
    ReadbackTestManager* aManager, uint64_t aHandle = 0x5a,
    const IntSize& aSize = IntSize(1920, 1080),
    RemoteDecoderVideoType aType = RemoteDecoderVideoType::DMABuf) {
  SurfaceDescriptorGPUVideo descriptor(SurfaceDescriptorRemoteDecoder(
      aHandle, aType, Nothing(), SurfaceDescriptorRemoteDecoderId{aHandle}));
  return MakeRefPtr<GPUVideoImage>(
      aManager, descriptor, aSize, ColorDepth::COLOR_8, YUVColorSpace::BT709,
      ColorSpace2::BT709, TransferFunction::BT709, ColorRange::LIMITED);
}

TEST(GPUVideoReadback, SameFrameAndSizeUsesOneReadback)
{
  RefPtr manager = new ReadbackTestManager();
  auto image = MakeReadbackImage(manager);
  RefPtr<SourceSurface> first = image->GetAsSourceSurface(IntSize(110, 75));
  ASSERT_TRUE(first);
  for (int i = 0; i < 8; ++i) {
    RefPtr<SourceSurface> next = image->GetAsSourceSurface(IntSize(110, 75));
    EXPECT_EQ(first, next);
  }
  EXPECT_EQ(uint32_t(manager->mSizedReads), 1u);
  RefPtr<DataSourceSurface> data = first->GetDataSurface();
  DataSourceSurface::ScopedMap map(data, DataSourceSurface::READ);
  ASSERT_TRUE(map.IsMapped());
  for (int y = 0; y < 75; ++y) {
    for (int x = 0; x < 110 * 4; ++x) {
      ASSERT_EQ(map.GetData()[y * map.GetStride() + x], 0x5a);
    }
  }
}

TEST(GPUVideoReadback, DescriptorAvailabilityDoesNotReadBack)
{
  RefPtr manager = new ReadbackTestManager();
  auto image = MakeReadbackImage(manager);
  for (bool threadAvailable : {true, false}) {
    for (bool connected : {true, false}) {
      manager->mThreadAvailable = threadAvailable;
      manager->mConnected = connected;
      EXPECT_EQ(image->CanReadback(), threadAvailable && connected);
      EXPECT_TRUE(image->GetDesc());
    }
  }
  manager->mThreadAvailable = true;
  manager->mConnected = true;
  EXPECT_TRUE(image->CanReadback());
  EXPECT_EQ(uint32_t(manager->mAvailabilityChecks), 5u);
  EXPECT_EQ(uint32_t(manager->mFullReads), 0u);
  EXPECT_EQ(uint32_t(manager->mSizedReads), 0u);
}

TEST(GPUVideoReadback, DescriptorAvailabilityRetainsOriginalManager)
{
  RefPtr oldManager = new ReadbackTestManager();
  auto oldImage = MakeReadbackImage(oldManager);
  EXPECT_TRUE(oldImage->CanReadback());
  oldManager->mConnected = false;
  RefPtr newManager = new ReadbackTestManager();
  auto newImage = MakeReadbackImage(newManager);
  EXPECT_FALSE(oldImage->CanReadback());
  EXPECT_TRUE(newImage->CanReadback());
  EXPECT_EQ(uint32_t(oldManager->mAvailabilityChecks), 2u);
  EXPECT_EQ(uint32_t(newManager->mAvailabilityChecks), 1u);
  EXPECT_EQ(uint32_t(oldManager->mFullReads), 0u);
  EXPECT_EQ(uint32_t(newManager->mFullReads), 0u);
}

TEST(GPUVideoReadback, DifferentSizesAndImagesCannotReuseTheSurface)
{
  RefPtr manager = new ReadbackTestManager();
  auto image = MakeReadbackImage(manager);
  RefPtr<SourceSurface> small = image->GetAsSourceSurface(IntSize(110, 75));
  RefPtr<SourceSurface> other = image->GetAsSourceSurface(IntSize(120, 80));
  RefPtr<SourceSurface> again = image->GetAsSourceSurface(IntSize(110, 75));
  EXPECT_NE(small, other);
  EXPECT_EQ(other->GetSize(), IntSize(120, 80));
  EXPECT_EQ(small, again);
  auto secondImage = MakeReadbackImage(manager, 0x6b);
  RefPtr<SourceSurface> second =
      secondImage->GetAsSourceSurface(IntSize(110, 75));
  EXPECT_NE(small, second);
  RefPtr<DataSourceSurface> data = second->GetDataSurface();
  DataSourceSurface::ScopedMap map(data, DataSourceSurface::READ);
  ASSERT_TRUE(map.IsMapped());
  EXPECT_EQ(map.GetData()[0], 0x6b);
  EXPECT_EQ(uint32_t(manager->mSizedReads), 3u);
}

TEST(GPUVideoReadback, FailureAndWrongSizeDoNotPoisonTheCache)
{
  RefPtr manager = new ReadbackTestManager();
  auto image = MakeReadbackImage(manager);
  manager->mFailNext = true;
  RefPtr<SourceSurface> failed = image->GetAsSourceSurface(IntSize(110, 75));
  EXPECT_FALSE(failed);
  manager->mWrongSize = true;
  RefPtr<SourceSurface> wrong = image->GetAsSourceSurface(IntSize(110, 75));
  EXPECT_EQ(wrong->GetSize(), IntSize(1, 1));
  manager->mWrongSize = false;
  RefPtr<SourceSurface> good = image->GetAsSourceSurface(IntSize(110, 75));
  RefPtr<SourceSurface> again = image->GetAsSourceSurface(IntSize(110, 75));
  EXPECT_EQ(good, again);
  EXPECT_EQ(good->GetSize(), IntSize(110, 75));
  EXPECT_EQ(uint32_t(manager->mSizedReads), 3u);
}

TEST(GPUVideoReadback, FullReadbackDoesNotUseSizedCache)
{
  RefPtr manager = new ReadbackTestManager();
  auto image = MakeReadbackImage(manager);
  RefPtr<SourceSurface> sized = image->GetAsSourceSurface(IntSize(32, 32));
  RefPtr<SourceSurface> first = image->GetAsSourceSurface();
  RefPtr<SourceSurface> second = image->GetAsSourceSurface();
  EXPECT_NE(sized, first);
  EXPECT_NE(first, second);
  EXPECT_EQ(uint32_t(manager->mFullReads), 2u);
  EXPECT_EQ(uint32_t(manager->mSizedReads), 1u);
}

TEST(GPUVideoReadback, EmptySizedRequestsKeepExistingReadbackBehavior)
{
  RefPtr manager = new ReadbackTestManager();
  auto image = MakeReadbackImage(manager);
  RefPtr<SourceSurface> first = image->GetAsSourceSurface(IntSize());
  RefPtr<SourceSurface> second = image->GetAsSourceSurface(IntSize());
  EXPECT_NE(first, second);
  EXPECT_EQ(uint32_t(manager->mSizedReads), 2u);
}

TEST(GPUVideoReadback, CacheIsBoundedByActualStrideTimesHeight)
{
  for (const auto size : {IntSize(512, 512), IntSize(513, 512)}) {
    RefPtr manager = new ReadbackTestManager();
    auto image = MakeReadbackImage(manager);
    RefPtr<SourceSurface> first = image->GetAsSourceSurface(size);
    RefPtr<SourceSurface> second = image->GetAsSourceSurface(size);
    EXPECT_EQ(uint32_t(manager->mSizedReads), size.width == 512 ? 1u : 2u);
  }
  RefPtr manager = new ReadbackTestManager();
  manager->mStride = 16384;
  auto image = MakeReadbackImage(manager);
  RefPtr<SourceSurface> first = image->GetAsSourceSurface(IntSize(110, 75));
  RefPtr<SourceSurface> second = image->GetAsSourceSurface(IntSize(110, 75));
  EXPECT_NE(first, second);
  EXPECT_EQ(uint32_t(manager->mSizedReads), 2u);
}

TEST(GPUVideoReadback, ReadbackDoesNotHoldCacheLock)
{
  RefPtr manager = new ReadbackTestManager();
  auto image = MakeReadbackImage(manager);
  manager->mReenter = image;
  RefPtr<SourceSurface> first = image->GetAsSourceSurface(IntSize(110, 75));
  RefPtr<SourceSurface> next = image->GetAsSourceSurface(IntSize(110, 75));
  EXPECT_TRUE(first);
  EXPECT_TRUE(next);
  EXPECT_EQ(uint32_t(manager->mSizedReads), 2u);
}

TEST(GPUVideoReadback, ConcurrentReadsConvergeWithoutReplacingTheWinner)
{
  RefPtr manager = new ReadbackTestManager();
  auto image = MakeReadbackImage(manager);
  std::vector<std::thread> threads;
  for (int i = 0; i < 4; ++i) {
    threads.emplace_back([image] {
      for (int j = 0; j < 20; ++j) {
        RefPtr<SourceSurface> surface =
            image->GetAsSourceSurface(IntSize(110, 75));
        EXPECT_TRUE(surface);
        EXPECT_EQ(surface->GetSize(), IntSize(110, 75));
      }
    });
  }
  for (auto& thread : threads) {
    thread.join();
  }
  const uint32_t reads = manager->mSizedReads;
  EXPECT_GE(reads, 1u);
  EXPECT_LE(reads, 4u);
  RefPtr<SourceSurface> first = image->GetAsSourceSurface(IntSize(110, 75));
  RefPtr<SourceSurface> second = image->GetAsSourceSurface(IntSize(110, 75));
  EXPECT_EQ(first, second);
  EXPECT_EQ(uint32_t(manager->mSizedReads), reads);
}

TEST(GPUVideoReadback, ImageDestructionReleasesItsCachedSurface)
{
  RefPtr manager = new ReadbackTestManager();
  auto image = MakeReadbackImage(manager);
  RefPtr<SourceSurface> first = image->GetAsSourceSurface(IntSize(110, 75));
  first = nullptr;
  EXPECT_EQ(uint32_t(manager->mDestroyedSurfaces), 0u);
  image = nullptr;
  EXPECT_EQ(uint32_t(manager->mDestroyedSurfaces), 1u);
  EXPECT_EQ(uint32_t(manager->mDeallocations), 1u);
}

TEST(GPUVideoReadback, FullSizeReusesExactFrameBytes)
{
  RefPtr manager = new ReadbackTestManager();
  manager->mFullSize = IntSize(1920, 1080);
  auto image = MakeReadbackImage(manager);
  RefPtr<SourceSurface> first = image->GetAsSourceSurface();
  ASSERT_TRUE(first);
  for (int i = 0; i < 8; ++i) {
    RefPtr<SourceSurface> next = image->GetAsSourceSurface();
    EXPECT_EQ(first, next);
  }
  EXPECT_EQ(uint32_t(manager->mFullReads), 1u);
  RefPtr<DataSourceSurface> data = first->GetDataSurface();
  DataSourceSurface::ScopedMap map(data, DataSourceSurface::READ);
  ASSERT_TRUE(map.IsMapped());
  for (int y = 0; y < 1080; ++y) {
    for (int x = 0; x < 1920 * 4; ++x) {
      ASSERT_EQ(map.GetData()[y * map.GetStride() + x], 0x5a);
    }
  }
}

TEST(GPUVideoReadback, FullSizeDoesNotShareAcrossImagesOrSizedCache)
{
  RefPtr manager = new ReadbackTestManager();
  auto image = MakeReadbackImage(manager, 0x5a, manager->mFullSize);
  auto sameHandle = MakeReadbackImage(manager, 0x5a, manager->mFullSize);
  auto otherHandle = MakeReadbackImage(manager, 0x6b, manager->mFullSize);
  RefPtr<SourceSurface> first = image->GetAsSourceSurface();
  RefPtr<SourceSurface> same = sameHandle->GetAsSourceSurface();
  RefPtr<SourceSurface> other = otherHandle->GetAsSourceSurface();
  RefPtr<SourceSurface> sized = image->GetAsSourceSurface(manager->mFullSize);
  EXPECT_NE(first, same);
  EXPECT_NE(first, other);
  EXPECT_NE(first, sized);
  RefPtr<SourceSurface> repeat = image->GetAsSourceSurface();
  EXPECT_EQ(first, repeat);
  EXPECT_EQ(uint32_t(manager->mFullReads), 3u);
  EXPECT_EQ(uint32_t(manager->mSizedReads), 1u);
  RefPtr<DataSourceSurface> data = other->GetDataSurface();
  DataSourceSurface::ScopedMap map(data, DataSourceSurface::READ);
  ASSERT_TRUE(map.IsMapped());
  EXPECT_EQ(map.GetData()[0], 0x6b);
}

TEST(GPUVideoReadback, FullSizeFailuresAndInvalidSurfacesDoNotPoisonCache)
{
  RefPtr manager = new ReadbackTestManager();
  auto image = MakeReadbackImage(manager, 0x5a, manager->mFullSize);
  manager->mFailNext = true;
  RefPtr<SourceSurface> failed = image->GetAsSourceSurface();
  EXPECT_FALSE(failed);
  manager->mWrongSize = true;
  RefPtr<SourceSurface> wrong = image->GetAsSourceSurface();
  ASSERT_TRUE(wrong);
  EXPECT_EQ(wrong->GetSize(), IntSize(1, 1));
  manager->mWrongSize = false;
  manager->mNonData = true;
  RefPtr<SourceSurface> nonData = image->GetAsSourceSurface();
  ASSERT_TRUE(nonData);
  EXPECT_EQ(nonData->GetType(), SurfaceType::RECORDING);
  manager->mNonData = false;
  RefPtr<SourceSurface> good = image->GetAsSourceSurface();
  RefPtr<SourceSurface> repeat = image->GetAsSourceSurface();
  EXPECT_EQ(good, repeat);
  EXPECT_EQ(uint32_t(manager->mFullReads), 4u);
}

TEST(GPUVideoReadback, FullSizeBudgetIsSharedAndRecoversAfterRelease)
{
  RefPtr manager = new ReadbackTestManager();
  manager->mFullSize = IntSize(2048, 1024);
  auto first = MakeReadbackImage(manager, 1, manager->mFullSize);
  auto second = MakeReadbackImage(manager, 2, manager->mFullSize);
  auto third = MakeReadbackImage(manager, 3, manager->mFullSize);
  for (auto& image : {first, second, third}) {
    RefPtr<SourceSurface> one = image->GetAsSourceSurface();
    RefPtr<SourceSurface> two = image->GetAsSourceSurface();
    EXPECT_EQ(one == two, image != third);
  }
  EXPECT_EQ(uint32_t(manager->mFullReads), 4u);
  first = nullptr;
  RefPtr<SourceSurface> one = third->GetAsSourceSurface();
  RefPtr<SourceSurface> two = third->GetAsSourceSurface();
  EXPECT_EQ(one, two);
  EXPECT_EQ(uint32_t(manager->mFullReads), 5u);
}

TEST(GPUVideoReadback, FullSizeBudgetUsesActualStride)
{
  for (int32_t stride : {16384, 16388}) {
    RefPtr manager = new ReadbackTestManager();
    manager->mFullSize = IntSize(32, 1024);
    manager->mStride = stride;
    auto image = MakeReadbackImage(manager, 0x5a, manager->mFullSize);
    RefPtr<SourceSurface> one = image->GetAsSourceSurface();
    RefPtr<SourceSurface> two = image->GetAsSourceSurface();
    EXPECT_EQ(one == two, stride == 16384);
    EXPECT_EQ(uint32_t(manager->mFullReads), stride == 16384 ? 1u : 2u);
  }
}

TEST(GPUVideoReadback, FullSizeReadbackDoesNotHoldCacheLock)
{
  RefPtr manager = new ReadbackTestManager();
  auto image = MakeReadbackImage(manager, 0x5a, manager->mFullSize);
  manager->mReenter = image;
  RefPtr<SourceSurface> first = image->GetAsSourceSurface();
  RefPtr<SourceSurface> next = image->GetAsSourceSurface();
  EXPECT_TRUE(first);
  EXPECT_TRUE(next);
  EXPECT_EQ(uint32_t(manager->mFullReads), 2u);
}

TEST(GPUVideoReadback, ConcurrentFullSizeReadsConverge)
{
  RefPtr manager = new ReadbackTestManager();
  auto image = MakeReadbackImage(manager, 0x5a, manager->mFullSize);
  std::vector<std::thread> threads;
  for (int i = 0; i < 4; ++i) {
    threads.emplace_back([image] {
      for (int j = 0; j < 20; ++j) {
        RefPtr<SourceSurface> surface = image->GetAsSourceSurface();
        EXPECT_TRUE(surface);
      }
    });
  }
  for (auto& thread : threads) {
    thread.join();
  }
  const uint32_t reads = manager->mFullReads;
  EXPECT_GE(reads, 1u);
  EXPECT_LE(reads, 4u);
  RefPtr<SourceSurface> one = image->GetAsSourceSurface();
  RefPtr<SourceSurface> two = image->GetAsSourceSurface();
  EXPECT_EQ(one, two);
  EXPECT_EQ(uint32_t(manager->mFullReads), reads);

  one = nullptr;
  two = nullptr;
  image = nullptr;
  manager = new ReadbackTestManager();
  manager->mFullSize = IntSize(1024, 1024);
  std::vector<RefPtr<GPUVideoImage>> images;
  std::vector<RefPtr<SourceSurface>> surfaces(8);
  threads.clear();
  for (uint64_t i = 0; i < 8; ++i) {
    images.push_back(MakeReadbackImage(manager, i, manager->mFullSize));
  }
  Atomic<bool> start{false};
  for (size_t i = 0; i < images.size(); ++i) {
    threads.emplace_back([&, i] {
      while (!start) {
        std::this_thread::yield();
      }
      surfaces[i] = images[i]->GetAsSourceSurface();
    });
  }
  start = true;
  for (auto& thread : threads) {
    thread.join();
  }
  uint32_t cached = 0;
  for (size_t i = 0; i < images.size(); ++i) {
    RefPtr<SourceSurface> repeat = images[i]->GetAsSourceSurface();
    ASSERT_TRUE(repeat);
    ASSERT_TRUE(surfaces[i]);
    cached += repeat == surfaces[i];
  }
  EXPECT_EQ(cached, 4u);
  EXPECT_EQ(uint32_t(manager->mFullReads), 12u);
}

TEST(GPUVideoReadback, FullSizeDestructionReleasesSurfaceAndDescriptor)
{
  RefPtr manager = new ReadbackTestManager();
  auto image = MakeReadbackImage(manager, 0x5a, manager->mFullSize);
  RefPtr<SourceSurface> surface = image->GetAsSourceSurface();
  surface = nullptr;
  EXPECT_EQ(uint32_t(manager->mDestroyedSurfaces), 0u);
  image = nullptr;
  EXPECT_EQ(uint32_t(manager->mDestroyedSurfaces), 1u);
  EXPECT_EQ(uint32_t(manager->mDeallocations), 1u);
}

TEST(GPUVideoReadback, FullSizeDelayedMainThreadReleaseRetainsBudget)
{
  RefPtr manager = new ReadbackTestManager();
  manager->mFullSize = IntSize(2048, 2048);
  auto image = MakeReadbackImage(manager, 1, manager->mFullSize);
  {
    RefPtr<SourceSurface> surface = image->GetAsSourceSurface();
  }
  std::thread destroy(
      [image = std::move(image)]() mutable { image = nullptr; });
  destroy.join();
  EXPECT_EQ(uint32_t(manager->mDestroyedSurfaces), 0u);
  auto next = MakeReadbackImage(manager, 2, manager->mFullSize);
  {
    RefPtr<SourceSurface> one = next->GetAsSourceSurface();
    RefPtr<SourceSurface> two = next->GetAsSourceSurface();
    EXPECT_NE(one, two);
  }
  EXPECT_EQ(uint32_t(manager->mFullReads), 3u);
  NS_ProcessPendingEvents(nullptr);
  EXPECT_EQ(uint32_t(manager->mDestroyedSurfaces), 3u);
  RefPtr<SourceSurface> one = next->GetAsSourceSurface();
  RefPtr<SourceSurface> two = next->GetAsSourceSurface();
  EXPECT_EQ(one, two);
  EXPECT_EQ(uint32_t(manager->mFullReads), 4u);
}

TEST(GPUVideoReadback, OtherRemoteTypesKeepUncachedFullReads)
{
  RefPtr manager = new ReadbackTestManager();
  auto image = MakeReadbackImage(manager, 0x5a, manager->mFullSize,
                                 RemoteDecoderVideoType::D3D10);
  RefPtr<SourceSurface> one = image->GetAsSourceSurface();
  RefPtr<SourceSurface> two = image->GetAsSourceSurface();
  EXPECT_NE(one, two);
  EXPECT_EQ(uint32_t(manager->mFullReads), 2u);
}

TEST(GPUVideoReadback, FullCacheRejectsUnavailableManager)
{
  for (bool missingThread : {false, true}) {
    RefPtr manager = new ReadbackTestManager();
    auto warm = MakeReadbackImage(manager, 0x5a, manager->mFullSize);
    RefPtr<SourceSurface> retained = warm->GetAsSourceSurface();
    ASSERT_TRUE(retained);
    EXPECT_EQ(uint32_t(manager->mAvailabilityChecks), 0u);
    manager->mThreadAvailable = !missingThread;
    manager->mConnected = missingThread;
    auto cold = MakeReadbackImage(manager, 0x6b, manager->mFullSize);
    RefPtr<SourceSurface> coldResult = cold->GetAsSourceSurface();
    EXPECT_FALSE(coldResult);
    RefPtr<SourceSurface> warmResult = warm->GetAsSourceSurface();
    EXPECT_FALSE(warmResult);
    EXPECT_EQ(uint32_t(manager->mAvailabilityChecks), 1u);
    EXPECT_EQ(uint32_t(manager->mFullReads), 2u);
    RefPtr<DataSourceSurface> data = retained->GetDataSurface();
    DataSourceSurface::ScopedMap map(data, DataSourceSurface::READ);
    ASSERT_TRUE(map.IsMapped());
    EXPECT_EQ(map.GetData()[0], 0x5a);
  }
}

TEST(GPUVideoReadback, SizedCacheRejectsUnavailableManager)
{
  for (bool missingThread : {false, true}) {
    RefPtr manager = new ReadbackTestManager();
    auto warm = MakeReadbackImage(manager, 0x5a, manager->mFullSize);
    RefPtr<SourceSurface> retained =
        warm->GetAsSourceSurface(manager->mFullSize);
    ASSERT_TRUE(retained);
    EXPECT_EQ(uint32_t(manager->mAvailabilityChecks), 0u);
    manager->mThreadAvailable = !missingThread;
    manager->mConnected = missingThread;
    auto cold = MakeReadbackImage(manager, 0x6b, manager->mFullSize);
    RefPtr<SourceSurface> coldResult =
        cold->GetAsSourceSurface(manager->mFullSize);
    EXPECT_FALSE(coldResult);
    RefPtr<SourceSurface> warmResult =
        warm->GetAsSourceSurface(manager->mFullSize);
    EXPECT_FALSE(warmResult);
    EXPECT_EQ(uint32_t(manager->mAvailabilityChecks), 1u);
    EXPECT_EQ(uint32_t(manager->mSizedReads), 2u);
    RefPtr<DataSourceSurface> data = retained->GetDataSurface();
    DataSourceSurface::ScopedMap map(data, DataSourceSurface::READ);
    ASSERT_TRUE(map.IsMapped());
    EXPECT_EQ(map.GetData()[0], 0x5a);
  }
}

TEST(GPUVideoReadback, ReplacementManagerCannotReviveOldCache)
{
  RefPtr oldManager = new ReadbackTestManager();
  auto oldImage = MakeReadbackImage(oldManager, 0x5a, oldManager->mFullSize);
  RefPtr<SourceSurface> oldFull = oldImage->GetAsSourceSurface();
  RefPtr<SourceSurface> oldSized =
      oldImage->GetAsSourceSurface(oldManager->mFullSize);
  ASSERT_TRUE(oldFull);
  ASSERT_TRUE(oldSized);
  oldManager->mConnected = false;
  RefPtr newManager = new ReadbackTestManager();
  auto newImage = MakeReadbackImage(newManager, 0x5a, newManager->mFullSize);
  RefPtr<SourceSurface> newFull = newImage->GetAsSourceSurface();
  RefPtr<SourceSurface> newSized =
      newImage->GetAsSourceSurface(newManager->mFullSize);
  ASSERT_TRUE(newFull);
  ASSERT_TRUE(newSized);
  EXPECT_NE(oldFull, newFull);
  EXPECT_NE(oldSized, newSized);
  RefPtr<SourceSurface> staleFull = oldImage->GetAsSourceSurface();
  RefPtr<SourceSurface> staleSized =
      oldImage->GetAsSourceSurface(oldManager->mFullSize);
  EXPECT_FALSE(staleFull);
  EXPECT_FALSE(staleSized);
  RefPtr<SourceSurface> repeatFull = newImage->GetAsSourceSurface();
  RefPtr<SourceSurface> repeatSized =
      newImage->GetAsSourceSurface(newManager->mFullSize);
  EXPECT_EQ(newFull, repeatFull);
  EXPECT_EQ(newSized, repeatSized);
  EXPECT_EQ(uint32_t(oldManager->mAvailabilityChecks), 2u);
  EXPECT_EQ(uint32_t(newManager->mAvailabilityChecks), 2u);
}

TEST(GPUVideoReadback, ConcurrentCacheHitsRespectDisconnection)
{
  RefPtr manager = new ReadbackTestManager();
  auto image = MakeReadbackImage(manager, 0x5a, manager->mFullSize);
  RefPtr<SourceSurface> full = image->GetAsSourceSurface();
  RefPtr<SourceSurface> sized = image->GetAsSourceSurface(manager->mFullSize);
  ASSERT_TRUE(full);
  ASSERT_TRUE(sized);
  manager->mConnected = false;
  Atomic<uint32_t> unexpectedSurfaces{0};
  std::vector<std::thread> threads;
  for (int i = 0; i < 4; ++i) {
    threads.emplace_back([&] {
      for (int j = 0; j < 8; ++j) {
        RefPtr<SourceSurface> a = image->GetAsSourceSurface();
        RefPtr<SourceSurface> b = image->GetAsSourceSurface(manager->mFullSize);
        unexpectedSurfaces += uint32_t(bool(a)) + uint32_t(bool(b));
      }
    });
  }
  for (auto& thread : threads) {
    thread.join();
  }
  EXPECT_EQ(uint32_t(unexpectedSurfaces), 0u);
  EXPECT_EQ(uint32_t(manager->mAvailabilityChecks), 64u);
  EXPECT_EQ(uint32_t(manager->mFullReads), 1u);
  EXPECT_EQ(uint32_t(manager->mSizedReads), 1u);
}

TEST(GPUVideoReadback, AvailabilityCheckDoesNotHoldCacheLock)
{
  for (bool sized : {false, true}) {
    RefPtr manager = new ReadbackTestManager();
    auto image = MakeReadbackImage(manager, 0x5a, manager->mFullSize);
    RefPtr<SourceSurface> first =
        sized ? image->GetAsSourceSurface(manager->mFullSize)
              : image->GetAsSourceSurface();
    ASSERT_TRUE(first);
    manager->mAvailabilitySized = sized;
    manager->mAvailabilityReenter = image;
    RefPtr<SourceSurface> second =
        sized ? image->GetAsSourceSurface(manager->mFullSize)
              : image->GetAsSourceSurface();
    EXPECT_EQ(first, second);
    EXPECT_EQ(manager->mAvailabilityReenter, nullptr);
    EXPECT_EQ(uint32_t(manager->mAvailabilityChecks), 2u);
    EXPECT_EQ(uint32_t(manager->mFullReads), sized ? 0u : 1u);
    EXPECT_EQ(uint32_t(manager->mSizedReads), sized ? 1u : 0u);
  }
}

class ReadbackManagerReady final {
 public:
  NS_INLINE_DECL_THREADSAFE_REFCOUNTING(ReadbackManagerReady)
  RefPtr<RemoteMediaManagerChild> mManager;
  bool mReady = false;

 private:
  ~ReadbackManagerReady() = default;
};

TEST(GPUVideoReadback, RealManagerRejectsKnownChannelFailure)
{
  ASSERT_TRUE(NS_IsMainThread());
  ASSERT_FALSE(RemoteMediaManagerChild::GetManagerThread());
  ipc::Endpoint<PRemoteMediaManagerParent> peer;
  ipc::Endpoint<PRemoteMediaManagerChild> endpoint;
  ASSERT_TRUE(NS_SUCCEEDED(PRemoteMediaManager::CreateEndpoints(
      ipc::EndpointProcInfo::Current(), ipc::EndpointProcInfo::Current(), &peer,
      &endpoint)));
  RemoteMediaManagerChild::InitForGPUProcess(std::move(endpoint));
  auto shutdown = MakeScopeExit([] { RemoteMediaManagerChild::Shutdown(); });
  nsCOMPtr<nsISerialEventTarget> thread =
      RemoteMediaManagerChild::GetManagerThread();
  ASSERT_TRUE(thread);
  RefPtr ready = new ReadbackManagerReady();
  ASSERT_TRUE(NS_SUCCEEDED(thread->Dispatch(
      NS_NewRunnableFunction("GPUVideoReadback::ManagerReady", [ready] {
        RefPtr<RemoteMediaManagerChild> manager =
            RemoteMediaManagerChild::GetSingleton(RemoteMediaIn::GpuProcess);
        EXPECT_TRUE(NS_SUCCEEDED(NS_DispatchToMainThread(NS_NewRunnableFunction(
            "GPUVideoReadback::ManagerReadyOnMain", [ready, manager] {
              ready->mManager = manager;
              ready->mReady = true;
            }))));
      }))));
  ASSERT_TRUE(SpinEventLoopUntil("GPUVideoReadback::ManagerReady"_ns,
                                 [&] { return ready->mReady; }));
  RefPtr manager = ready->mManager;
  ASSERT_TRUE(manager);
  EXPECT_TRUE(manager->CanReadback());
  RefPtr<Runnable> fail =
      NS_NewRunnableFunction("GPUVideoReadback::ChannelFailure", [&] {
        EXPECT_TRUE(manager->CanReadback());
        ASSERT_TRUE(manager->CanSend());
        ASSERT_TRUE(manager->GetIPCChannel()->CanSend());
        manager->GetIPCChannel()->InduceConnectionError();
        ASSERT_TRUE(manager->CanSend());
        ASSERT_FALSE(manager->GetIPCChannel()->CanSend());
        EXPECT_FALSE(manager->CanReadback());
        SurfaceDescriptorGPUVideo descriptor(SurfaceDescriptorRemoteDecoder(
            1, RemoteDecoderVideoType::DMABuf, Nothing(),
            SurfaceDescriptorRemoteDecoderId{1}));
        RefPtr<SourceSurface> cold = manager->Readback(descriptor);
        EXPECT_FALSE(cold);
      });
  ASSERT_TRUE(NS_SUCCEEDED(SyncRunnable::DispatchToThread(thread, fail)));
  EXPECT_FALSE(manager->CanReadback());
  RefPtr<Runnable> closed =
      NS_NewRunnableFunction("GPUVideoReadback::ActorClosed", [&] {
        EXPECT_FALSE(manager->CanSend());
        EXPECT_FALSE(manager->CanReadback());
      });
  ASSERT_TRUE(NS_SUCCEEDED(SyncRunnable::DispatchToThread(thread, closed)));
  RemoteMediaManagerChild::Shutdown();
  shutdown.release();
  EXPECT_FALSE(RemoteMediaManagerChild::GetManagerThread());
  EXPECT_FALSE(manager->CanReadback());
}

}  // namespace
}  // namespace mozilla::layers
