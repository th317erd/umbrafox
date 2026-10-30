# Umbrafox Engineering Handoff

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

Prepared for Wyatt and the next engineering bot on 2026-09-30. This is a
continuation guide for the Umbrafox performance and isolation investigation,
not authorization to launch browsers, build, install, or change product defaults.
Wyatt is pausing Codex work because of token availability, not abandoning the
project. Preserve the work and evidence; do not restart the investigation.

## Read This First

The last completed action was a successful, separately authorized native
application-data directory diagnostic on September 27. It proved that the
running browser parent resolved both application-data roots into fresh owned
directories. The browser, Python client, and privileged listener were cleaned
up and independently checked absent. **No subsequent performance rerun was
authorized or performed by this coordinator.**

The next decision is how to resume the performance program safely given the
remaining limits of that proof. It was post-startup, not evidence of no earlier
shared-directory access or no network upload. Read the containment section before
launching anything. Native probe ON compilation is independently on HOLD.

This handoff was checked against the current checkout and durable evidence on
September 30. Historical runtime results below are September 27 observations,
not fresh device/process checks. No tests, browser runs, builds, or Pi probes
were performed while writing this handoff.

## Workspace And First Read Order

- Host/workspace: `/home/wyatt/Projects/umbrafox-workspace/umbrafox` on the desktop.
- Git branch: `main`.
- Current HEAD: `892431809a4caadb5c73b2c03ad9bdb124c3e21e`,
  `No bug - Add isolated performance controls and evidence catalog`.
- Previous relevant commit: `44f0ad5f3277`, UmbraLink media/performance diagnostics.
- This is a large Firefox-derived repository with substantial staged AND
  unstaged work. HEAD alone does not identify tested native code or deployed Pi
  code. Do not reset, stash away, stage everything, amend, or clean the tree.

Read in this order:

1. `~/.bot-common/startup.md`, its required global context, and repository
   `AGENTS.md`. Follow the bootstrap and AGIS instructions rather than relying
   on this handoff as a substitute.
2. `.codex/DETAILS.md`. Its final entries supersede earlier pending-permission
   statements. This handoff additionally records the September 30 loss of `/tmp`.
3. `docs/umbrafox/conversion-guide/02-mandatory-modification-rules.md` before any
   Umbrafox implementation change.
4. `docs/umbrafox/archive/plans/performance-program.md`, the canonical staged program and
   appended P2/P4 contracts. Read the whole relevant phase, not only its header.
5. `docs/umbrafox/archive/docs/performance/{README,measurement-contract,instrumentation,catalog}.md`.
6. `tools/umbrafox/performance/README.md` and the reports linked below for the lane
   being resumed. Capture examples in that README are documentation, not current
   permission to run them.

## Product Rules And Working Constraints

Umbrafox must remain Firefox-equivalent by default on web-visible surfaces:
UA, DOM, JS, CSS, WebIDL, network, media, storage, workers, timing and performance
interfaces. Prefer interception/substitution over detectable blocking. Powerful
explicit userland customization is intentional, but that does not waive default
equivalence. Discuss and document any exception with Wyatt before implementing.

- Existing opacity/rendering experiments remain source-default OFF. The owner's
  separately selected Pi ON configuration is not permission to change defaults.
- Retain failed pixel tests and other failures. Benefit with pixel FAIL is still
  experimental, never a production correctness result.
- No blanket kill commands, SIGKILL escalation, personal-browser attachment,
  personal-profile reads, shared crash-queue reads/deletion, or TLS bypass.
- Use owned PID/start/parent/group/session identities before signaling; cleanup
  failure is a failed run, not permission to guess a process group.
- Commands must be bounded. Preserve full slow-command output in a file, then
  inspect it; do not rerun expensive work merely because output was filtered.
- No new source/object-tree copies for convenience. Program limit is two source
  copies total; actual current global usage must be checked before any proposal.
- Cargo work uses at most two jobs unless explicitly authorized otherwise.
- Search Firefox upstream with `searchfox-cli`; local searches should be narrow
  and justified by locally changed files. Read directory-specific instructions
  before work under `gfx/wr`, `js`, `layout`, NSS, etc.
