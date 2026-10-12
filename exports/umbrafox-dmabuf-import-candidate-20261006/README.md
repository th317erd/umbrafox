# Linux Canvas GPU Import Candidate

Umbrafox 158.0a1, Linux x86-64, build metadata `20261006023500`.
This is an isolated-validation artifact, not an accepted dogfood release.
The new preference remains OFF by default. Nothing was installed to `~/Programs`,
and the owner's running browser, profile and launcher were not changed.

## Change

Backport of upstream bug 2070629 / D327325, reland
`a3c328e4aff34a383827dc4b23f96001a3975428`. Eligible Linux remote Canvas2D video
sources can use direct DMABuf GPU import instead of an intermediate CPU download.
The gate is `gfx.canvas.remote.use-draw-image-fast-path-dmabuf=false`.

The existing V2 destination-scaled readback and its scaling argument are retained.
No WebIDL or public diagnostics are added. This package also contains earlier
dirty-tree changes; it is not a standalone upstream Firefox revision.

## Verified

- Failing-first descriptor admission checks, followed by 30 passing focused
  readback tests. Platform-macro tests compile actual helper bodies with doubles;
  they are not cross-platform Gecko or GPU execution tests.
- Scoped native/JS lint and source-preservation checks pass.
- Configured two-job build passed after a bounded incremental resume. The first
  segment timed out and had seven suppressed WebRTC warning notices; the resumed
  segment reports zero compiler warnings. Original logs are retained.
- Packaging passed; the clean extraction has 46 regular files and no symlinks.
  Build header and both packaged INIs agree on the build metadata above.
- Isolated `--version` returned `Umbrafox 158.0a1`, exit 0. Its sandbox EPERM
  warning is retained; this is not a browser rendering test.

## Not Yet Accepted

Keep the preference OFF. Real GPU-import execution, exact pixels, sustained
playback, import failure, context loss and resource behavior remain unverified.
The preceding large-canvas run observed accelerated recording followed by
software rendering, but neither its cause nor a YouTube fix is established.

Source review found that the outer null-result CPU fallback does not cover all
low-level upload failures. Default enablement requires a real failure-propagation
test as well as pixel parity. Do not infer failure safety from an upstream comment
or a successful build. No pixel-quality waiver or deployment approval is implied.

The old default pixel fixture is 110x75, below the observed acceleration cutoff.
New comparisons must use above-threshold canvases and native observations before
pixel readback, with the same candidate binary OFF/ON. Provider identity alone
does not prove a successful import.

## Provenance

Base commit: `892431809a4caadb5c73b2c03ad9bdb124c3e21e`.
`tracked-source.patch` and `new-source-files.tar.gz` retain the broader source
state; `implementation.diff` isolates this backport from preexisting changes.
`source-before-build.json` and `untracked-source.json` record source identities.
`package-verification.json` records all extracted file hashes and ELF build IDs.
`SHA256SUMS` seals the export. Do not substitute the symlinked build tree.

Full [report](../../bot-docs/reports/performance/2026-10-05-dmabuf-import.md)
and [plan](../../bot-docs/plans/dmabuf-import.md). Build, test, lint and source
evidence is under `artifacts/umbralink-control/dmabuf-import/` in the checkout.
