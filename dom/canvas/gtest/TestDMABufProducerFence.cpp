/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#include <dirent.h>
#include <fcntl.h>
#include <unistd.h>

#include <array>
#include <cerrno>
#include <memory>
#include <string>
#include <vector>

#include "GLContextEGL.h"
#include "GLScreenBuffer.h"
#include "MozFramebuffer.h"
#include "ScopedGLHelpers.h"
#include "SharedSurfaceDMABUF.h"
#include "WebGLContext.h"
#include "gfxPlatform.h"

// X11's Bool macro collides with testing::Bool.
#undef Bool
#include "gtest/gtest.h"
#include "mozilla/ScopeExit.h"
#include "mozilla/gfx/FileHandleWrapper.h"
#include "mozilla/gfx/gfxVars.h"
#include "mozilla/layers/LayersSurfaces.h"

namespace mozilla::gl {

class DMABufProducerFence : public ::testing::Test {
 protected:
  RefPtr<WebGLContext> mWebgl;
  RefPtr<GLContext> mGL;
  std::shared_ptr<EglDisplay> mEgl;
  Maybe<bool> mSoftwarePolicy;

  void CreateContext() {
    ASSERT_FALSE(mWebgl);
    ASSERT_FALSE(mGL);
    webgl::InitContextDesc desc;
    desc.isWebgl2 = true;
    desc.size = {16, 16};
    webgl::InitContextResult result;
    mWebgl = WebGLContext::Create(nullptr, desc, &result);
    ASSERT_TRUE(mWebgl);
    mGL = mWebgl->GL();
    ASSERT_TRUE(mGL);
    ASSERT_TRUE(mGL->MakeCurrent());
  }

  void SetUp() override {
    gfxPlatform::GetPlatform();
    ASSERT_NO_FATAL_FAILURE(CreateContext());
    RecordProperty("vendor", mGL->VendorString().get());
    RecordProperty("renderer", mGL->RendererString().get());
    if (mGL->GetContextType() != GLContextType::EGL ||
        mGL->Renderer() == GLRenderer::GalliumLlvmpipe ||
        (mGL->Vendor() != GLVendor::Intel &&
         mGL->Vendor() != GLVendor::NVIDIA && mGL->Vendor() != GLVendor::ATI) ||
        !mGL->IsExtensionSupported(GLContext::OES_EGL_image)) {
      GTEST_SKIP() << "Requires desktop hardware EGL";
    }
    mEgl = GLContextEGL::Cast(mGL)->mEgl;
    if (!mEgl->IsExtensionSupported(EGLExtension::KHR_fence_sync) ||
        !mEgl->IsExtensionSupported(EGLExtension::ANDROID_native_fence_sync)) {
      GTEST_SKIP() << "Requires native EGL fence export/import";
    }
    mSoftwarePolicy = Some(gfx::gfxVars::UseSoftwareWebRender());
    RecordProperty("originalSoftwarePolicy", mSoftwarePolicy.value() ? 1 : 0);
    gfx::gfxVars::SetUseSoftwareWebRender(false);
  }

  void TearDown() override {
    mWebgl = nullptr;
    mGL = nullptr;
    mEgl.reset();
    if (mSoftwarePolicy) {
      gfx::gfxVars::SetUseSoftwareWebRender(mSoftwarePolicy.value());
      EXPECT_EQ(gfx::gfxVars::UseSoftwareWebRender(), mSoftwarePolicy.value());
      RecordProperty("softwarePolicyRestored", 1);
    }
  }

  UniquePtr<SharedSurface_DMABUF> CreateSurface(const gfx::IntSize& aSize = {
                                                    16, 16}) {
    SurfaceFactory_DMABUF factory(*mGL);
    return SharedSurface_DMABUF::Create(
        {factory.mDesc, aSize, gfx::ColorSpace2::Display});
  }