- Use existing project skills for frontend, lint, profiling, commits and other
  specialized work. Do not silently bootstrap/download/update tools under a
  bounded investigation that excluded those actions.
- Do not build/package/install/push merely because a test passed. Normal owner
  build workflow eventually includes packaging and verified installation, but
  those actions were expressly excluded from these diagnostic lanes.

## Evidence And Coordination Locations

Use these abbreviations throughout this handoff:

```text
REPO=/home/wyatt/Projects/umbrafox-workspace/umbrafox
EVIDENCE=/home/wyatt/.cache/codex/umbra-perf-20260927
REPORTS=$REPO/docs/umbrafox/archive/reports/performance
TOOLS=$REPO/tools/umbrafox/performance
```

Durable evidence remains present under EVIDENCE. It includes large profiles,
run directories, saved JSON, source audits and independent reviews. Do not commit
profiles, tokens, personal data, or wholesale raw runtime directories.

**Important September 30 discovery:** the following old coordination paths are
now absent, verified by direct path checks:

```text
/tmp/codex/teamwork/umbra-perf-20260926/progress.sqlite
/tmp/codex/teamwork/umbra-perf-20260927/
```

Consequently the old bus, freeze manifests, test logs and DB event history at
those paths cannot currently be read. Do not invent their contents or say they
were reverified today. Durable reports preserve historical results and some
hashes, and the actual source remains available. If another authorized team wave
starts, create a NEW explicit wave/bus/DB and reconnect workers; do not silently
recreate the historical database as if its evidence survived.

Historical session was `perf-night-20260927`; DB used `teamwork_tasks` and
`teamwork_events`. Its schema differed from generic helper assumptions: tasks
had no priority field and there was no teamwork_agents table. Monitor task reads
needed manual supplementation. Last coordinator monitors were stopped/exited;
do not reuse historical exec/session IDs or assume bots/listeners are alive.

## Current Git Work Is Deliberately Mixed

September 30 `git status --short` still shows mixed staged and unstaged changes:

- Staged tooling/docs milestone, with later unstaged corrections/extensions in
  some of the SAME files (`MM` and `AM` statuses).
- Performance harness: helpers, runner, lifecycle fixture/capture and their
  tests; marker analyzer and tests; performance README.
- Canonical performance plan, catalog, measurement contract, conversion recipe
  and reports.
- Dirty native opacity/readback/probe changes in `dom/canvas`, `dom/media/ipc`,
  `gfx/gl`, `gfx/layers`, `gfx/webrender_bindings`, `gfx/wr`, `widget/gtk`,
  `modules/libpref/init/StaticPrefList.yaml`, and toolkit configure/Cargo wiring.
- Untracked evidence exports, renderer sampling module, tests, several reports,
  conversion recipe16, and `.codex/DETAILS.md`.

Inspect BOTH `git diff` and `git diff --cached` for exact owned files before
editing or committing. Never assume all dirty native work belongs to the latest
probe patch. A coherent staged milestone is not equivalent to the current fully
tested working tree. This handoff does not authorize reorganizing that history.

These key working-file SHA256 values were freshly verified September 30 and
still match the last reviewed application-data correction:

```text
3f315d9d6f39d318e6f0e5e7ccbb2a6634f3ca62811434f3bc0c6222b91ddea2  tools/umbrafox/performance/helpers.mjs
836217b9488ffc6db8ae6360883c28ba3fc69eb52ab1a77b538fcf0e1b88dfa9  tools/umbrafox/performance/run.mjs
a07d2ac257c4dfd81e10020cf9aceefd0f356adf427076d9f11d94ff43e54eb7  tools/umbrafox/performance/test/harness-spec.mjs
fb0bd117f2f48306c350f5336ec76b54b29c460a6380963164ed44f962a4e2db  EVIDENCE/appdata-native-proof/diagnose.mjs
```

## Program Status At A Glance

