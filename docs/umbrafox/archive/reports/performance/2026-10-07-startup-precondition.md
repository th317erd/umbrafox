# Profiler Preparation Control

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Result

The fixed laptop A/B/B/A sequence completed successfully. Playback in all four
runs was unprofiled at the observed parent and selected-content boundaries.
The final untreated control was also low-drop, so this does not establish a
reliable profiler-preparation benefit. No product optimization was implemented.

| Order | Arm | Frames in 20 s | Reported drops | Native category | Preparation duration |
| --- | --- | --- | --- | --- | --- |
| A1 | Inactive-state sham | 1200 | 25 | Compositor | 0.074 ms |
| B1 | Start, then stop before playback | 1200 | 2 | Compositor | 9.288 ms |
| B2 | Start, then stop before playback | 1200 | 0 | None | 9.297 ms |
| A2 | Inactive-state sham | 1201 | 1 | Sink | 0.082 ms |

Every run contains 21 quality samples, zero missed sampling intervals, and zero
recorded media events. Initial quality totals and all three initial native drop
categories were zero. Final native decoder/sink/compositor totals agree with
the quality counts. No counter evidence indicates that the low counts merely
shifted to before the observed interval; these are not per-frame presentation
receipts or atomic cross-thread snapshots.

A1's 25-drop increase was observed between 5002 and 6003 ms. B1's two increases
were observed between 11002/12002 and 16002/17002 ms. A2's sink-category increase
was observed between 1 and 1001 ms. These bound observations of counters, not
the physical time of each lost frame. B2 had no increase.

The owner's symptom is prolonged stutter after **seeking with the progress
bar**, followed by a brief black flash and recovery. This no-seek startup test
does not reproduce or explain it. Do not add a profiler-start/stop workaround.

## Controls And Limits

All runs used fresh owned installations and data roots, frozen
BuildID `20261006175655`, the same private iHD copy, and the existing 1080p AV1
YouTube workload. Native decoder receipts reported hardware acceleration at
both boundaries. Four binary/INI hashes and seven fixture hashes match across
all runs; seven loose userland-module entries remain null, not loaded-module
proof. There was no codec, browser-default, sandbox or system-driver change.

The no-stack preparation retained the existing 16,777,216-entry, 5 ms request
with `nostacksampling` and `nomarkerstacks`. No sample was intentionally awaited,
but initialization and teardown may themselves perform work. There was no
profile dump, raw-profile parser or profiler CLI session. Both arms used the
same extra RPC shape; their elapsed setup time was not artificially matched.

The parent and selected-content profiler were directly observed inactive, with
the content PID joined to the parent's current native window-global PID and
the playback receipt. Other child profiler state was not observed. Parent
acknowledgement is not proof that every child applied stop; there is no claim
of continuous whole-browser inactivity or zero diagnostic overhead.

Page ages at playback were 11810, 11542, 11562 and 11440 ms. They are clocks of
separate documents, not a common absolute clock. Quality-menu target coordinates
were 760/535 for the first three runs and 792/553 for A2. Site/layout, elapsed
setup time, order and host warm state were not isolated. Two runs per arm do not
support a pooled performance score or a causal preparation effect.

## Ownership And Verification

The same immutable playback collector, quality setup and owned-browser cleanup
were reused. The new adapter implements a bounded start/stop preparation and
read-only content confirmation. It adds no page globals, DOM attributes, public
UserTiming marks or new browser API. The existing private interval bridge is
unchanged. Failure at any admission gate prevents playback; a failed run would
have stopped the sequence. There were no retries.

Failing-first evidence includes the initial missing new module, a real missing
native-PID admission assertion, and a missing saved-run mode assertion. Final
combined verification: **116 tests passed**, including emitted-script VM tests,
held promises, late rejection, primary/secondary error preservation, aborts,
raw-before-validation writes, PID/document/configuration drift, listener cleanup,
actual capture composition, saved-data negatives and inherited deadline/cleanup
regressions. Seven manually authored JS files passed formatting checks. All
44 bundled JS modules passed syntax checks; generated adapters have exact
inverse/source-region proofs against the sealed prior sources.

Each run had nine passive resource samples, zero log drops and clean SIGTERM
cleanup. All 14 recorded PIDs per run were absent before the next run. The
largest sampled RSS was 2463105024 bytes and sampled artifact size 94574927
bytes. Existing 120-second capture, 15-second cleanup and 256 MiB sampled
artifact limits were unchanged. Logs of 331/338/338/331 bytes are retained,
including the user-namespace EPERM warning and successful private VA driver
initialization; no sandbox setting was changed.
These checks do not prove OS-wide isolation or exclude transient unsampled work.

All 48 runtime inputs were reverified before, between and after runs. Final
quiet-host/bundle check completed at 2026-10-08 00:12:00 UTC. The system free
iHD remained SHA256 `a7cecd28f70fb692a5d65c2de8c491d953bc834dc1c98c4bd93a929ffcc976ee`;
the non-free package was not installed. The private mapped copy remains
`7e14725d1af6a016fda32492cd7daaa33f1e744a36c0b8907ef3bb3a98e6798c`.
Desktop/Pi, personal profiles, product sources, defaults and the Git index were
untouched. All browser and SSH command handles are terminal.

## Evidence

Namespace: `artifacts/umbralink-control/startup-precondition/`.

- `comparison.json` and `comparison-final.log` are the authoritative four-run
  analysis. Two earlier failed analysis attempts are retained: an unjustified
  zero-sink-drop assertion rejected A2, and the first text replacement missed
  that assertion. The final calculation uses the native sum of decoded, sink
  and compositor drops. Capture statuses were never changed.
- Per-run exports, reviews, launch logs, preparation states, current-document
  joins, quality observations, native decoder data and resource samples are
  retained. The reusable reviewer validates original export hashes.
- `source-proof.json` pins the process-local profiler service and ChromeOnly
  window PID interface to the deployed base. The private frame bridge is a
  recorded harness dependency, not a claim about a loaded product module.
- `generation.json`, `runtime-inputs.json`, `bundle.json`, command records and
  test logs preserve implementation and execution provenance.

Next, investigate ordinary startup variability and the actual post-seek state
transition without presuming profiler activation is causal. First compare
existing player/layout and process evidence; no further profile-capture loop or
default change follows from this result. A later experiment must distinguish
host/setup changes from browser-local state and retain an untreated control.
