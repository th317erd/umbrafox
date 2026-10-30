# Clipboard protection

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

Status: Linux prototype implemented and integration-tested with three scoped
agents. See the [implementation report](../reports/2026-10-15-clipboard-protection.md)
for measured gates and remaining route/platform limitations. Prototype installation
is authorized after verification; the active daily browser must not be closed or
restarted without consent. Owner withdrew default-on protection in favor of
Firefox-default behavior plus an explicit per-site override. No parity exception
is approved or assumed. No personal clipboard or daily browser access is
authorized. Main baseline: `25de5d0b584d`; native package provenance separately
records its isolated source base plus patch/supplement. The canonical
upstream-differences guide tracks this implementation in
[recipe 19](../../conversion-guide/recipes/19-site-clipboard-override.md).

## Owner decisions, October 15, 2026

Initial request: prevent websites from blocking Copy or Paste.

Owner clarification:

> So we _allow it_, but ONLY on "editable=true" elements... I am fine with such a compromise as this.

Further clarification:

> And I would rather have it so the user can toggle _off_ the feature (i.e. we ALWAYS allow Copy and Paste to proceed normally, however, the user can _allow_ the website to prevent their copy+paste)... not the other way around, where it is disallowed at first, and then the user can allow it.
>
> RE: "contenteditable" - Yes, this is what I meant.

Earlier requested policy, now superseded:

- Protection enabled by default, with an owner-controlled disable setting.
- Ordinary inputs, textareas and selected non-editable page text are protected.
- Contenteditable editors retain site-managed clipboard/editing behavior.
- Disabling protection restores the existing Firefox behavior.

Latest owner decision and proposal:

> Simply defaulting to "off" and then we retain parity.

> What if we have it be a "site setting", like accessing your camera or microphone

> Hey! This site just blocked your {copy|paste} operation. Would you like to proceed anway? {No} {Yes} {Always}

Owner trigger clarification:

