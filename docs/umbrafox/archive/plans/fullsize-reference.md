# Full-Size Readback Reference

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Purpose

The linear diagnostic reproduces 5-6% changed pixels between V2 OFF and direct
import ON. OFF is modified, so it is not the required Firefox reference. Build
one diagnostic package with the historical full-size HTML video fallback while
retaining the import candidate and all unrelated work. This is a source-route
reference, not a claim that the whole binary is unmodified Firefox.

## Temporary Native Delta

Only `dom/canvas/CanvasRenderingContext2D.cpp` may change temporarily. Preserve
its exact original bytes and the staged/full tracked patch first. Remove the
two private V2 helper functions, deferred-readback state and late sized-readback
block. Restore the historical upstream HTML video branch, with only the new
`MaybeGetSurfaceDescriptorForRemoteCanvas(res, Nothing())` signature adaptation.
Keep new VideoFrame admission, descriptor validation, public/private APIs,
default-OFF preference, GL conversion, IPC and all other source unchanged.

The full-size fallback must use the historical GetAsSourceSurface plus
OptimizeSourceSurface route, not accidentally skip optimization or rewrite a
cropped source rectangle. Preserve all security checks and source dimensions.
No new runtime pref, public diagnostic, heuristic or tolerance is introduced.

## Verification And Build

First create a failing reference-source test against current V2 source. Its
passing state must prove the restored HTML branch matches the pinned upstream
blob modulo the one signature adaptation, no sized/deferred calls remain, and
everything outside the enumerated regions is byte-identical. Existing V2 source
assertions are intentionally not the reference oracle: do not edit them to
hide the temporary difference. Run descriptor admission and the dedicated
reference checks, then compile/package with configured toolchain, at most two
jobs and explicit time bounds. Preserve failed logs; no blind restart.

Use a distinct fixed MOZ_BUILD_DATE and an independent exported package.
Initial build bound 1800s, packaging 600s; inspect actual live processes before
any resume. Require >=16GiB MemAvailable and >=30GiB free build storage, no
concurrent build of this tree; idle build priority protects desktop use.
No browser launch during compilation. No install, launcher, daily profile,
default enable, staging, commit or upstream merge.

After package/export and source identity checks, restore ONLY this diagnostic
delta using apply_patch, guarded by exact expected reference-source bytes.
Never restore over concurrent edits. Verify the original file/hash, complete
tracked patch and index match the preserved state. The object directory now
contains the reference binary despite the restored working source; record this
explicitly and do not package/install it as the normal candidate.

## Runtime Gate

Before any laptop run, pin the new extracted package and build ID, adapt a new
driver/preflight sibling without weakening admission, run focused tests and
preserve existing fixtures. Fresh owned roots and existing native receipts,
120s/15s capture/cleanup, 220s controller/240s SSH and resource/export caps stay.
Use the same twelve-case linear-byte collector first with import OFF. Compare
against both prior V2 OFF and import ON without selecting an expected answer.
Only after those results are reviewed decide whether another ON reference run
adds information. No speedup or Firefox parity claim from source alone.

## Completion Boundary

This phase completes only with a provenance-pinned reference package, restored
source/index and an explicit runtime result or named remaining gate. Do not
mark the broad performance goal complete. Resolve the correct pixel reference
before any pixel-preserving implementation, failure/context-loss work and
alternating sustained performance trials.

## Progress

- Reference-source failing-first tests, bounded build/package and exact source/index restoration passed.
- Fixed reference package `20261006052600` exported, not installed.
- One prelaunch permission rejection preserved; corrected owned package-root admission then passed.
- Fresh reference OFF capture passed cleanup and supplied-data checks; 44/48 outputs match the prior import ON candidate. Four remaining differences are explicit software readback.
- Final focused suite: 90 passed, with exact-file formatting and documentation lint clean.
- Next: separate pinned ON sibling using this same reference package; then native failure/context-loss and sustained performance gates. No default-enable decision.
