# Audio-on Seek Investigation

## Status And Boundary

Phase3 audio-path admission completed on October7 local time; see
[the result](../reports/performance/2026-10-07-audio-clock-admission.md).
This is the next implementation contract, not a ready runtime driver or a
claim that audio explains the stutter. No additional browser launch belongs to
the completed one-run admission wave. Preserve its source/evidence, phase1 and
all previous muted results. The user's sound/mute state and exact affected
URL/seek pattern remain unanswered; do not assume an answer.

Continue authorized isolated laptop investigation only. No desktop disruption,
Pi action, system driver/audio setting change, native build, product/default
change, profiler, raw profile parser, delegation, staging or commit. Object
directories have been cleaned; use the existing verified self-contained package.

## Question And Comparison

Can a real progress-bar seek reproduce prolonged stutter with an observed
progressing audio sink, versus the same audio-on playback without seeking?
Keep the admitted fixed public YouTube video,1080p menu, package and private iHD.
Use the existing UI-forward path first, not a direct currentTime substitute.
Record actual codec/decoder label and hardware flag; do not infer software-only
from ffvpx or continuous backend state from a cached flag.

Prospective first sequence: one audio-on no-seek control, then one audio-on
forward progress-bar seek. Review control and cleanup before launching seek.
These two runs can expose a reproduction or coverage gap, not a causal effect
size. Any repeat/backward/repeated-scrub matrix requires an explicit next
contract, not outcome-driven retries until a rough sample appears.

Retain at least130s after observed seeked and the existing240s total/225s work/
15s cleanup envelope,256MiB artifact cap and resource stops. Require the
existing185s reserve before the long sequence; do not relax it to fit new code.
If integration cannot fit, revise the design before launch rather than silently
increasing deadlines or dropping post-seek coverage.

## Integration Contract

Source map to inspect before editing:

- seek-recovery/youtube-session.mjs startStreamingSession and createFrameSource:
  current private long-lived session explicitly forces mute and owns playback.
- seek-recovery/youtube-recovery.mjs captureStreaming: bounded request ledger,
  native/process checkpoints, progress-bar action, final close and partial data.
- decoder-driver-backward/recovery.generated.mjs and capture.generated.mjs:
  preserved private driver/environment, exact ownership/resource/cleanup route.
- audio-clock-admission/audio.mjs: typed readAudioClock/admitAudioPair.
- audio-clock-admission/session.mjs: useful tested timeout/restoration contracts,
  but NOT reusable unchanged across a long seek: it pauses/restores on completion.

Use a new scratch namespace with composition or checked source-region generation;
never edit sealed adapters. First mechanically map the full request/write/import
ledger and expose tests at the existing boundaries. Retain one actual video and
document through the entire long session. Record original mute/volume, set only
that owned element to0.05/unmuted, and restore/pause in the same session's final
cleanup. No intermediate pause/restart just to take audio receipts.

Both comparison cells get identical audio diagnostic cadence: one same-element
pair before the timed observation, one after the completed recovery/control
window while still playing. Pairs are at least1s apart internally. There are no
audio debug queries during the timed window in this first wave, because those
queries call GetClock and can alter handoff/queue state. Endpoint admission
does not prove continuous audio-clock selection through the seek. Reject
missing/stalled/error/drained sink within a pair; sink anchor changes ACROSS a
seek are allowed and must be recorded, not hidden by matching pre/post anchors.

Do not add an extra observer arm yet. If the symptom reproduces, define a
separate matched sparse-internal-read versus endpoint-only observer experiment
to bound sensitivity before using native queries during the recovery interval.
Nothing here proves zero-observer overhead.

## Acceptance And Falsifiers

Before launch, failing-first tests must prove:

1. Ordinary control/seek sessions no longer force mute in the new adapter;
   old sealed behavior remains unchanged. No control cell contains a hidden seek.
2. Pair identity/privilege/process/document joins and exact endpoint ordering;
   no native audio request is issued inside the timed observation interval.
3. Playback remains uninterrupted between baseline, UI action and recovery;
   pause/mute/volume restoration occurs once during final cleanup, also on failure.
4. Same bounds, request counts, source/import closure and operation ledger;
   success plus every RPC/write/abort/timeout/late reply/partial-data failure.
5. Strict UI hit testing, trusted seeking/seeked evidence and130s recovery;
   no hidden fallback, advertisement bypass, forced codec or deadline relaxation.
6. Saved-data reviewer rejects changed element, lost sink, wrong identity,
   missing raw failure evidence, unmatched media/process clocks and failed cleanup.

Counters and page event timestamps remain observation evidence, not physical
scanout or exact drop-event time. Preserve raw format changes and delayed counter
updates. A black-frame/flash claim needs actual visual evidence with its own
observer budget; readyState/currentTime/dropped-frame counters cannot prove it.

If both cells stay smooth, conclude only non-reproduction for the tested
audio-on single-seek workload. Match the owner's stream and scrub pattern next;
do not repeat unchanged cells indefinitely or implement speculative engine fixes.
If rough playback appears, localize observed decode/sink/compositor/audio events
with explicit clock joins before selecting a narrow implementation change.
