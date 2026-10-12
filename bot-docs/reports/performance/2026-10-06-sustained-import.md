# Sustained Import Playback: Exploratory Results

## Decision

The same-package laptop diagnostic produced a concrete lead, not a completed
performance acceptance. Import OFF started with an accelerated canvas provider
and ended with a software/shared provider. Import ON was accelerated at both
boundaries, with much shorter synchronous drawImage calls and lower summed
process CPU in this one pair. The balanced OFF/ON/ON/OFF sequence stopped when
OFF failed its acceleration-retention requirement.

All three original capture reports remain FAILED. Saved-data replay does not
rewrite them. The preceding pixel gate remains independently successful:
48 ordered hashes and four retained RGBA buffers matched exactly. No default,
native source, daily installation, desktop browser or public JavaScript
interface changed in this phase. The candidate remains off by default.

## Inputs

- Host: wyatt-laptop, fresh owned installations and private data roots.
- Package: `exports/umbrafox-import-recovery-20261006-r2/`.
- Observed native BuildID: `20261006070020`.
- Manifest SHA256:
  `21178496e1612b579e18b6234bff4a052bbe229cb7c861872c713e11cb89c99f`.
- Archive SHA256:
  `7f6c660bace67c486c4817f87811ee7cadef95f2fbce1bb472b573e7334f0dd3`.
- Fixture: owned 90-second 1920x1080 H.264 video, 30 frames/second, SHA256
  `aac5b2c571eff675332728d94291137bf184c41644d7beb6f8467fee05907d27`.
- Compared preference: `gfx.canvas.remote.use-draw-image-fast-path-dmabuf`.

One visible 320x180 default canvas received 1/4/4/1 drawImage calls per video
callback across four consecutive 12-second phases. No per-frame pixel reads,
hashes, filters, shadows or clears; one setup draw was excluded. Playback was
continuous and paused at the end. No profiler was active. This local workload
is not YouTube or a physical scanout test.

The working Canvas2D source remains V2; packaged R2 uses the previously
documented full-size diagnostic path. Do not attribute results to unmodified V2,
or install/repackage the object directory as matching the restored source.

## Preserved Failures

1. OFF `xgVrMh`: completed 48 seconds but final `getDebugInfo(false)` failed
   with `No target available`. Normal presentation can return the borrowed
   target without removing its provider. This is not proof the canvas stopped
   working. Original evidence remains separate and excluded from the pair.
2. Revised OFF `DXt1ae`: final-only `getDebugInfo(true)` explicitly recorded
   `ensureTarget:true`. Initial provider was accelerated, final software/shared.
   The acceleration gate correctly failed; the balanced sequence stopped.
3. Same revised bundle ON `fttkzO`: one diagnostic falsifier, not a completed
   performance sequence. Both provider boundaries were accelerated. Capture
   failed an incorrect condition requiring final frame presentation time to
   be no later than paused video.currentTime: 48.000 versus 47.99629 seconds.

The final query can borrow or recreate a target; it does not prove continuous
acceleration, transition time or individual import use. It runs after the timed
page phases; process CPU includes boundary work.

