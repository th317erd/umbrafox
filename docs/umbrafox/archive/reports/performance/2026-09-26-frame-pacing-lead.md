# Frame-pacing lead

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

Received from l8ros at 2026-09-27 00:09 UTC (2026-09-26 local date), at Wyatt's
request. Receipt was acknowledged in the performance coordination DB and
directly to l8ros. This records prioritization only, not a new source, build,
probe, runtime or Pi assignment. Prototype owner-selected ON/logging OFF remains
unchanged; official source default remains OFF.

## Sources checked

- [The Elusive Frame Timing](https://medium.com/@alen.ladavac/the-elusive-frame-timing-168f899aec92),
  Alen Ladavac, Croteam, 2018: animation steps inferred from CPU frame intervals
  can mismatch display timing despite sustained frame delivery. The fixed-step
  experiment is diagnostic, not a general solution. Its historical API coverage
  is not evidence of current support in our installed stack.
- [Improving frame timing accuracy in Mesa, DRM and X](https://lpc.events/event/5/contributions/326/),
  Keith Packard, Valve, 2019: distinguishes GPU rendering duration, actual display
  time and presentation overhead. These are separate quantities to measure.
- [Ensuring steady frame rates with GPU-intensive clients](https://blogs.gnome.org/shell-dev/2023/03/30/ensuring-steady-frame-rates-with-gpu-intensive-clients/),
  Michel Danzer, 2023: unfinished client buffers can delay compositor output.
  Mutter's repair stages readiness while preserving atomic surface state. This
  neither proves a Cage/wlroots defect nor recommends a compositor replacement.

Parent checked these three primary sources. The fuller l8ros research handoff,
including additional protocol and media references, is preserved privately at
`/home/wyatt/.cache/codex/umbra-perf-20260926/frame-pacing-research-2026-09-26.md`.
That handoff is not an implementation trace for the deployed browser/compositors.

## Bounded next check

PERF-011 now prioritizes an existing-evidence source audit alongside PERF-003:

1. Establish exact installed browser/compositor revisions and trace presentation
   feedback through Umbrafox, nested Cage, outer Cage/wlroots and DRM. Identify
   which layer's output a timestamp actually describes; an inner presentation
   event does not by itself establish physical scanout time.
2. Map frame callbacks and predictions separately from GPU-ready, commit,
   compositor selection and realized presentation. Record clock IDs, epochs,
   conversions, units, uncertainty, sequence IDs and discarded/missing feedback.
   Do not equate unrelated frame counters or assume a cross-layer join exists.
3. Identify the cheapest existing markers/logs that could correlate one repeatable
   stall. Return missing fields explicitly before designing new instrumentation.
   Any future capture needs its own bounded lifecycle and observer-cost control.

Discriminators for a later authorized measurement:

| Observation with a valid join | Next hypothesis | Required caution |
| --- | --- | --- |
| Buffer already late when GPU-ready | Decode, copy, synchronization or GPU contention | Submission time alone does not establish readiness |
| Buffer ready in time but displayed late | Queueing, compositor scheduling or presentation | Establish the actual deadline and both compositor layers |
| Regular presentation but motion steps uneven | Content/animation timing or cadence | Cannot alone explain our measured media drops |
| Drift or periodic holds tied to rate ratio | Source/display cadence mismatch | Preserve rational rates such as 59.94 versus 60, not nominal labels |

Video has media timestamps and audio-clock synchronization. Do not transplant
the game's fixed-step experiment, force a nominal 60 Hz clock, change frame
callbacks or drop fences. Buffer reuse remains a separate evidence-dependent
question; additional buffers are not automatically a latency improvement.

No public JavaScript surface, diagnostic interface, source behavior, preference
or device state was changed for this lead. The first deliverable is an audited
map and a falsifiable measurement proposal, not a patch justified by analogy.
