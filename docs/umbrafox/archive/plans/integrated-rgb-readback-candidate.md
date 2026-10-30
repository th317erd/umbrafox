# Integrated RGB Readback Diagnostic Candidate

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Start And Scope

The readback-state milestone passed 32 real-GL native tests on the laptop's
reported Intel Iris Xe backend, including state restoration, failed allocation
recovery and eight exact pixel comparisons. The previous goal turn is progress.
The ordinary runtime library still predates the two-pass RGB correction.

Build the current combined source into a NEW isolated diagnostic package. No
production edit, preference change, desktop installation/browser operation,
Pi action, staging, commit or push is included. GPU import remains default OFF.
This package is not Firefox-parity, performance or stutter acceptance.

## Source And Build Contract

Retain all 35 previously pinned integrated inputs. Their only expected changed
file is the GTK gtest registration. Add explicit DMABuf implementation/header,
GL readback/state helpers, sized-readback producers/consumers and the new native
test; these were not all individually pinned in the prior manifest. Preserve
the full tracked/index/working patches and untracked source archive as well.
Only the DMABuf implementation and gtest registration may differ in tracked
working source from the previous integrated build; no unrelated drift accepted.

Use fixed new BuildID `20261006111504`. Before building, retain the expected
old-library identity rejection. Use the same tested ELF-note reader afterward;
never relabel an old binary or delete generator stamps. Require at least
16 GiB available memory, 30 GiB storage and no other compiler/build process.
Build with the existing configured mach route, two jobs, idle priority and an
1800-second bound. Do not overlap browser/profiler work with compilation.

Package with the same build date, two make/XZ jobs and a 600-second bound through
`mach build -j2 package`. Use the prior bounded archive/export validator with
only identity and path substitutions. Verify the 46-file inventory, native and
both INI BuildIDs, all extracted bytes/modes and frontend equivalence against
the prior integrated package except its single AppConstants BuildID string.
Export to `exports/umbrafox-rgb-readback-20261006/`, with no daily install.

## Verification And Continuation

Before source execution, test the new preparation contract and mechanical
exporter equivalence. Run the existing affected source/descriptor/readback
contracts, BuildID reader and archive-helper tests under their existing bounded
commands. Preserve failures. Verify source/HEAD/index/patch/configuration both
after build and packaging; record exact artifact hashes and compiler warnings.

Evidence belongs in `artifacts/umbralink-control/rgb-readback-candidate/`; prior
seals are immutable. After package acceptance, continue with the existing strict
laptop real-video matrix using fresh evidence and unchanged thresholds. The
separate blur-repeat discrepancy is still open, so full parity may still fail.
Do not discard failed cases or pool old captures to obtain acceptance. Further
performance work and default enablement require correctness acceptance first.

## Incremental Identity Correction

The initial full build and one ordinary binaries pass both retained the old
native toolkit ID while the application header had the new date. Preserve both
failed identity checks. Actual `backend.mk` makes the toolkit generator stamp
depend on its script and linked objects, not the date environment variable.
The saved stamp is newer than the changed GTK object, explaining why these
invocations have no timestamp reason to rerun it. Do not repeat unchanged builds.

Request only the existing `.deps/buildid.cpp.stub` target in `toolkit/library`
through mach, with GNU make's documented `--what-if` on the existing generator
script. This is an explicit recipe invalidation, not a source/stamp edit or
binary patch. Retain verbose output, require the generated source to contain
the intended ID, then run a normal binaries pass to compile and link it.
The same source/resource guards and new native identity check still apply.
Stop before packaging if identity remains inconsistent. This correction does
not change build-system source or establish that every incremental build route
automatically handles a changed build date.

The mach invocation with `MAKEFLAGS=--what-if=...` completed without executing
the recipe. GNU make documents that `-W` and its long form are ignored when
read from MAKEFLAGS. Preserve that unsuccessful attempt. Invoke configured
`/usr/bin/gmake` directly in the existing object directory with the same target,
two jobs, idle priority, 120-second bound and `--what-if` as a command-line
argument. Use the generated Makefile/configuration without bypass flags or
manual changes, then return to the normal mach binaries/package route. This
is a narrow correction to invocation transport, not a change to the recipe.
Reference: https://www.gnu.org/software/make/manual/make.html#Options_002fRecursion
