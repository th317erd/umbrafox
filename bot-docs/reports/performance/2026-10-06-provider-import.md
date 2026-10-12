# Provider Import Localization

## Result

The isolated OFF run was accelerated after video callback 9, then software/shared
after callback 10. Callback 10 began 475 ms into the first phase; its existing
draw batch took 21 ms. Subsequent sampled points and the final observation were
software-backed. This brackets an observed provider change, not its exact native
timestamp or cause.

The equivalent ON run was accelerated at all 27 in-playback samples and both
boundaries. Both captures passed this prospective diagnostic contract, completed
48 seconds, and shut down cleanly. The earlier strict acceleration-retention
failure remains a failure under its original contract; nothing was relabeled.

The observed early one-way fallback is not a reproduction of the owner's
later smooth/stutter cycling. No YouTube or physical display conclusion is made.
No desktop browser, daily installation, default preference or native source was
changed. Broader performance acceptance remains open.

## Inputs And Observation

Both runs use corrected R2 BuildID `20261006070020`, identical package inputs,
the owned 90-second 1080p30 H.264 fixture and 320x180 default canvas. The unchanged
48-second workload draws 1/4/4/1 copies per video callback across 12-second phases.
There is no per-frame pixel readback, hashing, clear, filter, shadow or GPU wait.

The observer samples immediately after existing draw batches: first 24 callbacks
globally, plus the first callback of each later phase. Every additional native
query uses `getDebugInfo(false)`, without borrowing a new target. The original
before/after queries retain false/true for ensureTarget. The latter can recreate
or borrow a target and remains a limited endpoint observation.

Each bounded sample joins phase, phase-callback ordinal, global ordinal and page
callback time. Query duration is separate from draw timing. Additional event
dispatch and observation still affect scheduling; equal code is not proof of
equal cost or zero overhead. Twenty-seven native query durations were recorded
as 0 ms in OFF; ON recorded one 1-ms query and 26 zeros. These are timer-limited
observations, not proof the queries were free.

Actual profile preferences match before/after and across arms: frames 10,
fallback ratio 0.30000001192092896 and cache-miss ratio 0.6600000262260437, all
without user overrides. Native profiling frames and video-callback ordinals are
different counters. Their similar values do not prove the refresh cause.

Source permits usage-profile refresh after expensive frames, but allocation
failure and other paths can request the same refresh. Uploading CPU pixels
records a cache miss; drawing a compatible GPU snapshot can record a hit.
That is a plausible mechanism, not captured counter or branch evidence.

## Descriptive Measurements

Evidence: `artifacts/umbralink-control/provider-import/`.
`comparison.json` explicitly records `performanceAccepted:false`.

| Observation | Import OFF | Import ON |
| --- | --- | --- |
| In-playback provider samples | 9 accelerated, 18 software | 27 accelerated |
| Initial / final provider | accelerated / software | accelerated / accelerated |
| Four-copy batch medians | 34 / 35 ms | 0 / 0 ms |
| Four-copy callback gaps over 50 ms | 18 / 17 | 0 / 0 |
| Callback counts by phase | 295 / 295 / 293 / 298 | 296 / 298 / 296 / 297 |
| Reported video-frame drops | 0 | 0 |
| CPU observation window | 48.239 seconds | 48.105 seconds |
| Summed joined-process CPU | 42.034 CPU-seconds | 27.255 CPU-seconds |
| Browser-process CPU | 14.008 CPU-seconds | 19.541 CPU-seconds |
| RDD-process CPU | 20.662 CPU-seconds | 2.084 CPU-seconds |
| Web-content-process CPU | 7.190 CPU-seconds | 5.442 CPU-seconds |

This repeats the earlier pair's direction, not a pooled or balanced performance
result. Zero batch milliseconds is below observed timer resolution; asynchronous
GPU completion is not measured. Browser CPU increases, so some work may be
relocated rather than eliminated. Callback counts are not frame-drop counts.
Provider state does not prove the actual path of every draw or continuous GPU
execution between samples.

## Operational Proof

Runtime harness root:
`~/.cache/codex/provider-import-harness-20261006-6BXaXD`.
Its 84-file input bundle SHA256 is
`715aafed396088b9c6daa67c24ace73ca5279b0a3d7d4a752f7151e1aa786d92`.
The package manifest remains
`21178496e1612b579e18b6234bff4a052bbe229cb7c861872c713e11cb89c99f`.

| Observation | OFF | ON |
| --- | --- | --- |
| Owned run suffix | 1zwXbo | ZENnwX |
| Controller / browser PID | 1375346 / 1375358 | 1378096 / 1378108 |
| Capture duration | 59.959 seconds | 59.890 seconds |
| Resource samples | 14 | 14 |
| Peak sampled artifact bytes | 143560487 | 145143768 |
| Export files / bytes | 44 / 352961 | 44 / 351890 |
| Recorded PIDs verified absent | 12 | 12 |
| Browser log bytes / dropped bytes | 271 / 0 | 271 / 0 |
| Terminal capture / driver | pass / pass | pass / pass |
| Owned shutdown | clean SIGTERM | clean SIGTERM |

Both postchecks verify the 46 package files plus the empty lock file. Native
receipts join browser PID, BuildID and owned application/local/temp roots.
Exports are hash-verified without private profile, token or app-data contents.
These are point-in-time/post-startup proofs, not a network sandbox or proof no
unobserved transient process existed.

Preparation retained two non-runtime mistakes: an extraction allowlist omitted
the already-admitted `dom/media/test/vp9.webm` fixture and stopped before any
extraction; its exact-path correction then passed hash/extraction checks. The
first offline unpack assertion expected `passed` instead of the producer's
`pass`; it stopped before writing decoded files. Original errors are retained.
Neither required a browser retry or weakened admission/resource bounds.

## Verification And Remaining Work

Assertion-first page/observer tests failed before implementation. All 25 tests
passed before runtime, covering exact metadata joins, corruption, stale/foreign/
duplicate/missing events, observer errors, no extra draws, cleanup and maximal
serialization through the actual 10000-node/one-MiB serializer. AST checks prove
that inherited page code differs only by the sample-event block and that capture,
driver, admission and cleanup changes remain explicitly scoped. Final combined
verification passes all 54 tests, including saved-native replay of both runs,
corrupted sample-join rejection, earlier sustained regressions and the shared
control timeout tests. The new provider-specific set contains 26 tests.

Do not remove fallback or force acceleration based on this result: baseline
draw durations were already high before demotion, and software may be a sensible
response to the expensive upload path. The next performance gate is a balanced
same-package comparison with minimal observations and natural fallback explicitly
classified. Keep sampled localization separate from observer-effect controls.

Before deployment, retain native import-failure recovery, test more realistic
rendering operations and review the full-size diagnostic versus current V2
scaled-fallback provenance. Exact pixels for the prior matrix are not universal
Firefox canvas parity. The restored working source and object directory remain
different; do not install the latter as an ordinary current-tree build.
