# AV1 Decoder Selection Trace

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Finding

The isolated laptop trace contains two real FFmpeg packet-submission failures
during AV1 hardware decoding, followed by software dav1d initialization. This
narrows the earlier capability-versus-use discrepancy: hardware decoding was
attempted and initialized in this process, not simply unavailable at selection.
The underlying VA-API/FFmpeg failure reason remains unknown.

This is not a fix or a reproduction of the owner's prolonged post-seek stutter,
black flash and recovery. The owner's historical VP9 stream is still unmatched.
These messages establish process/thread chronology, not a decoder-instance-to-
document join. Some startup decoder activity may be capability probing rather
than the selected video's playback. Do not attribute every decoder initialization
to the video element or equate repeated initialization with a reset loop.

## Retained Evidence

The existing log emits successful VA-API initialization and hardware=true, then:

| UTC on October 7 | RDD / Thread | Evidence |
| --- | --- | --- |
| 21:11:07.333783 | 2177327 / MediaPDecoder #1 | avcodec_send_packet I/O error, code -5 |
| 21:11:07.334188 | 2177327 / MediaPDecoder #1 | Decoder shutdown |
| 21:11:07.335871 | 2177327 / MediaPDecoder #1 | Hardware=false initialization |
| 21:11:07.335891 | 2177327 / MediaPDecoder #1 | libdav1d selected |
| 21:11:16.745965 | 2177327 / MediaPDecoder #5 | avcodec_send_packet I/O error, code -5 |
| 21:11:16.746385 | 2177327 / MediaPDecoder #5 | Decoder shutdown |
| 21:11:16.748450 | 2177327 / MediaPDecoder #5 | Hardware=false initialization |
| 21:11:16.748464 | 2177327 / MediaPDecoder #5 | libdav1d selected |

The two error lines are 585 and 1283 of the immutable retained browser.log.
These are log offsets for this artifact, not source references. The full prefix
and a 70-event index remain available in the evidence namespace below. No network
delay, uBlock effect, physical presentation or GPU-reset attribution follows.

Repeated "Failed to copy image data" warning text is **not** a demonstrated copy
failure. In this exact source, MediaResult::Logged emits the supplied wording
unconditionally, including when its nsresult is successful. VideoData's
SetVideoDataToImage passes that wording directly with CopyData's return value.
Do not count these warnings as failed frames or use them to justify a copy fix.

## Failed Capture And Cleanup

The single predeclared 20-second admission attempt was stopped by the unchanged
one MiB browser-log cap before completion. No retry or cap increase occurred.
The raw run status remains cleanup-failed due to incomplete log evidence;
driver status is failed. This is not a passing playback sample.

- 1048499 log bytes retained; 818 bytes reported dropped.
- Work ran from 21:11:04.338 to 21:11:31.912 UTC, 27.574 seconds including startup
  and cleanup. Owned SIGTERM cleanup passed and rootAbsent is true.
- Controller PID2177185 and browser PID2177197, plus all 12 other recorded PIDs,
  were absent at 21:11:43.297 UTC. This does not certify unsampled descendants.
- Seven resource samples pass the existing caps; peak summed RSS is 2431307776
  bytes and can double-count shared memory. No memory or CPU improvement claim.
- Package postflight passes. Startup native directory receipts match the owned
  application/local/temp roots; no after receipt or preconsumer-proof claim.
- The sole native video receipt is pre-playback, paused at zero, decoder shutdown,
  retained AV1/1920x1080 metadata, hardware=false. It is not an active-decoder
  post-failure receipt. The prior unlogged captures supply the separate playing
  software-decoder observations; they cannot be joined as the same run.
- No personal profile, shared crash queue or UmbraLink token was exported.
  The desktop daily browser, installation and configuration were untouched.

## Source And Inputs

Baseline Build20261006175655 and matched manifest
09261b9b755eb2295aa92393ddaab215ab8936cb79ebd27699ab8695ca3d1eae are unchanged.
The source audit checks exported HEAD892431809a4caadb5c73b2c03ad9bdb124c3e21e,
source-final.json, mozconfig and frozen source.patch. Twelve directly inspected
producer/consumer files match that HEAD and are not changed by the frozen patch.
Searchfox was used for upstream discovery, not substituted for deployed provenance.

FFmpegVideoDecoder's DoDecode converts this non-EOF packet error into
NS_ERROR_DOM_MEDIA_DECODE_ERR. MediaFormatReader's Linux error handling can then
disable hardware decoding and recreate the decoder. The observed sequence is
consistent with that path, but the MediaFormatReader decision itself was not logged.
The GTK ffvpx-hw default is true in the pinned source; this is not a runtime-pref
receipt. No media/codec/GPU preferences were changed for this trace.

The only launch addition is MOZ_LOG=timestamp,FFmpegVideo:4,PlatformDecoderModule:4,
recorded in effective environment provenance and run.diagnostic. It adds substantial
observer work; no timing or drop comparison against unlogged captures is valid.
Existing FFmpegVideo debug logging can also affect libva message verbosity.

## Verification And Next Step

Scratch adapters use hash-pinned original capture/driver/quality sources, parsed
import relocation, and one exact child-environment/report insertion. The first
behavioral test failed on absent logging, then passed with the insertion. Tests
cover source drift, exact generated bytes, original quota/cleanup preservation,
exclusive output/read/write failures, import targets and saved-evidence corruption.
The shared quality tests retain network/RPC/identity/write/abort failure coverage.
No product code or native build changed.

Final bounded Node verification passes 152 harness/saved-data tests, including
10 new adapter/auditor tests; no skips or failures. Exact-file formatting and
scoped documentation lint pass. The 37-file remote runtime bundle rechecks
unchanged after cleanup. These tests do not turn the failed live capture into
a successful playback observation.

FFmpegLibWrapper uses the separate FFmpegLib module to control and forward the
library's own error callback. That module was not enabled here, so the specific
cause behind EIO is absent. The next narrowly scoped diagnostic should enable
library error/warning output and the reader's fallback decision, omit the noisy
per-frame FFmpegVideo/PDM debug channels, and retain the same cap and cleanup.
First review the selected modules' producers and output volume. Do not change
codec preferences, disable the sandbox or bypass the fallback safety path.

Evidence: artifacts/umbralink-control/decoder-selection/.
Raw export SHA256:
5e233fea887a977ddff0a76f904433c4ec19b13576ac5f4166b26ff30de782ed.
Browser-log SHA256:
ea2b9a32f175cb37604e409e4fc53d37ebb6a5b8e21574bb58c7615818840ebb.
Laptop harness root: /home/wyatt/.cache/codex/decoder-selection-harness-20261007-A45d28.
Run root: /home/wyatt/.cache/codex/laptop-youtube-quality-1080-20261007-1LCb31.
The plan, source proofs, bundle manifest, test logs, resource/cleanup review and
original failed output are retained. All commands are terminal; no browser,
profiler or agent remains active from this diagnostic. Broad performance work
remains open.