| Area | Established | Still open |
| --- | --- | --- |
| P0 harness | Reusable fixtures, provenance, bounded evidence, owned cleanup and tests | Not a universal sandbox or release benchmark |
| Userland cache | Enabled unrelated userland suppresses observed memory stencil reuse | Cost, disk effects, authoritative safe repair |
| Request hooks | No-handler round-trip mechanism mapped | Magnitude and safe authority for bypass |
| Lifecycle | Three corrected smokes and one long NONE fixture passed bounded gates | Repeated isolated baseline, leak/slope claims, safe resumption |
| App-data containment | Code review/tests and one native parent-directory receipt passed | Earlier-access/no-network assurance and next runtime decision |
| WR probe gate | Patch, structural/state tests and real OFF crate checks | ON build environment, compile/ABI/package/release proof |
| Pi attribution | Increases localized inside Composite and callback batch | Narrow internal cause, unprofiled effect and correctness |
| Opacity prototype | Measured benefit in some research captures | Pixel failures, release correctness and default enable |

Catalog priorities are PERF-001 probe overhead/exclusion, PERF-002 opacity,
PERF-003 live-copy stalls, PERF-004 cache bypass, PERF-005 request round trips,
PERF-006 lifecycle, PERF-007 layout control, PERF-008 profiler effects, and
PERF-011 presentation. Remaining entries cover invalidation, backing transitions,
JS decomposition, input/IPC, CPU policy, import warnings and broader coverage.

## Immediate Handoff Topic Application Data Containment

### Why Browser Runs Were Stopped

The first fixed long NONE run, `EVIDENCE/lifecycle-soak-none-1`, completed its
fixture and sampled-safety gates in 1451.616 seconds with clean owned cleanup.
Its browser log nevertheless contained crash-reporter Glean upload attempts.

Source tracing established:

- CrashService's profile-after-change path touches Services.crashmanager.
- CrashManager schedules maintenance at roughly 57 seconds; cleanupPings uses
  `UAppData/Crash Reports`, not just the new profile directory.
- The standalone crash-reporter cleanup can process previously queued pings
  even without a new browser crash. A fresh `-profile` was insufficient isolation.
- It consults health-report upload state in `prefs.js`, not the harness's
  `user.js` declaration of reporting-policy state.
- `datareporting.policy.dataSubmissionEnabled=false` and
  `MOZ_CRASHREPORTER_NO_REPORT` do not block this JS cleanup route.
- Glean upload-disabled initialization can still send deletion requests or clear
  old stored data. Do not apply consent changes to a shared store as a supposed
  harmless no-upload fix.
- Exit3 means a background-task exception, not proof of a native crash. TLS/curl
  failure does not prove nothing was transmitted or no other attempt succeeded.

Shared/personal queues were NOT read, cleared, or attributed to a specific owner
payload. The possibility of old personal queued data was a source-supported
risk, not an observed payload finding.

Primary audits: `background-log-review.md`, `appdata-proof-design.md`,
`appdata-parent-route.md`, `appdata-review.md` under EVIDENCE.

### Implemented Harness Correction

Every suite/profile mode now forces child-only `MOZ_APP_DATA` and
`MOZ_LOCAL_APP_DATA` to separate newly created 0700 directories beneath the
exclusive owned run output. HOME/XDG and product defaults are unchanged.

`createOutputRoot` rejects lexical/ancestor aliases before creation, retains the
original owner/private/canonical dev/inode identity, and passes it through
provenance and final admission. `createApplicationData` makes fixed distinct
children exclusively, checks identity/ownership/emptiness and does not refresh
the original identity. Final pre-spawn checks reject replacement or populated
children. No fallback, repair, deletion or reuse on partial failure.

Historical verification: full strict tooling247 PASS; exact three-file lint
clean; independent36 fake-operation cases PASS. The reviewer caught the initial
main-path root-identity gap, and its regression was fixed before the freeze.
These are historical results, not a September 30 rerun; `/tmp` logs are now gone.

### Native Proof Completed

Read `EVIDENCE/appdata-native-proof/RESULT.md` and `run-1/run.json` first.

