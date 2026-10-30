# Independent Custom-Hook Review

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

Task `dom`, session `perf-20260926`, 2026-09-26. Read-only review in `/home/wyatt/Projects/umbrafox-workspace/umbrafox`; only this report and authorized progress DB entries were written. No source edits, builds, runtime/browser tests, installs, Pi operations or pushes. Previously read startup/rulebook/frontend/teamwork context remains applicable. Narrow local searches were confined to known Umbrafox additions and the new program documents; no upstream architecture was inferred from an absent search hit.

## Findings and Verdicts

### 1. Global script-cache policy: confirmed, but narrow the cache/ordering claim

**Observed producer:** `toolkit/components/umbrafox/UmbrafoxUserlandScriptRegistry.sys.mjs`, `publishUserlandScripts`, clones the script array and computes `clonedScripts.some(script => script?.enabled)`. It sets `umbrafox.userlandScripts.active`, initial process data, and shared script data. There is no origin, target-kind or installed-handler predicate in this Boolean. `browser/components/BrowserGlue.sys.mjs` calls the load/publish path during `_beforeUIStartup`; that load is asynchronous, so tests must verify published/effective state rather than assume startup completion.

**Observed consumers in `dom/script/ScriptLoader.cpp`:**

- `UmbrafoxUserlandScriptsActive` reads that pref, default false.
- `TryUseCache` treats inline requests as uncached first; for other requests, active=true calls `NoCacheEntryFound` and returns before `mCache->Lookup` and the memory-stencil hit path.
- `StartLoadInternal` sets `mFetchSourceOnly=true` under active=true. `PrepareCacheInfoChannel` then requests `kNullMimeType` instead of preferring the serialized-stencil alternate data. This selects source rather than bytecode alternate data; it is **not** evidence of bypassing ordinary HTTP cached source bodies or forcing an origin network fetch.
- `CalculateCacheFlag` marks the request not cacheable, drops its disk cache reference and returns when active=true. Downstream `TryCacheRequest` checks `IsMarkedNotCacheable`, clears the stencil and returns before inserting into the in-memory cache.

**Verdict:** when these paths read active=true, new eligible requests in an unrelated-origin document take the same Umbrafox branches even though that document has no matching source handler. This is source-confirmed scope broadening. Runtime frequency, baseline cache-hit eligibility, extra parse/compile time, IPC, network traffic and user-visible magnitude remain unmeasured.

**Required wording corrections:** use "document ScriptLoader memory-stencil/serialized-bytecode policy is global and independent of per-origin matching," not "all script/HTTP/JIT/module caches are disabled." Also replace the catalog's chronological "before per-origin userland matching" with "without consulting per-origin userland matching." Parser blocking can establish matching before some later page-script load; the proven issue is missing scope dependence, not universal chronological ordering. Module maps, workers, eval/JIT caches and already-in-flight requests were not established by this review.

### 2. Parent HTTP observer and no-handler suspension: confirmed with eligibility boundaries

**Observed producer:** `toolkit/actors/UmbrafoxUserlandParent.sys.mjs`, `receiveMessage("GetDocumentUserlandScripts")`, filters enabled scripts by exact HTTP(S) document origin and `targetKinds.includes("document")`. **Any** matching script, including one with no request handler, calls `ensureUmbrafoxUserlandRequestObserver`.

**Observed consumer chain:** `toolkit/components/umbrafox/UmbrafoxUserlandEventController.sys.mjs`:

1. `ensureNativeRequestObserver` is parent-process-only, uses a module Boolean to register once, and adds `nativeRequestObserver` to `http-on-modify-request`.
2. `nativeRequestObserver.observe` gets a browsing-context ID from channel load info, then `getRequestActor` obtains the context's current WindowGlobal's `UmbrafoxUserland` actor. Missing ID, missing/unsupported actor or failed lookup returns without suspension.
3. `dispatchParentRequestEvent` calls `channel.suspend()`, builds request fields including a full request-header visit, and awaits `actor.sendQuery("DispatchUserlandRequest", ...)`. There is no active-pref, origin-match, controller, or request-handler test before those operations. If suspend throws, the query is not sent.
4. `toolkit/actors/UmbrafoxUserlandChild.sys.mjs`, `receiveMessage`, forwards this message without an active-pref test. Only `dispatchUmbrafoxUserlandRequest` then dereferences the matching controller and checks `hasHandlers("request")`; missing/dead controller or no handlers returns null.
5. `applyRequestDecision(null)` returns true; the parent resumes the channel. Query rejection is caught and normally also reaches resume; actor aborts are treated differently for logging. There is no explicit local deadline in this await path. That does not establish an infinite stall; it establishes a reason to test a slow/destroyed actor and resume accounting.

