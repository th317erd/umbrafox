# Balanced Import Confirmation

## Result

The new prospective OFF1/ON1/ON2/OFF2 sequence passed all 29 predeclared
fixture-performance criteria. Every capture completed 48 seconds and passed
the original workload, provenance, resource and cleanup contracts. No runtime
source, acceptance threshold, native build, default or daily installation was
changed during this sequence.

Both experimental runs used at least 35.48% less normalized joined-process CPU
than the better baseline. Four-copy batch medians were below the recorded
timer resolution in ON, versus 33-36 ms in OFF; corresponding ON P95 was 1 ms
versus 46-49 ms in OFF. These are draw-call wall times, not GPU completion times.
Both ON endpoints were accelerated; both OFF runs ended software/shared after
starting accelerated. Intermediate provider state was not observed here.

This is a repeatable result for this owned fixture and diagnostic package.
It is not general performance acceptance, a YouTube fix, physical scanout
proof or permission to deploy. The earlier stopped comparison remains failed
with its exact invalid-metadata predicate unknown. None of that failure or the
separate passing diagnostic was pooled into these four runs.

## Measurements

| Observation | OFF1 | ON1 | ON2 | OFF2 |
| --- | --- | --- | --- | --- |
| CPU window, seconds | 48.213 | 48.093 | 48.098 | 48.211 |
| Joined CPU, CPU-seconds | 42.209 | 27.064 | 27.168 | 42.965 |
| CPU-seconds per elapsed second | 0.87547 | 0.56275 | 0.56485 | 0.89118 |
| Browser CPU, seconds | 13.997 | 19.499 | 19.486 | 14.701 |
| RDD CPU, seconds | 20.758 | 2.069 | 2.064 | 20.870 |
| Web-content CPU, seconds | 7.238 | 5.295 | 5.425 | 7.176 |
| Four-copy medians, ms | 33 / 35 | 0 / 0 | 0 / 0 | 36 / 36 |
| Four-copy P95, ms | 49 / 46 | 1 / 1 | 1 / 1 | 47 / 49 |
| Four-copy callback gaps over 50 ms | 8 / 7 | 0 / 0 | 0 / 0 | 7 / 11 |
| Reported video drops, all phases | 0 | 0 | 0 | 0 |
| Final provider | software | accelerated | accelerated | software |

OFF normalized CPU maximum/minimum spread was 1.795%; ON spread was 0.374%.
Two observations per mode do not supply statistical confidence or thermal
control. Browser CPU rises substantially in ON: the reduction is not uniform
across processes. CPU totals join stable endpoint PID/childID/type to sampled
process-start identities; unobserved transient processes remain outside proof.

All phases recorded 296-298 callbacks, above the declared 200 minimum. Callback
counts are not video-frame-drop counts. Zero reported video drops does not
prove smooth physical presentation. Initial/final native queries and ordinary
resource snapshots are observers, not free or absent overhead.

## Frozen Contract

Corrected R2 BuildID 20261006070020 and package manifest
21178496e1612b579e18b6234bff4a052bbe229cb7c861872c713e11cb89c99f
were identical across arms. The 95-file callback harness bundle remains
b33948547ccdadc06a95f00f5df4ead57fc0731b06d4815fb6ea47fdd4836da2,
installed only in the existing owned laptop scratch root xHixG8.

Each fresh capture used the same owned 1080p30 H.264 input, 320x180 default
canvas and 1/4/4/1 copies per video callback across four 12-second phases.
No per-frame readback, pixel hashing, clear, added native sampling or GPU wait.
The frozen collector preserves the earlier predicates and success code;
only its invalid-metadata failure message contains additional RVFC values.
That failure did not recur in this sequence; this does not explain the old one.

Actual profile values matched in every arm: frames 10, fallback ratio
0.30000001192092896, cache-miss ratio 0.6600000262260437, all user overrides
false. Acceleration was not forced. The after query can ensure/borrow a target;
neither endpoint proves the route of each individual draw.

## Execution And Verification

Each arm followed a 15-second settle and hash/resource/no-browser-or-build
preflight. Capture/driver/SSH limits remained 120/220/240 seconds. Every arm's
terminal export and full completed-prefix validation passed before the next.

| Arm | Root suffix | Controller / browser PID | Capture duration, ms | Export bytes |
| --- | --- | --- | --- | --- |
| OFF1 | epvQHU | 1393614 / 1393626 | 59981 | 343776 |
| ON1 | ianxMo | 1396026 / 1396038 | 59841 | 342048 |
| ON2 | rk233Z | 1398425 / 1398437 | 59880 | 341769 |
| OFF2 | HvpLJH | 1400883 / 1400895 | 59913 | 343691 |

Every arm has 44 hash-verified public evidence files, 14 resource samples,
12 recorded PIDs independently absent, clean owned SIGTERM shutdown and a
271-byte browser log with zero dropped bytes. Total exported evidence is
176 files/1371284 bytes. Peak sampled per-run artifact use was 143583606 to
147917067 bytes. These checks do not prove continuous process/network isolation.

Native receipts join actual browser PID/build and owned application/local/temp
roots. Postchecks verify unchanged 46 package files plus the empty lock file,
475120013 bytes total. No private profile, control token or app-data payload was
exported. The desktop daily browser and Pi were not touched.

New offline receipt checks had two behavioral failures before implementation.
They now reject stale/mixed/overlapping/malformed inputs and require actual
mode, chronology, fresh identities, exact package and cleanup evidence.
The new unpack file is byte-identical to the frozen callback unpack. Prefix
analyses cannot accept performance. Final saved-data replay rehashes all 176
files, recomputes page summaries and CPU joins, reproduces the complete frozen
evaluator result and rejects incomplete/CPU-regressed comparisons.

The final focused/integration/AST/saved-data regression set passes 66 tests.
No predicate or performance threshold was relaxed. Evidence and exact command
notes are under `artifacts/umbralink-control/balanced-import-r2/`; canonical
numeric output is `comparison.json`. Source/index and prior-seal guards remain
separate from this diagnostic package's runtime provenance.

## Next Gates

The diagnostic package's OFF path uses full-size readback. The restored working
source and daily V2 build have scaled fallback; this test does not measure the
gain over that baseline. The object directory must not be installed or packaged
as an ordinary current-tree build while those sources differ.

Next, review integration with V2 scaled fallback and preserve import-failure
recovery, then verify the exact integrated build with pixel/Firefox-parity and
realistic-operation tests before performance comparisons against that baseline.
Keep unsupported operations and resource/context failures on correct fallback
paths. Do not disable fallback merely to retain acceleration.

Only after those gates should isolated laptop YouTube or broader rendering
work be used to assess the owner's intermittent stutter. No automatic daily
installation, desktop restart or performance claim beyond this fixture follows.
