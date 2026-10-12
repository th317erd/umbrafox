# Page-Owned Mixed Workload Profile

## Result

The next attribution gate from the [isolated-layout experiment](2026-10-03-isolated-layout.md)
completed on wyatt-laptop using the existing, uninstalled mutation-mirror
candidate. Both a profiler-OFF instrumented control and a profiler-ON capture
passed all 80 samples in the actual page Window realm. No production/native
source, public interface, browser package or owner browser changed.

All 243 UserTiming markers form 81 complete triplets in one document and one
content main thread. The profile contains 1664 active main-thread samples in
the complete pass. DOM work accounts for 1112, layout for 296, JavaScript for
213 and GC/CC for 26. This is a synthetic, headless CPU workload, not a YouTube,
GPU presentation or production bottleneck measurement.

The batched-layout case has only 66 active samples across ten invocations,
including warmups. Its samples are principally layout/style work, and no
exported GC/CC interval intersects any of those invocations. This rules out
those recorded intervals as coincident pauses in this particular capture; it
does not explain or clear the earlier unprofiled A/B timing difference.

## Harness And Verification

New `profile-workload.mjs` derives an instrumented copy of `collectDOM` using
Acorn and an exact source hash. Only its awaited per-case call is replaced;
the original functions, loops, checksums, iteration counts and case order are
unchanged. A reverse-replacement test verifies that boundary. The page loads
the collector through its same-origin external script, with four realm checks.
The existing control sandbox only transports the command and result.

Fixture version 4, workload `mixed-profile`, adds a pass interval and 80 case
intervals, each with start/end marks and a measure. These intervals include
setup, cleanup and asynchronous wrapper overhead. They are deliberately NOT
the same scope as each original inner `durationMs`. Wrappers and marks can
also affect optimization; do not pool these results with uninstrumented runs.
The legacy mixed sandbox/window and isolated-layout fixture metadata and asset
hashes remain unchanged apart from their ephemeral origins.

