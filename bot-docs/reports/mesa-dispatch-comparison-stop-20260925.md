# Dispatch comparison infrastructure STOP

Assignment: coordination event 223, `scaled-v2 / browser-review`.

## Result

The first baseline attempt stopped before creating its capture directory.
There are no new images, driver-mapping sidecars, operand traces or pixel
comparisons. Neither the baseline pair nor the diagnostic pair ran to
completion. No later run or retry was started. This is a helper failure,
not evidence about the browser's rendering behavior.

Evidence is preserved on wyatt-desktop at:

```text
/home/wyatt/.cache/codex/l8ros/opacity-prototype-20260925/sampling-operands-validation/dispatch-comparison/
```

`run.mjs` is unchanged at SHA256
`564bce2278e1c2f73802bca2d0f19729b1669fed8c0f3267542f5974771cc073`.
`preflight.json` records the intended differences from the original runner.
`run.log`, `baseline-off/capture.log`, and the empty interrupted
`baseline-off/sidecar-failure.json` retain the failure as it happened.
`STOP.json` is explicitly a post-failure investigation record, not a
successful helper result.

## Verified cause

The new wrapper incorrectly passed `detached: true` to promisified
`execFile`. The installed Node v24.13.0 implementation forwards selected
options to its internal `spawn` call, but does not forward `detached`.
Its actual implementation is saved in `installed-node-execFile.txt`.
The utility PID was 1005021; its observed process group was 1004952,
not 1005021. The ownership assertion correctly rejected this assumption.

The wrapper also attached its completion handling too late. The ownership
assertion threw before `await running`; the observer then aborted the child
while the wrapper was unwinding. The resulting rejected completion promise
was unhandled, terminating Node before normal failure-record and cleanup
logic finished. Syntax checking alone did not exercise either lifecycle
problem. The ownership check must not be weakened to accommodate this bug.

No helper call to signal the inherited utility group occurred. The observer
abort targeted the returned child, not a negative inherited group ID.
The capture program creates its output/profile directories before launching
the browser; neither directory exists in this attempt. No browser launch
record or completed image was produced.

## Cleanup and preservation

Read-only checks after exit found no live members of the known helper or
utility groups, no matching sampling capture/browser process, no Xvfb
process, and zero profiler sessions. No additional kill command was needed.
`cleanup-processes.log` and `cleanup-profiler.log` preserve the group and
profiler checks. The existing user browser was not targeted.

All 8,243 original continuation identities and 13 additional frozen inputs
passed verification before the attempt and again after the STOP. The
original runner, capture, fixture, parser, reference images, manifests,
installed driver and browser runtime remain unchanged. No source/build,
package, installation, Pi, default-enable, or push action occurred.

The preserved 20-pixel normal failure and older evidence remain valid;
this attempt adds no measurement that changes their interpretation.

## Proposed helper-only repair

Coordinator event 227 confirms the API issue and requests a proposal, not
a browser retry. Keep this stopped directory and frozen helper immutable.
Use a new sibling scratch directory for a reviewed replacement:

1. Launch the capture utility with real `spawn(..., { detached: true })`.
   Install error/close/completion handling immediately, before any awaited
   process inspection. Await the spawn handshake and verify PID, starttime,
   executable, argument identity, session and process group before storing
   an owned-group handle.
2. Represent child completion and observer completion as immediately handled
   outcome objects. Every unwind must settle both tasks and bounded cleanup,
   even when spawn, identity checks, observation, output writes or abort fail.
   Preserve the primary failure as well as cleanup failures. An unknown or
   inherited group must never become a negative-PID signal target.
3. Keep the positive returned-child lifecycle separate from ownership of its
   group. Only a previously verified session/group with matching identity
   can receive group cleanup. Browser cleanup still requires its independently
   verified disposable profile and executable; no broad process-name killing.
4. Exercise this boundary with harmless fake children before authorizing any
   browser: normal exit, nonzero exit, spawn ENOENT, immediate exit, ownership
   rejection before awaiting completion, observer rejection/abort, deadline,
   SIGTERM-resistant child/descendant, and failure while writing evidence.
   Assert no unhandled rejection, no inherited/stale-group signaling, both
   outcomes settled, bounded cleanup and no live owned descendants. Run under
   strict unhandled-rejection handling with short explicit timeouts. Inject
   stale-identity and inherited-group records; never target unrelated live
   groups to test refusal.
5. Freeze and review replacement helper/test hashes and lifecycle results.
   Retain every original pixel, environment, mapping, path, parser, identity
   and deadline gate. Any new four-process browser comparison requires a new
   explicit authorization and fresh evidence; do not silently resume here.

No repair or fake-child execution is included in this report checkpoint.
No conclusions about linear dispatch, rectangle setup or AOS/SOA selection
can be drawn from this stopped attempt.