  void Clear(SharedSurface& aSurface, bool aGreen) {
    ASSERT_TRUE(mGL->MakeCurrent());
    ASSERT_TRUE(aSurface.mFb);
    const ScopedBindFramebuffer binding(mGL, aSurface.mFb->mFB);
    const ScopedGLState scissor(mGL, LOCAL_GL_SCISSOR_TEST, false);
    mGL->fColorMask(true, true, true, true);
    mGL->fClearColor(aGreen ? 0 : 1, aGreen ? 1 : 0, 0, 1);
    mGL->fClear(LOCAL_GL_COLOR_BUFFER_BIT);
    ASSERT_EQ(mGL->fGetError(), GLenum(LOCAL_GL_NO_ERROR));
  }

  void Publish(SharedSurface_DMABUF& aSurface, bool aGreen) {
    ASSERT_TRUE(mGL->MakeCurrent());
    aSurface.BeginWrite();
    auto endWrite = MakeScopeExit([&] { aSurface.EndWrite(); });
    ASSERT_NO_FATAL_FAILURE(Clear(aSurface, aGreen));
  }

  void ExpectRetained(SharedSurface_DMABUF& aSurface) {
    auto& fence = aSurface.mProducerFence;
    ASSERT_TRUE(fence.mSync);
    ASSERT_EQ(fence.mEgl, mEgl);
    ASSERT_TRUE(fence.mSyncFd);
    ASSERT_GE(fcntl(fence.mSyncFd->GetHandle(), F_GETFD), 0);
    EGLint type = 0;
    ASSERT_TRUE(mEgl->fGetSyncAttrib(fence.mSync, LOCAL_EGL_SYNC_TYPE, &type));
    EXPECT_EQ(type, LOCAL_EGL_SYNC_NATIVE_FENCE_ANDROID);
    EGLint status = 0;
    ASSERT_TRUE(
        mEgl->fGetSyncAttrib(fence.mSync, LOCAL_EGL_SYNC_STATUS, &status));
    EXPECT_TRUE(status == LOCAL_EGL_SIGNALED || status == LOCAL_EGL_UNSIGNALED);
  }

  void ExpectEmpty(SharedSurface_DMABUF& aSurface) {
    EXPECT_FALSE(aSurface.mProducerFence.mSync);
    EXPECT_FALSE(aSurface.mProducerFence.mSyncFd);
    EXPECT_FALSE(aSurface.mProducerFence.mEgl);
  }

  UniqueFileHandle Duplicate(SharedSurface_DMABUF& aSurface) {
    return aSurface.mProducerFence.mSyncFd->ClonePlatformHandle();
  }

  void ImportAndWait(UniqueFileHandle aFD) {
    ASSERT_TRUE(aFD);
    ASSERT_GE(fcntl(aFD.get(), F_GETFD), 0);
    const EGLint attributes[] = {LOCAL_EGL_SYNC_NATIVE_FENCE_FD_ANDROID,
                                 aFD.get(), LOCAL_EGL_NONE};
    EGLSync sync =
        mEgl->fCreateSyncKHR(LOCAL_EGL_SYNC_NATIVE_FENCE_ANDROID, attributes);
    ASSERT_TRUE(sync);
    (void)aFD.release();
    auto destroy =
        MakeScopeExit([&] { EXPECT_TRUE(mEgl->fDestroySync(sync)); });
    EXPECT_EQ(mEgl->fClientWaitSync(sync, 0, 1000000000),
              LOCAL_EGL_CONDITION_SATISFIED);
  }

