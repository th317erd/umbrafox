# Renderer Label CPU Cost

## Result And Decision

The isolated helper does not reproduce the preceding playback CPU increase.
On both the desktop and quiet laptop, the current allocation-free helper has
lower median cost in every measured configuration. This narrows the ordinary
label-generation hypothesis; it does not exonerate full render-loop codegen or
explain the candidate's previously observed 6.05% higher playback CPU.

No product source, browser package, driver, preference, installed browser,
profile or page-facing behavior changed. The allocation-free candidate remains
uninstalled, experimental GPU import remains default OFF, and the full
performance objective is open. Do not rewrite the earlier unfavorable result
or infer that the rare renderer stall is fixed.

## Measurements

Nanoseconds per marker call, median of eight million-call batches for each
variant/configuration. Small indices cycle through 0..15. Extreme controls
include decimal boundaries and usize::MAX. Each host ran the identical executable
once, with four alternating ABBA/BAAB blocks per configuration. Results from the
two hosts are not pooled.

| Host and mode | Original | Current |
| --- | ---: | ---: |
| Desktop, supported, inline wrapper, small indices | 46.57 | 45.09 |
| Desktop, supported, separate wrapper, small indices | 57.45 | 49.99 |
| Desktop, unsupported, inline wrapper, small indices | 45.09 | 3.05 |
| Desktop, unsupported, separate wrapper, small indices | 52.05 | 3.34 |
| Laptop, supported, inline wrapper, small indices | 34.26 | 29.75 |
| Laptop, supported, separate wrapper, small indices | 36.20 | 29.74 |
| Laptop, unsupported, inline wrapper, small indices | 33.39 | 2.33 |
| Laptop, unsupported, separate wrapper, small indices | 34.73 | 2.38 |

Laptop supported extreme-index medians are 37.98/38.80 ns originally and
30.69/30.16 ns currently. All raw samples and all eight configurations per host
remain in results.json and the raw outputs. These are per-call batched wall
times, not CPU-cycle counters, independent process populations, or frame times.
The small desktop supported-inline difference is not a statistically established
speedup. No performance threshold was used to select or repeat a run.

Desktop: Ryzen 7 3700X, Linux 7.0.0-34-generic, 16 logical CPUs, initial load
3.19/3.54/3.53. Its single process finished in 5.461 seconds. Laptop: i7-1360P,
Linux 7.0.0-38-generic, 16 logical CPUs, initial load 0.02/0.08/0.14. Its process
finished in 3.444 seconds. No affinity, governor, frequency or thermal controls
were changed; hybrid-core placement and scheduling remain limitations.

## What Was Tested

The generator verifies the saved original query module/renderer call against
the previous RED receipt and the current module/call against the GREEN receipt.
It compiles both complete query modules into one executable, with identical
fake frame/tag types and identical nonallocating backends. No rewriting of the
production label helper occurs. Each measured call consumes a black-box index
and opaque trait backend; observed push/pop counts and label-dependent checksum
must match for every batch. Twenty thousand warmup calls precede each timed
million-call batch. Printing and setup stay outside the timed section.

The configured Rust 1.94.0 compiler uses opt-level=2 and one codegen unit. This
is not the browser's whole-program build or allocator: the timed executable uses
the system allocator, no PHC, no actual GL backend and no concurrent renderer.
It measures formatting and fake dispatch, not driver, GPU, lock contention or
rare allocation stack-walk cost. A separate test executable enables allocation
counting; timed code contains no counting allocator. Frame/tag stand-ins are not
a substitute for the earlier successful full WebRender browser build.

Nine Rust tests pass, including all five retained production marker tests and
four new controls. Exact labels pass for 0..2048, every representable power-of-ten
boundary, and usize extremes. Support changes before/after group creation still
give matching pushes and pops. Nested markers, unwinding and backend lifetime
remain covered. The same ten-index allocation control reproduces 12 original
allocator calls versus zero current calls in both supported/unsupported modes.

The optimized assembly retains general core formatting and a UTF-8 check in
the current supported path. It has no format_inner allocation call there. The
original separated call retains format_inner. An inline wrapper still calls the
current helper out of line in this executable, so its label is not a claim that
the helper itself was inlined. Actual packaged render-loop assembly was not
compared here; do not infer register pressure or browser code placement from
this synthetic compilation.

## Evidence And Safety

Evidence: artifacts/umbralink-control/marker-cost/. The executable is 3998744
bytes, SHA256 f26ca493d482be897bf3f23a63700d1b88fc2b92aac1476257515496c8c3503b.
The same bytes are verified before and after each host's run. The laptop runner
also verifies itself, the new canonical 0700 directory and exact membership.
It creates an exclusive started receipt to refuse accidental repeats, preserves
stdout/stderr and terminal status, and requires the exact child PID absent.

Laptops use only the new owned directory
/home/wyatt/.cache/codex/render-label-cost-20261006-nTxfZT.
The native probe does not fork, launch a browser, initialize Gecko or access a
profile. Its 30-second child timeout sits inside a 35-second remote Node bound
and 40-second SSH bound. PID 1719132 is absent in the terminal receipt. The
desktop child PID is 2690870; both runs exit zero. Transfer and compilation
sessions also terminated. There were no profile-daemon or browser operations.

The compiler warns once that multiple output types adapt the -o filename; both
the binary and assembly are explicitly present and hashed. The expected unwind
test prints its caught panic. Neither is hidden as warning-free execution.
The missing-analyzer-module RED is scaffolding, not a new production bug. No
failed native test or timing run occurred in this phase.

Pure replay validates every source/binary hash, every sample/order/counter,
timing receipt, exact remote executable/root/runner, and the saved distributions.
Corruption tests reject partial/reordered data, invalid durations, wrong counters,
wrong host/binary/root and missing cleanup. It explicitly leaves browser
performance and the earlier CPU increase unproven.

Final checks: nine Rust tests and eight strict Node replay/validation groups
pass. Scoped documentation lint has zero problems; explicit formatting checks
cover the new offline analyzer/replay/spec files. Executed probe templates and
the remote runner remain byte-identical to their recorded inputs. All 63
production source pins, 146 prior harness inputs, HEAD, staged/working patches
and configuration still match. Desktop PID 2690870 was independently absent;
all compiler, transfer, test and lint commands are terminal. Diff whitespace
checks and the preceding 1005-file evidence seal pass again.

Final phase seal: artifacts/umbralink-control/marker-cost-final.sha256. It covers
this report, the new plan and completed evidence namespace, excluding mutable
continuity notes and its own verification log. Future work must use a new
namespace and retain both the browser CPU observation and these microbenchmarks.

The prior render-pass milestone is now sealed: 1005 files, 631530571 bytes,
manifest SHA256 b4e6a807f1791fc49fffc38be321e274ef8df1f4f8f87e59648ba4228b2ac6ab,
at artifacts/umbralink-control/render-pass-final.sha256. This includes all failed
and successful observations, not only passing tests. The current phase does not
edit those files. The dirty/staged product tree and owner installations remain
unchanged.

## Next Gate

Do not add another formatter optimization based on the whole-browser CPU signal:
ordinary helper cost did not reproduce it. Next inspect the actual matched
render-loop code generation and the existing PHC/profiler sampling interaction,
keeping the whole-process coverage gap and the single sampled allocation stack
explicit. Default-OFF/pixel checks for the newest marker package remain separate
acceptance gates. No new browser recording is justified solely by this probe.
