/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#include <algorithm>
#include <array>
#include <cstdlib>
#include <vector>

#include "DrawTargetWebgl.h"
#include "GLContext.h"
#include "ScopedGLHelpers.h"
#include "WebGLContext.h"
#include "gfxPlatform.h"
#include "gtest/gtest.h"
#include "mozilla/gfx/2D.h"
#include "mozilla/widget/DMABufSurface.h"

namespace mozilla::gfx {
namespace {

// Real GL planes isolate conversion and scaling without decoder/EGL import.
class TexturePlaneSurface final : public DMABufSurface {
 public:
  TexturePlaneSurface(gl::GLContext* aGL, const IntSize& aSize,
                      const std::array<std::vector<uint8_t>, 3>& aPlanes)
      : DMABufSurface(SURFACE_YUV) {
    mGL = aGL;
    mBufferPlaneCount = 3;
    mFOURCCFormat = VA_FOURCC_I420;
    SetYUVColorSpace(YUVColorSpace::BT709);
    const gl::ScopedBindTexture binding(mGL, 0);
    const gl::ResetUnpackState unpack(mGL);
    mGL->fGenTextures(3, mTextures.data());
    for (size_t plane = 0; plane < mTextures.size(); ++plane) {
      mWidth[plane] = plane ? aSize.width / 2 : aSize.width;
      mHeight[plane] = plane ? aSize.height / 2 : aSize.height;
      mTexture[plane] = mTextures[plane];
      const IntSize size(GetWidth(plane), GetHeight(plane));
      EXPECT_EQ(aPlanes[plane].size(), size_t(size.width * size.height));
      mGL->fBindTexture(LOCAL_GL_TEXTURE_2D, mTextures[plane]);
      mGL->TexParams_SetClampNoMips(LOCAL_GL_TEXTURE_2D);
      mGL->fPixelStorei(LOCAL_GL_UNPACK_ALIGNMENT, 1);
      mGL->fTexImage2D(LOCAL_GL_TEXTURE_2D, 0, LOCAL_GL_R8, size.width,
                       size.height, 0, LOCAL_GL_RED, LOCAL_GL_UNSIGNED_BYTE,
                       aPlanes[plane].data());
    }
  }

  int GetWidthAligned(int aPlane = 0) override { return GetWidth(aPlane); }
  int GetHeightAligned(int aPlane = 0) override { return GetHeight(aPlane); }
  int GetTextureCount() override { return 3; }
  bool Serialize(layers::SurfaceDescriptor&) override { return false; }
  void ReleaseSurface() override {}

  void SetReportedSize(const IntSize& aSize) {
    mWidth[0] = aSize.width;
    mHeight[0] = aSize.height;
  }
  void SetMissingPlane(int aPlane) {
    if (mMissingPlane >= 0) {
      mTexture[mMissingPlane] = mTextures[mMissingPlane];
    }
    mMissingPlane = aPlane;
    if (mMissingPlane >= 0) {
      mTexture[mMissingPlane] = 0;
    }
  }

  nsresult Read(const IntSize& aSize, bool aScaled,
                std::vector<uint8_t>& aBytes, uint8_t aFill = 0) {
    aBytes.assign(size_t(aSize.width * aSize.height) * 4, aFill);
    return ReadIntoBuffer(mGL, aBytes.data(), aSize.width * 4, aSize,
                          SurfaceFormat::B8G8R8A8, aScaled);
  }

 private:
  ~TexturePlaneSurface() override {
    mGL->MakeCurrent();
    mGL->fDeleteTextures(3, mTextures.data());
  }
  bool Create(const layers::SurfaceDescriptor&) override { return false; }
  bool CreateTexture(gl::GLContext* aGL, int aPlane) override {
    return aGL == mGL && mTexture[aPlane];
  }
  bool OpenFileDescriptorForPlane(widget::DMABufDeviceLock*, int) override {
    return false;
  }

