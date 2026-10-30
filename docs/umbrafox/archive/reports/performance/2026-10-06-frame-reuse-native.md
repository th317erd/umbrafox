# Native Frame Reuse And Forced Loss

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Result

The isolated laptop native run passes all 53 tests with zero skips or errors:
the preceding 40 readback/IPC regressions, four existing descriptor-import tests,
and nine new cache tests. The new cases use actual DMABuf descriptors, native
texture hosts and Intel Iris Xe GL textures. Repeated admitted imports return
the same native surface; releasing its wrapper preserves reuse of the existing
texture handle. Exact red/green pixel assertions pass after those identity checks.

Forced WebGL context loss rejects an old-context import and clears the cache.
A newly created shared context imports the retained descriptor successfully,
reuses its new surface and returns the expected pixels. This is a native
mechanism test, not a physical driver reset, decoder restart, automatic
CanvasTranslator recovery or observed playback hit frequency. No new playback
speedup or stutter fix is claimed. Experimental import remains default OFF;
the daily browser, profile and installation were not touched.

## Test Scope

The only source changes are the new GTK-only
`dom/canvas/gtest/TestCanvasVideoSurfaceCache.cpp`, its gtest build registration,
and a friend declaration in `SharedContextWebgl` for that test fixture. No
production method body, class layout, public API, shader, preference default,
pixel tolerance or normal package changed. The final source guard checks all
66 recorded source inputs, unchanged staged patch/configuration/HEAD, and the
exact two-line integration delta against the saved header/build file.

Tests exercise live-wrapper hits, released-wrapper handle reuse, new frame IDs,
different hosts with the same ID, absent identities, generic-import invalidation,
readback invalidation, explicit clearing, memory pressure, failed upload,
oversized allocation, and forced loss followed by explicit context replacement.
Generic imports provide a control: they return distinct live surfaces, so the
same-pointer test cannot pass merely because identical pixels were uploaded.
Readbacks occur after the reuse assertions; an early read cannot suppress all
hits and still satisfy the test. Inputs are synthetic 16x16 RGBA DMABufs, not
decoded YUV video frames or actual recorded drawing events.

### Headless Policy Boundary

The first actual run passed 44 tests and failed all nine new tests during
DMABuf setup. The native application runner unconditionally enables headless
mode for gtests, regardless of DISPLAY or removal of an ambient headless value.
See the [upstream startup assignment](https://searchfox.org/firefox-main/rev/4b5e436b8bc908fe7feb7341209140771397dda1/toolkit/xre/nsAppRunner.cpp#4544).
The local DMABuf implementation refuses imports when the software-compositor
policy flag is true. This failure does not establish that its WebGL context was
software; the original test did not record that context's renderer.

The revised fixture creates the real WebGL context first, records its native
vendor/renderer, requires a supported desktop hardware vendor and EGL-image
extension, and excludes llvmpipe. Only the test then temporarily sets the
software-compositor policy false. TearDown restores the original value, including
after fatal setup/test assertions. All nine final receipts report Intel,
Mesa Intel Iris Xe Graphics (RPL-P), original policy 1, and restoration 1.
The original production guard remains intact. Unsupported test environments can
skip, but this diagnostic runner rejects any skipped test as nonacceptance.

This deliberately scoped test-policy setup cannot prove normal browser route
admission. The earlier headed pixel matrices provide separate browser evidence;
their success does not supply missing native hit counts. No test flag or setter
was exposed to page JavaScript.

## Build And Execution

The first compile failed on an explicit weak-pointer constructor in test code.
The corrected build passed in 49.37 seconds; the final test-policy build passed
in 18.20 seconds. Both used `mach build -j2 recurse_gtest --priority idle`,
`CARGO_BUILD_JOBS=2` and pinned BuildID 20261006175655. Both report zero compiler
warnings. The initial compile and setup failures remain preserved and are not
presented as production behavioral REDs.

The final diagnostic overlay contains the unchanged normal 46-file frame-reuse
package plus its gtest library/dependency list. It is not a new daily package.
Final 48-file manifest: 98f882428d201bb45a0711b64ae22c50bc5f7de19f789b6e80668b88869acaae.
Gtest library: 358572120 bytes, SHA256
2ef6f77bff9b0c7ae1c6f0bf55b772d4479591cbc30f111e0b16649b92e282b9.
The native toolkit note matches the base package's BuildID; source and library
hashes, not that shared BuildID alone, distinguish the two diagnostic builds.

The 150-file harness preserves all 146 prior shared inputs. Its hash is
1cb4ac4773e2dfaee3e09ffb1bcf6dcc805eba266b1fae9221f5edbd37c56751.
The runner differs from the preceding native driver only in artifact namespace
and the two extra test suites. Its 45-second total/30-second work limit,
retained process ownership, bounded logs, cleanup and exact package checks remain.
Each run used fresh owned application/local/temp roots; no private payload was
exported. This is not a whole-host or network sandbox claim.

| Run | Native / Controller PID | Result | Log Bytes |
| --- | --- | --- | ---: |
| Initial headless policy | 1772802 / 1772790 | 44 pass, 9 setup failures | 20605 |
| Hardware test setup | 1779422 / 1779410 | 53 pass, 0 skips | 13528 |

The final test suite reports 0.764 seconds, not a rendering performance result.
Both processes exited normally and cleanup passed; no SIGKILL was used.
Independent post-run checks found all ten recorded root/helper/IPC PIDs absent.
The final absence receipt is 2026-10-07T02:09:13.685Z. Gtest timestamps carry local
clock values despite their Z suffix; do not join those values as UTC. Both
package postchecks retain all 48 files. Eight public export files were rehashed.
Logs preserve the sandbox EPERM warning, intentional unusable-descriptor errors,
and a framebuffer-attachment warning after deliberate context loss. They are
not warning-free logs or evidence of real driver failure.

Five offline test groups validate exact driver changes, old test retention,
inventory, saved results, hardware/policy receipts, failure preservation and
cleanup. Twelve corrupted final evidence variants reject. Scoped native lint
passes with zero problems. Source-region cache regressions are recorded
separately and do not substitute for these actual GL tests.

Evidence is under `artifacts/umbralink-control/import-reuse-native-context/`.
`summary-final.json` is authoritative; the earlier derived `summary.json` used
an ambiguous hardware field name and is retained, not treated as proof that
the first context lacked hardware. Raw exports and their hashes are unchanged.

## Next Gate

P2 now has actual native cache-hit and forced-loss/replacement evidence in
addition to the previous exact browser pixel matrices. Automatic translator
recovery and effective normal-playback reuse frequency remain unproved. Verify
the recording/translation batch behavior before treating the cache as a video
optimization, then execute the fixed A1/B1/B2/A2 performance comparison against
the immediate pre-cache package. Keep the earlier smoothness failures and
renderer-label CPU increase unresolved. No installation follows from this gate.
