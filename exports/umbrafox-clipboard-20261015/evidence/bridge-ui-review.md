# Clipboard UI and Actor Coupling Review

Reviewer: bridge. Source-only follow-up requested by umbra. No source edits,
runtime/browser/build/profile/clipboard access, or tests run for this review.
Searchfox discovery was reconciled against local source. Source findings below
are not a claim of browser/platform reproduction.

## Findings

### P1: Automatic notice consumes Escape before any affirmative override

`UmbrafoxClipboardProtection.request` automatically calls `PopupNotifications.show`
with `autofocus: false`, but no dismissed-only/manual-opening mode. Local
`PopupNotifications._update` installs a capturing chrome-window `keyup` listener
when notifications are showable. `_handleWindowKeyUp` handles Escape even while
the selected browser remains focused; for this nonpersistent notification it
calls `_dismiss` and `preventDefault`. The code explicitly explains that the
preventDefault keeps the event from being forwarded to content.

Thus no-autofocus does not preserve normal input delivery. A site whose canceled
clipboard command opened this notice can subsequently lose an Escape keyup
before the owner has selected Yes/Always. No or passive dismissal must preserve
Firefox-default page behavior under the approved plan.

Falsifier: in an isolated fixture record keydown/keyup/defaultPrevented for a real
Escape before and after a genuine canceled copy. Do not select any override.
Compare against the same fixture without a notice. Include selected page/input
and chrome focus variants. This is a release gate, not covered by checking
`noautofocus` alone. Prefer a browser-owned passive notice/indicator that does not
attach global input interception; do not change PopupNotifications globally or
assume a rulebook exception.

Evidence: `browser/modules/UmbrafoxClipboardProtection.sys.mjs`, `request`/`show`;
`toolkit/modules/PopupNotifications.sys.mjs`, `_update`, `_handleWindowKeyUp`.

### P1: Notice cancellation can explicitly refocus content

`request`'s `finish(false)` removes a live notification, including on the 30-second
timer, native/actor invalidation, or No. `PopupNotifications.remove` calls
`_update`; when there are no showable notifications, `_update` calls `_dismiss`.
`_dismiss` obtains the browser from the old panel child, hides the popup, and calls
`browser.focus()` whenever that browser is still selected. It does not check that
content was focused before the removal or that a user chose a clipboard override.

This is a concrete conditional focus-changing path, not proof every removal
produces a page event. If focus has moved to the address bar or another chrome
control, cancellation/expiry can put it back in content. The same method is used
by the Escape path above. Merely passing `autofocus: false` protects neither
removal nor dismissal behavior.

Falsifier: leave a genuine cancellation notice unanswered, focus the URL bar or
another chrome control, and let dismissal/expiry occur; trace page focus/blur,
`document.hasFocus()`, and chrome focused element across all transitions. Also
test No and target/frame invalidation. A passive surface without this inherited
focus restoration avoids changing default content behavior; native retry should
not restore focus or selection to work around this.

Evidence: `UmbrafoxClipboardProtection.request` (`finish`, timeout);
`PopupNotifications.remove`, `_update`, `_dismiss`.

### P2: Saved frame grants disappear from revoke controls after reload

`noteGrant` remembers requesting principals in `browserGrants`, keyed by the
current top WindowGlobal. `getGrantsForBrowser` deletes that entry when the top
WindowGlobal changes. The underlying persistent permission remains allowed.
`SitePermissions.getAllForBrowser` can then list only the top principal's own
keys, not the saved cross-origin frame key. Both internal clipboard types are
also excluded from the generic Page Info permission editor via `browserOnly`.

The only source path repopulating the frame entry is `noteGrant`, called after a
new Always or by `hasGrant(principal, operation, browser)`. The parent actor calls
the latter only after the next genuine canceled operation, immediately followed
by automatic retry. Consequently, after reloading an embedding page, its user
cannot revoke a previously saved embedded-origin override from that page's
permission panel before the next automatic operation. The unit test named
`known frame grants do not carry over navigation; private types stay out of
generic editor` explicitly verifies hidden listing, continued grant validity,
and reappearance after `hasGrant`.