`toolkit/modules/ActorManagerParent.sys.mjs` registers the actor for the browsers message-manager group, `allFrames: true`, without a userland-origin match list. No observer removal or registered-Boolean reset appears in the controller module; the inspected actors have no teardown method that unregisters it. Registry publication only updates pref/shared data, not this registration.

**Verdict:** after one matching document installs the parent observer, eligible HTTP observer callbacks can suspend/query/resume unrelated/no-handler documents. It persists across closing the activating page and publishing an empty script array within the same parent-process lifetime. It is **not** a claim that every browser request, non-HTTP channel, actorless context, worker or cache hit necessarily reaches this observer. A fresh browser with no scripts is not equivalent to a browser with no currently published scripts after prior activation. Effect sizes are unmeasured.

### 3. WeakRef map cleanup: confirmed; document leak is not established

The four module maps are `nativeNavigationControllers`, `nativeScriptControllers`, `nativeRequestControllers`, `nativeMutationControllers`. Each install method stores `browsingContextId -> new WeakRef(this)`. The only observed deletion sites are the corresponding observer/dispatch lookup when that **same key's** WeakRef dereferences to no controller. `removeEventListener` deletes a handler from its Set, not the context map entry, empty handler Set or global observer. No bulk sweep, finalizer or document teardown cleanup appears in the inspected controller/runtime/actor modules.

**Verdict:** dead-context numeric keys and WeakRef wrapper entries can remain for the lifetime of a reused process/module when those IDs are never queried again. Re-registering a handler in the same browsing context overwrites the same entry; it does not necessarily increase map size. Destroying a process ends that process's map lifetime. These entries do not strongly retain their controller merely because they are values in Map. The controller does contain `window` and handler references, so an independent strong retaining path would need separate proof before claiming a retained document or attributing OOM/freezes. Fresh distinct-context churn and same-context navigation are different tests.

### 4. Additional confounder: unrelated documents can wait on script discovery

`UmbrafoxUserlandChild.handleEvent("DOMDocElementInserted")` checks global activation, then always sends `GetDocumentUserlandScripts` and calls `runPromisedDocumentStartUserlandScripts`. That runtime wraps the reply and calls `blockDocumentParser` immediately. For a non-complete document it calls `document.blockParsing(promise, { blockScriptCreated: false })`, even when the eventual script array is empty. Parent filtering later prevents execution of nonmatching scripts, but does not prevent this earlier discovery query/parser wait.

This is source-confirmed additional work for eligible active-global/unrelated documents; no delay magnitude was measured. An end-to-end unrelated-origin A/B cannot attribute all change to cache policy. Separate parser-discovery intervals, actual cache outcome, request suspension and compilation.

`ScriptLoader::MaybeApplyUmbrafoxUserlandScriptSourceEvent` also has a process-local observer-existence condition before copying source and building a property bag. Once a source observer exists in that content process, copying/bag creation happens before the JS observer checks its per-context controller/handler. This is a second conditional source-copying lead, not an always-on claim: activation and a registered source observer are both required.

## Why Bypassing Caches Can Be Intentional

The current broad guard has a correctness purpose. `CreateOffThreadTask` decodes serialized stencils before the source-text path; `InstantiateClassicScriptFromAny` directly instantiates memory-cached stencils. The source-text paths call `MaybeApplyUmbrafoxUserlandScriptSourceEvent` before compilation. Blindly restoring cached-stencil use could skip source inspection/transformation. Conversely, caching transformed source under an ordinary shared key could replay it after handlers change/disable or in a different eligible context.

