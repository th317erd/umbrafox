# Audio Path Coverage Gap

## Finding

The startup and seek fixtures inspected on October7 explicitly set
`video.muted = true`. In the deployed package source, effective zero volume
can shut down the audio sink; playback without that sink advances using the
system clock. Normal audio playback also traverses audio-stream startup,
handoff and seek-resume paths that these captures have not established they
exercised. This is a test-coverage gap, not a demonstrated performance bug.

Wyatt's prolonged post-seek stutter followed by a brief black flash and smooth
recovery remains unreproduced. Historical short startup drops do not establish
the same problem. We have not established whether the affected user playback
was muted; that question was sent separately without blocking this source audit.

## Authority

Deployed laptop package: Build20261006175655, export
`exports/umbrafox-descriptor-borrow-20261006/`.
Base: `892431809a4caadb5c73b2c03ad9bdb124c3e21e`.
Frozen patch SHA256:
`d1bf3bdfe9f7d36c82181db0b4487592d5b8857b070e43c1b2ee6aaea9cd1677`.
Frozen source manifest SHA256:
`a9befff9082463b5c643889c0e755e5f88a09d674d6aff00b3ad05d89cf1935c`.

`artifacts/umbralink-control/audio-clock-admission/source-proof.json` records
twelve base-file hashes, inspected excerpts and five muting fixture hashes.
The script checks that neither the frozen patch nor changed-source manifest
touches those twelve files. Their current bytes also match the frozen base.
Replay is byte-identical. This uses the previous deployed-package provenance;
it is not a new binary-to-source attestation or runtime audio observation.

The actual media-element source path is
`dom/media/mediaelement/HTMLMediaElement.cpp`, not the historical dom/html path.
The attempted old-path read and nonexistent export result.json lookup failed
without writes; package-input.json/source-final.json are the actual records.

## Producer And Consumer Chain

1. HTMLMediaElement::SetMuted updates the mute reasons through SetMutedInternal;
   an effective mute transition invokes SetVolumeInternal. ComputedVolume
   returns zero when muted and effective volume goes to MediaDecoder::SetVolume.
   This is not merely an operating-system output-volume change.
2. MediaDecoder's canonical volume connects to the state-machine mirror.
   Its volume watcher invokes VolumeChanged, which calls the media sink's
   SetVolume. VideoSink delegates to its audio sink.
3. AudioSinkWrapper detects zero/nonzero transitions. OnMuted shuts down an
   existing sink unless audio already ended. NeedAudioSink requires non-muted
   playing state and an outstanding ended promise. See the upstream discovery
   [mute handler](https://searchfox.org/firefox-main/rev/cfd140a311d8523d3d35e00ee1a9f2403c033dfd/dom/media/mediasink/AudioSinkWrapper.cpp#264-283).
4. Without a sink, GetPosition can advance on the system clock and discard
   old audio packets. With a sink it calls PositionFromAudioSink; seek-resume
   and unmute have distinct hold/handoff logic. VideoSink uses the wrapper's
   position to expire queued frames and timestamp submissions. The upstream
   [position source](https://searchfox.org/firefox-main/rev/cfd140a311d8523d3d35e00ee1a9f2403c033dfd/dom/media/mediasink/AudioSinkWrapper.cpp#168-228)
   was discovery; the frozen base checks above establish the inspected package
   source. Stream-reuse behavior is pref-gated; its actual runtime value was
   not observed here.

The fixtures' mute assignment is not proof of continuous mute or native clock
selection: the page could change state, and the earlier collectors did not
export these audio-sink fields. Do not relabel every old capture as a proven
system-clock-only run or compare future audible runs as a single-variable fix.

## Existing Diagnostic Limits

mozRequestDebugInfo already exists behind HasDebuggerOrTabsPrivilege. Its
guard is not literally ChromeOnly: supported extension permissions also enter
the existing guard. No privilege change or public interface was added.

AudioSinkWrapper::GetDebugInfo fills wrapper state and calls AudioSink's
producer only when an actual sink exists. AudioSink fills outputRate, written,
lastGoodPosition, startTime, isPlaying, hasErrored and playbackComplete.
The WebIDL sink dictionary defaults to zeros/false; its isStarted field is
not filled by this producer. Defaults therefore cannot prove absence, and
sink.isStarted must not be required as positive evidence.

AudioSink::GetPosition updates lastGoodPosition from nonnegative stream
position and returns startTime plus that position. An advancing observation
with positive rate/written values supports a progressing sink. It does not
prove audible output or expose the private ClockSource enum. The new helper
labels both actual clock source and audible output unobserved.

MediaDecoderStateMachine::GetDebugInfo calls GetClock when started. That can
invoke the handoff and queue-management path itself. These queries are not
zero-cost or side-effect-free. Use them first for path admission, with an
observer-control design before making performance comparisons.

## Implemented And Verified

Only new scratch tooling, plan/report and mutable memory documents changed.
`audio.mjs` provides a scalar allowlisted projection, strict paired-observation
admission and an abortable three-second collector. It rechecks the exact
document/video after each query and does not mutate playback. Query timeouts
retain rejection observers; they cannot cancel already-started native work.
The future integration must retain the same element across the pair and join
the owned process/context, not rely on numeric document ID alone.

The initial missing-module RED was scaffolding, not a behavioral regression.
Subsequent failure injection produced three actual assertion failures:
timer-setup failure still started a query, a delayed watchdog could admit a
late success, and unavailable native clock/media-time values were admitted.
Those helper defects are corrected with preserved RED/GREEN logs.
Final review added a fourth behavioral RED: the saved-data pair validator did
not independently reject query spans over3s. It now enforces that same bound.

Final18 Node tests pass under strict unhandled-rejection handling,10s outer
and1s individual watchdogs, in76ms. Cases include malformed/default values,
identity/anchor/rate/progress failures, private-field omission, native failures,
navigation, replacement, abort, timer admission, delayed timer dispatch and
late resolve/reject. Three JS files pass the explicit Prettier check. The first
format invocation skipped ignored artifacts; the effective command uses
`--ignore-path /dev/null`. Named documentation lint has zero errors/warnings.
Prior102 sealed files and53 runtime inputs hash-match. Final logs are
final-reviewed-tests.log, final-format.log and docs-lint.log in the namespace.

## Next Gate

Follow `bot-docs/plans/audio-clock-admission.md`, phase2: integrate the collector
with the existing private bridge and owned laptop capture lifecycle, prove
timeout/identity/cleanup/evidence behavior, then one bounded low-volume audio-on
admission. No runtime driver or new browser run exists yet. No SSH, profiler,
native build, driver install, desktop/Pi action, staging or product modification
was performed in this phase. This does not fix or explain the user's stutter.
