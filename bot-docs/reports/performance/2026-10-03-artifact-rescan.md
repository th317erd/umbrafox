# Bounded Artifact Rescans

## Observed Failure

The fresh DOM timing batch `dom-workload-comparison-20261003-ERFBeO` passed its
first four processes, then failed during process five. The resource monitor
received `ENOENT` while reading the owned profile's `safebrowsing-updating`
directory. Its earlier directory enumeration/stat was no longer valid.
The saved error does not distinguish a rename from removal. No profile contents
or update payloads were inspected to infer the exact browser operation.

The failed browser PID1092612 exited through clean owned SIGTERM, with 183 log
bytes and zero dropped bytes. All five launched browser roots were subsequently
absent. This was a harness stop, not evidence of a browser crash. The incomplete
four-process A/B/B/A batch is preserved and is not pooled into a timing result.

Evidence: `artifacts/umbralink-control/dom-workload-comparison-5.log` and
`~/.cache/codex/dom-workload-comparison-20261003-ERFBeO/`, including
`comparison.json` and `run-4-A/run.json`.

## Correction

Only the artifact-size reader and its internal resource-sample metadata changed
in `tools/umbrafox/performance/lifecycle-capture.mjs`:

- A descendant `ENOENT` discards that partial byte total and retries the entire
  owned output tree, at most three attempts. No missing entry is silently
  treated as zero in a successful scan.
- The output root must be readable on every attempt. Root `ENOENT`, permission
  errors, non-directory errors, other IO errors and malformed sizes remain fatal.
- The existing 8192-entry traversal budget is shared across attempts. Byte usage
  above 256 MiB still fails immediately, including on a retry.
- Existing abort/monitor deadlines are unchanged. Abort is checked after each
  read and before more IO or retries; late IO completion cannot start a rescan.
- Successful samples retain `artifactBytes` and add `artifactScan` with attempt
  and cumulative visited-entry counts. Old samples remain readable; they do not
  retrospectively gain retry metadata.

This is a completed traversal without observed missing paths, not an atomic
filesystem snapshot. Concurrent growth or movement can still occur between
observations. The existing sampled safety cap is not a hard filesystem quota,
nor is this a same-UID filesystem sandbox. Already-started OS reads are not
claimed cancellable.

The shared monitor serves lifecycle smoke/soak and the local readback/DOM driver.
No browser preference, Web API, request behavior, native code, page clock,
product binary, package or installed browser was changed by this correction.

## Verification

Twelve new tests in `test/lifecycle-capture-spec.mjs` cover directory rename,
file disappearance, retry exhaustion, fatal errors/root loss, shared traversal
budget, byte/malformed-size limits, abort priority, late IO, non-directory
metadata and a real temporary-directory rename. The real filesystem test keeps
the payload bytes intact and removes only its newly created test directory.

Initial behavioral RED: 50 passes, seven failures. Initial GREEN: 57 passes.
The final combined strict-unhandled suite has **342 passes, zero failures**,
including the real rename and adjacent monitor/cleanup tests. Exact two-file
ESLint/license/whitespace/trojan-source checks pass with no warnings.

An in-memory reversal of just this production delta reproduces the exact
pre-change module SHA256, so prior unstaged lifecycle work was not rewritten:

- Before: `da3ca11b8c7391a4a72f42583cd269541d254f311d2b925de50ee5395ea53f92`.
- After: `8192546829166d3b1752c790b77bcce586428b668acbc7969e9fa3680ef20878`.

Logs/scripts are under `artifacts/umbralink-control/`:
`artifact-rescan-{red,green,final-tests,final-lint}.log`,
`verify-artifact-rescan-delta.mjs` and `artifact-rescan-delta.json`.
Fresh runtime comparisons belong to the separate
[page DOM report](2026-10-03-page-dom-workload.md); the failing batch and older
hash manifests remain unchanged.

The fresh `wwqtOi` batch passes three real DOM runs and 21 resource samples
before unrelated compilation prevents further admission. Each captured scan
takes one attempt, so those runs verify normal-path integration rather than
the rename-retry branch. A saved-data audit validates seven additional successful
DOM runs across both new batches, 560 samples, and eight absent browser roots
including the earlier harness failure. Performance comparison remains incomplete.
