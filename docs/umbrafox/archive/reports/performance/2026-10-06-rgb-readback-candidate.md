# Integrated RGB Readback Diagnostic Package

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Result

A new self-contained diagnostic package includes the two-pass scaled readback
correction previously verified by 32 native GL tests on wyatt-laptop. The build,
package, extracted-file admission and provenance checks pass. No browser was
launched in this phase, and no daily installation or default was changed.

Export: `exports/umbrafox-rgb-readback-20261006/`.
Evidence: `artifacts/umbralink-control/rgb-readback-candidate/`.
Plan: `docs/umbrafox/archive/plans/integrated-rgb-readback-candidate.md`.

The library's ELF toolkit ID and both INIs are `20261006111504`.
Archive: 107766516 bytes, SHA256
`71f6addde29258baff9e0f8cad10a6ef2ae3dd64a0d220649c9f4bf49ea57587`.
Manifest SHA256:
`a5da86b656e6bd241e309329f0072367d2bfc891650c500abb47fe561b071a11`.
Packaged libxul: 308517904 bytes, SHA256
`963d1106c3925787bb6d0bf2d1a793bb29633d0067e410e48e3815f4688d0abf`.
Executable SHA256:
`c6d3fe5e4656122dd223e78e1359e446f8fab3807fd6c5e9d2f5948287064474`.

## Source And Archive Verification

The package has 46 files, 57 archive entries and 475122949 uncompressed bytes.
Bounded archive validation rejects unsafe paths, special files/modes, duplicate
entries, excessive counts and size overflow. Extracted bytes/modes match the
manifest. A separate installation admission and postcheck passed without a
browser or lock file; this is filesystem verification, not native execution.

All 54 source pins, 13 untracked inputs, HEAD, complete tracked working/index
patches and mozconfig remained unchanged through packaging. Compared with the
preceding integrated package, the tracked native differences are the readback
correction and its GTK test registration. The full dirty source patch and
untracked inputs are retained; the HEAD alone does not identify this build.

Frontend archive inventories match the preceding integrated package. The only
entry change is the exact build-ID substitution in AppConstants; all 5368
browser archive entries are unchanged. This establishes the checked packaging
delta, not universal public-interface equivalence against stock Firefox.

## Incremental Build Identity Finding

The full build and first binaries pass succeeded but retained the previous
toolkit ID `20261006095500`; acceptance correctly rejected both. The application
header already had the new date. The toolkit generator stamp was newer than
the relevant GTK objects, and its dependency rule does not include a changed
date environment variable. Repeating an unchanged build would not address it.

The initial mach request using MAKEFLAGS also did not rerun the target. GNU make
documents that `--what-if` is ignored in that variable. Passing the option as
a direct argument to the configured make target executed the normal generator
recipe, after which an ordinary mach binaries pass compiled and relinked it.
No source, generated C++, stamp or binary was manually rewritten. Generator,
backend and linked-object-list hashes remained unchanged. The regenerated
source and final ELF note independently have the intended ID.

Reference: [GNU make option propagation](https://www.gnu.org/software/make/manual/make.html#Options_002fRecursion).
All failed checks and the ineffective invocation remain in the evidence.

## Commands And Gates

All builds used `MOZ_BUILD_DATE=20261006111504`, two jobs and idle priority.
Preflight required 16 GiB available memory, 30 GiB free storage and no other
compiler/build process. A busy preflight was rejected without touching its
processes. A duplicate evidence filename was also rejected without overwriting
the prior observation; the fresh preflight used a new name.

- Full `mach build -j2`: 32 seconds, zero warnings; old-ID rejection retained.
- First `mach build binaries -j2`: 9 seconds; old-ID rejection retained.
- Generator: 120-second bound, configured gmake in `toolkit/library`, target
  `.deps/buildid.cpp.stub`, command-line `--what-if` on `gen_buildid.py`.
- Normal binaries after generation: 12 seconds, zero warnings, native ID passes.
- `mach build -j2 package`, `XZ_OPT=-T2`: 99 seconds, zero warnings, 600-second bound.
- Export through `mach python --virtualenv build`: passes all archive, identity,
  frontend and file checks under a 180-second bound.
- Final source/descriptor/readback/export contracts: 39 pass, no failures/skips.
- Build-ID reader: 6 pass; archive helper: 9 pass in the build virtualenv.

The initial plain-Python archive-test invocation could not import mozpack;
that failure is preserved rather than counted as a passing test. No native
browser test, version probe, runtime benchmark or deployment occurred here.

## Review And Next Gate

The package now identifies and contains the tested native correction instead
of the previous runtime library. Source inputs and package consumers were
checked separately; neither generator success nor build exit zero alone was
accepted as artifact identity. All build/export/test commands are terminal.
Desktop browser/profile/launcher, Pi, index and default GPU-import preference
remain untouched. No commit or push was made.

Next is a fresh strict real-video pixel matrix on the laptop with unchanged
thresholds and owned cleanup. The separate blur-repeat discrepancy remains
open; do not drop it or treat native pixel tests as complete playback parity.
The extra full-size RGB GPU texture still requires memory/performance testing.
No YouTube stutter fix, general speedup, stock-Firefox parity or readiness for
daily installation is claimed by this package milestone.

Final scoped documentation lint and diff checks pass, and the preceding native
milestone seal verifies unchanged. The new milestone seal is
`artifacts/umbralink-control/rgb-readback-candidate-final.sha256`; it covers this
plan/report, the evidence namespace and export, excluding generated Python
cache files and mutable project continuity notes. Subsequent runtime work must
use a new evidence namespace rather than editing these accepted artifacts.
