# Laptop DOM Profile Attribution

## Result

Local symbolication is now complete to the bounded extent described below:
unresolved hexadecimal self samples fell to 4.4-4.9%. It also exposed a
measurement limitation: these workloads run inside the UmbraLink page-principal
sandbox, not as ordinary Window-realm scripts. The separate
[page-owned comparison](2026-10-03-window-dom-workload.md) now completes that
measurement correction. Its unresolved batched-layout signal is the next gate,
not a speculative change to wrapper or security code.

The second isolated laptop capture completed all five fixed workloads and
stopped the native profiler, but its terminal run is **failed**: the existing
24-MiB raw-profile preservation limit rejected the 118995551-byte dump. The
original failure is retained. One separately bounded offline transfer preserved
that already-written owned file without another browser run or changing the
in-run copy limit. All 41 copied files match their remote SHA-256 values.

Offline profiler-cli analysis finds four complete same-document pass intervals.
The first pass has a measure and end marker but no start marker in either
profile-wide or unlimited thread-marker exports; it is excluded from strict
attribution. Its missing start is observed, not explained. Successful page
results alone do not prove complete profile retention.

For passes 1-4, active sampled-stack shares are consistent:

| Fixture operation, including descendants | Pass 1 | Pass 2 | Pass 3 | Pass 4 |
| --- | ---: | ---: | ---: | ---: |
| Attribute updates | 29.74% | 31.02% | 30.87% | 29.93% |
| Child append/remove | 17.13% | 17.23% | 16.79% | 16.15% |
| Attached and detached text updates | 16.85% | 16.16% | 16.73% | 16.86% |
| Both layout cases | 12.54% | 12.33% | 11.70% | 12.85% |
| Integer JS control | 4.95% | 4.43% | 4.48% | 4.86% |
| Active sample denominator | 5477 | 5280 | 5044 | 5393 |

These are inclusive fixture-function samples, not self time or fractions of
unprofiled wall time. Text and layout variants share functions and cannot be
separated by these function rows. Observer work is in anonymous callback frames;
it is not included in the named `textWork` row. Inclusive wrapper rows can nest
and must not be added into a claimed exhaustive partition.

Profiler categories put DOM at 43.4-44.1%, JavaScript at 41.9-42.0%, layout at
10.7-11.3%, and GC/CC at 2.2-2.7% of these active samples. These categories do not
identify the native functions implementing the operations. In the original
exports, between 90.8% and
92.3% of self samples have unresolved hexadecimal function names. The CLI says
`symbolicated: true`, but that is plainly not proof of complete symbol resolution.
No allocation-byte data was captured. No JIT, GC or layout engine defect, GPU
bottleneck or YouTube cause is established.

This profile is candidate-only, uses a synthetic fixed workload and has profiler
overhead. It is never pooled with the two [unprofiled comparisons](2026-10-03-page-dom-workload.md).
Those comparisons, not this diagnostic, establish the repeated bounded DOM gains.

## Explicit Profiling Artifact Policy

The earlier capture stopped at the normal 256-MiB artifact cap. After source and
resource review, tooling now offers a fixed **512-MiB profiling-only** allowance.
Normal readback, DOM comparisons, basic/cache/lifecycle modes and soak retain
their 256-MiB allowance. No background service, cache, security or profiler
preference was suppressed to reduce output.

`lifecycleArtifactLimit` admits only `standard` and `profile`; omitted means
standard. `readLifecycleResources`, `checkLifecycleCaps` and
`startLifecycleMonitor` use the trusted argument, not a value in a sampled
record. Invalid values fail before reading resources. Soak rejects the larger
policy. The shared readback driver permits it only for the explicit headless
`headless-dom-profile-attribution` workload and records the selected byte cap.
No lifecycle CLI override was added.

All other host/process/RSS/FD/thread caps, bounded rescans, evidence quotas,
single-flight sampling and poisoned-monitor behavior remain unchanged. Total
time is still 120 seconds, with 105 seconds for work and a 15-second cleanup
reserve including the final two seconds. These are sampled safety checks, not
continuous resource isolation or cancellation of every in-flight filesystem call.

