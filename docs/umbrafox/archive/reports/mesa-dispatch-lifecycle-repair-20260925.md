# Dispatch helper lifecycle repair checkpoint

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

Scope: coordination event 229, scratch helper and harmless child tests only.
No browser, Xvfb or profiler capture was started. Browser retry remains held.

## Artifacts

New sibling evidence directory on wyatt-desktop:

```text
/home/wyatt/.cache/codex/l8ros/opacity-prototype-20260925/sampling-operands-validation/dispatch-lifecycle-v2/
```

The stopped `dispatch-comparison/` helper and failure artifacts were preserved.
The original 8,243-entry identity set and its additional 13 inputs still pass.

- `lifecycle.mjs`: shared real-spawn launcher, handled completion and cleanup.
- `run.mjs`: corrected scratch comparison wrapper importing those functions.
- `lifecycle.test.mjs`: tests calling the actual shared production-for-this-helper
  functions, not a separate implementation.
- `helper-diff.patch`: comparison against the immutable stopped wrapper.
- `lifecycle-red.txt`, `red.log`, `red-outcomes.json`: failing-first proof.
- `green-initial.log` and outcomes: initial 12/13 result, including the test
  fixture quoting error, retained rather than overwritten.
- `green-second.log` and outcomes: final 13/13 passing lifecycle suite.
- `cleanup-verification.json`: independent post-suite check of nine owned
  groups and the two positive-PID cleanup targets; no live members remain.
- `additional-identities.sha256`: original 13 inputs plus replacement helper,
  shared module and tests. Original identity manifests were not modified.

Final code SHA256:

```text
run.mjs
029fdf355bfbc0188ea73240f05d6d6b29f1791c41895adda8043dbf3e3f09f7
lifecycle.mjs
da11403653008cf6600c5dd96667dbe424617c56f3ce45f57baad883c39e1d72
lifecycle.test.mjs
0b1f583e435fc67ba2635dc69458dfdd2761d30f06ca48e0517bc9b20c50eb7c
```

## Changes

Real `spawn` receives `detached: true`. Spawn/error/close outcomes are handled
immediately before awaiting ownership inspection. The child must have its own
session/group, the expected executable and exact arguments. A verified group
can be cleaned even after its leader exits; membership, session and starttime
checks reject inherited groups, older members and reused leader PIDs.

The returned child handle is distinct from authority over a group. When group
ownership is rejected, fallback signals target that child positively, never
the inherited process group. Completion and observer failures are retained as
outcomes rather than leaving a rejection gap. Cancellation reaches the actual
capture observer's sleeps and readelf subprocess. Output is bounded.

The wrapper uses the same exported cleanup function for its independently
verified disposable browser group. Browser cleanup, profiler cleanup, cleanup
recording and post-run identity verification have separate failure collection:
one failure no longer skips the remaining steps. Profiler-stopped status is
set only after a successful stop command, not merely because a session name
exists; absent browser identity is explicitly recorded.

All original pixel/environment/mapping/parser/path/identity gates remain.
The wrapper now also requires an explicit `--reviewed-browser-captures`
argument to prevent accidental execution during helper review. The argument
does not itself grant permission to run the browser.

## Failing-first and verification

The first focused test used the actual shared launcher with the old
`execFile(..., { detached: true })` call. Its owned-session success assertion
failed with an inherited group; its returned child was cleaned positively.
The red source and outputs were preserved, then the shared call was replaced
with real `spawn`.

Final command:

```sh
timeout 120s env LIFECYCLE_EVIDENCE=green-second-outcomes \
  node --unhandled-rejections=strict --test --test-concurrency=1 \
  /home/wyatt/.cache/codex/l8ros/opacity-prototype-20260925/sampling-operands-validation/dispatch-lifecycle-v2/lifecycle.test.mjs
```

Each case has a 10-second deadline. All 13 passed in approximately 5.86
seconds, with no cancellation or skipped case:

1. Original execFile non-detachment reproduction, returned-child signal only.
2. Successful owned session and record callback.
3. Missing executable with no group signal.
4. Early nonzero exit with retained failure and record callback.
5. Observer rejection before command completion; both outcomes settle.
6. Ownership rejection before completion; no inherited-group signal.
7. External abort with cooperative observer cancellation.
8. Command deadline and observer cancellation.
9. SIGTERM-resistant descendant cleanup after its parent exits.
10. Shared cleanup rejection of unrelated membership, positive-child fallback.
11. Reused leader, older member and current-process identity refusal.
12. Record-write failure after verified cleanup.
13. Bounded-output overflow cancellation.

An initial descendant fixture constructed invalid nested JavaScript quoting.
Its child exited with SyntaxError; that failed test was not a renderer result.
The fixture now uses `JSON.stringify` for its embedded program, and the final
case exercised and verified SIGKILL escalation for the resistant descendant.

Both replacement modules passed syntax checks. Post-suite group inspection
found zero live members; the two positive cleanup targets were absent.
All 8,243 original identities and all 13 stopped-run inputs still match.

## Limits and next gate

This verifies the shared launcher/cleanup against the listed harmless child
cases. It is not a successful browser, Xvfb, profile-parser or loaded-driver
integration run. The detached browser group is independently identified by
the wrapper; an early failure before that identity becomes available remains
explicitly distinguishable from verified browser cleanup. No unowned group
may be signaled to conceal such a failure.

The exact-zero pixel oracle and preserved 20-pixel failure are unchanged.
Review these files, hashes, diff and lifecycle results before granting another
bounded browser experiment. No browser retry, build, source modification,
ARM/package/install, Pi action, default enable or push occurred in this scope.