  int mMissingPlane = -1;
  std::array<GLuint, 3> mTextures{};
};

std::vector<GLint> CaptureCallerState(gl::GLContext* aGL) {
  constexpr GLenum scalarNames[] = {
      LOCAL_GL_ACTIVE_TEXTURE,
      LOCAL_GL_READ_FRAMEBUFFER_BINDING,
      LOCAL_GL_DRAW_FRAMEBUFFER_BINDING,
      LOCAL_GL_CURRENT_PROGRAM,
      LOCAL_GL_VERTEX_ARRAY_BINDING,
      LOCAL_GL_ARRAY_BUFFER_BINDING,
      LOCAL_GL_PACK_ALIGNMENT,
      LOCAL_GL_PACK_ROW_LENGTH,
      LOCAL_GL_PACK_SKIP_ROWS,
      LOCAL_GL_PACK_SKIP_PIXELS,
      LOCAL_GL_UNPACK_ALIGNMENT,
      LOCAL_GL_UNPACK_ROW_LENGTH,
      LOCAL_GL_UNPACK_SKIP_ROWS,
      LOCAL_GL_UNPACK_SKIP_PIXELS,
      LOCAL_GL_BLEND,
      LOCAL_GL_CULL_FACE,
      LOCAL_GL_DEPTH_TEST,
      LOCAL_GL_DITHER,
      LOCAL_GL_SCISSOR_TEST,
      LOCAL_GL_STENCIL_TEST,
  };
  std::vector<GLint> state;
  for (const auto name : scalarNames) {
    state.push_back(aGL->GetIntAs<GLint>(name));
  }
  for (const auto name :
       {LOCAL_GL_VIEWPORT, LOCAL_GL_SCISSOR_BOX, LOCAL_GL_COLOR_WRITEMASK}) {
    std::array<GLint, 4> values;
    aGL->fGetIntegerv(name, values.data());
    state.insert(state.end(), values.begin(), values.end());
  }
  const auto active = aGL->GetIntAs<GLenum>(LOCAL_GL_ACTIVE_TEXTURE);
  for (GLuint unit = 0; unit < 4; ++unit) {
    aGL->fActiveTexture(LOCAL_GL_TEXTURE0 + unit);
    state.push_back(aGL->GetIntAs<GLint>(LOCAL_GL_TEXTURE_BINDING_2D));
  }
  aGL->fActiveTexture(active);
  return state;
}

void SeedCallerState(gl::GLContext* aGL, GLuint aTexture,
                     GLuint aReadFramebuffer, GLuint aDrawFramebuffer) {
  for (GLuint unit = 0; unit < 4; ++unit) {
    aGL->fActiveTexture(LOCAL_GL_TEXTURE0 + unit);
    aGL->fBindTexture(LOCAL_GL_TEXTURE_2D, aTexture);
  }
  aGL->fBindFramebuffer(LOCAL_GL_READ_FRAMEBUFFER, aReadFramebuffer);
  aGL->fBindFramebuffer(LOCAL_GL_DRAW_FRAMEBUFFER, aDrawFramebuffer);
  aGL->fViewport(2, 3, 5, 7);
  aGL->fScissor(1, 2, 3, 4);
  aGL->fColorMask(false, true, false, true);
  for (const auto cap :
       {LOCAL_GL_BLEND, LOCAL_GL_CULL_FACE, LOCAL_GL_DEPTH_TEST,
        LOCAL_GL_SCISSOR_TEST, LOCAL_GL_STENCIL_TEST}) {
    aGL->fEnable(cap);
  }
  aGL->fDisable(LOCAL_GL_DITHER);
  aGL->fPixelStorei(LOCAL_GL_PACK_ALIGNMENT, 8);
  aGL->fPixelStorei(LOCAL_GL_PACK_ROW_LENGTH, 13);
  aGL->fPixelStorei(LOCAL_GL_PACK_SKIP_ROWS, 2);
  aGL->fPixelStorei(LOCAL_GL_PACK_SKIP_PIXELS, 1);
  aGL->fPixelStorei(LOCAL_GL_UNPACK_ALIGNMENT, 8);
  aGL->fPixelStorei(LOCAL_GL_UNPACK_ROW_LENGTH, 13);
  aGL->fPixelStorei(LOCAL_GL_UNPACK_SKIP_ROWS, 2);
  aGL->fPixelStorei(LOCAL_GL_UNPACK_SKIP_PIXELS, 1);
}

}  // namespace

class DMABufReadback : public ::testing::Test {
 protected:
  const IntSize mSize{8, 4};
  RefPtr<WebGLContext> mWebgl;

