# Clipboard protection: independent review

Date: 2026-10-15. Task: review. This is the initial source/contract review, not
approval of an integrated implementation. No runtime, browser, native test,
clipboard, profile, build, launcher, Pi, staging or commit access was used.

## Initial findings and gates

### P1: Current proposals conflate notice eligibility with replay safety

Concrete cross-contract conflict: UI `request()` calls `isValid()` before
display; bridge proposes this callback run native `validate`, whose contract
includes unchanged original clipboard sequence, focus and selection. The owner
requires a notice even when the canceled handler supplies replacement data or
handles paste itself. Such a handler can advance the clipboard sequence or
change the field/caret before the notice is displayed. A replay-validation
failure must not silently filter out that cancellation notice.

Separate current-request/document eligibility from safe execution. Keep the
notice for genuine canceled commands with custom replacement. If replay is no
longer safe, request a fresh command without duplicating custom insertion or
restoring stale state. If snapshots are taken after the handler, explicitly
test that custom paste cannot be applied a second time at the new caret. Source
evidence: the replacement-data test in
`dom/events/test/clipboard/browser_clipboard_source_url.js` changes the payload
and cancels the event. This conflict was sent to umbra, bridge and ui in the DB.

The contracts also disagree on `isValid()` being synchronous versus returning a
Promise. Resolve the type explicitly; Promise truthiness is not validation.
If asynchronous, recheck request lifetime after await, so No/dismiss/navigation
during validation cannot later write an Always grant or execute a retry.

### P1: User activation and event trust are not command provenance

The implementation must carry an explicit native browser-command provenance
value. Do not infer a user Copy/Paste command from `isTrusted`, a current user
activation, a recent shortcut, or a content-observed clipboard event. The plan
already notes that `FireClipboardEvent` dispatches trusted events; the existing
`dom/events/test/clipboard/browser_document_command_copy.js` test named `called
from web content` demonstrates successful script `execCommand("copy")` after
`notifyUserGestureActivation()`. Its system-principal test runs the command even
without activation. A page click handler is a concrete false-positive case.

Gate: the native owner must trace the browser command producers and nested
script-command exclusion. A process/thread-global boolean left set while page
handlers execute is insufficient: nested script commands could borrow it. No
new public event, property, IDL member, or page-visible cancellation metadata is
an acceptable substitute. Synthetic DOM dispatch is an additional, not the only,
negative case. This is a required design condition, not a proven patch defect.

### P1: Clipboard-event cancellation alone does not cover paste cancellation

`editor/libeditor/tests/test_middle_click_paste.html` independently cancels
`paste` and `beforeinput`: canceled paste prevents subsequent beforeinput/input;
canceled beforeinput leaves the textarea unchanged and produces no input event.
The latter uses `insertFromPasteAsQuotation`, a separate operation variant that
must either be covered deliberately or documented as excluded. The plan also
identifies `MaybeDispatchBeforeInputEvent` and legacy `textInput` as gates.

Gate: classify cancellation only for a matching genuine native paste action,
not every trusted beforeinput or keydown. Track native action lifetime through
beforeinput/textInput without changing their default Firefox return behavior.
If the prototype covers clipboard-event cancellation only, it must not claim
all paste blockers are handled. A canceled keydown can prevent a clipboard
command from existing at all; keep the documented manual route for this case.

### P1: Replay must validate native target state after chrome consent

The original UI proposal validates synchronously in `isValid()`; the bridge
proposes asynchronous native validation. Either preliminary check cannot establish
freshness at the eventual paste. Native execution must recheck the token,
operation, original inner window, frame, target, focus, selection/value and
clipboard freshness immediately before use. A same-origin navigation is still
a different document. A recreated element with the same id is not the target.

The native command manager's explicit target window is necessary but not
sufficient if it ultimately selects a newly focused editor in that window.
Consume the token before side effects and reject duplicate responses. If the
clipboard changed, or content replaced/inserted text in its custom paste
handler, do not guess how to replay: preserve the first result and require a
fresh explicit command. Retaining a snapshot for replay needs a bounded and
explicitly reviewed privacy/lifetime contract; a token-only notice is safer.

Do not silently restore stale focus/selection to make a retry succeed. Changing
focus to click browser-owned consent also needs a deliberate native policy;
this must not be relaxed into permission to paste into another content target.

### P1: Default chrome notice needs web-visibility verification