Any narrower policy needs a defined validity key/lifetime for handler state, not just origin equality. Cover source-handler registration/removal, async document-start setup, preloads/in-flight changes, same-context navigation, first versus repeated loads, and cached unmodified versus modified source. A no-op source handler can still have callback side effects, so equal source text alone does not authorize skipping delivery. Preserve CSP/SRI/CORS decisions, execution count and ordering; this review does not propose bypassing those checks. Existing userland tests demonstrate pre-execution rewriting of inline/external scripts and awaited document-start ordering.

Likewise request suspension is potentially necessary while an installed handler makes a pre-send decision. A parent-side no-handler fast path requires authoritative current-document readiness/handler state and race tests, not a guess that the script has not registered a handler yet. Disabling a published script versus removing an already installed handler may have different intended lifetime semantics; establish that contract before changing behavior. Adding a timeout that silently bypasses a valid handler is a semantic change, not merely instrumentation.

## Cheapest Focused Controls (Future Authorized Work Only)

Use existing test origins A/B, identical source/body hashes, fixed effective prefs, and explicit process/document identities. Verify state publication before measurement. Start each independent baseline in a fresh owned parent process; keep content-process reuse fixed within a warm-cache cell. Then intentionally test activation history in a separate ordered sequence.

| Cell | Setup | What it isolates / next falsifier |
| --- | --- | --- |
| C0 | Fresh parent/profile; publish empty; never visit an activating document | No-script baseline. Confirm active=false and no prior registration rather than inferring both from empty store |
| C1 | Fresh parent; only disabled script for A; load B | Registry enabled predicate. A difference from C0 needs explanation before testing active scripts |
| C2 | Fresh parent; enabled no-op script for A; never load A; load B repeatedly | Global cache policy plus document discovery/parser wait, without intentionally activating the parent HTTP observer. Check whether source/stencil outcomes change; distinguish those from discovery delay |
| C3 | Fresh parent; matching no-op script on A, never register a request or source handler | Parent registration despite no handlers. Count eligible suspend/query/null-decision/resume, not just elapsed page time |
| C4 | After C3, close A and load B in the same parent | Observer persistence and unrelated-document round trips; compare to C2 with otherwise matched source/cache/process conditions |
| C5 | After C3, publish empty, await effective inactive state, then load B in the same parent; compare to a fresh C0 | Distinguishes active policy from historical registration. Script-cache guards should now read false for new requests, but request observer has no corresponding unregister/active guard |
| C6 | Matching A installs a no-op request handler; measure, remove last handler, repeat on same document; then navigate/destroy actor | Separate handler execution from no-handler parent overhead and lifecycle resume correctness. Do not infer disable semantics from publication alone |
| C7 | Matching A has source identity handler, then actual deterministic source rewrite; repeated warm loads and disable/reload | Positive correctness controls: valid callbacks/transformation must survive any scoped caching repair; verify no stale transformed script reaches the no-handler case |

For cache controls, first establish actual baseline reuse: eligible stable cacheable script, CSP/SRI/principal consistency, memory-cache enabled, sufficient warmup, and time for disk encoding if testing disk cache. Use same-content-process repeats for memory; distinct process/restart experiments for disk. Otherwise "no speed difference" may mean the baseline never used the cache. The inspected ScriptLoader already has debug log messages for Umbrafox bypass and source/compile/cache outcomes, `ScriptCompileMainThread` profiler markers and cache-use counters; detailed logging belongs in an attribution run, not the score run. Test tracing hooks exist, but their consumer/gate was not audited here, so do not assume a usable page/test API.

For request controls, use both a short serial chain and a small parallel batch of local resources; assert exactly-once final response/resume, unchanged methods/headers/body/events, and correct failure on cancel/redirect/actor destruction. Measure native channel suspend-to-resume separately from total request latency. No-handler count/duration instrumentation is currently a proposed gap, not an existing exported metric. A new test-only/diagnostic summary must be internal, bounded, default OFF, with expensive probes compiled out of release and on/off overhead tests. Avoid serializing/logging request headers or source text merely to count work.

