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

This initial addition is test tooling and operational documentation. It does not
add a production JS/WebIDL/CSS/DOM/network interface, change engine behavior,
enable the graphics prototype by default, or claim detailed probes are already
release-excluded. The test fixture's own User Timing marks are page-authored,
not injected browser identity markers.

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