The timestamp correction follows the upstream producer and the
[video-frame callback specification](https://wicg.github.io/video-rvfc/).
Presentation timestamps and playback position are different quantities; the
producer can select an image for the next composition. Validation still
requires finite, nonnegative, ordered times within the 90-second source, without
an arbitrary tolerance. Saved ON passes the corrected contract and unchanged
acceleration gate; OFF still fails the latter.

Exact revised runtime source is `sustained-import-r2/before-media-time.mjs`.
Current local source includes the later timestamp validation correction.
Future runtime must use a new frozen bundle rather than reuse its old identity.

## Observations

Evidence: `artifacts/umbralink-control/sustained-import-r2/`.
`comparison.json` explicitly has `comparisonAccepted:false`. This is one pair.

| Observation | Import OFF | Import ON |
| --- | --- | --- |
| Provider before / after | accelerated / software | accelerated / accelerated |
| Four-copy batch medians, two phases | 37 / 38 ms | 0 / 0 ms |
| Four-copy batch P95, two phases | 50 / 55 ms | 1 / 1 ms |
| Four-copy callback gaps over 50 ms | 13 / 46 | 0 / 0 |
| Callback counts by phase | 296 / 296 / 280 / 296 | 297 / 298 / 297 / 297 |
| Reported video-frame drops | 0 | 0 |
| Process CPU observation interval | 48.137 seconds | 48.126 seconds |
| Summed joined-process CPU | 42.482 CPU-seconds | 26.936 CPU-seconds |
| Browser-process CPU | 13.995 CPU-seconds | 19.372 CPU-seconds |
| RDD-process CPU | 21.101 CPU-seconds | 2.029 CPU-seconds |
| Web-content-process CPU | 7.187 CPU-seconds | 5.294 CPU-seconds |

Zero means below observed page timer resolution, not free rendering. drawImage
duration measures synchronous return, not GPU completion. Higher browser CPU
and lower RDD/content CPU may reflect relocated work as well as avoided work.
No GPU time, percentage speedup, per-copy cost or statistical confidence claim.

Both final paused boundaries report hardware-accelerated remote FFmpeg decode;
that does not establish every intermediate route or attribute all RDD CPU to
decode. Callback counts are not displayed-frame counts: about 360 video frames
per phase and zero drops were reported despite fewer callbacks. Neither these
counters nor callback gaps prove physical display smoothness.

CPU uses raw cumulative nanoseconds, not rounded diagnostic milliseconds.
Within each run, endpoint PID/type/child-ID sets match and sampled process-start
identities are consistent. Unsampled transient processes and observer cost
remain limitations.

## Operational Evidence

| Observation | Revised OFF | Revised ON |
| --- | --- | --- |
| Controller / browser PID | 1363605 / 1363617 | 1366494 / 1366506 |
| Capture duration | 59.849 seconds | 59.775 seconds |
| Resource samples | 13 | 13 |
| Peak sampled artifact bytes | 145936350 | 144495286 |
| Exported files / bytes | 41 / 324687 | 41 / 325970 |
| Recorded PIDs verified absent | 12 | 12 |
| Browser log bytes / dropped bytes | 271 / 0 | 271 / 0 |
| Shutdown | clean SIGTERM | clean SIGTERM |

Postchecks pass: 46 packaged files plus empty `.parentlock`, 475120013 bytes;
allowed empty updater directories are separate. Analysis initially asserted a
nonexistent `verifiedFiles` field. The retained `analysis-first.log` failure
preceded a correction based on the actual verifier contract.

Native receipts join PID, BuildID and owned application-data/local-data/temp
roots. Exported bytes match remote hash/size receipts; profiles, tokens and
private app-data contents are excluded. Post-startup receipts do not establish
pre-consumer or network isolation, or absence of unrecorded transient helpers.

## Verification And Next Step

The Node client previously imposed a fixed 15-second timeout. Its narrow change
adds an explicit integer 1..60000-ms request argument, preserving the 15000-ms
default; only this workload opts into 60000 ms. No browser protocol change.
Failing-first tests cover delayed replies and invalid values. The full existing
tooling suite passed 301 tests after that change.

All 28 final focused tests pass: collection, observer lifecycle, bridge timeouts, capture
failures, serializer bounds, driver equivalence, CPU corruption and saved replay.
Replay verifies hashes and keeps original FAILED statuses; corrupt timings,
copy counts and source bounds reject. Exact tooling/docs lint reports zero
problems, formatting and diff checks pass. All 16 native source hashes,
78 unchanged runtime inputs, HEAD and staged/unstaged diff hashes match their
entry records. The old runtime module is preserved separately and matches its
frozen hash. The preceding 112-file pixel evidence seal also verifies unchanged.

A possible existing fallback chain runs from DrawTargetWebgl usage profiling
through CanvasTranslator refresh notification to CanvasRenderingContext2D
stopping acceleration. Allocation failures and other fallback routes also
request refresh. No captured reason or transition time establishes the cause.

Next: separately observe provider state at phase boundaries or immediately
after an existing draw, with observer effects measured and natural fallback
preserved. Read actual profile preferences, not assumed defaults. Classify
fallback explicitly in a new prospective contract; do not force acceleration,
suppress fallback or relabel failed gates. Then obtain balanced repetitions on
the same package before connecting this lead to YouTube or deployment.