> (though in the case we are trying to cover--a news site trying to prevent you from copying the article's title--we wouldn't care, and so would default to "if defaultPrevented, show the user".

Outside the contenteditable exemption, content cancellation of a genuine user
copy/paste attempt is sufficient to offer the override. Do not suppress the
offer based on inferred intent or evidence of custom replacement content. The
owner accepts that legitimate custom handlers can also trigger the offer.
Propagation stopping alone is not cancellation and must not trigger it.

## Revised design proposal

Keep Firefox clipboard behavior until the owner explicitly chooses an override.
Use browser-owned UI and private permission storage, not a new web-exposed
Permissions API name or a website-requestable permission.

For a genuine user copy/paste attempt canceled by content, offer a nonmodal,
non-focus-stealing browser notice. No leaves the original result unchanged; Yes
requests one browser-native retry; Always records a revocable site override.
Retain the previous contenteditable exemption unless the owner changes it.
Synthetic events and background script activity must not trigger prompts.

Implementation review correction: the initial notice is a dismissed permission
indicator. The choices open only after an explicit click on its browser-owned
anchor. An automatically opened XUL panel changes page Escape delivery and
pointer-lock eligibility even with autofocus disabled; it therefore cannot be
the default under the parity rule. No shared popup behavior change is needed.

Cancellation is not proof of failure or hostility. Firefox's
`FireClipboardEvent` explicitly supports canceled copy events with replacement
DataTransfer data, and a page may handle paste insertion itself. Nevertheless,
per the owner's clarified policy, this still qualifies for an offer outside
contenteditable. No success/intent heuristic is required. Prefer factual wording
such as "This site canceled the browser's standard paste. Paste using the browser
instead?" Do not retry automatically: leaving the notice unanswered or choosing
No preserves the first operation's result, including custom clipboard data.
Keep a manual browser override accessible for blockers outside the detected paths.

Do not pause event dispatch or await the UI from the page's event handler. The
first attempt completes with normal Firefox semantics; an affirmative response
is a separate owner action. Expire pending actions on navigation/frame replacement
or stale selection/target state. Do not paste into a newly focused element or
silently retain sensitive clipboard data indefinitely. Where safe retry cannot
be established, require the owner to repeat the command.

Scope Always to the relevant origin and operation, preserving private/container
isolation and a visible revoke control. Cross-origin frames must not inherit a
blanket top-level grant; attribution/storage keys remain an implementation gate.
Never turn this into permission for unrestricted async clipboard reads/writes.
Rate-limit/coalesce notices without changing clipboard event behavior. Browser
UI focus/visibility effects need parity tests rather than assumed invisibility.

This design uses the rulebook's explicit user-customization allowance. Once an
override is selected, the resulting behavior can be observable; no guarantee of
undetectability for the configured site is intended.

## Evidence and implementation territory

Read-only local and Searchfox inspection established these separate boundaries:

- `nsCopySupport::FireClipboardEvent` dispatches trusted clipboard events and
  uses their canceled status to select the native action or the page override.
  `dom.event.clipboardevents.enabled=false` suppresses these events outside
  chrome documents, but is global rather than contenteditable-selective.
- `InputEvent::GetData` and `GetDataTransfer` also consult that existing pref
  to avoid leaking clipboard data after event suppression. A replacement must
  not inadvertently change data exposure or permissions.
- `EditorBase::AutoEditActionDataSetter::MaybeDispatchBeforeInputEvent` treats
  canceled `beforeinput` as an aborted edit. Ignoring only `paste` cancellation
  therefore does not cover all paste blockers. The legacy `textInput` path
  also needs review before selecting an implementation.
- `Event::PreventDefaultInternal` is used by JS `preventDefault`, legacy
  `returnValue=false`, and false returns from inline handlers. It distinguishes
  native/system cancellation from content cancellation. Any central change here
  has broad impact and needs strict event, principal and target guards.
- `EventDispatcher::HandleEventTargetChain` clears propagation-stop flags before
  dispatch to the system event group. This is useful source evidence, not proof
  that every keyboard/menu action survives hostile listeners.
- `nsGenericHTMLElement::IsContentEditable` accounts for inherited editability;
  checking only the literal attribute on the event target would be incorrect.

Upstream references: [Clipboard API and events](https://www.w3.org/TR/clipboard-apis/)
and [paste event](https://developer.mozilla.org/en-US/docs/Web/API/Element/paste_event).
These describe cancellation as supported website behavior; protection is an
intentional owner override, not a correction to Firefox's standards behavior.

Implementation uses exact native controller commands, whole-entry script
suspension, native beforeinput/textInput hooks and private observer/actor
transport. Do not replace these with guessed Ctrl/Cmd keycodes in a global key
listener. Full physical platform shortcut/menu and shadow-tree matrices remain
limitations, rather than implied verification from native command tests.

## Limits and invariants

The feature can override cancellation; it cannot guarantee that arbitrary page
JavaScript will retain inserted text. A page can replace a field, change focus or
selection, erase its value afterward, or deliberately become contenteditable.
The requested exception itself permits the latter. Textarea-based custom editors
may also rely on cancellation, despite not using contenteditable.

Keep asynchronous Clipboard API permission checks, user activation, password-copy
restrictions, disabled/read-only controls, synthetic-event semantics and native
browser safety checks intact. Copy does not require an editable destination;
Paste still requires an eligible destination. Cut is not part of the current
request. Selection/CSS override and context-menu restoration are not yet scoped.

## Verification gates

Before implementation, reproduce cancellation with failing-first native tests
using fixture-only clipboard data and an isolated browser/clipboard environment.
Do not read or replace the owner's clipboard or restart the daily browser.

Required matrix:

1. With no saved override and with a dismissed notice, the original Firefox
   event order, cancellation, data handling and result remain unchanged.
2. After explicit override, copy and paste succeed despite page cancellation outside editing hosts,
   including keyboard and browser-command routes, capturing/bubbling handlers,
   inline false returns, legacy returnValue, and paste beforeinput cancellation.
3. Contenteditable, inherited editing hosts and nested non-editable islands obey
   the precisely documented exception; cover shadow roots and frames.
4. Revoking the override restores original behavior, including custom clipboard data.
5. Synthetic events, unrelated shortcuts/edit actions, browser chrome and
   permission/security restrictions retain their original behavior.
6. The user setting persists and toggles without requiring a restart; test
   settings UI and native consumer together, not just a pref value assertion.
7. A genuine canceled copy outside contenteditable offers the override even if
   the handler supplied replacement clipboard data. No/default dismissal retains
   that data; an accepted retry executes at most once per explicit choice.
   stopPropagation/stopImmediatePropagation alone never trigger the notice, nor
   do synthetic events or privileged-only cancellation. Notices cannot be
   spammed by script. Navigation, target removal, changed focus/selection,
   clipboard changes, private windows, containers and cross-origin frames cannot
   redirect a pending retry or inherit an unintended grant.

Bound native tests with a timeout and preserve complete logs. A mocked dispatch
or a frontend-only build cannot validate the native behavior. Native compilation,
integrated tests and review must precede a completion or installation claim.