Local `toolkit/modules/PopupNotifications.sys.mjs`, `show`, sets `noautofocus`
when `options.autofocus` is false. It also replaces same-ID notifications and
uses a shared panel; the inactive-window branch calls `window.getAttention()`.
Those facts do not prove web-observable parity. Verify no pre-choice change to
focus/blur, visibility, viewport dimensions, event ordering, input delivery, or
the first operation's clipboard/value result. Avoid content-area notification
bars that change viewport size. Do not substitute a DOM event for private
observer transport. No/default dismissal must not invoke a native retry.

This is an unverified parity gate, not a claim that the proposed panel already
causes a mismatch. Native/browser verification is deliberately outside this
review lane.

### P2: Exact origin, origin attributes and revocation must agree everywhere

Local `browser/modules/SitePermissions.sys.mjs`, `getForPrincipal`, uses
`getPermissionObject(..., false)` unless the permission definition sets
`exactHostMatch`. A dynamic private permission type must not accidentally fall
through this path. Native lookups must use the identical full-origin/operation
key and exact-match semantics, not just the UI's interpretation.

The UI contract's full `principal.origin` encoding is a plausible way to retain
attributes that the permission manager strips. It remains subject to producer
and consumer agreement tests. Require explicit last-private-context cleanup,
not only EXPIRE_SESSION; private permission state must not survive reopening a
private session. Cross-origin frame consent must name/store the requesting
document origin, and revocation must remove that same principal's permission.
Always is not an async clipboard-read/write permission. Persisting Always before
a retry does not authorize bypass of native safety checks.

### P2: Contenteditable exemption must resolve effective target/editing context

Local `dom/html/test/test_bug458037.xhtml` tests inherited editability and an
explicit `contenteditable="false"` child of an editable ancestor. The child is
not editable. Literal target-attribute checks are insufficient, and a blanket
ancestor-attribute check would disagree with this distinction. Text-node targets,
closed shadow retargeting, slots, designMode, and native anonymous input/textarea
editor nodes need native-owner confirmation. Ordinary inputs and textareas must
not be exempt merely because their internal editor nodes are editable.

The plan says nested non-editable islands obey a precisely documented exception,
but does not yet settle whether exemption follows effective editability or the
containing editor. Freeze that policy before assertions. Likewise distinguish
an input in an editing host from an input outside one. A literal true/false
decision based on the retargeted outer element can be wrong in either direction.

## Minimum required falsifiers

The following are test requirements, not executed test results. Native/browser
cases belong to coordinator verification in an isolated fixture environment.

1. Default cancellation matrix: real Copy and Paste into ordinary input,
   textarea and selected article text; capture/bubble `preventDefault`, inline
   false and `returnValue=false`. Exactly one eligible notice; original Firefox
   event sequence, value and clipboard result preserved until explicit consent.
2. Replacement data: real canceled copy sets text/plain and text/html; notice
   still offered, dismissal/No retains both formats. Real canceled paste that
   inserts custom text still offers; Yes cannot silently duplicate that text
   under a stale-target workaround.
3. Propagation only: stopPropagation and stopImmediatePropagation without
   cancellation produce zero notices, including listeners that stop delivery
   before a normal JS observer would run. Privileged-only cancellation does not
   prompt; content cancellation plus privileged listeners still follows policy.
4. Provenance: zero notices/retries for new ClipboardEvent dispatch, script
   execCommand without activation, execCommand in a real click handler,
   execCommand nested inside a genuine clipboard handler, and unrelated async
   clipboard activity. Real keyboard, menu and browser-command routes work.
5. Cancellation stage: paste-only, beforeinput-only and legacy textInput-only
   cancellation are independent cases; unrelated insertText/delete/cut remain
   unchanged. A canceled keyboard shortcut alone must not be misreported as a
   canceled clipboard event. Include platform paste variants or state exclusions.
6. Exemption: direct/inherited/plaintext-only editing hosts, false islands,
   nested true hosts, designMode, text-node selection, open/closed shadow roots,
   slotted nodes, input/textarea native anonymous nodes, same/cross-origin frame.
   Freeze exact expected treatment of islands and embedded controls first.
7. Freshness: after notice but before consent, navigate same-origin, navigate
   cross-origin, replace frame/target, change focus, change selection, mutate
   value/text without moving endpoints, mutate clipboard, switch tab, close tab,
   go through BFCache, or expire token. No redirected or stale native action.
