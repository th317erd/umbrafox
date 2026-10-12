# Producer Fence Native Verification

## Result

The [local producer-fence candidate](2026-10-07-producer-fence-implementation.md)
now builds and passes the new real-EGL gate on wyatt-laptop. All 61 selected
native tests pass, with zero failures, disabled tests, errors or skips. Seven
are new producer-fence cases; the other 54 are the unchanged cache, import,
GPU readback, IPC and remote-holder regression inventory.

The hardware identifies as Intel / Mesa Intel(R) Iris(R) Xe Graphics (RPL-P).
Exact red/green pixels survive real descriptor export/import and local fence
consumption, replacement and destruction. With 32 idle surfaces, observed
sync-file descriptors increase from 0 to 64 and return to 0 after release.
These are correctness and bounded resource observations, not measured CPU,
GPU-wait, playback, YouTube or physical-presentation improvements.

No daily installation, owner profile, launcher, desktop browser or Pi changed.
The normal package and the separate native-test overlay remain diagnostic
artifacts. The broad performance goal, rare Renderer stall and earlier failed
smoothness comparisons remain open.

## Native Coverage

The GTK-only fixture is dom/canvas/gtest/TestDMABufProducerFence.cpp. It uses
actual WebGL2/EGL contexts, DMABuf shared surfaces and exported descriptors.
It requires hardware EGL and both native-fence extensions. The test-only
software-policy adjustment follows hardware admission and is restored in
TearDown; all seven result properties confirm restoration. Skips are an
explicit nonacceptance result in the runner, not a substitute for hardware.

| Case | Observed contract |
| --- | --- |
| Local wait | Valid original sync before consumption; empty holder after; independent FD and descriptor still usable; exact pixels; second empty wait |
| Replacement | Sixteen alternating red/green frames; old duplicated FD remains usable after replacement; new descriptor pixels exact |
| Owner destruction | Descriptor and independent duplicate remain usable after owner release |
| Swap-chain lifecycle | Actual same-object recycling, consumption, resize to a distinct surface, pool clearing and owner destruction |
| Context release | Actual original GL weak references expire while the fence remains valid; owner destruction releases it; new context can use saved exports |
| WebGL loss | Actual WebGL loss flag, owner/context replacement and surviving exported pixels |
| Idle resources | 32 live owners, replacement and release; sync-file count 0 -> 64 -> 0 |

No finish call precedes ordinary fence publication in the pixel tests.
Duplicated descriptors use the real FileHandleWrapper cloning operation;
native EGL import consumes the duplicate only after success. The explicit
duplicate-import helper has a one-second wait bound. Production local and
imported-surface waits retain their existing semantics under the outer runner
deadline. Original holder validity is queried only while the handle is live.

The context-loss case is not a physical driver reset. The swap-chain case uses
the public recycle entry point, not a new end-to-end RemoteTextureMap release
test. Existing IPC regressions still pass, but the new surviving duplicate
itself is imported in-process. The resource test counts this process's exact
sync-file FD target, not every allocation, driver cache or possible long-run
leak. No native operation-count instrumentation was added: removal of redundant
reconstruction remains supported by P1 actual-source ledgers and source review.

## Implementation Scope

Relative to sealed P1, the only source additions are the new native test,
its GTK registration/private GL include/per-file GTK flags, fixture-friend
declarations in two headers, and the corresponding forward declaration in
the standalone fake ledger. Production method bodies remain byte-identical
to P1. No public getter, WebIDL, preference, shader, canvas conversion,
serialization field or web-visible marker is introduced.

The source guard retains the original HEAD and staged-index hash, proves the
four authorized existing-file deltas by reversing them, and validates the
other original inputs. The native snapshot has 92 source/configuration pins;
the package adds the already-tested attachment module and its test for 94.
P0 and P1 evidence seals independently verify unchanged.

Real-driver results cover this Intel/Mesa host, not every GPU or Firefox
surface. Exact native pixels and unchanged source regions support this narrow
parity gate; they do not establish universal web-platform equivalence. The
test's temporary policy setting is not a product default change.

## Build And Package

Normal package: exports/umbrafox-producer-fence-20261007/.
BuildID: 20261007133500. All 46 regular files are self-contained, with no
package symlinks. Both INIs and both normal/gtest native build-ID notes agree.

- Normal manifest SHA256: 03dc06365cd39d215a69c25b32b7c06bd19f39073ce5fe0702170f33048f4463.
- Archive SHA256: 03c4de79c731fefa1b26a6c3f034b5db7996cbe78cde0e50feda60bfb77ba18f.
- Archive bytes: 107769468; unpacked normal bytes: 475111027.
- Native overlay: 48 files / 833755110 bytes, manifest 0ab5de57a0c048f344bb2a05e6d4fdbbf3dbf5c7bb4941d21ed15296e1c048a5.
- Stripped gtest library SHA256: 8f89587860a0e878bbc3a552a9ea6e8e1f3c0d26f37b49800310798ab1f0dc12.

The normal package includes the earlier attachment metadata optimization.
Against the descriptor-borrow reference, exactly two root-archive payloads
change: AppConstants' generated BuildID and the exact pinned Attachments
module. All 5368 browser-archive entries remain identical. The exporter checks
the complete inventory and exact payload deltas, not just filenames. Its
archive path/type/size/CRC and extraction checks remain inherited unchanged.

