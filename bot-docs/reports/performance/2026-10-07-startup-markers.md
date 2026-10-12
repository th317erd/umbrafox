# Marker-Only Startup Pair

## Result

Progress, not an optimization. One isolated laptop control reproduced a short
drop burst; one marker-only recording did not. The owner's report concerns
**seeking with the video progress bar**, not searching YouTube. These startup
trials do not reproduce the prolonged post-seek stutter or black-flash recovery.

| Observation | Unprofiled control | Marker-only |
| --- | --- | --- |
| UTC start | 23:30:50.057 | 23:31:57.367 |
| UTC finish | 23:31:23.157 | 23:32:30.693 |
| Capture result | PASS | FAIL: Profile preservation cap |
| Playback samples | 21 | 21 |
| Playback frames | 1,198 | 1,200 |
| Reported drops | 24 | 0 |
| Missed sampling slots / media events | 0 / 0 | 0 / 0 |
| Native compositor / decoder / sink drops | 24 / 0 / 0 | 0 / 0 / 0 |
| Resource samples | 9 | 8 |
| Peak sampled RSS bytes | 2,491,826,176 | 2,357,424,128 |
| Peak sampled artifact bytes | 95,252,993 | 80,331,519 |
| Browser log bytes / dropped log bytes | 318 / 0 | 319 / 0 |
| Recorded PIDs absent after cleanup | 14 | 14 |

Both native boundaries reported hardware-accelerated AV1 at 1920x1080. The
before receipt had one output and decoder label `shutdown`; after playback the
label was `ffvpx video decoder (RDD remote)`, with 1,207 and 1,206 outputs.
These are boundary observations, not continuous hardware-path proof.

The control's public drop counter changed by 24 between observed page times
5,003 and 6,002 ms. That is a counter-observation interval, not the time of the
actual drops. Existing source traces show asynchronous propagation from the
compositor category. The category does not prove GPU, driver or scheduling cause.

## Recording Boundary

The runtime change was only the feature array: `nostacksampling` and
`nomarkerstacks`, preserving 16M entries, nominal 5 ms interval and the existing
thread filters. Effective configuration matched before and after playback;
buffer generation remained zero, ending at position 9,531,125 of 16,777,216.
Profiler pause, dump, stop and inactive-verification receipts passed.

The raw dump was 48,114,086 bytes, so the existing 24 MiB opaque-copy helper
refused it. `run.json` and `driver.json` remain failed. The complete reviewer
rejects that capture; the explicit partial reviewer accepts only its playback
observation and cleanup. No copy cap or artifact cap was increased.

The original dump remains at:

```text
/home/wyatt/.cache/codex/laptop-startup-profiled-20261007-kCNFsh/run/profile/umbrafox/diagnostics/profiles/dom-profile.json
```

Metadata-only receipt: dev 64512, inode 37367947, uid 1000, mode 0600,
mtime 1791415950488.5896 ms. Raw content hash is not yet known. A post-cleanup
metadata walk counted 149,683,636 bytes across 748 entries under `run`, below
256 MiB. Peak sampled artifact size above precedes the dump; it is not final size
or a continuous size bound. The dump operation itself has no hard byte bound.

No raw JSON parsing, profile transfer or profiler CLI daemon was used this wave.
Source supports disabling captured stacks, not necessarily all sample rows.
Actual retained markers and stack absence remain unverified in this dump.

## Provenance And Verification

- Frozen descriptor-borrow package, BuildID `20261006175655`; no rebuild.
- Same four binary/INI hashes and seven fixture hashes across the pair; seven
  loose userland module records are null, not loaded-module proof.
- Same existing private iHD library, verified in the owned RDD mapping and
  installation before/after. No system driver installed or changed.
- System free iHD remains 13,589,472 bytes with SHA256
  `a7cecd28f70fb692a5d65c2de8c491d953bc834dc1c98c4bd93a929ffcc976ee`;
  non-free package remains not installed at 23:33:32.983 UTC.
- Canonical private harness root:
  `/home/wyatt/.cache/codex/startup-markers-harness-20261007-v2Caxw`.
  All 45 inputs matched before, between and after runs. Bundle closure has
  135 import edges and 41 syntax checks.
- Generator changed AST-selected literals/imports only. Each of the four
  generated files reverses byte-for-byte to its sealed source. The inherited
  lifecycle, cleanup and preservation helper are unchanged.
- Fail-first feature tests retained; 14 focused tests and the combined 102-test
  strict-unhandled suite passed. Full recorded-run review passed for the control;
  partial-only review passed for the failed profiled run.
- Private interval receipts use document `10737418243`, content PID `2236923`
  or `2239416`, and unique nonces. No public UserTiming or page-global markers.
- No desktop/Pi browser control, personal-profile access, product/default edits,
  system-driver installation, staging or commits.

Upstream discovery used searchfox-cli 0.18.0, which advertises 0.20.5; it was not
updated. Local profiler feature, implementation and test files exactly match
the pinned package base. The
[upstream test](https://searchfox.org/firefox-main/rev/cfd140a311d8523d3d35e00ee1a9f2403c033dfd/tools/profiler/tests/browser/browser_test_feature_nostacksampling.js#70)
also distinguishes sample rows from captured stacks. `source-proof.json`
preserves hashes and excerpts.

## Limits And Next Step

This repeats the earlier sampled-profile pair's pattern: a control burst and
zero drops under profiling. It is consistent with observer perturbation, but
not a causal result. Fixed ordering, fresh page/cache variability, profiler
activation and setup timing remain confounds. YouTube's settings-control
geometry differed again: approximately (714, 496.9) versus (760, 535). No CSS,
fullscreen or resize intervention was made to manufacture matching layouts.

Before further browser trials, compare the saved setup/clock receipts and trace
profiler activation effects. A matched setup-only control is a candidate, not
an established solution. The existing bounded opaque exporter can separately
recover this dump without changing the capture failure. Even a successfully
recovered zero-drop profile cannot identify the missing stutter's cause.

Artifacts: `artifacts/umbralink-control/startup-markers/`. Control metadata export
SHA256 `59bf74c2921d931e851ee838b9b96c192e5f4d787c12a63410f8d2b4080ed923`;
profiled export
`ab299c40c3c7a3d6437a7634db400157249c4f1209392edd4e26ba17e4571d4a`.
Original failures and prior sealed captures remain unchanged.