Wyatt's September 27 "Please continue" was explicitly scoped in chat to ONE
bounded diagnostic with a fresh profile and the existing Marionette chrome
context. It was not blanket permission for performance repetition.

- Start21:26:16.439Z, finish21:26:20.905Z, statuspassed, 4.466 seconds.
- Owned browser PID3421295, parent process type0, runtime BuildID20260925185028,
  version158.0a1 matched session capabilities and saved process identity.
- UAppData, Linux DefProfLRt and ProfD returned the exact expected owned paths.
- Original directory dev/inode/uid/0700 stamps matched after the query.
- Listener127.0.0.1:41211/inode25362183 belonged to that browser and stayed the
  same through the query. Python clientPID3421387 deleted its session and exited0.
- Browser stopped with owned SIGTERM; both root PIDs and listener were separately
  verified absent immediately afterward. These PIDs are historical, not targets
  for current signaling or present-day cleanup.
- Browser log183 bytes, zero dropped bytes; EPERM user-namespace and headless
  SWGL framebuffer warnings were retained.

Scratch contains `diagnose.mjs`, `contract.mjs`, `contract-spec.mjs`, `client.py`,
`client-spec.py`, RESULT and complete run-1 evidence. Tests:28 strict-unhandled
Node cases and4 fake Python client cases. Independent `native-review.md` records
two resolved P1 findings: unbounded awaited metadata/late-spawn handle ownership,
and an already-started promise rejecting after synchronous budget exhaustion.
The final wrapper observes late rejection in work AND cleanup paths. Sync spawn
retains the child before bounded identity admission; late admission cannot mutate
ownership or signal a PID. The review is source-only; actual receipt/cleanup was
verified by the coordinator, not independently rerun by the reviewer.

The driver has a60-second total/45-second work budget with cleanup reserve;
run-1 is exclusive. **Do not invoke it again or rename its output to retry**
without a new decision. It uses broad `-remote-allow-system-access`; loopback
Marionette is not token-authenticated. Session deletion alone does not close the
listener; browser cleanup is required.

The proof is post-startup and automation-marked. Adjacent xpcshell was rejected
because it uses a different directory provider. A userland child script is not
proof of parent directory resolution. There is no magic grace period before57s
that establishes safety. The proof is not preconsumer/no-upload evidence.

Accepted diagnostic limits: bounded waits do not cancel every underlying OS read;
the detached Python client had time/output bounds but not browser-tree resource
sampling; two raw adjacent INI copies were outside JSON evidence accounting.

## Local Runtime And Provenance

The desktop developer runtime used was:

```text
$REPO/obj-x86_64-pc-linux-gnu/dist/bin/umbrafox
binary SHA256 7736ff10efefc2e539b6a51653a66da3f0d51332a3921a4e413e4d4e26525913
libxul SHA256 1458e213e47e1afb2142117d2176e0aa7236410c31b5569fbcc3e92ed76c74a7
```

These are historical recorded artifact identities, not hashes recomputed while
writing this handoff. Recheck only when needed for a newly authorized use.
Runtime BuildID20260925185028 differs from adjacent INIs20260925185126. Preserve
both; do not force equality or claim current-source/native-build equivalence.
The developer tree has source-linked JS modules, so ELF identity alone does not
pin all runtime JS. Actor provenance was corrected to adjacent
`moz-src/toolkit/actors/UmbrafoxUserland{Parent,Child}.sys.mjs`; missing files remain
null without source fallback. ActorManagerParent was also recorded. Earlier
reports with null actors remain historical evidence, not silently backfilled.

Configured Python used for the proof:
`/home/wyatt/.mozbuild/srcdirs/umbrafox-a0680b76db69/_virtualenvs/build/bin/python`.
Existing in-tree Marionette imports worked without installation. No client
launcher/bin argument was used; it attached only to the verified owned listener.

## Lifecycle Harness And Results

Key modules: `lifecycle.mjs`, `lifecycle-capture.mjs`, `run.mjs`, `helpers.mjs`
and mirrored specs under `TOOLS/test/`.

