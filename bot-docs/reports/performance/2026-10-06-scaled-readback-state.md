# Scaled Readback State And Failure Verification

## Result

The expanded native gate passes all 32 tests with no skips on wyatt-laptop.
All 15 DMABuf readback tests report GL vendor `Intel` and renderer
`Mesa Intel(R) Iris(R) Xe Graphics (RPL-P)`. Eight pixel comparisons, including
BT601 and BT2020, have zero differing components and zero maximum channel delta.
All 17 preceding import/upload regressions remain green.

This phase changes only `dom/canvas/gtest/TestDMABufReadback.cpp`, not the
production correction. Its current SHA256 is
`28f18634186bd0b48a6a2743d3ffb0b7da89ac8be58643545fa79d5b9aac63ed`.
The readback implementation remains
`84a1855a7ce04f774db2b90b2123397eb3311619429d21d7c36b9d62c576d8b3`.

## Tests And Limits

Added tests check scaled/full-size pixels and GL-state restoration, rejection
and recovery after missing planes or an empty reported source, and allocation
failure at each temporary framebuffer stage. Allocation tests request
`MAX_TEXTURE_SIZE + 1` in one dimension, with bounded CPU output, rather than
exhausting GPU memory. Expected GL errors are checked and cleared, then the same
surface/context must produce its original pixels in a successful read.

Caller state includes active texture/four bindings, read/draw framebuffer,
viewport, scissor, color mask, program, VAO, array buffer, six drawing enables
and pack/unpack settings. Texture/FBO, viewport/scissor, color mask, enables and
pixel-store settings are seeded nondefault; program/VAO/array-buffer values are
observed, not separately seeded. These tests exercise warmed blit helpers,
not every lazy program-creation or caller-state combination.

Review strengthened the original zero-filled failure buffer to a nonzero
`0xA5` sentinel so an accidental zero write cannot masquerade as unchanged
output. Both the initial passing run and strengthened run are retained; only
the latter establishes that stronger assertion and reports backend identity.

These are actual GL texture/readback operations, but not decoder-created
DMABufs, EGL import, remote IPC, fences, modifier variants, driver OOM, context
loss, allocation-leak or stock Firefox parity tests. No performance improvement
is inferred from the native test duration. The extra full-size RGB GPU texture
still requires memory/performance measurement.

## Execution And Evidence

Both scoped gtest builds used two jobs, completed in about 15 seconds and
reported zero compiler warnings. Exact native lint passes. The unchanged
reviewed runner envelope uses 30-second work and 45-second total deadlines,
one-MiB log/result caps, fresh private app-data/temp directories and explicit
no-report/nonlocal guards. Controller variants change only identities, package
manifest, paths and native inventory. This is an older diagnostic loader with a
separately hashed new test library, not an integrated playback package.

Final package manifest SHA256:
`767dd805d95d082f0223d2080399bae454d9ddebcd0cfd91081539ac174245fc`.
Final test library: 358389488 bytes, SHA256
`596445a1be52a8e2447ce6c6401a55bc0eb3071bb92a8e71912915ee29d7fc54`.
Its 48-file installation postcheck matches 833509376 bytes.

| Run | Controller | Native root | Log-identified child | Result |
| --- | --- | --- | --- | --- |
| Initial | 1445835 | 1445847 | 1445849 | 32 pass, zero skips |
| Nonzero sentinel/backend | 1453887 | 1453919 | 1453921 | 32 pass, zero skips |

Both exited zero with clean cleanup. Independent exact `/proc` checks found all
six recorded PIDs absent; this is not a census of every transient helper.
Four files per run were exported and independently size/SHA256 checked. The
9071-byte logs retain the sandbox EPERM warning and expected invalid-descriptor
messages. No personal profile, shared crash queue or payload was exported.
An initial SSH quoting error in the controller-hash check ran no browser; the
corrected stdin-based check passed before launch.

Evidence: `artifacts/umbralink-control/readback-state/`. Its offline contracts
cover inventory/skip/failure accounting, exported hashes, cleanup receipts,
pixel properties, source snapshots and exact runner equivalence. Prior evidence
is retained unchanged. No desktop/Pi/default preference/index/deployment change.
Final offline verification passes eight tests, scoped native/documentation lint
reports zero problems, and source/HEAD/tracked-working/index guards pass.
The milestone seal is `artifacts/umbralink-control/readback-state-final.sha256`.

## Next Gate

Build and package the current corrected source as a new isolated diagnostic
artifact. The ordinary runtime library and earlier integrated package still
predate the RGB correction. Run the strict real-video matrix with unchanged
pixel thresholds, preserving any remaining failure. The separate blur-repeat
discrepancy is still open and must not be explained away or excluded from full
acceptance. No YouTube, general stutter or performance acceptance is claimed.
