# Canvas provider diagnostic gap

2026-09-26. Proposal only, task `l8ros-support`. No implementation, build,
runtime access, source edit, browser/Pi operation or new source copy.

## Verdict: NONE in the supported current UmbraLink protocol

The current UmbraLink service has no command that retrieves a canvas provider,
no generic privileged evaluation command and no arbitrary actor-message tunnel.
This is a source-verified protocol conclusion, not a new runtime probe:

- `UmbrafoxControlService.execute` in
  `toolkit/components/umbrafox/UmbrafoxControlService.sys.mjs` has a finite switch
  for input, diagnostics, gfx, media, performance/profile dump and status;
  unmatched methods produce `unknown command`.
- `UmbrafoxControlDiagnostics.mediaSnapshot` in the adjacent diagnostics module
  calls `UmbrafoxControlDiagnostics:MediaSnapshot`. Its content actor in
  `toolkit/actors/UmbrafoxControlDiagnosticsChild.sys.mjs` accepts only that
  message, enumerates audio/video and returns media state. It does not inspect
  canvases. Gfx/process/profiler snapshots do not supply per-canvas state.
- `UmbrafoxControlInputChild` accepts key/type messages, not evaluation.
  `UmbrafoxDiagnostics.snapshot` contains web-navigation counters, not canvas state.
- The diagnostics actor is already privileged and registered for all browser
  frames in `toolkit/modules/ActorManagerParent.sys.mjs`. That provides a future
  transport location, not a currently callable canvas diagnostic.
- Current browser tests cover command dispatch and media, wrong-token rejection,
  and web-visible state. Their use of `SpecialPowers.spawn` is test-harness access,
  not an installed UmbraLink command or an available live-testing substitute.

Do not use Marionette, BiDi, Remote Agent, browser-console input injection,
userland code installation or a website-visible debug accessor as a workaround.
The proposed hidden/visible comparison is **inconclusive as an isolation of
presentation versus upstream copy cost without provider evidence**. Timing can
still be reported descriptively, but not as proof of matched canvas backends.

## Second missing capability: existing-context-only discovery

`HTMLCanvasElement::GetCurrentContext()` exists in native code and simply returns
`mCurrentContext`. It is not an existing JS property in `HTMLCanvasElement.webidl`.
The reviewed window-utils canvas operations do not expose it either.

`HTMLCanvasElement::GetContext` is **not** an acceptable discovery method: it sets
`mMaybeModified = true` and calls `CanvasRenderingContextHelper::GetOrCreateContext`.
On an uninitialized canvas it can create and lock in a 2D context. Calling
`getDebugInfo(false)` afterward does not undo this mutation.

`CanvasRenderingContext2D::GetDebugInfo(false, ...)` itself skips `EnsureTarget`.
It throws InvalidStateError when either `mBufferProvider` or `mTarget` is absent,
then otherwise copies four existing values: `isAccelerated`, `isShared`,
`backendType`, `drawTargetType`. These failures must mean unknown, not software.
The JS method is gated by `nsRFPService::IsSystemPrincipalOrAboutFingerprintingProtection`;
privilege alone does not supply the missing existing-context reference.

## Smallest useful future extension

Propose one explicit request, `umbrafox.canvas.snapshot`, with required
`params.context` identifying **one exact current document**. Do not silently
promote it to the top-level context or walk the whole tab tree as mediaSnapshot
currently does. Reject omitted/invalid/discarded/non-content contexts. The client
may request another known frame separately; v1 has no all-tabs/all-frames mode.

Transport: one service dispatch case -> the existing diagnostics module -> one
new diagnostics-actor query, `UmbrafoxControlDiagnostics:CanvasSnapshot`.
Leave existing snapshot responses/work unchanged. No selector, arbitrary script,
evaluation endpoint, page callback, DOM event or content-visible property.

**Required native addition, not currently available:** a chrome-only
window-utils bridge, provisionally `getCanvas2DProviderInfo(canvas)`, returning
plain diagnostic scalars rather than a context/wrapper. It must enforce system
privilege, same owning document/window and main-thread use, and call a small
native HTMLCanvasElement helper that reads its existing context/type and then
calls `CanvasRenderingContext2D::GetDebugInfo(false, ...)` for a genuine existing
2D context. A C++-only element helper can inspect the protected current-context
type without exposing another HTMLCanvasElement WebIDL method. No unsafe cast
from a WebGL/WebGPU/bitmap/offscreen context is acceptable.

