# Audio Path Admission Completed

## Result

One isolated laptop run passed at2026-10-08T04:05:10..04:05:25UTC
(October7 local time). The same video/document produced two positive,
progressing native audio-sink observations at element volume0.05. This closes
an audio-on coverage gap in the earlier muted fixtures. It does not reproduce
Wyatt's prolonged post-seek stutter/black flash, identify its cause, establish
physical audible output, or demonstrate a performance improvement.

This report advances phases2-3 of
[Audio Path Admission](../../plans/audio-clock-admission.md). That phase1 plan,
report, checkpoint and all earlier sealed evidence remain byte-identical.
The next implementation contract is [Audio-on Seek](../../plans/audio-on-seek.md).

## Observation

- Build20261006175655; fresh profile and owned application-data/local-data/temp;
  private installation and child-only private iHD; normal visible1080p menu.
- Fixed public video: https://www.youtube.com/watch?v=aqz-KE-bpKQ.
- BrowserPID2303940, contentPID2304110, context11, document10737418243.
- Native sink output48000Hz; written frames45056 ->92160.
- Sink lastGoodPosition757083 ->1770916us, an advance of1013833us.
- Query durations1.686926/1.238523ms;1008.973105ms between query brackets.
  These are diagnostic request durations, not video/render latency attribution.
- Both before/after states for both reads: unmuted, volume0.05, playing,
  not seeking, rate1. Same sink anchor0 and output rate across the pair.
- Original paused/unmuted/volume1 restored. Same element retained by the
  private closure; parent/content/document joins passed.
- Parent and selected-content profiler boundaries inactive; no profile dump,
  thread sampler, page UserTiming marker or new public API.

The clock-source enum is still unobserved. The debug query calls GetClock and
can affect handoff/queue state. Do not equate this with continuous audio-clock
selection, passive observation, device audibility, or a muted/audio comparison.

## Decoder Label Qualification

The initial video label was shutdown; after playback it was
ffvpx video decoder (RDD remote). Both reports had hardwareAccelerated=true
and video/av1 at1920x1080. This is not a contradictory software-only label:
the frozen FFmpegVideoDecoder GetDescriptionName selects ffvpx by compile-time
family, independent of its hardware-device contexts. The remote decoder caches
the hardware flag at initialization, and MediaFormatReader refreshes its copy
when processing decoded output. Its debug getter returns that stored flag.
A shutdown name can therefore coexist with the last reported hardware state.

The installed private iHD mapping is independently joined to the owned RDD.
Neither that mapping nor the cached flag is continuous/per-frame backend proof.
No new decoder defect or fallback is established. Earlier reports remain sealed;
this does not reclassify their independently recorded software/hardware flags.