Visiting the embedded origin as top-level is not a complete workaround when
first-party/partition origin attributes differ from those encoded in the grant.
Provide a persistent exact-key grant-management surface or repopulate revoke
controls using authoritative current frame identities before replay. Do not
restore stale frame principals as authorization or weaken OA isolation.

Falsifier: Always for frame B in top A; reload A; open site permissions before any
further copy/paste; require B's exact grant to be revocable. Repeat with container,
private, first-party-domain/partition attributes and multiple frame origins.

Evidence: `UmbrafoxClipboardProtection.noteGrant`, `getGrantsForBrowser`,
`hasGrant`; `SitePermissions.getAllForBrowser`, `gPermissions` browserOnly flag;
`UmbrafoxClipboardParent.receiveMessage` saved-grant path; cited unit test.

## Boundaries That Look Consistent

- `getPermissionID` encodes complete `principal.origin`, including OAs, and
  separates copy/paste. Exact permission lookup plus the encoded full key avoids
  accidental inherited-host/container/private grants despite permission-manager
  OA stripping. `getAllByPrincipal` filters to that exact encoded key.
- `getGrantPrincipal` decodes and canonicalizes the encoded origin. Standard
  permission-panel remove passes top principal, but the special
  `removeFromPrincipal` branch correctly resolves the actual encoded frame
  principal for deletion. The standard `_createPermissionClearButton` consumer
  was checked. The third actor `hasGrant` argument now passes the browser.
- Private writes request EXPIRE_SESSION and last-pb-context-exited cleanup deletes
  encoded private keys only. Real permission-manager persistence/cleanup still
  needs the parent's isolated test; mocks alone do not prove it.
- Parent derives the principal from its own WindowGlobal, checks current active
  frame/browser/window, and sends only operation/token back to its child. No
  child-supplied origin is trusted. Contenteditable and genuine native command
  provenance are native-owner gates, not inferred by this UI review.
- `allow` sets `choosing` synchronously before awaiting validation. Real
  PopupNotifications button/menu paths call action callbacks without awaiting
  them, then `_remove(..., false)`. The UI's conditional removal handling keeps
  the pending action alive across that expected removal. It persists Always only
  after boolean true from the actor and another lifetime check. Parent retains
  cancellation ownership through retry and returns false if its original frame
  ceased to be current; duplicate affirmative callbacks cannot execute twice.

## Verification Limits

No new tests were executed in this source-only review. Existing unit/browser test
sources were inspected, including the explicit navigation/listing behavior above.
Actual native/actor IPC, clipboard replay, page focus/input parity, permission DB
behavior and popup event ordering on real platforms remain integration gates.
No source changes were made.

## Frozen Source Hashes

- UI module: `88e38ee675f60b767ad9a92d2e0224d914c2f3dc54b408af868bd5d68bc941bc`
- SitePermissions: `a9f7efdc21475e79ef36cdc1014463adc9125994a27cb66891bd608c9e95d745`
- Parent actor: `7999238758677e04d0b9873f9b9170e0a520c59d160129cc79f2d35b17c5b54f`
- Child actor: `99b9ed5a862ce2425f15d81aa1ccb71cbc80b1b4a0f89efc6dbe47e9a7f7daf9`
- PopupNotifications: `8f5a9e40580c6278de36543885b656035c46fda63f012c520140664eed2fbed2`

## Follow-Up: Remaining Default Page Effects

The coordinator authorized the UI owner to address the findings above with a
narrow opt-in passive option, fullscreen suppression, and a bounded parent-local
frame-principal revoke list. This addendum reviews remaining baseline behavior,
not the completed implementation of those changes. No new source changes or
runtime tests were made by bridge. Evidence was sent directly to the UI owner and
coordinator through teamwork events before this report update.

### P1: An Automatic Panel Changes Pointer Lock Before Consent

