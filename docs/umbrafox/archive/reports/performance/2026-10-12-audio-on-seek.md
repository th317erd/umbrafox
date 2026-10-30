# Audio-on Seek: Sustained Frame Drops Reproduced

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Result

The first audio-on progress-bar seek produced sustained elevated dropped-frame
counters on `wyatt-laptop`. The matched no-seek control did not show that sustained
pattern. This closes a reproduction gap, not a root-cause or optimization gate.
No engine change was made and no performance improvement is claimed.

Both completed captures used Build20261006175655, the previously verified laptop
package, not the new October12 beta or Wyatt's active desktop installation.
The public video was `https://www.youtube.com/watch?v=aqz-KE-bpKQ`, signed out,
selected through the normal1080p menu: AV1,1920x1080, approximately60fps. The laptop
reported Intel Iris Xe RPL-P/Mesa25.2.8, X11/KWin, WebRender and60Hz. A child-only
private iHD mapping was verified; no system driver was installed or changed.

| Observation Window | Control Drops/Frames | Seek Drops/Frames |
| --- | --- | --- |
| Initial20s | 26/1201 (2.16%) | 3/1200 (0.25%) |
| Next45s, containing seek in that arm | 6/2700 (0.22%) | 279/2678 (10.42%) |
| Following45s | 7/2699 (0.26%) | 283/2699 (10.49%) |
| Final40s control /41.678s seek | 9/2400 (0.38%) | 226/2501 (9.04%) |

Control had a23-drop cluster in its initial2-3s sample window. It is retained,
not excluded from the totals. All four control windows totaled48/9000 drops;
the seek windows totaled791/9078. These are two observations, not a repeatability
claim or a controlled causal effect estimate. Their media content after the
action differs, and the UI action requires additional RPCs in the seek arm.

The seek moved from about22.77s to target45s. Trusted `seeking` and `seeked`
events were observed326ms apart. The retained interval ended130007ms after
`seeked`. The last window still had drop clusters; no complete recovery was
established. No subsequent `waiting`, seek or format-change event was recorded
in the last two windows. Every sample reported1920x1080 and no one-second sample
interval was missed. This does not establish physical display cadence or exclude
brief unsampled events. No visual recording was made, so Wyatt's black flash
was neither reproduced nor excluded.

## Native Endpoint Evidence

Both runs retained the same video/document/content process throughout playback.
Two native audio observations before and two after the timed interval showed a
playing, non-error, non-completed sink with advancing position/written frames.
The element was unmuted at volume0.05. Its original paused/unmuted/volume1 state
was restored by final cleanup, with no intermediate pause for diagnostics.

The seek's sink anchor changed from0 to45220288us across the seek. Each pair
was internally stable and advancing; the cross-seek change is recorded, not
rejected or normalized away. Clock-source selection and physical audibility
remain unobserved. Native debug reads call GetClock and can affect state, so all
four audio reads were outside the timed observation. Only before/after native
decoder reads were made; no decoder query was inserted at sparse checkpoints.

Native final counters:

| Counter | Control | Seek |
| --- | --- | --- |
| Output samples | 9474 | 9692 |
| Skipped samples | 0 | 0 |
| Dropped decoded frames | 0 | 0 |
| Dropped sink frames | 0 | 1 |
| Dropped compositor frames | 48 | 845 |
| Image-container compositor drops | 48 | 845 |

These endpoint totals include preparation and post-observation playback, unlike
the segment deltas. Therefore845 is not a contradictory recount of791.
The final decoder name was `ffvpx video decoder (RDD remote)` and the hardware
flag was true. As established in the October7 source audit, the name identifies
the compiled decoder family, not a software-only branch; the flag is cached,
not per-frame hardware proof. The initial paused decoder name was `shutdown`.

## What The Counter Means

