# Empty-Registry Request Path

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Result

A bounded real headless-browser check distinguishes a fresh no-script browser
from the state after its persistent userland HTTP observer has been installed.
No production source, package, installation, personal profile, extension or owner
tab was changed.

| Observation | Fresh empty registry | Explicitly installed observer, same registry |
| --- | ---: | ---: |
| Successful owned fetches | 6 | 6 |
| Observed `DispatchUserlandRequest` actor queries | 0 | 6 |
| Null decisions | 0 queries | 6 |
| Pending queries at completion | 0 | 0 |
| Trace drops/errors | 0 | 0 |
| Wrapped actor method restored | Yes | Yes |

Each phase performs three serial fetches and three concurrent fetches. All 12
response bodies match the owned fixture's exact SHA256 and 155-byte length.
The server records exactly 13 successful GETs: initial document plus 12 fetches.
The parent shared-data registry is an initialized empty array, the userland
active preference is false, and the profiler is inactive at both observed
boundaries. Both page probes report `navigator.webdriver === false`.

The synchronous observer count changes from 1 to 2 after the explicit call to
`ensureUmbrafoxUserlandRequestObserver`; a repeated call leaves it at 2. The
initial observer count is not a count of Umbrafox-specific observers. The first
phase's zero query count is the relevant direct observation.

This confirms the installed-observer query path even for a document with no
configured scripts. It does **not** show that a fresh empty-registry browser
normally installs that observer, or that the owner's current YouTube page uses
this path. The test deliberately installs it only in a disposable browser.

## Timing Boundary

The six instrumented parent actor-query intervals, in milliseconds, are:

`0.340569, 0.193719, 0.195000, 0.299340, 0.504069, 0.250220`.

Their descriptive median is 0.274780 ms and maximum is 0.504069 ms. Peak pending
queries is 2. This is six observations in one fixed-order functional test,
without a noise model or observer-control run; it is not a performance result.

The wrapper starts immediately before the actual `sendQuery` call and records
completion in its added promise continuation. It excludes the earlier channel
suspension and request/header field construction, and the later application of
the decision and `resume()`. It includes actor serialization, IPC scheduling,
child dispatch, reply delivery and wrapper overhead. It is neither pure IPC
time nor total interception delay.

Page fetch timestamps use the content clock and normal reduced precision.
Query timestamps use the parent chrome clock. They are not subtracted from one
another, nor paired per fetch: all requests deliberately use the same URL, and
the concurrent subset has no unique request IDs. No tail percentile,
significance, YouTube-causality or universal sub-millisecond claim is made.

## Mechanism And Authority

The verified packaged parent actor calls the observer installer after a
nonempty document-script match. The HTTP observer then selects an actor using
the channel's browsing-context identifiers. `dispatchParentRequestEvent`
suspends the channel, builds fields and awaits `DispatchUserlandRequest` before
applying a decision and resuming. The child dispatch function can return null
for multiple reasons.

The [request authority audit](2026-09-27-request-authority.md) still applies:
null is not a no-handler certificate; live capabilities can register later;
browsing-context identity alone is not document identity. This experiment adds
runtime path evidence, not authority for an empty-registry bypass or a cache of
null replies. The [header-copy candidate](2026-10-03-request-header-copy.md) is
not installed in the package used here and is not measured by this experiment.

The temporary wrapper is applied to the waived, exact owned document actor
instance, never its class or a shared prototype. It calls the original method
with the original `this` and argument objects, forwards resolutions/rejections,
and restores the original own descriptor or inherited lookup in `finally`.
Non-request messages bypass the trace. The observer itself remains installed
until the disposable browser exits, as in the product's persistent-observer
design.

Nested page execution uses the existing `UmbrafoxControlExecution` actor,
document-ID check, bounded script execution and cancellation. No new public
browser API or automation flag was added. The fixture allows connections only
to itself through its own CSP; this does not provide a browser-wide network
sandbox. No headers, script-store contents or personal request data were saved.

## Verification And Provenance

Runtime: `/home/wyatt/.cache/codex/request-path-20261003-1/`, from
20:08:55.695 to 20:09:07.933 UTC on October 3, 2026, wyatt-desktop.

- Sealed binary: `exports/umbrafox-mutation-mirror-candidate-20261003/umbrafox/umbrafox`.
- Native receipt and both adjacent INIs: BuildID `20261003071500`.
- Parent PID1748688, controller PID1748669, context 10, document 10737418242.
- Actual request payload context/document/URL equality checks pass for all six
  queries against that owned document; no request-level ID pairing is claimed.
- Exact fresh `UAppData` and local-data roots are returned by the native parent.
- Clean owned SIGTERM; zero log drops; both exact roots independently absent.
- Five saved resource samples pass existing absolute safety caps. Maximum
  sampled artifact size: 170913142 bytes, below the unchanged 256 MiB cap.
- The 183-byte browser log retains the usual namespace EPERM and headless SWGL
  warnings. No graphics conclusion follows from this run.

The controller packaged inside `omni.ja` hashes to
`d7e4056ff2bc4d837c9664a534124d9c82da84d04894858454023f0a8b541261`, matching
the original HEAD source, not the current uninstalled cleanup/header candidate.
Five other relevant packaged registry/control/actor module hashes were recorded
and their bytes independently compared with current source before launch.
`request-packaged-modules.json` retains all six archive-entry hashes. This is
package/provenance evidence, not a runtime in-memory module-byte inspection.

Six focused test groups pass under a 15-second bound. They exercise exact
forwarding/`this`, inherited and own-method restoration, non-null decisions,
original rejection objects, synchronous errors, action failure, trace overflow,
unconfigurable methods, malformed result/identity/timing rejection, body-hash
contracts, route/method/request caps and abort/idempotent fixture closure.
The initial missing-module RED is retained and is not a behavioral regression
proof. No broad suite or registered lint was rerun for scratch-only code.

One browser execution passed, with the existing 120-second harness budget and
owned cleanup. An independent saved-data pass revalidates body/count/native
identity joins, clock-specific intervals, safety caps and root absence. It seals
27 direct evidence files, excluding profile/token/application-data contents.

Scratch evidence under `artifacts/umbralink-control/`:

- `request-path.mjs`, `capture-request-path.mjs`, `test/request-path-spec.mjs`.
- `audit-request-path.mjs`, `request-path-audit.json`, `request-path-audit.log`.
- `request-path-{red,green,final-tests,reviewed-tests,browser-1}.log`.
- `request-path-evidence.sha256`, `request-path-final.sha256`.

## Next Falsifier

The next question is whether content-thread load delays these otherwise-null
queries enough to postpone useful network work. A load experiment must first
demonstrate that its baseline network request can progress while that content
thread is busy; a page action that defers fetch initiation itself would make
both arms wait and would not test the observer hypothesis. Use unique owned
request IDs and explicit network-start evidence, separate native clock domains,
fixed/reversed independent runs, and uninstrumented controls before assigning a
cost or proposing an exact-document fast path.

No speculative request skip, header/network semantic change, or userland API
change is justified by this small test. Visible GPU comparison remains a
separate permission gate, and the owner's active browser remains untouched.
