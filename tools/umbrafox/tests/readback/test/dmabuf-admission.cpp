/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#include <cassert>
#include <optional>

template <typename T>
using Maybe = std::optional<T>;
template <typename T>
Maybe<T> Some(const T& aValue) {
  return aValue;
}
std::nullopt_t Nothing() { return std::nullopt; }

namespace layers {
enum class RemoteDecoderVideoType {
  Buffer,
  MacIOSurface,
  D3D10,
  DMABuf,
  Other
};
struct SurfaceDescriptorRemoteDecoder {
  RemoteDecoderVideoType mType;
  RemoteDecoderVideoType videoType() const { return mType; }
};
struct SurfaceDescriptorGPUVideo {
  enum Type { TSurfaceDescriptorRemoteDecoder, Other };
  Type mType;
  SurfaceDescriptorRemoteDecoder mRemote;
  Type type() const { return mType; }
  const SurfaceDescriptorRemoteDecoder& get_SurfaceDescriptorRemoteDecoder()
      const {
    assert(mType == TSurfaceDescriptorRemoteDecoder);
    return mRemote;
  }
};
struct SurfaceDescriptor {
  enum Type { TSurfaceDescriptorGPUVideo, Other };
  Type mType;
  SurfaceDescriptorGPUVideo mVideo;
  Type type() const { return mType; }
  const SurfaceDescriptorGPUVideo& get_SurfaceDescriptorGPUVideo() const {
    assert(mType == TSurfaceDescriptorGPUVideo);
    return mVideo;
  }
};
struct ReadbackManager {
  bool mAvailable = true;
  unsigned mAvailabilityChecks = 0;
  bool CanReadback() {
    ++mAvailabilityChecks;
    return mAvailable;
  }
};
struct GPUVideoImage {
  ReadbackManager* mManager;
#include "availability-region.h"
};
}  // namespace layers

struct StaticPrefs {
  static inline bool sFastPath = false;
  static inline bool sDMABuf = false;
  static inline bool sD3D = false;
  static bool gfx_canvas_remote_use_draw_image_fast_path() { return sFastPath; }
  static bool gfx_canvas_remote_use_draw_image_fast_path_dmabuf() {
    return sDMABuf;
  }
  static bool gfx_canvas_remote_use_draw_image_fast_path_d3d() { return sD3D; }
};

struct Image {
  Maybe<layers::SurfaceDescriptor> mDescriptor;
  layers::GPUVideoImage* mGPUImage = nullptr;
  mutable unsigned mReads = 0;
  Maybe<layers::SurfaceDescriptor> GetDesc() const {
    ++mReads;
    return mDescriptor;
  }
  layers::GPUVideoImage* AsGPUVideoImage() const { return mGPUImage; }
};
struct SurfaceFromElementResult {
  Image* mLayersImage = nullptr;
};

#include "admission-region.h"