Three new behavioral tests first failed as intended. Focused tests then passed
76 cases; the combined tooling gate passed 360 cases, with zero failures. Exact
four-file lint passed with no warnings or fixes. Boundary tests include exact
256/512 MiB, one-byte overflow, invalid policy before I/O, forwarding, permanent
failure latch, soak rejection and rejection of headed/other workload modes.
Only test tooling and the scratch adapter changed; no engine source, installed
browser, native build, web API or product preference changed in this step.

## Buffer Interpretation

Requested capacity is 1048576 entries. Saved native `GetBufferInfo` reports
16777216 total entries. The inspected source explains separate requested and
allocated limits: `nsProfiler::StartProfiler` passes the requested power of two,
while `ActivePS` and `ProfilerParent::ProfilerStarted` apply
`ClampToAllowedEntries`. `ProfilerBufferSize.h` defines eight bytes per entry and
a 128-MiB minimum allocation limit. This is not a measurement of immediate RSS
or a guarantee of retained coverage for every process.

Searchfox source revision: `bf9757d91e2e53b8ab836f2a08bf4c0275fdcd23`.
Relevant source: `nsProfiler::GetBufferInfo`, `ActivePS`,
`ProfilerParent::ProfilerStarted` and `ProfilerBufferSize.h`. Native files were
not edited. Search output is retained under `artifacts/umbralink-control/` with
the `profile-buffer-`, `profile-native-start-` and `profile-start-definition`
prefixes. CLI metadata separately reports `bufferCapacityBytes: 8388608`,
consistent with requested entries times eight; do not replace the observed
native buffer information with that metadata value.

## Runtime And Offline Ownership

The capture ran 2026-10-03 15:00:37.067-15:01:24.298 UTC, 47.231 seconds, on
wyatt-laptop. It used the unchanged sealed mutation-mirror candidate, BuildID
`20261003071500`, libxul SHA-256
`d00138528b1410b81405fc9533b8771a8284ec98e6968a2bce313bc2177c4231`.
The later JS controller-finalizer and request-header changes are not in it.

Native root PID250758/start5703549 and controller PID250746 were separately
checked absent on the laptop after clean owned SIGTERM. The log is 182 bytes
with zero drops. All 400 workload results pass their existing oracles. Native
profiler stop reports inactive/false. Eleven saved resource samples pass the
explicit policy; the maximum sampled artifact size is 271611691 bytes. This is
not a final directory size, continuous peak or evidence of a memory slope.

The raw dump was a regular UID1000 file at the exact owned receipt path. It was
copied with a separate 128-MiB offline transfer ceiling. No personal profile,
discovery token, shared crash queue, nested application-data or other profile
file was exported. Raw bytes were hashed, never parsed by the audit script.

One profiler-cli 0.10.0 session, `umbra-laptop-dom-20261003-offline-2`, loaded the
file with explicit `--symbol-server http://127.0.0.1:9`. Its daemon log confirms
that endpoint. It ran from 15:10:58 until approximately 15:14 UTC and was stopped
normally. Exact daemon PID1363906 and its named Unix socket were checked absent
at 15:13:59. No browser followed that analysis. The subsequent local symbol
lookup and two additional offline loads are recorded below.

## Attribution Validation

All four used intervals join content PID250909, thread `t-41` and inner window
10737418242. Every start/measure/end triple is unique and mutually consistent.
Marker timestamps are CLI-normalized; zoom/current-view ranges and root range
are raw. Root offset is **10999.255357999999 ms**. Marker-handle zooming was used;
the offline audit separately checks the conversion instead of comparing clocks
directly. The first pass is rejected for its missing start, not silently repaired.

`audit-dom-profile-exports.mjs` reads only saved CLI exports. It checks identities,
finite ordered ranges, positive complete measures, sample strategy, equal raw
contexts, untruncated function inventories, unique handles, exact root/self and
category sums. Four passes succeed and 12 deliberate corruptions reject, including
duplicate/missing boundaries, wrong document/PID/thread, NaN, mixed clocks,
truncation and corrupt sample totals. An initial mistaken expected CLI type was
corrected from `functions` to the actual `thread-functions`; its assertion log
is retained and is not represented as a production bug.

Only selected threads were recorded. The inventory contains 47 threads across
ten processes, including content/parent GeckoMain, Renderer, Compositor and
StyleThreads. Absence of a dedicated JS Helper thread is not evidence of absent
JIT work; it does not establish TaskController/helper coverage.

