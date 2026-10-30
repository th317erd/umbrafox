# Controller Finalization Under Gecko

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Result

The uninstalled controller-map cleanup candidate passes a real Gecko collector
check using privately evaluated source, fake windows/services, and forced GC.
This closes the earlier V8-only collector gap, not the real-document lifecycle,
BFCache, heap-byte, memory-slope, or video-performance gates.

The final run creates three batches of 512 controllers, each registered in all
four native maps. Two intentional live controls remain registered across the
batches: a replacement for an earlier controller with the same context ID, and
a controller whose handlers are removed and re-added. After all references are
released:

| Observation | Original source | Current candidate |
| --- | ---: | ---: |
| Map sizes after batch 1, per map | 514 | 2 |
| Map sizes after batch 2, per map | 1026 | 2 |
| Map sizes after batch 3, per map | 1538 | 2 |
| Live targets at those checkpoints, per map | 2 | 2 |
| Map sizes after releasing live controls, per map | 1538 | 0 |
| Live targets after release, per map | 0 | 0 |
| Duplicate registration preserves reference identity | No | Yes |
| Live replacement identity and handler off/on checks | Pass | Pass |

The original therefore retains 6152 dead map entries, not 6152 live controllers.
The candidate clears those entries without dispatching a subsequent observer or
request lookup. Counts include direct `WeakRef.deref()` checks through each
map's values, not only weak witnesses to cross-compartment controller wrappers.
Map reads do not delete entries. All four final stages complete after one forced
collection each in this observation; that is not a cleanup-latency guarantee.

## Scope And Provenance

No production source was edited in this follow-up. Only scratch adapters/tests,
this report, and continuity documentation were added or updated. No build,
package installation, owner browser control, extension setting, or profiler
session was performed.

The sealed mutation-mirror package was used headlessly on wyatt-desktop:

- Binary: `exports/umbrafox-mutation-mirror-candidate-20261003/umbrafox/umbrafox`.
- Runtime and adjacent INI BuildID: `20261003071500`.
- libxul SHA256: `d00138528b1410b81405fc9533b8771a8284ec98e6968a2bce313bc2177c4231`.
- Executable SHA256: `0ca9e768f64ab36078bbcde61ce788f681c73cfbf670b25aa89c286ab1323f14`.

The actual source under test is
`toolkit/components/umbrafox/UmbrafoxUserlandEventController.sys.mjs`:

- Original HEAD source: `d7e4056ff2bc4d837c9664a534124d9c82da84d04894858454023f0a8b541261`.
- Current source: `5f0f10369bd55a1f4a90a8508670153c8d5c27606d62846070f923954fe84125`.

The current source includes an already-existing request-header-copy change in
addition to finalization cleanup. These checks do not call request field
construction or dispatch, so they neither test nor attribute that separate
change. The older finalizer-only hash `97ec22ce...` from the retention report is
not the current source hash. Neither sealed native candidate package contains
the new finalizer module as its installed product module.

An Acorn parse verifies the expected three module exports; only their export
prefixes are removed for private evaluation. Exact original and transformed
source hashes, plus original source text, are saved with each evaluated variant.
Fake `Services.obs` records observer registrations without registering real
observers. Fake `Cu.exportFunction` modifies only fake windows. Gecko's actual
`WeakRef`, `FinalizationRegistry`, and privileged `Components.utils.forceGC()`
perform collection. No page globals or public APIs are added.

Evaluation uses a separate system-principal sandbox with no browser-window
prototype and `wantComponents: false`. The adapter supplies only its fake
services/utilities there. JSON results are copied out before `nukeSandbox` in
`finally`. No CSP preferences are changed. Existing UmbraLink authentication,
native root receipts, fresh private application-data/profile directories,
resource caps and owned cleanup remain in force.

## Tests And Preserved Failures

Five focused test groups pass, including actual V8 execution of the identical
probe, both result contracts, 24 malformed-result cases, compiler injection,
noncollecting/rejected GC, source drift, request bounds and raw-reply preservation
before native-identity rejection. A compiler-injection behavioral RED is retained
(four passing tests, one failure), followed by GREEN. The initial missing-module
RED is not behavioral proof.

The first `node --test --expose-gc`-style invocation did not expose `gc` in its
worker. Its failure is preserved. The final supported command directly runs
the `node:test` file with `--expose-gc` and strict unhandled rejections under a
20-second external watchdog. No test skip or fake collector substitutes for the
real-collector checks. No broad tooling suite or registered lint was rerun:
this follow-up changes only scratch verification code and documentation.

Runtime roots are `/home/wyatt/.cache/codex/controller-gecko-20261003-N/`:

| N | Result | Controller/browser PIDs | Elapsed |
| --- | --- | --- | ---: |
| 1 | Failed: chrome CSP blocked `Function()` before population | 1717494 / 1717506 | 12.039 s |
| 2 | Passed using private sandbox; predates direct map-live counts | 1720113 / 1720125 | 12.540 s |
| 3 | Final PASS, including direct map-live counts | 1721874 / 1721886 | 12.829 s |

All three retain clean owned SIGTERM outcomes, 183-byte logs with zero drops,
and post-startup receipts for their exact fresh app-data/local-app-data roots.
All six exact controller/browser roots were independently absent afterward.
Fourteen saved resource samples pass the existing absolute safety caps; maximum
sampled artifact size is 170137396 bytes under the unchanged 256 MiB cap.
This is sampled safety, not continuous process/network isolation. EPERM and
headless SWGL warnings remain in the logs. The final private results join the
native parent PID, BuildID, fixture URL, context 10 and document 10737418242;
userland activation and profiler state are false before and after both probes.

The same process evaluates old then current source in a fixed order. Forced GC,
synthetic fake windows, and that ordering make timings unsuitable as a speed
comparison. No periodic GC was added to the product.

## Evidence And Next Gates

Scratch files under `artifacts/umbralink-control/`:

- `controller-gecko.mjs`: source preparation, probe and result validator.
- `capture-controller-gecko.mjs`: bounded existing headless-harness adapter.
- `test/controller-gecko-spec.mjs`: focused cases.
- `audit-controller-gecko.mjs`: saved-result, identity, caps and absence checks.
- `controller-gecko-{red,compiler-red,final-tests,browser-1,browser-2,browser-3,audit}.log`.
- `controller-gecko-audit.json`, `controller-gecko-evidence.sha256`: 80 direct
  evidence files; no profile, token or crash-queue contents are copied or hashed.
- `controller-gecko-final.sha256`: final adapter/test/report/source seal.

Remaining memory gate: actual document/controller churn with retained pages,
navigation, BFCache and settled heap evidence. Collection of fake-window
controllers does not establish those lifetimes or quantify registry overhead.
The next major rendering gate remains a same-backend headed GPU comparison;
the separately requested visible-window permission is still pending. The owner's
work browser and both sealed candidate packages remain unchanged.
