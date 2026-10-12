# Corrected Import Package Pixel Results

## Result

The corrected GPU-import diagnostic package passes the same-build OFF/ON pixel
gate on wyatt-laptop: all 48 ordered hashes match exactly, all repeated cases
are stable, and all four retained linear RGBA buffers are byte-identical. Both
fresh browser runs completed successfully with clean owned shutdown. There was
no tolerance, omitted case or retry.

This verifies the new package rather than borrowing the old reference verdict.
It does not establish sustained performance, physical presentation quality,
every Firefox canvas result, or actual import execution for each draw. No daily
browser, profile, launcher, default preference or native source was changed.

## Inputs And Implementation

Package: `exports/umbrafox-import-recovery-20261006-r2/`.
Observed runtime BuildID: `20261006070020` in both captures and native receipts.
Package manifest SHA256:
`21178496e1612b579e18b6234bff4a052bbe229cb7c861872c713e11cb89c99f`.
The preceding package seal was verified before runtime.

Four new diagnostic files adapt the previous fixed-package driver: admission,
laptop driver, preflight and evidence export. AST comparisons verify that only
the package hash/BuildID, literal OFF/ON admission and owned namespaces differ.
The workload, collector, 12-case matrix, two repeats, two paused frame times,
private data setup, monitoring and cleanup remain unchanged.

The initial three admission tests failed against the old implementation for
the intended reasons: it disallowed OFF, rejected the new package, and accepted
the old package. The new admission accepts only the pinned corrected package
on wyatt-laptop DISPLAY :0; malformed/changed evidence, other modes, hosts and
displays reject. The stale-native-ID package also rejects by its manifest.

All 70 inherited harness file hashes remained unchanged. The new bundle has
74 files, transferred with independently matching package/archive hashes.
Fresh extracted package admission verified all 46 files and a private 0700 root.
Remote preflight before each run found no detected browser/build activity and
more than four GiB available memory and disk.

An initial desktop-wide compiler check encountered an unrelated AeorDB Cargo
test. Its command and PID were recorded, and it was left untouched. This was
not an Umbrafox build or a laptop process. Runtime admission remained strict on
the laptop; no performance conclusion uses desktop activity measurements.

## Runtime Evidence

Evidence: `artifacts/umbralink-control/import-recovery-pixels/`.

| Observation | Import OFF | Import ON |
| --- | --- | --- |
| Run suffix | DMuUya | jQlAEz |
| Controller PID | 1347221 | 1350117 |
| Browser PID | 1347233 | 1350129 |
| Capture duration | 16.787 seconds | 16.352 seconds |
| Resource samples | 6 | 6 |
| Peak sampled artifact bytes | 65126196 | 65093199 |
| Exported files | 38 | 38 |
| Exported bytes | 1386918 | 1386890 |
| Recorded PIDs independently absent | 12 | 12 |
| Installation postcheck | 46 files PASS | 46 files PASS |
| Browser log bytes/dropped bytes | 271 / 0 | 271 / 0 |
| Cleanup | Clean SIGTERM | Clean SIGTERM |

Run roots are
`~/.cache/codex/laptop-import-recovery-pixels-off-20261006-DMuUya` and
`~/.cache/codex/laptop-import-recovery-pixels-on-20261006-jQlAEz`.
Harness root:
`~/.cache/codex/import-recovery-pixels-harness-20261006-ZzDIUx`.
The exported receipts join expected PID, BuildID and private application-data
and local-application-data roots. These are post-startup receipts, not proof of
no earlier access or a network sandbox. Recorded PID absence does not exclude
every unobserved transient helper.

All exported bytes match the remote hash/size records. Profiles, authentication
and private app-data contents were excluded. `comparison.json` records the
independent saved-data comparison and cleanup summary. Corrupting a pixel hash
or expected preference makes replay reject. Raw capture reports retain their
original conservative flags; their generic import-failure limitation does not
erase the separate earlier native regression result.

Hardware-accelerated decode flags were recorded at paused boundaries; later
snapshots name the remote FFmpeg decoder. The initial decoder description can
be `shutdown`. These observations are not continuous decoder or per-draw GPU
route proof. Capture wall durations above are operational evidence, not an
OFF/ON speed comparison.

## Verification And Next Step

All 26 focused admission, source-equivalence, capture, validation and saved-data
tests pass. The full native source snapshot, complete tracked diff, staged diff
and inherited harness remain unchanged. Earlier sealed reports are preserved.
The experimental preference remains OFF by default; it was enabled only in the
owned ON diagnostic profile through existing UmbraLink controls.

Proceed to sustained, alternating same-package playback without per-frame
pixel reads. Use an ordinary accelerated-size canvas and preserve equal
observer cost between OFF and ON. Measure frame drops, callback stalls and
joined process CPU before claiming a performance win. The old short-copy test
used a small `willReadFrequently` canvas and pixel hashing; it is not the right
sole performance oracle for this GPU import path.

The existing script timeout permits at most 60 seconds per request. Respect
that limit and the existing capture/cleanup budget when choosing the workload;
serialization also permits at most 10000 nodes and one MiB. Bound any retained
callback records before collection; do not expand the public or private control
API to accommodate the test. Existing private canvas diagnostics can sample
provider state without adding a website-visible API.