Likely native locations: `dom/interfaces/base/nsIDOMWindowUtils.idl`,
`dom/base/nsDOMWindowUtils.{h,cpp}` and `dom/html/HTMLCanvasElement.{h,cpp}`.
This is an implementation proposal requiring normal native/binding review, not
a claim that a JS-only accessor exists or that a signature has been compiled.
The existing `GetDebugInfo` implementation need not change.

Never call `getContext`, `GetOrCreateContext`, `GetBufferProvider` (which may
ensure a target), `getDebugInfo(true)`, EnsureTarget/BorrowTarget, getImageData,
drawSnapshot, getSurfaceSnapshot, readback, resize, flush, layout geometry or
computed-style APIs. Do not add a per-frame observer, retain a context cache,
retry until known, or schedule work into a drawing callback.

## Result and unknown semantics

Return a fixed schema, e.g.:

```json
{
  "context": 42,
  "innerWindowId": "12345",
  "nodesVisited": 12,
  "truncated": false,
  "limitReason": null,
  "canvases": [{
    "ordinal": 0,
    "state": "unknown",
    "reason": "provider-or-target-unavailable",
    "isAccelerated": null,
    "isShared": null,
    "backendType": null,
    "drawTargetType": null
  }]
}
```

The ordinal is request-local document-order position among inspected canvases,
not a stable cross-navigation node identity. Inner-window identity prevents
joining two different documents that share a browsing-context ID.

- `known`: only after the existing getter succeeds. Return its four scalars;
  do not replace false/zero with defaults or inferred backend labels.
- `unknown/no-existing-context`: native context pointer absent, without creation.
- `unknown/provider-or-target-unavailable`: existing 2D getter returns expected
  InvalidStateError. Do not parse its exception text to distinguish the two cases.
- `unsupported/non-2d` or `unsupported/offscreen`: no context coercion and no
  worker/document/shadow-root discovery outside the v1 scope.
- Unexpected native/actor errors: explicit stable error status, not an empty
  successful list or a software classification. Do not leak exception messages,
  paths, URLs, titles, DOM IDs, pixel data, script objects or stack traces.

In particular, a normal snapshot between drawing tasks may see no borrowed
target. Even this proposed feature may frequently return unknown and therefore
may **not** resolve the Pi comparison. An always-available provider-only getter
or a transition recorder would be separate future work; neither is implied here.

## Work, payload and lifecycle bounds

- Synchronous child collection, one active document, light DOM only. Walk at
  most 2,048 DOM nodes and emit at most 16 canvas entries. A TreeWalker must visit
  all node kinds so skipped text/comment nodes cannot hide unbounded work.
  Stop immediately at a cap, mark truncated/limitReason; never querySelectorAll
  then slice, spread an unbounded collection, or obtain an exact total count.
- Use native/Xray DOM reads, not waived wrappers or page-replaced methods.
  No page-provided traversal filter. Construct only bounded scalar records.
  No await/yield/timer in child traversal and no cached node/context/iterator.
  Temporary synchronous rooting is unavoidable; nothing DOM-related survives
  the collection call or is sent across the actor boundary.
- At most 8 KiB encoded result per document, fixed enum strings and numeric
  fields. Validate the bounded shape in the parent before WebSocket serialization.
  The node/canvas caps also bound construction before any size check.
- Require a 2-second parent deadline and no automatic retries. Limit outstanding
  diagnostic queries across connections, including timed-out-but-still-pending
  actor queries. A deadline does not cancel a blocked actor operation; discard
  late replies, keep backpressure until settlement/actor destruction, and never
  accumulate a new query on every timeout. Use an explicit busy error.
- Bind the reply to the requested WindowGlobal identity. Navigation, BFCache,
  discard, content-process loss or actor destruction invalidates a stale reply;
  do not relabel old data as belonging to the new document.
- V1 rejects private-browsing documents before actor dispatch, and the child
  independently checks its active document. No private opt-in parameter is needed
  for this small fixture diagnostic. Do not alter existing private behavior of
  other commands. Keep loopback/per-run-token authentication unchanged.