Smoke is fixed:2 warmups plus2x5 cycles,12 cycles,40 documents,24 frame loads
and removals,76 receipts,3 checkpoints. Cases: none, unrelated,
matching-no-handler. Profiler/logging OFF; no generic trial/warmup overrides.
Every checkpoint waits a strict monotonic10 seconds; early timer wake is handled
by rewaiting until the original deadline, not relaxing the threshold.

Soak is fixed NONE-only `soak-30m`:102 cycles,318 documents,204 frame loads and
removals,624 receipts,942 steps,11 checkpoints. Holds total24 minutes inside a
30-minute bound;15-second cleanup and final2-second report reserve. It uses the
same framework, not a second launcher. No2h mode or repeated-read observer CLI.
Snapshot RPC count is27 plus setup attempts (minimum28), not always28.

Contracts include trusted immutable plan metadata, strict current-document
admission, bounded single-flight monitor,384 resource records/512 historical
PIDs for soak, per-file quotas and54MiB ordinary+8MiB log+2MiB terminal evidence.
Fixture serializer returns once-scrubbed bounded JSON; do not scrub/stringify it
again. Strict fixture projection limit887347 bytes. Total artifact cap256MiB;
ordinary cache growth hitting it is a censored stop, not a leak verdict.

Important repaired bugs retained in tests:

- Terminal evidence budget is reserved independently; ordinary overflow cannot
  permanently poison final run.json/fixture failure reporting.
- Both fixture HTTP servers initiate shutdown before awaiting either callback.
- Failed/partial checkpoints save already received raw replies without adding
  RPCs; primary failure is retained even if saving fails or throws null/undefined.
- Resource monitor latches failure/timeout and starts no new sampler; pending OS
  I/O may still finish, but cannot produce late evidence or restart sampling.
- Required soak diagnostics cannot silently take smoke's missing-context path.
- INI output-write ENOENT cannot masquerade as an absent input file.

Early smokes had an unselected Mozilla Privacy Notice tab. Empty startup tab
arrays were not readiness proof. Positive selected fixture context plus receipt
is now required before start, with bounded100ms setup polling. Two welcome prefs
alone did not suppress the separate TelemetryReportingPolicy first-run producer;
the lifecycle-only `datareporting.policy.dataSubmissionEnabled=false` correction
blocked that route, not all background reporting.

The corrected three cells are `lifecycle-isolated-none-2`,
`lifecycle-isolated-unrelated-1`, `lifecycle-isolated-matching-1`; read
`admitted-smokes-review.md`. Earlier failures/contaminated captures remain.
Smoke cp1/after selection/context are explicitly unobserved where diagnostics
were not collected; HTTP-window admission is not continuous isolation.
Configured-unrelated is not proof that the active registry was published.

First long NONE passed:318/102/204 counts,11 quiet checkpoints,13 HTTP/selection
observations,32 snapshot RPCs,302 resource samples,11 historical PIDs, clean
cleanup and zero drops. Review: `soak-evidence-review.md`. Its background upload
finding prevents treating this as fully isolated or repeating automatically.
No leak absence, growth slope, causal memory comparison, or optimization claim.

Other useful reviews: `soak-code-review.md`, `soak-contract.md`,
`lifecycle-review.md`, `isolation-review.md`, `smoke-evidence-review.md`,
`lifecycle-startup-producer.md`, plus repository lifecycle report.

## Userland Cache And Request Hooks

Read `REPORTS/2026-09-27-userland-cache.md` and
`2026-09-27-request-authority.md`.

Current cache cohort: `cache-none-2`, `cache-disabled-2`, `cache-unrelated-2`,
`cache-visited-3`, with sibling analysisJSON and `current-cache-cohort.json`.
Each has9 exact classic-script results,2 warmups/7 trials, stable344921-byte
target, checksum8386560, and one target HTTP request. No records and disabled
record show1 cold/8 memory hits; unrelated enabled and visited enabled show
9 active-userland bypasses. This is stencil memory-cache suppression, NOT HTTP
cache disablement, measured compile time, disk-cache attribution or elapsed win.

