# Unrelated-origin compiled-script cache control

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

Status: cache suppression observed; runtime cost and repair remain open.
Session `perf-night-20260927`, local x86 headless diagnostic runs. No personal
browser, Pi, native build, preference-forced cache path or public browser API.

## Controlled observations

The owned fixture creates origins A and B on separate loopback ports. A holds
the optional userland record; nine successive new B documents load one stable
344,921-byte classic script and verify checksum `8386560`. Two warmups and seven
trials are retained. Navigation uses new documents, not hard reload or BFCache.
Every process uses `MOZ_LOG=timestamp,sync,ScriptLoader:4`, profiler OFF, a fresh
profile and otherwise identical harness settings. These are diagnostic counts,
not comparable release timings.

| Fresh-process case | No-memory-entry outcome | Memory hit | Active-userland bypass | Target HTTP requests | Result |
| --- | ---: | ---: | ---: | ---: | --- |
| No records | 1 | 8 | 0 | 1 | PASS |
| Disabled record for A | 1 | 8 | 0 | 1 | PASS |
| Enabled record for A, never visit A | 0 | 0 | 9 | 1 | PASS |
| Enabled record, visit A before B | 0 | 0 | 9 | 1 | PASS after fixture repair |

All four current cells each have nine exact execution results, one observed
source PID, complete saved-log byte accounting with zero dropped bytes and clean
owned-process termination. The strict analyzer passes all four. Pointer IDs are
log-local and may be reused; associating outcomes with documents remains
conditional on the validated sequential fixture, not an authoritative window-ID
join. A memory-cache miss is not independently measured compilation time.

This corroborates the global `umbrafox.userlandScripts.active` checks in
`ScriptLoader::TryUseCache`, `StartLoadInternal` and `CalculateCacheFlag`.
Enabled userland on an unvisited origin suppresses the observed document stencil
cache reuse. **It does not disable the HTTP cache:** all three cells fetch the
target once. Disk-bytecode persistence, all module/JIT caches, IPC costs and
end-to-end slowdown are not measured here. The active flag is proven consumed
at the logged lookups, not published before every startup request.

## Preserved failures and fixture boundary

`cache-visited-1` exceeded its 180-second deadline before B. A bounded follow-up,
`cache-visited-2`, retained the same fixture and binary with server-side failure
snapshots and a 30-second deadline. Both cleaned up correctly with no log loss.
The second trace records A root/start script, a **GET** to `script-ready` returning
404, then A gate returning 409. The configured userland code requested POST with
a JSON body. There was no recorded OPTIONS preflight. The earlier CORS-preflight
hypothesis is therefore unsupported by this trace.

The browser remained responsive to its private diagnostics during the first
failure. This is not evidence of a browser freeze, memory leak, or renderer crash.
The source of the request-options mismatch is under separate review; no native
request behavior has been changed to make the fixture pass. Failed runs are not
converted into zero cache outcomes or deleted. The new harness preserves bounded
request metadata, without request bodies, before final teardown on PASS and FAIL.

The repaired fixture awaits a promise in userland, sets a per-run DOM attribute,
then requires the page's own startup script to observe the exact attribute before
sending the readiness POST. That POST and the gate/navigation chain are awaited
in the page realm. Missing/wrong sentinels and failed/rejected readiness responses
cannot advance the gate in focused tests. This is test-page content and an
explicitly configured userland script, not a new public browser interface.

`cache-visited-3` then passed. Repeated `cache-none-2`, `cache-disabled-2` and
`cache-unrelated-2` reproduce the original outcomes with the same repaired fixture,
runner, native binary and available runtime-module hashes. These four current
cells form the table above; earlier failed evidence remains intact. Source review
of `ChromeObjectWrapper` and WebIDL dictionary reads supports a cross-realm
request-options explanation, but no native wrapper path was instrumented. The
new sentinel does not prove privileged-sandbox POST dictionaries now work.

## Identity and evidence

- HEAD `44f0ad5f3277a51138cba9dd11aeb3a61d5a31c9`, pre-existing native dirty work.
- Executable SHA256 `7736ff10efefc2e539b6a51653a66da3f0d51332a3921a4e413e4d4e26525913`.
- libxul SHA256 `1458e213e47e1afb2142117d2176e0aa7236410c31b5569fbcc3e92ed76c74a7`.
- Embedded toolkit BuildID `20260925185028`; adjacent INI BuildID
  `20260925185126`. These are recorded separately, not silently equated.
- The unpackaged developer runtime has source-linked JS modules. Each run attempts
  six adjacent registry/store/runtime/controller/actor identities; four module
  paths are hashed and both actor paths are explicitly unavailable (`null`). This
  does not prove actor byte identity. Native ELF identity alone is insufficient
  provenance; packaged module provenance remains an improvement for this tool.
- Private raw evidence: `~/.cache/codex/umbra-perf-20260927/cache-{none,disabled,unrelated,visited}-1/`
  plus the current `cache-{none,disabled,unrelated}-2/`, `cache-visited-2/` and
  `cache-visited-3/`; successful analyses are sibling
  `cache-CASE-1-analysis.json` files. Do not commit profiles or discovery tokens.
- Tools: `tools/umbrafox/performance/{run,userland-cache,analyze-userland-cache}.mjs`.
  Source/lifecycle tests live in the separate `test/` subtree.

## Next gate

The completion-sentinel fixture and fourth cell now pass without weakening the
ordered execution gate. A separate wrapper compatibility test remains useful.
Speculative script loading can precede document-start actor replies, so removing
the global cache guard or replacing it with a late per-document boolean is not
a justified fix. A repair needs authoritative document/policy identity, preload
ordering and invalidation tests before matched unlogged performance experiments.
