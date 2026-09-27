# Local performance survey tools

These tools exercise an existing Linux x86 Umbrafox binary through its private
UmbraLink service. They create a fresh profile, never attach to the user's
browser, and do not build or install anything. They add no browser interfaces.
Read the [measurement contract](../../../bot-docs/docs/performance/measurement-contract.md)
and [catalog](../../../bot-docs/docs/performance/catalog.md) first.

## Tests and capture

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
