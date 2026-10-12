/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#include <limits>

#include "DrawTargetWebgl.h"
#include "gfxPlatform.h"
#include "gtest/gtest.h"
#include "mozilla/layers/LayersSurfaces.h"

namespace mozilla::gfx {

class CanvasSurfaceImport : public ::testing::Test {
 protected:
  RefPtr<SharedContextWebgl> mContext;

  void SetUp() override {
    gfxPlatform::GetPlatform();
    mContext = SharedContextWebgl::Create();
    if (!mContext) {
      GTEST_SKIP() << "No usable accelerated canvas context.";
    }
    ASSERT_FALSE(mContext->IsContextLost());
  }
};

TEST_F(CanvasSurfaceImport, UnusableDescriptorDoesNotPublishSurface) {
  const layers::SurfaceDescriptor descriptor;
  RefPtr<SourceSurface> surface = mContext->ImportSurfaceDescriptor(
      nullptr, descriptor, IntSize(16, 16), SurfaceFormat::B8G8R8A8, true);
  EXPECT_FALSE(surface);
  EXPECT_FALSE(mContext->IsContextLost());
}

TEST_F(CanvasSurfaceImport, RepeatedUnusableDescriptorsDoNotPublishSurfaces) {
  const layers::SurfaceDescriptor descriptor;
  for (int iteration = 0; iteration < 16; ++iteration) {
    RefPtr<SourceSurface> surface = mContext->ImportSurfaceDescriptor(
        nullptr, descriptor, IntSize(16, 16), SurfaceFormat::B8G8R8A8, true);
    EXPECT_FALSE(surface) << iteration;
    ASSERT_FALSE(mContext->IsContextLost());
  }
}

TEST_F(CanvasSurfaceImport, OversizedAllocationDoesNotPublishSurface) {
  const layers::SurfaceDescriptor descriptor;
  RefPtr<SourceSurface> surface = mContext->ImportSurfaceDescriptor(
      nullptr, descriptor, IntSize(std::numeric_limits<int32_t>::max(), 16),
      SurfaceFormat::B8G8R8A8, true);
  EXPECT_FALSE(surface);
  EXPECT_FALSE(mContext->IsContextLost());
}

TEST_F(CanvasSurfaceImport, DefaultDescriptorBehaviorIsUnchanged) {
  const layers::SurfaceDescriptor descriptor;
  RefPtr<SourceSurface> surface = mContext->ImportSurfaceDescriptor(
      nullptr, descriptor, IntSize(16, 16), SurfaceFormat::B8G8R8A8);
  EXPECT_TRUE(surface);
  EXPECT_FALSE(mContext->IsContextLost());
}

}  // namespace mozilla::gfx
