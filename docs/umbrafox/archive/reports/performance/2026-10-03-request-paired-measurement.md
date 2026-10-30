# Paired Request Fast-Path Measurement

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Result

Ten isolated headless laptop runs passed: two traced routing controls followed by
eight unwrapped timing processes in ABBA/BAAB order. The candidate's synchronous
negative path avoids the six content actor queries observed in the baseline after
explicit observer installation. During a100ms page task, unwrapped per-process
median request-start delays are101/102/101/101ms in baseline versus2/1/2/1ms in
candidate. Before installation, both variants have1-2ms process medians.

This is measured ResourceTiming request-start behavior in a deliberately busy,
empty-registry fixture, not a100ms end-to-end fetch improvement. Busy fetch
completion medians remain100-103ms. The strict response-progress control remains
inconclusive for every process: one or more very fast loopback responses have
responseStart==requestStart at reduced precision. Do not silently relax that gate,
claim full transfer during the task, or attribute the owner's YouTube stutter.

No product source changes, native build, installation, owner-browser action,
profiler, agent, commit or staging occurred during this measurement. Phase2
remains uninstalled. The overall rendering/layout/CSS/JS/hardware goal is active.

## Artifact Identity

Local paired diagnostic copies:
`/home/wyatt/.cache/codex/request-fastpath-pair-20261003-dub_txpr/`.
`pair.json` SHA256:
`60972c8cf99b6a19e7ccbe80bc6a5232a669a52e26222a9d89dbf2a46a5f1498`.

Original sealed mutation-mirror package SHA256:
`10658410fda22d8a4951b2274ed627d1767cacd8e385d0e62ea053aab478fdd3`.
Both native BuildIDs:20261003071500. Both copies have identical46-file inventories
except root omni.ja. Executable SHA256:
`0ca9e768f64ab36078bbcde61ce788f681c73cfbf670b25aa89c286ab1323f14`;
libxul SHA256:
`d00138528b1410b81405fc9533b8771a8284ec98e6968a2bce313bc2177c4231`.

Baseline uses the archived phase1 capability checkpoint; candidate uses archived
phase2. Both include the identical runtime prerequisite. Exactly three module
payloads differ between copies: EventController, ScriptRegistry and UserlandParent.
There are2676 root-JAR entries. Mozilla JarReader/JarWriter preserves entry order,
compression, modes and preload layout; all unchanged entry hashes are verified.
Independent Info-ZIP extraction verifies the four replacement module payloads.
The original archive/tree is not edited; no loose-module fallback is used.

Candidate packaged functional gate:218Gecko assertions,0failures,7904ms at
`~/.cache/codex/mutation-mirror-browser-final-20261003-yBOjAU/`. Controller1865763,
browser1865914 and test helpers1865860-62 were absent at completion. Both complete
diagnostic trees still matched after that run. The existing official test harness
uses its automation flags; the later timing runs use UmbraLink only and explicitly
verify navigator.webdriver===false.

## Workload And Controls

- Each process uses fresh owned0700profile/application-data roots and the existing
  bounded captureLocalWorkload envelope:120s total,105s work,15s cleanup reservation,
  resource caps, owned SIGTERM cleanup, no SIGKILL.
- Native parent receipts join PID, BuildID, UAppData and local application data to
  the intended owned roots. This is post-startup evidence, not a network sandbox
  or universal proof of no earlier/shared access.
- Ten-second quiet startup precedes measurement. The fixture is one loopback page
  with a fixed155-byte body, no-store responses and13GETs per process: initial
  document plus six fetches before and six after installing the observer.
- Each six-fetch phase alternates idle and100ms busy tasks. Resource buffers are
  cleared per request; exact body SHA, response status/URL, sizes and timing order
  are checked. No redirects/service-worker timing is accepted.
- Parent state before/after requires an initialized empty registry, inactive
  userland hooks and inactive profiler. Native context/document identity cannot
  change. Observer count must increment once and remain stable on the second call.
- Candidate canSkipRequest is called at the phase boundaries, warming its origin
  cache before measurements. This measures the cached steady state, not first-use
  parsing cost. Baseline must have no such method; candidate must return true.
- Traced routing controls wrap only the userland actor query. Their timings are
  excluded from the eight-process comparison. Unwrapped runs do not install that
  wrapper and retain null query counts, not fabricated zeros.
- Parent-query timestamps and page timestamps are never subtracted or paired.
  Requests do not carry diagnostic IDs. No page-visible browser API is added.

All empty-registry runs explicitly install the observer between phases. A fresh
browser with no scripts already made zero queries before that installation. This
experiment does not establish that the owner's current browser has this observer
installed, or that interception is the source of its video stutter.

## Observations

Traced baseline:0queries before installation,6null replies afterward; traced
candidate:0before,0after. No pending/dropped queries; wrapper restoration succeeds.

Unwrapped process medians, busy requests only (milliseconds):

