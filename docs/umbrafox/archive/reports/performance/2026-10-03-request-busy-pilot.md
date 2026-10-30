# Busy Content Thread Request Pilot

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Result

One actual isolated headless run on wyatt-laptop observed the installed userland
HTTP observer coupling request progress to a busy content thread, despite an
initialized empty script registry and null decisions. This is a mechanism pilot,
not an owner-YouTube diagnosis or a general performance estimate.

Each phase ran six sequential GETs to the same owned loopback fixture, alternating
idle and a synchronous100ms JavaScript task immediately after starting fetch.
The first phase had no installed Umbrafox request observer; the second explicitly
installed it. Both phases wrapped the same exact document actor instance, then
restored its original method. No product source, package or owner browser changed.

| Busy sample | Baseline request start | Baseline response start | Installed-observer request start | Installed-observer response start |
| --- | ---: | ---: | ---: | ---: |
| 1 | 2ms | 3ms | 102ms | 102ms |
| 2 | 2ms | 3ms | 101ms | 101ms |
| 3 | 1ms | 2ms | 100ms | 101ms |

These delays are relative to the matching page fetch call, using only that
content clock. All six busy tasks measured100ms. Baseline responseStart was
strictly later than requestStart and far before busyEnd, satisfying the declared
control. The installed-observer requests started at or after busyEnd.

The parent query population, in recorded order, was approximately
`0.618, 99.318, 0.465, 98.428, 0.305, 98.801ms`. All six returned null and matched
the expected document/context/URL; peak pending1, zero errors/drops, restoration
true. Baseline had zero such queries. Parent times are never subtracted from
page times; no per-request parent-to-page identity pairing is claimed.

**This measures lost overlap, not100ms added to total fetch completion.** With a
155-byte local response, baseline busy fetch completion was100-101ms and the
observer phase102-103ms. Both JavaScript consumers must wait for their own busy
task. For larger/remote resources, delayed network initiation may matter more,
but that magnitude and actual video impact have not been measured here.

## Interpretation And Limits

The direct observation is that network ResourceTiming progresses during the
baseline task, while the installed-observer phase delays it until that task ends.
The alternating short/approximately99ms parent intervals support the existing
source mechanism: suspend channel, query the document's actor, resume after its
reply. The test intentionally installs the observer in a disposable browser;
it does not show that the owner's current browser has installed it or that a
fresh browser with no scripts normally installs it.

This follows the [empty-registry path observation](2026-10-03-request-path-observation.md).
One fixed-order process, three busy requests per phase, an instrumented actor,
and no reversed-process or uninstrumented control cannot establish a general
overhead distribution or attribute the owner's intermittent YouTube stutter.
No profiler, decoder, GPU, packet capture or external website was involved.