8. One-shot: double-click Yes, replay actor response, stale token from prior
   request, forged/malformed operation/id, request coalescing, actor destruction,
   dismissal/removal/expiry races. At most one valid native operation; no leaked
   token or delayed grant from a dismissed request.
9. Scope: copy grant never grants paste; distinct scheme/port/subdomain,
   container, private context and cross-origin child never inherit an unrelated
   grant. Closing all private contexts clears private grant; normal grant
   remains. Revocation from the frame-aware UI restores default behavior.
10. Native safety: unchanged read-only/disabled controls, password-copy limits,
    unavailable clipboard, command-disabled conditions, sandbox/null principal,
    extension cancellation and async clipboard permission outcomes. No broad
    permission/pref flip or script injection.
11. Web visibility before consent: compare event trace (including defaultPrevented
    and clipboard/input event data), focus/blur/visibility, viewport dimensions,
    keyboard/pointer delivery and custom result with upstream/default. Include
    existing open popup, inactive window, hidden/background frame and dismissal.

## Verification and limitations

Searchfox CLI discovery preceded local reconciliation of the named upstream
test/module files. CLI reports 0.18.0 installed and 0.20.5 available; no tooling
updates were made. No C++ discovery was duplicated; native source/command
mapping belongs to umbra. The UI and bridge proposals were read from
`/tmp/codex/clipboard-20261015/ui-contract.md` and
`/tmp/codex/clipboard-20261015/bridge-contract.md`. No frozen implementation diff
was available at this review stage, so findings are design gates, not confirmed
bugs in finished code. No pure tests were run because interfaces are not frozen.

Only this report and the assigned shared progress DB were written. Native
messaging tools are not exposed to this worker, so coordination uses that DB,
not the historic websocket helper. Follow-up: review frozen native/actor/UI diff;
add separately named pure contract tests only after coordinator agreement.

## Follow-up: native producer mapping and transport

Source-only follow-up requested by umbra. New agreed policy: privileged controller
commands count as browser commands; contenteditable exclusion follows effective
editability outside native-anonymous input trees; designMode is excluded.
Keydown prevention stays on the manual/deferred route. Saved grants stay in the
parent and retry the same validated canceled operation, not a native permission
lookup. These decisions supersede the corresponding open policy questions above.

### Recommended minimal provenance boundary

Use `nsBaseCommandController::DoCommand` and `DoCommandWithParams` immediately
around the found handler's `DoCommand` call, only for exact `cmd_copy` and
`cmd_paste`. Pair this with unconditional process-local suppression for the whole
`Document::ExecCommand` entry, before conversions/dispatch that can reenter.
The suppression must dominate both an already-active clipboard scope and any
nested scope. It must restore the outer state on return without changing the
outer request, target, or cancellation record. Do not mark generic docShell,
command manager, or user-activation paths as independently trusted.

This is a smaller evidenced boundary than separate keyboard-producer wrappers:

| Source path | Observed route to the boundary |
| --- | --- |
| `dom/base/nsGlobalWindowOuter.cpp`, `GetControllersOuter` | Installs `nsBaseCommandController::CreateWindowController`, with the outer window as context. |
| `dom/base/nsGlobalWindowCommands.cpp`, window command registration and `nsClipboardCommand::DoCommand` | Registers exact copy/paste and calls `nsCopySupport::FireClipboardEvent`, covering article selection. |
| `dom/html/HTMLInputElement.cpp` and `HTMLTextAreaElement.cpp`, `GetControllers` | Install `CreateEditorController` and `CreateEditingController`. |
| `editor/libeditor/EditorController.cpp`, `RegisterEditingCommands` | Registers `CopyCommand` and `PasteCommand` for exact copy/paste. |
| `dom/html/TextControlState.cpp`, `DoCommandCallback` | Native keybinding callback resolves the element controller, checks enabled state, then calls `controller->DoCommand`. |
| `dom/events/KeyEventHandler.cpp`, `ExecuteHandler` / `DispatchXBLCommand` | Trusted built-in shortcuts resolve a controller and call `DoCommand`; `TextInputListener` uses this path separately from native bindings. |
| `dom/events/EventStateManager.cpp`, `DoContentCommandEvent` | OS content-copy/paste commands resolve the focused controller and call `DoCommand` only when enabled and not an enabled-state query. |
| `dom/ipc/BrowserChild.cpp`, `RecvSimpleContentCommandEvent` | Reconstructs a trusted widget command event and dispatches it into the ESM route. |
| `docshell/base/nsDocShell.cpp`, `DoCommand` / `DoCommandWithParams` | Dispatch to the controller methods; not themselves proof of a user command. |
| `dom/commandhandler/nsCommandManager.cpp`, `DoCommand` | Calls controller `DoCommandWithParams` for params, otherwise `DoCommand`. |

