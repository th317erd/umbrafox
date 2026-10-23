# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

"""Source-contract checks, not compositor/runtime or performance tests."""

import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
NATIVE = (ROOT / "gfx/layers/NativeLayerWayland.cpp").read_text()
SURFACE = (ROOT / "widget/gtk/WaylandSurface.cpp").read_text()


def body(source, name):
    start = source.index("{", source.index(name))
    depth = 1
    end = start + 1
    while depth:
        depth += (source[end] == "{") - (source[end] == "}")
        end += 1
    return source[start + 1 : end - 1]


class EGLVsyncSourceContract(unittest.TestCase):
    def test_successful_prepare_registers_child_after_attach(self):
        code = body(NATIVE, "bool NativeLayerRootWayland::PrepareForEGL(")
        self.assertIn("SetEGLVSyncSourceLocked", code)
        self.assertLess(
            code.index("const bool prepared"), code.rindex("SetEGLVSyncSourceLocked")
        )
        self.assertIn(
            "prepared ? mEGLExternalLayer->GetWaylandSurface() : nullptr", code
        )

    def test_rejection_and_clear_retire_source(self):
        code = body(NATIVE, "bool NativeLayerRootWayland::PrepareForEGL(")
        self.assertIn("SetEGLVSyncSourceLocked(aProofOfLock, nullptr)", code)
        self.assertLess(
            code.index("SetEGLVSyncSourceLocked"), code.index("HideForEGL()")
        )
        code = body(NATIVE, "void NativeLayerRootWayland::ClearForEGL(")
        self.assertIn("SetEGLVSyncSourceLocked(aProofOfLock, nullptr)", code)
        self.assertLess(
            code.index("SetEGLVSyncSourceLocked"),
            code.index("mEGLExternalLayer->ClearForEGL()"),
        )

    def test_parent_observer_state_is_mirrored(self):
        code = body(SURFACE, "void WaylandSurface::SetVSyncCallbackStateLocked(")
        self.assertIn("mEGLVSyncSource->SetVSyncCallbackStateLocked", code)

    def test_unregister_disables_before_releasing_handler(self):
        self.assertTrue("void WaylandSurface::SetEGLVSyncSourceLocked(" in SURFACE)
        code = body(SURFACE, "void WaylandSurface::SetEGLVSyncSourceLocked(")
        self.assertLess(
            code.index("SetVSyncCallbackStateLocked(lock, false)"),
            code.index("ClearVSyncCallbackHandlerLocked(lock)"),
        )
        self.assertIn("++mEGLVSyncGeneration", code)
        self.assertIn("mVSyncCallbackEnabled", code)

    def test_routed_callback_checks_lifecycle_and_unlocks_before_delivery(self):
        self.assertTrue("void WaylandSurface::EGLVSyncCallbackHandler(" in SURFACE)
        code = body(SURFACE, "void WaylandSurface::EGLVSyncCallbackHandler(")
        for condition in (
            "!mIsMapped",
            "!mVSyncCallbackEnabled",
            "!mEGLVSyncSource",
            "aGeneration != mEGLVSyncGeneration",
        ):
            self.assertIn(condition, code)
        self.assertIn("AssertIsOnMainThread()", code)
        self.assertIn("WaylandSurfaceLock lock(this)", code)
        self.assertIn("SetVSyncCallbackLocked(lock)", code)
        self.assertIn("lock.RequestForceCommit()", code)
        self.assertRegex(
            code, r"\}\s+if \(cb.IsSet\(\)\) \{\s+cb.mCb\(nullptr, aTime, false\)"
        )

    def test_no_native_root_takeover_or_forced_composition(self):
        code = body(NATIVE, "bool NativeLayerRootWayland::PrepareForEGL(")
        self.assertNotIn("CommitToScreen", code)
        self.assertNotIn("ScheduleForced", code)
        code = body(NATIVE, "NativeLayerRootWayland::CreateForEGL(")
        self.assertNotIn("->Init()", code)

    def test_obsolete_protocol_callback_cannot_consume_replacement(self):
        code = body(SURFACE, "void WaylandSurface::VSyncCallbackHandler(")
        self.assertRegex(
            code,
            r"if \(aCallback && mVSyncFrameCallback.get\(\) != aCallback\) \{\s+return;",
        )
        self.assertLess(
            code.index("mVSyncFrameCallback.get() != aCallback"),
            code.index("mVSyncFrameCallback = nullptr"),
        )
        self.assertLess(
            code.index("mVSyncFrameCallback.get() != aCallback"),
            code.index("cb = mVSyncCallbackHandler"),
        )

    def test_same_child_keeps_pending_callback(self):
        code = body(SURFACE, "void WaylandSurface::SetEGLVSyncSourceLocked(")
        self.assertRegex(code, r"if \(mEGLVSyncSource == aSource\) \{\s+return;")
        self.assertLess(
            code.index("mEGLVSyncSource == aSource"),
            code.index("++mEGLVSyncGeneration"),
        )

    def test_disabled_parent_does_not_arm_initial_child(self):
        code = body(SURFACE, "void WaylandSurface::SetEGLVSyncSourceLocked(")
        self.assertLess(
            code.index("SetVSyncCallbackStateLocked(lock, mVSyncCallbackEnabled)"),
            code.index("mEGLVSyncSource->SetVSyncCallbackHandlerLocked"),
        )
        self.assertIn("generation = mEGLVSyncGeneration", code)
        self.assertIn("if (!aEmulated)", code)

    def test_unmap_and_shutdown_retire_registration(self):
        code = body(SURFACE, "void WaylandSurface::UnmapLocked(")
        self.assertLess(
            code.index("mEGLExternalRoot->ClearForEGL"), code.index("mIsMapped = false")
        )
        code = body(NATIVE, "void NativeLayerRootWayland::ShutdownForEGL(")
        self.assertLess(
            code.index("ClearForEGL(aProofOfLock)"),
            code.index("SetEGLExternalRootLocked"),
        )
        code = body(SURFACE, "void WaylandSurface::ClearVSyncCallbackHandlerLocked(")
        self.assertIn("SetEGLVSyncSourceLocked(aProofOfLock, nullptr)", code)

    def test_source_requires_a_parent_consumer(self):
        code = body(SURFACE, "void WaylandSurface::SetEGLVSyncSourceLocked(")
        self.assertRegex(
            code, r"if \(!mVSyncCallbackHandler.IsSet\(\)\) \{\s+aSource = nullptr;"
        )
        self.assertLess(
            code.index("!mVSyncCallbackHandler.IsSet()"),
            code.index("mEGLVSyncSource == aSource"),
        )

    def test_existing_root_handlers_are_not_replaced(self):
        code = body(SURFACE, "void WaylandSurface::SetEGLVSyncSourceLocked(")
        self.assertNotIn("mVSyncCallbackHandler =", code)
        for handler in (
            "SetMapCallbackLocked",
            "SetUnmapCallbackLocked",
            "SetGdkCommitCallbackLocked",
            "SetVSyncEmulateCheckLocked",
            "SetVSyncCallbackStateHandlerLocked",
        ):
            self.assertNotIn(handler, code)

    def test_successful_egl_swap_records_attachment_without_visibility(self):
        code = body(SURFACE, "void WaylandSurface::NotifyEGLSwapLocked(")
        self.assertIn("mBufferAttached = true;", code)
        self.assertNotIn("mIsVisible =", code)
        self.assertIn("mSurfaceNeedsCommit = false;", code)
        egl = (ROOT / "gfx/webrender_bindings/RenderCompositorEGL.cpp").read_text()
        end_frame = body(egl, "RenderedFrameId RenderCompositorEGL::EndFrame(")
        swapped = body(end_frame, "if (swapped)")
        self.assertIn("NotifyEGLSwapLocked", swapped)
        self.assertEqual(end_frame.count("NotifyEGLSwapLocked"), 1)


if __name__ == "__main__":
    unittest.main()
