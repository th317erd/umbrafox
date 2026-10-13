/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#include <array>
#include <limits>

#include "DrawTargetWebgl.h"
#include "DrawTargetWebglInternal.h"
#include "GLContext.h"
#include "ScopedGLHelpers.h"
#include "WebGLContext.h"
#include "gfxPlatform.h"
#include "gtest/gtest.h"
#include "mozilla/gfx/gfxVars.h"
#include "mozilla/layers/DMABUFTextureHostOGL.h"
#include "mozilla/widget/DMABufSurface.h"

namespace mozilla::gfx {

class CanvasVideoSurfaceCache : public ::testing::Test {
 protected:
  static constexpr int32_t kSize = 16;
  static constexpr SurfaceFormat kFormat = SurfaceFormat::B8G8R8A8;
  struct Input {
    layers::SurfaceDescriptor descriptor;
    RefPtr<layers::DMABUFTextureHostOGL> host;
    layers::SurfaceDescriptorRemoteDecoderId id =
        layers::SurfaceDescriptorRemoteDecoderId::GetNext();
  };

  RefPtr<SharedContextWebgl> mContext;
  RefPtr<DrawTargetWebgl> mTarget;
  SurfaceFormat mInputFormat = SurfaceFormat::UNKNOWN;
  Input mRed;
  Input mGreen;
  Maybe<bool> mSoftwarePolicy;

  void SetUp() override {
    gfxPlatform::GetPlatform();
    mContext = SharedContextWebgl::Create();
    if (!mContext) {
      GTEST_SKIP() << "No accelerated canvas context";
    }
    ASSERT_FALSE(mContext->IsContextLost());
    auto* gl = mContext->GetGLContext();
    ASSERT_TRUE(gl);
    RecordProperty("vendor", gl->VendorString().get());
    RecordProperty("renderer", gl->RendererString().get());
    if (gl->Renderer() == gl::GLRenderer::GalliumLlvmpipe ||
        (gl->Vendor() != gl::GLVendor::Intel &&
         gl->Vendor() != gl::GLVendor::NVIDIA &&
         gl->Vendor() != gl::GLVendor::ATI) ||
        !gl->IsExtensionSupported(gl::GLContext::OES_EGL_image)) {
      GTEST_SKIP() << "This suite requires desktop hardware EGL";
    }
    // Gtests force headless compositing even when their WebGL context is
    // hardware.
    mSoftwarePolicy = Some(gfxVars::UseSoftwareWebRender());
    RecordProperty("originalSoftwarePolicy", mSoftwarePolicy.value() ? 1 : 0);
    gfxVars::SetUseSoftwareWebRender(false);
    ASSERT_NO_FATAL_FAILURE(CreateTarget(dom::ContentParentId(1)));
    ASSERT_NO_FATAL_FAILURE(CreateInput(mRed, false));
    ASSERT_NO_FATAL_FAILURE(CreateInput(mGreen, true));
  }

  void TearDown() override {
    mRed.host = nullptr;
    mGreen.host = nullptr;
    mTarget = nullptr;
    mContext = nullptr;
    if (mSoftwarePolicy) {
      gfxVars::SetUseSoftwareWebRender(mSoftwarePolicy.value());
      EXPECT_EQ(gfxVars::UseSoftwareWebRender(), mSoftwarePolicy.value());
      RecordProperty("softwarePolicyRestored", 1);
    }
  }

  void CreateInput(Input& aInput, bool aGreen, bool aGlobalReference = false) {
    auto* gl = mContext->GetGLContext();
    ASSERT_TRUE(gl);
    ASSERT_TRUE(gl->MakeCurrent());
    RefPtr<DMABufSurfaceRGBA> dmabuf = DMABufSurfaceRGBA::CreateDMABufSurface(
        gl, kSize, kSize, DMABUF_ALPHA | DMABUF_TEXTURE);
    ASSERT_TRUE(dmabuf)
    << "This suite requires actual DMABuf allocation";
    ASSERT_TRUE(dmabuf->CreateTextures(gl));
    std::array<uint8_t, kSize * kSize * 4> bytes{};
    for (size_t i = 0; i < bytes.size(); i += 4) {
      bytes[i + (aGreen ? 1 : 0)] = 255;
      bytes[i + 3] = 255;
    }
    {
      const gl::ScopedBindTexture texture(gl, dmabuf->GetTexture());
      const gl::ResetUnpackState unpack(gl);
      gl->fTexSubImage2D(LOCAL_GL_TEXTURE_2D, 0, 0, 0, kSize, kSize,
                         LOCAL_GL_RGBA, LOCAL_GL_UNSIGNED_BYTE, bytes.data());
      gl->fFinish();
      ASSERT_EQ(gl->fGetError(), GLenum(LOCAL_GL_NO_ERROR));
    }
    if (aGlobalReference) {
      dmabuf->GlobalRefCountCreate();
    }
    ASSERT_TRUE(dmabuf->Serialize(aInput.descriptor));
    ASSERT_EQ(aInput.descriptor.type(),
              layers::SurfaceDescriptor::TSurfaceDescriptorDMABuf);
    aInput.host = new layers::DMABUFTextureHostOGL(
        layers::TextureFlags::DEFAULT,
        aInput.descriptor.get_SurfaceDescriptorDMABuf());
    ASSERT_TRUE(aInput.host->IsValid());
    ASSERT_EQ(aInput.host->GetSize(), IntSize(kSize, kSize));
    const SurfaceFormat format = aInput.host->GetFormat();
    ASSERT_TRUE(format == SurfaceFormat::B8G8R8A8 ||
                format == SurfaceFormat::R8G8B8A8);
    if (mInputFormat == SurfaceFormat::UNKNOWN) {
      mInputFormat = format;
      RecordProperty("inputFormat", int(format));
    }
    ASSERT_EQ(format, mInputFormat);
  }

