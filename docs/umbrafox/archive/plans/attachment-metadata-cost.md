# Attachment Metadata Conversion

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Scope And Hypothesis

The current startup profile attributes parent work to certificate attachments,
ZIP extraction and IndexedDB. It does not attribute the four short callback gaps
to this work. Investigate one unnecessary operation inside that measured path:
`Downloader.cacheAll()` converts the byte string returned by `readZipEntry()`
to a metadata Blob, reads its text asynchronously, then calls `JSON.parse()`.

No product edit is authorized by a favorable microbenchmark alone. This phase
adds an isolated Gecko diagnostic and evidence, not a new browser capture,
security preference, request change, installation or scheduling policy.

## Territory

Producer: `nsScriptableInputStream::ReadBytes`, an `nsACString` of byte values.
Consumer: `Downloader.cacheAll`, then the existing 50-record cache batches.
Production caller found by upstream search:
`IntermediatePreloads.updatePreloadedIntermediates`. Download/hash checks,
certificate import, retries, partial-cache results and cleanup remain unchanged.
Current attachment source hash is
`dbb945734369469677c29c8f4f3ba0bb1400d679401fb7b2adf41c72d9392a27`.

Rulebook: the probe exposes nothing to websites and changes no product behavior.
Any eventual candidate must preserve the same parsed byte-string results,
including existing non-ASCII behavior, rather than silently changing encodings.
It must preserve main-thread opportunities to service other tasks. Security
updates are not disabled, deferred until idle or skipped.

## Prospective Checks

1. Check the real native byte-stream round trip for all 256 byte values. Compare
   Blob text with those strings, plus valid/invalid JSON, controls, escapes,
   high bytes, BOM-shaped bytes, duplicate keys and larger records. Compare
   parse values or error name/message, not just successful ASCII fixtures.
2. Compare the original Blob parser, synchronous direct parser, and a direct
   parser preceded by `Services.tm.dispatchToMainThread` in a Promise. A queued
   normal-priority task must run before completion on the proposed yielding
   path. The direct-only path is an intentional negative fairness control.
3. Use fixed A/B/C/C/B/A order twice for 1024 records per cell at two payload
   sizes. Warm each mode independently, preserve every cell, and check record
   contents outside the timed region. No result-based repeats or pass threshold
   selection. These are correlated within-process microbenchmarks, not startup,
   browser CPU, page-frame or playback measurements.
4. Run with the existing isolated xpcshell harness, owned profile/temp/app-data
   roots, FOG test mode and nonlocal connections disabled. Reuse the previously
   verified native-root head. No browser window, server or personal store access.
   Bound the process group with SIGTERM at 120 seconds. Preserve failure output
   and exact process identities; no SIGKILL, retry or cap relaxation.
5. Independently validate the saved output population, exact schedules, counts,
   clocks, source identities and native terminal status. Test the analyzer with
   malformed/incomplete/corrupted data before using its quantitative result.

## Next Gate

If the yielding alternative preserves observed semantics and shows a substantial
local reduction, add failing-first actual-source and native downloader tests
before considering a narrow product candidate. Full cache operations, failure
cleanup, realistic bundle throughput and event-loop latency remain separate
integration gates. If yielding erases the benefit, retain current behavior.

## Admitted Candidate And Integration Gate

The first native run stopped before timing because the probe used the obsolete
`Cu.now` name. Its 277 equivalence cases and fairness checks passed. Preserve
that failure. With `ChromeUtils.now`, the fixed 24-cell probe completes and
supports investigating the yielding alternative, not a browser speedup claim.
The actual-source regression is RED (38 pass, 6 fail), and the native downloader
regression observes two metadata Blobs where zero are required. Only then replace
the metadata Blob/text operation with one normal-priority task followed by parsing
the existing byte string. Retain the 50-record batches and all other behavior.

Before accepting the candidate, run the full downloader suite, then one fixed
native bundle comparison. Use 512 records, 256/4096-byte metadata payloads,
1024-byte attachments, and A/B/B/A order at each size. Warm both implementations
with 16 records first. Read a generated ZIP through the actual source modules and
write/read real IndexedDB; replace only the network fetch with fixed supplied
bytes. Clear only the isolated test cache between cells. Queue a recurring normal
task to record service opportunities and maximum observed gap; stop and drain it
in finally. Compare every stored record and attachment outside the timed region.
This is one process, instrumented and synthetic; no release threshold, startup
speedup or security-update latency equivalence follows from it alone.

The observed bundle experiment completed all eight cells, with mixed timing.
Its recurring task ran 60864-77194 times per 512-record measured operation, so
it is a loaded observer, not passive measurement. Preserve the unfavorable
small-record result. One prospectively fixed quiet companion will remove that
observer only: same two sizes, 16-record warmups, A/B/B/A ordering, real native
ZIP/IndexedDB work and complete content checks. Eight cells, no retries or
pooling with the observed run. This falsifies whether a conversion gain survives
the full operation without the artificial recurring-task load; it does not
establish cross-process repeatability, live-startup benefit or tail safety.

## Outcome

The diagnostic and narrow source-candidate gates are complete. Final native
downloader coverage is 166 passing assertions; byte/parser coverage is 1728.
All eight measured cells from each integration run are retained, and the final
54-group source/analyzer/replay suite passes. Quiet full-operation medians are
6.15% and 3.06% lower; the loaded small-record case is 2.55% slower. These are
within-process observations, not release or live-browser performance acceptance.

The [dated report](../reports/performance/2026-10-07-attachment-metadata.md)
records exact identities, failed probes, source limits and cleanup. No additional
runtime repetition, security-work suppression or package installation follows
automatically. New integrated startup evaluation requires a new package and
prospective protocol. The separate compositor-stall investigation stays open.
