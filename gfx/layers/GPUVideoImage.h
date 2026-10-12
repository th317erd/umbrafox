/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#ifndef GFX_GPU_VIDEO_IMAGE_H
#define GFX_GPU_VIDEO_IMAGE_H

#include "ImageContainer.h"
#include "mozilla/Atomics.h"
#include "mozilla/DataMutex.h"
#include "mozilla/RefPtr.h"
#include "mozilla/layers/CompositableClient.h"
#include "mozilla/layers/GPUVideoTextureClient.h"
#include "mozilla/layers/ImageBridgeChild.h"

namespace mozilla {
namespace gl {
class GLBlitHelper;
}
namespace layers {

class IGPUVideoSurfaceManager {
 protected:
  virtual ~IGPUVideoSurfaceManager() = default;

 public:
  NS_INLINE_DECL_PURE_VIRTUAL_REFCOUNTING

  virtual bool CanReadback() = 0;

  virtual already_AddRefed<gfx::SourceSurface> Readback(
      const SurfaceDescriptorGPUVideo& aSD) = 0;
  virtual already_AddRefed<gfx::SourceSurface> Readback(
      const SurfaceDescriptorGPUVideo& aSD,
      const gfx::IntSize& aReadbackSize) = 0;
  virtual already_AddRefed<Image> TransferToImage(
      const SurfaceDescriptorGPUVideo& aSD, const gfx::IntSize& aSize,
      const gfx::ColorDepth& aColorDepth, gfx::YUVColorSpace aYUVColorSpace,
      gfx::ColorSpace2 aColorPrimaries, gfx::TransferFunction aTransferFunction,
      gfx::ColorRange aColorRange) = 0;
  virtual void DeallocateSurfaceDescriptor(
      const SurfaceDescriptorGPUVideo& aSD) = 0;
  virtual void OnSetCurrent(const SurfaceDescriptorGPUVideo& aSD) = 0;
};

class GPUVideoReadbackCache final {
  static constexpr size_t kMaxBytes = 16 * 1024 * 1024;
  inline static Atomic<size_t, Relaxed> sBytes{0};

  class Entry final {
   public:
    NS_INLINE_DECL_THREADSAFE_REFCOUNTING(Entry)

    Entry(gfx::DataSourceSurface* aSurface, size_t aBytes)
        : mSurface(aSurface), mBytes(aBytes) {}

    RefPtr<gfx::DataSourceSurface> mSurface;

   private:
    ~Entry() {
      mSurface = nullptr;
      sBytes -= mBytes;
    }
    const size_t mBytes;
  };

 public:
  GPUVideoReadbackCache() : mEntry("layers::GPUVideoReadbackCache") {}

  ~GPUVideoReadbackCache() {
    RefPtr<Entry> entry;
    {
      auto guard = mEntry.Lock();
      entry = guard->forget();
    }
    // Keep the reservation until the cached reference is released, even if
    // image destruction has to dispatch that release to the main thread.
    NS_ReleaseOnMainThread("layers::GPUVideoReadbackCache", entry.forget());
  }

  already_AddRefed<gfx::DataSourceSurface> Get() {
    auto guard = mEntry.Lock();
    RefPtr<gfx::DataSourceSurface> surface =
        *guard ? (*guard)->mSurface : nullptr;
    return surface.forget();
  }

  void Set(gfx::DataSourceSurface* aSurface) {
    const auto size = aSurface->GetSize();
    if (size.IsEmpty() || aSurface->Stride() <= 0) {
      return;
    }
    const uint64_t bytes = uint64_t(aSurface->Stride()) * size.height;
    if (bytes > kMaxBytes) {
      return;
    }
    auto guard = mEntry.Lock();
    if (*guard) {
      return;
    }
    size_t used;
    do {
      used = sBytes;
      if (bytes > kMaxBytes - used) {
        return;
      }
    } while (!sBytes.compareExchange(used, used + size_t(bytes)));
    *guard = MakeRefPtr<Entry>(aSurface, size_t(bytes));
  }

 private:
  DataMutex<RefPtr<Entry>> mEntry;
};

// Represents an animated Image that is known to the GPU process.
class GPUVideoImage final : public Image {
  friend class gl::GLBlitHelper;