  void ExpectPixels(const layers::SurfaceDescriptor& aDescriptor, bool aGreen,
                    const gfx::IntSize& aSize = {16, 16}) {
    RefPtr<DMABufSurface> imported =
        DMABufSurface::CreateDMABufSurface(aDescriptor);
    ASSERT_TRUE(imported);
    ASSERT_TRUE(mGL->MakeCurrent());
    ASSERT_TRUE(imported->CreateTexture(mGL));
    auto release = MakeScopeExit([&] { imported->ReleaseTextures(); });
    imported->FenceWait(mGL);
    const ScopedFramebufferForTexture framebuffer(mGL, imported->GetTexture());
    ASSERT_TRUE(framebuffer.IsComplete());
    const ScopedBindFramebuffer binding(mGL, framebuffer.FB());
    ScopedPackState pack(mGL);
    ASSERT_TRUE(pack.SetForWidthAndStrideRGBA(aSize.width, aSize.width * 4));
    std::vector<uint8_t> bytes(size_t(aSize.width * aSize.height) * 4, 77);
    mGL->fReadPixels(0, 0, aSize.width, aSize.height, LOCAL_GL_RGBA,
                     LOCAL_GL_UNSIGNED_BYTE, bytes.data());
    ASSERT_EQ(mGL->fGetError(), GLenum(LOCAL_GL_NO_ERROR));
    for (size_t i = 0; i < bytes.size(); i += 4) {
      ASSERT_EQ(bytes[i], aGreen ? 0 : 255);
      ASSERT_EQ(bytes[i + 1], aGreen ? 255 : 0);
      ASSERT_EQ(bytes[i + 2], 0);
      ASSERT_EQ(bytes[i + 3], 255);
    }
  }

  void FenceFDTarget(int aFD, std::string& aTarget) {
    std::array<char, 1024> target;
    const auto path = "/proc/self/fd/" + std::to_string(aFD);
    const auto length = readlink(path.c_str(), target.data(), target.size());
    ASSERT_GT(length, 0);
    ASSERT_LT(size_t(length), target.size());
    aTarget.assign(target.data(), size_t(length));
    ASSERT_NE(aTarget.find("sync_file"), std::string::npos);
  }