`Document::ExecCommand` has three relevant paths in the inspected checkout:
non-editor copy uses docShell (potentially selecting a focused descendant),
non-editor paste uses the command manager, and an editor target calls the editor
command directly. Therefore suppression only inside the manager, only on the
current document, or only when entering a new controller scope is incomplete.
`CopyCommand::DoCommand` drops the principal and calls `EditorBase::Copy`, so a
nonnull-principal heuristic is not an alternative to explicit suppression.

The existing controller accessors are ChromeOnly in `Window.webidl` and
`HTMLInputElement.webidl`; web `dispatchEvent` does not call these controller
methods. Native cancellation hooks must still be the actual native clipboard
and matching edit-action dispatch results, not arbitrary page events observed
while the scope is active. `Document::ExecCommand` in another same-process
document inside a genuine clipboard listener must also be suppressed.

### Coverage limits and reentrancy falsifiers

- Exact-name gating intentionally excludes `cmd_pasteNoFormatting`,
  `cmd_pasteQuote`, `cmd_pasteTransferable` and `cmd_copyOrDelete` (all separately
  registered in `EditorController.cpp`). Do not claim every paste variant.
- Searchfox's direct `PasteAsAction` callers include
  `EventStateManager::HandleMiddleClickPaste` and
  `HyperTextAccessible::PasteText`; they bypass the proposed controller scope.
  These are specific native-user routes needing separate coverage if included.
- `EditorBase::PasteAsAction` synchronously dispatches paste then calls
  `HandlePaste`; text-editor `HandlePaste` synchronously reads the transfer and
  inserts text. It can redirect to a new editor when the paste listener changes
  focus. The default path must retain that Firefox behavior; pending retries
  must remain tied to their captured target, and beforeinput cancellation must
  not be attributed to a different editor merely because the scope is live.
- `PasteCommand::DoCommand` and `nsClipboardCommand::DoCommand` can spin the
  event loop in `DataTransfer::WaitForClipboardDataSnapshotAndCreate` for the
  existing script-paste permission flow. Process-local scope/suppression must be
  stack-safe, not one global boolean. A reentrant independent controller command
  cannot overwrite the outer request. A genuine command during a suppressed
  script-paste nested loop may be conservatively missed; do not lift suppression
  based on transient activation to compensate.
- No `RecvDoCommand` or command `RecvDispatch` exists in inspected local or
  indexed `WindowGlobalChild`; it has `RecvDispatchSecurityPolicyViolation`.
  Do not place hooks based on that historic receiver assumption. The complete
  chrome-menu remote path was not resolved in this bounded pass, so integrated
  menu coverage remains a parent verification gate despite the common final
  controller coverage above.

Minimum targeted tests: native article copy, input and textarea copy/paste with
both shortcut dispatch paths, browser-menu command, real command with nested
same-document and other-document execCommand, nested synthetic ClipboardEvent /
beforeinput, and command-state queries. Outer genuine command must still offer
once after nested script commands are excluded. Exact-name variants above must
be documented and must not borrow an outer scope.

### Command-params constructor assumption is invalid

The proposed `Cc["@mozilla.org/embedcomp/command-params;1"]` is unsupported by the
inspected current source. Searchfox found no command-params contract or
CommandParams component registration. Local `dom/commandhandler/moz.build`
exports/compiles `nsCommandParams` and its XPIDL but registers no factory.
`nsICommandParams.idl` declares `[scriptable, builtinclass]`, and
`nsCommandParams.h` implements `AsCommandParams()` as a concrete static cast.
Do not replace it with a JS object implementing that interface. This source
evidence agrees with the coordinator's independently reported runtime failure;
this worker did not run that runtime test.

Existing `@mozilla.org/hash-property-bag;1` is registered in local
`xpcom/build/components.conf` as `nsHashPropertyBagCC`, implementing the existing
writable property-bag interfaces. A dedicated in-process native action observer
can accept that bag without adding web IDL. This is distinct from the window-
subject observer used to route a notice into JSWindowActor.

