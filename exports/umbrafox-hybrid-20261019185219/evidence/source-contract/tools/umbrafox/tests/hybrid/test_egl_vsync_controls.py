# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

import unittest
from unittest.mock import patch

import test_egl_vsync_source as contract


class EGLVsyncContractControls(unittest.TestCase):
    def test_removed_lifecycle_guards_are_detected(self):
        mutations = (
            ("SURFACE", "mBufferAttached = true;", ";"),
            ("SURFACE", "lock.RequestForceCommit();", ";"),
            ("SURFACE", "aCallback && mVSyncFrameCallback.get() != aCallback", "false"),
            (
                "SURFACE",
                "mEGLVSyncSource->SetVSyncCallbackStateLocked(lock, aEnabled);",
                ";",
            ),
            ("SURFACE", "mEGLVSyncSource == aSource", "false"),
            ("SURFACE", "aGeneration != mEGLVSyncGeneration", "false"),
            ("SURFACE", "mEGLVSyncSource->ClearVSyncCallbackHandlerLocked(lock);", ";"),
            (
                "SURFACE",
                "SetVSyncCallbackStateLocked(lock, mVSyncCallbackEnabled)",
                "SetVSyncCallbackStateLocked(lock, true)",
            ),
            (
                "SURFACE",
                "WaylandSurfaceLock lock(this);",
                "WaylandSurfaceLock lock(this, true);",
            ),
            (
                "NATIVE",
                "mRootSurface->SetEGLVSyncSourceLocked(aProofOfLock, nullptr);",
                ";",
            ),
            (
                "NATIVE",
                "prepared ? mEGLExternalLayer->GetWaylandSurface() : nullptr",
                "mEGLExternalLayer->GetWaylandSurface()",
            ),
        )
        for source, before, after in mutations:
            with self.subTest(guard=before):
                original = getattr(contract, source)
                self.assertIn(before, original)
                with patch.object(contract, source, original.replace(before, after)):
                    result = unittest.TestResult()
                    unittest.defaultTestLoader.loadTestsFromTestCase(
                        contract.EGLVsyncSourceContract
                    ).run(result)
                self.assertFalse(result.wasSuccessful(), before)


if __name__ == "__main__":
    unittest.main()
