# Full-Size Readback Reference

Diagnostic package only. Do not install in the daily browser or enable the
experimental DMABuf import preference by default.

- Umbrafox 158.0a1, fixed BuildID `20261006052600`.
- Build and package completed with two jobs and no compiler warnings.
- All 46 regular files match the validated archive and `package-input.json`.
- Archive SHA-256: `327a2999eb6bd8d17b539ada9460e37a3e34f18bb1af5ffe23fc27781d3ada2e`.
- Package manifest SHA-256: `350dd9dbacb579380ed57d84f9fb3d35e5b8b0514b07725baddc51d10bd22814`.

`reference-only.patch` temporarily restores the historical full-size HTML video
readback branch in `CanvasRenderingContext2D.cpp`. It preserves the new import
and VideoFrame paths and all unrelated dirty work. `source.patch` records the
complete tracked delta from `892431809a4caadb5c73b2c03ad9bdb124c3e21e`;
`new-source-files.tar.gz` and `untracked-source.json` preserve additional inputs.
`source.json` records the native file hashes at build time.

This is a source-route reference, not an unmodified stock Firefox build or
universal pixel-parity proof. The experimental preference remains default-OFF.

The temporary native edit has been restored byte-for-byte, including the prior
tracked patch and index. The object directory still contains this reference
binary, not the restored working source. Do not install or repackage it as the
normal candidate without an appropriate rebuild.

Tests use fresh owned roots on `wyatt-laptop` only. The test package directory
must be made owner-private (`0700`) before installation admission; archive root
permissions alone do not satisfy that harness contract. A rejected first
attempt is preserved and launched no browser.

Evidence: `artifacts/umbralink-control/fullsize-reference/` in the project.
Plan: `bot-docs/plans/fullsize-reference.md`. Runtime findings and limits are
recorded separately in `bot-docs/reports/performance/2026-10-06-fullsize-reference.md`.