Required action-bag contract: exact native inner-window interface, bounded token,
exact operation/action enum, `accepted=false` initialized by the caller, and a
single native request match. Unknown/missing native observer leaves false;
malformed bag or wrong window/token/operation fails closed. Native consumes
retry before side effects; validate/discard cannot enter a normal copy/paste.
`nsObserverService::NotifyObservers` calls observers inline and returns NS_OK
even if the topic has no observers, so NS_OK is not acceptance. Do not serialize
or expose the bag to content, retain clipboard contents in it, broadcast it over
IPC, or use observer topic obscurity as authorization. Native registration and
cleanup must exist for exactly the pending-request lifecycle. Privileged code
can reach observer services by design; native token/state checks remain required.

Verification: Searchfox discovery and local source reconciliation only. No
native edits, builds, tests, runtime or clipboard access. Recommendation supports
the common-controller design under the conditions above; it is not integrated
runtime proof. Constructor findings and scope evidence were sent through the DB.

## Native draft review

Reviewed source: `dom/base/UmbrafoxClipboard.{h,cpp}` and the hooks in
`nsCopySupport.cpp`, `nsContentUtils.cpp`, `Document.cpp`,
`dom/commandhandler/nsBaseCommandController.cpp`, and
`editor/libeditor/EditorBase.cpp`. The coordinator changed the main tree during
review while building an older isolated snapshot; source corrections below are
not runtime verification of that snapshot.

### P1 open: snapshot validity is not clipboard freshness

`PendingClipboardRequest::Fresh` treats `mClipboard->GetValid()` as proof that
the clipboard has not changed. Current implementations do not provide that
guarantee to this content-process caller:

- `widget/nsClipboardProxy.cpp`, `ClipboardDataSnapshotProxy::GetValid`, returns
  only `mActor->CanSend()`. The parent-side sequence check happens lazily in
  `widget/ClipboardReadRequestParent.cpp`, `RecvGetDataSync` / `RecvGetData`.
  A copy retry never reads that old snapshot, so after the nonempty-flavor fix it
  can overwrite an intervening clipboard change while the proxy still says valid.
- `nsClipboardProxy::GetDataSnapshotSync` returns a
  `ClipboardPopulatedDataSnapshot` when Content Analysis is active.
  `widget/nsBaseClipboard.cpp`, `ClipboardPopulatedDataSnapshot::GetValid`,
  unconditionally returns true because it holds a copy of old data. A retained
  paste snapshot can therefore survive an actual clipboard change and still
  pass `Fresh()`.
- `EditorBase::GetDataFromDataTransferOrClipboard` deliberately falls back to
  the CURRENT clipboard when snapshot validity is false or `GetDataSync` returns
  `NS_ERROR_NOT_AVAILABLE`. That is appropriate upstream behavior, but not a
  safe pending-retry contract. `TextEditor::InsertTextFromTransferable` puts this
  newly read data into beforeinput before the added `AfterEvent` check runs.
  Rejecting after dispatch is too late to prevent disclosure in that event.

Required correction: establish authoritative clipboard generation/currentness
and make the private retry path fail closed rather than use the upstream
current-clipboard fallback. Do not weaken ordinary Firefox paste behavior.
If this cannot be established, require a fresh user command instead of replay.
Test fixture clipboard A -> canceled operation -> change to B -> accept: no
copy overwrite, paste insertion, or beforeinput data from B. Cover normal proxy
and Content Analysis/populated-snapshot paths. This worker ran no such test.

Also, a text/plain snapshot request is not universally metadata-only:
`nsClipboardProxy::GetDataSnapshotSync` explicitly fetches data through
`SendGetAllClipboardDataSync` in the Content Analysis branch. Do not document
the new default copy-notice snapshot acquisition as universally data-free.

### P1 corrected in main source: empty-flavor copy snapshot

The first draft passed `{}` to `GetDataSnapshotSync` from `Offer`, ignored its
result, and then required a nonnull snapshot in `Fresh`. Local
`nsClipboardProxy::GetDataSnapshotSync` rejects an empty flavor list with
`NS_ERROR_INVALID_ARG`, so content-process copy retries necessarily failed.
Coordinator changed the call to request text/plain; confirmed by source reread.
Native Copy Yes verification remains required, and the freshness issue above
remains independent of this fix.

