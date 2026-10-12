# Render-Pass Label Cost

## Decision And Scope

The fixed playback comparison found candidate CPU 6.05% above the combined
baseline, but substantial baseline variation and two processes per build do
not establish cause. Do not promote that candidate, alter GPU defaults, disable
markers or PHC, or repeat playback until a desired result appears.

Next is a bounded, actual-source Rust experiment. No production source, package,
browser, profile, remote installation or public interface changes in this phase.
Scratch files live in artifacts/umbralink-control/marker-cost. Existing source,
playback results and packages remain pinned. A standalone system allocator and
fake backend cannot measure PHC, real driver, browser or GPU cost.

## Territory And Test Review

What changes? Only a measurement adapter, tests and documentation. Its producer
is the exact frozen original query module and renderer call, versus the current
query module and renderer call. GpuProfiler consumes an Rc backend; GpuMarker
must preserve one supported push and one pop, including lifetime and unwinding.
The new helper is used by the renderer's render-pass loop. Timer, static-marker
and event-marker routes are unchanged and retain the existing unit tests.

What is the hypothesis? The new stack-buffer helper might increase ordinary
label-generation cost even though it eliminates heap allocation. Direct
measurements can support or falsify that explanation for the helper, but cannot
explain a whole-browser CPU difference or an isolated long stall by themselves.

Tests before timing:

- Original and current labels match format!("pass {}") for all 0..2048 values,
  every decimal-width boundary and usize extremes; callbacks remain balanced.
- Supported and unsupported cases preserve semantics. Existing retained tests
  cover nesting, unwinding and backend lifetime. A changing backend-support
  response must not be cached between calls.
- Optimized timed loops must use a runtime-selected opaque trait backend,
  black-box index and observable checksums/counters. Inlined and non-inlined
  call variants remain separate. Incorrect counts or output reject timing.
- A supplied-data analyzer rejects missing/duplicate rounds, invalid timings,
  changed workload/order, wrong source hashes and inconsistent counters. It
  reports every sample, not a selected best result.

Unit checks add label/lifecycle confidence; source-region comparison verifies
the actual call and frozen inputs. Existing browser comparisons remain the
integration evidence. Manual impression, new end-to-end runs and GPU screenshots
cannot improve this narrow CPU attribution and are not part of this phase.

## Fixed Measurement

Use the configured Rust compiler, optimized release code, one compiler job,
fixed 1,000,000-call batches, 20,000-call warmups and four ABBA/BAAB blocks per
backend/call configuration. Measure small indices 0..15 and an extreme-index
control separately. Print nanoseconds, counters and checksum per batch after
the timed section. No allocator counter in timed builds. Structural/allocation
tests run in a separate binary; the ordinary fake backend never allocates.

One compile may take up to 30 seconds. Each test/benchmark process has a
30-second SIGTERM bound; overall local driver has 120 seconds. Preserve failed
logs, detect incomplete output, and do not rerun a completed measurement based
on its sign. Do not change compiler optimization flags or benchmark inputs after
examining results without recording a separate experiment.

First run on the desktop as a mechanism check; if host activity prevents useful
timing, retain it as inconclusive and move the identical pinned executable to
the authorized quiet laptop only with the normal bounded identity preflight.
No browser is needed. Codegen observations distinguish fake-backend measurements
from the deployed render-loop assembly. No new claim of general performance
acceptance, exact browser overhead or fixed stutter follows from this probe.
