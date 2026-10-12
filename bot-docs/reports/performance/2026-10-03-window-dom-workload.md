# Window-Realm DOM Workload

## Scope

This corrects the execution-realm limitation found in the
[symbolized profile](2026-10-03-dom-profile.md#execution-realm-correction).
The old collector executed in UmbraLink's page-principal sandbox, while the DOM
objects belonged to the Window. The new fixture serves the unchanged collector
as a normal external same-origin script. No browser implementation, security
boundary, preference, installed package or owner tab was changed.

The two historical sandbox comparisons remain valid for that harness. Their
results are not pooled with this fixture version, and no reduction between
old and new harness timings is claimed as a browser optimization.

## Contract And Verification

`createDOMServer(signal, "window")` adds a fixed `/workload.js` asset and a
hidden start button/result node outside the measured root. CSP permits only
the owned external script, without eval or inline-script permission. The
default `sandbox` fixture still produces identical metadata and hashes, apart
from its ephemeral origin, compared with the preserved profile fixture.

`installDOMWindow` captures the collector in a lexical closure. Its receipt
checks `globalThis === window`, ordinary object/function prototypes against
the Window's intrinsics, and the collector's async-function prototype against
the local async-function prototype. `requestDOMWindow` executes in the control
sandbox, attaches a bounded completion listener, triggers the page-owned
listener once, and reads the completed JSON. It does not serialize the measured
loops into the control sandbox. Result delivery is outside the measured loops.

The existing collector is byte-for-byte unchanged, SHA-256
`ff39082ff809099170529acafe3e9f71ff554265405d95dd71121894df45da65`.
All eight cases, operation counts, two warmups/eight trials, ordering, clock
precision, mutation-observer records, checksums and layout geometry remain
unchanged. The new result envelope is version 2 with an exact realm receipt and
the existing version-1 measurement inside. Its validator rejects legacy results
and incorrect/missing realm fields. The capture mode is
`headless-dom-window-workload`; reports record fixture version 2 and execution
`window`. New comparison scripts reject legacy batches before writing output.

Duplicate starts during execution latch failure; late collector completion
cannot replace an unload failure. Received results are capped at 262144 UTF-16
code units, within the existing 1-MiB control result ceiling. Error text is
bounded to 4096 code units. The bridge waits at most 58 seconds, within the
60-second script/62-second driver wait and existing 105/120-second work/total
budget. Timeout is a bound on waiting, not preemption of synchronous JavaScript.
Owned-browser cleanup remains responsible for a stalled or unloaded document.
No retry or weaker admission follows a failure.

The server retains 16 requests, eight connections and three-second socket/
request deadlines; its metadata accounts for the larger static script in the
maximum response-byte calculation. The 256-MiB artifact cap, process/resource
checks, fresh private profile/application-data roots and cleanup reserves are
unchanged. Browser globals and APIs outside this explicit owned test page are
untouched.

Verification: 16 focused and 364 combined tooling tests pass; scoped four-file
lint reports zero problems. Tests cover foreign realms/collectors, collector
failure, oversized/malformed results, duplicate starts, unload/late completion,
timeout, listener/timer cleanup, wrong document/context, raw-result preservation,
RPC failures and all prior operation-count/oracle tests. Initial evidence has
one behavioral fixture failure plus five missing-export failures; the separate
versioned capture test also failed before its implementation. A mock Window
missing event methods and an overly broad numeric source assertion were test
corrections, not browser defects. Logs retain those intermediate failures.

Four invalid comparison arguments and rejection of an old version-1 batch pass.
The old saved analysis remained byte-identical. Source, fixture and package
hashes are checked before runtime. No new compilation or profiler was used.

## Real Browser Semantic Gate

The isolated candidate check on wyatt-laptop ran 16:00:54.901-16:01:10.992 UTC,
2026-10-03. All 80 samples passed. Context 10/document 10737418242 joined the
identity and result receipts. All four collector realm checks were true;
the control transport's `globalThis === window` check was false. Thus the
actual browser distinguishes the new collector route from the old transport
realm rather than relying only on a Node VM model.

Exactly two successful fixture GETs were recorded: the 372-byte HTML and
7356-byte script. Native userland-active/profiler boundaries were false.
Six saved resource samples passed their existing caps. The browser log was
182 bytes with zero drops; cleanup used owned SIGTERM. Browser PID270063 and
controller PID270051 were checked absent on the laptop after completion.
This run is a semantic gate, not part of the timed comparison.

## Timed Comparison

The first predeclared sequence was A B B A A B B A, with eight fresh browser
processes and four processes per unchanged sealed build. A separate reversed
sequence B A A B B A A B used the same contract. The candidate and baseline are
the same packages used in the earlier comparisons; identical BuildID alone
does not distinguish them. Their libxul hashes remain:

- A: `82faf41661bd92231acfaff88da1598f403f63c0a399f9dbd008cb724524b61b`.
- B: `d00138528b1410b81405fc9533b8771a8284ec98e6968a2bce313bc2177c4231`.

Both batches completed and passed saved-data acceptance. The first ran
16:04:16.649-16:06:28.315 UTC; the reverse ran 16:09:27.978-16:11:41.256 UTC.
Each has 640 valid samples, 48 resource observations within unchanged caps,
clean owned SIGTERM cleanup and zero browser-log drops. Exact browser-root
and controller absence was checked on the laptop, not inferred from a local
PID lookup. The first batch's 235 and reverse batch's 243 whitelisted evidence
files were copied and SHA-256 verified locally. No profile, application-data
or discovery-token files were included in those exports.

The following are medians of four independent process medians per build, in
milliseconds. The eight trials within each process are not independent
replicates. Positive reduction means lower candidate time; negative means
higher. Batches are reported separately, without pooling.

| Case | First A | First B | Reduction | Reverse A | Reverse B | Reduction |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Detached text | 26.75 | 21.00 | 21.5% | 29.00 | 21.00 | 27.6% |
| Attached text | 32.00 | 26.75 | 16.4% | 32.50 | 27.00 | 16.9% |
| Attributes | 104.00 | 97.75 | 6.0% | 107.50 | 100.75 | 6.3% |
| Child list | 53.50 | 49.25 | 7.9% | 57.25 | 47.50 | 17.0% |
| Observer text | 36.50 | 37.25 | -2.1% | 40.75 | 39.50 | 3.1% |
| Batched layout | 14.00 | 16.50 | -17.9% | 15.25 | 16.75 | -9.8% |
| Interleaved layout | 49.75 | 47.25 | 5.0% | 50.25 | 49.00 | 2.5% |
| JavaScript control | 26.25 | 24.25 | 7.6% | 25.50 | 27.25 | -6.9% |

Detached text has nonoverlapping A/B process ranges in both batches. Attached
text and child list have nonoverlapping ranges only in the reverse batch;
attributes overlap in both. Observer and JavaScript controls change direction.
Batched layout is slower in both, with overlapping ranges: this is an
unresolved regression signal, not an established causal regression or noise
that can be discarded. No statistical significance or universal page speedup
is claimed. Compiler admission is checked before each run; continuous host
exclusivity, CPU frequency and thermal state were not controlled. Maximum
sampled artifact sizes were 188016234 and 188136151 bytes, respectively, below
256 MiB; these are not peak/final size or memory-slope measurements.

The drivers retained the 360-second outer watchdog plus per-run limits and
compiler admission. The reverse driver differs only in its fixed sequence and
its own provenance filename. No profiler ran during either timing batch. All
17 browsers including the semantic gate completed; no browser, comparison,
profiler, server or transfer from this follow-up remains running.

## Next Gate

The subsequent [isolated-layout follow-up](2026-10-03-isolated-layout.md) now
completes two longer-warmup, layout-only batches. Candidate medians are 3.3%
higher and equal, respectively, not a reproduction of the larger mixed signal.
That does not clear this report's observation or identify a cause. Page-owned
mixed-workload attribution is next; the rationale below remains relevant.

Saved trial/order checks find the layout candidate slower in three of four
adjacent A/B pairs in each batch. However, splitting each process into its first
and last four trials changes the picture. Median early/late process-half times
are A 13.00/14.50 versus B 17.00/14.25 ms in the first batch, and A 12.50/16.75
versus B 15.00/16.75 ms in the reverse. Thus the aggregate gap is not a uniform
per-trial penalty. Trial index and case position rotate together, so those
saved observations cannot independently identify warmup, order, scheduling,
GC/JIT or layout work. They neither clear the signal nor prove its mechanism.
The derived values and all underlying trial rows are retained in
`artifacts/umbralink-control/dom-window-layout-order.json`.

Keep the candidate uninstalled while investigating the repeated batched-layout
signal. The next useful experiment separates the layout case and its warmup
from the mixed workload, with a separately versioned bounded fixture and
predeclared comparisons. Page-owned profiling can then attribute a persistent
gap; it must not be used as an unprofiled speed estimate. Retain exact geometry
and observer oracles, fresh roots,
balanced build ordering and the existing cleanup/resource limits. Do not reuse
the legacy `profile-dom.mjs` as ordinary-page attribution: it still executes
the collector in the sandbox. Profiling must remain separate from unprofiled
timing, and a faster mutation case does not justify a layout regression.

## Evidence

- Remote harness: `/home/wyatt/.cache/codex/dom-window-harness-20261003-yFN1pq`.
- Semantic run: `/home/wyatt/.cache/codex/dom-window-semantic-20261003-1`.
- Remote comparisons: `/home/wyatt/.cache/codex/dom-window-comparison-20261003-c9ZMDL`
  and `/home/wyatt/.cache/codex/dom-window-comparison-20261003-GhWGHd`.
- Local comparison exports: `/home/wyatt/.cache/codex/laptop-window-dom-evidence-20261003-c9ZMDL`
  and `/home/wyatt/.cache/codex/laptop-window-dom-evidence-20261003-GhWGHd`.
- Local semantic export: `/home/wyatt/.cache/codex/laptop-window-dom-semantic-evidence-20261003-1`.
- Local tests, hashes and command logs: `artifacts/umbralink-control/dom-window-*`.
- Separate scratch drivers/analyzer/audit: `compare-window-dom.mjs`,
  `compare-window-dom-reverse.mjs`,
  `analyze-window-dom.mjs`, `audit-laptop-window-dom.mjs` in that artifact directory.
- Final source/test/report/log and copied evidence-manifest seal:
  `artifacts/umbralink-control/dom-window-final.sha256`.

The owner's work browser remains untouched. The independent hardware readback
baseline still needs separate headed-window consent. No installation, staging,
commit, Pi action, YouTube attribution or broad engine-completion claim follows.