  void SetUp() override {
    gfxPlatform::GetPlatform();
    webgl::InitContextDesc desc;
    desc.isWebgl2 = true;
    desc.size = {8, 4};
    webgl::InitContextResult result;
    mWebgl = WebGLContext::Create(nullptr, desc, &result);
    if (!mWebgl) {
      GTEST_SKIP() << "No usable WebGL2 context.";
    }
    ASSERT_TRUE(mWebgl->GL()->MakeCurrent());
    const auto* vendor = mWebgl->GL()->fGetString(LOCAL_GL_VENDOR);
    const auto* renderer = mWebgl->GL()->fGetString(LOCAL_GL_RENDERER);
    ASSERT_NE(vendor, nullptr);
    ASSERT_NE(renderer, nullptr);
    RecordProperty("glVendor", reinterpret_cast<const char*>(vendor));
    RecordProperty("glRenderer", reinterpret_cast<const char*>(renderer));
  }

  std::array<std::vector<uint8_t>, 3> Planes(uint8_t aY, uint8_t aCb,
                                             uint8_t aCr) {
    return {std::vector<uint8_t>(32, aY), std::vector<uint8_t>(8, aCb),
            std::vector<uint8_t>(8, aCr)};
  }

  void Compare(const std::array<std::vector<uint8_t>, 3>& aPlanes,
               const IntSize& aDestination,
               YUVColorSpace aColorSpace = YUVColorSpace::BT709) {
    RefPtr surface = new TexturePlaneSurface(mWebgl->GL(), mSize, aPlanes);
    surface->SetYUVColorSpace(aColorSpace);
    ASSERT_EQ(mWebgl->GL()->fGetError(), 0u);
    std::vector<uint8_t> full;
    std::vector<uint8_t> scaled;
    ASSERT_EQ(surface->Read(mSize, false, full), NS_OK);
    ASSERT_EQ(surface->Read(aDestination, true, scaled), NS_OK);
    ASSERT_EQ(mWebgl->GL()->fGetError(), 0u);
    std::vector<uint8_t> repeated;
    ASSERT_EQ(surface->Read(aDestination, true, repeated), NS_OK);
    ASSERT_EQ(scaled, repeated);
    surface = nullptr;

    RefPtr<DataSourceSurface> source = Factory::CreateWrappingDataSourceSurface(
        full.data(), mSize.width * 4, mSize, SurfaceFormat::B8G8R8A8);
    ASSERT_TRUE(source);
    RefPtr<SharedContextWebgl> shared = SharedContextWebgl::Create();
    ASSERT_TRUE(shared);
    RefPtr<DrawTargetWebgl> target = new DrawTargetWebgl;
    // Exercise drawing below the production minimum-size admission heuristic.
    ASSERT_TRUE(target->Init(aDestination, SurfaceFormat::B8G8R8A8, shared));
    target->DrawSurface(source, Rect(Point(), Size(aDestination)),
                        Rect(Point(), Size(mSize)),
                        DrawSurfaceOptions(SamplingFilter::LINEAR),
                        DrawOptions(1.0f, CompositionOp::OP_SOURCE));
    RefPtr<SourceSurface> snapshot = target->Snapshot();
    ASSERT_TRUE(snapshot);
    EXPECT_EQ(snapshot->GetType(), SurfaceType::WEBGL);
    RefPtr<DataSourceSurface> result = snapshot->GetDataSurface();
    ASSERT_TRUE(result);
    DataSourceSurface::ScopedMap map(result, DataSourceSurface::READ);
    ASSERT_TRUE(map.IsMapped());
    size_t differences = 0;
    int maximum = 0;
    for (int y = 0; y < aDestination.height; ++y) {
      for (int x = 0; x < aDestination.width * 4; ++x) {
        const int actual = scaled[y * aDestination.width * 4 + x];
        const int expected = map.GetData()[y * map.GetStride() + x];
        const int delta = std::abs(actual - expected);
        differences += delta != 0;
        maximum = std::max(maximum, delta);
      }
    }
    RecordProperty("differentComponents", int(differences));
    RecordProperty("maximumChannelDelta", maximum);
    EXPECT_EQ(differences, 0u) << "maximum channel delta " << maximum;
    EXPECT_FALSE(shared->IsContextLost());
  }

