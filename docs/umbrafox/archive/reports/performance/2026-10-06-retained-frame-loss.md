# Retained Frame Decoder Loss

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Result

The integrated candidate passes the retained-frame loss comparison with the
experimental GPU import preference OFF, but fails with it ON. OFF matches all
eight comparisons against the uncached full-size reference. ON matches six;
the two default-canvas draws after decoder termination return without an
exception instead of raising the reference's `InvalidStateError`.

Both differing draws leave the exact original canvas sentinel pixels unchanged:
320x180 RGBA, every pixel `[17, 34, 51, 255]`, SHA256
e88bb7e4a9091b1c1138d4687445219593acb50079149f38d0fa6ca1482e2e98.
Matching pixels therefore do not make these operations equivalent. The error
difference violates the acceptance contract. No tolerance or predicate was
changed to accept it. GPU import remains default OFF; no daily installation,
desktop browser action, native source edit or new build occurred in this phase.

Every run's `status: pass` means collection completed, not that comparison
passed. The separate `on-comparison.json` correctly records `matched: false`;
the comparison command exits 1 after saving that result.

## Observations

The test retains an already-drawn VideoFrame, an initially undrawn VideoFrame
from a later completed seek/presentation, and an independently copied bitmap.
It invokes the existing parent-only permanent decoder shutdown hook once,
proves terminal execution, then checks readback and drawing behavior.

| Check | Candidate OFF | Candidate ON |
| --- | --- | --- |
| Warm software draw before loss | Exact match | Exact match |
| Warm default draw before loss | Exact match | Exact match |
| Copied bitmap before loss | Exact match | Exact match |
| Warm software draw after loss | Exact match | Exact match |
| Warm default draw after loss | Exact match | Missing exception |
| Cold default draw after loss | Exact match | Missing exception |
| Copied bitmap after loss | Exact match | Exact match |
| Initially cold software failure | Exact match | Exact match |

Every first cold software probe raised `InvalidStateError`; no successful cold
probe warmed that frame in these three runs. Copied bitmap pixels stayed exact.
The ON log also records `TexUnpackSurface failed to get VideoBridgeParent` and
`Failed to play canvas event type: 23`. These narrow the next source investigation
but do not by themselves establish the full causal path or a per-draw import
success. The intentional shutdown's `AbnormalShutdown` log is not evidence of
a spontaneous browser crash.

## Runtime Identity And Cleanup

Reference BuildID20261006070020 uses the frozen import-recovery R2 package;
candidate OFF and ON use exact-fallback BuildID20261006153147. Their manifests
are respectively 21178496e1612b579e18b6234bff4a052bbe229cb7c861872c713e11cb89c99f
and 908633c41ff3579585a08dbaf228c158735d7f61d77fb22cc0aeb822df880f87.
Frozen source patches, not HEAD alone, identify those dirty-tree builds.

All arms used matching Intel Iris Xe RPL-P, mesa/iris25.2.8.0, X11/WebRender,
and hardware ffmpeg H.264 decoding in RDD on the same owned 1920x1080 fixture.
Each preflight checked 46 package files and 87 pinned harness files, resource
headroom and no observed browser/build activity. Native receipts and exports
verify the owned application-data paths, build, browser identity and unchanged
private installation. This is post-startup proof, not a network sandbox.

| Arm | Root Suffix | Controller / Browser / RDD PID | Duration |
| --- | --- | --- | --- |
| Reference-4 | GBD5Zf |1598703 /1598715 /1598847|12.836s|
| OFF | 1rLfnZ |1601393 /1601405 /1601539|12.715s|
| ON | u9ZGKy |1603657 /1603669 /1603802|12.739s|

Runs completed at17:40:27.684,17:44:53.018 and17:45:51.277UTC on October6.
Each has48 rehashed public evidence files and13 recorded process/task IDs
independently absent after cleanup. All ended through clean owned SIGTERM,
with zero dropped log bytes; logs contain346,346 and508 bytes. Five resource
samples per arm peaked at66253447,66261308 and66261471 artifact bytes.
Exports total7771102 bytes across144 files. No private profile, control token
or crash payload was exported. No test/browser/SSH session remains running.

## Gate Corrections And Preserved Failures

Three earlier reference attempts remain failed/inconclusive. The first rejected
the actual owned fork-server ancestry before invoking shutdown. The second
did not observe PID absence and lacked poll-state evidence. The third recorded
20 exact-identity zombie-leader observations but lacked thread/task evidence.
None was relabeled successful or pooled into this comparison.

The explicitly reviewed terminal gate accepts absence or a strict terminal
observation: exact before/after identity, zombie state, matching PID/TGID/PPID
and owner UID, one status thread and exactly one matching task entry. The three
new runs passed that second branch on poll2 at57.319,55.531 and55.190ms.
Receipts explicitly retain `absent: false` and `reaped: false`; all recorded
IDs must still be absent after final cleanup. This proves neither release of
all external GPU resources nor delivery of every actor teardown message.

Independent source review also identified and corrected the cold-summary-only
consumer, incomplete failure PID collection and lost partial timeout evidence.
The final focused suite passes42 tests under strict unhandled-rejection mode.
Behavioral RED evidence, review reports and the formatter's initially ignored
artifact-path limitation are retained. The actual final format check used
`--ignore-path /dev/null`. Cancellation is cooperative, not hard OS-I/O abort.

Saved-data verification rehashes all144 files, checks the full PID union,
graphics/decoder conditions, configured modes, sentinel bytes and exact failure
set. Source guards verify59 source pins,87 harness pins, HEAD, configuration,
index and all tracked diffs unchanged from the preceding source baseline.

## Next Work

Trace the frozen candidate's retained-VideoFrame descriptor acquisition and
availability checks through canvas recording and replay. Reproduce the missing
exception with a focused regression before changing the narrow native path.
Preserve baseline early failure and avoid treating asynchronous GPU replay
failure as successful page-visible drawing. Keep this evidence unchanged and
use a new namespace for any corrected build/retest.

The earlier35.48% CPU reduction belongs to another diagnostic package. Neither
this loss test nor the preceding pixel matrix measures latest-candidate speed.
Crash/restart recovery, sustained performance, real YouTube playback and broader
layout/CSS/JavaScript work remain separate gates. No universal Firefox parity,
physical presentation or release acceptance follows from the passing OFF arm.

Evidence: `artifacts/umbralink-control/retained-frame-loss/`, particularly
`reference-4-validation.log`, `off-comparison.json`, `on-comparison.json`,
`final-evidence-verification.json` and `final-source-guard.log`.
