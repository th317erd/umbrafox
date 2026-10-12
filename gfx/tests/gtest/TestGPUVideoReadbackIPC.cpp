/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#include <cstdio>
#include <thread>

#include "GPUVideoImage.h"
#include "gtest/gtest.h"
#include "mozilla/ScopeExit.h"
#include "mozilla/SpinEventLoopUntil.h"
#include "mozilla/_ipdltest/IPDLUnitTest.h"
#include "mozilla/_ipdltest/PTestShmemChild.h"
#include "mozilla/_ipdltest/PTestShmemParent.h"
#include "mozilla/gfx/2D.h"
#include "nsThreadUtils.h"

namespace mozilla::_ipdltest {

using namespace gfx;
using namespace ipc;
using layers::GPUVideoReadbackCache;

static constexpr IntSize kReadbackSize(2048, 2048);
static constexpr size_t kReadbackBytes = 16 * 1024 * 1024;

static bool ReadbackBytesMatch(DataSourceSurface* aSurface) {
  DataSourceSurface::ScopedMap map(aSurface, DataSourceSurface::READ);
  if (!map.IsMapped() || map.GetStride() != kReadbackSize.width * 4) {
    return false;
  }
  for (size_t i = 0; i < kReadbackBytes; ++i) {
    if (map.GetData()[i] != uint8_t(i * 13 + 7)) {
      return false;
    }
  }
  return true;
}

class TestGPUVideoReadbackIPCParent;

struct ReadbackMapping {
  Shmem mMemory;
  RefPtr<TestGPUVideoReadbackIPCParent> mAllocator;
  ~ReadbackMapping();
};

class TestGPUVideoReadbackIPCParent final : public PTestShmemParent {
  NS_INLINE_DECL_REFCOUNTING(TestGPUVideoReadbackIPCParent, override)

 public:
  IPCResult RecvTake(Shmem&& aMemory, Shmem&& aUnsafe,
                     const uint32_t& aExpectedSize) override {
    if (mReceived || aExpectedSize != kReadbackBytes ||
        aMemory.Size<uint8_t>() != kReadbackBytes ||
        aUnsafe.Size<uint8_t>() != kReadbackBytes) {
      ADD_FAILURE() << "Invalid readback transport receipt";
      return IPC_FAIL(this, "Invalid readback transport receipt");
    }
    mReceived = true;
    EXPECT_TRUE(DeallocShmem(aUnsafe));
    RefPtr<DataSourceSurface> surface =
        Factory::CreateWrappingDataSourceSurface(
            aMemory.get<uint8_t>(), kReadbackSize.width * 4, kReadbackSize,
            SurfaceFormat::B8G8R8A8);
    if (!surface) {
      ADD_FAILURE() << "Cannot wrap transported readback";
      return IPC_FAIL(this, "Cannot wrap transported readback");
    }
    static UserDataKey key;
    surface->AddUserData(
        &key, new ReadbackMapping{aMemory, this},
        [](void* aData) { delete static_cast<ReadbackMapping*>(aData); });
    EXPECT_TRUE(ReadbackBytesMatch(surface));
    aMemory.get<uint8_t>()[kReadbackBytes / 2] ^= 1;
    EXPECT_FALSE(ReadbackBytesMatch(surface));
    aMemory.get<uint8_t>()[kReadbackBytes / 2] ^= 1;
    EXPECT_TRUE(ReadbackBytesMatch(surface));
    mCache->Set(surface);
    surface = nullptr;
    if (mAbnormal) {
      GetIPCChannel()->InduceConnectionError();
    } else {
      Close();
    }
    return IPC_OK();
  }

  void ActorDestroy(ActorDestroyReason aReason) override {
    EXPECT_EQ(aReason, mAbnormal ? AbnormalShutdown : NormalShutdown);
    EXPECT_FALSE(CanSend());
    // Observe after OnChannelClose/Error has also cleared its Shmem table.
    EXPECT_TRUE(NS_SUCCEEDED(NS_DispatchToCurrentThread(NS_NewRunnableFunction(
        "TestGPUVideoReadbackIPC::Closed",
        [self = RefPtr{this}] { self->mClosed = true; }))));
  }

