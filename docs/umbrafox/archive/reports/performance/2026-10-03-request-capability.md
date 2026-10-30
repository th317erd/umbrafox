# Request Capability Acknowledgement

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Result

The first phase of the [request fast-path plan](../../plans/request-fast-path.md)
is implemented and verified. A native document must receive an exact-document
parent acknowledgement before obtaining a usable userland controller. This is
an uninstalled correctness prerequisite, not the request shortcut or a speedup.

The parent actor records capability before returning matching scripts and before
acknowledging explicit `GrantUserlandRequestCapability`. The grant validates
positive native browsing-context and inner-window IDs against the message. Its
private actor flag is monotonic: an empty registry reply or handler removal does
not revoke it. The child preparation is weak-keyed by native WindowGlobal, shares
one pending/fulfilled promise, validates both reply IDs, and permits a new attempt
after failure. Unprepared native construction throws before installing hooks.

All provided, promised and registry-based runtime entries converge on this gate.
Empty lists do not prepare or construct a controller. Supplied non-native test
contexts retain immediate execution. Complete-document explicit execution remains
supported. Public `userland.on/off` remains synchronous and unchanged.

## Navigation And Retry Corrections

Adversarial review found a new asynchronous race: an old preparation could finish
after the same window proxy navigates to a newer document which has independently
been admitted. Merely checking that the current document is prepared lets the old
script run in the new document. A failing-first integrated source test reproduced
this:23passed,1failed. Preparation now returns a frozen identity receipt; runtime
passes it into construction, which must match the current document. The pure test
and a native iframe test reject the old receipt after the newer document is ready.

The request observer also set its registered flag before `addObserver` succeeded.
A failure-then-retry test reproduced the false-success state:24passed,1failed.
The request flag now updates after successful registration. Other observer setup
functions have the earlier ordering and were inspected but not changed in this
request-authority delta; no broader observer-recovery claim is made.

The first capability RED run had10 failures: behavioral admission, parent state
and runtime-order failures plus three missing-helper failures. The first GREEN
attempt had9passes/1test failure because a cross-realm promise needed additional
adoption turns. The test now awaits an explicit preparation-entry signal instead
of assuming one microtask turn. Both logs are retained. Initial lint naming errors
were corrected, not suppressed.

## Evidence

- Full strict-unhandled tooling suite:421tests pass, zero failures,17.46s.
- New capability specification:25groups, including all runtime routes, grant
  rejection, malformed IDs, synchronous send failure, actor-loss rejection,
  deduplication, retry, navigation, empty execution and parser-promise preservation.
- Exact seven-file ESLint/license/whitespace/trojan-source checks pass with zero
  errors/warnings. Formatting and tracked diff checks pass.
- Real headless Gecko final run:78assertions pass, zero failures. Tests observe
  the parent actor's false-to-true grant, join native parent/child IDs, reject
  unprepared construction, preserve the grant after registry removal and reject
  an old receipt after iframe navigation. Existing HTTP header/decision, mutation,
  navigation and document-start tests pass.
- Final private run:
  `~/.cache/codex/mutation-mirror-browser-final-20261003-v0m6Fm/`,9037ms.
  Controller1827021, browser1827378, helpers1827322/1827323/1827324 all absent.
- Earlier private successful runs QoooFS and KbqPfs had77assertions; rpylYJ had78.
  They precede the observer-retry correction. Their receipts/logs are preserved,
  and all their owned roots are absent. Do not substitute them for the final gate.
- The unchanged wrapper forces fresh0700 application-data and local-data roots,
  a fresh test profile and headless mode;150s child bound inside165s command bound.
  No personal profile, shared crash queue, live owner tab or extension was touched.
- Parsed source-region comparison found parent suspension/query/resume, request
  field/header serialization, decision application and decision serialization
  unchanged from the preserved pre-identity controller source.

Production files changed: UserlandParent, EventController and ScriptRuntime.
Tests: browser_userland_events.js and three userland Node specs. Existing prior
finalizer/header-copy/document-identity work is retained. No native build, package,
installation, staging, commit, profiler or agent activity occurred.

Evidence prefix: `artifacts/umbralink-control/request-capability-`. Final logs are
`verified-tests.log`, `verified-lint.log`, `browser-verified.log`; failure logs
include `red.log`, `navigation-red.log`, `observer-red.log`. The final manifest is
`request-capability-final.sha256`; older source seals intentionally remain intact.

## Limits And Next Work

No per-request shortcut is enabled. Phase1 adds one explicit acknowledgement per
native document receiving scripts, not per request. Its startup cost is not yet
measured; reusing the already-granting startup reply is a possible later change.
This phase alone must not be presented as a performance optimization.

Parent capability is currently scoped to the actor instance. Before negative
authority is used, verify actor recreation and BFCache lifetime against native
document/capability lifetime. The flag alone is not yet a negative certificate.
Actual BFCache restore, process swap and private/container lifecycle tests remain
owed; the source/fake actor-loss checks are not those native tests.

The next phase needs initialized registry membership indexed at publication,
exact native request/document/context identity, and verified authority lifetime.
Unknowns preserve dispatch. Null decisions, empty registries and asynchronous
handler counts remain insufficient by themselves. Matching documents with retained
capabilities stay conservative until a separately proved design covers them.

No web-visible API, header, preference, protocol change or default diagnostic was
introduced. Enabled userland execution gains the internal acknowledgement wait;
default empty execution does not. No universal Firefox parity, memory saving,
YouTube causation, GPU improvement or network timing benefit is claimed here.
The full rendering/layout/CSS/JS performance goal remains active.
