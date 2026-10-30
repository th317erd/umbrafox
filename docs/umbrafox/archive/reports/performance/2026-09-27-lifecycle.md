# Isolated lifecycle checkpoint

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

Status: three corrected smoke cells pass functional and sampled admission gates.
Not a long-session repair or an accepted memory comparison.
Catalog: PERF-006. No personal profile, Pi, public API or browser build changed.

## Contract and implementation

The existing local harness now has a `lifecycle` suite. It creates a fresh
private profile and two owned loopback origins, then uses UmbraLink for
serialized checkpoint snapshots. No second launcher or native collector was
added. The fixture uses ordinary page DOM/JavaScript; the matching cell's
awaited startup sentinel is explicit test userland customization.

Each cell has two warmup cycles followed by two five-cycle batches, two
sequential iframes per cycle, and three inert ten-second checkpoints. Exact
oracles require 40 document completions, 76 receipts, 24 frame loads/removals,
script/DOM/byte checksums and ordered requests. Matching startup completes once
in all 40 documents. `unrelated` is only configured, not authoritatively active.

The runner preserves process identity and SIGTERM-only cleanup, adds a maximum
120-second aggregate budget, resource safety sampling and independently
reserved terminal evidence. Unknown memory/ownership, cap failures, missing
coverage, dropped logs and unsettled cleanup cannot become passing evidence.
Summed RSS is safety accounting, not a private-heap or retained-object count.

## Verification and preserved failures

The initial combined frozen revision passes 172 Node tests and scoped
ESLint/license/whitespace/trojan-source checks. Independent review found and
required fixes for terminal evidence starvation and sequential server-close
initiation. Both have failing-first regressions. The review's mistakenly broad
test filter ran a harmless Node child test, whose cleanup passed; this is
recorded as a scope incident, not mislabeled pure validation.

An existing basic profile-OFF capture after the runner integration passes with
clean owned SIGTERM cleanup and zero dropped log bytes. The first lifecycle
`none` capture reaches eight completed documents, two cycles and four frame
loads/removals, then fails `Lifecycle quiet period ended early` at the first
checkpoint. It has clean owned cleanup and zero dropped log bytes. The held
receipt in its pre-cleanup fixture snapshot is not a failed-cleanup indication.

The exact elapsed quiet time was not saved. A timer waking slightly early is a
source-supported hypothesis, not measured timing attribution. The corrected
runner waits until a fixed monotonic ten-second deadline, repeating an early
wake with the same abort signal. The threshold and aggregate deadline are
unchanged. Failing-first tests cover fractional/repeated early wakes and aborts.
The final combined tooling suite passes 177 tests; scoped lint passes. Parent
verification passes 23 capture tests, and independent review passes 13 direct
fake-clock/abort checks. These counts overlap and must not be summed.

## Completed functional captures

Parent revalidation of the saved results passes the exact fixture validator.
Every cell completes 40 documents, 12 cycles and 24 iframe loads/removals, with
three complete process joins, clean owned SIGTERM and zero dropped log bytes.
Each recorded browser root is absent after cleanup. Minimum quiet intervals
below are host monotonic time before the first checkpoint RPC, not page timing.

| Capture | Startup completions | Minimum quiet interval | Functional result |
| --- | --- | --- | --- |
| `lifecycle-none-2` | 0 | 10000.125 ms | PASS |
| `lifecycle-unrelated-1` | 0 | 10000.901 ms | PASS, configured-unrelated only |
| `lifecycle-matching-1` | 40 | 10000.050 ms | PASS |

The snapshots also contain an unexpected external Firefox Privacy Notice tab.
This is an uncontrolled background workload despite the correct fixture and
cleanup results. It blocks isolated memory comparisons and longer-run admission.
Do not interpret the observed RSS changes as a leak or userland overhead.
Those captures used ordinary fresh-profile startup behavior; the harness wrote
only the two UmbraLink preferences. Preference values alone are not evidence of
isolation.
Original captures remain intact; no product default is changed.

The bounded harness correction now clears the two welcome-page preferences only
for lifecycle captures and requires a held initial receipt plus an exact selected
fixture tab/context before release. It saves raw observations and uses the same
startup deadline, with at most 300 serialized setup polls. Existing performance
snapshots require the exact current HTTP document; known internal background
windows are recorded separately. Selection/context is checked where existing
diagnostics supply it, before work and at checkpoints 0 and 2; checkpoint 1 and
the after boundary remain explicitly unobserved for selection. No new checkpoint
RPC or network-blocking preference was added. The combined suite passes 188
tests in worker and parent runs. Corrected actor paths identify available
adjacent modules, not proven loaded modules; older null provenance entries are
not rewritten.