  void CheckCallerState(const IntSize& aDestination, bool aScaled) {
    auto* gl = mWebgl->GL();
    RefPtr surface = new TexturePlaneSurface(gl, mSize, Planes(96, 80, 180));
    std::vector<uint8_t> expected;
    ASSERT_EQ(surface->Read(aDestination, aScaled, expected), NS_OK);
    const gl::ScopedTexture texture(gl);
    const gl::ScopedFramebuffer readFramebuffer(gl);
    const gl::ScopedFramebuffer drawFramebuffer(gl);
    SeedCallerState(gl, texture.Texture(), readFramebuffer.FB(),
                    drawFramebuffer.FB());
    ASSERT_EQ(gl->fGetError(), 0u);
    const auto before = CaptureCallerState(gl);
    std::vector<uint8_t> actual;
    for (int repeat = 0; repeat < 2; ++repeat) {
      ASSERT_EQ(surface->Read(aDestination, aScaled, actual), NS_OK);
      EXPECT_EQ(actual, expected);
      EXPECT_EQ(CaptureCallerState(gl), before);
      EXPECT_EQ(gl->fGetError(), 0u);
    }
  }

  void DrawComposed(std::vector<uint8_t>& aBytes, const IntSize& aSourceSize,
                    const IntSize& aDestination, float aAlpha, bool aSoftware,
                    std::vector<uint8_t>& aResult,
                    CompositionOp aOperation = CompositionOp::OP_OVER) {
    RefPtr<DataSourceSurface> source = Factory::CreateWrappingDataSourceSurface(
        aBytes.data(), aSourceSize.width * 4, aSourceSize,
        SurfaceFormat::B8G8R8A8);
    ASSERT_TRUE(source);
    RefPtr<DrawTarget> target;
    RefPtr<SharedContextWebgl> shared;
    if (aSoftware) {
      target = Factory::CreateDrawTarget(BackendType::SKIA, aDestination,
                                         SurfaceFormat::B8G8R8A8);
    } else {
      shared = SharedContextWebgl::Create();
      ASSERT_TRUE(shared);
      RefPtr<DrawTargetWebgl> accelerated = new DrawTargetWebgl;
      ASSERT_TRUE(
          accelerated->Init(aDestination, SurfaceFormat::B8G8R8A8, shared));
      target = accelerated;
    }
    ASSERT_TRUE(target);
    if (aSoftware) {
      EXPECT_EQ(target->GetBackendType(), BackendType::SKIA);
    }
    const Rect destination{Point(), Size(aDestination)};
    target->ClearRect(destination);
    target->DrawSurface(source, destination, Rect(Point(), Size(aSourceSize)),
                        DrawSurfaceOptions(SamplingFilter::LINEAR),
                        DrawOptions(aAlpha, aOperation));
    RefPtr<SourceSurface> snapshot = target->Snapshot();
    ASSERT_TRUE(snapshot);
    if (!aSoftware) {
      EXPECT_EQ(snapshot->GetType(), SurfaceType::WEBGL);
      EXPECT_FALSE(shared->IsContextLost());
    }
    RefPtr<DataSourceSurface> result = snapshot->GetDataSurface();
    ASSERT_TRUE(result);
    DataSourceSurface::ScopedMap map(result, DataSourceSurface::READ);
    ASSERT_TRUE(map.IsMapped());
    aResult.resize(size_t(aDestination.width) * aDestination.height * 4);
    for (int y = 0; y < aDestination.height; ++y) {
      std::copy_n(map.GetData() + y * map.GetStride(), aDestination.width * 4,
                  aResult.data() + y * aDestination.width * 4);
    }
  }