Visited1/2 failed at readiness and remain preserved. System-sandbox fetch options
appeared lost: observed GET404 then gate409, not a proven CORS-preflight cause.
Fixture repair uses an awaited userland DOM sentinel, followed by page-realm
POST and gate chain. ChromeObjectWrapper/WebIDL source supports a cross-realm
dictionary hypothesis; the sentinel is not a native wrapper fix.

`analyze-userland-cache.mjs` strictly validates saved complete evidence;
exit0 accepted,2 saved inconclusive,1 invalid input/output. Failed capture is not
zero outcomes. Pointer/document association is conditional sequential-fixture
reasoning, not an authoritative IPC/window join.

Do NOT simply remove the global active cache guard. Preloads/compilation can
precede document-start actor replies. A candidate exact-document authoritative
empty-match path cannot retroactively recover already-started requests and needs
registry readiness, policy epoch, controller lifetime and stale-reply tests.

No-handler request fastpath is also NOT a one-flag fix: null conflates no
controller/no handler/side-effect-only handler, synchronous on/off has no parent
publication, retained capabilities may be used later, and BC-only weak-map lookup
is not document identity. A possible never-capable exact-document empty subset
needs authority work and measurement first. Designs:
`cache-repair-design.md`, `request-fastpath-design.md`, `cache-sentinel-review.md`,
`cache-analysis-review.md`, `userland-state-proof.md` under EVIDENCE.

## Native Probe Gate And Build Hold

Read `REPORTS/2026-09-27-probe-exclusion.md`, EVIDENCE `release-gate-design.md`,
`probe-gate/checkpoint.md`, `bindings-preflight.md`, `native-env-route.md`.

Dirty implementation propagates opt-in `--enable-umbra-perf-probes` /
`MOZ_UMBRA_PERF_PROBES` through gkrust-shared, bindings, WR and Wrench. It gates
custom marker state/helpers/arguments as well as marker writes, with custom
marker eligibility rather than upstream Any-profiled semantics. Rendering,
opacity, shader/default behavior and upstream counters are outside this patch.
Before/after manifests and implementation-only diff live under `probe-gate`.

Structural/state/disabled-laziness tests passed. Real WR OFF and bindings OFF
Cargo checks passed. ON is NOT compiled/accepted. WR/bindings are excluded
workspace members for feature selection; the real member route is gkrust-shared
with roughly96 unconditional dependencies, not a narrow WR-only check.

Bounded prior attempts exposed NSS environment selection, style Python imports,
and mozglue bootstrap/environment gaps. Source-derived normal settings include
MOZ_TOPOBJDIR, configured build-venv PYTHON3, and exact
RUSTC_BOOTSTRAP=mozglue_static,qcms, but **these do not establish a complete safe
build environment**. Do not guess successive exports and retry. Normal target
compiler/linker/wrapper/sysroot/backend flags were not fully reconstructed.
No safe exact read-only target-context extraction route was established.
`mach environment` and make echo-variable do not capture all target-specific
exports; `mach cargo check` can execute export/generation. No export/bootstrap,
dependency/lock changes, new source copies or full build follows automatically.

Pending proof: reviewed build environment, real ON compilation, configure/ABI,
effective feature union, packaged exclusion, runtime correctness and observer
cost. OFF check and source grep are not release stripping or zero-overhead proof.

## Pi Graphics Attribution And Deployed Source

Physical Pi lifecycle belongs to `l8ros`, not this coordinator. Wyatt authorized
cross-project coordination; a teammate status message is not a new runtime
assignment. Reestablish current owner/device state before proposing any action.
Last historical restoration was Home/two tabs, HDMI100%, owner opacityON,
loggingOFF, profilerOFF; do not treat it as today's device inspection.

Latest durable handoff:
`EVIDENCE/pi-attribution-20260927/{HANDOFF,REPORT}.md` and
`nested-handoff/REPORT.md`, manifests, results and source receipts.