  void CreateTarget(const dom::ContentParentId& aContentId) {
    mTarget = new DrawTargetWebgl;
    ASSERT_TRUE(
        mTarget->Init(IntSize(kSize, kSize), kFormat, mContext, aContentId));
    ASSERT_TRUE(mTarget->IsValid());
  }

  already_AddRefed<SourceSurface> Import(const Input& aInput) {
    return mContext->ImportVideoSurfaceDescriptor(
        mTarget, aInput.descriptor, IntSize(kSize, kSize), mInputFormat,
        aInput.host, aInput.id);
  }

  TextureHandle* CachedHandle() const {
    return mContext->mVideoSurfaceHandle.get();
  }

  void ExpectEmptyCache() {
    EXPECT_FALSE(mContext->mVideoSurfaceHost);
    EXPECT_FALSE(mContext->mVideoSurfaceFrameID.IsValid());
    EXPECT_FALSE(CachedHandle());
  }

  void LoseContext() { mContext->mWebgl->LoseContext(); }

  void ExpectPixels(SourceSurface* aSurface, bool aGreen) {
    ASSERT_TRUE(aSurface);
    ASSERT_EQ(aSurface->GetSize(), IntSize(kSize, kSize));
    ASSERT_EQ(aSurface->GetFormat(), mInputFormat);
    RefPtr<DataSourceSurface> data = aSurface->GetDataSurface();
    ASSERT_TRUE(data);
    ASSERT_EQ(data->GetFormat(), mInputFormat);
    const size_t red = mInputFormat == SurfaceFormat::R8G8B8A8 ? 0 : 2;
    const size_t blue = 2 - red;
    DataSourceSurface::ScopedMap map(data, DataSourceSurface::READ);
    ASSERT_TRUE(map.IsMapped());
    for (int32_t y = 0; y < kSize; ++y) {
      const auto* row = map.GetData() + y * map.GetStride();
      for (int32_t x = 0; x < kSize; ++x) {
        ASSERT_EQ(row[4 * x + blue], 0);
        ASSERT_EQ(row[4 * x + 1], aGreen ? 255 : 0);
        ASSERT_EQ(row[4 * x + red], aGreen ? 0 : 255);
        ASSERT_EQ(row[4 * x + 3], 255);
      }
    }
  }
};

TEST_F(CanvasVideoSurfaceCache,
       BorrowedDescriptorKeepsIndependentOwningCopies) {
  Input input;
  ASSERT_NO_FATAL_FAILURE(CreateInput(input, false, true));
  const layers::TextureHost* host = input.host;
  const auto* borrowed = host->BorrowSurfaceDescriptor();
  ASSERT_TRUE(borrowed);
  ASSERT_EQ(borrowed->type(),
            layers::SurfaceDescriptor::TSurfaceDescriptorDMABuf);
  const auto& descriptor = borrowed->get_SurfaceDescriptorDMABuf();
  ASSERT_EQ(descriptor.width().Length(), 1u);
  ASSERT_EQ(descriptor.width()[0], uint32_t(kSize));
  ASSERT_EQ(descriptor.refCount().Length(), 1u);
  ASSERT_TRUE(descriptor.refCount()[0].IsValid());
  EXPECT_FALSE(host->layers::TextureHost::BorrowSurfaceDescriptor());
  for (unsigned i = 0; i < 4; ++i) {
    EXPECT_EQ(host->BorrowSurfaceDescriptor(), borrowed);
    auto owning = input.host->GetSurfaceDescriptor();
    auto& copied = owning.get_SurfaceDescriptorDMABuf();
    ASSERT_NE(copied.width().Elements(), descriptor.width().Elements());
    copied.width()[0] = kSize * 2;
    EXPECT_EQ(descriptor.width()[0], uint32_t(kSize));
    auto ownedFD = copied.refCount()[0].TakePlatformHandle();
    ASSERT_TRUE(ownedFD);
    EXPECT_FALSE(copied.refCount()[0].IsValid());
    ownedFD = nullptr;
    EXPECT_TRUE(descriptor.refCount()[0].IsValid());
  }
  RefPtr<SourceSurface> surface = mContext->ImportVideoSurfaceDescriptor(
      mTarget, *borrowed, IntSize(kSize, kSize), mInputFormat, input.host,
      input.id);
  ASSERT_NO_FATAL_FAILURE(ExpectPixels(surface, false));
}

TEST_F(CanvasVideoSurfaceCache, LiveSurfaceReuseAndExactPixels) {
  RefPtr<SourceSurface> first = Import(mRed);
  ASSERT_TRUE(first);
  ASSERT_EQ(first->GetType(), SurfaceType::WEBGL);
  for (int i = 0; i < 4; ++i) {
    RefPtr<SourceSurface> next = Import(mRed);
    ASSERT_EQ(next, first);
  }
  ASSERT_NO_FATAL_FAILURE(ExpectPixels(first, false));
}

TEST_F(CanvasVideoSurfaceCache, GenericImportsAreDistinctAndInvalidate) {
  RefPtr<SourceSurface> first = Import(mRed);
  ASSERT_TRUE(first);
  RefPtr<SourceSurface> generic = mContext->ImportSurfaceDescriptor(
      mTarget, mRed.descriptor, IntSize(kSize, kSize), mInputFormat, true);
  ASSERT_TRUE(generic);
  EXPECT_NE(generic, first);
  ExpectEmptyCache();
  RefPtr<SourceSurface> next = Import(mRed);
  ASSERT_TRUE(next);
  EXPECT_NE(next, first);
  EXPECT_NE(next, generic);
  ASSERT_NO_FATAL_FAILURE(ExpectPixels(next, false));
}

TEST_F(CanvasVideoSurfaceCache, FrameAndHostIdentityCannotAlias) {
  RefPtr<SourceSurface> first = Import(mRed);
  ASSERT_TRUE(first);
  mRed.id = layers::SurfaceDescriptorRemoteDecoderId::GetNext();
  RefPtr<SourceSurface> newID = Import(mRed);
  ASSERT_TRUE(newID);
  EXPECT_NE(newID, first);
  mGreen.id = mRed.id;
  RefPtr<SourceSurface> differentHost = Import(mGreen);
  ASSERT_TRUE(differentHost);
  EXPECT_NE(differentHost, newID);
  ASSERT_NO_FATAL_FAILURE(ExpectPixels(first, false));
  ASSERT_NO_FATAL_FAILURE(ExpectPixels(differentHost, true));
}

TEST_F(CanvasVideoSurfaceCache, ContentOwnershipCannotAlias) {
  RefPtr<SourceSurface> first = Import(mRed);
  ASSERT_TRUE(first);
  ASSERT_NO_FATAL_FAILURE(CreateTarget(dom::ContentParentId(2)));
  RefPtr<SourceSurface> second = Import(mRed);
  ASSERT_TRUE(second);
  EXPECT_NE(second, first);
  RefPtr<SourceSurface> hit = Import(mRed);
  EXPECT_EQ(hit, second);
  ASSERT_NO_FATAL_FAILURE(ExpectPixels(first, false));
  ASSERT_NO_FATAL_FAILURE(ExpectPixels(second, false));
}

TEST_F(CanvasVideoSurfaceCache, MissingTargetNeverPublishes) {
  RefPtr<SourceSurface> first = Import(mRed);
  ASSERT_TRUE(first);
  mTarget = nullptr;
  RefPtr<SourceSurface> second = Import(mRed);
  ASSERT_TRUE(second);
  EXPECT_NE(second, first);
  ExpectEmptyCache();
  RefPtr<SourceSurface> third = Import(mRed);
  ASSERT_TRUE(third);
  EXPECT_NE(third, second);
  ExpectEmptyCache();
  ASSERT_NO_FATAL_FAILURE(ExpectPixels(third, false));
}

TEST_F(CanvasVideoSurfaceCache, MissingIdentityNeverPublishes) {
  RefPtr<SourceSurface> first = Import(mRed);
  ASSERT_TRUE(first);
  mRed.id = {};
  RefPtr<SourceSurface> noID = Import(mRed);
  ASSERT_TRUE(noID);
  EXPECT_NE(noID, first);
  ExpectEmptyCache();
  mRed.id = layers::SurfaceDescriptorRemoteDecoderId::GetNext();
  mRed.host = nullptr;
  RefPtr<SourceSurface> noHost = Import(mRed);
  ASSERT_TRUE(noHost);
  EXPECT_NE(noHost, noID);
  ExpectEmptyCache();
  ASSERT_NO_FATAL_FAILURE(ExpectPixels(noHost, false));
}

TEST_F(CanvasVideoSurfaceCache, ReleasedOwnerReusesExistingHandle) {
  RefPtr<SourceSurface> first = Import(mRed);
  ASSERT_TRUE(first);
  ThreadSafeWeakPtr<SourceSurface> witness(first);
  TextureHandle* handle = CachedHandle();
  ASSERT_TRUE(handle);
  first = nullptr;
  EXPECT_TRUE(witness.IsDead());
  ASSERT_EQ(CachedHandle(), handle);
  RefPtr<SourceSurface> replacement = Import(mRed);
  ASSERT_TRUE(replacement);
  ASSERT_EQ(CachedHandle(), handle);
  ASSERT_NO_FATAL_FAILURE(ExpectPixels(replacement, false));
}

TEST_F(CanvasVideoSurfaceCache, ReadbackPreventsStaleHandleReuse) {
  RefPtr<SourceSurface> first = Import(mRed);
  ASSERT_TRUE(first);
  ASSERT_NO_FATAL_FAILURE(ExpectPixels(first, false));
  RefPtr<SourceSurface> next = Import(mRed);
  ASSERT_TRUE(next);
  EXPECT_NE(next, first);
  ASSERT_NO_FATAL_FAILURE(ExpectPixels(next, false));
}

TEST_F(CanvasVideoSurfaceCache, ExplicitClearAndMemoryPressureRecover) {
  RefPtr<SourceSurface> first = Import(mRed);
  ASSERT_TRUE(first);
  mContext->ClearVideoSurfaceCache();
  ExpectEmptyCache();
  RefPtr<SourceSurface> second = Import(mRed);
  ASSERT_TRUE(second);
  EXPECT_NE(second, first);
  mContext->OnMemoryPressure();
  RefPtr<SourceSurface> pressure = Import(mRed);
  ASSERT_TRUE(pressure);
  EXPECT_NE(pressure, second);
  ExpectEmptyCache();
  mContext->ClearCaches();
  ExpectEmptyCache();
  RefPtr<SourceSurface> recovered = Import(mGreen);
  ASSERT_TRUE(recovered);
  RefPtr<SourceSurface> hit = Import(mGreen);
  EXPECT_EQ(hit, recovered);
  ASSERT_NO_FATAL_FAILURE(ExpectPixels(recovered, true));
  ASSERT_NO_FATAL_FAILURE(ExpectPixels(first, false));
}

TEST_F(CanvasVideoSurfaceCache, FailedImportsDoNotPoisonRecovery) {
  RefPtr<SourceSurface> first = Import(mRed);
  ASSERT_TRUE(first);
  const layers::SurfaceDescriptor unusable;
  RefPtr<SourceSurface> failed = mContext->ImportVideoSurfaceDescriptor(
      mTarget, unusable, IntSize(kSize, kSize), mInputFormat, mGreen.host,
      mGreen.id);
  EXPECT_FALSE(failed);
  ExpectEmptyCache();
  failed = mContext->ImportVideoSurfaceDescriptor(
      mTarget, mGreen.descriptor,
      IntSize(std::numeric_limits<int32_t>::max(), kSize), mInputFormat,
      mGreen.host, mGreen.id);
  EXPECT_FALSE(failed);
  ExpectEmptyCache();
  RefPtr<SourceSurface> recovered = Import(mGreen);
  ASSERT_TRUE(recovered);
  ASSERT_NO_FATAL_FAILURE(ExpectPixels(recovered, true));
}

TEST_F(CanvasVideoSurfaceCache, ContextLossRejectsAndReplacementRecovers) {
  RefPtr<SourceSurface> first = Import(mRed);
  ASSERT_TRUE(first);
  ASSERT_TRUE(CachedHandle());
  RefPtr<SharedContextWebgl> lost = mContext;
  LoseContext();
  ASSERT_TRUE(mContext->IsContextLost());
  RefPtr<SourceSurface> afterLoss = Import(mRed);
  EXPECT_FALSE(afterLoss);
  ExpectEmptyCache();
  mContext = SharedContextWebgl::Create();
  ASSERT_TRUE(mContext);
  ASSERT_NE(mContext, lost);
  ASSERT_FALSE(mContext->IsContextLost());
  ExpectEmptyCache();
  ASSERT_NO_FATAL_FAILURE(CreateTarget(dom::ContentParentId(1)));
  RefPtr<SourceSurface> recovered = Import(mRed);
  ASSERT_TRUE(recovered);
  EXPECT_NE(recovered, first);
  RefPtr<SourceSurface> hit = Import(mRed);
  EXPECT_EQ(hit, recovered);
  ASSERT_NO_FATAL_FAILURE(ExpectPixels(recovered, false));
}

}  // namespace mozilla::gfx
