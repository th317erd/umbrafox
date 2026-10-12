# Inactive Userland Mutation Gate

## Result

The native DOM mutation gate now reads Firefox's always-updated preference
mirror instead of performing a named preference lookup for every mutation.
The existing `umbrafox.userlandScripts.active` key and false default are retained.
The candidate is built, packaged, tested and **not installed**. No work-browser
tab, extension, setting, profile or launcher was changed.

With an explicit false preference, the median of three process medians fell
from 36.65 to 1.71 ns per gate call. A minimal native text-node update fell from
78.80 to 44.94 ns. These are approximately 95% and 43% reductions in these
specific synthetic operations, **not browser-wide or YouTube improvements**.
Saving 35 ns a thousand times is only about 0.035 ms; an actual page's call rate
and competing work still need measurement before attributing stutter.

The subsequent [page-principal sandbox comparison](2026-10-03-page-dom-workload.md)
now supplies two completed, oppositely ordered laptop batches. Across the two,
median process-median durations are lower by 14.3-16.3% for detached text,
15.4-18.1% for attached text, 5.5-7.7% for attributes and 10.9-11.8% for child
lists. All 1280 correctness samples pass. These ranges describe two synthetic
batches, not a confidence interval or browser-wide speedup. The JS control
changes direction, and no JIT/layout/video gain is accepted. The packages remain
uninstalled pending their other gates.

The later [Window-realm comparison](2026-10-03-window-dom-workload.md) removes
that sandbox measurement limitation. Text improvements repeat, while batched
layout is slower in both mixed batches. The
[isolated-layout follow-up](2026-10-03-isolated-layout.md) does not reproduce
that penalty's magnitude with longer warmup and no competing cases; attribution
is still pending. These separate fixture versions must not be pooled.

## Mechanism And Boundaries

`UmbrafoxUserlandMutation::ShouldDispatchMutation` already returns before
creating strings, property bags or dispatching observers when scripts are
inactive. Its remaining prefix called `Preferences::GetBool` each time.
`CharacterData`, `Element` and `nsINode` use that gate for their custom hooks.

The production delta is restricted to:

- `dom/base/UmbrafoxUserlandMutation.cpp`: use the generated mirror getter.
- `modules/libpref/init/StaticPrefList.yaml`: declare the existing key as a
  false-default `RelaxedAtomicBool` with `mirror: always`.
- `modules/libpref/moz.build`: register the generated `umbrafox` pref group.

The registry still publishes the same preference. No script matching,
request-channel suspension, source-cache policy, payload or callback behavior
is changed. The ScriptLoader and docshell readers still use their original
`GetBool` paths. This is not a cached no-handler/request-decision shortcut.

The local `PreferencesImpl::NotifyCallbacks` updates static mirrors before
ordinary preference observers. Tests cover that ordering. Cross-process
preference delivery is still asynchronous: browser tests wait for the child to
receive the value before checking mutations. The patch does not claim to make
parent-to-child publication instantaneous.

Registering the existing key also supplies a default entry before registry
publication. Previously, the no-user-value benchmark started with an absent
key. This changes the meaning and cost of that reference lookup, so the two
states are reported separately. No claim is made that all preference readers
became faster.

## Measurements

The opt native gtest constructs an unattached HTML document and text node.
It runs eight rounds of four rotated modes, one million operations per mode,
in each of two preference states. Three fresh native processes run per build.
The modes are the native gate, direct preference lookup, volatile relaxed-atomic
control, and alternating one-character `SetData` calls. Text contents are checked
after each update round. The survey is disabled in ordinary test runs.

Numbers below are medians of the three independent process medians, in ns:

| State | Operation | Before | Candidate |
| --- | --- | --- | --- |
| No user value | Native gate | 22.52 | 1.78 |
| No user value | Direct preference read | 18.67 | 35.03 |
| No user value | Text update | 64.74 | 46.40 |
| Explicit false | Native gate | 36.65 | 1.71 |
| Explicit false | Direct preference read | 34.18 | 33.12 |
| Explicit false | Text update | 78.80 | 44.94 |

The volatile atomic control is about 0.16 ns per iteration in both builds.
The first, superseded survey used a nonvolatile private atomic which the
compiler optimized away; its control comparison is invalid and preserved.
Three later timing attempts refused to launch while build processes were
present. The accepted runner waits within a fixed bound for those processes
to disappear before starting each native run. This is admission sampling,
not exclusive ownership of the host or continuous absence proof.

