# Request Fast Path: Controlled Response Latency

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Finding

The uninstalled candidate preserves response-start progress while the content
thread is busy, in this fixed loopback workload with an explicitly installed
request observer and no userland scripts. All four unwrapped baseline/candidate
process pairs pass the pre-observer response-progress control. After installation,
all 12 baseline busy requests wait for the busy task to end; all 12 candidate busy
requests show response start during the task. This is a bounded mechanism result,
not proof that the owner's fresh empty browser intercepts requests or that this
causes YouTube stuttering.

The prior zero-hold experiment remains separate and inconclusive for strict
response progress. Its ambiguous timing controls were not relaxed or pooled here.

## Protocol and Provenance

- Protocol: `docs/umbrafox/archive/plans/request-latency-measurement.md`, fixed before launch.
- Host: `wyatt-laptop`, isolated headless browsers, fresh private profile and
  application-data roots. No owner tabs, extensions, installed browser or launcher
  changed. No native build, package installation, staging or commit.
- Same sealed 46-file diagnostic pair as the prior experiment. Only the root
  `omni.ja` differs, with three changed payloads: EventController, ScriptRegistry
  and UserlandParent. Native bytes and Runtime payload are identical.
- Pair proof SHA256:
  `60972c8cf99b6a19e7ccbe80bc6a5232a669a52e26222a9d89dbf2a46a5f1498`.
  Runtime and both INIs report BuildID `20261003071500`.
- Exact full-tree proofs before/after each run and seven extracted module hashes
  before each run. All 27 bundled harness files match before/after the wave.
- Ten sequential runs: traced baseline/candidate, then eight unwrapped processes
  in ABBA/BAAB order. Each process performs six sequential requests before and six
  after explicit observer installation, alternating idle and 100 ms busy tasks.
- The identical 155-byte page and headers are retained. Each server response is
  held for at least 20 ms using a monotonic deadline; all 130 observed holds are
  20.225-21.030 ms, below the fixed 250 ms acceptance ceiling. Server clocks are
  not subtracted from page clocks. Server finish is not browser body consumption.
- The original strict predicate remains: `responseStart > requestStart` and
  `responseStart < busyEnd - 10`. All three before-observer busy samples must pass
  in each process. Candidate origin classification is warmed at the boundary;
  these are cached steady-state observations, not first-use cost measurements.
- No profiler or query wrapper in the eight measured processes. Query populations
  are unknown there. Separate traced controls show baseline 0/6 queries before/
  after installation, candidate 0/0, with unchanged null response decisions.

## Results

Each cell below is the median of that process's three busy requests, in ms.
Request/response values are relative to the page's recorded fetch start.

| Run | Variant | Before request | After request | Before response | After response | Before fetch | After fetch |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 2 | Baseline | 2 | 102 | 23 | 122 | 101 | 124 |
| 3 | Candidate | 3 | 2 | 23 | 23 | 101 | 100 |
| 4 | Candidate | 3 | 3 | 24 | 24 | 101 | 101 |
| 5 | Baseline | 3 | 102 | 23 | 122 | 100 | 125 |
| 6 | Candidate | 2 | 3 | 24 | 24 | 100 | 101 |
| 7 | Baseline | 3 | 101 | 24 | 123 | 101 | 125 |
| 8 | Baseline | 3 | 102 | 24 | 123 | 100 | 124 |
| 9 | Candidate | 3 | 3 | 24 | 23 | 101 | 102 |

The four paired differences in before/after request-start gaps are
101, 99, 97 and 99 ms. Paired after-phase fetch-completion differences are
24, 24, 24 and 22 ms; differences adjusted by each process's before phase are
24, 25, 23 and 23 ms. Four process pairs are descriptive, not a population-wide
effect estimate. Individual requests are not treated as independent browser runs.

Interpretation: the candidate avoids delaying request admission until page
JavaScript becomes available, allowing the fixed response latency to overlap the
busy task. Promise/body consumption still requires page execution, so this is not
a 100 ms end-to-end improvement. Resource Timing proves only the recorded
response-start relationship, not packet-level or complete-body transfer timing.
Idle timings overlap; no general idle-speed claim is made.