  void CompareComposed(const IntSize& aSource, const IntSize& aDestination,
                       float aAlpha, bool aSoftware) {
    std::array<std::vector<uint8_t>, 3> planes;
    for (size_t plane = 0; plane < planes.size(); ++plane) {
      const int width = plane ? aSource.width / 2 : aSource.width;
      const int height = plane ? aSource.height / 2 : aSource.height;
      planes[plane].resize(size_t(width) * height);
      for (int y = 0; y < height; ++y) {
        for (int x = 0; x < width; ++x) {
          planes[plane][y * width + x] = uint8_t(
              16 + (x * (43 + plane * 7) + y * (67 + plane * 11)) % 220);
        }
      }
    }
    RefPtr surface = new TexturePlaneSurface(mWebgl->GL(), aSource, planes);
    std::vector<uint8_t> full;
    std::vector<uint8_t> scaled;
    ASSERT_EQ(surface->Read(aSource, false, full), NS_OK);
    ASSERT_EQ(surface->Read(aDestination, true, scaled), NS_OK);
    ASSERT_EQ(mWebgl->GL()->fGetError(), 0u);
    surface = nullptr;
    std::vector<uint8_t> expected;
    std::vector<uint8_t> actual;
    DrawComposed(full, aSource, aDestination, aAlpha, aSoftware, expected);
    DrawComposed(scaled, aDestination, aDestination, aAlpha, aSoftware, actual);
    ASSERT_EQ(expected.size(),
              size_t(aDestination.width) * aDestination.height * 4);
    ASSERT_EQ(actual.size(), expected.size());
    size_t differences = 0;
    int maximum = 0;
    for (size_t i = 0; i < actual.size(); ++i) {
      const int delta = std::abs(int(actual[i]) - int(expected[i]));
      differences += delta != 0;
      maximum = std::max(maximum, delta);
    }
    RecordProperty("sourceWidth", aSource.width);
    RecordProperty("sourceHeight", aSource.height);
    RecordProperty("destinationWidth", aDestination.width);
    RecordProperty("destinationHeight", aDestination.height);
    RecordProperty("halfAlpha", aAlpha == 0.5f ? 1 : 0);
    RecordProperty("softwareTarget", aSoftware ? 1 : 0);
    RecordProperty("differentComponents", int(differences));
    RecordProperty("maximumChannelDelta", maximum);
    EXPECT_EQ(differences, 0u) << "maximum channel delta " << maximum;

    std::vector<uint8_t> opaqueReference;
    std::vector<uint8_t> stagedReference;
    std::vector<uint8_t> sourceReference;
    DrawComposed(full, aSource, aDestination, 1.0f, aSoftware, opaqueReference);
    ASSERT_EQ(opaqueReference.size(), expected.size());
    DrawComposed(opaqueReference, aDestination, aDestination, aAlpha, aSoftware,
                 stagedReference);
    ASSERT_EQ(stagedReference.size(), expected.size());
    DrawComposed(full, aSource, aDestination, 1.0f, aSoftware, sourceReference,
                 CompositionOp::OP_SOURCE);
    ASSERT_EQ(sourceReference.size(), scaled.size());
    auto recordComparison = [&](const std::string& aName,
                                const std::vector<uint8_t>& aLeft,
                                const std::vector<uint8_t>& aRight) {
      size_t count = 0;
      int deltaMaximum = 0;
      for (size_t i = 0; i < aLeft.size(); ++i) {
        const int delta = std::abs(int(aLeft[i]) - int(aRight[i]));
        count += delta != 0;
        deltaMaximum = std::max(deltaMaximum, delta);
      }
      RecordProperty(aName + "Differences", int(count));
      RecordProperty(aName + "MaximumDelta", deltaMaximum);
    };
    recordComparison("stagedToReference", stagedReference, expected);
    recordComparison("candidateToStaged", actual, stagedReference);
    recordComparison("rawReadbackToSource", scaled, sourceReference);
  }