ResourceTiming is a public, reduced-precision surface, not a raw wire clock.
Source inspection found [ResponseStartHighRes fallback and precision handling](https://searchfox.org/firefox-main/rev/d0f18859d99ecb16f4c5d641b35a5f3bdb7b4f36/dom/performance/PerformanceTiming.cpp#760)
and [ResponseEndHighRes fallback](https://searchfox.org/firefox-main/rev/d0f18859d99ecb16f4c5d641b35a5f3bdb7b4f36/dom/performance/PerformanceTiming.cpp#812).
The [timed channel supplies response timestamps](https://searchfox.org/firefox-main/rev/d0f18859d99ecb16f4c5d641b35a5f3bdb7b4f36/dom/performance/PerformanceTiming.cpp#186).
The pilot requires responseStart>requestStart for baseline admission, no worker
or redirect, a positive network transfer455B, exact155B body SHA, and13 successful
server GETs including the initial document. ResponseEnd equals responseStart in
these observations; it does **not** independently prove last-byte wire timing or
exclude its fallback. Claims concern observed response progress, not that edge.

Same URL is disambiguated within the page by strict sequential execution and
clearing/checking the resource buffer before every fetch, followed by exactly
one matching resource entry. The page body is executed through the existing
control sandbox on the content thread, not claimed as an ordinary Window-realm
benchmark. No new page API, public timing setting or CSP change was introduced.

## Verification

- Eleven combined focused test groups pass under15s: new serialized VM collector,
  interpretation/corruption tests, unchanged request-path server/trace regressions.
- Additional saved-evidence test passes, rejecting15 corruptions across identity,
  timing, restoration, counts, caps, build metadata and absence evidence.
- Busy spin has both100ms target and a finite10M iteration cap. Observed busy
  iterations77344-107404, well inside that bound. Page phases6s, nested operation
 7/8s, parent operation20s, existing total120s/work105s/cleanup15s limits unchanged.
- Raw replies are saved before validation. Exact12 response-body hashes pass.
  Registry scripts0, activefalse and profilerfalse at both boundaries;
  observer counts1->2->2, with idempotent second ensure call.
- Runtime20:36:40.654-20:36:52.854UTC,12.200s. Controller473090/browser473108,
  context10/document10737418242, BuildID20261003071500 matching both INIs.
- Fresh private native UAppData/local-data paths verified. Five resource samples
  pass existing caps; max sampled artifact153503307B under256MiB. This is not
  continuous process/network isolation, peak RSS or a memory-slope measurement.
- Clean owned SIGTERM,182logbytes, zero log drops. Exact controller and browser
  /proc roots absent at20:38:24.081UTC. EPERM namespace and headlessSWGL warnings
  retained. No owned browser/controller/SSH/test process remains running.
- Same sealedB executable SHA0ca9e768...332f14 and libxul d0013852...7c4231.
  Six relevant omni.ja module SHAs match the previous path probe, including original
  controller d7e4056f...41261, not the uninstalled finalizer/header-copy candidate.
  Loose provenance module entries are null because this is a packaged archive;
  the separate archive-entry hashes supply that evidence, not loaded-byte proof.
-21 transferred harness/dependency files match before/after;27 runtime files
  exported and independently hash-verified, excluding profile/token/app-data contents.

No broad suite or registered lint was rerun for scratch-only work. No native
build/install/stage/commit, preference change, owner tab or extension action.

## Preserved Failure And Evidence

First controller attempt ended before browser launch at20:34:50.226UTC: the
static-import-only archive omitted three fixture assets read by provenance.
Its terminal run has no browser PID; all four direct files are retained. This is
a harness packaging error, not a browser or timing failure. The replacement
bundle includes the reviewed runtime assets and passed full collectProvenance
plus private-directory admission before the single actual browser pilot.

Remote roots:
- Failed prelaunch: `~/.cache/codex/request-busy-20261003-1`.
- Actual pilot: `~/.cache/codex/request-busy-20261003-2`.
- Old/new harnesses: `request-busy-harness-20261003-Eaa7mp` and `-AkOr49`.
- No-browser provenance check: `request-busy-preflight-20261003-2`.

Local copies: `~/.cache/codex/laptop-request-busy-evidence-20261003-{1,2}`.
Scratch design/collector/capture/bundler/export/audit/tests/logs and final seal:
`artifacts/umbralink-control/request-busy*`, `capture-request-busy.mjs`,
`bundle-request-busy.mjs`, `export-request-busy.mjs`, `audit-request-busy.mjs`.
Initial test RED was a missing module only, not a behavioral regression proof.
Original request-path helpers and their sealed evidence are unchanged.

## Next Decision

This warrants investigating a safe way to avoid unnecessary document-actor
queries. The [authority audit](2026-09-27-request-authority.md) remains binding:
null can mean several things, handlers can register through retained capabilities,
and a browsing context is not an exact document. Do not cache the last null reply
or globally skip requests just because the registry is currently empty.

Next steps are exact-document capability/handler authority design with late
registration/navigation falsifiers, and a separate reversed/uninstrumented
network-overlap control before a performance claim. No repeated browser run or
speculative product bypass was added during this pilot. Headed hardware-video
permission remains separate. The overall performance goal remains active.
