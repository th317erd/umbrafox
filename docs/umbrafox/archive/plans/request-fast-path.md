# Request Fast Path

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Objective And Authority

Continue the authorized performance campaign by removing needless request-channel
suspension and content-process queries without skipping explicit userland work.
Default Firefox web interfaces, request shape and behavior remain mandatory.
No owner-browser changes, installation, build, profile inspection or headed test
are authorized by this plan. Isolated headless functional tests and the existing
bounded laptop measurement route are available.

Baseline: October3 busy-thread pilot observes request starts delayed until a100ms
content task ends after explicit observer installation, even with an empty
registry. This is lost network overlap, not100ms added fetch completion or a
YouTube diagnosis. Document-identity prerequisite:396Node/71Gecko assertions pass;
see reports/performance/2026-10-03-request-document-identity.md. Worktree is dirty;
base commit alone does not describe the candidate. Preserve earlier seals.

## Territory And Invariant

BrowserGlue loads the registry; publication updates prefs/shared data. The parent
actor matches document scripts, the child actor receives document insertion and
calls the promised runtime entry. Provided, promised and registry-based runtime
entries converge on runDocumentUserlandScripts. That function creates the private
controller/API before the runner executes scripts. Direct constructor callers in
production search are confined to that runtime; browser and Node tests also
construct controllers. Powerful privileged user scripts can import internal
modules, so native constructor admission must enforce the invariant too.

The parent observer selects the current WindowGlobal actor, suspends the channel,
serializes headers, queries, applies the decision and resumes. A null reply says
nothing authoritative about retained capabilities or side-effect-only handlers.
Request controllers now have document-scoped weak entries, but the other three
maps and parent actor routing are unchanged.

Invariant: before a native document can obtain a usable controller, its exact
parent actor has monotonically recorded request capability. Registry disable,
off(), null decisions and GC cannot erase that record. Native WindowGlobal lifetime
owns it, including actor recreation and a retained/BFCache document; new documents
get new state.
This is internal bookkeeping, not a page-visible API or security sandbox against
arbitrary privileged browser modification.

## Phase 1: Capability Admission

Files: EventController, ScriptRuntime, UserlandParent, existing userland tests,
and one new capability-spec.mjs. No child-message shape change or request shortcut.

- Parent accepts GrantUserlandRequestCapability only for positive native
  manager/context IDs exactly matching the message. It sets a private monotonic
  flag before returning those IDs. Normal nonempty document-script replies also
  set that flag before providing scripts.
- EventController exports prepareUmbrafoxUserlandRequestCapability(window),
  returning null for no WindowGlobal and a shared acknowledgement promise for a
  native WindowGlobal. Weak-keyed state tracks pending/ready; failure permits a
  later explicit retry. Validate both reply IDs before marking ready and return
  a frozen identity receipt. Runtime passes that receipt to construction, rejecting
  navigation even if the new document has separately acquired a valid grant.
- Native controller construction requires ready admission for the same captured
  WindowGlobal/context. Unprepared construction throws before any hook/API.
  Non-native supplied test contexts retain their original synchronous behavior;
  this fallback is never negative authority for a real request.
- All runtime entries wait for preparation before constructing the controller
  and exposing userland. Empty script lists remain immediate and do no admission.
  Existing parser blocking surrounds that promise. Complete-document explicit
  execution still works. No script is allowed to run on a rejected grant.
- The initial implementation adds one acknowledgement per native document using
  explicit scripts, not per request. Reusing the existing startup reply may be a
  later measured simplification, not a hidden untracked admission route.

Tests first: native construction before/during grant rejects; successful native
IDs admit; wrong/missing/nonfinite IDs, actor rejection and synchronous send failure
reject; repeated calls share one query; failure can retry; navigation while waiting
does not admit the new document; parent state survives empty registry replies and
duplicate grants; all three runtime entries await acknowledgement, parser promise
and empty/non-native behavior are unchanged. Keep document/finalizer/header tests.
Actual Gecko: native iframe navigation and existing HTTP, mutation, navigation,
document-start suites. Add parent actor-state receipts to the real test. A mock
pass alone does not pass this phase.

## Phase 2: Synchronous Negative Decision

After phase1: add initialized parent registry membership indexed at publication,
not a repeated per-request script scan. A known nonmatching document may bypass
only with exact positive request/WGP/context identity and no granted capability.
Unknown initialization, unsupported schemes, missing IDs, mismatch, pending or
failed authority remain on the original path. Parent grant is monotonic and
happens before API availability, so retained synchronous on/off cannot race a
stale asynchronous handler-count cache. No last-null cache or global-empty bypass.

