# Current Rendering Cost

## Question

The rare Renderer stall lacks enough parent samples to attribute its complete
duration. The older complete graphics partition predates frame reuse and
descriptor borrowing. Use the already captured current-package profile to find
remaining sampled work in Renderer, CanvasRenderer and Compositor before adding
more import/copy complexity. Do not claim a cache hit rate from sample counts.

## Fixed Diagnostic

- Input is the unchanged `current-compositor-r2` profile, SHA256
  `335206038875249534a47c0e344665291dc5949c45d6847d76390c7169debbbe`.
- One supported profiler-cli 0.10.0 load, named owned session. Reuse the prior
  bounded exporter and local symbol server with unchanged ownership, caps,
  cleanup and offline fallback. No browser, remote process, build or installation.
- Explicitly select the entire normalized capture for each of the three parent
  threads. Do not trust a popped/cleared range as full-profile admission.
- Export all functions, idle-inclusive sample totals, complete top-down trees
  and existing markers of at least 1 ms. Match native/Mesa library identities.
- Reuse the existing tested disjoint-tree partitioner. Every leaf sample must
  be accounted for; reject missing functions, truncated trees or mixed contexts.
  Preserve unresolved symbols and distinguish waits from measured CPU.
- Trace any candidate optimization through exact recorded source and callers
  before a code change. The former GPU safety/default/pixel rules still apply.

## Verification And Limits

Add failing-first range/generator tests. Assert exact exporter equivalence apart
from the new namespace, port, range selection and library checks; preserve all
launch and cleanup code. After the load, replay complete populations and compare
native IDs, sample totals and contexts, then independently check named PID/socket
absence. Every command is bounded, with 150 seconds for queries and the existing
cleanup reserve. Preserve partial evidence if any command fails; no automatic
reload or raw-profile parser fallback.

The current capture has material profiler overhead and no large reproduced stall.
This phase identifies remaining work, not a before/after speedup, physical-scanout
measurement or explanation of the original rare stall. Keep old profiles and
reports immutable; all new files belong to `current-render-cost/`.

## Outcome

The fixed load and complete saved-data analysis finished. The
[report](../reports/performance/2026-10-07-current-render-cost.md) records exact
thread identity, all sample partitions and a new fence-reconstruction lead.
Fifteen final pure test groups pass; both saved result files replay exactly.
No product code or runtime default changed, and no performance gain is claimed.

The current profile reverses the older CanvasRenderer/Compositor handles. A
tested role adapter corrects that without changing the sealed old classifier.
Of 37 samples below FenceWaitFd, 34 belong to fence creation, including 28 below
tc_sync; this is not 37 samples of demonstrated GPU blocking. The next available
step is a local-fence generation/lifetime audit, not a global wait removal.
The rare stall and earlier failed smoothness criteria remain unresolved.