The first corrected runtime attempt, `lifecycle-isolated-none-1`, still fails
startup admission before any fixture request or workload release. Its third
setup observation contains two `about:blank` tabs whose labels identify the
fixture and Privacy Notice destinations. Both welcome preferences are recorded
as empty. Cleanup is clean SIGTERM with zero dropped log bytes, and the browser
and controller root PIDs are absent. This proves the two settings are insufficient
for this artifact, not that the validator should permit the second tab. The
matrix was held for startup-producer review before a separately reviewed correction.

Source review identifies a separate `TelemetryReportingPolicy` first-run tab
producer. The actual adjacent module and `TelemetryUtils` mapping confirm that
`datareporting.policy.dataSubmissionEnabled=false` makes both the legacy
notification predicate and policy upload predicate false. The next bounded
correction adds only that setting to lifecycle profiles, not a notification
bypass. It changes internal reporting policy for this test profile; it is not
telemetry-neutral, a network firewall, or a guarantee against the separate TOU
flow. The strict observed-admission guard, other suites and product defaults
remain unchanged.

## Corrected observed-admission captures

The single-setting correction passes the combined 188-test suite and scoped
lint. Parent review checks that removing only the new preference line reproduces
the previously reviewed runner hash. Three fresh, sequential captures then pass:

| Capture | Startup completions | Minimum pre-RPC quiet | Maximum sampled artifact bytes |
| --- | ---: | ---: | ---: |
| `lifecycle-isolated-none-2` | 0 | 10000.692 ms | 205942562 |
| `lifecycle-isolated-unrelated-1` | 0 | 10000.530 ms | 200154960 |
| `lifecycle-isolated-matching-1` | 40 | 10000.438 ms | 237704818 |

Each completes 40 documents, 12 cycles and 24 frame loads/removals. Parent
revalidation accepts all five exact HTTP-window observations, three available
tab/context checks, three minimum quiet intervals and eleven resource samples.
Each uses five setup diagnostic attempts. All have clean SIGTERM cleanup, zero
dropped log bytes and absent recorded browser/controller root PIDs afterward.
Known extension background pages and the internal new-tab page remain recorded;
the earlier Privacy Notice document is absent from these admitted observations.

These are sampled admission results, not continuous isolation or outbound-network
proof. Selection/context at checkpoint 1 and after remain unobserved. The
configured-unrelated cell still lacks a positive consumed-active-state oracle.
The largest sampled artifact leaves 30730638 bytes below the unchanged 256 MiB
cap; this is not a prediction of longer-run cache growth. Independent saved-data
review accepts these captures as bounded functional, discrete-admission and
observed-safety evidence. This admits the next fixture implementation decision,
not longer execution, memory comparison or performance acceptance. Complete logs
retain namespace-permission and SWGL framebuffer warnings; no successful hardware
rendering or warning-free sandbox claim follows.

Observed diagnostics report app BuildID `20260925185028`, whereas both adjacent
INI files record `20260925185126`. Recorded and current executable, libxul, INI,
fixture and adjacent-module hashes match. Keep runtime identity and adjacent
metadata separate; do not claim one common BuildID or full current-tree parity.

Evidence root: `~/.cache/codex/umbra-perf-20260927/`.
Preserved captures: `lifecycle-integration-basic-off`, `lifecycle-none-1`, and
the three completed functional captures above.
Logs and freeze manifests: `/tmp/codex/teamwork/umbra-perf-20260927/`.
The renderer source is dirty; runtime uses the existing x86 binary, whose
identity and loose userland module hashes are recorded in each capture.

## Bounded NONE extension

The fixed `soak-30m` implementation passes 233 combined Node tests and exact
seven-file registered lint. Independent frozen-code review accepts the schedule,
byte limits, deadline reserves, sampled admission and failure paths. Review found
and required failing-first corrections for missing diagnostics, lost partial
checkpoint evidence, resource-timeout restarts and optional-INI output errors.
The resource monitor prevents new sampler invocations and late evidence after
failure; already-started OS reads may continue until a cooperative abort check.
No physical cancellation claim follows from its bounded wait.

Fresh integration captures on that frozen revision pass:

| Capture | Result | Duration | Cleanup |
| --- | --- | ---: | --- |
| `soak-integration-basic-off` | Four workload oracles pass | 4.807 s | Clean SIGTERM |
| `soak-integration-none-smoke` | 40 documents, 12 cycles, 24 frame loads/removals | 35.701 s | Clean SIGTERM |

Both have zero dropped log bytes and absent recorded browser/controller roots
afterward. The short lifecycle run passes five HTTP-window observations, three
available context checks and three quiet intervals of at least ten seconds.
Its eleven resource samples pass the existing limits; maximum sampled artifact
size is 232066489 bytes, leaving 36368967 bytes below the unchanged cap. This
is not a guarantee of longer-run headroom.

