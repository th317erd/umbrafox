# Performance engineering

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

Start with the [program plan](../../plans/performance-program.md). This directory
is the maintained workflow for measuring and improving Umbrafox, not a collection
of one-off benchmark scores.

1. Read the [measurement contract](measurement-contract.md) before capturing.
2. Check [instrumentation](instrumentation.md) before adding a probe.
3. Pick the next bounded experiment from the [catalog](catalog.md).
4. Preserve the result in `docs/umbrafox/archive/reports/performance/`, including failures.
5. Update the conversion guide when tooling, markers or runtime behavior change.

Use local desktop experiments for fast iteration and periodic physical Raspberry
Pi tests for ARM64, GPU, decoder, memory-bandwidth and thermal behavior. Results
from headless, llvmpipe, Xvfb, native X11, Wayland and physical HDMI must never be
pooled as if they were the same backend.

The browser's existing internal UmbraLink snapshots and Firefox Profiler are the
first instrumentation layer. No new page-visible API is needed. Profiles may
contain URLs, source, user input and native addresses; keep them local and do not
publish credentials or raw personal browsing captures.

## First local exercise

The `tools/umbrafox/performance/` runner uses a fresh owned profile and a local
fixture; it does not attach to the user's browser. Its short workloads validate
the evidence pipeline and identify candidate costs, not production speed or
display correctness. The runbook and initial execution evidence live with the
[first audit](../../reports/performance/2026-09-26-audit.md).

Follow-up evidence:

- [Userland compiled-script cache controls](../../reports/performance/2026-09-27-userland-cache.md)
- [Browser presentation boundaries](../../reports/performance/2026-09-27-presentation-boundary.md)
- [Owner-shared Pi research triage](../../reports/performance/2026-09-27-pi-research-triage.md)
- [Retained native probe exclusion](../../reports/performance/2026-09-27-probe-exclusion.md)
- [Isolated lifecycle controls](../../reports/performance/2026-09-27-lifecycle.md)
- [Request fast-path authority](../../reports/performance/2026-09-27-request-authority.md)
- [Historical Pi renderer spans](../../reports/performance/2026-09-27-pi-renderer-spans.md)

## Status vocabulary

- **Measured problem:** reproducible symptom and raw evidence, not necessarily a cause.
- **Source-confirmed mechanism:** producer/consumer behavior checked, runtime magnitude unknown.
- **Hypothesis:** a falsifiable explanation, not yet established.
- **Coverage gap:** measurement or acceptance proof missing.
- **Experimental benefit / correctness FAIL:** keep separate from a deployable fix.
- **Fixed:** all item-specific correctness, performance and regression gates passed.
