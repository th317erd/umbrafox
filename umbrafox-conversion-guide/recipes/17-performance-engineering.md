# Persistent performance engineering

## Purpose

Preserve the process, fixture tooling and evidence catalog used to profile all
browser stacks. Start with graphics, painting, DOM/layout, JS and custom hooks;
extend to the other lanes in the catalog. The owner wants probes left in-tree
for reuse, costly instrumentation absent from release builds, desktop iteration
and periodic physical Pi checks. Two source copies total is the resource limit.

## Files to preserve

- `bot-docs/plans/performance-program.md`.
- `bot-docs/docs/performance/`: index, measurement contract, instrumentation
  contract and issue catalog.
- `bot-docs/reports/performance/`: dated source inventories, evidence and verified
  run reports. Raw personal profiles do not belong in Git.
- `tools/umbrafox/performance/`: isolated local runner, helpers, fixture and tests.
- Preserve its optional userland-cache suite, failure snapshots, strict outcome
  analyzer and awaited page-realm readiness sentinel. Keep historical failed
  fixtures distinct from current successful controls; diagnostics are not scores.
- Existing UmbraLink diagnostic protocol and recipe 15.
- Existing graphics fixtures and recipe 16, including their unresolved pixel
  failures and experimental default-OFF status.

The initial foundation is test tooling and operational documentation. It does not
add a production JS/WebIDL/CSS/DOM/network interface, change engine behavior,
enable the graphics prototype by default, or claim detailed probes are already
release-excluded. The test fixture's own User Timing marks are page-authored,
not injected browser identity markers.

## Retained WR probe gate

The 2026-09-27 native patch under verification adds an opt-in compile gate for
the existing experimental probes. Keep it separate from opacity behavior and
the existing pixel failures. The [verification checkpoint](../../bot-docs/reports/performance/2026-09-27-probe-exclusion.md)
records passing real OFF checks and unresolved ON/package/runtime gates. This
is not a claim that installed packages already exclude these probes.

Preserve the configure-to-Cargo chain:

- `toolkit/moz.configure`: `--enable-umbra-perf-probes` and
  `MOZ_UMBRA_PERF_PROBES`, opt-in independently of DEBUG.
- `toolkit/library/rust/gkrust-features.mozbuild` and
  `toolkit/library/rust/shared/Cargo.toml`: `umbra_perf_probes` forwarding.
- `gfx/webrender_bindings/Cargo.toml`, `gfx/wr/webrender/Cargo.toml` and
  `gfx/wr/wrench/Cargo.toml`: `umbra-perf-probes`, never default-enabled.
- `gfx/webrender_bindings/src/bindings.rs` and WR `src/profiler.rs`: the
  custom marker-specific eligibility predicate, not a change to upstream
  sampling predicates or a new C ABI.

Preserve the whole-expression/state exclusions in WR `src/renderer/{mod,
init,composite,gpu_buffer,shade}.rs`, `src/tile_cache/mod.rs`, `src/gpu_types.rs`
and `src/transform.rs`. Keep `src/renderer/sampling.rs` and its regression tests
in source, but omit its module and owned state from OFF builds. The gated
argument factories matter as much as the final marker call. Keep the focused
`tools/umbrafox/tests/probe-gate/` source contracts and OFF/ON pure fixtures.

After merging upstream, recheck both actual owning crates and effective Cargo
feature unification. Root workspace exclusion currently prevents enabling the
feature by selecting only WR/bindings; do not turn a rejected Cargo command or
pure fixture into an ON compile success. Generated ABI, packaged exclusion and
matched runtime cost/correctness remain separate mandatory acceptance checks.
No shader, opacity preference, resource synchronization or rendering control
belongs under this diagnostic build gate.

## Lifecycle controls

Preserve the optional `lifecycle` suite in the same local runner, its
`lifecycle.mjs` fixture and `lifecycle-capture.mjs` checkpoint/resource helper,
and their separate tests. Do not substitute a second launcher or a public
browser diagnostic API. Matching sentinels are owned fixture userland, not
browser defaults. Keep exact document/frame/startup ordering and checksum
oracles, monotonic minimum quiet intervals, fresh profiles, PID/start/session
ownership and separate controller accounting.