The new `lifecycle-soak-none-1` capture completes in 1451.616 seconds, including
24 minutes of required quiet time, within its 30-minute aggregate deadline.
Parent saved-data revalidation passes 102 cycles, 318 documents, 204 frame
loads/removals, 624 receipts and 1260 recorded requests. All eleven checkpoints
pass the exact current-document/context and quiet-time checks, with eleven
joined process identities and none omitted. Before/after admission also passes.
Five setup attempts give 32 snapshot RPCs under the declared formula.

All 302 resource samples pass the existing safety limits. The maximum sampled
artifact size is 213173746 bytes; maximum summed VmRSS is 1457745920 bytes.
These are sampled safety quantities, not heap ownership or a memory slope.
The monitor records eleven historical PIDs, zero missed slots and no pending
read at completion. The fixture projection is 395556 bytes. Owned SIGTERM
cleanup is clean, all eleven recorded browser-process PIDs and the controller
PID are absent afterward, and the 2708-byte log has zero dropped bytes.

No concurrent campaign browser, compiler or profiler ran. Parent supervision
read saved artifacts without additional browser RPCs; the existing coordination
monitor, OS resource sampler and source/documentation work remained observers.
This is not a zero-observer baseline.

The log contains crash-reporter background-task failures and Glean upload
attempts failing certificate validation, including retries. Preserve these as
observed background work and attempted network activity. They do not by
themselves prove a browser crash, identify a payload/destination, or establish
that no other upload succeeded. The earlier reporting-policy preference was
never an all-network prohibition. No TLS bypass has been applied.

Independent completed-evidence review accepts the functional, discrete-admission
and sampled-safety checks only. It reproduces 13 HTTP and selected-context
admissions, all eleven required quiet intervals, the 32-RPC accounting and
302 resource records. Five-second sampling cannot exclude transient reporting
helpers or between-sample peaks. Neither clean cleanup of the recorded processes
nor a zero-drop log establishes complete process or network isolation.

## Application-data containment

All further browser execution is held. Source inspection establishes that
`CrashService` initializes `CrashManager` at profile startup, and its delayed
maintenance can launch `crashreporter --ping-cleanup` against
`UAppData/Crash Reports`. The optional profile argument supplies preferences,
not that queue's storage root. This route can process queued pings without a
new crash. A fresh `-profile` therefore does not isolate all application data.
Historical or personal queued data is a source-supported possibility, not an
observed payload attribution. No shared queue or payload was accessed to resolve
that uncertainty.

The standalone uploader reads `datareporting.healthreport.uploadEnabled` from
`prefs.js`, defaults to enabled, and does not use the lifecycle reporting-policy
guard. `MOZ_CRASHREPORTER_NO_REPORT` does not guard the JS cleanup path. Disabling
Glean uploads against an existing store can still generate a deletion-request
ping or clear stored state, so changing consent in the shared store is not an
acceptable containment substitute. Exit status 3 denotes a background-task
exception here; the log does not establish its exact cause or a native crash.

The corrective harness scope is child-only `MOZ_APP_DATA` and
`MOZ_LOCAL_APP_DATA`, each forced to a distinct, newly created private directory
under the owned run root. The native directory provider reads those overrides
before legacy/XDG fallback. Creation, ownership, mode, identity and emptiness
must be checked before launch and recorded in provenance. This changes neither
HOME nor product defaults and does not introduce a browser interface. Source
support and embedded variable names are not runtime proof: independent review
and observation of the actual native resolved directories remain required.

The three-file harness correction is now implemented and independently reviewed.
`createOutputRoot` rejects aliases before creating the output and retains its
initial identity; child application directories are exclusively created at mode
0700, recorded with the effective environment, and checked against those same
identities immediately before launch. Partial failures retain evidence and do
not fall back to ambient paths. Both worker and parent combined Node runs pass
247 tests, with exact-file lint clean. Independent review passes 36 additional
in-memory cases and resolves the original output-identity finding. These are
Node/filesystem and source results, not native browser path proof or an atomic
sandbox against concurrent same-user replacement.

An existing Firefox Marionette chrome-context route can return the actual
parent's directory values and process/build identity. It needs explicit broad
system-access admission on an unauthenticated loopback automation listener and
runs after startup. The parent has requested owner approval for one separate
bounded diagnostic using fresh owned data; approval is pending. This route must
not be presented as a performance rerun, a pre-consumer proof, or evidence that
no earlier access occurred. Browser execution and repetition remain stopped.

Detailed immutable review records are retained in campaign scratch as
`soak-evidence-review.md`, `background-log-review.md`, `appdata-review.md` and
`appdata-parent-route.md`. The first run and all earlier failed captures remain
unchanged. Application-data relocation is not a general network or filesystem
sandbox and does not by itself disable newly generated reporting.

## Remaining gates

Keep all earlier failures intact. Obtain the separate diagnostic authorization
and complete native path verification before deciding on another capture.
Neither the short runs nor a single longer run establishes a leak, a stable
memory slope, weak-map ownership or elimination of the owner's long-session
freeze. Observer-control and userland soaks remain deferred.
