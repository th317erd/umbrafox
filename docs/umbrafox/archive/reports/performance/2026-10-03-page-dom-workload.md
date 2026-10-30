# Page DOM Workload Follow-Up

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Result

The mutation-mirror candidate now has a page-principal sandbox workload check,
in addition to the previous native and activation tests. Seven isolated
headless runs pass all 80 samples each, including exact operation results,
mutation-observer records, layout geometry and final empty fixture state.
The shared capture-driver change also passes an actual readback regression:
all 18 frame/case pixel hashes match the previous captured baseline exactly.

**Execution-realm correction:** this collector is evaluated in UmbraLink's
sandbox with the page as prototype, not in the Window's own JavaScript realm.
The [symbolized profile follow-up](2026-10-03-dom-profile.md#execution-realm-correction)
verifies the packaged control module and identifies wrapper work as a
measurement concern. The A/B results below remain observations of this fixed
harness, not a demonstrated ordinary-page speedup. A new page-owned collector
must pass separate semantic and timing gates; do not pool the fixture versions.
Those gates are now recorded in the separate
[window-realm report](2026-10-03-window-dom-workload.md), including its repeated
batched-layout slowdown. They do not replace the historical measurements below.

The first complete balanced batch now comes from **wyatt-laptop**, authorized
by the owner as the quieter x86_64 target. Eight fresh browser processes passed
all 640 samples. The candidate's median process medians were 14.3% lower for
detached text, 15.4% for attached text, 5.5% for attributes and 10.9% for child
list changes. This is a descriptive result for fixed synthetic page workloads,
not a general browser speedup, significance test or YouTube stutter fix. The JS
control was 10.1% slower in that first batch, but 8.9% faster in the subsequent
reversed-order replication. No stable JS improvement or regression is proved.
The four targeted DOM improvements repeated; layout and observer results are
not accepted as gains. Full results and limits are below.

Earlier desktop timing batches remained incomplete. Admission found unrelated
Cargo/Rust work, including an AeorDB test job; it was not stopped or modified.
Those partial runs remain preserved and are not pooled with the laptop batch.
They do not establish the cause of the owner's earlier YouTube stutter.

A subsequent fresh attempt, suffix `8p0KzD`, also exhausted compilation admission
before launching any browser. Its `comparison.json` has an empty runs array and
the 45-second admission observations are retained in `admission-0.json`.
The command log is `artifacts/umbralink-control/dom-workload-comparison-4.log`.
This adds no timing samples and does not alter the earlier evidence seal.

The [native mutation-gate result](2026-10-03-mutation-gate.md) remains a separate,
bounded finding. This follow-up made no engine, preference, installed package,
launcher, extension or owner-tab changes. The two candidate packages remain
uninstalled. The separately authorized headed desktop check is recorded in the
[readback report](2026-10-03-headless-readback.md); actual GPU cache parity and
performance acceptance remain open.

## Completed Laptop Batch

On October 3, 13:39:23.741 through 13:41:46.377 UTC, the fixed sequence
**A B B A A B B A** completed on wyatt-laptop. A is the sealed readback candidate;
B is the sealed mutation-mirror candidate. Four independent browser processes
per build each supplied eight trial durations per case after two warmups.
The table summarizes the median of the four process medians, in milliseconds;
a positive reduction means B used less time.

| Workload | A | B | Reduction |
| --- | ---: | ---: | ---: |
| Detached text | 42.00 | 36.00 | 14.29% |
| Attached text | 47.00 | 39.75 | 15.43% |
| Attributes | 145.50 | 137.50 | 5.50% |
| Child list | 89.25 | 79.50 | 10.92% |
| Observer text | 84.25 | 82.75 | 1.78% |
| Batched layout | 9.00 | 8.50 | 5.56% |
| Interleaved layout | 44.50 | 45.00 | -1.12% |
| JS control | 22.25 | 24.50 | -10.11% |

All four B process medians are below all four A medians for each of the first
four workloads. This supports advancing the inactive mutation-gate candidate,
but does not eliminate rebuild/layout, scheduling, GC or JIT confounding. The
JS control ranges overlap (A 21.5-27.5 ms, B 21.5-27 ms). Its slower median must
not be omitted or converted into a claim of a demonstrated JIT regression.
The last A process was slower across several cases. There is no frequency
pinning or continuous host-exclusivity proof. Compiler admission passed before
every run without waiting, not continuously throughout every sample. Page clock
precision was unchanged; no profiler was active at the measured boundaries.

The Linux x86_64 archives were extracted into a new private cache directory,
not installed over any laptop browser. Both archive hashes, the transferred
harness archive and both extracted libxul hashes matched the desktop originals.
BuildID `20261003071500` is shared by both builds and does not distinguish them:

- A libxul: `82faf41661bd92231acfaff88da1598f403f63c0a399f9dbd008cb724524b61b`.
- B libxul: `d00138528b1410b81405fc9533b8771a8284ec98e6968a2bce313bc2177c4231`.

Native PID/build/application-data joins, identical fixture content, unchanged
harness hashes, exact checksums/observer counts/geometry, inactive userland and
profiler boundaries, clean owned SIGTERM and zero log drops all pass. Each run
has six valid resource samples; the largest sampled artifact size is
188068128 bytes, below the unchanged 268435456-byte cap. These samples do not
establish a memory slope or rule out transient helpers. All eight browser roots
and batch controller PID212281 were checked absent on the laptop, not by
looking for those PID numbers on the desktop.

The analyzer's full-success branch has now executed successfully. The existing
incomplete-batch rejection evidence remains valid. The source audit script
separately revalidates 640 samples and 48 resource snapshots; the copied 237
whitelisted evidence files pass SHA-256 verification. Profiles, app-data,
local-app-data and control tokens were not exported.

Evidence locations:

- Laptop input bundle: `/home/wyatt/.cache/codex/umbrafox-laptop-perf-20261003-j0Q98b`.
- Laptop batch: `/home/wyatt/.cache/codex/dom-workload-comparison-20261003-RvMB1h`.
- Desktop evidence-only copy: `/home/wyatt/.cache/codex/laptop-dom-evidence-20261003-RvMB1h`.
- That copy contains `comparison.json`, `analysis.json`, `audit.json`,
  `evidence.sha256` and each run's permitted receipts/snapshots.
- Commands/output and the audit source remain under
  `artifacts/umbralink-control/laptop-dom-*` and `audit-laptop-dom.mjs`.

This does not measure YouTube, uBlock, live playback, physical presentation or
GPU performance. No owner tabs, extensions, installed builds or defaults were
changed. No further laptop browser process or retry is running.

## Reversed-Order Replication

A separately fixed **B A A B B A A B** batch completed on the same laptop at
14:09:38.310-14:12:01.148 UTC. The sealed binaries, nine harness-source hashes,
fixture and per-process schedule are unchanged. The scratch driver gained an
explicit `--reverse` argument, validated before filesystem writes; all other
arguments fail. The analyzer accepts only the two exact balanced sequences and
eight successful runs. Two AST-extracted fake-operation tests first failed on
the unsupported reverse order, then passed both orders, invalid arguments,
imbalanced/short/long sequences and incomplete terminal states. No production
browser or harness source changed in this replication.

| Workload | A process-median median, ms | B process-median median, ms | Reduction |
| --- | ---: | ---: | ---: |
| Detached text | 43.00 | 36.00 | 16.28% |
| Attached text | 48.25 | 39.50 | 18.13% |
| Attributes | 147.00 | 135.75 | 7.65% |
| Child list | 91.25 | 80.50 | 11.78% |
| Observer text | 86.50 | 82.75 | 4.34% |
| Batched layout | 9.25 | 8.75 | 5.41% |
| Interleaved layout | 46.25 | 45.00 | 2.70% |
| JS control | 25.25 | 23.00 | 8.91% |

Every B process median is below every A process median across both completed
batches for each of detached text, attached text, attributes and child lists.
This strengthens reproducibility of the bounded DOM finding. It does not
establish a universal effect size, isolate all rebuild differences, prove
statistical significance or justify a video-performance claim. The batches
remain separately reported rather than pooling correlated trial timings.

The JS control's direction reversed: its first-batch slowdown is not a stable
observed regression, and this second-batch speedup is not an accepted JIT gain.
The process ranges still overlap. Interleaved layout also changed direction;
small/coarsely timed layout and observer changes remain descriptive only.

All 640 replication samples and 48 resource snapshots pass their existing
checks. The maximum sampled artifact size is 188050216 bytes, below the same
256-MiB cap. All eight new browser roots and controller PID227054 are absent
on the laptop. Compiler admission found no matching compilation process before
each run; continuous exclusivity is still not proved. Across the two completed
batches there are 16 fresh browsers, 1280 valid samples and 96 valid resource
snapshots, not 1280 independent timing replicates.

The second remote batch is
`/home/wyatt/.cache/codex/dom-workload-comparison-20261003-GPneTB`; its desktop
evidence-only copy is
`/home/wyatt/.cache/codex/laptop-dom-evidence-20261003-GPneTB`.
All 236 selected files match their remote SHA-256 manifest. Profiles,
application-data directories and tokens were again excluded. Logs are
`artifacts/umbralink-control/laptop-dom-{comparison,analysis,audit}-2.log`,
`laptop-dom-copy-verification-2.log` and
`laptop-dom-controller-absence-2.log`. The cross-batch summary and validation
are `laptop-dom-replication.json` and `laptop-dom-replication-audit.log`.
Scratch protocol tests and preflight/script hashes use `laptop-replication-*`.
Earlier desktop failures and first-batch results are preserved unchanged.

A separate read-only desktop check at 14:11:35 UTC still found the existing
YouTube context23/document34359738369 hidden and paused at18.530916 seconds,
with lifetime total1115/dropped30. It was not focused, resumed or navigated;
no playback interval or stutter cause follows. Receipt:
`/home/wyatt/.cache/codex/youtube-state-20261003-ctGY6D/state.json`.
The extra headed baseline window remains awaiting consent. No candidate was
installed and no test process remains active.

## Separate Profiling Attempt

Subsequent work is recorded in the [profile follow-up](2026-10-03-dom-profile.md).
It adds an explicit profiling-only artifact policy, preserves a second failed
run and analyzes its existing dump offline. Neither attempt changes the
unprofiled comparison results; the original failure below remains unchanged.

One subsequent candidate-only profile attempt on wyatt-laptop failed safely.
It ran from 14:25:14.502 to 14:25:39.960 UTC in a fresh private directory,
`/home/wyatt/.cache/codex/dom-profile-mirror-20261003-1`.
The scratch `artifacts/umbralink-control/profile-dom.mjs` adapter reused the
unchanged capture driver and fixed collector. It requested five complete
80-sample passes, with fixture-owned UserTiming boundaries and profiler features
`stackwalk`, `js`, `processcpu` and `nomarkerstacks`. These profiled durations
must never be pooled with either unprofiled comparison batch.

The existing artifact-size monitor stopped the run with
`Lifecycle artifact byte cap exceeded`. One pass completed and its 80 samples
validate against the exact document and workload oracles. No profile dump was
created or copied, so there is no stack attribution or profiler analysis result.
The profiler-stop RPC was rejected by the aborted work signal; explicit native
StopProfiler success is not claimed. Enclosing cleanup stopped the owned browser
by SIGTERM, wrote 182 log bytes with zero drops, and recorded root absence.
Separate checks on the laptop confirmed browser PID236816 and controller
PID236804 absent. No automatic retry or limit increase followed.

Six successful resource snapshots preceded failure; the last reports
187927683 artifact bytes. The failed scan throws before returning its sample,
so those snapshots do not record the over-limit total. A post-cleanup,
metadata-only `du -b --max-depth=2` of the disposable root reported 268364436
bytes, including 77863880 in `profile/remote-settings`, 45554177 in
`profile/storage`, 43823677 in `profile/cache2`, 20276842 in
`profile/security_state` and 19780101 in `profile/startupCache`. No profile,
crash-queue or cache contents were inspected. This later size inventory is not
the failing peak, a network-transfer measurement or evidence that these writes
cause the owner's playback stutter. Traversal accounting and observation times
differ; a later total below the cap does not invalidate the earlier stop.

The saved profiler snapshot records requested configuration capacity1048576,
but observed buffer `totalSize`16777216. Requested entries must not be reported
as the actual buffer size. The failure was the file-byte safety limit, not a
demonstrated profiler-memory limit. Background policy, preferences and security
services were not disabled to make the capture pass.

Four adapter mock tests pass: complete capture, RPC/evidence failures with
first-failure preservation and stop attempts, identity/state/document/checksum
rejection, and bounded owned-path profile copying. The initial RED was a missing
module, not a demonstrated production defect. These tests do not establish real
dump/stop success, which this failed runtime did not reach. No production source,
engine build, installed package or owner-browser settings changed.

Evidence:

- Desktop direct-file copy:
  `/home/wyatt/.cache/codex/dom-profile-mirror-evidence-20261003-1`.
- All 28 JSON/log/INI files match the remote SHA-256 manifest. Nested profile,
  app-data, local-app-data and discovery/token files were not copied.
- `artifacts/umbralink-control/dom-profile-failure-remote.sha256` and
  `dom-profile-failure-audit.log` retain copy and saved-result checks.
- `dom-profile-runtime-1.log`, `dom-profile-owned-sizes.log` and
  `dom-profile-root-absence.log` retain failure, size and cleanup observations.
- `profile-dom.mjs`, `test/profile-dom-spec.mjs`,
  `dom-profile-{red,green}.log` and `dom-profile-source.sha256` retain the adapter
  and its bounded mock verification.

Further profiling needs a reviewed resource contract, not an automatic cap
increase or a shorter attempt selected merely to pass. The immediate GPU gate
remains a same-headed baseline under separate window consent; the owner browser
remains untouched. Active YouTube observation still needs visible playback.

## Workload Contract

`tools/umbrafox/tests/mutations/fixture.mjs` serves one tiny owned loopback
document. `collectDOM` is serialized into a single page-principal sandbox
UmbraLink execution; it leaves no persistent global. Two warmup rounds and
eight trial rounds rotate these eight cases:

| Case | Operations per sample | Result check |
| --- | --- | --- |
| Detached text | 262144 alternating data writes | Final character code 98 |
| Attached text | 262144 alternating data writes | Final character code 98 |
| Attributes | 262144 alternating attribute writes | Final character code 98 |
| Child list | 131072 append/remove pairs | Empty child list |
| Observer text | 65536 writes, records drained every 1024 | 65536 matching records, zero callbacks |
| Batched layout | 32 rows, 64 rounds of writes then reads | Width checksum 163840, final widths 64 |
| Interleaved layout | Same writes and reads, interleaved | Same checksum and final widths |
| JavaScript control | 4194304 fixed LCG steps | Checksum 3007316010 |

The LCG oracle was independently calculated using BigInt affine composition.
A minimal VM DOM model checks actual operation counts in the serialized
collector, not merely its returned iteration fields. Its observer model only
covers synchronous `takeRecords`; the real browser runs establish the stated
record and callback results in Gecko.

The layout cases intentionally contrast batching with forced geometry reads.
They do not justify changing synchronous layout semantics or establish a
layout-engine defect. The observer case includes record allocation, draining
and record validation inside its measured span. The JavaScript control is not
a representative JS benchmark suite or a JIT optimization result.

Normal page clock precision is unchanged. A 20-ms pause separates cases outside
the measured span. Node setup/cleanup is outside that span except creation of
the reusable child-list child inside its timed operation. Each case is bounded
to 3000 ms in result validation; the whole page result to 60000 ms. A fixed
collector deadline and outer owned-browser cleanup cover failed execution.
The workload can still allocate, trigger GC, warm JIT code and include browser
scheduling costs. Correlated trials within one process are not independent
replicates.

## Capture And Isolation

`captureLocalWorkload` in the existing readback driver retains ownership of
the browser, log, server, control connection, resource monitor and cleanup.
The original readback CLI remains available through its `main` wrapper.
The DOM adapter supplies only the fixture factory and capture callback.

The existing bounds remain: 120 seconds total, 105 seconds work, 15 seconds
cleanup with a two-second terminal reserve, and a sampled 256-MiB artifact
cap. Fresh output-root identities, profile, application-data and local-data
directories are retained and checked. Native parent receipts join the PID,
runtime BuildID and actual application-data paths. Both adjacent INIs must
agree with the runtime BuildID. These are post-startup proofs, not a general
network sandbox or proof of no earlier access.

Only one selected fixture tab is admitted before and after capture. The DOM
adapter requires the same document/context, complete document, visible page,
`navigator.webdriver === false`, inactive userland preference and inactive
profiler at the boundaries. Raw replies are saved before validation. No profiler
or extra control RPC occurs inside the single timed page call, although the
existing passive resource monitor remains active.

The server allows 16 recorded requests, eight connections, 8192-byte headers
and three-second connection/request limits. Its fixed HTML bounds response
bytes; request cap failure is retained. Other routes/methods return 404/405.
CSP prohibits external resources; styles and a data favicon are local fixture
content. Abort closes owned connections/listener and repeated close is cached.

Detectability review: this is test tooling, not a product change. It adds no
browser API, default public global, network policy, timer override or CSS/DOM
semantic change. Explicit script effects are limited to the owned fixture.
It does not certify universal stock-Firefox parity, private/container behavior,
physical presentation or hardware acceleration.

## Verification

- Final combined tooling suite: **313 tests, zero failures**, 9.39 seconds.
- Exact six-file ESLint/license/whitespace/trojan-source checks: zero problems.
- The new workload-definition validation has a retained behavioral failure
  showing coercible non-string names were accepted. Explicit type and dense
  limitation-array validation fixes it before filesystem work can begin.
- Missing-module/export failures from initial test scaffolding are retained
  separately; they are not claimed as reproduced product defects.
- Fake transport checks cover native activation/profiler rejection, changed
  context/document, malformed checksums, all four RPC failure positions and
  raw-before-rejection preservation. Existing shared tests cover deadlines,
  late rejection, admission and retained child cleanup.
- A direct runtime audit revalidates all 560 DOM samples, native root joins,
  profiler/userland states, cleanup and exact root absence. All eight launched
  test-browser roots are absent; browser logs have zero drops.
- The readback regression matches both prior frames in all 18 cases. It still
  uses software ffvpx VP9/WebRender, so it does not exercise the native GPU cache.
- The comparison analyzer rejected the earlier incomplete batches before
  publishing an aggregate. The later laptop batch above exercises its full
  successful branch without pooling earlier attempts.

## Timing Attempt Boundaries

The intended process order was A B B A A B B A: four independent processes per
build, eight correlated trials per case/process. A is the sealed readback
candidate, B the sealed mutation-mirror candidate. Both have BuildID
`20261003071500`; the distinct libxul hashes in provenance, not BuildID alone,
identify them. Page and collector hashes are identical across the seven DOM
runs. The first standalone validation run is not part of either timing batch.

The first comparison refused before launching. Two subsequent attempts each
completed only A B B, then refused further launch. The last waited within a
fixed admission bound. These sequences are incomplete and imbalanced. Text
timings directionally favored B, but no page speedup percentage, significance,
layout/JS benefit or stutter attribution is accepted from these samples.
Pre-run admission alone also cannot exclude compilation or other activity
starting during a measured interval. Do not combine the two partial batches
or keep retrying until a favorable sequence appears.

## Later Runtime Attempts

The next fresh batch, suffix `ERFBeO`, completed A B B A (320 valid samples),
then stopped in process five on a resource-monitor `ENOENT` while enumerating
the owned profile's temporary `safebrowsing-updating` directory. The failed
browser exited cleanly. The [bounded-rescan correction](2026-10-03-artifact-rescan.md)
adds full-tree retries for disappearing descendants while preserving root,
permission, entry, byte and deadline failures. It changes no browser code.

After its 342-test/lint gate, a fresh batch `wwqtOi` completed A B B (240 valid
samples). It waited about 32 seconds for compilation before its third process,
then exhausted the 45-second admission bound before its fourth. This remains
incomplete, not an accepted speed comparison. All 21 resource samples from its
three successful processes completed on their first artifact-scan attempt;
the rescan recovery itself is covered by the real temporary-directory test,
not a recurrence observed in those browser runs.

The additional saved-data audit validates all 560 new samples, exact document
joins, library hashes, native app-data paths, inactive profiler/userland states
and resource caps. All eight new launched roots (seven passes and one harness
failure) are absent, with clean cleanup and zero log drops. The comparison
analyzer again rejects incomplete input and writes no timing aggregate.

Additional evidence is under `artifacts/umbralink-control/`:
`dom-workload-comparison-{5,6}.log`, `audit-artifact-rescan.mjs`,
`artifact-rescan-runtime-audit.{json,log}` and
`artifact-rescan-analysis-rejection.log`. The comparison driver now also hashes
its shared harness dependencies at each admission. Old receipts/seals are not
rewritten. No further benchmark retry is scheduled while competing work persists.

## Evidence And Next Steps

Durable roots under `/home/wyatt/.cache/codex/`:

- `dom-workload-validation-20261003-1`: initial 80-sample candidate pass.
- `readback-adapter-regression-20261003-1`: actual shared-driver regression.
- `dom-workload-comparison-20261003-jx40nS`: prelaunch refusal, zero runs.
- `dom-workload-comparison-20261003-7sqVXQ`: first incomplete A B B batch.
- `dom-workload-comparison-20261003-ZV2yDI`: bounded-wait incomplete batch.
- `youtube-state-20261003-e5dOsE`: single read-only live-tab observation.

`artifacts/umbralink-control/dom-workload-*` retains tests, lint, failure logs,
comparison output and `runtime-audit.json`. Reproducible scratch drivers are
`compare-dom-workloads.mjs`, `analyze-dom-workloads.mjs` and
`audit-dom-workloads.mjs`. The final evidence manifest is
`artifacts/umbralink-control/dom-workload-final.sha256`.

The live check at 09:40:21 UTC found context 23/document 34359738369 hidden,
paused at 18.530916 seconds, 1920x1080, lifetime frames 1115/dropped 30. It did
not navigate, resume, focus, alter or restart the owner browser. These lifetime
counters are not a new playback interval. No browsing URLs, titles or control
credentials are included in the saved observation.

The laptop batch above supplies the previously missing quiet-host comparison;
desktop partials stay separate. For actual YouTube attribution, collect the existing read-only
sampler while the owner plays a foreground video. The separate native GPU
candidate still needs same-backend pixel parity and actual cache-path evidence.
Do not install or claim general performance acceptance from this fixture alone.