### P2 open: expiry calculation after blocking work

The revised `Offer` checks `Current()` before its synchronous clipboard call,
then converts `30000 - elapsed` to `uint32_t` for the timer. If clipboard access
or intervening work crosses the deadline, conversion of a negative duration
can produce an out-of-range/large delay. The pending raw field value, document
and snapshot can then outlive the stated 30-second bound. Recheck currentness
after blocking acquisition and safely bound the positive remaining duration
before registering the request and timer. Test near-deadline acquisition with
an injected monotonic clock/delayed snapshot, not a real clipboard stall.

### Source corrections confirmed during review

- First draft suppressed a notice when both content and chrome canceled, despite
  the owner's content-cancellation-is-sufficient contract. Main source now records
  `mDefaultPreventedByContent` alone and still respects chrome cancellation on
  retry. Test both orders plus chrome-only cancellation.
- First draft returned from a nested controller constructor leaving `sCommand`
  pointing to the outer request. Main source now saves/masks/restores that pointer
  and tracks controller depth, so a nested native controller cannot borrow the
  outer retry override. Whole-entry `Document::ExecCommand` suppression still
  dominates. Test a same-target nested paste from a privileged callback during a
  retry, then verify the outer action resumes without losing its own scope.
- `validate` now uses `Current`, while execution uses `Fresh`: custom replacement
  may make replay unsafe without suppressing the original cancellation notice.
  This addresses the initial notice-versus-replay contract conflict.

### Async lifetime and bounded conclusions

No missing asynchronous lifetime was found for the supported ordinary
input/textarea paste route in the inspected source. `PasteCommand::DoCommand`
calls `EditorBase::PasteAsAction`; that dispatches paste and calls
`TextEditor::HandlePaste`, which obtains data and synchronously calls
`InsertTextFromTransferable` and `MaybeDispatchBeforeInputEvent`. The native
controller scope encloses these calls.

`AsyncEventDispatcher::RunDOMEventWhenSafe` dispatches synchronously when scripts
are safe. In the unsafe branch it posts an event, but the upstream input and
legacy-text dispatchers make those deferred events noncancelable first. Therefore
the added immediate after-dispatch hooks do not miss a cancellable asynchronous
beforeinput/textInput in that branch. `FireClipboardEvent` independently refuses
unsafe script dispatch. This is source evidence, not an integrated timing test.

The existing script-paste permission flow may spin a nested event loop; keep the
scope stack and whole-execCommand suppression tests. Beforeinput/textInput hooks
still require the exact captured target and paste input type. Content focus
redirection retains original Firefox behavior on the first attempt, while retry
must fail when the original target/selection no longer matches.

Verification: all findings are from source reading, Searchfox discovery and
local reconciliation. No native, browser, process, clipboard or pure tests were
run in this lane. Parent reported hash-bag fail-closed baseline PASS and old-build
canceled-copy notice RED; neither is claimed as this worker's execution.

## Final Native Lifetime And Sync-Validity Review

Source-only follow-up, 2026-10-15. This section supersedes the earlier open
freshness/TTL implementation descriptions where explicitly noted. No native
source edits, generated/build-tree access, browser/process tests, or clipboard
access were performed by this reviewer.

### P1: canceled-copy acquisition is not always metadata-only

`PendingClipboardRequest::Offer` obtains a text/plain snapshot before the user
approves retry. `nsClipboardProxy::GetDataSnapshotSync` explicitly branches on
`nsIContentAnalysis::MightBeActive()` and invokes
`ClipboardContentAnalysisChild::SendGetAllClipboardDataSync`, importing the
returned data into `ClipboardPopulatedDataSnapshot`. Thus this added initial
copy-notice path can read clipboard contents and invoke Content Analysis.
The populated snapshot's later fail-closed validity result does not undo that
read. The narrow correction is to skip this acquisition when Content Analysis
may be active, still allowing the cancellation notice but rejecting replay,
or use an explicitly metadata-only native acquisition. Do not alter ordinary
clipboard callers globally. This was reported immediately in the shared DB.

### P1 Review Gate: the proposed parent validity call can invoke an owner