int main() {
  using namespace layers;
  bool gtk = false;
  bool windows = false;
  bool mac = false;
#ifdef MOZ_WIDGET_GTK
  gtk = true;
#endif
#ifdef XP_WIN
  windows = true;
#endif
#ifdef XP_MACOSX
  mac = true;
#endif
  for (const bool enabled : {false, true}) {
    StaticPrefs::sDMABuf = enabled;
    StaticPrefs::sD3D = enabled;
    for (const auto kind :
         {RemoteDecoderVideoType::Buffer, RemoteDecoderVideoType::MacIOSurface,
          RemoteDecoderVideoType::D3D10, RemoteDecoderVideoType::DMABuf,
          RemoteDecoderVideoType::Other}) {
      SurfaceDescriptor descriptor{
          SurfaceDescriptor::TSurfaceDescriptorGPUVideo,
          {SurfaceDescriptorGPUVideo::TSurfaceDescriptorRemoteDecoder, {kind}}};
      const bool expected =
          kind == RemoteDecoderVideoType::Buffer ||
          (kind == RemoteDecoderVideoType::MacIOSurface && mac) ||
          (kind == RemoteDecoderVideoType::D3D10 && windows && enabled) ||
          (kind == RemoteDecoderVideoType::DMABuf && gtk && enabled);
      Maybe<SurfaceDescriptor> result;
      assert(ValidSurfaceDescriptorForRemoteCanvas2d(descriptor, &result) ==
             expected);
      assert(result.has_value() == expected);
      assert(ValidSurfaceDescriptorForRemoteCanvas2d(descriptor, nullptr) ==
             expected);
      if (result) {
        assert(result->mVideo.mRemote.mType == kind);
      }
      ReadbackManager manager;
      GPUVideoImage gpuImage{&manager};
      Image image{descriptor, &gpuImage};
      SurfaceFromElementResult surface{&image};
      StaticPrefs::sFastPath = false;
      assert(!MaybeGetSurfaceDescriptorForRemoteCanvas(surface, Nothing()));
      assert(!MaybeGetSurfaceDescriptorForRemoteCanvas(surface, Some(kind)));
      assert(image.mReads == 0);
      StaticPrefs::sFastPath = true;
      assert(MaybeGetSurfaceDescriptorForRemoteCanvas(surface, Nothing())
                 .has_value() == expected);
      assert(MaybeGetSurfaceDescriptorForRemoteCanvas(surface, Some(kind))
                 .has_value() == expected);
      assert(MaybeGetSurfaceDescriptorForRemoteCanvas(
                 surface, Some(RemoteDecoderVideoType::DMABuf))
                 .has_value() ==
             (expected && kind == RemoteDecoderVideoType::DMABuf));
      assert(image.mReads == 3);
      const auto accepted =
          MaybeGetSurfaceDescriptorForRemoteCanvas(surface, Nothing());
      if (accepted) {
        assert(accepted->mVideo.mRemote.mType == kind);
      }
      const bool needsAvailability =
          expected && kind == RemoteDecoderVideoType::DMABuf;
      manager.mAvailable = false;
      assert(MaybeGetSurfaceDescriptorForRemoteCanvas(surface, Nothing())
                 .has_value() == (expected && !needsAvailability));
      assert(manager.mAvailabilityChecks == (needsAvailability ? 5u : 0u));
      const unsigned checks = manager.mAvailabilityChecks;
      const auto differentType = kind == RemoteDecoderVideoType::Buffer
                                     ? RemoteDecoderVideoType::DMABuf
                                     : RemoteDecoderVideoType::Buffer;
      assert(!MaybeGetSurfaceDescriptorForRemoteCanvas(surface,
                                                       Some(differentType)));
      assert(manager.mAvailabilityChecks == checks);
      image.mGPUImage = nullptr;
      assert(MaybeGetSurfaceDescriptorForRemoteCanvas(surface, Nothing())
                 .has_value() == (expected && !needsAvailability));
      assert(manager.mAvailabilityChecks == checks);
      image.mGPUImage = &gpuImage;
      gpuImage.mManager = nullptr;
      assert(MaybeGetSurfaceDescriptorForRemoteCanvas(surface, Nothing())
                 .has_value() == (expected && !needsAvailability));
      assert(manager.mAvailabilityChecks == checks);
      gpuImage.mManager = &manager;
      manager.mAvailable = true;
      assert(MaybeGetSurfaceDescriptorForRemoteCanvas(surface, Nothing())
                 .has_value() == expected);
      assert(manager.mAvailabilityChecks ==
             checks + (needsAvailability ? 1u : 0u));
      const unsigned finalChecks = manager.mAvailabilityChecks;
      result = descriptor;
      descriptor.mType = SurfaceDescriptor::Other;
      assert(!ValidSurfaceDescriptorForRemoteCanvas2d(descriptor, &result));
      assert(result->mType == SurfaceDescriptor::TSurfaceDescriptorGPUVideo);
      image.mDescriptor = descriptor;
      assert(!MaybeGetSurfaceDescriptorForRemoteCanvas(surface, Some(kind)));
      descriptor.mType = SurfaceDescriptor::TSurfaceDescriptorGPUVideo;
      descriptor.mVideo.mType = SurfaceDescriptorGPUVideo::Other;
      assert(!ValidSurfaceDescriptorForRemoteCanvas2d(descriptor, &result));
      assert(result->mVideo.mType ==
             SurfaceDescriptorGPUVideo::TSurfaceDescriptorRemoteDecoder);
      image.mDescriptor = descriptor;
      assert(!MaybeGetSurfaceDescriptorForRemoteCanvas(surface, Some(kind)));
      image.mDescriptor = Nothing();
      assert(!MaybeGetSurfaceDescriptorForRemoteCanvas(surface, Nothing()));
      surface.mLayersImage = nullptr;
      assert(!MaybeGetSurfaceDescriptorForRemoteCanvas(surface, Nothing()));
      assert(manager.mAvailabilityChecks == finalChecks);
    }
  }
}