For map controls, register and then remove all four hook types in many **distinct** short-lived contexts, drop test references, settle/GC in a separate memory run, and inspect per-process map size plus live/dead WeakRef counts. Pair with same-context navigation, never-registered contexts and intentional retention/BFCache controls. Do not hold dereferenced controllers in the measuring harness across a collection. Entry growth supports key/wrapper retention; proving a document leak requires retained-object evidence. If keys remain bounded because processes exit or IDs are reused, a claimed long-session growth mechanism is falsified for that workload even though the source lacks teardown cleanup.

## Existing Tests and Coverage Limits

`toolkit/components/umbrafox/moz.build` registers both browser and xpcshell manifests. Inspected tests:

- `tests/xpcshell/test_userland_script_runtime.js`: enabled/exact-origin/document-kind filtering, parser blocking for awaited script work, complete-document behavior. It does not assert inactive-pref publication, a no-match promised actor path, cache behavior or observer lifetime.
- `tests/browser/browser_userland_document_start.js`: actual pre-page-script ordering and enabling after a content process already exists.
- `tests/browser/browser_userland_events.js`: source rewriting, runtime-source events, request rewrite/block/synthetic response, mutation events; a navigation-inert-after-disable case exists. That navigation test does not prove HTTP observer unregister or absence of query overhead. Tests share registration history inside the file, so they are not fresh-process no-observer controls.

Verified target paths/manifests; not executed:

```bash
timeout 300 ./mach xpcshell-test toolkit/components/umbrafox/tests/xpcshell/test_userland_script_runtime.js > artifacts/custom-runtime.log 2>&1
timeout 600 ./mach mochitest --headless toolkit/components/umbrafox/tests/browser/browser_userland_document_start.js > artifacts/custom-document-start.log 2>&1
timeout 600 ./mach mochitest --headless toolkit/components/umbrafox/tests/browser/browser_userland_events.js > artifacts/custom-events.log 2>&1
```

Future commands require an authorized test build/runtime and an authorized existing `artifacts/` directory. Keep full logs. These tests are correctness starting points, not evidence that the proposed performance/lifetime controls already exist or pass.

## Program-Document Review

Read `docs/umbrafox/archive/plans/performance-program.md`, `docs/umbrafox/archive/docs/performance/{README,measurement-contract,instrumentation}.md`, plus PERF-004/005/006 in the current catalog. The source-confirmed/measured vocabulary, default-OFF prototype, runtime-effect caution and separate timing/attribution gates are appropriate. No blanket modification-rule exception is asserted.

Changes advised before final catalog acceptance:

1. Tighten PERF-004 wording to stencil/bytecode and scope-independence, not all caching or universal chronological precedence. A lack of measured slowdown falsifies a performance hypothesis, not the already-inspected branching mechanism.
2. Add fresh-never-activated versus activated-then-disabled controls to PERF-005, and explicitly separate parser-discovery overhead from cache cost in PERF-004. State supported-channel/actor eligibility rather than "all requests."
3. Keep PERF-006 as map-entry retention/possible growth unless live-controller/document retention is proven. Track process reuse and distinct context IDs; WeakRef is not a full map-cleanup mechanism, but is also not a strong-retention proof.
4. In `instrumentation.md`, detailed-trace release exclusion is currently described as a "target" and bounded-marker rows only require an enable check. Make default-OFF internal opt-in explicit for **all new** diagnostics and mandatory release compile-out for **new costly** probes, including an expensive bounded marker. Preserve the document's honest migration caveat for the existing prototype; do not label it compliant prematurely.
5. Add inactive/paused/thread-filtered/start-stop probe states and disabled argument-evaluation tests explicitly to the new-probe contract. The current broad disabled-test requirement is useful but not enough to prove payload work was skipped before a marker call.

No document/source edits were made here. The initial audit link target was not yet present when checked; since the parent is actively writing these documents, treat link completeness as a final assembly check, not a settled defect.

## Verification Boundary

Claims above were checked against registry, both actors, actor registration, runtime, controller mutation sites, ScriptLoader producers and downstream cache consumers, test manifests and representative tests. A scoped diff showed no source changes in these inspected modules during this lane. No throughput, latency, allocation, key-growth slope or leak was measured. Confirmed mechanisms can enter the catalog now with their qualifiers; their importance and any repair remain measurement-dependent.
