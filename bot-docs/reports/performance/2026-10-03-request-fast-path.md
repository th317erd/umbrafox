# Synchronous Request Fast Path

## Result

Phase 2 of the [request fast-path plan](../../plans/request-fast-path.md) is
implemented and functionally verified, but not packaged or installed. The parent
can bypass suspension, header serialization and the content actor query when it
has an exact-current-document negative certificate. This is not yet a measured
latency improvement or a diagnosis of YouTube stutter.

The certificate requires a current native WindowGlobal, positive exact request
browsing-context and inner-window IDs, no request capability ever granted to that
native document, and an HTTP(S) document origin with a successfully published
registry index proving no enabled document script matches. The Set is built during
publication, not per request. Origin parsing is cached until the native URI changes.
The decision is synchronous. Unknown, failed, reentrant or unindexable publication,
unsupported schemes, mismatched or missing IDs all preserve existing dispatch.

Capability is now a module-private WeakSet keyed by the native WindowGlobal rather
than an actor-instance field. Actor recreation cannot erase a grant. Off/on, script
removal and no-handler replies cannot revoke it. Matching/previously-capable
documents stay on the full path; an authoritative dynamic no-handler optimization
remains separate work. Empty registry and last-null replies are not sufficient.

## Corrections Found

Initial fast-path RED: 57 passes/9 failures, including actual unwanted suspend,
header and query operations, plus missing new APIs. First implementation: 66
focused tests and 132 real Gecko assertions passed.

Reentrant publication then exposed an index mismatch: a nested flush publication
could replace shared scripts while the outer publication certified a different
index. The concrete RED verified a matching shared script while presence returned
false (31 passes/2 failures). A publication identity token now prevents certification
after reentry until a clean publication. Pref/set/flush reentry, outer failure,
intermediate reads and recovery are covered. Both RED logs remain intact.

The first native lifetime run failed three tests during construction, before their
lifetime scenarios (137 passes/3 failures). A waived window hid the implicit context
lookup; a focused RED reproduced it. Native construction now defaults to the
already-admitted WindowGlobal context ID, preserving explicit-ID mismatch rejection
and non-native fallback. Runtime already supplies an explicit ID; this is not proof
of a deployed runtime failure. Initial test lint naming/import errors were corrected
without suppression. All failed artifacts are preserved.

## Verification

- Focused userland: 68 strict-unhandled tests pass.
- Full tooling: 432 tests pass, zero failures, 15.99 seconds. Includes performance,
  userland/control and nested readback/mutation suites.
- Exact six-file ESLint/license/whitespace/trojan-source checks: zero errors,
  warnings or fixes. Tracked diff whitespace check passes.
- Final three-suite headless Gecko run: 218 assertions pass, zero failures, 8426 ms,
  at `~/.cache/codex/mutation-mirror-browser-final-20261003-fHglsO/`.
- Actual HTTP: zero queries for eligible empty/unrelated documents, a query after
  publication of matching scope, and continued queries/side effects after grant,
  late registration, off and on again. Response status/body checks pass.
- Native unregister/re-register produces a different actor on the same WindowGlobal,
  retains capability and dispatches a subsequently enabled handler.
- Cross-origin navigation actually caches the old WindowGlobal. Back restores the
  identical native object/IDs and a persisted pageshow event; a retained controller
  can register and handle a request after restoration.
- Cross-origin iframe, container ID 1 and private-browsing ID 1 cases observe the
  exact classifier invocation plus query/handler counts. Their grants do not affect
  an ungranted ordinary top document, including same-origin container/private cases.
- Existing startup ordering, navigation, mutation, header edits, URL rewriting,
  synthetic response and cancellation browser assertions remain green.
- Supplied-channel tests prove zero suspend/header/query/resume operations on true
  certificates. Unknown/malformed/throwing classifiers preserve full dispatch.
  Existing header/query/actor-abort, suspend/resume failures and parallel replies pass.
- Parsed source-region comparison against the phase-1 archive finds field
  serialization, parent dispatch, decision application/serialization, channel-context
  selection, actor selection and child dispatch unchanged. Runtime and controller-spec
  also match that archive byte for byte.

The unchanged wrapper uses fresh private application-data/local-data and a fresh
harness profile, with 150-second child/165-second outer limits. Final controller
1855606, browser 1855773 and helpers 1855718/1855719/1855720 are absent. Earlier
XfxJJA (132 passes), bXlREF (preserved failure) and G4D7vc (206 passes before final
classifier assertions) also have all recorded roots absent. Existing platform
warnings remain in logs; no warning-free, complete descendant-history, heap or
network-isolation claim is made.

## Scope And Parity

Production changes: EventController, ScriptRegistry, UserlandParent. Tests:
browser_userland_events.js, capability-spec.mjs, request-spec.mjs. Previous identity,
finalizer, header-copy and admission work is preserved. Child actor and runtime
routes are unchanged this phase. No native build/package/install/stage/commit,
profiler, agent or owner-browser actions occurred.

No public JavaScript/DOM/WebIDL surface, request header/method/response, preference
or default page marker is added. Tests intentionally instrument only owned pages
and actors, restoring wrappers. The shortcut removes Umbrafox's own unnecessary
wait without changing the original request-dispatch decisions. Functional tests and
unchanged source regions are bounded evidence, not universal stock-Firefox parity,
server timing equivalence, extension compatibility or GPU performance proof.

The index preserves existing exact origin matching for valid records and introduces
no global/referrer or private/container policy. Malformed data is unknown. Arbitrary
privileged code replacing modules or bypassing publication is outside this internal
bookkeeping contract, which is not a security sandbox.

## Artifacts And Next Gate

Prefix: `artifacts/umbralink-control/request-fastpath-`. Final logs:
`combined-first.log`, `lint-verified.log`, `browser-final.log`, `absence.log`,
`regions.log`. REDs and earlier runs remain separate. Nine-file source archive:
`request-fastpath-source.tar.gz`; seal: `request-fastpath-final.sha256`.
Older source seals remain historical and must not be rewritten.

Next: a controlled baseline/candidate busy-thread comparison on quiet wyatt-laptop,
using an explicitly identified test artifact with these exact modules and all
prerequisites. Existing sealed laptop packages predate this change; do not mutate
them or substitute a dirty tree for provenance. Keep balanced/reversed ordering,
uninstrumented controls, native-directory/cleanup receipts, exact bodies and separate
page/parent clocks. The earlier 100-ms pilot demonstrated lost network overlap,
not 100 ms added fetch completion. This checkpoint adds no performance measurement.

Matching-no-handler, YouTube playback, layout attribution and hardware readback/pixel
gates remain within the active full performance goal. Daily browser stays untouched.
