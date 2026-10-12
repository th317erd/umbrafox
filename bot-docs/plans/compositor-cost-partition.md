# Complete Compositor Cost Attribution

## Status

Offline attribution and source follow-up are complete. Both complete exports
replay, all disjoint counts agree, and exact owned cleanup receipts are retained.
See the [report](../reports/performance/2026-10-07-compositor-cost-partition.md).
The next independently gated experiment is
[PBO Upload Control](pbo-upload-control.md), not a change to synchronization or
product defaults. The broader performance goal remains active.

## Scope

Use only the existing compositor-controls recording and its exact binary symbols.
Do not launch a browser, change native source, install, touch the daily browser,
change profiler tools, parse raw profile JSON, or weaken prior performance gates.
The descriptor-borrow playback result is sealed and shows no measured gain.

The previous full-range query corrected a CLI range-state bug but its call trees
were truncated at 501 nodes. Complete trees are needed before disjoint attribution
of renderer, canvas and compositor samples. Sample counts are not CPU duration,
GPU execution or physical presentation. This recording has material observer cost
and predates the latest import cache; it cannot measure that cache's benefit.

## Protocol

1. Preserve all prior artifacts. Use the new compositor-cost-partition namespace.
   Reuse the hash-pinned profile-range exporter with only session/output/port and
   query-body substitutions. Preserve its input identities, resource limits,
   loopback-only symbols, per-command/aggregate bounds and owned cleanup.
2. One offline named CLI session, existing profile only, explicit full normalized
   range. Query Renderer, CanvasRenderer and Compositor: all-sample summary,
   complete function inventory, active summary and top-down tree with a 20000-node
   cap. Require exact prior full-range populations and per-node conservation;
   truncation is a failed result, not an estimate. No automatic reload/retry.
3. Partition each leaf's self samples into its outermost named stage. Render,
   swap, texture operations, canvas replay/presentation, texture destruction,
   composition and completion notifications stay distinct. Preserve other and
   unresolved leaves. Cross-check leaf handles/names/counts against the complete
   function inventory and require stage totals to equal the active root total.
4. Before execution, test nested stages without double counting, incomplete trees,
   malformed/negative/fractional counts, duplicate nodes, mismatched threads,
   clocks, function identities and exporter scope. Afterward replay exact saved
   results and verify daemon/server/socket cleanup and original seals.
5. Trace the largest actionable stage through the recorded build sources before
   proposing a fix. Do not infer a mutex owner, GPU wait or stutter cause from a
   function name or inclusive count. Product changes need their own failing test,
   correctness/native gate and matched unprofiled performance comparison.

## Separate Source Check

VideoBridgeParent inherits false UsesImageBridge and a null
AsCompositorBridgeParentBase. TextureHost's wrapper predicate consequently rejects
WebRender wrapping on that route. The missing optional borrowing override on
WebRenderTextureHost is not sufficient evidence that the current CanvasTranslator
optimization is bypassed. Keep actual runtime borrow counts unknown; no wrapper
change follows. The inspected source must be joined to its exact build pins.

## Conditional Mesa Follow-Up

The first complete export has finished and its owned processes/socket are absent.
Renderer attribution is render344, swap109, other106 of559 non-idle samples.
Within render, UploadBufferPool::end_frame accounts for95 samples, largely in
unresolved driver frames. The current source already avoids empty-pool fences;
creation is fence_sync, while polling uses zero-timeout client_wait_sync.

Use one separately named offline session and sibling mesa output, preserving the
first export. Add only the existing authenticated Mesa symbol directory and its
SHA256 guard to the pinned exporter. Require Renderer and CanvasRenderer library
receipts to report the recorded Breakpad ID D40187191DB6AFC1D1949464114E27C10;
the Compositor inventory has no Gallium frames and must remain so. The first
unexecuted exporter draft incorrectly required that library on every thread;
retain it and execute only the corrected r1 exporter.
Keep the same profile/binary hashes, full range, categories, 20000-node tree cap,
loopback-only symbols and original deadlines/owned cleanup. No fallback network
or symbol download. Before launch, prove the entire generated delta is restricted
to symbols, identity/output/port and one library query per thread. Afterward,
require disjoint stage totals and coverage to agree, but do not assume function
handles or tree-node counts survive additional symbolization. Interpret resolved
stacks as sampled code paths, not measured GPU waits or proof of stutter cause.
