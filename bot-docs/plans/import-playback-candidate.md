# Corrected GPU Import Playback Candidate

## Scope

Continue the active performance campaign after the 17-test native import-failure
gate. Build an experimental, default-OFF package combining that correction with
the full-size HTML video fallback already validated by the reference pixel gate.
This is a new package, not a relabeling of the old reference or current V2 binary.
No daily install, launcher, profile, staged index or default preference changes.

## Territory And Test Contract

The only temporary source change is the exact preserved full-size reference
delta in `CanvasRenderingContext2D.cpp`. Existing reference tests establish the
historical HTML video branch, the signature adaptation, unchanged VideoFrame
and admission paths, and byte-identical code outside the listed regions.
The nine import-failure production changes and all unrelated source stay fixed.

Run the existing reference test against live V2 source first and retain its
expected failure. Apply the reviewed delta with guarded manual patch tooling,
then require the live reference tests plus native source/result-contract tests
to pass. Snapshot original/full-size source, all relevant source hashes, complete
tracked patch, staged patch and untracked build inputs. Never replace concurrent
edits or weaken old tests to accept a different source route.

The shared native canvas context is privately owned and no supported injection
hook was found. Do not fake successful context-loss testing, expose a new public
API, or reset a real device to fill that gap. Valid DMABuf reuse after rejection,
driver failure injection and end-to-end fallback remain future correctness
gates. They do not turn a default-OFF isolated diagnostic package into a release.

## Build And Restoration

Fixed new build date: `20261006070020`. Require at least 16 GiB available memory,
30 GiB free build storage, and no compiler/build process already using this tree.
Use the configured mach build route, two jobs, idle priority, 1800-second build
and 600-second package bounds; retain all logs. Never launch a browser while
compiling. No toolchain/configuration/dependency changes.

Export the self-contained archive, safely inspected/extracted regular-file
manifest, both INI BuildIDs, executable/library hashes, source hashes and patches
under `exports/umbrafox-import-recovery-20261006/`. Validate all archive paths,
types, sizes, modes and hashes before any runtime use. No executable version
probe or browser launch is needed for package-only validation.

After packaging, guard the exact temporary source hash, reverse only this delta,
and prove original source, tracked patch and staged patch are byte-identical to
the pre-phase snapshot. Record that the object directory still contains the
diagnostic full-size build while the working source again contains V2.

## Next Runtime Gate

Pin this new package in a prospective bounded laptop harness. Reuse existing
admission, private directories, native receipts, monitoring and cleanup. First
check the same-build OFF/ON pixel matrix because native code changed, then run
alternating sustained moving-video captures with equal observer overhead.
Report drops, callback stalls and joined process CPU without inferring GPU time
or claiming per-draw import execution from a preference alone. The prior pixel
and native-test verdicts remain immutable and limited to their original inputs.

## Embedded BuildID Gate

The first package passed archive and INI checks but its native toolkit ELF note
still reported `20261006052600`, not the requested `20261006070020`. Preserve that
package as rejected for prospective runtime. No launch occurred. Require the
native note to equal both INIs before any later package can pass admission.

The normal toolkit generator consumes `MOZ_BUILD_DATE`; its generated C++ file
remained old, with a stub older than the newly compiled canvas object. Reapply
only the same temporary reference delta and run one ordinary binaries pass at
the same date, without deleting stamps or changing build-system source. Inspect
the native note before repackaging. Stop on any remaining mismatch. A corrected
export must use a fresh `-r2` directory; restore the exact original source and
index again after packaging. Do not overwrite the first archive or its verdict.

## Build Phase Outcome

Corrected R2 package passes archive, extracted inventory, native toolkit BuildID,
both INIs and frontend-content checks. The ordinary binaries pass repaired the
stale generated toolkit identity without stamp or build-system edits. The first
package remains rejected and preserved. All 16 original source hashes and full
tracked/staged patches match after the second guarded restoration.

Report: `bot-docs/reports/performance/2026-10-06-import-playback-candidate.md`.
This build phase is complete; the prospective laptop pixel/playback gates above
remain pending. No runtime or daily installation occurred in this phase.