Searchfox discovery was checked against the tested package's actual source
authority: base892431809a4caadb5c73b2c03ad9bdb124c3e21e plus frozen patch
d1bf3bdfe9f7d36c82181db0b4487592d5b8857b070e43c1b2ee6aaea9cd1677.
`source-proof.json` verifies seven untouched producer/consumer files against
that base and the package's final source manifest. The separate ImageContainer
patch only adds sized readback support; its drop callback is unchanged.
This is source mapping, not fresh binary-to-source attestation.

`ImageComposite::ChooseImageIndex` selects from valid queued images using
timestamps relative to the composition time and a small bias.
`CountSkippedFrames` counts eligible skipped frames within the same producer;
`UpdateCompositedFrame` accumulates drops when the video was visible in the
previous composition opportunity. `WebRenderImageHost` exposes the accumulated
count; ImageBridge reports it asynchronously to ImageContainer. VideoSink later
incorporates that count into frame statistics.

Thus "compositor drops" does not mean "the GPU took too long". Timestamp mapping,
late delivery, composition scheduling, resource readiness and rendering delays
remain distinct possibilities. A zero decoded-drop counter does not prove fast
decoding or rule out late upstream delivery. Notification/sample times are not
the exact frame-drop times.

The deployed source already has markers for `VideoFrameTimeStampJitter`,
`Video frame offsets`, `ImageComposite::SetImages`, `UpdateCompositedFrame` and
`Video frames dropped`. `VideoSink::RenderVideoFrames` maps media time to system
timestamps using the audio clock. These are useful next measurement boundaries,
not grounds to adjust bias, skip synchronization or rewrite the renderer.
Discovery reference: [ImageComposite source](https://searchfox.org/firefox-main/rev/1a097ed8d31f6b307a5d0ebc34a82ceaf7f3727b/gfx/layers/composite/ImageComposite.cpp#298).
Searchfox CLI reported0.18.0 installed/0.20.5 available; no update was performed.

## Implementation And Verification

New ignored scratch namespace: `artifacts/umbralink-control/audio-on-seek/`.
Hash-checked source-region generation adapts the sealed recovery/sequence and
audio admission helpers without editing them. A private preparation/begin barrier
admits an advancing audio sink before timed playback, and final audio observations
precede restoration. Generated serialized child execution is tested in a fake
runtime, as well as the host request/write integration and failure paths.

A real failing assertion caught a secondary evidence-write exception hiding an
earlier resource abort; the new adapter preserves the original reason and records
the secondary failure. Tests cover each host RPC/write failure, cancellation,
late replies, identity mismatch, stalled audio, deadline/reserve, restoration and
saved-evidence corruption. Initial missing-module scaffolding failures and a
corrected cross-realm fake/test-variant mismatch are not behavioral RED evidence.

Final strict Node gate:201 tests PASS,0 fail/skip, including adjacent audio and
seek suites. Authored helper/offline/test ESLint checks pass; generated runtime
bytes are validated by their hashes and serialized execution tests, not presented
as an all-generated-code style gate. Ambient Node21 lint emits an experimental
JSON-module warning; runtime laptop Node is24.18.0. Lint-only offline changes
reproduce both saved reviews exactly. All eight new runtime delta files remain
byte-identical after review; remote postflight verifies all67 inputs unchanged.

No native/product/default/public-interface change, build, profiler, raw-profile
parse, desktop/Pi action, staging, commit or delegation occurred. Explicit test
volume/playback/seek actions were confined to the owned isolated browser.

## Failures, Safety And Cleanup

The first control stopped during startup, before streaming, on the existing
artifact monitor's three-attempt instability limit: an ENOENT descendant under
owned `profile/storage`. It recorded clean SIGTERM/root absence; both recorded
controller/browser PIDs were subsequently absent. With no completed resource
samples, it does not prove all transient children were observed. Its evidence
remains `control-1-export.json`. No cap/retry policy was relaxed.

The plan allowed exactly one startup-only replacement control after failure
export/cleanup/input verification. That control passed; only then was the seek
launched. There were exactly three launches total, two with measured playback.

Both successful runs stayed within240s total/225s work/15s cleanup and256MiB
artifact limits. Each had37 resource samples, clean owned SIGTERM,14 recorded
PIDs absent at export, zero dropped log bytes and restored owned playback state.
Peak sampled RSS:2498129920B control/2540924928B seek; artifacts164993405B/
181045304B. These are sampled bounds, not continuous maxima or final disk usage.
Browser logs326B/329B retain sandbox EPERM/libva startup warnings.

Owned native UAppData/local-app-data/temp paths matched child environment receipts.
These are post-startup observations, not a network sandbox or no-earlier-access
proof. No personal profile, token or shared queue payload was exported.
Postflight05:42:00UTC found no matching browser/build process on the laptop,
all67 inputs unchanged,12.55GB memory available and22.51GB disk available.
No controller/browser/test command remains running.

## Evidence And Next Gate

Laptop harness: `/home/wyatt/.cache/codex/audio-seek-harness-PbcPcg`.
Input package: `/home/wyatt/.cache/codex/producer-fence-playback-harness-20261007-t27Mxk/baseline`.
Run roots under `/home/wyatt/.cache/codex/`:

- Failed startup: `laptop-audio-seek-control-1080-20261012-dGBpso`.
- Control: `laptop-audio-seek-control-1080-20261012-ExSqOr`,05:30:35..05:33:26UTC Oct13.
- Seek: `laptop-audio-seek-ui-forward-1080-20261012-zWKDpm`,05:34:24..05:37:16UTC Oct13.

Dates in names use October12 local time. Completed command, not a rerun request:

```sh
timeout --signal=TERM 360s env DISPLAY=:0 XDG_RUNTIME_DIR=/run/user/1000 \
  node artifacts/umbralink-control/audio-on-seek/driver.mjs \
  /home/wyatt/.cache/codex/producer-fence-playback-harness-20261007-t27Mxk/baseline \
  ui-forward-1080
```

Control used `control-1080`; outer SSH bound400s. Runtime manifest SHA
e824886919bd0f903fc71672990fce9ced136959902e84cc4eecb69ed57ac113;
delta8files/81920B SHA657c293ac1d83e3c55812c5264a55b84735d9f035031727e4624526dba98fe22.
The59 old inputs were copied from their verified snapshot, not current source.

Local export hashes:

- Failed control: `2d4584c5141d48769748e4d4fca2eced7fa22ccf91170e07eb605aaf0b477954`.
- Control: `9fb862b83a706f085bb234df7e64f30b797b8cd87c7afef55326e1318af40c3e`.
- Seek: `3ead3dfe92de4f94af94ad572a8a5450acf450b88fae32c62e2b63040518a8df`.

Exports contain19/97/105 allowlisted evidence files respectively. Saved reviews,
generation ledger, manifests, pre/postflight, RED/green/lint logs and source
proofs are in the new namespace. Its final SHA256SUMS seals90 files/2270444B;
manifest SHA b7198a46766816879080d963f50e9cd53660fdbbcbe164b53a59ff3a389b3888,
verified immediately after writing. Revalidate without launching a browser:

```sh
timeout 30s node --test --unhandled-rejections=strict \
  artifacts/umbralink-control/audio-on-seek/test/*.mjs \
  artifacts/umbralink-control/audio-clock-admission/test/*.mjs \
  artifacts/umbralink-control/seek-recovery/test/*.mjs
timeout 10s node artifacts/umbralink-control/audio-on-seek/review.mjs \
  artifacts/umbralink-control/audio-on-seek/seek-export.json
```

Next: define a bounded observer-sensitivity/localization contract before any
additional playback. Keep this endpoint-only reproduction sealed. Prefer existing
frame-choice/timestamp markers or a narrowly scoped private observation over new
public APIs or a renderer rewrite. Require same-document/process/frame-producer
joins, explicit clock conversion, buffer completeness and a matched observer
control before interpreting new internal data. Separate timestamp/delivery issues
from actual render/swap/wait cost, then select one falsifiable engine change.
The owner's exact stream/audio/seek pattern remains unanswered; do not claim this
is already their exact symptom or the beta's performance result.
