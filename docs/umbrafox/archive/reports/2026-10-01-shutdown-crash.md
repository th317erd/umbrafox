# October 1 shutdown crash

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Finding

The crash at 2026-10-01 18:06:27 UTC (11:06:27 Arizona) was an
AsyncShutdown timeout during `profile-change-teardown`, following `AppClose`.
The parent was PID 313376, BuildID `20260917124752`, version 158.0a1.
This is the old nightly installation, not the installed October 1 prototype
with BuildID `20261001103920`. The old PID subsequently disappeared.
No agent termination signal or restart was issued during this investigation.

The crash annotation contains one remaining blocker:

```json
{
  "phase": "profile-change-teardown",
  "conditions": [{
    "name": "ServiceWorkerShutdownBlocker: shutting down Service Workers",
    "state": {
      "acceptingPromises": false,
      "shutdownStates": "content process main thread, content process main thread, ",
      "pendingPromises": 2
    },
    "filename": "./../../../dom/serviceworkers/ServiceWorkerShutdownBlocker.cpp",
    "lineNumber": 107,
    "stack": "Service Workers shutdown"
  }]
}
```

`MozCrashReason` identifies an abort in that blocker; the parent stack annotation
also records `AsyncShutdown Spinner for profile-change-teardown`. The reported
SIGSEGV at address zero is consistent with this intentional crash path, not
evidence by itself of an unrelated invalid-memory access.

## Source checks

Read `modules/AsyncShutdown.sys.mjs` directly from the old installation's
`/home/wyatt/Programs/umbrafox-nightly/omni.ja`. Its timeout callback records
`AsyncShutdownTimeout` and deliberately crashes to avoid leaving an unresponsive
process. It attributes the abort filename to a remaining blocker. Its fallback
timeout is 60 seconds, overridden by `toolkit.asyncshutdown.crash_timeout`;
the effective preference and exact elapsed shutdown time were not established.

Searchfox producer/consumer inspection of `ServiceWorkerShutdownBlocker::GetState`,
`ReportServiceWorkerShutdownProgress`, and `ServiceWorkerOp::MaybeStart` /
`StartOnMainThread` explains the progress labels: termination reaches the content
main thread, requests worker close, and reports completion when the termination
promise settles. These upstream source checks explain the annotation contract;
they are not exact old-binary stack symbolication. Two states do not prove two
different content processes or identify two particular sites.

## Evidence

Existing originals, left untouched:

`/home/wyatt/.config/umbrafox/umbrafox/Crash Reports/pending/`

- `6e0a064f-05cc-c019-e23c-a029ce44773d.extra`, 10372 bytes,
  SHA256 `c9c57d6dba4e8f96cbf2a0444470b89b84cc169d87b613ea5ede28af03d81e86`.
- `6e0a064f-05cc-c019-e23c-a029ce44773d.dmp`, 2701024 bytes,
  SHA256 `32c4f2a344d0c1531dd680a0904d7f7df65d15ce0069536d5f4b2e6c11abab7f`.

Only diagnostic fields were printed from the extra JSON. No dump contents,
browsing URLs, telemetry environment, or queued reports were exported or uploaded.
No report-submission status was inferred. No browser launched or modified.

## Limits and next step

The shutdown failure mechanism is established; the underlying worker termination
failure is not. This evidence does not implicate uBlock, request interception,
or the newly added UmbraLink commands. The parent-only annotated stack does not
show the blocked worker's own stack or responsible origin.

Existing automatic crash instrumentation already catches this timeout and records
its blocker. No new always-on monitor or behavioral workaround was installed.
Do not disable service workers, lengthen the watchdog, clear site data, or claim
the new prototype fixes this on these facts alone. If it recurs, compare the new
build's annotation first; the next useful deeper capture is the affected child
and worker thread stacks before the watchdog fires, with owner consent before
attaching a debugger or reproducing shutdown on the work browser.

Searchfox CLI reported an available update (0.18.0 to 0.20.4); no tooling was
installed or updated during this investigation.