`ClipboardReadRequestParent::RecvCheckClipboardOverrideValidity` calls the
snapshot helper. The real snapshot currently delegates to `IsValid()`. Its
cached branch calls `GetClipboardCacheIfValid`; a sequence mismatch calls
`ClipboardCache::Clear`, which invokes
`mClipboardOwner->LosingOwnership(mTransferable)` before releasing the owner.
`nsIClipboardOwner` is scriptable, and the Searchfox-generated declaration is
annotated `JS_HAZ_CAN_RUN_SCRIPT`. Therefore the claimed no-script/no-callback
property is not true for all supported snapshots. No UAF or deadlock is claimed
as reproduced; this is a concrete contradiction of the sync-route safety premise.

Smallest candidate correction: a dedicated side-effect-free generation predicate
that checks the stored/native sequence without invalidating the cache or notifying
its owner, returning false on missing clipboard/error/mismatch. The inspected GTK
`GetNativeClipboardSequenceNumber` only returns stored sequence counters. Review
other supported platform getters before claiming the same backend property.
Keep existing `IsValid`/`GetValid` behavior unchanged for ordinary callers.

### Why a bare async replacement is insufficient

The reply is needed before the current synchronous native default action continues,
including after replay paste/beforeinput/textInput handlers. An earlier async
preflight can become stale during those handlers. A later async response cannot
retroactively stop clipboard writes or insertion; the native controller RAII
scope and event-status decision have already unwound. An async design would need
an explicit cancellation/continuation state machine and renewed validation at
every resumed script boundary, not just an async message substitution.

The inspected helper callsites are `PendingClipboardRequest::Fresh` during
explicit retry, including after paste-related handlers. `validate` uses
`Current`, initial offers do not call this helper, and ordinary snapshot
`GetValid` is unchanged. Proxy result starts false and requires both a live actor
and successful IPC. The parent actor owns its snapshot via `nsCOMPtr`, and the
route returns a bool without transferring data. This does not resolve the owner
callback issue above. Fork sync-message allowlisting is a project decision, not
evidence of external Mozilla IPC-peer approval.

### Ownership And Shutdown

The pending request is held by the static reference, strong observer registration,
and timer callback; it owns the document, target/selection/editor, snapshot and
private field value. `Clear` keeps a local strong self-reference, cancels/releases
the timer, removes the observer, then clears the matching static reference.
`nsTimerImpl::CancelImpl` releases the callback outside its mutex. Request
destruction removes its non-owning mutation observer.

The local `XPCOMInit.cpp` shutdown sequence cancels timers, clears the observer
service's table, then advances to `XPCOMShutdownFinal`, the default phase for
`ClearOnShutdown(&sPending)`. These three roots are therefore released on the
inspected normal shutdown path. No persistent ownership cycle was found there.
Expiry is checked again before retry; the timer bounds normal retention, not
physical erasure while the main thread is stalled or a command still owns the
request. Pending state deliberately retains a detached document until cleanup.

### Freshness, Default Behavior, And Interface Corrections

- Freshness now queries authoritative clipboard validity before checking current
  document, mutation flag, effective editability, target document, focus, range
  endpoints, field value/editor identity, and disabled state. This ordering covers
  changes during the synchronous query. The callback caveat above still applies.
- `EditorBase::GetDataFromDataTransferOrClipboard` returns a snapshot-read failure
  during explicit retry instead of falling through to the current clipboard.
  `TextEditor::HandlePaste` returns that failure before `InsertTextFromTransferable`
  and its beforeinput dispatch. The retry supplies the original snapshot-bearing
  DataTransfer; ordinary and execCommand-suppressed paste retain upstream fallback.
- Initial hooks only record cancellation and do not rewrite the event status.
  Replay hooks require the matching exposed target and operation/input type;
  content cancellation is overridden only after freshness succeeds, while chrome
  cancellation blocks it. Input focus redirection stays unchanged on first use.
  Nested controller scopes mask/restore outer command state, and whole-entry
  Document::ExecCommand suppression remains dominant.
- The previously reported timer conversion issue is source-corrected: Current is
  rechecked after snapshot acquisition and remaining duration must be positive and
  no greater than 30000 before uint32 conversion.
- The raw C++ virtual proposal was rejected by the XPIDL compiler, per parent.
  Final source instead appends `[noscript, notxpcom, nostdcall] boolean
  isCurrentForClipboardOverride();` after the four existing XPIDL methods.
  All three native implementations are present: real, proxy, and populated-false.
  Parent reports regenerated existing-method prefix preserved. Reviewer did not
  inspect generated artifacts. Privileged-JS helper invisibility and existing
  XPIDL method calls remain execution gates; no page WebIDL API was added.