  void CheckFailure(const IntSize& aSource, const IntSize& aDestination,
                    int aMissingPlane, GLenum aExpectedError) {
    auto* gl = mWebgl->GL();
    RefPtr surface = new TexturePlaneSurface(gl, mSize, Planes(96, 80, 180));
    std::vector<uint8_t> expected;
    ASSERT_EQ(surface->Read(IntSize(4, 2), true, expected), NS_OK);
    surface->SetReportedSize(aSource);
    surface->SetMissingPlane(aMissingPlane);
    const gl::ScopedTexture texture(gl);
    const gl::ScopedFramebuffer readFramebuffer(gl);
    const gl::ScopedFramebuffer drawFramebuffer(gl);
    SeedCallerState(gl, texture.Texture(), readFramebuffer.FB(),
                    drawFramebuffer.FB());
    ASSERT_EQ(gl->fGetError(), 0u);
    const auto before = CaptureCallerState(gl);
    std::vector<uint8_t> actual;
    EXPECT_EQ(surface->Read(aDestination, true, actual, 0xA5),
              NS_ERROR_FAILURE);
    EXPECT_TRUE(std::all_of(actual.begin(), actual.end(),
                            [](uint8_t value) { return value == 0xA5; }));
    EXPECT_EQ(CaptureCallerState(gl), before);
    EXPECT_EQ(gl->fGetError(), aExpectedError);
    EXPECT_EQ(gl->fGetError(), 0u);
    surface->SetReportedSize(mSize);
    surface->SetMissingPlane(-1);
    ASSERT_EQ(surface->Read(IntSize(4, 2), true, actual), NS_OK);
    EXPECT_EQ(actual, expected);
    EXPECT_EQ(CaptureCallerState(gl), before);
    EXPECT_EQ(gl->fGetError(), 0u);
  }
};

TEST_F(DMABufReadback, ConstantColorMatchesFullSizeThenScale) {
  Compare(Planes(96, 80, 180), IntSize(4, 2));
}

TEST_F(DMABufReadback, SameSizeMatchesFullSize) {
  auto planes = Planes(16, 16, 240);
  for (size_t i = 1; i < planes[0].size(); i += 2) {
    planes[0][i] = 235;
  }
  Compare(planes, mSize);
}

TEST_F(DMABufReadback, SaturatedLumaMatchesFullSizeThenScale) {
  auto planes = Planes(16, 16, 240);
  for (size_t i = 1; i < planes[0].size(); i += 2) {
    planes[0][i] = 235;
  }
  Compare(planes, IntSize(4, 2));
}

TEST_F(DMABufReadback, ChromaEdgesMatchFullSizeThenScale) {
  auto planes = Planes(128, 16, 240);
  for (size_t i = 1; i < planes[1].size(); i += 2) {
    planes[1][i] = 240;
    planes[2][i] = 16;
  }
  Compare(planes, IntSize(4, 2));
}

TEST_F(DMABufReadback, NeutralLumaMatchesFullSizeThenScale) {
  auto planes = Planes(16, 128, 128);
  for (size_t i = 1; i < planes[0].size(); i += 2) {
    planes[0][i] = 235;
  }
  Compare(planes, IntSize(4, 2));
}

TEST_F(DMABufReadback, OddSizeMatchesFullSizeThenScale) {
  auto planes = Planes(16, 16, 240);
  for (size_t i = 0; i < planes[0].size(); ++i) {
    planes[0][i] = uint8_t(16 + (i * 43) % 220);
  }
  Compare(planes, IntSize(3, 3));
}

TEST_F(DMABufReadback, EmptyDestinationRejectsWithoutPoisoningReadback) {
  RefPtr surface =
      new TexturePlaneSurface(mWebgl->GL(), mSize, Planes(96, 80, 180));
  std::vector<uint8_t> bytes;
  EXPECT_EQ(surface->Read(IntSize(), true, bytes), NS_ERROR_FAILURE);
  EXPECT_TRUE(bytes.empty());
  EXPECT_EQ(surface->Read(IntSize(4, 2), true, bytes), NS_OK);
  EXPECT_EQ(bytes.size(), 32u);
  EXPECT_EQ(mWebgl->GL()->fGetError(), 0u);
}

TEST_F(DMABufReadback, ScaledReadbackPreservesCallerState) {
  CheckCallerState(IntSize(4, 2), true);
}

TEST_F(DMABufReadback, FullSizeReadbackPreservesCallerState) {
  CheckCallerState(mSize, false);
}

TEST_F(DMABufReadback, SourceAllocationFailureRestoresStateAndRecovers) {
  const auto limit = mWebgl->GL()->GetIntAs<GLint>(LOCAL_GL_MAX_TEXTURE_SIZE);
  ASSERT_GT(limit, 0);
  ASSERT_LT(limit, 131072);
  CheckFailure(IntSize(limit + 1, 4), IntSize(4, 2), -1,
               LOCAL_GL_INVALID_VALUE);
}

TEST_F(DMABufReadback, DestinationAllocationFailureRestoresStateAndRecovers) {
  const auto limit = mWebgl->GL()->GetIntAs<GLint>(LOCAL_GL_MAX_TEXTURE_SIZE);
  ASSERT_GT(limit, 0);
  ASSERT_LT(limit, 131072);
  CheckFailure(mSize, IntSize(limit + 1, 2), -1, LOCAL_GL_INVALID_VALUE);
}

TEST_F(DMABufReadback, MissingPlaneRejectsAndRecovers) {
  CheckFailure(mSize, IntSize(4, 2), 1, LOCAL_GL_NO_ERROR);
}

TEST_F(DMABufReadback, EmptySourceRejectsAndRecovers) {
  CheckFailure(IntSize(), IntSize(4, 2), -1, LOCAL_GL_NO_ERROR);
}

TEST_F(DMABufReadback, BT601MatchesFullSizeThenScale) {
  auto planes = Planes(16, 16, 240);
  for (size_t i = 1; i < planes[0].size(); i += 2) {
    planes[0][i] = 235;
  }
  Compare(planes, IntSize(4, 2), YUVColorSpace::BT601);
}

TEST_F(DMABufReadback, BT2020MatchesFullSizeThenScale) {
  auto planes = Planes(16, 16, 240);
  for (size_t i = 1; i < planes[0].size(); i += 2) {
    planes[0][i] = 235;
  }
  Compare(planes, IntSize(4, 2), YUVColorSpace::BT2020);
}

TEST_F(DMABufReadback, VideoLinearCompositionMatches) {
  CompareComposed(IntSize(1920, 1080), IntSize(320, 180), 1.0f, false);
}

TEST_F(DMABufReadback, VideoOddCompositionMatches) {
  CompareComposed(IntSize(1920, 1080), IntSize(321, 181), 1.0f, false);
}

TEST_F(DMABufReadback, VideoAlphaCompositionMatches) {
  CompareComposed(IntSize(1920, 1080), IntSize(320, 180), 0.5f, false);
}

TEST_F(DMABufReadback, VideoSoftwareCompositionMatches) {
  CompareComposed(IntSize(1920, 1080), IntSize(320, 180), 1.0f, true);
}

TEST_F(DMABufReadback, VideoOddSoftwareCompositionMatches) {
  CompareComposed(IntSize(1920, 1080), IntSize(321, 181), 1.0f, true);
}

TEST_F(DMABufReadback, VideoAlphaSoftwareCompositionMatches) {
  CompareComposed(IntSize(1920, 1080), IntSize(320, 180), 0.5f, true);
}

TEST_F(DMABufReadback, SmallAlphaCompositionMatches) {
  CompareComposed(mSize, IntSize(4, 2), 0.5f, false);
}

TEST_F(DMABufReadback, SmallSoftwareCompositionMatches) {
  CompareComposed(mSize, IntSize(4, 2), 1.0f, true);
}

}  // namespace mozilla::gfx
