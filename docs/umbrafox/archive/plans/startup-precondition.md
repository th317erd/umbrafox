# Profiler Preparation Control

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

Status: implemented and verified. Fixed A/B/B/A completed on the laptop;
25/2/0/1 reported drops. No causal preparation benefit established. See
[the result](../reports/performance/2026-10-07-startup-precondition.md).

## Question

Does merely starting and stopping the no-stack profiler before playback change
the reproducible startup drop burst? This distinguishes a preparation effect
from a requirement for recording during playback. It is not a root-cause proof,
a performance score or a reproduction of prolonged post-seek recovery.
With only two runs per arm, initialization, extra setup time and ordinary
run-to-run variation remain possible explanations for any difference.

The source audit establishes that `nostacksampling` leaves CPU sampling active.
`PauseSampling` would still leave wakeups/locks and needs child-state coverage,
so use an unprofiled preparation control before another recording.

## Fixed Scope

- Existing frozen BuildID `20261006175655`, private mapped iHD, fresh owned
  installation/profile/app-data/temp roots, laptop only. No system installation.
- Reuse the existing 20-second, 1080p YouTube collector and native decoder
  admission; preserve its exact body and private interval bridge.
- Fixed four-process sequence A/B/B/A, no retries or selective pooling. A is
  inactive-state sham; B starts and fully stops the existing no-stack profiler
  before playback. Both get the same additional preparation/confirmation RPC
  shape; measure duration rather than invent a matching delay.
- No actual sample collection is intentionally awaited in B; the treatment is
  initialization plus teardown, including whatever work occurs during them.
- Preserve 120-second capture, 15-second owned cleanup, 256 MiB sampled artifact
  cap and existing resource/log limits. No profile dump, parser or copy. Failed
  admission/cleanup stops the sequence; preserve completed members separately.
- Keep owner desktop/Pi and product/default settings untouched. No page CSS,
  resize, fullscreen, codec, sandbox, public markers or globals.

## API And Evidence

Use a narrow preparation adapter in a new scratch namespace. Do not edit sealed
captures or casually duplicate their cleanup implementation. Before coding,
trace the current capture caller, serializer, reviewer, fixture tests and bundle
closure; establish exact generated-source deltas where reusing a frozen module.

The preparation script runs in the existing browser realm. Require inactive
initial state. A records the sham; B marks start attempted before dispatch,
awaits start, verifies exact existing features/capacity/interval/filters, then
awaits stop in `finally`. Record start/stop attempts, errors, parent PID, monotonic
duration and returned active/paused/sampling-paused states. Preserve the original
error if stop fails too; never proceed to playback after either failure.

Confirm selected content PID/document and inactive profiler through the existing
privileged frame route before and after playback, without exposing data to page
JavaScript. Verify this route from existing producer source before implementation;
do not assume a sandbox global or treat the parent promise as every child's proof.
Record other child-state coverage as unknown, and keep owned-process cleanup.
The implemented confirmation also compares the returned PID with the parent's
current `WindowGlobalParent.osPid`, preserving that native expected PID in each
receipt. The existing frame bridge handles document identity and listener
cleanup. No page-facing state is added.

Both arms must use inactive profiler validation at ordinary before/after
snapshots. Record preparation separately from `profiled` playback semantics;
never label B as a profiled timing sample. Retain quality-control geometry,
page/process ages, all media counters/events and source/driver hashes.

## Fail-First Gates

Before runtime, bounded pure cases must cover successful A/B ordering, start
rejection or timeout after dispatch, exact-config drift, stop failure, both
failures retaining the original, wrong parent/content/document, active state
after stop, abort before and between operations, missing/malformed replies and
evidence-write failure. No playback can be dispatched after a rejected gate.

Exercise the emitted privileged script itself with fake services, not just a
mocked RPC response. Reject page-visible additions or any unbounded wait. Retain
existing cleanup/deadline tests, prove source equivalence for the collector, and
run the focused combined tooling gate. Commands remain bounded; no native build
is required or authorized by this plan.

After each real run verify terminal evidence, native joins, all recorded PID
absence, installation/driver invariance and quiet-host admission before the next.
Report every member independently and the complete fixed sequence. A failed
sequence is not a performance comparison. Do not claim GPU causality, physical
scanout, recording neutrality, a browser fix or broad rendering improvement.