### Minimal Remaining Verification

1. Content Analysis active: canceled copy performs no new clipboard data read;
   notice still appears and unsafe replay is rejected.
2. Snapshot with a clipboard owner, then sequence change: the explicit validity
   query must not synchronously invoke ownership callbacks under the proposed
   callback-free contract. Actor disconnect and IPC failure return false.
3. Clipboard A -> canceled request -> clipboard B -> retry: no copy overwrite,
   insertion, or beforeinput disclosure of B. Repeat change from a replay handler.
4. Mutate value/range/focus/document or expire during validation/handler execution:
   reject before default side effects. Failed snapshot read must not use fallback.
5. Pending request expiry, replacement, discard, observer/timer registration
   failure, and normal shutdown release retained state; duplicate retry fails.
6. Existing XPIDL calls and no privileged JS helper property; nested controller
   and nested execCommand stay isolated; uncanceled/propagation-only/default
   first-attempt behavior stays Firefox-equivalent.

The dismissed-only UI anchor change and all builds are parent-reported context,
not independently verified in this native source-review lane.

## Frozen Follow-Up: Combined Corrections Source-Confirmed

The two findings in the preceding section are now addressed in main source,
as confirmed by a final reread. This is source review acceptance of those narrow
corrections, not runtime approval or a claim of complete default parity.

- `Offer` guards copy snapshot acquisition with
  `!nsIContentAnalysis::MightBeActive()` and includes `nsIContentAnalysis.h`.
  The cancellation notice still uses Current; copy has no snapshot in this
  branch, so retry Fresh fails closed before native replay. No global clipboard
  code or preference was changed by this guard.
- The real snapshot helper now checks its strong `mClipboard` reference, calls
  `GetNativeClipboardSequenceNumber`, and compares the result to `mSequenceNumber`.
  It no longer calls `IsValid`, cache cleanup, or the owner callback. Existing
  GetValid still uses IsValid. The inspected GTK sequence getter is a stored
  counter read, so this helper has no script callback on that backend.
- The parent bool handler copies `mClipboardDataSnapshot` to a local `nsCOMPtr`
  and returns false for null; the snapshot and its strong clipboard reference
  remain alive through the query. Proxy failure remains false. The populated
  snapshot implementation remains false.
- The previously traced cleanup, post-IPC target checks, native command masking,
  execCommand suppression, retry-only no-fallback, and timer-duration bounds are
  unchanged by these corrections. No additional concrete lifetime blocker was
  found in the inspected supported path.

Targeted Searchfox discovery under widget/tests/gtest found no existing snapshot
fixture to extend (not an exhaustive all-tree nonexistence claim). Existing
`widget/tests/file_test_clipboard_getDataSnapshotSync.js` and its chrome wrapper
cover snapshot behavior, but the new noscript helper cannot be called directly
from them. A native owner-callback counter test would need a suitable controllable
native clipboard fixture; this review did not create or run one. Preserve the
source proof and require isolated stale-clipboard end-to-end verification plus
existing-XPIDL-call/helper-invisibility checks. Also retain expiry/replacement,
Content Analysis notice-without-read, post-IPC target mutation, nested-command,
and snapshot-error-no-fallback gates. Other platform sequence getters were not
fully reviewed. Build synchronization, regenerated interfaces, and runtime
verification remain parent responsibilities.

Reviewed source fingerprints (SHA-256):

```text
b2e40ba9581aa443ed32546577c9732a9423c8a0154c7583f378e5b74e791f82  dom/base/UmbrafoxClipboard.cpp
64213857adc0ee97b489453944bd201d13add8ccbad086a66ad408ea7d7f93e0  widget/nsBaseClipboard.cpp
8c3fe3af600ccca7a0d6b8c7cd6416355ebce7ecaf64c11e43c24ef1a2674666  widget/ClipboardReadRequestParent.cpp
de91f0d4803366b54514790d734c1f6ecadb56fcdd6ade59fea211e6a9afa119  widget/nsIClipboard.idl
da274755a66a87c5d94c712b0666cf5213175b35e8ed6ab931ebf07975fb890a  editor/libeditor/EditorBase.cpp
```

Reviewer work is frozen after this record. Only this report and the shared
teamwork SQLite DB were modified; no source or test file was edited or executed.