Other limits: fixed before/after build ordering, three processes only, owner
workload remains uncontrolled, repeated rounds are correlated, and no confidence
interval or web-workload speedup is claimed. There is no JavaScript binding,
attached document, layout, paint, media playback or page observer in this native
text benchmark. The explicit-false label records the `SetBool(false)` action,
not an assertion that libpref retains a redundant user value.

## Correctness And Verification

Native tests pass in all three candidate processes: inactive decisions are
reset correctly; 64 enable/disable/reset notifications per process observe the
new mirror value inside the callback; all survey content checks pass.

The new `browser_userland_mutation_gate.js` runs five off/on/off/on/off states
in one live content document. Attribute rewriting, character-data rewriting,
child insertion veto, return values and exact handler-call counts follow the
current state. It passes on both the earlier sealed readback candidate and the
new candidate. The existing document-start and userland event suites also pass:
**59 assertions, zero failures** across the three files. The clean extracted
new package passes the five transition assertions separately.

All native/browser runs use fresh private application-data and local-data
roots. Browser runs use a fresh test-harness profile. The harness's temporary
profile paths are its normal `/tmp` behavior; durable receipts/logs remain on
`/home`. Mochitest uses automation and is a functional test, not a public-surface
parity or performance capture. Normal harness shutdown and absence of the
recorded browser/server/controller roots are verified. No continuous process
inventory, no-upload guarantee or race-free filesystem isolation is claimed.

Full two-job build passed in 75 seconds; gtest relink in 18 seconds; package in
107 seconds. Scoped native and browser lint pass with zero warnings. A preceding
test-only target failed because it did not generate the new preference-group
header; the normal build resolved that build-target prerequisite. An earlier
benchmark edit used the wrong `DocumentFlavor` namespace; its compiler failure
is also preserved. These are not product crash findings.

A first package check incorrectly required equality with the unstripped
`dist/bin` executable and rejected the difference. The configured packaging
step uses `llvm-strip --strip-debug`. All 46 extracted files instead match the
actual packaging staging tree byte-for-byte. The isolated version check passes,
and a ten-file checksum manifest seals the export. The rejected comparison and
corrected boundary are recorded in `packaging-verification.json`.

Detectability review: no new web-facing interface, global, marker, CSS behavior,
network rule or canvas result is introduced. The changed key is internal and
already existed. User-selected mutation effects stay on the existing userland
path. Tests establish the stated native and browser contracts, not universal
Firefox equivalence or all private/container/extension combinations.

## Evidence And Continuation

Under `/home/wyatt/.cache/codex/`:

- Invalid initial control: `mutation-gate-survey-20261003-TH3wKE`.
- Corrected baseline: `mutation-gate-survey-corrected-20261003-o6QeBZ`.
- Candidate: `mutation-gate-survey-corrected-20261003-DBE4Xd`.
- Final adjacent browser suites: `mutation-mirror-browser-final-20261003-T4HrXL`.
- Earlier-package transition control: `mutation-mirror-browser-final-20261003-hHXwcQ`.
- New-package transition test: `mutation-mirror-browser-final-20261003-FejxeQ`.

Commands, comparison JSON, logs and the final evidence manifest are under
`artifacts/umbralink-control/mutation-*`; the two reproducible drivers there are
`run-mutation-survey.mjs` and `run-mutation-browser.mjs`. Original failures are
retained. No commit, staging or existing package overwrite was performed.

The separate artifact is
`exports/umbrafox-mutation-mirror-candidate-20261003/`. It includes the earlier
readback-cache candidate and all pre-existing dirty source, not just this patch.
It shares the pinned BuildID `20261003071500` with the earlier candidate;
distinguish them by archive/libxul hashes and source snapshots, not BuildID alone.

Next: separately observe active playback and complete the bundled readback
candidate's GPU parity gates. The page report records the completed synthetic
comparisons; these do not substitute for representative page/video workloads.
The latest read-only YouTube check still found a hidden, paused video. One
headed GPU-candidate run has completed, but an additional same-headed baseline
window requires separate consent. Nothing here attributes YouTube stutter to
this gate, uBlock, request interception or background browser work.