Deployed ARM Build20260926103749 is NOT base44f0ad5 alone. Exact frozen export:
`REPO/exports/pi-opacity-trial-20260926/` with result.json, README, source.patch,
source-before.sha256, SHA256SUMS and supplement identified by result/manifest.
Tracked patch SHA256:
`61cb4559189766e235a3b9e34bdb58384992582cd715c8777c40c94cf0955fb9`.
Supplement identity begins307f84c6. Read the actual manifest for its full identity.

It includes V2 scaled-readback repairs: eligible identity/full-source/linear/
integer downscale can request destination-sized BGRA and scale before ReadPixels,
including after provider demotion. **Withdrawn inference:** DMABuf involvement
alone does not imply source-sized8.29MB readback. Need actual ineligibility/failure
evidence before claiming fallback; eligible320x180 is230400 bytes.
Use frozen export patch, not the present dirty checkout, for deployed tracing.
Corrected source map: `EVIDENCE/pi-attribution-source-followup.md`.

Latest offline nested localization, from l8ros with retained raw edge/order and
same-document metadata joins:

| Scope median ms | Plain | Cached | Live copy |
| --- | ---: | ---: | ---: |
| Composite | 6.139 | 28.754 | 29.127 |
| Paired notifier remainder | 0.121 | 0.205 | 0.177 |
| Callback batch | not applicable | 2.466 | 25.743 |
| Paired tick remainder | not applicable | 0.672 | 0.528 |

Renderer populations560/568/530; callback populations473/408; no orphan pairs;
crossing Composite1/2/1 excluded; fixture document6442450946 joined across
parent/child. Broad increases localize inside Composite and callback batch,
not their surrounding scopes. They remain wall time, not GPU/CPU/copy-stage cause.

Profiler overhead is material: reported drops7.44/9.43/16.03% with profiling,
versus OFF-before4.11/5.46/11.02 and OFF-after2.48/4.81/10.10. Unprofiled RDD CPU
cached1287/1312ms versus live4445/4490ms per20s was another lead, not exclusive
decode attribution. Preserve prior title-truncation and Pi raw-decode OOM failures;
heavy profile processing was moved off Pi. Requested4M profiler entries actually
clamped to16M/128MiB in that pinned build.

Next useful graphics question is narrow existing internal spans or a separately
reviewed private observation inside Composite/callback stages, respecting V2
eligibility and observer effects. Do not remove fences, alter sync, or optimize
buffer lifetime on these broad medians alone.

## Profiler Clock And Pairing Traps

Use the repository profiler-analysis skill and supported profiler-cli tooling.
Any newly authorized local load MUST explicitly set
`--symbol-server http://127.0.0.1:9`; an earlier daemon advertised the default
external symbol endpoint, so historical unconditional no-upload claims were
withdrawn. Unique owned session; bounded load/work; stop in finally; verify actual
owned process/socket absence, not just session-list emptiness.

Installed CLI0.10.0 exports marker starts minus `context.rootRange.start`, while
context itself retains raw root range. Convert exported timestamps by adding
the root start, OR subtract the offset from raw-sidecar bounds. Durations do not
change. Equal counts do not validate matching interval membership.

Initial Pi window comparisons missed71.135646ms. Corrected saved-export analysis
changed boundary members; notifier medians/tails happened to stay numerically
equal. Canvas PresentTexture became289 contained+1 crossing, not290 contained.
Reviews/scripts: `clock-correction-review.md`, `clock-correction/`,
`profiler-pairing-contract.md`, `composite-partition-review.md`.

Supported CLI exports omit incomplete/raw-pair provenance. Derived marker index
is a sorted full-list index, not a raw pair-array index. Matching Composite and
Runnable counts were therefore insufficient for the earlier strict partition.
The later l8ros nested handoff separately supplies explicit raw-order provenance;
do not conflate that result with what CLI alone proved.

