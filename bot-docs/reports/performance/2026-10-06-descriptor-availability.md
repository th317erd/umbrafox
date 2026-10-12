# Descriptor Availability

## Result

The new diagnostic build passes the previously failing retained-frame test on
wyatt-laptop. Both OFF and ON match all eight preserved reference comparisons,
including exception names and exact pixels. The two former ON failures now raise
InvalidStateError after permanent decoder shutdown instead of silently returning.
The copied bitmap still draws successfully with unchanged pixels.

The broader paused-frame matrix also passes: all 48 OFF hashes match the full-size
reference, all 48 ON hashes match OFF, and four saved linear RGBA buffers per
comparison are byte-identical. Every repeat is stable, including blur. No pixel
tolerance, collector predicate, or error expectation was relaxed.

Actual native tests pass 40/40 with no failures, errors, disabled tests, or skips.
The final tooling and saved-evidence replay suite passes 74 tests. These are
bounded correctness results, not latest-build performance acceptance, universal
Firefox parity, crash/restart recovery, or a YouTube stutter fix. The experimental
GPU-import preference remains default OFF. No daily installation was changed.

## Source And Package

The correction is limited to the experimental GTK DMABuf descriptor path in
CanvasRenderingContext2D and a forwarding method on GPUVideoImage. It consults
the retained image's original manager, never a replacement singleton. If that
manager is unavailable, the existing full-source fallback and early error path
apply. Live images retain descriptor import without CPU readback. Generic
GetDesc, other platforms/video types, security/drawing order, public interfaces,
and preference defaults are unchanged by this correction.

This is local channel eligibility, not a guarantee that the remote texture exists
or that later replay succeeds. The synchronous manager-thread dispatch has no
timeout and its additional cost is still unmeasured. A channel loss after the
check and live-channel resource/allocation failures remain separate cases.

Behavioral RED demonstrated admission with a known unavailable manager before
the correction. The actual-source-region tests then passed across four platform
stand-ins. Independent source review found no remaining blocker; the subsequent
include-sort-only delta has exact reverse-equivalence evidence. Two new native
tests verify original-manager retention and absence of readback during admission.

BuildID: 20261006175655, matching native ELF identity and both adjacent INIs.
Export: exports/umbrafox-descriptor-availability-20261006/.
Browser package manifest SHA256:
a7d80698828618f3d0c3e9f760e6fe8b63a72f3f93ba8dabcb132581c8784e87.
Archive SHA256:
50c50495738d183ab0fe449b665a17ad530fea855a7baa51f4399de4108f9a39.
The archive is 107771688 bytes, with 46 files and 57 entries totaling
475127101 unpacked bytes. Sixty source inputs, untracked source, the full dirty
patch, staged patch, HEAD and configuration are pinned; HEAD alone is insufficient.

The first full build hit its 1800-second watchdog. Its log and warning summaries
remain preserved. Incremental continuation completed in 478 seconds, packaging
in 106 seconds, and the native test-library build in 87 seconds. Two-job idle
build limits were retained. A stripped copy of the test library was packaged;
the original object library was not modified. The initial dependency-list
symlink refusal was corrected by verifying and reading the exact regular-file
target, not by shipping object-tree symlinks.

The native 48-file manifest is
53fd20a8aefd2c5d08adfed332a33a3fc368e77b1130698d717d817eb6436df6.
Downloaded native evidence hashes, exact test inventory, clean exit and package
postcheck were independently revalidated. Five recorded controller/browser/
helper/IPC process IDs were absent afterward. This does not enumerate every
possible transient process. The sandbox EPERM warning remains in the log.

## Browser Evidence

Each arm used a fresh private installation, profile, application-data,
local-application-data and temporary directory on wyatt-laptop. The laptop's
strict package/harness hashes, no-browser-or-build and resource preflights passed.
The existing 120-second capture, 15-second cleanup, 220-second driver and
240-second SSH bounds were unchanged. Desktop build-host preflight refusals from
an unrelated Cargo test are preserved; admission was clarified as host-local.
That test was not touched and did not run on the measurement host.