`nsXULPopupManager::ShowPopupCallback` calls
`PointerLockManager::Unlock("ShowPopupCallback")` after opening every popup whose
type is not Tooltip. The notification is a Panel. Neither `ignorekeys` nor
`norestorefocus` affects this branch. Suppressing notices during existing pointer
lock must happen at actual display time, accounting for the asynchronous
validation and `_hidePanel().then(...)` preceding `openPopup`.

More importantly, suppressing only an already-active lock is insufficient.
`PointerLockManager::IsPopupOpened` calls `GetVisiblePopups(popups, true)` and
accepts any returned non-Tooltip popup. `GetPointerLockError` and the independent
parent-side `SetLockedRemoteTarget` check then return
`PointerLockDeniedFailedToLock`. `PointerLockRequest::Run` forwards a nonempty
parent response to `FailWith`, which dispatches the web-visible
`pointerlockerror` and rejects the request promise. Thus a later otherwise-valid
page request can fail solely because the automatic clipboard notice is visible,
even though the owner never chose Yes or Always.

Qualification: `GetVisiblePopups` excludes invisible and mouse-transparent
frames. `nsMenuPopupFrame::IsMouseTransparent` is computed `pointer-events: none`.
A normal interactive notification panel is not excluded. Making the entire
surface noninteractive is not an equivalent Yes/No/Always interface, and does
not bypass the unconditional unlock during opening.

Recommendation: do not treat the proposed key/focus option as complete default
parity. Use a non-popup passive chrome surface, or an indicator that opens the
popup only after an explicit user action. Do not weaken native pointer-lock
checks or change all notifications as an incidental workaround. Exact UI choice
belongs to the coordinator; no such redesign was implemented in this review.

Falsifiers, in the parent's isolated browser fixture:

- Existing pointer lock, then a genuine canceled clipboard command: no new
  `pointerlockchange`, no lock loss, and no automatic popup.
- Canceled command opens an unanswered notice, then an eligible pointer-lock
  request while it remains open: compare resolution and event trace to Firefox
  without that notice. Use retained activation or a keyboard-driven fixture so a
  page mouse click does not first dismiss the panel.
- A request races async validation and popup display; existing lock and later
  lock-request cases both preserve baseline behavior.

Evidence: `layout/xul/nsXULPopupManager.cpp`, `ShowPopupCallback`,
`GetVisiblePopups`; `layout/xul/nsMenuPopupFrame.cpp`, `IsMouseTransparent`;
`dom/base/PointerLockManager.cpp`, `IsPopupOpened`, `GetPointerLockError`,
`SetLockedRemoteTarget`, `PointerLockRequest::Run`, `FailWith`.

### Independent Native Escape Handling and Shared-Panel Restoration

Disabling only `PopupNotifications._handleWindowKeyUp` is insufficient.
`ShowPopupCallback` reads `ignorekeys`; `UpdateKeyboardListeners` still installs
capturing key listeners unless it equals `true`. Native `KeyUp` for an unlocked
panel handles Escape with `HidePopup`, `StopPropagation`,
`StopCrossProcessForwarding`, and `PreventDefault`. `ignorekeys="shortcuts"`
does not exempt this panel branch. Conversely,
`HandleKeyboardEventWithKeyCode` explicitly returns early for Panels, so this
review does not assert generic panel Tab/arrow capture from that function.

Dynamic attribute restoration has a separate hazard:
`nsMenuPopupFrame::AttributeChanged(ignorekeys)` calls `UpdateIgnoreKeys`, which
mutates `GetTopVisibleMenu()`, not necessarily the frame whose attribute changed.
Its false path sets `eIgnoreKeys_Shortcuts`, rather than the original default
mode. Adding or restoring a shared panel attribute while a different popup is
topmost can therefore modify that unrelated popup's native key mode. Keep
lifecycle ordering explicit and test passive/ordinary replacement, co-display,
secondary menus, async hide, and attribute restoration. No global default change
is justified by the clipboard feature.

### Independent Panel Focus Restoration

