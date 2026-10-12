# Mutation Mirror Candidate

Experimental, self-contained desktop package. **Not installed.** The owner
browser, launcher, profile and tabs are unchanged. Do not install automatically.

- Pinned BuildID: `20261003071500` in both INIs.
- Archive: `umbrafox-mutation-mirror-20261003071500-linux-x86_64.tar.xz`.
- Archive size: 107,766,264 bytes.
- Archive SHA-256: `10658410fda22d8a4951b2274ed627d1767cacd8e385d0e62ea053aab478fdd3`.
- Executable SHA-256: `0ca9e768f64ab36078bbcde61ce788f681c73cfbf670b25aa89c286ab1323f14`.
- libxul SHA-256: `d00138528b1410b81405fc9533b8771a8284ec98e6968a2bce313bc2177c4231`.

This includes the previous readback-cache candidate, all existing dirty native
work, and the new always-mirrored userland-active preference for DOM mutations.
It is not a minimal source patch or a proved YouTube fix. No request interception
policy or web API changed in the mutation-mirror delta.

The earlier readback-only candidate has the same pinned BuildID but different
archive/libxul hashes. Its sealed export is unchanged. Do not confuse those
artifacts based on BuildID alone.

`tracked-source.patch` captures the complete tracked HEAD diff at export time.
`new-source-files.tar.gz` captures 39 untracked source/test files under browser,
dom, gfx, modules, toolkit and tools/umbrafox. These are working-tree snapshots,
not a claim of a hermetic or reproducible build. `SHA256SUMS` seals the package,
binary, INIs, source snapshots and this document.

Verification: two-job full build, gtest build and package passed; three native
test processes passed; 59 adjacent browser assertions passed. The clean
extracted package separately passed five live activation-transition assertions
with fresh private app-data roots and normal owned cleanup. Extraction has no
symlinks. This is functional evidence, not universal public-surface parity or
hardware/performance acceptance.

See [the investigation report](../../bot-docs/reports/performance/2026-10-03-mutation-gate.md)
for exact measurements, original failures and remaining gates. The owner must
approve any test window that could disrupt the active desktop session.