## Local Symbolication Follow-Up

The existing Samply 0.13.1 installation served local debug symbols to
profiler-cli 0.10.0. The debug libxul in
`obj-x86_64-pc-linux-gnu/dist/bin` and the sealed package share GNU build ID
`9be8527d27b64ed4999b502e44c55a2b`, matching captured Breakpad ID
`7D52E89BB627D44E999B502E44C55A2B0`. The saved server log confirms finding that
local libxul. No debug binary was copied, rebuilt or installed.

The same four intervals pass the original audit, including its 12 deliberate
corruption rejections. Phase, document, PID, clock, sample totals, fixture
function totals and category summaries are identical before and after
symbolication. The first incomplete interval remains excluded. Complete
function inventories contain these bounded observations:

| Observation | Pass 1 | Pass 2 | Pass 3 | Pass 4 |
| --- | ---: | ---: | ---: | ---: |
| Unresolved hexadecimal self samples | 254 | 258 | 223 | 262 |
| Unresolved share of active samples | 4.64% | 4.89% | 4.42% | 4.86% |
| `wrap` f-1740 inclusive samples | 647 | 609 | 671 | 654 |
| Same function, self samples | 66 | 42 | 48 | 64 |
| `ShouldDispatchMutation` inclusive samples | 10 | 20 | 8 | 10 |
| `__pthread_mutex_lock` inclusive samples | 86 | 76 | 69 | 67 |

The named `wrap` row includes 11.5-13.3% of active sampled stacks, but only
0.8-1.2% are its self samples. A second `wrap` row nests within caller paths:
do not add their inclusive percentages. The CLI name does not identify every
overloaded function or prove all its time is avoidable sandbox overhead.
The pass-4 filtered caller export shows `wrap`/`call`/JS invocation paths under
`attributes`. The mutex export includes attribute string allocation and reset
paths; a mutex sample alone does not establish contention or a long wait.
Trees explicitly contain truncated branches and remaining unresolved frames.
No native patch is selected from those names alone.

### Execution Realm Correction

Both the comparison driver and profiler adapter serialize `collectDOM` into
`umbrafox.script.execute`. The exact packaged
`modules/UmbrafoxControlScript.sys.mjs`, extracted in memory from `omni.ja`,
equals current source byte-for-byte, SHA-256
`7f6c3b468f688f84c940d8921ceec31daecc4062763f134a49a5344b704d1289`.
`executeControlScript` creates a sandbox with the Window as prototype, sets
`sameZoneAs: window`, and evaluates there. Setting `this` to Window does not
move the function's lexical realm into Window.

