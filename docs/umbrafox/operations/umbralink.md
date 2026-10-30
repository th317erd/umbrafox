---
title: UmbraLink operation and live diagnostics
status: current
doc_type: runbook
audience: [operators, developers, bots]
last_verified: 2026-10-27
canonical: true
---

# UmbraLink operation and live diagnostics

> **Current documentation.** Use only against an Umbrafox process and systems the owner controls.

## Connect safely

1. Confirm the actual process and profile.
2. Read the profile's `umbrafox/control.json`; do not log or persist its token.
3. Connect to `websocketUrl` and request `umbrafox.status`.
4. Request a fresh diagnostics snapshot before choosing a context.
5. Reacquire context/document IDs after navigation or reload.

Do not add `--marionette`, `--remote-debugging-port`, or
`--remote-allow-system-access`. If present, identify the launcher that added
them and mark the run automation-tainted for parity conclusions.

## Live freeze triage

Prefer non-invasive evidence. Check whether `tools/umbrafox/diagnose-live.sh` is
already sampling before starting another instance. Capture process/journal
state, status and diagnostics snapshots, and—when memory is high or rising—an
anonymized memory report. Preserve crash dumps, `.extra` files, profiler/memory
reports, sampler logs, timestamps, process identity, build ID, and profile path
under `artifacts/`.

Do not kill or restart a live browser until requested or until evidence is
preserved and the process is unusable. UmbraLink commands cannot quit the
browser; a process exit after control activity requires independent crash,
OOM, launcher, session, or environment evidence.

## Page driving

Use background tabs for non-disruptive snapshots. Use a selected, restored,
visible window/tab for rAF, paint, animation, or input timing. Durable hooks
must be page-realm objects, not sandbox functions. Close temporary tabs and
restore the owner's selection when finished.
