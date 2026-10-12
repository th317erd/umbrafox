# Local performance survey tools

The isolated runner exercises an existing Linux x86 Umbrafox binary through its
private UmbraLink service. It creates a fresh profile, never attaches to the
user's browser, and does not build or install anything. The separately authorized
live playback sampler below attaches read-only. Neither adds browser interfaces.
Read the [measurement contract](../../../bot-docs/docs/performance/measurement-contract.md)
and [catalog](../../../bot-docs/docs/performance/catalog.md) first.

**Browser execution hold, 2026-09-27:** the first extended lifecycle run exposed
crash-ping maintenance using application data outside the fresh profile. Do not
run the capture commands below until the owned application-data correction and
native directory-resolution proof have passed review. Failed TLS attempts are
not proof of no upload. Do not inspect or clear shared crash queues. See the
[containment finding](../../../bot-docs/reports/performance/2026-09-27-lifecycle.md#application-data-containment).

## Tests and capture

### Authorized live playback sampling

Only with the owner's permission, `capture-playback.mjs` attaches to an existing
UmbraLink endpoint and reads one explicit tab context. It never launches, closes,
navigates or pauses the browser, changes preferences, or starts the profiler.
Use the actual profile discovery file; it contains a secret and must not be
printed or published. The context must be a visible playing video tab for useful
playback intervals. The page read uses no layout getters or persistent listeners.

```bash
timeout 80 node tools/umbrafox/performance/capture-playback.mjs \
  /absolute/profile/umbrafox/control.json CONTEXT_ID /absolute/new/output 31
```

There are 2..31 samples with a two-second wait between serialized media/process
reads, a 75-second deadline, and bounded per-call waits. Output is owner-private;
each sample has a 512 KiB limit. Only allowlisted media/process fields are saved:
source URLs are hashed in memory, and tab titles, page URLs, headers, discovery
tokens and request bodies are not written. `environment.json` identifies the
reported build. A successful capture has `summary.json`; absent summary means
partial evidence, not success. Existing output directories are rejected.

Analysis excludes paused, hidden, seeking, ambiguous, changed-document/source/
resolution/rate and invalid/reset-counter intervals. No-frame-advance is not
called smooth. Frame drops use interval deltas, never lifetime percentages.
CPU counters are nanoseconds and use their separate process-read timestamps;
100 percent means one core. Raw thread counters permit later thread deltas.
RPC durations are retained. Their cost, serial sampling skew, between-sample
events, PID reuse and same-source element replacement remain limitations.
Buffered endpoints do not prove uninterrupted buffering; frame counters do not
measure physical scanout or identify the cause of stutter.

`media-debug.mjs` provides a separate one-shot native decoder read through the
existing browser-realm script command. Obtain the current document ID with a
page-realm read first, then use a new nonce for each explicitly authorized query:

```js
import { randomUUID } from "node:crypto";
import { mediaDebugRequest } from "./media-debug.mjs";
const reply = await control.request(
  "umbrafox.script.execute",
  mediaDebugRequest(context, documentID, randomUUID())
);
```

It invokes Firefox's privileged `mozRequestDebugInfo()` from a one-shot closure
in the existing frame message-manager global, with no delayed-load registration,
page globals or page listeners. This avoids retaining a new anonymous frame
scope for each read. Parent reply listeners and timers are removed on completion
or timeout. The waits are bounded (child 3 seconds, parent 4 seconds, control
6 seconds); they do not cancel native work already requested. Use it outside
timed intervals, not as a polling loop. Saved projections should use only
`reply.result.value`, not the outer envelope's page URL. No EME/session data or
native addresses are projected. Hardware state can be retained after decoder
shutdown; names and state must be read together. Drop counts are lifetime
counters, not interval measurements or a proof of the cause of stutter.

### Isolated fixtures

From the repository root:

```bash
timeout 120 node --test tools/umbrafox/performance/test/*-spec.mjs
node tools/umbrafox/performance/run.mjs \
  --binary /absolute/path/to/dist/bin/umbrafox \
  --output /absolute/new/private/run-directory \
  --profile off \
  --bus /absolute/path/to/wave-bus.txt
```

The binary must be an ELF executable with adjacent `libxul.so` and
`application.ini`, not a launcher. The output parent must exist; the run directory
must not. The bus contains `OK`; `HALT` aborts work. Defaults are seven trials,
two warmups and a 120-second deadline. Optional flags are `--trials`, `--warmup`
and `--timeout-ms`. Invalid/duplicate options fail. Never reuse an output path
after failure or remove failed evidence to make a rerun look successful.

The runner now creates separate private `app-data` and `local-app-data` children
for every suite and forces the existing Gecko environment overrides to them.
Original output and child identities are retained in `provenance.json` under
`applicationData`; final checks reject replacement or populated child roots
before spawn. The output spelling and existing parent must be canonical. HOME
is unchanged, partial directories are preserved, and no ambient-data fallback
is allowed. This verified harness behavior does not lift the native-verification
hold above or establish general filesystem/network isolation. Earlier captures
lack this boundary and must retain that limitation.

Run a second independent `--profile off` process, then a separately labeled
`--profile on` capture. Profile-on timings are attribution only. All four
workloads must satisfy exact checksums: arithmetic, batched layout, interleaved
layout and canvas copy/readback. The deliberately forced-layout workload is a
measurement control, not proof of an engine bug. Headless canvas is not a
hardware-rendering or physical-presentation test.

The runner preserves binary/fixture hashes, environment, diagnostics, raw samples,
summary statistics, bounded logs, process ownership and cleanup result. Record
source/dirty provenance separately; do not infer it from the executable path.
`run.json` must say `passed` and cleanup `clean`. Cleanup uses SIGTERM only after
matching owned PID/start/parent/group/session evidence, never a blanket process
kill. Failed cleanup remains a failure and requires inspection.

Snapshot RPCs precede/follow timed fixture work. Bus polling and ordinary fixture
User Timing marks remain active. Seven correlated in-process trials, millisecond
web timer rounding and an actively used host do not establish a release score,
tail latency or zero measurement overhead. The canvas case includes a deliberate
readback; do not extrapolate it to a readback-free presentation path.

## Profile analysis

Use `profiler-cli`, not an ad hoc parser of raw Firefox profiles. Load the saved
`profile.json` into a unique owned session. Keep captures local. The following
symbol-server override prevents external symbol lookups; unresolved native
frames remain unknown unless a verified local symbol server is substituted.

```bash
profiler-cli load /absolute/run/profile.json \
  --session my-owned-survey --symbol-server http://127.0.0.1:9
profiler-cli profile info --all --session my-owned-survey --json
profiler-cli profile markers --search local-perf --limit 100000 \
  --session my-owned-survey --json
```

Identify the actual fixture thread from those markers, explicitly select it,
then export again without zoom or marker filtering of the full thread export:

```bash
profiler-cli thread select t-N --session my-owned-survey
profiler-cli profile markers --search local-perf --limit 100000 \
  --session my-owned-survey --json > /absolute/evidence/phases.json
profiler-cli thread markers --list --limit 0 \
  --session my-owned-survey --json > /absolute/evidence/thread-markers.json
node tools/umbrafox/performance/analyze-markers.mjs \
  --phases /absolute/evidence/phases.json \
  --markers /absolute/evidence/thread-markers.json \
  --output /absolute/evidence/new-analysis.json
profiler-cli stop --session my-owned-survey
```

Replace `t-N` with the observed handle; never reuse a handle from another profile.
The analyzer expects seven trials/two warmups unless `--expected-trials` and
`--expected-warmup` match a different recorded capture. It validates companion
marks, phases, thread/window identity, export counts and boundaries. It reports
per-family counts, clipped and union durations, not a sum of overlapping families.
Missing families are unknown, and complete export enumeration does not establish
complete profiler-buffer retention. GC markers are thread-only attribution.

In the verified CLI 0.10.0 export contract, marker times are zero-based but
`context.rootRange` retains its original offset. The analyzer compares the two
original contexts, then uses capture bounds `[0, end - start]`. Do not compare
exported starts directly with raw-root sidecar times: add `rootRange.start` to
the exported start, or subtract it from the sidecar bounds. Durations do not
change. Retain matching inputs; equal marker counts cannot certify clock
alignment, complete raw pairing or absence of synthesized incomplete edges.

For sample analysis, marker-search commas mean OR, not AND. Use separate
`filter push --during-marker` operations for `local-perf:trial` and a workload
name when their intersection is required. Check session/filter state before
interpreting percentages. Stop only your session even after an analysis failure.

## Userland cache diagnostic

The optional suite uses fresh processes with `none`, `disabled`, `unrelated` or
`visited` userland state on two owned loopback origins. It forces the same bounded
ScriptLoader logging in every cell, requires profiler OFF and never overrides
cache preferences. Run cells separately, not concurrently:

```bash
node tools/umbrafox/performance/run.mjs \
  --binary /absolute/path/to/dist/bin/umbrafox \
  --output /absolute/new/private/cache-none \
  --profile off --bus /absolute/path/to/wave-bus.txt \
  --suite userland-cache --userland-case none --timeout-ms 180000
node tools/umbrafox/performance/analyze-userland-cache.mjs \
  --input /absolute/new/private/cache-none \
  --output /absolute/new/private/cache-none-analysis.json
```

Use seven trials/two warmups for the strict analyzer. Exit 0 means its evidence
gate passed, 2 means a saved inconclusive result, and 1 means invalid evidence,
arguments or output. Analysis output must not exist. A failed capture is not a
zero-outcome measurement. `fixture-state.json` preserves bounded server state on
PASS/FAIL when available; snapshot errors fail the run but do not skip owned
cleanup. Synthetic fixture URLs remain in private evidence; control credentials
are scrubbed. No request bodies are saved by failure snapshots.

The first completed no-record/disabled/unrelated controls verify memory-cache
suppression, not elapsed-time impact or disk-cache behavior. The visited-origin
cell uses an awaited userland DOM sentinel observed by a page-realm readiness
POST. Earlier request-options failures remain preserved; see the
[current report](../../../bot-docs/reports/performance/2026-09-27-userland-cache.md)
for evidence and limits. This diagnostic suite is not a production benchmark or a
registry-publication/HTTP-observer instrumentation API.

## Lifecycle smoke

This suite uses the same launcher and private control channel, with fresh
profiles for `none`, `unrelated`, and `matching-no-handler`. Run `none` first;
continue only after a passed result, complete evidence and clean owned cleanup.

```bash
node tools/umbrafox/performance/run.mjs \
  --binary /absolute/path/to/dist/bin/umbrafox \
  --output /absolute/new/private/lifecycle-none \
  --profile off --bus /absolute/path/to/wave-bus.txt \
  --suite lifecycle --lifecycle-case none --lifecycle-plan smoke \
  --timeout-ms 120000
```

The fixed schedule is two warmup cycles and two batches of five cycles, with
two sequential iframes per cycle: 40 documents, 76 receipts, 24 frame loads and
removals. Three held checkpoints wait at least ten seconds before serialized
private snapshots. Matching userland must complete exactly once in every
document before the page fixture's first script. Unrelated is explicitly
`configured-unrelated`, not proof of consumed active state. Generic trials and
warmup defaults in `run.json` do not control this fixed schedule; explicit CLI
overrides and profiler ON are rejected. The smoke deadline cannot exceed
120 seconds; the separate fixed NONE soak is described below.

Only this suite clears `startup.homepage_welcome_url` and its `.additional`
preference in the temporary profile. Before release, it waits for the fixture's
held initial receipt and its exact selected browser tab/context. Setup diagnostics
are serialized, capped at 300 attempts and share the original 30-second startup
deadline. `lifecycle-setup-*.json` preserves raw observations before validation.
Empty tab lists are not successful admission; unexpected tabs fail immediately.

The separate legacy policy notice is controlled by the existing
`datareporting.policy.dataSubmissionEnabled=false` setting in this suite only.
It also denies policy upload eligibility; this is not a UI-only change or proof
that all network activity is disabled. It does not suppress every separate
Terms of Use flow. No notification/consent bypass is enabled. Actual observed
admission remains mandatory even when these settings are present.

`lifecycle-isolation-*.json` checks the exact current HTTP document in existing
before/checkpoint/after performance snapshots. Known extension background pages
and the privileged new-tab page are recorded separately. Existing diagnostics
also check selection/context before work and at checkpoints 0 and 2; checkpoint
1 and the after boundary explicitly lack that coverage. No checkpoint RPC was
added for these checks. This is sampled document admission, not proof of no
outbound requests, no background work or complete memory attribution.

Provenance records binary-adjacent userland modules, including the actors under
`moz-src/toolkit/actors` and their registration module. Missing files remain null;
source-tree fallback is forbidden. These hashes identify available loose files,
not proof of which modules a running process loaded.

The aggregate deadline includes a 15-second cleanup reserve and a final
two-second report reserve. Preflight requires 4 GiB available memory and 1 GiB
free artifact storage. Passive five-second safety reads revalidate owned process
identities and cap RSS, process/FD/thread counts, host pressure and artifacts.
`lifecycle-preflight.json` records the limits. Evidence reserves are 54 MiB
ordinary files, 8 MiB logs and 2 MiB terminal reports; a payload-cap failure must
not consume the terminal reserve. Unknown ownership/resources fail closed.

Review `lifecycle-checkpoint-*.json`, `lifecycle-attribution-*.json`, the baseline
and resource samples, `samples.json`, `fixture-state.json`, and final `run.json`.
Checkpoint RPC times and serialized sizes are recorded. Summed VmRSS safety
totals, Linux ProcInfo resident-minus-shared estimates, parent-local memory
reporters and controller resources have different meanings; do not combine
them. Missing process coverage remains explicit. No forced GC or memory dumps
are used.

An `unsettledCleanup` record is a failure, not proof an OS operation was canceled.
SIGKILL is never automatic. Preserve failed captures and diagnose before trying
again. A successful smoke proves the tested schedule/controls only, not object
ownership, a memory-leak slope, a long-session fix, zero observer cost or a
performance improvement. See the [lifecycle checkpoint](../../../bot-docs/reports/performance/2026-09-27-lifecycle.md).

## Bounded NONE soak

The `soak-30m` plan is available only for `none`, with profiler OFF. It uses one
fresh browser and the same fixture page bytes as smoke. Do not start it until
the combined unit/lint gates, independent review and a fresh short integration
run have passed. It is not a browser repair or a general duration override.

```bash
node tools/umbrafox/performance/run.mjs \
  --binary /absolute/path/to/dist/bin/umbrafox \
  --output /absolute/new/private/soak-none \
  --profile off --bus /absolute/path/to/wave-bus.txt \
  --suite lifecycle --lifecycle-case none --lifecycle-plan soak-30m
```

Do not pass `--timeout-ms`, `--trials`, `--warmup`, or an observer selector. The
immutable plan fixes 102 cycles, 318 documents, 204 frame loads/removals and 624
receipts. Eleven checkpoints hold for 60 seconds, nine times 120 seconds, then
300 seconds. The 30-minute total includes cleanup and the terminal report;
phase admission reserves every remaining hold plus 150 seconds of finalization
work. Slow or failed work stops the run instead of shortening these holds.

All eleven checkpoints require both performance and diagnostics snapshots,
including selected context, and after diagnostics is also required. The minimum
28 snapshot calls include one accepted setup diagnostics reply. Actual calls
total `27 + setup attempts`, or `28 + additionalSetupRPCs`; discovery/connection
work is separate. Exact current-document admission stays strict: a retained foreign,
duplicate or previous document does not become an accepted window. No browser
RPC runs during active fixture work or the mandatory quiet interval. Passive OS
safety sampling continues, so this is not a zero-observer baseline.

The existing 256 MiB artifact/profile limit, resource limits and cleanup
ownership rules remain unchanged. Resource history is capped at 384 records and
512 retained PID identities, with skipped sampling slots counted rather than
replayed. Ordinary evidence is capped by category within 54 MiB, including the
two copied INI files; logs retain 8 MiB and terminal reports an independent
2 MiB. Soak fixture JSON must fit 887347 bytes after scrubbing and formatting.
Only bounded error text may be clipped, with an explicit flag; required
observations cannot be truncated to fit.

Preserve every STOP, including ordinary cache growth reaching the artifact cap.
A capped run is censored, not a leak verdict. Review its evidence and cleanup
before separately deciding on an identical repetition. Userland soaks, repeated-
read observer controls and two-hour plans are not implemented or authorized by
this command. See the [canonical plan](../../../bot-docs/plans/performance-program.md)
for the schedule, file limits and acceptance gates.
