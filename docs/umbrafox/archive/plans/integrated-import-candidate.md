# Integrated Scaled-Fallback Import Candidate

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

The preceding goal turn made progress: four prospective laptop arms passed all
29 fixed performance gates and66 regression tests. That result uses a full-size
diagnostic fallback, not the existing daily V2 scaled readback.

## Scope And Source Contract

Build the current combined source as a new default-OFF experimental package.
No production source edit is needed: the working tree already preserves V2
HTML-video deferred scaled readback alongside the upstream DMABuf import and
candidate-only native failure propagation. Compared with R2's24 pinned native
inputs, only CanvasRenderingContext2D.cpp must differ, exactly matching the
previously restored V2 source. Verify this and the complete tracked/staged patch
before and after building; retain all untracked build inputs.

The V2 helper applies only for identity transform, unrotated full-source linear
sampling and integral smaller destination dimensions. Other cases preserve
their normal fallback. Descriptor admission remains default OFF. Translator
import failure still uses full-size readback; do not claim scaled recovery for
that path. Do not disable fallback or change pixel/filtering semantics here.

## Gates

1. Capture source/index/configuration provenance under
   `artifacts/umbralink-control/integrated-import-candidate/`. Preserve previous
   immutable exports and seals. Run existing compiled descriptor-admission,
   readback, native result-propagation and reference-region contracts.
2. Retain a failing native BuildID admission for the old object library against
   new fixed ID20261006095500. Require at least16 GiB available RAM,30 GiB free
   storage and no concurrent compiler/build process before starting.
3. Use the unchanged configured mach route, two jobs, idle priority and an
   1800-second build bound. No browser/profiler execution overlaps compilation.
   Inspect embedded toolkit identity before packaging; stop on mismatch and
   inspect the normal generator, never delete stamps or relabel an old binary.
4. Package with the same date and two-job make/XZ bounds,600 seconds. The
   supported `mach build -j2 package` target retains the explicit make limit
   absent from `mach package`'s CLI. Export to
   `exports/umbrafox-integrated-import-20261006/` using existing bounded archive,
   native BuildID, INI, exact inventory/mode/hash and frontend-content checks.
   Copy full provenance. No executable version probe or browser launch here.
5. Verify no source/index drift, the default-OFF pref, and only the expected
   frontend BuildID delta from R2. Existing archive/BuildID unit tests must pass;
   do not treat package preparation as native GPU correctness or performance.

## Next Phase And Limits

Pin the accepted package in fresh laptop-only tests. First exercise relevant
native recovery and same-build pixel/readback cases, keeping comparison with
the historical full-size reference distinct from V2 OFF/ON. Then re-run a
prospective balanced sustained comparison against the scaled baseline. Any
pixel or correctness disagreement blocks enablement and requires explanation,
not a relaxed threshold. Context loss/driver OOM/modifier/framebuffer failures,
valid reuse after rejection and forced translator fallback remain named gaps.

No daily installation, desktop browser/profile/launcher, Pi, public interface,
default preference, staged index, commit or push changes. The new package is
not a Firefox-parity or YouTube-stutter acceptance. End this build phase with
verified evidence, an explicit object/source correspondence and a report;
the broad performance goal stays active.

## Build-Phase Outcome

Completed the build/package gates without production-source changes or browser
execution. New BuildID20261006095500 matches native toolkit and both INIs;
46-file export admission and frontend-content comparison passed. Source35,
HEAD, index, tracked/unstaged patches and mozconfig remain unchanged.
Final39 source/export contracts plus6 BuildID-reader and9 archive-helper tests
passed. The build took30 seconds and package93 seconds, both with0 compiler
warnings. Initial compiler-contention admissions were preserved; unrelated
AeorDB processes were not touched. Detailed package hashes, commands' logs,
integration boundaries and unrun runtime gates are recorded in
`docs/umbrafox/archive/reports/performance/2026-10-06-integrated-import-candidate.md`.
No daily installation or default enablement. Next phase remains exact-package
laptop native/pixel admission before V2-baseline performance comparison.
