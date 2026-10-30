# Readback Cache Availability

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Status

Implementation and native RED/GREEN verification passed: all 38 GREEN tests
passed, with no failures or skips. This is a correctness prerequisite for the
readback optimization, not a new performance
result or permission to install it. The desktop daily browser, profile, launcher
and installation remain untouched. Direct GPU import remains off by default.

## Reproduced Failure

The full and size-matched CPU caches could return pixels without consulting the
original media manager. In the native RED run, a cold read failed after the
test manager lost its thread or connection, but the populated cache continued
to succeed. All five new behavioral tests failed against the old production
code; the preceding 23 tests passed, with no skips or harness errors.

The cases cover full and sized caches, replacement-manager isolation, concurrent
disconnected hits, and reentrant validation outside cache locks. Previously
returned surfaces retain their bytes; rejecting a future cache hit must not
invalidate snapshots already handed to a caller.

## Correction

`IGPUVideoSurfaceManager::CanReadback` is a private interface. The child obtains
a strong reference to its existing manager thread, then uses the established
`SyncRunnable` mechanism to check both actor and channel `CanSend` there. Missing
thread or failed dispatch returns false. Calls from that thread execute inline.

Each actual cache hit performs this check after releasing its cache lock. It
checks the image's retained original manager, not a replacement singleton.
Misses and full reads for other decoder types retain their existing paths.
The parent and the null RemoteImageHolder test manager return false, consistent
with their unsupported readback paths. No IPC message, mirrored state, WebIDL,
page API, preference default or pixel arithmetic was added or changed.

The channel predicate matters: local channel failure can already reject sends
while actor teardown is still queued. Independent source review identified this
gap in the original actor-only proposal. The final implementation checks both.

## Verification Scope

RED is one real isolated laptop native run: 28 tests, 23 passes and five expected
failures, exit 1. Its controller, native process, log helper and two IPC peers
were independently confirmed absent. The 48-file diagnostic package postcheck
and all four public evidence export hashes passed.

GREEN passed all 38 tests: the 28 RED cases, a real-manager characterization,
and all nine existing RemoteImageHolder regressions. The real-manager test uses
public child initialization with an owned unbound peer endpoint. It exercises
caller-thread and inline checks, immediate channel error while the actor still
reports connected, queued actor teardown and missing manager thread. It never
sends a cold read to the unbound live peer; that read is reached only after an
assertion establishes channel failure.

This is not a real replying media server, decoded-video test or RDD restart.
The existing four IPC lifetime tests exercise real cross-thread/cross-process
shared memory, not the media-manager protocol. Fake-manager cache tests and
the real-manager authority test prove complementary, bounded properties.

Independent implementation review caught a test startup barrier that could
miss a main-thread wakeup and retain borrowed stack state on an exceptional
exit. Before execution, it was replaced by owned completion state published by
an explicit main-thread event. All 19 original GPUVideoReadback test bodies
remain byte-identical. Review reports are retained with their original hashes
and the superseded test recipe is not presented as executed evidence.

## Build And Evidence

The RED test-only build completed in 28.87 seconds with zero compiler warnings.
The first implementation build failed after 22m16.8s: two incomplete Endpoint
type errors in the new test, with 12 compiler warnings also recorded. Adding
the explicit `mozilla/ipc/Endpoint.h` include is the only subsequent source
change. The corrected incremental build reached its 900-second deadline with
exit 124 and no new compiler error in its saved log. After verifying that its
mach/make/compiler processes were absent, one continuation succeeded in 175.76
seconds and reported zero compiler warnings. The earlier errors, timeout and
warnings remain preserved; this was not a clean one-shot build.

Evidence lives in `artifacts/umbralink-control/readback-availability/`. It retains
the baseline 58 source hashes, original working/index patches, six-file phase
diff, source-review reports, failed and successful command logs, RED receipt and
separate RED/GREEN contracts. The diagnostic overlay deliberately distinguishes
native gtest BuildID 20261006111504 from loader BuildID 20261006052600. It is not
a self-contained integrated browser release and must not be installed as one.

GREEN used manifest SHA-256
`ac8187c7b158306ca6dc2eac72e98454b1c99f39335c4c610f5026d7ea88e64e`.
The stripped test library is 358533856 bytes, SHA-256
`891df2f2c58eb45276887d35f47483428d0fc40dd17c4bf1acab49512f809b45`.
All 58 packaged source pins equal the final build inputs; the other 47 package
files are unchanged. The new test source is pinned as
`da38287b08989c8671438023ee82c8d73d711ab18980f2850243299f60769edd`.

The fresh GREEN root is
`readback-availability-green-6b569758-2105-4b6e-a4c7-15975cd93045` under the
laptop's owned cache namespace. Native exit was 0 with clean cleanup. Controller
1550840, native process 1550852, helper 1550854 and IPC peers 1550889/1550901 were
independently absent. The 48-file, 833653744-byte package postcheck passed, and
four exported evidence files were independently hashed on the laptop and after
transfer. The 8052-byte log retains the sandbox user-namespace EPERM warning and
headless announcement. The 0.321-second suite time is not a performance result.

Eight final offline checks pass, including actual RED/GREEN result inventories,
export/library/source hashes, original test bodies, unchanged HEAD/index and
unrelated tracked work, and exact controller transformation. The first replay
had seven passes and one failure because GREEN omitted one trailing newline
from its source controller. The explicit transformation now accounts for that
single byte; executed controllers and native evidence were not edited or rerun.
The failing replay and independent one-byte check are retained. Source lint,
clang-format checks and documentation lint pass; the preceding phase's evidence
seal remains intact. No build, native test or transfer session remains running.

## Remaining Gates

Local availability is not remote success. The process can fail after validation;
a live readback can also fail because an image is missing, allocation or mapping
fails, or a synchronous transaction cannot proceed. Failed-dispatch behavior is
source-reviewed, not fault-injected. No universal cached/uncached error-parity
claim follows from this correction.

The added synchronous cache-hit dispatch has unmeasured cost and can wait behind
manager work. Retained failed-manager entries remain subject to the existing
cache budget; this change adds no eviction. Actual retained VideoFrame exception
and exact-pixel checks after positively observed old-channel loss are still due,
with retained ImageBitmap controls and separate restart characterization.

The optional direct-import route obtains descriptors and bypasses this CPU
cache. Its loss behavior needs its own gate. The seven native prescale pixel
failures and real-video/filter failures remain open. Integration must preserve
exact fallback behavior, then repeat parity and performance against the daily
V2 baseline. The earlier controlled 35.48% CPU reduction is neither a result for
this correction nor a verified YouTube improvement.
