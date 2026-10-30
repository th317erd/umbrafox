# Linear Import Pixel Localization

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Decision And Scope

Continue the authorized laptop performance investigation, not installation or
default enablement. The sealed ordered OFF/OFF/ON experiment differs at 18/48
positions. OFF contains V2 scaled readback and is not a stock Firefox oracle.
Preserving OFF is a regression check, not sufficient proof of Firefox parity;
do not optimize toward the wrong baseline or waive differences as harmless.

Use the same candidate, twelve-case order, targets 0.5/2 seconds, native provider
checks and paused media. Retain linear raw RGBA buffers instead of filter raw
buffers: two 230400-byte arrays per frame, unchanged response/export caps.
No extra draws, browser RPCs, source patches, public API changes or new prefs.
Make new fixture/capture/driver/test siblings; old sealed files stay immutable.

## Evidence Gate

An exact AST comparison must restrict the collector delta to the raw-retention
case literal. New request uses the existing bounded transport and observer.
The validator changes only which case requires raw hash/length/base64 proof.
The new capture/driver preserve deadlines, identity, process cleanup, resource
caps, default-OFF admission and raw-before-validation persistence.

Before runtime, behavioral RED then GREEN for linear raw retention; tests for
malformed bytes/hash/counts, page draw/read/seek failures, stale document,
pref mismatch, transport failure and unchanged orchestration. Compare all 48
new hashes to the sealed corresponding arm after each capture. Begin with one
OFF and proceed to one ON only if OFF exactly reproduces both old OFF arms.
ON must reproduce the sealed ON arm; mismatch is a new confound and stops this
experiment, not a retry invitation. Independently recompute raw channel/pixel
deltas, maximum/total error and bounds; do not infer GPU branch execution.

Use only fresh private laptop roots and the existing pinned package. Retain
120s capture, 15s cleanup, 220s controller, 240s SSH, 256MiB artifact, 1MiB
per-export-file and 8MiB export limits. Pure tests <=30s, lint <=60s. Admit
harness/package hashes and quiet/resource preflight before each run; verify
installation afterward and all recorded owned PIDs absent before export.
No profiler, desktop browser changes, personal profile/queue reads, staging,
commit, build or install. The broad goal remains active after this diagnostic.

## Next Decision

If the old mismatch reproduces, use its measured magnitude and exact source
chain to choose a correction or a Firefox reference gate. A source hypothesis
alone does not authorize changing size propagation or swallowing GPU failures.
Document what remains unknown rather than treating either existing arm as
automatically correct. Preserve raw data, commands, hashes, test results and
cleanup in a new report and seal.

## Completed Diagnostic

OFF exactly reproduces both prior OFF arms; the one admitted ON exactly
reproduces prior ON. All 48 hashes per arm match, leaving the same 18 relative
mismatches. Linear raw differences are 3575 pixels/max94 at 0.5 seconds and
3157 pixels/max100 at 2 seconds, identical across repeats. All 81 focused tests
pass, both captures clean up, and all 24 recorded PIDs are absent at export.

Historical upstream source confirms a full-size readback route, not V2's
destination-sized request; it does not prove runtime reference pixels. Next
gate is the proper reference, not automatically preserving OFF. Report:
`docs/umbrafox/archive/reports/performance/2026-10-06-linear-import-pixels.md`.