The new wrappers preserve the reviewed driver, capture, termination, export and
validation operations. Only exact package identity, import location and output
namespace changed. Mechanical-equivalence and wrong-build admission tests pass.
The original 91 inputs remain unchanged; the loss overlay has 97 inputs and the
pixel overlay has 101. The laptop root is
/home/wyatt/.cache/codex/descriptor-availability-harness-20261006-h9KsaO.

| Arm | Root suffix | Controller / browser PID | Evidence files | Bytes | Recorded PIDs absent |
| --- | --- | --- | --- | --- | --- |
| Loss OFF | oMNNgl | 1630275 / 1630307 | 48 | 2590566 | 13 |
| Loss ON | 1LKKfp | 1634004 / 1634036 | 47 | 2588874 | 12 |
| Pixels OFF | uHEAvj | 1636900 / 1636912 | 38 | 1387116 | 12 |
| Pixels ON | sRSa8w | 1639216 / 1639228 | 38 | 1387087 | 12 |

All four runs ended with clean owned SIGTERM cleanup, zero dropped log bytes,
package postchecks, and recorded PID absence. Public evidence hashes were
recomputed locally. Native receipts join build/PID and the owned roots; these
are post-startup observations, not proof of no earlier access or no network use.
No private profile, token, or application-data payload was exported.

Both loss runs observed strict single-thread zombie termination on the second
poll before post-loss draws. At that point absence and reaping were explicitly
false; final PID absence was checked separately. OFF additionally recorded a
first-poll task observation, explaining its extra file. The stop mechanism is
permanent nsIRddProcessTest shutdown, not crash/restart recovery. The log's
AbnormalShutdown message follows that intentional operation.

The hardware observations agree across the four arms: Intel Iris Xe RPL-P,
Mesa/iris 25.2.8.0, X11/WebRender. Both measured pixel frames and the loss-test
frame report hardware ffmpeg H.264 decoding in RDD. The pixel setup observation
reports decoder shutdown before seeking; it is not used as the frame decoder
receipt. The owned 1920x1080 input and saved full-size reference are unchanged.

Each loss run has five passive resource samples, peaking at 66245482/66227088
artifact bytes. Each pixel run has six, peaking at 65050023/65033387 bytes.
These are sampled bounds, not continuous process, memory, or network isolation.

## Verification And Next Step

Evidence is under artifacts/umbralink-control/descriptor-availability/.
Key outputs are off-comparison.json, on-comparison.json,
loss-evidence-verification.json, pixels-off-comparison.json,
pixels-pair-comparison.json, browser-resource-summary.json and native/.
The preserved reference inputs are retained-frame-loss/reference-4 and
import-recovery-pixels/off-1; all referenced public evidence hashes still match.

Saved-data regression tests replay actual terminal identity, cold-probe and
document joins, native counts, pixel hashes/raw bytes and cleanup. They reject
the original silent-error mismatch, wrong mode and stable-but-wrong pixels.
Missing wrapper modules were infrastructure REDs, not claimed behavioral REDs.
The source-level behavioral regression and earlier real-browser failure remain
the failing-first evidence for the production correction.

Next is a new prospective balanced OFF/ON/ON/OFF performance sequence using this
exact package. The older 35.48% CPU reduction belongs to another build and must
not be carried forward. The current OFF path includes an exact full-size cache,
so its baseline may also improve. Preserve workload, observer cadence and
acceptance criteria; record any regressions rather than weakening the gate.
Real-site playback, broader rendering/layout/CSS/JavaScript work and additional
failure/recovery coverage remain open. Desktop browser, profile, launcher,
installation, Pi, staged index and product defaults remain untouched.

Final source guard verifies all 60 pinned source files, all 101 harness inputs,
HEAD, staged and working patches, and build configuration unchanged. The 74-test
replay passes after formatting; scoped documentation lint has zero problems.
Final correctness seal:
artifacts/umbralink-control/descriptor-availability-final.sha256.
It covers this report, the evidence namespace and the exported package; mutable
progress/context and generated Python caches are excluded. Further performance
work must use a new namespace, preserving these captures and earlier failures.