The inspected upstream producer explicitly creates a new compartment in the
existing zone for `sameZoneAs`. Its cross-compartment call wrapper wraps the
receiver, arguments and return value. This source mapping supports a harness
overhead hypothesis; it does not measure the removable fraction or explain
YouTube stutter. See the pinned [sandbox producer](https://searchfox.org/firefox-main/rev/bf9757d91e2e53b8ab836f2a08bf4c0275fdcd23/js/xpconnect/src/Sandbox.cpp#1345)
and [call wrapper](https://searchfox.org/firefox-main/rev/bf9757d91e2e53b8ab836f2a08bf4c0275fdcd23/js/src/proxy/CrossCompartmentWrapper.cpp#212).

Earlier reports calling this an ordinary page-realm workload were too broad.
The DOM objects and semantic checks are real, and both A/B batches use the
same harness, so their observed differences remain valid for that harness.
They do not establish identical gains for ordinary page-owned JavaScript.
Preserve the original data and do not pool it with a corrected fixture.

### Local Lookup And Cleanup

The symbol server used a fresh private `XDG_CACHE_HOME`, explicit loopback
address, `--no-open`, one local `--symbol-dir`, an empty inherited environment
apart from required local variables, two-thread Rayon/Tokio settings, an 8-GiB address-space
ceiling, zero core limit, 256-MiB file limit and a 240-second SIGINT watchdog.
There was no configured debuginfod, symbol download URL or inherited Windows
symbol path. This is source/configuration evidence, not a network sandbox or
packet-level no-network proof. Matching-version source review covered
[server setup and lookup](https://raw.githubusercontent.com/mstange/samply/samply-v0.13.1/samply/src/server.rs),
[CLI symbol arguments](https://raw.githubusercontent.com/mstange/samply/samply-v0.13.1/samply/src/main.rs)
and [symbol defaults](https://raw.githubusercontent.com/mstange/samply/samply-v0.13.1/wholesym/src/config.rs).

One failure is retained: Samply bound port zero but advertised zero rather
than the assigned port. The first CLI load returned without usable local
symbolication. That session was stopped. The same owned server's exact PID,
executable and listening socket inode established port 37519; only the port
in the private endpoint was corrected for a second CLI load. No server or
browser restart occurred. The successful session used that explicit loopback
endpoint. Endpoint capability strings remain in private scratch, not this report.

Samply PID1383180 stopped by SIGINT after symbolication; its controller session
returned zero. The two CLI sessions were `umbra-dom-symbols-20261003-1` and
`umbra-dom-symbols-20261003-2`. The final session was stopped normally after
export. At 15:37:21 UTC, exact daemon PIDs1383903/1386242, server PID1383180,
wrapper PID1383179, both named Unix sockets and TCP socket inode34394920 were
absent. Cleanup is not inferred from a session-list result.

## Next Gate

The [window-realm follow-up](2026-10-03-window-dom-workload.md) now completes
the execution correction and two separately reported unprofiled laptop batches.
Text improvements repeat, but batched layout is slower in both. The next gate
is that regression signal, not deployment or optimization of sandbox wrappers.
The original proposed gate below is retained as historical context; the saved
profile in this report remains a sandbox profile.

Serve the unchanged workload hot loops as a normal same-origin external script
in the owned fixture. Use UmbraLink only to trigger and retrieve its result
outside measured loops. First require a realm-identity check that rejects the
current sandbox route, exact existing operation/observer/geometry oracles,
bounded failure/abort/duplicate-start tests, and one isolated browser semantic
run. Then repeat a predeclared balanced A/B comparison on the quiet laptop,
without profiling, as a separate fixture version. Do not weaken UmbraLink's
isolation, wrappers or Firefox-visible semantics for this benchmark.

The independent hardware readback gate still needs a same-headed baseline under
separate window consent. No pending consent was inferred from the performance
goal. The owner's work browser, tabs, profile, launcher and extensions remain
untouched. No package installation, staging, commit or Pi work occurred.

## Evidence Locations

- Remote capture: `/home/wyatt/.cache/codex/dom-profile-mirror-20261003-2`.
- Remote harness: `/home/wyatt/.cache/codex/profile-budget-harness-20261003-x1V8hy`.
- Local evidence: `/home/wyatt/.cache/codex/dom-profile-mirror-evidence-20261003-2`.
- Raw receipt path under the remote root:
  `profile/umbrafox/diagnostics/profiles/dom-profile.json`.
- `artifacts/umbralink-control/profile-budget-*`: pre-edit source, RED/GREEN/full
  tests, lint, transfer/admission, remote hashes, copy audit and runtime cleanup.
- `dom-profile-runtime-2.log`: retained export-limit failure.
- `profile-offline-*`: CLI exports, daemon identity/log/stop/absence, phase audit.
- `audit-dom-profile-exports.mjs`: reproducible saved-export checks.
- `profile-followup.sha256`: current tooling, audit and supporting evidence seal.
- Local-symbol exports, logs, source excerpts and exact cleanup:
  `/home/wyatt/.cache/codex/dom-symbols-20261003-4SQS4U`.
- The audit accepts an optional absolute export prefix; its default invocation
  still reproduces the earlier audit output byte-for-byte. The local-symbol
  invocation uses that directory with a trailing slash.
- `audit-dom-symbols.mjs` reproduces the native rows and crosschecks unchanged
  phase summaries, exact library identity, filtered tree totals and saved
  cleanup. Two invalid prefix/argument cases reject before reading exports.
  Exact documentation lint reports zero problems. No Sphinx documentation tree
  or production source was changed, so no browser build or full suite was run.
- `profile-symbol-followup.sha256` seals the changed audit, current report and
  supporting local-symbol evidence. The older seal and unresolved exports are
  retained as historical evidence, not silently regenerated.
