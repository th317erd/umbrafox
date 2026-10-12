# Startup Playback Profile Pair

## Result

The isolated laptop control reproduced 24 reported drops in 1,200 frames over
20 seconds. Its counter increased between samples at 5,001 and 6,002 ms.
The profiled trial reported zero drops in 1,200 frames, but failed profile
preservation: the produced file was 52,241,866 bytes, above the unchanged 24 MiB
copy limit. The original remains in the owned laptop run directory. Neither
the file nor any public raw profile was parsed or uploaded.

This is not an optimization or a reproduction of the owner's prolonged
post-seek stutter/black flash. One run per condition, fresh caches, ordinary
site variability, additional profile-start work and different player geometry
prevent attributing the difference to profiler overhead. The data is compatible
with observer effects, but does not establish them. No browser/default/driver
installation changes were made. The desktop and Pi were untouched.

## Runtime Evidence

Both runs used the frozen descriptor-borrow package, Build 20261006175655, and
the same privately copied iHD library. Native before/after media receipts
reported 1920x1080 AV1 and hardware acceleration; the before decoder was
`shutdown` with one output, not proof of active decoding. After playback,
both reported the RDD ffvpx decoder, with 1,205 and 1,206 outputs respectively.
The control reported
24 compositor drops and the profiled trial zero, with decoder/sink drops zero.

| Item | Control | Profiled |
| --- | --- | --- |
| Owned run suffix | B61eKy | odI1jl |
| Start UTC | 22:56:03.664 | 22:57:53.763 |
| Terminal UTC | 22:56:36.738 | 22:58:28.196 |
| Browser PID | 2219799 | 2222397 |
| Content PID | 2219963 | 2222564 |
| RDD PID | 2219930 | 2222530 |
| Document ID | 10737418243 | 10737418243 |
| Samples / missed intervals / events | 21 / 0 / 0 | 21 / 0 / 0 |
| Frames / reported drops | 1200 / 24 | 1200 / 0 |
| Resource samples | 9 | 8 |
| Peak sampled summed RSS | 2,410,725,376 B | 2,686,341,120 B |
| Peak sampled artifacts | 86,987,315 B | 80,204,611 B |
| Browser log bytes / dropped | 318 / 0 | 319 / 0 |
| Recorded absent PIDs | 14 | 14 |
| Capture status | pass | failed: profile preservation cap |

Document IDs are local to their respective processes/runs, not a cross-run
identity join. The ordinary 1080p quality menu took the same read counts in
both runs, but the Settings click center changed from (760, 535) to
(702, 502.600006). That geometry difference is retained as a confound.

The profiler's effective configuration matched 16,777,216 entries, 5 ms,
`js`, `stackwalk`, `processcpu`, `nomarkerstacks`, and the requested GeckoMain,
Compositor, Renderer, ImageBridge, Media, Video and IPC I/O filters. This
configuration receipt does not establish actual thread or retained coverage.
Parent buffer generation stayed zero; metadata alone is not a retention oracle.

No controller request ran during playback. A privileged frame closure emitted
one complete native interval marker after pausing playback, using
`ChromeUtils.now()` and the exact document ID. Page-clock readings and marker
emission brackets were retained separately. No public UserTiming entries or
page globals were added. Actual marker retention and CLI clock joins remain
unverified because the profile was not loaded.

## Failure And Cleanup

The dump completed after playback and profiler pause. Preservation rejected
the file before reading/copying its bytes. Finally successfully stopped the
profiler and verified inactivity, then the enclosing capture used its normal
owned SIGTERM cleanup. All recorded controller/browser/child PIDs were absent.
Both installations passed their 48-file postflight checks. All 43 transferred
runtime inputs still matched their manifest afterward.

Metadata-only inspection found the original profile at:

`wyatt-laptop:/home/wyatt/.cache/codex/laptop-startup-profiled-20261007-odI1jl/run/profile/umbrafox/diagnostics/profiles/dom-profile.json`

It was a canonical regular 0600 file owned by uid 1000, device 64512, inode
37366171, size 52,241,866 bytes. Its content hash is not yet known. No root-level
`profile.json` copy existed. A separate post-cleanup metadata walk counted
169,821,743 bytes across 1,360 entries under `run`, below 256 MiB. The earlier
sampled artifact maximum excludes that later dump and is not final disk usage.
No safety cap was increased, and no retry or profiler daemon was launched.

## Verification And Artifacts

Namespace: `artifacts/umbralink-control/startup-profile/`.

- `runtime-inputs.json`: 43 files, 121 import edges, 39 syntax checks. Reuses
  the previous immutable capture/failure wrapper and driver helpers.
- `profile-file.generated.mjs`: AST-extracted unchanged `preserveProfile`
  function, with source/region/generated hashes and tests. Avoids importing
  the unrelated DOM workload and its parser dependency.
- Failing-first bridge and realm tests caught an obsolete Services module
  import and content inspection in the wrong realm before runtime. Initial
  missing-module RED is not evidence of a browser bug.
- `control-export.json`: 49 bounded evidence files; SHA256
  `e00de3242e40aa421d2258bae5bab7424af2fa7a728303bcca250743f3e00c55`.
- `profiled-export.json`: 52 bounded evidence files; SHA256
  `ff7baa45d4bcd84142b41ab621fdc5dd91136866cd51b37896fb82cda7129a84`.
- Full validator rejects the failed trial. Its explicit partial-review mode
  verifies the completed observation and cleanup without reclassifying the run.
- `comparison-v2.json` is authoritative: four binary/INI hashes and seven
  fixture hashes match; seven loose userland-module records are null, not loaded
  module proof. Initial `comparison.json` used nonexistent provenance keys and
  is superseded; its counter summaries agree, but its provenance assertions
  compared undefined values. Both generations and commands are retained.
- Pure/fake checks cover generated frame bridging, identity, timer cleanup,
  abort, changed video/document, clocks, exact profiler configuration, first
  failure preservation, start/dump/stop failures, opaque file limits and
  malformed evidence. The final combined suite passed all 192 tests in 4.561 s.
  Five manual JavaScript files passed format checks; documentation lint reported
  zero problems. The generated preservation function passed exact-source checks.

## Next Step

Do not repeat the browser capture simply to work around the file cap. First
design/test a separate bounded opaque compression/export of the existing owned
file: verify its identity, stream/hash without JSON parsing, keep compressed
output below 24 MiB, verify decompression hash, and retain the original failure.
This does not alter the original run or increase its limits. Load only the
resulting admitted local file with profiler-cli and an explicit loopback-only
symbol server, in an owned named session with verified cleanup.

The profiled trial did not reproduce the drop burst, so it can establish
coverage and serve as a smooth-reference capture, not identify a drop cause.
Any later marker-only observer trial requires its own plan/tests and explicit
separation from full sampling. Continue treating the owner's observation as
video progress-bar seeking, not YouTube search. Desktop control/restart and
system driver installation still require owner consent.
