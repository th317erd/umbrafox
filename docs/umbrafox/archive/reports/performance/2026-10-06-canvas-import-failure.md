# Canvas Import Failure Propagation

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Result

Native regression tests reproduced a real failure-handling defect in the GPU
import candidate: an unusable surface descriptor could still publish a surface.
The correction propagates the existing internal upload result to the importer,
allowing its caller to take the existing readback fallback instead. All 17
targeted native tests now pass, with zero skips, on `wyatt-laptop`.

This is a correctness prerequisite, not a measured performance improvement or
an identified cause of intermittent YouTube stutter. The earlier 48-case pixel
gate belongs to the frozen reference package, not this newly compiled library.
No daily browser, profile, launcher, installation or default preference changed.

## Defect And Scope

`SharedContextWebgl::ImportSurfaceDescriptor` previously ignored the upload
outcome because `WebGLContext::TexImage` and `WebGLTexture::TexImage` returned
void. The latter has 19 failure exits. Additionally, a failed descriptor blit
can clear a diagnostic color and report success when fallback is disabled.
Checking only a GL error would not detect all these failures.

The correction changes those two internal methods to return success/failure,
without changing their upload operations, validation or existing error reports.
`SharedContextWebgl::UploadSurface` forwards that result while retaining binding
and PBO restoration. The importer rejects failed allocation/upload or observed
context loss before publishing a surface when its recovery option is enabled.

Ordinary external-canvas import must preserve its previous behavior. The new
`aAllowFallback` argument defaults to false; only
`CanvasTranslator::GetZeroCopySurfaceFromDMABuf` passes true. A corresponding
internal descriptor field also defaults to false and is not serialized.
`ResolveExternalSnapshot`, the public WebGL interface and the void IPC wrapper
retain their existing contracts. Existing callers that ignore upload success
continue to do so. No new synchronous GPU wait or error query was introduced.

Only nine production files changed relative to the saved starting snapshot,
plus native tests and their build registration. Other changes in the checkout,
including destination format handling and V2 scaled readback, predate this work.
`native-green-source.patch` records the whole tracked checkout for provenance,
not a claim that this task authored that entire diff.

## Verification

| Gate | Result |
| --- | --- |
| Native before correction | 13 executed, 2 failed, 11 passed, 0 skipped |
| Repeated invalid import before correction | 16 failing assertions |
| Final native tests | 17 passed, 0 failed, 0 skipped |
| Harness and source contracts | 6 passed |
| Final engine build | 432 seconds, 0 compiler warnings |
| Final native test-library build | 17 seconds, 0 compiler warnings |
| Exact 12-file lint | 0 errors, warnings or fixes |
| Scoped diff whitespace | PASS |

Native coverage includes single/repeated unusable import, oversized allocation,
unchanged default import behavior, a failed descriptor returning false without
setting a GL error, supplied-surface fallback, and unchanged default descriptor
behavior. The existing ten texture initialization regressions also pass,
including full/partial uploads, failed mapping, copy and compressed uploads.

The source contracts check all 19 upload failure returns, byte-identical
`HostWebGLContext.h` and `WebGLIpdl.h`, and the single strict DMABuf opt-in.
They supplement real native tests; they do not substitute for GPU recovery
or end-to-end browser tests. Raw native runtime durations are not benchmarks.

Initial attempts are retained: desktop headless execution skipped all 13 tests;
the first laptop bundle lacked `dependentlibs.list.gtest`; a subsequent copied
file mode mismatch was caught before launch. Neither is counted as a passing
regression. The repaired RED bundle executed the actual failing assertions.
An intermediate broader implementation compiled but was not executed or
installed; the final tests use the candidate-only correction.

## Diagnostic Provenance And Cleanup

Evidence root: `artifacts/umbralink-control/import-safety/`.
`before.json` and `source-before/` preserve the starting source;
`after.json` and `source-after/` preserve the final source.
`native-comparison.json` validates both saved test inventories independently.
The staged patch remained byte-identical throughout.

The GREEN bundle is the reference runtime plus a separately rebuilt gtest
library. It is not a releasable package and was not installed. Its compatibility
build date is `20261006052600`; hashes distinguish it from the reference and RED
libraries. Current object files include the restored V2 working source, unlike
the frozen full-size reference. A future playback package needs an explicit
source decision and new provenance rather than reusing the old pixel verdict.

- GREEN test library: 358329392 bytes,
  SHA256 `8a934a44af945925ce15287ba404d9fb4b5e26323ab570a82a9ea32835b77d9c`.
- GREEN manifest: 48 files, 833449280 bytes,
  SHA256 `6ac3f4b1937b45f78712d3673f8aff5ea43ce101b8df0791fb22265cd1cdd5cb`.
- Source manifest SHA256:
  `5e126e4a731d70d618c890286ad696e2654c9f455ff8a8835c910198b42c6c15`.
- Laptop harness:
  `~/.cache/codex/canvas-import-gtest-harness-20261006-Rs7yRr`.
- GREEN run:
  `~/.cache/codex/canvas-import-green-f0ecbab3-269f-4285-b66a-502dba06a0fd`.
- Controller/test/probe PIDs: 1335599 / 1335611 / 1335613, all explicitly absent.

Admission and post-run checks verified all 48 files. Native exit was zero,
cleanup clean, and the bounded log contained 6235 bytes. Local exported
launch/receipt/results/log hashes match independently read remote hashes.
The controller used a 45-second total budget, a 30-second work deadline, retained
child ownership and bounded cleanup. Fresh private application/local/temp roots
were used; no personal profile or shared crash queue was inspected.

Although DISPLAY was `:0`, GTest reports headless mode. These are executed native
GL-context tests, not proof of a particular hardware driver, display pipeline or
video decoder. The sandbox namespace EPERM warning remains in the log. Recorded
PID absence is not complete observation of every transient helper. No profiler
or concurrent compilation ran during the native test.

## Parity Review And Remaining Gates

The recovery option is internal and default-false; the candidate preference
`gfx.canvas.remote.use-draw-image-fast-path-dmabuf` remains false. No new WebIDL,
JS global, CSS surface, network behavior, preference default, shader or public
error contract was introduced. Serialization and the IPC wrapper are unchanged.
Native default-path tests pass, but broad WebGL conformance and all page-visible
behavior are not established by this limited suite.

Remaining correctness gaps are valid DMABuf import after failed pooled attempts,
context loss before/during upload, driver OOM/incomplete framebuffer/unsupported
modifier injection, and forced end-to-end CanvasTranslator fallback. The code
guards observed failures; those hardware/lifecycle scenarios were not injected.
Do not describe oversized allocation rejection as a real driver OOM test.

Next, close the useful failure/lifecycle gaps without adding a public test API,
then build a clearly identified candidate and run same-build pixel verification
and alternating sustained moving-video trials with equal observer cost. No
default enable, daily installation, universal Firefox parity, sustained speedup
or YouTube-stutter fix is accepted by this report.
