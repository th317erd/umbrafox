# VA-API Decode Failure And Driver Lead

## Result

The narrow laptop capture completed successfully and retained two VA-API
vaEndPicture failures, status 23 (internal decoding error), followed by an
AV1 software-decoder receipt after playback. This supplies the lower-level
failure missing from the earlier log-capped EIO trace. It is not a fix or a
reproduction of the owner's prolonged post-seek stutter and black flash.

There is a strong external-driver explanation for the laptop's failure: its
installed Intel free-kernel package lacks AV1 decode support on the relevant
GPU family, despite advertising support. This remains a source-supported
hypothesis for the observed failure until a controlled driver comparison or
equivalent direct internal-path evidence confirms it. No system package,
driver, browser preference, native code or desktop browser was changed.

## Actual Capture

Build 20261006175655, isolated signed-out public YouTube fixture, ordinary visible
1080p quality selection, 20-second playback, profiler off. The only diagnostic
addition was child MOZ_LOG=timestamp,FFmpegLib:2. FFmpegVideo and PDM debug channels
were omitted. The previous sealed failed capture remains unchanged.

| UTC on October 7 | RDD / Thread | Library context | Error |
| --- | --- | --- | --- |
| 21:24:40.818021 | 2183122 / MediaPDecoder #2 | 0x7db54eb21400 | vaEndPicture status23 |
| 21:24:40.818041 | same | same | HW accel end frame fail |
| 21:24:50.336509 | 2183122 / MediaPDecoder #4 | 0x7db54eb14000 | vaEndPicture status23 |
| 21:24:50.336526 | same | same | HW accel end frame fail |

Three additional timestamp-update warnings came from Utility2183217. They are
retained, not attributed to the video decoder. Addresses are process-local and
may be reused. No exact decoder-instance/document join is asserted for log rows;
startup capability probes may coexist with actual playback.

The private after-playback receipt is bound to document 10737418243/context 11:
AV1, 1920x1080, ffvpx video decoder (RDD remote), hardwareAccelerated=false,
1225 output samples. The decoder name alone does not distinguish hardware from
software; the explicit boolean does. The element was paused immediately before
that receipt. The pre-playback receipt was shutdown at time zero, not an active
decoder. No continuous reset or path-transition observation is claimed.

The page collector completed 20001 ms, 21 samples, zero missed intervals,
1199 frames and 24 drops. All 24 drops occurred in the 5-6 second sample interval.
Do not causally join those drops to the library errors without a clock/document
join. Logging changes observation, so this is not a speed comparison or evidence
of the owner's 1-2 minute post-seek recovery.

## Source Chain

Sixteen producer/consumer files were checked against the deployed export's
HEAD892431809a4caadb5c73b2c03ad9bdb124c3e21e and frozen source.patch. The inspected
files match the frozen HEAD and are untouched by that patch. Current Searchfox
was used only for discovery.

In media/ffvpx/libavcodec/vaapi_decode.c, ff_vaapi_decode_issue reaches vaEndPicture
after successful begin-picture and parameter/slice submission. Its non-success
return emits this exact message and becomes AVERROR(EIO). In av1dec.c,
av1_receive_frame_internal emits the second message when the hardware end_frame
callback fails. FFmpegLibWrapper::Log preserves the context pointer and routes
both through the separate FFmpegLib channel. This narrows the failure boundary;
it does not identify why the driver rejected the picture.

