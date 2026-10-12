# Inline Mutation Gate Candidate

Experimental self-contained desktop package. **Not installed.** Do not replace
the owner's running browser or launcher automatically.

- Native BuildID: `20261003071500`; distinguish candidates by hashes, not this
  deliberately shared build identifier.
- Archive: `umbrafox-158.0a1.en-US.linux-x86_64.tar.xz`.
- Archive SHA-256: `af78b8fb92da25089b7c243a7dfcbf37b37fc5045b7fd392b180210150ab70e4`.
- libxul SHA-256: `1e2e164e54d826958361ccff1e4a75bb1c92814f9b87877ab340c3bc56f7f2fb`.
- Executable SHA-256: `0ca9e768f64ab36078bbcde61ce788f681c73cfbf670b25aa89c286ab1323f14`.

The new change moves the existing live userland-active preference check into
the native mutation gate's inline entry point. The enabled path retains the
existing recursion, script safety, document readiness and observer checks.
No web API, mutation algorithm, default preference or request policy changes
in this delta. This package also includes previous uninstalled work, including
readback and request-path changes. It is not a minimal isolated A/B artifact.

The native build and gtest relink pass with two jobs. `mach package` passes;
its packaging driver selected 16 jobs despite `MOZ_MAKE_FLAGS=-j2`, so packaging
must not be described as a two-job operation. No new native compilation is
shown in that packaging log. All 46 extracted regular files match the staging
tree, and the isolated version command succeeds. The actual extracted package
passes 218 adjacent headless browser assertions using fresh private roots.

`tracked-source.patch` and `new-source-files.tar.gz` capture the selected
source trees, including 55 untracked files. They are working-tree provenance,
not a hermetic or reproducible-build claim. The version receipt and packaging
inventory are retained. `SHA256SUMS` seals these artifacts.

Native microbenchmarks show a lower inactive-gate and minimal text-update cost;
they do not establish representative page, layout, video or GPU improvement.
See [the report](../../bot-docs/reports/performance/2026-10-03-mutation-inline.md).
