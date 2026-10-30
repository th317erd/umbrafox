# Video Frame Conversion Reuse

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Status

The P1 implementation and compiled mechanism checks pass. The final normal
browser build succeeds in 48 seconds with zero compiler warnings. Packaging and
40 native readback/IPC regressions pass. Real-GPU pixel/error/lifetime tests and
balanced playback measurements remain open. There is no new measured speedup or
stutter-fix claim. Direct GPU import
remains default OFF and the candidate is not installed in the daily browser.

## Implementation

Only DrawTargetWebgl and CanvasTranslator headers/implementations change in this
phase, plus two focused tests. The original dirty work and staged index remain
intact. A shared WebGL context retains one short-lived exact TextureHost/frame-ID
key and a weak reference to the existing texture handle. It does not retain an
extra source surface or texture allocation merely for reuse.

Every lookup still performs the normal content/bridge host lookup and descriptor
admission. A hit checks context, frame identity, handle validity, dimensions,
format, offset, ownership and readback state. A live surface owner is reused;
only a handle with no live owner gets a new wrapper. Normal MRU tracking is
preserved. Invalid or unknown state falls through to the original conversion.

Reuse is restricted to a translation batch. Generic imports, relevant texture
writes, transaction/batch exits, failed admission, memory-pressure cache clearing,
context replacement and shutdown clear the entry. Reentry cannot restore stale
outer state. The cross-thread memory-pressure notification retains its existing
atomic behavior; pending pressure prevents hits/publication until owning-thread
cleanup. There is no new public API, preference, shader, filtering rule or pixel
arithmetic in this phase.

## Verification

- Original four-copy mechanism: four conversions; candidate: one conversion.
- Final compiled source-region suite: 28 cases, zero failures. This compiles
  actual cache, admission, translation and context-replacement regions with
  stand-ins for GL, IPC, ownership and related types. It is not a Gecko GPU test.
- Cases cover frame/host changes, invalid IDs, expired handles, live/dead owners,
  texture writes, readback state, pressure, failed conversion, context loss,
  unsupported input, batch exits and nested translation.
- A new context-replacement regression failed before the final correction:
  a new translator with no local context retained the old lost global context's
  host key. Clearing that old global entry before replacement fixes the case.
- Full strict-unhandled tooling suite: 460 pass, zero failures, 15.05 seconds.
- Exact six-file registered lint: zero errors, warnings or fixes.
- Final source verification: 65 product/test pins and 146 harness pins match;
  HEAD, staged patch and configuration are unchanged. Original generic conversion,
  CPU-reuse fallback and content/bridge lookup bodies are preserved apart from
  the explicit cache integration.
- Initial native build: successful, 109.66 seconds. Final rebuild after the
  context correction: successful, 48.32 seconds. Both report zero warnings.

Missing-test scaffolding and initial compile/format failures are retained but
not counted as behavioral REDs. The original behavioral three-failure result
and later context-replacement one-failure result are retained separately.

## Package And Native Gate

Packaging succeeds in 185.35 seconds. The isolated export is
exports/umbrafox-import-frame-reuse-20261006/. It has 46 regular files, exactly
matching the archive after extraction, and only libxul differs from the immediate
render-pass-marker baseline. Both frontend archives retain identical entry
inventories and payloads. The native toolkit BuildID and adjacent INIs agree.

Package manifest SHA256:
9ec305adc36c8c1e362ed6e74925c8c473efd999212d354c6f11431ca17b8678.
Archive SHA256:
0904beeebecf4aa7da5ebada1e9d83e977bd03ed09f5f928c061d97fb95b4ebb.
Packaged libxul SHA256:
f5591cd1cbd1ec27f12f1489723fa4df878a50cbaf6f7769fbf75f3e5b9862a5.
The library is 308503360 bytes. Independent post-extraction verification rereads
the 46-file tree, archive, manifests and final source copy.

The two-job test-library build succeeds in 29.44 seconds. Its aggregate compiler
summary reports zero warnings, but the log retains an SWGL clang option warning;
this is not a warning-free claim for that build. A separately stripped copy is
used, leaving the original object-library bytes untouched. Its SHA256 is
8b42f71f153ea7280ea10761b29e0c012e6152cf5571b0d26459716466e3fa97.
The 48-file diagnostic package manifest is
23be5361e22a96b76431f5b61a7ebf5ccb61af3345f2ff39f85bd200e6cecf72.

The existing native driver differs only by artifact namespace. Its 45-second
total budget, 30-second work deadline, bounded output, retained launch handle,
private application-data roots, package postcheck and cleanup remain unchanged.
The preflight verifies 150 harness files and 48 runtime files, sufficient memory
and disk, and no existing laptop browser/native build. All 146 prior harness
inputs are unchanged. Three preparation tests pass before launch; their initial
missing-generated-file failures are scaffolding, not a production regression.

Actual laptop execution passes all 40 expected tests with zero failures, disabled
tests, errors or skips. The output is 8446 bytes, and the 48-file package still
matches after execution. Controller 1736830, native test process 1736842, sandbox
helper 1736844 and IPC peers 1736878/1736889 are independently absent afterward.
Four public evidence files are downloaded and rehashed against remote receipts;
no profile, token or application-data payload is exported. The existing sandbox
EPERM warning remains in the log. These tests exercise native readback and IPC
regressions, not the new cache on a real GPU, and do not exhaust transient process
history.

The native evidence namespace is artifacts/umbralink-control/import-frame-reuse-native/.
The fresh laptop harness root ends in
import-frame-reuse-native-gtest-harness-20261006-IKNoHC; the completed output root
ends in import-frame-reuse-native-green-5bc5ec8a-343c-40a2-8d4a-a12199af8548.
An initial remote preparation command produced no receipt because of command
quoting. It launched no browser; the explicit script-based preparation succeeded.
Both attempts are retained. Resource-preflight refusals from unrelated desktop
Cargo work are preserved; no foreign process was changed.

## Artifacts And Limits

Evidence namespaces are artifacts/umbralink-control/import-frame-reuse/ and
import-frame-reuse-final/. The latter source.json and implementation.patch are
the final candidate; the former preserves the pre-correction candidate and
original before files. Further pixel/performance work must use new namespaces
and must not overwrite these observations.

The final inventory is
artifacts/umbralink-control/import-frame-reuse-mechanism-final.sha256. It covers
the three evidence namespaces, exported package and this report, excluding
generated Python bytecode. Mutable progress/context files are not part of that
seal. Four final saved-data/preparation tests pass; scoped documentation lint is
clean. Archive verification does not involve starting the packaged browser.

The final implementation-only patch SHA256 is
45999cf62be52b7dadecb539766739e215c7af71a8ad2a8f590031ff94823ae4.
The immediate baseline package manifest is
4c8085f0f675c5b183976807df38bb99474bbd8be2e58651b52e4be9176eee8e.
BuildID 20261006175655 is deliberately retained; full hashes, not BuildID alone,
distinguish baseline and candidate.

Stand-in tests do not prove real driver behavior, eviction readbacks, native
object lifetimes or runtime hit frequency. The conservative scratch-framebuffer
invalidation may reduce hit rate. Default-OFF bookkeeping overhead is also not
measured. The earlier GPU smoothness failures and renderer-label CPU increase
remain unresolved. No owner browser, daily installation, launcher or Pi changed.

Remaining gates follow the [active plan](../../plans/video-import-reuse.md): the
48-case pixel matrix, eight retained decoder-loss comparisons, expanded
reuse/context cases, then the fixed laptop
A1/B1/B2/A2 comparison without relaxed thresholds.
