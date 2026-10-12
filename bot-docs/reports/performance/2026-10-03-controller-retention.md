# Controller Map Cleanup

## Result

The native userland controller maps now remove entries when their weakly held
controllers are finalized, rather than requiring a future lookup of the same
browsing-context ID. This is an uninstalled source candidate. It does not fix
or explain the owner's observed YouTube stutter, and no browser retained-byte,
memory-slope or frame-time benefit has been measured.

Before the change, a bounded source-level reproduction created 4096 controllers
with all four native hook types. After actual V8 garbage collection, zero
controllers remained alive but each map still contained 4096 dead weak-reference
entries: 16384 entries total. Looking up one dead ID removed one entry from each
map; looking up every dead ID cleared them. Thus the reproduction demonstrates
stale bookkeeping, not retention of those controller objects or their windows.

After the change, three rounds of the same 4096-controller population each
return all four maps to zero without dispatching another lookup. These are
actual-source Node/V8 collector checks with fake Gecko services and windows,
not SpiderMonkey collector or real-document lifetime evidence.

## Change And Contract

`toolkit/components/umbrafox/UmbrafoxUserlandEventController.sys.mjs` contains the
four maps and every registration/lookup consumer. All four registrations now
use `registerNativeController`; existing lookup-driven deletion remains intact.

- A single finalization registry is allocated lazily on first native registration.
- Its held record contains the map, numeric ID and weak reference, never the
  controller or window. The cleanup callback is module-scoped, outside the
  registration frame.
- Cleanup deletes an entry only if its reference is still the exact registered
  reference. A delayed callback cannot delete a newer controller for that ID.
- Replacing a live registration unregisters its old cleanup token. Repeated
  registration of the same controller/map does not allocate another reference
  or registry record.
- No observer is unregistered. No pagehide/BFCache policy, handler lifetime,
  request suspension, source-cache admission or document matching is changed.
- Removing and re-adding handlers on a live controller still works. A null
  request decision still does not mean no handler ran.

Finalizers are nondeterministic: this is not a hard bound on cleanup latency or
memory. There is additional registry bookkeeping for live entries. Whether
that tradeoff reduces real session memory needs a controlled active-userland
churn experiment. The no-hook path creates no registry or controller entries.

## Verification

New permanent tests:
`tools/umbrafox/tests/userland/controller-spec.mjs`.

The behavioral failing-first run was 3 passes and 13 failures. The final focused
suite has 17 passes, covering all four maps, delayed old cleanup, replacement,
repeated registration, independent live contexts, no-context/no-hook cases,
lookup-before-finalization, handler off/on and side-effect-only null decisions.
Its weak-reference/finalizer controls are deterministic fakes.

The combined strict-unhandled tooling suite passes **330 tests**. Exact two-file
ESLint, license, whitespace and trojan-source checks report zero errors/warnings;
the scoped diff check is clean. The actual-GC check separately passes three
rounds, clearing all 16384 entries each round.

Final real headless Gecko regression: **59 assertions, zero failures**, using
the existing mutation-gate, userland-events and document-start suites. The
object-directory module resolves directly to the edited source. This verifies
existing hook behavior and parser ordering, not finalized-map counts in Gecko.
The final run took 6.544 seconds under a 150-second inner bound and used fresh
private application-data roots. Browser PID1083921, harness PID1083736 and three
reported helper roots were absent after completion. The earlier pre-format
regression also passed; its evidence is retained.

No C++ build, package, installation, owner browser/tab change, extension change,
profile inspection, profiler session or network performance test was performed
for this correction. Existing sealed packages remain unchanged and do not
contain this new JS correction.

## Evidence

Repository-local evidence root: `artifacts/umbralink-control/`.

- `controller-retention-check.mjs`, `.json`, `.stderr`: original reproduction;
  the script expects the old source behavior, not the corrected module.
- `controller-finalizer-red.log`, `controller-finalizer-green.log`:
  initial focused failure/pass runs.
- `controller-finalizer-all-tests.log`, `controller-finalizer-final-lint.log`:
  final combined tests and scoped lint.
- `controller-finalizer-gc.mjs`, `controller-finalizer-final-gc.json`,
  `controller-finalizer-final-gc.stderr`: final real V8 collector checks.
- `controller-finalizer-final-browser.log`: final browser invocation/cleanup.
- `controller-finalizer.sha256`: final source, test and selected evidence seal.

Final browser evidence:
`~/.cache/codex/mutation-mirror-browser-final-20261003-Juve6w/`, specifically
`mochitest.log` and `receipt.json`. The older run is suffix `1c1feK`.

Original module SHA256:
`d7e4056ff2bc4d837c9664a534124d9c82da84d04894858454023f0a8b541261`.
Final module SHA256:
`97ec22ce11f277d4737d652cabc8f865db714d30da6f6a7a0d1305a891b63061`.
Final test SHA256:
`7f72925679b6fab13197b1c351498f6e4cf7e4ebae8bcff5b9e5f1f4b95367f1`.

## Parity And Remaining Work

The change exposes no new page globals, properties, APIs, messages, preferences
or diagnostics. Request/cache/DOM consumers are unchanged. Only already-dead
controller bookkeeping is removed; live replacement identities are preserved.
Default no-userland behavior is unchanged. Existing native interception tests
provide selected regression coverage, not universal stock-Firefox parity.

Do not equate this with fixing the separate context-versus-document authority
issue, removing the process-global observer, or providing a cached no-handler
fast path. Those require the authority and race work described in PERF-005.
Do not force periodic GC in the browser to obtain apparent memory improvements.

The next useful memory gate is exact real-document/controller churn with
intentional retention and BFCache controls, followed by settled map/heap evidence.
The active rendering work still needs foreground stutter capture and consented
hardware-path validation; this bookkeeping result supplies neither.