- Socket closure, service shutdown/reset and actor teardown invalidate requests,
  clear parent deadlines/slots as appropriate, and discard late data. No result
  persistence, event listeners, document caches or background sampling.

## Required future tests

These are acceptance requirements, not tests executed in this read-only lane.

1. Protocol/auth: correct request/response ID and exact context; bad/missing token
   rejected; malformed params, negative/unsafe IDs, missing/discarded context,
   unknown method, forbidden script/selector/options and oversized request fail
   explicitly. No arbitrary native/actor invocation is exposed.
2. Virgin canvas: native current context stays null; `mMaybeModified`, dimensions,
   invalidation state and context-selection freedom are unchanged. A subsequent
   test-owned non-2D context creation must still succeed where supported.
   This catches a hidden `getContext('2d')` discovery call.
3. Existing 2D: in a controlled synchronous borrowed-target test, four output
   values equal `GetDebugInfo(false)`. When target is returned/unborrowed, no
   provider/target is created and fields are null/unknown. Include a 2D context
   with no provider; getter failure must never become `isAccelerated=false`.
4. Alternate states: software/shared and accelerated fixtures, lost context,
   zero-sized canvas, WebGL/bitmap/WebGPU where available, transferred Offscreen,
   detached/adopted node and wrong-document native-helper calls. No coerced
   context, readback, forced layout/flush or native cast crash.
5. Bounds/adversarial page: no canvas, >16 canvases, canvas beyond node cap,
   thousands of text/comment nodes, deep DOM and hostile page overrides/getters.
   Validate work counts, caps, truncation, fixed schema and <=8 KiB response.
   No shadow/worker/descendant-document scan and no await-retained iterator.
6. Lifecycles: navigation/process switch/BFCache while queued, document discard,
   actor rejection/crash/hang, deadline, late/reordered replies, burst across
   sockets, socket close and stop/reset. Assert bounded pending requests and
   resources, no stale document result, no unhandled rejection or repeated retry.
7. Privacy/parity: private request denied before dispatch; private window closed
   during pending work yields no retained/result data. Wrong-document/private
   native-helper bypass denied. No new page globals/prototype properties,
   navigator.webdriver change, page events, observer-visible DOM mutations or
   pixel behavior changes. Any test setup that draws is outside the diagnostic.
8. Idle/off-path: no work with no request, no new per-frame hook; separate
   diagnostic-overhead check on the owned fixture, not during performance timing.

Focused browser tests belong beside existing `browser_control_service.js`; native
helper tests must verify state is untouched, not just mock a successful getter.
Any new privileged bridge requires rulebook/detectability review before shipping.

## Source evidence

Local Umbrafox transport/actor/test files named above were read directly because
they are fork-specific. Searchfox located upstream APIs; current local
CanvasRenderingContext2D::GetDebugInfo was also inspected. No supported route was
inferred merely from a method name or a skill document.

- [Native existing-context getter](https://searchfox.org/firefox-main/rev/9c0ad0c9084ef0e36d29aae83892ea4edf3c9085/dom/html/HTMLCanvasElement.h#208-210)
- [GetContext mutates and creates](https://searchfox.org/firefox-main/rev/9c0ad0c9084ef0e36d29aae83892ea4edf3c9085/dom/html/HTMLCanvasElement.cpp#1184)
- [GetDebugInfo and absent-target behavior](https://searchfox.org/firefox-main/rev/9c0ad0c9084ef0e36d29aae83892ea4edf3c9085/dom/canvas/CanvasRenderingContext2D.cpp#1283)

This supersedes the earlier report's implication that a privileged provider check
was already practically available to l8ros. It is not available through current
UmbraLink, and the strict no-mutation version needs a native bridge.

## Owner clarification

Wyatt reaffirmed on 2026-09-26 that public custom interfaces are prohibited in
product builds. A debugging-only exception must be cataloged and commented with
its exact surface, guards, cleanup owner and exposure tests. This proposal adds
none, requires private-path verification, and does not authorize a public API.
See the [exposure register](../../docs/performance/instrumentation.md#debugging-only-exposure-register).