Before code, verify registry update failure semantics and current native load-info
identity roles. Verify native actor recreation and BFCache lifecycle: capability
must not outlive the parent record that guards bypass. A new actor's false flag is
not itself sufficient proof. Move authority to native-document lifetime or retain
unknown/fallback where needed. Test matching/unrelated/empty, publication changes, granted then
disabled, side-effect-only handlers, redirects/cancellation, startup ordering,
actor loss, private/container/frame separation and retained documents. Count
suspend/header/query/resume operations, not only returned values. Constructor and
every runtime route must be in these tests. No final certificate for unknown IDs.

## Phase 3: Measurement And Integration

Diagnostic-artifact route: make new private paired copies of the sealed October3
native package, never rewrite the original export or installed browser. Both
copies use identical native files and runtime prerequisite. Baseline is the
archived phase1 capability state; candidate is archived phase2. Rewrite their
root omni.ja with Mozilla's JarWriter and preserve entry order, compression and
preload layout. Full file/member manifests must show exactly the controller,
registry and parent actor differing between copies. This is no native build or
release installation. Candidate packaged functional gate:218Gecko assertions;
original files and both diagnostic trees reverified after the run.

Measurement schedule: two traced routing controls (baseline then candidate),
then eight unwrapped fresh processes in ABBA/BAAB order. Each runs six alternating
idle/100ms-busy loopback fetches before and after explicit observer installation.
Use identical page bytes, no-store responses, page clock and native identity.
Traced baseline must record0/6queries; candidate0/0. Unwrapped query populations
are explicitly unobserved, not reported as zero. Performance results themselves
are not acceptance assertions: retain mixed/null outcomes. Require the pre-observer
network-progress control before attributing a delayed start to interception.
Actor wrapping is absent from timing runs. Source checks, private app-data proof,
resource caps and exact owned cleanup remain required for every process.

Repeat the fixed workload on quiet wyatt-laptop using sealed candidate identity
and fresh owned roots. Establish actual zero-query/zero-suspend negatives and
unchanged real handlers, exact bodies, native directory proof and clean cleanup.
Use balanced/reversed process ordering and observer controls before an aggregate
performance claim. No page/parent clock subtraction. YouTube and hardware readback
remain separate campaign branches, not replaced by a successful network pilot.

## Verification Commands And Completion

Pure focused: timeout30 node --test --unhandled-rejections=strict
tools/umbrafox/tests/userland/*-spec.mjs (redirect each run to a new task log).
Combined: timeout60 node --test --unhandled-rejections=strict
tools/umbrafox/performance/test/*-spec.mjs tools/umbrafox/tests/*/*-spec.mjs
tools/umbrafox/tests/*/test/*-spec.mjs. Exact-file registered lint under60s.
Gecko: unchanged artifacts/umbralink-control/run-mutation-browser.mjs with adjacent
dist/bin/umbrafox and adjacent argument,165s outer/150s child bounds. Verify terminal
result and all owned root PIDs absent. Preserve failing-first and runtime failures.

Each phase is a separately reviewed delta, not a whole-tree revert. Do not stage,
commit, rebuild or install during this plan's code/tests-only work. Update plan
status, continuity and a dated evidence report after verification. Completion
requires real request behavior and controlled measurements, not merely green mocks.
Current status: phases1/2 implemented, uninstalled, with432Node tests,218real Gecko
assertions and clean six-file lint. Native actor recreation, actual BFCache restore,
cross-origin frame, container/private and late-handler cases pass. Capability is
native-WindowGlobal scoped; publication indexing is unknown on failure or reentry.
Explicit native IDs gate the synchronous bypass. Constructor implicit native context
and reentrant publication regressions were reproduced and corrected.
Evidence: reports/performance/2026-10-03-request-fast-path.md and
reports/performance/request-fast-path/dod-evidence.md. Phase3 controlled measurement
now has a paired diagnostic artifact and10verified laptop runs. See
reports/performance/2026-10-03-request-paired-measurement.md. Busy request-start
medians are101-102ms baseline versus1-2ms candidate in eight unwrapped processes;
strict response-progress controls remain incomplete due equal reduced-precision
request/response timestamps. Next specify a shared bounded server delay and repeat
the balanced method without pooling these workloads or weakening the control.
Existing installed packages still do not contain these modules. Overall rendering/layout/CSS/JS goal remains active,
including matching-no-handler and hardware work; a never-capable fast path is an
increment, not a redefinition of completion.