Keep lifecycle-only welcome-page preferences separate from product and other
suite defaults. Admission needs the actual held fixture receipt and selected
tab/context, not preference values or empty startup snapshots. Preserve bounded
setup polling under the original startup deadline, raw rejection evidence,
strict sampled HTTP-document checks and explicit unobserved selection boundaries.
Do not erase historical background-tab contamination or infer network isolation.
Preserve binary-adjacent actor identities at `moz-src/toolkit/actors`, with honest
null results for missing files and no source fallback.
Keep the lifecycle-only data-submission disable as an explicit test-profile
choice: it guards the separate legacy policy notice and upload eligibility,
not all TOU or network behavior. Do not replace it with consent bypass or move
it into product defaults. Settings never replace actual document admission.

Keep the aggregate deadline's cleanup and final-report reserves, plus independent
terminal evidence capacity after ordinary evidence overflow. A timeout or bounded
wait is not proof of OS cancellation. Preserve failure snapshots and clean-up
outcomes; never reinterpret the initial quiet-timer STOP as a browser memory leak.
ProcInfo estimates, summed RSS safety limits and parent memory reporters remain
distinct. The [dated lifecycle checkpoint](../../bot-docs/reports/performance/2026-09-27-lifecycle.md)
records runtime coverage and remaining soak gates.

## Reapply after upstream updates

1. Preserve these files as a coherent subsystem; do not replace them with a
   benchmark score summary. Keep catalog IDs and historical FAIL/STOP evidence.
2. Revalidate UmbraLink method/result shapes used by the local runner, discovery
   permissions and owned-profile process identification. Do not substitute
   Marionette or change web-visible automation state to make tests work.
3. Re-map profiler marker producers and consumers, clock units, thread pools,
   helper/GC semantics and actual backend paths. Searchfox tip is not proof of
   the locally built artifact; record both source and binary identity.
4. Run Node unit/lifecycle/protocol negative tests, then isolated profile-OFF A/A
   smoke captures and a separate profile-ON capture with existing binaries.
5. For actual engine repairs, run the item-specific strict correctness and
   performance gates and physical Pi milestone before claiming ARM improvement.
6. Any future costly native probe must include a reviewed build-gate design,
   release binary/feature-graph absence proof, runtime-OFF/ON overhead controls,
   bounded event loss reporting and lifecycle tests. False prefs alone do not
   establish release stripping or zero overhead.
7. Preserve the instrumentation contract's debugging-only exposure register.
   Product builds must not expose custom public interfaces. A temporary debug
   exception needs the exact surface, guards, cleanup owner, exposure tests and
   a `DEBUGGING ONLY` source comment linking to its catalog entry. None was
   introduced in this foundation wave.

## Verification

```bash
timeout 120 node --test tools/umbrafox/performance/test/*-spec.mjs
```

The dated audit contains concrete local browser commands and evidence paths.
Use newly created output directories and never the owner's active profile.
Correctness failures, profiler load failures, timeouts, backend drift and process
cleanup failures must remain visible. Do not accept a speedup by relaxing pixels,
disabling required work, replacing physical presentation with headless counters,
or silently modifying Firefox-equivalent defaults.

## Attachment metadata candidate

Preserve the narrow `Downloader.cacheAll()` metadata conversion change in
`services/settings/Attachments.sys.mjs` and its existing downloader regression
test. Parse the original byte string after a normal main-thread task yield;
do not restore the unnecessary Blob/text conversion, silently decode it as
UTF-8, remove the yield or defer certificate updates to idle time. Preserve
the earlier archive/stream/temp cleanup and existing 50-record cache batches.

The [candidate report](../../bot-docs/reports/performance/2026-10-07-attachment-metadata.md)
records native byte/error equivalence, real ZIP/IndexedDB checks and the mixed
observer-loaded versus modest quiet-operation timing results. They are not
startup or video-stutter proof. Re-map the caller and byte producer after an
upstream merge, and include the module in new package source manifests; old
rendering-only source guards do not cover it.