## Verification and Cleanup

- Runs span `2026-10-03T22:44:03.686Z` through `22:51:15.799Z`, with individual
  envelopes 12.106-12.459 seconds, all inside the 120-second bound. No result-based
  retries or overlapping browsers.
- All ten functional, document identity, private-root, native build, body SHA,
  fixture, resource and owned-cleanup gates pass. `navigator.webdriver` is false.
- All 50 resource samples satisfy absolute and post-baseline relative caps; each
  saved baseline joins exactly one actual sample. Maximum sampled artifact size
  is 188,119,929 bytes. This is sampled, not continuous process/network isolation.
- Ten owned SIGTERM cleanups, zero dropped log bytes. Export independently checks
  all 20 exact browser/controller PIDs absent. Logs contain only the recorded
  EPERM namespace warning, headless notice and SWGL framebuffer warning; these
  headless results do not establish hardware acceleration or visible rendering.
- 282 direct evidence files, 949,134 bytes, with all hashes verified after
  transfer. Two additional setup snapshots explain the file count; no profile,
  discovery token, application-data subtree or shared crash queue was exported.
- Final strict Node gate: 29 tests pass, zero failures, about 1.25 seconds.
  Coverage includes early timer wakes, clock errors, abort/disconnect, malformed
  requests, concurrency/request caps, fixture body/headers, existing collector and
  actor behavior, old and new saved results, and corrupted evidence rejection.
  Nine synthetic latency corruption cases and four saved-wave corruption cases
  reject. Synthetic ambiguity cannot be promoted merely by adding server holds.
- The saved-wave test reproduces the entire saved analysis, not only aggregate
  numbers. Previous 345-file seal and nine phase-two source/test files remain
  unchanged. The current work changes private diagnostic tools/tests/docs only.
- Initial missing-module test failures are harness TDD, not production failure
  evidence. A final remote hash-check attempt used the wrong remote working
  directory and failed before reading the manifest; the corrected command passes
  all 27 files. Both logs are retained. No browser retry was involved.
- Scratch syntax and scoped whitespace checks are separate from registered
  product lint; no new product-lint or universal Firefox-parity claim is made.

## Evidence Locations

- New remote run root:
  `/home/wyatt/.cache/codex/request-paired-20261003-afDgd2/`.
- Unchanged remote pair:
  `/home/wyatt/.cache/codex/request-paired-20261003-M8BkdH/pair/`.
- Local evidence:
  `/home/wyatt/.cache/codex/request-latency-evidence-20261003/`.
- Local pinned pair proof:
  `/home/wyatt/.cache/codex/request-fastpath-pair-20261003-dub_txpr/pair.json`.
- Tools and logs: `artifacts/umbralink-control/request-latency*`,
  `capture-request-latency.mjs`, `audit-request-latency.mjs`,
  `bundle-request-latency.mjs`, and mirrored `test/request-latency*-spec.mjs`.
- Analysis: `artifacts/umbralink-control/request-latency-analysis.json`.
- New immutable checkpoint: `artifacts/umbralink-control/request-latency-final.sha256`.

Reproduce the supplied-data audit without a browser:

```sh
timeout 20 node artifacts/umbralink-control/audit-request-latency.mjs \
  /home/wyatt/.cache/codex/request-latency-evidence-20261003 \
  /home/wyatt/.cache/codex/request-fastpath-pair-20261003-dub_txpr/pair.json
```

## Next Gate

Carry this verified request-admission improvement forward without presenting it
as the complete rendering fix. The next performance experiment should connect
it to a controlled page/video workload on the quiet laptop, with matched assets,
playback state and observer conditions. Visible hardware-accelerated testing is
a separate owner decision; headless SWGL results cannot clear that gate. Matching
documents with capabilities, real YouTube/extension attribution, layout and GPU
work remain separate. No daily-browser replacement or restart follows automatically.