Discovery used Searchfox, including the
[name producer](https://searchfox.org/firefox-main/rev/cfd140a311d8523d3d35e00ee1a9f2403c033dfd/dom/media/platforms/ffmpeg/FFmpegVideoDecoder.h#106)
and [debug flag consumer](https://searchfox.org/firefox-main/rev/cfd140a311d8523d3d35e00ee1a9f2403c033dfd/dom/media/MediaFormatReader.cpp#3537).
Deployed authority is base892431809a4caadb5c73b2c03ad9bdb124c3e21e plus package
patchd1bf3bdfe9f7d36c82181db0b4487592d5b8857b070e43c1b2ee6aaea9cd1677,
not today's dirty source or Searchfox tip. decoder-source-proof.json pins six
untouched producer/consumer files against that package. It is not a fresh
binary-to-source attestation.

## Safety And Verification

Scratch tooling only: artifacts/umbralink-control/audio-clock-admission.
Reused captureLocalWorkload, capturePrepared, native media frame-message route,
quality preparation, ownership, resource monitor and cleanup. No product code,
browser defaults, system driver, desktop/Pi state, staged index or native build
changed. No native build was regenerated. Documentation lint recreated only a
32KiB directory containing its own profile log; the final absence gate caught
this. That log is retained as lint-profile.json, and only its file and empty
parent directories were removed. Both cleaned object directories are absent.

The new private session retains the same video across both reads, waits at
least1s before/between reads, and pauses/restores in finally. Native query3s,
session14s plus child watchdog15s, parent watchdog16s, control18s; existing
capture120s/work105s/cleanup15s and256MiB artifact cap remain unchanged.
Cancellation bounds waiting and rejects late publication; it does not prove
OS/native work cancellation or hard real-time response to a blocked event loop.

Phase2 prelaunch44 tests passed. Tests cover serialized child execution, exact
eight-RPC capture ledger, every request/write/mapping failure, aborts, same-video
identity, wrong PID/document, malformed replies, delayed watchdogs, late native
rejection, restoration and source/inverse proofs. An actual failing assertion
showed a secondary evidence-write error masking an earlier resource abort;
the regression is fixed and retained. Initial session scaffold logs include a
test syntax error, corrected before green; not counted as behavioral RED proof.
Saved-data review adds two tests with20 independently corrupted cases;46 total
tests pass. Pure/fake tests are not substituted for the real run above.
Named documentation linters passed with zero errors/warnings using the existing
prebuilt mozcheck binary; no compiler or bootstrap installation was invoked.

Five resource samples plus baseline passed caps; peak sampled RSS2428342272B,
artifacts80546623B. These are sampled peaks, not final size or continuous bounds.
Browser log324B, zero dropped log bytes; retained sandbox EPERM and libva startup
lines. Clean owned SIGTERM; all14 recorded browser/controller/process PIDs absent
in export.46 exported files,160341B, no profile/token/queue payload export.

Postflight04:10:27UTC: all59 runtime inputs unchanged, no matching browser/build
process running. System iHD SHAa7cecd28f70fb692a5d65c2de8c491d953bc834dc1c98c4bd93a929ffcc976ee
unchanged, non-free package still not installed. Native root receipt is
post-startup evidence, not a network sandbox or no-earlier-access/no-upload proof.

## Reproduction And Evidence

Laptop input package:
/home/wyatt/.cache/codex/producer-fence-playback-harness-20261007-t27Mxk/baseline.
New harness: /home/wyatt/.cache/codex/audio-clock-harness-5CWvps.
Run: /home/wyatt/.cache/codex/laptop-audio-admission-audio-20261007-AMoTqL.

Runtime manifest SHA7f63945415ad75949f3e2ec1d577b834b371673c72b829828e3c60dc7715fd17;
59 files/55 syntax checks/185 import edges. Six new runtime files were transferred
in51200B delta archive, using verified copies of53 existing inputs. No second
80MiB archive was created locally. bundle.json also verifies102 old sealed files
and22 phase1 checkpoint files unchanged.

Exact shell entry, on laptop with current directory equal to the new harness:

```sh
timeout --signal=TERM 210s env DISPLAY=:0 XDG_RUNTIME_DIR=/run/user/1000 \
  node artifacts/umbralink-control/audio-clock-admission/driver.generated.mjs \
  /home/wyatt/.cache/codex/producer-fence-playback-harness-20261007-t27Mxk/baseline \
  audio oct8-audio-1
```

This records the completed command, not authorization to rerun it. Outer SSH
was240s; there was exactly one browser launch, with exit0. Driver prefix says
20261007; UTC timestamps govern actual execution date. All commands terminated.

Local verification:

```sh
timeout 10s node --test --unhandled-rejections=strict \
  artifacts/umbralink-control/audio-clock-admission/test/*.mjs
timeout 10s node artifacts/umbralink-control/audio-clock-admission/review.mjs \
  artifacts/umbralink-control/audio-clock-admission/audio-1-export.json
```

The immutable export SHA is
b1edd01a7866489cdb2652201e7c0c292b5ba905a0944a4a6fa02a3b9ccca9eb.
audio-1-review.json contains the recomputed result; phase2-reviewed-tests.log,
abort-preservation-red.log, review-green.log, payload-inputs.json,
driver-inputs.json, runtime-inputs.json, bundle.json, preflight.json and
postflight.json retain the detailed contracts and gates. Source query logs retain
the Searchfox update notice; no tool installation or update was performed.
