# Request Controller Document Identity

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Status

An uninstalled correctness prerequisite for PERF-005 is implemented and tested.
Request controllers now use a browsing-context plus inner-window identity when
the native document identity is available. This does not implement a parent-side
fast path, remove the request actor query, or demonstrate a performance gain.

The [busy-thread pilot](2026-10-03-request-busy-pilot.md) observed delayed network
progress after explicitly installing the observer in an isolated empty-registry
browser. The [authority audit](2026-09-27-request-authority.md) explains why neither
an empty registry nor a previous null reply is a safe negative cache. This work
addresses that audit's stale-controller prerequisite, not its remaining authority
and ordering requirements.

## Reproduction And Change

Four behavioral tests of the actual module source initially failed: a retained
controller could receive another document's requests in the same browsing context;
registration in the new document replaced the old document's entry; stale request
identity could reach a current handler; and registration did not retain the
construction document identity. The original focused run had nine passes and
four failures. Those findings concern child dispatch; they do not establish how
often the owner's browser encounters these states.

The production delta is restricted to
`toolkit/components/umbrafox/UmbrafoxUserlandEventController.sys.mjs`:

- Capture the native inner-window ID at controller construction, using
  `Cu.unwaiveXrays` before reading the chrome-only WindowGlobal property.
- Key request controllers by context and captured document ID. Retained old
  controllers cannot overwrite a newer document's entry by registering later.
- Reject an explicit nonzero request inner-window ID that differs from the
  dispatch window's known native ID.
- Preserve zero/absent request-ID dispatch to the current document, and the
  prior context-only fallback when no native document identity is available.
  Neither fallback is proof that a future parent-side shortcut is safe.
- Generalize the existing finalizer's internal key field. Navigation, script and
  mutation maps still use their original numeric keys. Replacement and weak
  cleanup semantics are preserved.

The earlier finalizer and request-header-copy changes already in the worktree
are retained. The new delta does not change parent channel suspension, header
serialization, query/reply, decision application, resumption, actor selection,
script matching or the public userland API.

## Actual Browser Failure And Correction

The first real Gecko attempt failed: the runtime supplies a waived window wrapper,
which hid `windowGlobalChild` from the initial ID lookup. Registration then used a
context-only key while actual dispatch used a document key. This missed valid
handlers, including the existing HTTP interception test. A mock-only pass would
have concealed the regression.

That failure is preserved at
`~/.cache/codex/mutation-mirror-browser-final-20261003-MiK1cA/`: 60 assertions
passed and 10 failed. Its controller, browser and helper roots were absent after
the run. A new failing-first waived-window regression reproduces the missed
handler. Normalizing the wrapper fixes that boundary. The browser regression
also supplies the explicit browsing-context ID, as the real runtime caller does.

The corrected run is
`~/.cache/codex/mutation-mirror-browser-final-20261003-nPW9cx/`: 71 assertions
passed, zero failed, controller duration 6661ms. Its new test navigates an actual
same-origin iframe, checks changed native document IDs within the same context,
retains the old controller, adds an old handler late, and verifies only the
current-document dispatch reaches the current handler. Existing real HTTP
request/header, navigation, mutation and document-start tests also pass.

The new iframe test directly invokes child dispatch with actual native windows;
it is not an end-to-end BFCache or old-request rerouting test. Parent actor
selection still uses the current WindowGlobal. A mismatched old request is now
ignored by the current handler, not rerouted to a retained old actor.

## Verification

- Full strict-unhandled Node tooling suite: 396 tests pass, zero failures.
- Exact four-file ESLint, license, whitespace and trojan-source checks: zero
  errors and warnings. Exact-file formatting and tracked diff check pass.
- Tests cover document separation, constructor identity, late registration,
  off/on, mismatched and zero/missing IDs, waived windows, weak finalization,
  replacement cleanup, headers, decisions, failures and concurrent requests.
- Three actual headless Gecko suites pass: `browser_userland_mutation_gate.js`,
  `browser_userland_events.js`, and `browser_userland_document_start.js`.
- Fresh private application-data/local-data roots were forced through the
  existing wrapper. Corrected run controller PID1807081, browser PID1807266 and
  helper PIDs1807211/1807212/1807213 were all absent at wrapper completion.
- Browser startup service warning remains in the raw log; the test result does
  not imply an entirely warning-free startup.
- No native build, package, installation, staging, commit, profiler, owner-tab
  action or personal-profile access. This candidate is not in the sealed A/B
  packages or the owner's installed browser.

Commands and preserved outputs are under `artifacts/umbralink-control/`:
`request-document-{red,green,wrapper-red,full-tests,lint-final,browser,browser-fixed}.log`,
before-source copies, and `request-document-final.sha256`.
The browser wrapper remains `run-mutation-browser.mjs`, with a 150s child bound
inside a 165s command bound. The full Node suite has a 60s bound.

## Review And Next Step

No page globals, WebIDL, request headers, protocol, preference or website-facing
diagnostic were added. The ID is a privileged native value, not a referrer or
resource-origin cache key. With no controller, the existing null decision and
parent resume path remain. Intentional script behavior is corrected only at the
document boundary. This is not universal Firefox parity certification.

Remaining verification boundaries include actual BFCache restore, process swap,
private/container contexts and retained-window lifecycle under the full request
pipeline. No network/GPU/YouTube attribution or memory improvement is claimed.

Next implement a reviewed synchronous parent decision only where exact-document
authority proves no request capability can run. Every capability-creation route
must establish that authority before exposing synchronous `on` registration;
unknown identity or state retains the current dispatch. Never turn null replies,
registry disablement or an asynchronous handler-count update into that proof.

Then repeat the controlled busy-thread comparison on wyatt-laptop, including
ordering and observer-effect controls, while preserving actual handler behavior.
The user's work browser remains protected; headed GPU/video testing is a separate
permission boundary. The overall performance goal remains active.
