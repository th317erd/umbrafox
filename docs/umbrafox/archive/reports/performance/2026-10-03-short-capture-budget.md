# Short Capture Budget Preparation

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

The shared local capture driver now accepts an optional `timeoutMs` on its
workload definition. It can shorten the existing 120-second envelope to between
30 and 120 seconds, inclusive; malformed values and expansion are rejected.
The default and existing callers remain unchanged. This prepares a bounded
native temporary-directory check; no browser was launched in this follow-up.
The requested single disposable headless laptop run remains awaiting owner
approval. Headed-window and working-browser restrictions remain separate.

## Deadline Contract

`createLocalCaptureBudget()` wraps the existing lifecycle budget, subtracting
the same shortening amount from all three deadlines. It does not relax the
shared lifecycle plan's own minimum or alter its API. Only readback/composed
capture tooling uses this wrapper. The capture timer, operation wrappers,
cleanup, evidence writer and terminal report receive the shortened budget.
The run report records the actual total and work limits rather than the old
hard-coded values.

At the shortest setting, setup and work have 15 seconds. The next 13 seconds
are available to ordinary cleanup, with the final two seconds reserved for
terminal evidence. The clock starts at capture entry, before output creation
and binary provenance. Slow setup can therefore exhaust the budget before
launch or measurement; it does not earn an extension or an automatic retry.

No artifact limit, process ownership rule, SIGTERM-only cleanup policy,
profiling mode, preference, quiet period or public browser interface changes.
An operation timeout still bounds waiting, not guaranteed cancellation of
arbitrary kernel I/O. A failed owned-process stop remains a visible cleanup
failure; this is not an unconditional process-exit guarantee.

## Verification

Only `tools/umbrafox/tests/readback/capture.mjs` and its existing
`test/capture-spec.mjs` changed. Their previous bytes are retained under
`artifacts/umbralink-control/browser-temp-proof/`.

- `deadline-red.log`: 11 tests passed, three failed. The configuration test
  demonstrates the old validator ignored invalid timeouts; two missing-export
  failures are scaffolding, not runtime deadline failures.
- `deadline-green.log`: 14 tests passed after implementation.
- `deadline-integration.log`: 15 passed after adding real cleanup-function
  integration with fake operations and a supplied clock.
- `full-final.log`: 447 tests passed, zero failures, approximately 15.6 seconds.
- `lint-final.log`: exact two-file lint has zero errors, warnings or fixes.

The new tests cover 30/45/120-second boundaries, default compatibility,
fractional remaining time, invalid/non-finite inputs, work admission expiring
before dispatch, cleanup admission and the terminal reserve. Cleanup tests
retain the original work failure, exercise normal completion, and reject new
cleanup operations after its budget expires without spending terminal time.
The full suite includes the earlier private-temp creation/environment/native
receipt tests and shared resource/deadline/cleanup regressions. Native temp
receipts are still only tested with supplied services, not an actual browser.

## Saved Resource Evidence

`headroom-review.json` projects the already preserved matched startup samples;
it does not inspect new browser state or profile contents. Its input is pinned
to `quicksuggest-footprint/results-final.json`, SHA256
`fd4f828c98833fbcf970e3faa9969a86c240c9e90f7d6a8fe377ee9637ee1dc0`.

For samples completed within 20 controller-relative seconds, the candidate
peak was 63651149 bytes and the baseline peak 187932420 bytes. The latter leaves
80503036 bytes, approximately 76.8 MiB, under the unchanged 256 MiB cap. Their
full-run peaks instead occurred near 27 seconds; the baseline then had only
1052267 bytes of remaining headroom.

This supports proposing a shorter observation, not certifying its future size.
The old runs did not observe native temp paths and did not account for external
temporary files. Sampling also cannot bound between-sample peaks. No runtime
hold is cleared, old result discarded, or long-run success inferred from this
projection. The existing cold-start, cleanup and Suggest candidates still need
separate controlled comparisons, followed by actual playback/GPU measurements.

## Preservation

The previous private-temp seal remains historical: its two current capture
source/test entries are intentionally superseded, with matching before copies.
Other source and evidence entries must remain unchanged. The earlier reports
and sealed capture scripts are not rewritten. The staged index remains
unchanged; no native build, package, install, remote command, browser or profiler
was run. The work advances bounded measurement capability, not a speedup claim.