The DOM marker analyzer had a guard comparing normalized timestamps with raw
context bounds. Corrected to validate equal finite ordered original contexts,
then `[0, end-start]`;50 focused tests passed historically. Saved final verified
pair reproduced the entire published result unchanged (4 vs640 layout markers).
Read `clock-impact-review.md`; do not pool the earlier and final exports with
different window IDs/counts. Marker-only validation did not revalidate all sample
percentages. Marker-search comma means OR; intersection needs separate filters.

Source map caveat: EGL compositor does not override WaitForGPU; base returns
true. EGL surface lock/SwapBuffers is earlier. A GPU-wait marker is not proof of
an EGL fence bottleneck. Cage/nested compositor adds a stage but no proven60-to30
cap. Keep mode.refresh0 distinct from presentation feedback.refresh0. Mesa source
audit did not prove distro binary/GDK/Zink behavior or physical scanout timing.

## What To Do Next

1. Read this handoff and current plan; inspect narrow diffs and preserve both
   index and working tree. Treat missing `/tmp` evidence as missing.
2. Verify durable reports/receipt against any proposed claim. The app-data
   diagnostic is complete; do not spend tokens rebuilding that investigation.
3. Present Wyatt a bounded next runtime decision if needed: what remains
   unproven about startup/shared-state and network behavior, what the intended
   run would measure, and the exact isolation/cleanup/evidence gates. A general
   request to hand off is not permission to lift the hold.
4. Meanwhile safe offline progress can prioritize the existing Pi internal-stage
   attribution or a reviewed normal native build-environment route. Do not
   authorize yourself to run their held runtime/build steps.
5. Once explicitly admitted, validate the final combined tooling tree before a
   fresh short control; only then consider repeated unprofiled baselines/soak.
   Never compare precontainment and postcontainment runs as interchangeable.
6. Keep P3 optimization proposals separate from P1 observations. Write a smallest
   falsifier and correctness oracle before changing engine behavior.
7. Commit only coherent reviewed units after inspecting staged/unstaged overlap
   and following Firefox commit/reviewer rules. Do not include raw private
   evidence. No new commit/push was made for this handoff.

Typical tooling test command, for a separately chosen verification step:

```bash
timeout 120 node --unhandled-rejections=strict --test tools/umbrafox/performance/test/*-spec.mjs
```

This suite includes local fixture servers and harmless real Node-child lifecycle
tests; it is NOT a pure supplied-data test. A source-only reviewer must not run
the full suite under that label. One earlier negative-lookahead test-name filter
unexpectedly ran a real-child case; the incident is retained in lifecycle review.
For pure review use direct supplied-data exports/fake operations. Read mozlint
skill for exact-file lint and avoid whole-tree formatting in this dirty checkout.

## Coordination And Contact Cautions

Historical coordinator name: umbra; workers: graphics, dom, js, local-harness.
They finished their assigned waves; do not presume their threads or websocket
ports remain active three days later. Direct coordinator bridge was
`/home/wyatt/Programs/codex-ws-message.mjs`, desktop port14522. Read teamwork skill
and discover/verify current endpoints before messaging. ACK actual new tasks,
not ACKs/status. Use explicit ownership, deadlines, holds and a fresh control bus.

`l8ros` on wyatt-laptop owns physical Pi work. Existing cross-project coordination
permission is recorded in `.codex/DETAILS.md`. Never inject tmux Enter unless the
input is positively empty: a prior handoff was appended to an owner's draft.
Prefer verified direct messaging. Teammate-reported owner authorization has a
scope; it does not silently authorize this bot to launch on Pi or lift desktop
holds. Do not expose tokens/credentials in a handoff or probe discovery files.

## Final Transfer Checklist

- Latest completed native receipt and cleanup are preserved, not pending.
- Further browser/performance repetition and native ON build remain held.
- Old `/tmp` DB/bus/logs are absent; durable source/reports/evidence remain.
- Key three harness hashes and scratch driver match the reviewed correction.
- Dirty native/source and mixed staging remain intact.
- No new runtime/build/agent wave was started to prepare this document.
- This handoff and `.codex/DETAILS.md` are the concise reentry points; canonical
  contracts and raw evidence govern any later detailed claim.