The [libva status definitions](https://github.com/intel/libva/blob/master/va/va.h)
map 23 to VA_STATUS_ERROR_DECODING_ERROR. This is not evidence of a GPU reset,
kernel crash, failed texture copy, network interception or unsupported resolution.

## Driver Hypothesis

The saved graphics receipt reports Intel Iris Xe RPL-P, device0xa7a0, X11/WebRender,
and AV1 hardware decoding available. Post-run package metadata establishes:

- intel-media-va-driver:amd64 24.1.0+dfsg1-1ubuntu0.2 is installed.
- intel-media-va-driver-non-free is not installed.
- libva2:amd64 is 2.20.0-2ubuntu0.2.
- The logged /usr/lib/x86_64-linux-gnu/dri/iHD_drv_video.so path is owned by the
  free-kernel package. Its 13589472-byte file hashes to
  a7cecd28f70fb692a5d65c2de8c491d953bc834dc1c98c4bd93a929ffcc976ee.

This is post-run filesystem/package evidence, not a hash of the live RDD mapping.
Do not confuse the Mesa rendering-driver version with the Intel media-driver
package version.

Intel's [24.1.0 documentation](https://github.com/intel/media-driver/blob/intel-media-24.1.0/README.md)
groups Raptor Lake in TGLx and distinguishes the two package variants. Its old
AV1 support table was later corrected. Intel's
[issue1852](https://github.com/intel/media-driver/issues/1852) reports the same
error pair with the free-kernel driver. The accepted
[documentation correction1853](https://github.com/intel/media-driver/pull/1853)
explains that the affected AV1 path needs the missing film-grain kernel.
The subsequent [capability fix1862](https://github.com/intel/media-driver/pull/1862)
stops advertising AV1 decoding for affected free-kernel builds; the exact patch
is retained locally. These are upstream facts, not proof that this stream's
particular failure took that internal branch.

No driver upgrade, non-free package installation, codec forcing or sandbox
weakening is justified automatically. A useful next falsifier is a same-version
full-feature driver comparison selected only for a fresh owned process, provided
package provenance, dependencies, loader support and sandbox compatibility can be
established first. Do not modify system files or the daily browser for that test.
Actual system installation needs separate owner consent. Do not conceal this
capability issue by adding an Umbrafox-only web-visible preference or blocklist.

## Safety And Verification

The 120-second total/15-second cleanup budget and 1 MiB log cap stayed unchanged.
The run lasted 32.796 seconds, 21:24:37.940..21:25:10.736 UTC. Browser log 1284 bytes,
zero drops. Driver and run statuses pass; package postflight passes; SIGTERM
cleanup is clean. All 14 recorded PIDs were absent at 21:25:46.179 UTC. Five-second
sampling cannot certify every transient descendant.

Nine resource samples pass existing caps; peak summed RSS 2529980416 bytes
(shared-memory double counting possible), peak sampled artifacts 92737088 bytes.
Startup native app/local/temp receipts match private owned roots. This does not
prove preconsumer or continuous isolation. No profile/token/shared-queue data was
exported. The remote 37-file runtime closure remains unchanged after cleanup.

The first read-only export attempt failed before reading data because its Node
eval command lacked the expected argument slot. Its empty export.json and stderr
remain preserved. Corrected export-retry.json succeeded; no browser rerun occurred.

Tests first rejected the old verbose logging, then verified the exact limited
source delta, three pinned inputs, import routing, exclusive writes, drift and
failure handling. Saved-data tests cover malformed logs, byte/hash corruption,
wrong logging, cleanup/package failure, missing PID absence and dropped logs.
The existing quality reviewer revalidates document joins, three UI selections,
1080 admission, sampled caps and cleanup. All 150 final Node tests pass with no
skips, including eight new adapter/auditor tests. Five-file formatting and scoped
documentation lint pass. Results and commands remain in the evidence directory;
none imply a production performance fix.

## Evidence

Namespace: artifacts/umbralink-control/decoder-selection-errors/.
Harness: /home/wyatt/.cache/codex/decoder-library-errors-harness-20261007-nmE2rs.
Run: /home/wyatt/.cache/codex/laptop-youtube-quality-1080-20261007-wcXSB8.
Raw export contains 46 files/166606 bytes; SHA256
d62b1b3ea966da7d6fd4df2786bd8bdbbbe25a0fa98c86b5319542acef353a60.
Browser-log SHA256
450d766971b8a6ec0483640695343296c3bbb133ad7de95a975240de74966b75.
analysis.json contains the validated event index and complete quality summary;
source-proof.json, driver-metadata.json and intel-1862.patch preserve the source
and package boundaries. No browser, profiler or agent remains active from this
diagnostic. Broad performance work remains open.