| Run | Variant | Request Before | Request After | Fetch Before | Fetch After |
| --- | --- | ---: | ---: | ---: | ---: |
| 2 | baseline | 1 | 101 | 101 | 103 |
| 3 | candidate | 1 | 2 | 101 | 100 |
| 4 | candidate | 2 | 1 | 100 | 100 |
| 5 | baseline | 1 | 102 | 101 | 103 |
| 6 | candidate | 1 | 2 | 101 | 102 |
| 7 | baseline | 2 | 101 | 101 | 102 |
| 8 | baseline | 1 | 101 | 100 | 102 |
| 9 | candidate | 2 | 1 | 101 | 100 |

All12baseline busy request starts occur at the busy-task end within the existing
2ms threshold; none of12candidate starts do. Individual after-install request
delays range100-103ms baseline and1-2ms candidate. Individual fetch times range
101-104ms baseline and100-102ms candidate. Idle request-start delays overlap at
1-3ms; no small idle-request performance claim is justified.

Four paired differences in the before/after median request gap:99,102,98,101ms.
Process is the comparison unit, not pooled requests treated as independent trials.
All four complete-control flags remain false. Some individual response-progress
observations are positive, but none of the process controls has all three required
distinct response timestamps. Retain those unknowns. No significance test or
generalized throughput claim is made; inter-process spacing is not uniform.

Host:wyatt-laptop, x86_64, i7-1360P,16logical CPUs, Linux7.0.0-38-generic,
Node24.18.0. Preflight load0.12/0.16/0.12, MemAvailable about11GiB,180GiB free
on /home. Runs span22:12:28.566Z through22:21:18.364Z, each11.967-12.056s.
Fifty resource samples pass caps; maximum sampled artifact188131418bytes.
These samples do not prove continuous isolation or absence of transient helpers.
All logs retain the known EPERM user-namespace and headless SWGL warnings. No
graphics/decoder/hardware inference follows from these headless runs.

## Verification And Preserved Failures

Tooling is under `artifacts/umbralink-control/`:
request-artifact.py builds/verifies the diagnostic pair; request-pair-files.mjs
verifies/copies exact trees; request-paired.mjs defines the two measurement modes;
capture-request-paired.mjs reuses the existing ownership/resource envelope;
bundle/export/audit-request-paired.mjs provide transfer and saved-data validation.

- Artifact tests:9PASS. Earlier generic ZIP-reader incompatibility and a30s
  timeout on a short malformed mozjar input are retained. The final reader
  validates minimum size before construction and independently checks CRCs.
- New adapter/file/statistics tests started red because their modules did not yet
  exist; this is not evidence of a production regression. Final20Node groups PASS
  in about1.3s, including old collector/trace/server coverage and25 saved-data corruption
  rejections. Five relevant groups also passed on the remote Node version.
- The first remote preparation stopped before browser launch because the old
  previously used package had an extra .parentlock. It was not removed or ignored.
  A fresh extraction of the original SHA-verified archive produced the exact
  pair. The failed log and old tree remain intact; no live-process inference is
  made from the lock file alone.
- All seven packaged module hashes and all46artifact files are checked around
  each run. The28-file transferred harness manifest matches before and after.
  The exporter and transferred archive hashes match independently.
- Raw replies are saved before assertions. The auditor recomputes every summary,
  validates native/context/document joins, expected query populations, resources,
  body checks, exact native/INI identities, process order and cleanup.
  A review falsifier initially exposed unvalidated saved baseline data. The audit
  now joins that baseline to exactly one resource sample and recomputes both
  absolute and subsequent baseline-relative caps; RED and corrected gates remain.
- All10browser and10controller root PIDs were independently absent after the
  sequence. Every run reports clean SIGTERM and zero dropped log bytes. No
  sessions remain active. The nine phase2 source/test hashes are unchanged.
- Scratch JS syntax checks and diff whitespace checks pass; these ignored scratch
  tools do not claim a new registered product-lint gate. Prior phase2 product
  tests/lint remain historical evidence because production source is unchanged.
- The first seal verification caught its own still-being-written creation log.
  That draft and failed check are retained. The final seal excludes only that
  volatile bookkeeping log and verifies all included source/evidence files.

## Evidence And Next Gate

Remote root:`/home/wyatt/.cache/codex/request-paired-20261003-M8BkdH/`.
Local direct exports:`/home/wyatt/.cache/codex/request-paired-evidence-20261003/`.
The270direct JSON/INI/log files total895672bytes; private profile/token/app-data
subdirectories were neither exported nor inspected. Per-file manifest and exact
root-absence receipts accompany them. The sealed pair proof remains in the local
artifact root. `request-paired-analysis.json` contains the full recomputation;
`request-paired-final.sha256` seals this checkpoint. Earlier seals are historical
and have not been rewritten.

Next: add a separately specified common server-side response delay to the owned
fixture, with bounded timers and cleanup tests, then repeat the balanced unwrapped
comparison. This makes response progress distinguishable above timer precision
without weakening the control, and tests overlap under actual response latency.
Do not pool the changed workload with these observations. Then return to realistic
page/video attribution and the separate layout/hardware branches. Installation,
owner restarts and headed-window permission remain separate decisions.