  void CountFenceFDs(const std::string& aTarget, size_t& aCount) {
    DIR* directory = opendir("/proc/self/fd");
    ASSERT_TRUE(directory);
    auto close = MakeScopeExit([&] { closedir(directory); });
    aCount = 0;
    size_t entries = 0;
    while (true) {
      errno = 0;
      auto* entry = readdir(directory);
      if (!entry) {
        ASSERT_EQ(errno, 0);
        break;
      }
      ASSERT_LT(++entries, 4096u);
      if (entry->d_name[0] == '.') {
        continue;
      }
      std::array<char, 1024> target;
      const auto path = std::string("/proc/self/fd/") + entry->d_name;
      const auto length = readlink(path.c_str(), target.data(), target.size());
      if (length < 0 && errno == ENOENT) {
        continue;
      }
      ASSERT_GT(length, 0);
      ASSERT_LT(size_t(length), target.size());
      if (std::string(target.data(), size_t(length)) == aTarget) {
        ++aCount;
      }
    }
  }
};

TEST_F(DMABufProducerFence, LocalWaitKeepsExportedDuplicatesAndPixels) {
  auto surface = CreateSurface();
  ASSERT_TRUE(surface);
  ASSERT_NO_FATAL_FAILURE(Publish(*surface, false));
  ASSERT_NO_FATAL_FAILURE(ExpectRetained(*surface));
  auto descriptor = surface->ToSurfaceDescriptor();
  ASSERT_TRUE(descriptor);
  auto duplicate = Duplicate(*surface);
  surface->WaitForBufferOwnership();
  ASSERT_NO_FATAL_FAILURE(ExpectEmpty(*surface));
  ASSERT_NO_FATAL_FAILURE(ImportAndWait(std::move(duplicate)));
  ASSERT_NO_FATAL_FAILURE(ExpectPixels(*descriptor, false));
  surface->WaitForBufferOwnership();
  ASSERT_NO_FATAL_FAILURE(ExpectEmpty(*surface));
}

TEST_F(DMABufProducerFence, ReplacementKeepsOldExportsAndAlternatingPixels) {
  auto surface = CreateSurface();
  ASSERT_TRUE(surface);
  for (unsigned i = 0; i < 16; ++i) {
    ASSERT_NO_FATAL_FAILURE(Publish(*surface, i % 2));
    ASSERT_NO_FATAL_FAILURE(ExpectRetained(*surface));
    auto oldFD = Duplicate(*surface);
    surface->ProducerReleaseImpl();
    ASSERT_NO_FATAL_FAILURE(ExpectRetained(*surface));
    auto descriptor = surface->ToSurfaceDescriptor();
    ASSERT_TRUE(descriptor);
    ASSERT_NO_FATAL_FAILURE(ImportAndWait(std::move(oldFD)));
    ASSERT_NO_FATAL_FAILURE(ExpectPixels(*descriptor, i % 2));
    surface->WaitForBufferOwnership();
    ASSERT_NO_FATAL_FAILURE(ExpectEmpty(*surface));
  }
}

TEST_F(DMABufProducerFence, OwnerDestructionKeepsDescriptorAndDuplicate) {
  auto surface = CreateSurface();
  ASSERT_TRUE(surface);
  ASSERT_NO_FATAL_FAILURE(Publish(*surface, true));
  ASSERT_NO_FATAL_FAILURE(ExpectRetained(*surface));
  auto descriptor = surface->ToSurfaceDescriptor();
  ASSERT_TRUE(descriptor);
  auto duplicate = Duplicate(*surface);
  surface = nullptr;
  ASSERT_NO_FATAL_FAILURE(ImportAndWait(std::move(duplicate)));
  ASSERT_NO_FATAL_FAILURE(ExpectPixels(*descriptor, true));
}

TEST_F(DMABufProducerFence, SwapChainRecycleResizeAndClear) {
  auto chain = MakeUnique<SwapChain>();
  chain->mFactory = MakeUnique<SurfaceFactory_DMABUF>(*mGL);
  auto presenter = chain->Acquire({16, 16}, gfx::ColorSpace2::Display,
                                  gfx::TransferFunction::SRGB);
  ASSERT_TRUE(presenter);
  auto first = presenter->BackBuffer();
  ASSERT_TRUE(first);
  ASSERT_NO_FATAL_FAILURE(Clear(*first, false));
  presenter = nullptr;
  auto* producer = static_cast<SharedSurface_DMABUF*>(first.get());
  ASSERT_NO_FATAL_FAILURE(ExpectRetained(*producer));
  auto duplicate = Duplicate(*producer);
  ASSERT_TRUE(chain->StoreRecycledSurface(first));
  presenter = chain->Acquire({16, 16}, gfx::ColorSpace2::Display,
                             gfx::TransferFunction::SRGB);
  ASSERT_TRUE(presenter);
  ASSERT_EQ(presenter->BackBuffer(), first);
  ASSERT_NO_FATAL_FAILURE(ExpectEmpty(*producer));
  ASSERT_NO_FATAL_FAILURE(Clear(*first, true));
  presenter = nullptr;
  ASSERT_NO_FATAL_FAILURE(ExpectRetained(*producer));
  auto descriptor = producer->ToSurfaceDescriptor();
  ASSERT_TRUE(descriptor);
  ASSERT_NO_FATAL_FAILURE(ExpectPixels(*descriptor, true));
  ASSERT_TRUE(chain->StoreRecycledSurface(first));
  presenter = chain->Acquire({32, 16}, gfx::ColorSpace2::Display,
                             gfx::TransferFunction::SRGB);
  ASSERT_TRUE(presenter);
  ASSERT_NE(presenter->BackBuffer(), first);
  ASSERT_NO_FATAL_FAILURE(Clear(*presenter->BackBuffer(), false));
  presenter = nullptr;
  first.reset();
  chain->ClearPool();
  chain = nullptr;
  ASSERT_NO_FATAL_FAILURE(ImportAndWait(std::move(duplicate)));
  ASSERT_NO_FATAL_FAILURE(ExpectPixels(*descriptor, true));
}

TEST_F(DMABufProducerFence, ContextReleaseKeepsFenceUntilOwnerDestruction) {
  auto surface = CreateSurface();
  ASSERT_TRUE(surface);
  ASSERT_NO_FATAL_FAILURE(Publish(*surface, false));
  ASSERT_NO_FATAL_FAILURE(ExpectRetained(*surface));
  auto duplicate = Duplicate(*surface);
  auto descriptor = surface->ToSurfaceDescriptor();
  ASSERT_TRUE(descriptor);
  const WeakPtr<GLContext> oldContext(mGL);
  surface->mSurface->ReleaseTextures();
  mWebgl = nullptr;
  mGL = nullptr;
  ASSERT_FALSE(oldContext);
  ASSERT_FALSE(surface->mDesc.gl);
  ASSERT_NO_FATAL_FAILURE(ExpectRetained(*surface));
  surface = nullptr;
  ASSERT_NO_FATAL_FAILURE(CreateContext());
  ASSERT_EQ(GLContextEGL::Cast(mGL)->mEgl, mEgl);
  ASSERT_NO_FATAL_FAILURE(ImportAndWait(std::move(duplicate)));
  ASSERT_NO_FATAL_FAILURE(ExpectPixels(*descriptor, false));
}

TEST_F(DMABufProducerFence, WebGLLossAndReplacementKeepExportedPixels) {
  auto surface = CreateSurface();
  ASSERT_TRUE(surface);
  ASSERT_NO_FATAL_FAILURE(Publish(*surface, true));
  ASSERT_NO_FATAL_FAILURE(ExpectRetained(*surface));
  auto descriptor = surface->ToSurfaceDescriptor();
  ASSERT_TRUE(descriptor);
  auto duplicate = Duplicate(*surface);
  mWebgl->LoseContext();
  ASSERT_TRUE(mWebgl->IsContextLost());
  surface = nullptr;
  mWebgl = nullptr;
  mGL = nullptr;
  ASSERT_NO_FATAL_FAILURE(CreateContext());
  ASSERT_EQ(GLContextEGL::Cast(mGL)->mEgl, mEgl);
  ASSERT_NO_FATAL_FAILURE(ImportAndWait(std::move(duplicate)));
  ASSERT_NO_FATAL_FAILURE(ExpectPixels(*descriptor, true));
  auto replacement = CreateSurface();
  ASSERT_TRUE(replacement);
  ASSERT_NO_FATAL_FAILURE(Publish(*replacement, false));
  ASSERT_NO_FATAL_FAILURE(ExpectRetained(*replacement));
  replacement->WaitForBufferOwnership();
  ASSERT_NO_FATAL_FAILURE(ExpectEmpty(*replacement));
}

TEST_F(DMABufProducerFence, IdleOwnersReturnNativeFenceFDs) {
  std::string target;
  {
    auto warmup = CreateSurface();
    ASSERT_TRUE(warmup);
    ASSERT_NO_FATAL_FAILURE(Publish(*warmup, false));
    ASSERT_NO_FATAL_FAILURE(ExpectRetained(*warmup));
    auto duplicate = Duplicate(*warmup);
    ASSERT_TRUE(duplicate);
    ASSERT_NO_FATAL_FAILURE(FenceFDTarget(duplicate.get(), target));
    warmup->WaitForBufferOwnership();
  }
  mGL->fFinish();
  size_t before = 0;
  ASSERT_NO_FATAL_FAILURE(CountFenceFDs(target, before));
  std::vector<UniquePtr<SharedSurface_DMABUF>> surfaces;
  constexpr size_t kOwners = 32;
  for (size_t i = 0; i < kOwners; ++i) {
    auto surface = CreateSurface();
    ASSERT_TRUE(surface);
    ASSERT_NO_FATAL_FAILURE(Publish(*surface, i % 2));
    ASSERT_NO_FATAL_FAILURE(ExpectRetained(*surface));
    surfaces.push_back(std::move(surface));
  }
  size_t held = 0;
  ASSERT_NO_FATAL_FAILURE(CountFenceFDs(target, held));
  EXPECT_GE(held, before + kOwners);
  for (auto& surface : surfaces) {
    surface->ProducerReleaseImpl();
    ASSERT_NO_FATAL_FAILURE(ExpectRetained(*surface));
  }
  surfaces.clear();
  mGL->fFinish();
  size_t after = 0;
  ASSERT_NO_FATAL_FAILURE(CountFenceFDs(target, after));
  RecordProperty("fenceFDsBefore", int(before));
  RecordProperty("fenceFDsHeld", int(held));
  RecordProperty("fenceFDsAfter", int(after));
  EXPECT_EQ(after, before);
}

}  // namespace mozilla::gl