`profile-capture.mjs` runs exactly one pass, with separate explicit ON/OFF
modes. ON requests a 2-ms interval, 1048576 entries, stackwalk, JS, process CPU
and no marker stacks; selected threads are GeckoMain, JS Helper, StyleThread,
Compositor and Renderer. It awaits StartProfiler and one periodic-sampling
barrier before invoking the workload. The upstream barrier waits for the
parent sample, then child promises, but does not establish successful sampling
by every child. Complete phase markers are the observed coverage evidence.
See the [sampling barrier implementation](https://searchfox.org/firefox-main/rev/bf9757d91e2e53b8ab836f2a08bf4c0275fdcd23/tools/profiler/gecko/nsProfiler.cpp#225-291).

The requested entry capacity is not the actual allocation: native snapshots
report buffer `totalSize=16777216` and generation zero. CLI metadata's
`bufferCapacityBytes=8388608` reflects requested metadata, not independent
actual-allocation proof. No buffer cap was increased to obtain this capture.

The existing 105/120-second work/total bounds, native-root admission, fresh
profile and child-only fresh application-data roots, resource monitoring and
owned cleanup remain. ON uses the existing 512-MiB profile artifact policy;
OFF uses the 256-MiB standard policy. The raw profile preservation copy is
limited to 24 MiB, outside the JSON writer quota but inside the sampled artifact
cap. No raw-profile parsing is performed by the harness or analysis scripts.

Failing-first fixture/adapter tests and retained failures precede acceptance.
Final combined tooling: **386 tests pass**, exact six-file registered lint:
zero errors/warnings/fixes. Tests cover marker failures, repeated start,
realm/identity/configuration errors, every RPC/save/preservation failure,
cleanup ownership, profile-copy limits and the shared sixth-argument signal
contract. An additional saved-export audit passes four groups, including ten
marker corruptions, six function/filter/clock corruptions and overlap edges.
No Sphinx build is needed for this agent-only report, outside the documentation
build tree; local links and whitespace are checked separately.

## Runtime Receipts

Candidate BuildID: `20261003071500`; libxul SHA-256:
`d00138528b1410b81405fc9533b8771a8284ec98e6968a2bce313bc2177c4231`.
The shared remote harness suffix is `window-profile-harness-20261003-GC8CEH`.
All 18 transferred harness/dependency hashes were checked before and after.

| Mode | UTC start/end on October 3 | Controller/browser PID | Samples | Workload ms | Maximum sampled artifact bytes |
| --- | --- | --- | ---: | ---: | ---: |
| OFF control | 17:21:30.870 / 17:21:46.870 | 328483 / 328497 | 80 | 4604 | 153571140 |
| ON capture | 17:23:58.289 / 17:24:15.640 | 332019 / 332033 | 80 | 4897 | 220693961 |

Each run has six resource observations within caps, clean owned SIGTERM,
182 browser-log bytes and zero drops. Both roots and controllers were checked
absent on the laptop. Context 10/document 10737418242 and all four collector
realm checks pass. The control transport remains a sandbox, as intended.

The raw ON copy is 16315487 bytes, SHA-256
`c97fa33719ab96563cc2b05edbad60c223268cfd26260bafe8e30655585136f1`.
Thirty-one control and 35 capture direct evidence files were transferred and
hash-verified; private profile/application-data contents were not exported.
Driver receipts were copied separately and verified against remote SHA-256.

### Observer Limits

One fixed OFF run precedes one ON run. Total workload time is 6.4% higher ON,
but run order, host activity, JIT/warmup and profiler overhead are confounded.
These are descriptive observations, not a calibrated overhead estimate.
Both runs still contain page markers, so this is not a marker-free control.

| Case | OFF trial median ms | ON trial median ms |
| --- | ---: | ---: |
| Detached text | 18.5 | 23 |
| Attached text | 24 | 25.5 |
| Attributes | 96 | 97 |
| Child list | 42.5 | 49.5 |
| Observer text | 31.5 | 34 |
| Batched layout | 10 | 11 |
| Interleaved layout | 45.5 | 48.5 |
| JavaScript | 23 | 26.5 |

## Offline Attribution

Only profiler-cli loads/parses the raw profile. Local Samply 0.13.1 supplies
symbols from the exact matching local libxul GNU build ID
`9be8527d27b64ed4999b502e44c55a2b`. The server uses
an owned cache, explicit loopback endpoint, no-open, an 8-GiB address-space
limit and 300-second SIGINT deadline. This is not a network sandbox guarantee.

CLI output selects thread `t-41`, content PID332190. Both native before/after
snapshots identify that PID with the exact fixture URL and outer window 20.
Every UserTiming marker carries the receipt's inner document 10737418242.
The process/window projection itself has no inner-document field, so that join
comes from the page receipt and marker data, not a fabricated snapshot field.

CLI marker times are normalized; `context.rootRange` remains raw:
`[10994.656358, 16741.300505000003]` ms. The pass is normalized
`[833.367224875, 5730.583501875]`, or raw
`[11828.023582875, 16725.239859875]`, duration 4897.216277 ms.
Every start/measure/end join is checked exactly within floating-point tolerance.
Relative page-receipt boundaries differ by at most 1.760739 ms; page clocks
retain their normal reduced precision. No raw epoch equality is asserted.

All nine function inventories reconcile their self-sample sums, root totals
and category totals, with complete non-truncated function counts. Functions
are inclusive unless specifically called self; nested rows cannot be summed.
Eighty self samples (4.8%) still have address-only names. Some native names
lack class qualification, which limits exact source attribution.

| Scope, including warmups and case setup/cleanup | Active samples | Largest category |
| --- | ---: | --- |
| Whole pass | 1664 | DOM 1112 |
| Detached text | 113 | DOM 101 |
| Attached text | 137 | DOM 118 |
| Attributes | 496 | DOM 474 |
| Child list | 255 | DOM 239 |
| Observer text | 181 | DOM 158 |
| Batched layout | 66 | Layout 53 |
| Interleaved layout | 251 | Layout 230 |
| JavaScript | 131 | JavaScript/Ion 131 |

The case scopes sum to 1630 samples; the remaining 34 lie in other portions
of the pass. Attribute work is the largest selected case, but its larger
workload/cost does not establish a regression or an avoidable fraction.
Mutex symbols are sampled, including 18 lock and 16 unlock self samples in
attributes; names alone do not establish waiting, contention or ownership.
`RemoveScriptBlocker` has 35 self/43 inclusive samples across the whole pass.
Its [upstream implementation](https://searchfox.org/firefox-main/rev/bf9757d91e2e53b8ab836f2a08bf4c0275fdcd23/dom/base/nsContentUtils.cpp#7744-7785)
decrements a nesting counter and may execute deferred script runners. It is
not evidence of a network interception delay or permission to remove guards.

The Umbrafox mutation-dispatch gate is 5 self/7 inclusive samples (0.30%/0.42%)
of the pass. No function named exactly `wrap`, the earlier sandbox-profile
lead, appears in this inventory. That bounded absence is not proof of no
wrapping or a causal before/after measurement; workloads, durations and
profiling runs differ, and some symbols remain unresolved.

### GC And Layout

The complete saved broad-GC query includes unrelated names; analysis uses exact
marker names rather than treating every substring match as GC. Observed:

- 121 GCMinor intervals total 4.086962 ms, maximum 0.412188 ms.
- Five GCSlice intervals total 1.019384 ms, maximum 0.741975 ms.
- Two CCSlice intervals total 16.721490 ms, maximum 8.465221 ms.
- Six ForgetSkippable intervals total 10.690268 ms, maximum 5.516483 ms.
- GCMajor spans 59.735526 ms and CC spans 36.685423 ms. These enclose incremental
  work and must not be reported as single stop-the-world pauses or added to
  their constituent slice times.

None of these intervals intersects a batched-layout case in this capture.
The aggregate layout export records 21199 DoFlushPendingNotifications and
Styles intervals, and 21140 synchronous reflows. These nested populations are
not additive CPU time. The top-ten summary is not a complete layout interval
inventory and cannot support per-case layout-marker partitioning.

## Retained Tooling Failures And Cleanup

1. First named CLI load succeeded but returned prose despite `--json`; parsing
   that response failed. Its daemon was stopped successfully. No numeric PID
   was retained before that failure; only its named socket absence is proved.
2. The next export exceeded the 32-MiB command-output bound when requesting all
   layout intervals. Its 33619968-byte partial file is INVALID JSON and unused.
   The successful replacement exports a bounded layout summary, not a silently
   truncated complete inventory. Both sessions stopped; no browser was rerun.
3. A separate saved-profile filter check found bare `js` also matches workload
   filenames and JIT marker text. That assertion failure is preserved. Seven
   other filters matched exactly their 30 intended entries. The correction
   uses `-js`, verifies exactly 30 intended UserTiming entries, and re-exports
   JS samples/functions. Its 131 samples are numerically unchanged, but the
   narrower query is the accepted attribution source.

Successful symbolized export is `exports-3`; corrected filter proof is
`filter-check-2`. The filter-only loads use explicit `http://127.0.0.1:9` and
do not need native symbols. No custom raw-profile parser or browser retry.

Samply PID1545113 exited with status124 at its 300-second SIGINT deadline.
A later manual stop attempt found ENOENT and sent no signal. Exact PID absence
and port37520 no longer listening were verified. CLI daemon PIDs1547974,
1549122,1556582,1557549 and their named sockets are absent; every owned CLI
stop returned zero. First-session numeric PID absence remains unavailable.
All test, capture, export, server and transfer commands are complete.

## Next Decision

This capture provides a reliable page-owned attribution path, not a sufficient
basis for a new rendering-engine patch. The next falsifier is the same bounded
capture on baseline A, followed by a candidate repetition with the same marker
scope and separate profiler-OFF controls. Baseline symbol availability must be
checked first; do not silently symbolize A with B's libxul. Compare early/late
case populations and native callers, retaining all observations, rather than
optimizing an ambiguous mutex or GC label. Current small batched-layout sample
counts limit fine attribution; any larger capture needs a separately justified
plan within existing bounds, not an automatic cap increase.

No GPU acceleration claim follows from a headless main-thread workload. The
independent headed readback baseline still needs explicit window consent.
The candidate remains uninstalled and the owner's active browser untouched.

## Evidence Locations

- Remote control/capture: `~/.cache/codex/window-profile-20261003-{control,capture}-1` on wyatt-laptop.
- Local direct exports: `~/.cache/codex/laptop-window-profile-{control,capture}-evidence-20261003-1`.
- Offline scratch: `~/.cache/codex/window-profile-analysis-20261003-R0oL5o`.
- Accepted derived summary: scratch `analysis.json`; complete command receipts,
  input hashes, failed exports and cleanup evidence remain beside it.
- Harness/source/test/runtime logs and audit scripts:
  `artifacts/umbralink-control/window-profile-*`, `analyze-window-profile.mjs`,
  `export-window-profile.mjs`, `check-window-profile-filters.mjs`, and
  `test/window-profile-analysis-spec.mjs`.
- Final seal: `artifacts/umbralink-control/window-profile-final.sha256`.