Initial target-only builds did not refresh the top-level build-ID header.
A normal build refreshed that header and application metadata, but intentionally
did not relink an unchanged library. The configured make rule was then invoked
with `-W toolkit/library/gen_buildid.py` (absolute path) for buildid.cpp, and
normal `mach build -j2 binaries recurse_gtest` relinked both libraries.
No source or generated ID text was manually edited. All identity checks then
passed. `mach package` succeeded; its driver chose 16 make jobs, while native
compiles were two-job and XZ compression was explicitly limited to two threads.
Do not describe the packaging driver itself as two-job.

## Execution And Cleanup

The new runner is a checked mechanical adaptation of the frozen 54-case runner:
only namespace, date, package identity, harness count and added test filter
change. Fourteen static imports are covered by a 154-file harness manifest,
SHA256 b0988b64bd897427a5fe5e0683339da029980a488b7cbbb730f9b58b2788ddff.

Package/harness hashes and no-browser/no-compiler preflight passed on the
laptop before launch. Available RAM was 12461895680 bytes and free disk
62463770624 bytes. The runner retains 30 seconds for work, 45 seconds total,
bounded output, fresh owned application/local/temp roots, synchronous child
handle retention, identity admission and bounded owned cleanup. It uses the
existing native-test mode and DISPLAY=:0, not an owner browser session.

Run root:
/home/wyatt/.cache/codex/producer-fence-native-green-b5b82912-ed5e-44ad-b57b-c60b6facc765.
Installation root:
/home/wyatt/.cache/codex/producer-fence-native-gtest-harness-20261007-zblp6M/umbrafox.

Native result: 61 passes, reported test duration 0.831 seconds. This duration
is not a benchmark. The controller exits 0, native process exits 0 naturally,
and cleanup reports clean. The 15298-byte log is retained without truncation.
All 48 installation files match after execution. Independent post-run checks
at 2026-10-07T13:51:11.674Z find all five recorded PIDs absent: controller
1993310, native root 1993342, sandbox helper 1993344 and IPC peers 1993378 and
1993390. The four IPC peer/owner rows also match the expected thread/process
roles. This is exact recorded-root cleanup, not continuous whole-host coverage.

Only launch.json, receipt.json, results.json and gtest.log were exported, and
all four hashes match the remote verifier. No private profile, control token
or app-data payload was read or exported. Forced child directories and test
network controls are not a general filesystem/network sandbox proof.

## Verification And Preserved Failures

Evidence namespace: artifacts/umbralink-control/producer-fence-native/.

- Full strict tooling: 461 passes, zero failures/skips, 41.343 seconds.
- Final native test: 61 passes, seven new hardware cases and 54 regressions.
- Private Node contracts and saved-evidence checks: 11 groups pass, including
  malformed counts, missing/duplicate cases, skipped hardware, wrong cleanup,
  wrong roots/build IDs and corrupted result claims.
- Archive delta checks: three Python groups pass, including unknown entries,
  altered metadata/source, non-identity AppConstants changes and bad IDs.
- Native fixture clang-format check passes; exact five-source-file registered
  license/whitespace/trojan checks report zero problems; tracked diff check passes.
- Saved audit rechecks all 94 source pins, 154 harness files, 48 local package
  files and the four transferred native evidence files.

Earlier compile failures for missing GTK/private GL include paths, X11's Bool
macro and explicit WeakPtr construction remain in separate logs. The native
test inventory's original RED rejects the new 61-case shape under the old
54-case contract; that is harness evolution, not a product correctness failure.
The actual P1 behavioral RED remains preserved separately.

One gtest build was incorrectly launched after a rejected concurrency
preflight because orchestration did not inspect the tool's nonzero result.
It had already completed before an attempted exact-owned-group SIGTERM; the
group was absent. No unrelated process was signaled. build-admission.md records
the incident. Subsequent rejected preflights did not launch builds; successful
fresh preflights preceded the normal build, regeneration, relink and packaging.
No performance evidence is claimed from compilation.

The first archive test used an incorrect saved filename, and the first rsync
export used unsupported brace expansion. Those harness failures are preserved;
the corrected explicit four-file transfer and hash audit pass. No native test
was repeated or dropped to obtain this result.

The log retains the sandbox namespace EPERM warning and graphics diagnostics
inside the older invalid-descriptor and context-loss tests. Their enclosing
test records pass. The new seven-case group has its deliberate WebGL loss
message and no failed test records; this is not a warning-free process claim.

Recheck existing evidence without launching a browser:

```sh
timeout 30 node --test --unhandled-rejections=strict artifacts/umbralink-control/producer-fence-native/test/*-spec.mjs
timeout 15 python3 artifacts/umbralink-control/producer-fence-native/test/archive_spec.py
timeout 20 node artifacts/umbralink-control/producer-fence-native/audit-saved.mjs
```

Preparation/export generators are exclusive-write operations, not replay
commands. Do not rerun them over sealed evidence.

## Next Performance Gate

P2's native gate is now supported. P3 still requires the normal packaged-browser
pixel/loss controls and fixed unprofiled comparison with GPU import held
constant. Build otherwise-matched baseline/candidate packages: the older
descriptor-borrow package lacks the new Attachments metadata change, so it
cannot by itself isolate the fence effect against this package. Preserve the
source/package identities, old-vs-old noise control and predeclared minimum
CPU benefit, plus the unchanged callback-gap, drop and exact-pixel criteria.

No default promotion, daily installation or owner-browser restart follows
from these passing tests. Other layout/CSS/JavaScript work remains in the
broader goal; native correctness does not replace performance acceptance.
