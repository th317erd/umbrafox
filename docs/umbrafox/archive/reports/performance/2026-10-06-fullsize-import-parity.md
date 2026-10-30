# Same-Build Import Pixel Gate

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Result

The reference package passes the scoped ordered OFF/ON pixel gate: all 48
hashes match, every within-run repeat is stable, and all four retained linear
RGBA buffers are byte-identical. The two frames are distinct, paused at 0.5 and
2 seconds. All twelve cases remain; no tolerance or case omission was added.

This compares the frozen full-size reference OFF capture with one new ON
capture from the exact same package, BuildID `20261006052600`. The older V2 OFF
and older import ON packages are not pooled into this same-build comparison.
The result resolves the earlier relative pixel blocker for this workload once
V2 destination-sized readback is removed, supporting the historical full-size
fallback while pursuing direct import.

It does not prove all Firefox canvas behavior, codecs/drivers/formats, native
import execution per draw, error/context-loss safety, moving-video performance,
or the cause of the owner's intermittent YouTube stutter. The package remains
experimental and the production preference remains default-OFF. Raw reports
retain `pixelEquivalenceAccepted:false`; this offline paired matrix is a narrower
acceptance, not a reason to rewrite raw global acceptance flags.

## Implementation And Tests

Plan: `docs/umbrafox/archive/plans/fullsize-import-parity.md`. Only new diagnostic siblings
were written. The new admission pins the reference manifest and accepts ON
only. The driver reuses the unchanged linear collector/capture. Preflight and
export retain existing bounds; preflight additionally uses the real installation
admission, including canonical private-root mode/identity. This catches the
earlier extracted-root permissions failure before capture without relaxing
the 0700 requirement.

The initial test failed because frozen OFF-only admission rejects ON. Final
focused verification passes 68 tests in 2.96 seconds, including admission
negatives, AST proof of limited driver/support changes, installation lifecycle/
failure tests, existing linear capture cases and saved OFF/ON replay. Replay
checks every output, raw bytes, preference/root/build joins and cleanup;
corrupted hash and wrong-preference clones must reject.

No native source, existing fixture, binary, default preference, public API,
installed browser, launcher, profile, staged index or prior evidence changed.
The working source still contains the restored V2 candidate; the object
directory contains the reference build. Do not confuse or install those states.

## Runtime And Cleanup

Host: `wyatt-laptop`, DISPLAY `:0`. Harness:
`~/.cache/codex/fullsize-import-parity-harness-20261006-smhwQK`.
The pristine reference package was copied into the new owned harness root,
with all 46 files/modes and actual installation admission verified. Preflight
verified 70 harness files, no detected browser/compiler activity and at least
4 GiB available memory/disk. No compilation or profiler ran during capture.

| Field | New ON capture |
| --- | --- |
| Root | `~/.cache/codex/laptop-fullsize-import-parity-on-20261006-6UF2Wj` |
| Controller / browser PID | 1304474 / 1304486 |
| Runtime | 16.278 seconds |
| Export | 38 files, 1386847 bytes |
| Resource samples | 6 |
| Peak sampled artifacts | 65069045 bytes |
| Installation postcheck | 46 files, PASS |
| Cleanup | clean SIGTERM, root absent |
| Log | 271 bytes, zero drops |

All twelve recorded owned PIDs were absent at export. Controller and exporter
exited zero. Fresh private installation/profile/app-data/local-app-data/temp
roots and native PID/build/directory receipts were retained. These are
post-startup receipts, not proof of no earlier access, no external networking,
or completeness for transient helpers. Profiles and tokens were not exported.
The desktop work browser was untouched.

Capture120s/cleanup15s, controller220s/SSH240s and the existing 256 MiB artifact
limit remain. No repeat or native rebuild was needed.

## Next Gate

Stop redundant paused-frame probing. Inspect native import failure and
context-loss paths, including whether texture upload failure reaches the caller
and triggers the historical fallback rather than publishing invalid pixels.
Any native change needs a failing-first test, ownership review and a new pinned
package. Then use alternating sustained moving-video trials with equal
observation overhead to measure benefit and regressions. This pixel result is
not a speedup or daily-installation approval.

Evidence: `artifacts/umbralink-control/fullsize-import-parity/`, including
`comparison.json`, raw `on-1/` exports, preflight and test logs. Baseline:
`artifacts/umbralink-control/fullsize-reference/off-2/`; its seal is unchanged.
