# Request Header Copy Reduction

## Result

Removed one redundant parent-side `originalHeaders` object from the private
`DispatchUserlandRequest` payload. This is an uninstalled, one-line production
change in `UmbrafoxUserlandEventController.sys.mjs`, not a no-handler fast path
or a measured YouTube improvement. The previously reviewed controller-finalizer
changes in the same file are preserved exactly.

The parent still reads and sends the ordered header entries. The child still
constructs the mutable `headers` collection and frozen `originalHeaders`
snapshot when it dispatches an actual handler. The old parent object was always
overwritten by that child construction. Removing it avoids one
`Object.fromEntries` and one `Object.freeze` call per dispatched request,
and removes that duplicate object from structured-clone input. Requests with
no child controller/handler no longer build this unused parent object either.

This does not eliminate suspension, actor queries, header-entry enumeration,
handler work or network latency. A fresh browser whose request observer was
never registered does not benefit from this change. The change adds no observer,
new page API, preference, diagnostic, header or default policy.

## Producer And Consumer Review

Local searches find one producer, `getRequestEventFields`, called only by
`dispatchParentRequestEvent`. `UmbrafoxUserlandChild.receiveMessage` passes its
message to `dispatchUmbrafoxUserlandRequest`; the latter either returns null or
calls the controller's `dispatchRequest`. That method replaces both header
properties from `fields.headers` before handlers run. The documented userland
event still includes both properties; no public contract was removed.

The [authority constraints](2026-09-27-request-authority.md) remain valid:
registry disable does not revoke retained capabilities, synchronous handler
registration/removal has no authoritative parent publication, and null replies
can follow real side effects. This patch does not cache null or use the active
preference to skip dispatch. Document identity and cross-process ordering still
need resolution before the larger no-handler shortcut is justified.

## Verification

- Failing-first Node run: eight pass, one expected failure because the parent
  still included the duplicate property. No harness error.
- Nine focused request tests pass. They cover exact remaining payload fields,
  empty/duplicate/case-sensitive/empty-valued/prototype-like headers, frozen
  original snapshots, mutation independence, absent handlers, side-effect-only
  handlers, remove/re-add, cancellation, synthetic responses, redirects, method
  and header changes, header-read/query/abort/suspend/resume errors, and reverse
  completion of parallel requests.
- Combined Node suite: 353 pass, zero failures, 9.57 seconds under a 60-second
  bound. It includes performance, readback/test, mutations/test, userland and
  control specs. The earlier 327-test invocation omitted nested readback and
  mutation specs; its log is retained but is not the final combined gate.
- Actual headless Gecko: three adjacent browser suites, 63 assertions pass,
  zero failures. New assertions require nonempty Accept values, equal original
  values before mutation, frozen snapshots and originals unchanged after edits.
  Existing redirect/cancel/synthetic-response checks also pass.
- Scoped ESLint, license, whitespace and trojan-source checks: zero problems.
  Diff whitespace check passes.

The runtime uses the existing development binary and its verified source-linked
module, not either sealed package or the owner's installed browser. Final test
root is `/home/wyatt/.cache/codex/mutation-mirror-browser-final-20261003-CZjFjn`.
Fresh private app-data/local-data roots and a disposable headless test profile
were used. Harness PID1330674, browser PID1330910 and helper PIDs1330837-1330839
are absent in the terminal receipt. The earlier 62-assertion run is preserved
separately at suffix `0QvHWb`. Both commands exited successfully; no browser,
test or lint session remains running. Owner PID3290300 still resolves to the
October 1 installed executable. No owner tab, extension or setting was changed.

## Cost Evidence And Limits

An instrumented execution of the exact saved pre-edit producer and final
producer verifies the removed allocation calls for zero, eight, 32 and 128
synthetic headers. For 32 headers of 64-byte synthetic values, JSON representation
length decreases from 5730 to 3096 bytes. This is only a representation proxy,
not Gecko IPC wire-byte or latency measurement. No personal request headers
were captured, and no timing benchmark was run under uncontrolled host load.

The audit also verifies the entire module differs from the saved pre-edit
source by exactly the one removed line. Final module SHA-256:
`5f0f10369bd55a1f4a90a8508670153c8d5c27606d62846070f923954fe84125`.

Evidence under `artifacts/umbralink-control/`:

- `request-headers-before.sys.mjs`, `request-headers-before.sha256` and
  `request-headers-final.sha256`.
- `request-headers-{red,green,all-tests,lint-final}.log`.
- `request-headers-browser-final.log` and the referenced Gecko receipt/log.
- `request-headers-allocation-audit.log`.

No engine compilation, package update, install, commit or staging occurred.
Default Firefox surface parity is supported by unchanged data/dispatch semantics
and the scoped tests, not asserted as a universal browser-equivalence proof.
Actual request-latency improvement, remaining no-handler overhead, and playback
effects are unmeasured. The headed GPU baseline still awaits separate consent.
