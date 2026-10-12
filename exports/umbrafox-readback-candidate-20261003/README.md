# Video Readback Cache Candidate

Linux x86-64 Umbrafox 158.0a1, build metadata `20261003071500`.
This is an isolated-validation artifact, **not an accepted dogfood release**.
Nothing was installed to `~/Programs`; the owner's browser and launcher remain
unchanged. Do not restart the owner's browser or replace its installation
without consent.

## Change

`GPUVideoImage` retains the first eligible sized CPU readback of an immutable
image, at most 1 MiB of actual stride times height. Repeated reads at that size
reuse the surface; other sizes, full-size requests, failed reads and oversized
surfaces preserve the existing paths. There is no extra pixel conversion/copy,
shader change, public API or new web-visible diagnostic.

This only targets repeated copies of the same frame. It does not establish a
benefit for one copy per new frame or fix the reported YouTube stutter.

## Verification

- Real failing-first Gecko tests: seven expected failures, two passes before
  the cache change.
- Full production build passed after a bounded incremental resume; executable
  metadata, platform metadata and generated build-ID header agree.
- Actual native cache and adjacent image-holder tests: 18 passed.
- Nine cache tests shuffled for 100 iterations: 900 passing executions.
- Scoped native lint, diff check and source hash guards passed.
- Fresh private application-data roots used for native tests; test roots exited.

Actual GPU/provider routing, browser pixel parity, playback performance,
long-session resource behavior and cross-platform validation remain pending.
The native tests use a fake readback producer and are not GPU benchmarks.
The broader rendering/layout/CSS/JS performance goal remains open.

## Provenance

Base commit: `892431809a4caadb5c73b2c03ad9bdb124c3e21e`, plus the existing dirty
checkout. `tracked-source.patch` records the combined tracked delta; the
supplement archives the untracked source files in the native/control component
directories. These include earlier work, not just this change. No source/index
cleanup or unrelated revert was performed.

The archive is `umbrafox-readback-20261003071500-linux-x86_64.tar.xz`;
`umbrafox/` is its clean extraction, not the symlinked build tree.
`SHA256SUMS` records artifact identities. Build/test/lint logs are under
`artifacts/umbralink-control/readback-*` in the checkout. The detailed evidence,
including the corrected structured stress-log analysis, is in
`bot-docs/reports/performance/2026-10-02-desktop-resumption.md`.

Commands used two build jobs, with `MOZ_BUILD_DATE=20261003071500`. Packaging
used `XZ_OPT=-T2 ./mach build -j 2 package`, invoking the normal package target
with explicit job control.