`MozPanel.on_popupshowing` saves prior focus; `on_popuphiding` saves current focus.
`on_popuphidden` conditionally calls `Services.focus.setFocus` or `.focus()` unless
`norestorefocus="true"`. Its guards avoid some focus changes but do not establish
the requested invariant for every cancel/expiry/control-focus path. This is
independent of `PopupNotifications._dismiss` and must be covered while preserving
the attribute's original state and behavior for ordinary notifications.

### Outside Clicks: Bounded Conclusion

Arrow panels default to `consumeoutsideclicks="false"`, which maps to
`ConsumeOutsideClicks_ParentOnly`. `RollupInternal` consumes a click inside the
anchor rectangle to avoid reopening the popup; this does not establish that an
ordinary click in page content outside the panel is swallowed. Do not broaden
that into a generic page-click defect without a real fixture. Click/move delivery
under the panel footprint and platform-specific rollup still need browser tests.

## Follow-Up Completion Check

The remaining concrete blocker is pointer-lock behavior, not just Escape/focus.
Shared popup lifecycle and exact ordinary-notification preservation are the
highest-risk test boundaries for the UI owner's option. The previously reviewed
principal/OA and async retry boundaries remain scoped to the frozen source;
forthcoming revoke-list and passive-option changes require their own review.
Unexpected or stale actor requests must continue to fail closed. No clipboard
contents or private data were read. Source inspection cannot certify page parity
across platforms; runtime falsifiers remain with the parent.

## Final Direction Review: Dismissed-Only Indicator

The coordinator selected the existing dismissed-only anchor indicator instead of
an automatic panel. The current UI module now passes `dismissed: true`, leaves
`persistent` unset, and makes no shared PopupNotifications change for this
feature. This addresses the automatic-popup call path identified above at the
source level; the concrete native findings remain relevant if auto-opening is
reintroduced.

`PopupNotifications.show` sets the dismissed state before `_update(..., true)`.
`_update` excludes dismissed nonpersistent notifications from its showable set,
updates the icon, skips `_dismiss` for this initial call, and does not attach its
keyup handler for an empty showable set. Tab/anchor visibility updates do not
clear dismissed state. The standard `_onIconBoxCommand` explicitly calls
`_reshowNotifications` after a chrome anchor click or activation key and focuses
the opened panel. These subsequent popup effects follow explicit user interaction
with chrome rather than the canceled page command itself. Native retry remains a
separate affirmative choice with the same freshness and one-shot checks.

Removal still uses the shared `_update`/`_dismiss` path. In the normal closed
state, `_onPopupHidden` has cleared panel children, so there is no old browser
child for `_dismiss` to focus. Interrupted programmatic hide/replacement and
other notifications sharing the anchor remain useful runtime falsifiers. The
current source browser tests cover unopened state, explicit anchor opening,
page trace, printable/Escape keys, URL-bar focus on removal, and existing/later
pointer lock. They were inspected, not executed by this reviewer.

The revised `getGrantsForBrowser` rediscovers saved frame grants from the current
browser's `getAllBrowsingContextsInSubtree()` snapshot, checks
`ancestorsAreCurrent`, and reads each current WindowGlobal's authoritative
document principal. Native `BrowsingContext::GetAllBrowsingContextsInSubtree`
uses `PreOrderWalk`; `AncestorsAreCurrent` rejects discarded contexts and stale
parent WindowContexts. Exact operation/OA keys are deduplicated before permission
lookup. Listing does not authorize or execute retry, and no content IPC is added.
This addresses the reviewed reload listing gap without requiring a new canceled
command to auto-retry first. Traversal cost is bounded by the existing subtree,
not a fixed numerical frame cap.

Source conclusion: the selected direction is supported by the reviewed producer
and consumer paths, with no new blocker identified in those paths. This is not
runtime certification. Parent integration must run the unopened-indicator parity,
shared-notification lifecycle, exact-OA/private persistence, reload revocation,
and real native replay tests before accepting the feature.