 public:
  GPUVideoImage(IGPUVideoSurfaceManager* aManager,
                const SurfaceDescriptorGPUVideo& aSD, const gfx::IntSize& aSize,
                const gfx::ColorDepth& aColorDepth,
                gfx::YUVColorSpace aYUVColorSpace,
                gfx::ColorSpace2 aColorPrimaries,
                gfx::TransferFunction aTransferFunction,
                gfx::ColorRange aColorRange)
      : Image(nullptr, ImageFormat::GPU_VIDEO),
        mSize(aSize),
        mColorDepth(aColorDepth),
        mColorSpace(aColorPrimaries),
        mYUVColorSpace(aYUVColorSpace),
        mManager(aManager),
        mSD(aSD),
        mTransferFunction(aTransferFunction),
        mColorRange(aColorRange) {
    // Create the TextureClient immediately since the GPUVideoTextureData
    // is responsible for deallocating the SurfaceDescriptor.
    //
    // Use the RECYCLE texture flag, since it's likely that our 'real'
    // TextureData (in the decoder thread of the GPU process) is using
    // it too, and we want to make sure we don't send the delete message
    // until we've stopped being used on the compositor.
    mTextureClient = TextureClient::CreateWithData(
        new GPUVideoTextureData(aManager, aSD, aSize), TextureFlags::RECYCLE,
        ImageBridgeChild::GetSingleton().get());
  }

  virtual ~GPUVideoImage() = default;

  GPUVideoImage* AsGPUVideoImage() override { return this; }

  gfx::IntSize GetSize() const override { return mSize; }

  gfx::ColorDepth GetColorDepth() const override { return mColorDepth; }
  gfx::ColorSpace2 GetColorPrimaries() const { return mColorSpace; }
  gfx::YUVColorSpace GetYUVColorSpace() const { return mYUVColorSpace; }
  gfx::TransferFunction GetTransferFunction() const {
    return mTransferFunction;
  }
  gfx::ColorRange GetColorRange() const { return mColorRange; }

  Maybe<SurfaceDescriptor> GetDesc() override {
    return Some(SurfaceDescriptor(mSD));
  }

  const SurfaceDescriptorGPUVideo& SD() const { return mSD; }

  void OnSetCurrent() override {
    if (NS_WARN_IF(!mManager)) {
      return;
    }
    mManager->OnSetCurrent(mSD);
  }

  bool CanReadback() { return mManager && mManager->CanReadback(); }

  already_AddRefed<gfx::SourceSurface> GetAsSourceSurface() override {
    if (!mManager) {
      return nullptr;
    }
    if (GetRemoteDecoderVideoType() != RemoteDecoderVideoType::DMABuf) {
      return mManager->Readback(mSD);
    }
    RefPtr<gfx::DataSourceSurface> cached = mFullReadback.Get();
    if (cached) {
      if (!mManager->CanReadback()) {
        return nullptr;
      }
      return cached.forget();
    }
    RefPtr<gfx::SourceSurface> surface = mManager->Readback(mSD);
    if (surface && surface->GetSize() == mSize &&
        surface->GetType() == gfx::SurfaceType::DATA) {
      RefPtr<gfx::DataSourceSurface> data = surface->GetDataSurface();
      if (data && data->GetSize() == mSize) {
        mFullReadback.Set(data);
      }
    }
    return surface.forget();
  }

  already_AddRefed<gfx::SourceSurface> GetAsSourceSurface(
      const gfx::IntSize& aReadbackSize) {
    if (!mManager) {
      return nullptr;
    }
    RefPtr<gfx::DataSourceSurface> cached = mSizedReadback.Get();
    if (cached && cached->GetSize() == aReadbackSize) {
      if (!mManager->CanReadback()) {
        return nullptr;
      }
      return cached.forget();
    }

    RefPtr<gfx::SourceSurface> surface = mManager->Readback(mSD, aReadbackSize);
    if (!cached && surface && !aReadbackSize.IsEmpty() &&
        surface->GetSize() == aReadbackSize &&
        surface->GetType() == gfx::SurfaceType::DATA) {
      // Retain one small CPU readback of this immutable image, without copying.
      RefPtr<gfx::DataSourceSurface> data = surface->GetDataSurface();
      if (data && data->Stride() > 0 &&
          uint64_t(data->Stride()) * aReadbackSize.height <= 1024 * 1024) {
        mSizedReadback.Set(data);
      }
    }
    return surface.forget();
  }

  RemoteDecoderVideoType GetRemoteDecoderVideoType() const {
    return mSD.get_SurfaceDescriptorRemoteDecoder().videoType();
  }

  TextureClient* GetTextureClient(KnowsCompositor* aKnowsCompositor) override {
    MOZ_ASSERT(aKnowsCompositor == ImageBridgeChild::GetSingleton(),
               "Must only use GPUVideo on ImageBridge");
    return mTextureClient;
  }

 private:
  gfx::IntSize mSize;
  gfx::ColorDepth mColorDepth;
  gfx::ColorSpace2 mColorSpace;
  gfx::YUVColorSpace mYUVColorSpace;
  RefPtr<IGPUVideoSurfaceManager> mManager;
  SurfaceDescriptorGPUVideo mSD;
  RefPtr<TextureClient> mTextureClient;
  gfx::TransferFunction mTransferFunction;
  gfx::ColorRange mColorRange;
  CachedSurface mSizedReadback;
  GPUVideoReadbackCache mFullReadback;
};

}  // namespace layers
}  // namespace mozilla

#endif  // GFX_GPU_VIDEO_IMAGE_H