  void ReleaseMapping(Shmem& aMemory) {
    ++mReleased;
    if (CanSend()) {
      ++mDeallocationAttempts;
      EXPECT_TRUE(DeallocShmem(aMemory));
    }
  }

  void Run(bool aAbnormal) {
    auto close = MakeScopeExit([&] {
      if (CanSend()) {
        Close();
      }
    });
    mAbnormal = aAbnormal;
    auto cache = MakeUnique<GPUVideoReadbackCache>();
    mCache = cache.get();
    Shmem memory;
    Shmem unsafe;
    ASSERT_TRUE(AllocShmem(kReadbackBytes, &memory));
    ASSERT_TRUE(AllocUnsafeShmem(kReadbackBytes, &unsafe));
    std::printf("ReadbackIPC peer=%d owner=%d\n", int(OtherPidMaybeInvalid()),
                int(base::GetCurrentProcId()));
    ASSERT_TRUE(SendGive(std::move(memory), std::move(unsafe), kReadbackBytes));
    ASSERT_TRUE(SpinEventLoopUntil("TestGPUVideoReadbackIPC::Teardown"_ns,
                                   [&] { return mClosed; }));
    ASSERT_TRUE(mReceived);
    ASSERT_FALSE(CanSend());
    {
      RefPtr<DataSourceSurface> retained = cache->Get();
      ASSERT_TRUE(retained);
      EXPECT_TRUE(ReadbackBytesMatch(retained));
    }
    EXPECT_EQ(mReleased, 0u);
    RefPtr<DataSourceSurface> competitor = Factory::CreateDataSourceSurface(
        kReadbackSize, SurfaceFormat::B8G8R8A8);
    ASSERT_TRUE(competitor);
    GPUVideoReadbackCache competingCache;
    competingCache.Set(competitor);
    RefPtr<DataSourceSurface> blocked = competingCache.Get();
    EXPECT_FALSE(blocked);
    mCache = nullptr;
    std::thread worker(
        [owned = std::move(cache)]() mutable { owned = nullptr; });
    worker.join();
    EXPECT_EQ(mReleased, 0u);
    competingCache.Set(competitor);
    blocked = competingCache.Get();
    EXPECT_FALSE(blocked);
    NS_ProcessPendingEvents(nullptr);
    EXPECT_EQ(mReleased, 1u);
    EXPECT_EQ(mDeallocationAttempts, 0u);
    competingCache.Set(competitor);
    RefPtr<DataSourceSurface> admitted = competingCache.Get();
    EXPECT_EQ(admitted, competitor);
  }

 private:
  ~TestGPUVideoReadbackIPCParent() = default;

  // Borrowed only while Run owns the cache and waits for transport teardown.
  GPUVideoReadbackCache* mCache = nullptr;
  bool mAbnormal = false;
  bool mReceived = false;
  bool mClosed = false;
  uint32_t mReleased = 0;
  uint32_t mDeallocationAttempts = 0;
};

ReadbackMapping::~ReadbackMapping() { mAllocator->ReleaseMapping(mMemory); }

class TestGPUVideoReadbackIPCChild final : public PTestShmemChild {
  NS_INLINE_DECL_REFCOUNTING(TestGPUVideoReadbackIPCChild, override)

 public:
  IPCResult RecvGive(Shmem&& aMemory, Shmem&& aUnsafe,
                     const uint32_t& aExpectedSize) override {
    if (aMemory.Size<uint8_t>() != kReadbackBytes ||
        aUnsafe.Size<uint8_t>() != kReadbackBytes ||
        aExpectedSize != kReadbackBytes) {
      ADD_FAILURE() << "Invalid allocated readback sizes";
      return IPC_FAIL(this, "Invalid allocated readback sizes");
    }
    for (size_t i = 0; i < kReadbackBytes; ++i) {
      aMemory.get<uint8_t>()[i] = uint8_t(i * 13 + 7);
    }
    EXPECT_TRUE(
        SendTake(std::move(aMemory), std::move(aUnsafe), aExpectedSize));
    return IPC_OK();
  }

 private:
  ~TestGPUVideoReadbackIPCChild() = default;
};

IPDL_TEST(TestGPUVideoReadbackIPC, Normal) { mActor->Run(false); }

IPDL_TEST(TestGPUVideoReadbackIPC, Abnormal) { mActor->Run(true); }

}  // namespace mozilla::_ipdltest
