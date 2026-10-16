# User-controlled site clipboard override

## Status

COMPILED AND INTEGRATION-VERIFIED Linux prototype, October 15, 2026. The
[implementation report](../../bot-docs/reports/2026-10-15-clipboard-protection.md)
records exact native, browser, permission and tooling gates plus limitations.
Package provenance and installation state are recorded separately under
`exports/umbrafox-clipboard-20261015/`. Daily-browser activation still requires
correct profile mapping and owner close consent; source acceptance is not
cross-platform release acceptance.

Canonical design/source map:
[clipboard protection plan](../../bot-docs/plans/clipboard-protection.md).
That plan retains the owner's decisions and superseded proposals. Implementation
commit: `47e6fdeb78fee3bde3447b348f49244025b0b738`. The export README records the
separate package provenance and installation receipt.

## Goal and agreed behavior

Let the owner override a website that cancels their copy/paste action without
changing Firefox behavior by default.

- Observe genuine user copy/paste actions in native browser handling, not with
  an injected webpage listener.
- Outside contenteditable, content cancellation is sufficient to offer the
  override. Do not infer intent or suppress the offer merely because the site
  provided custom clipboard content. Legitimate handlers may also prompt.
- `stopPropagation` or `stopImmediatePropagation` alone is not a trigger.
- No leaves the original result untouched. Yes requests one browser-native
  operation. Always remembers a revocable site override.
- Keep contenteditable editors exempt and retain normal clipboard permission,
  user-activation, password-copy, read-only and privileged safety restrictions.
- Do not add a web-exposed permission/API or grant background clipboard access.

The initial UI is a dismissed permission indicator. The user opens its choices
by clicking the browser-owned anchor. Source review found that an automatic XUL
popup changes page Escape delivery and pointer-lock eligibility even with
autofocus disabled. Do not reintroduce an automatically opened panel or change
shared popup behavior to work around this default-parity boundary.

The default-on protection proposal was explicitly withdrawn. Do not flip
`dom.event.clipboardevents.enabled` off globally as a substitute. Browser behavior
may differ only after the owner chooses the override, under the existing
user-customization allowance; no blanket Firefox-parity exception was approved.

## Implementation and rebase checklist

Reapply controller authority and whole-entry script suspension together. Keep
the native target snapshot before original dispatch, distinguish notice
eligibility from replay freshness, and consume before any explicit retry.
Recheck state after clipboard/beforeinput/textInput handlers and before copying.
Never suspend page dispatch while waiting for UI or redirect a stale action.

Reconcile the four existing snapshot method slots and every snapshot
implementation before adding the private helper. Preserve generation-only IPC,
parent snapshot ownership, the sync-message allowlist and stale-paste rejection.
An incremental native build, not a frontend-only refresh, is required here.

Merge actor registration and exact principal/current-global checks with current
upstream APIs (`documentGlobal` in this revision). Reconcile PopupNotifications
action-removal ordering, SitePermissions dynamic IDs/revocation and actual
WindowGlobal creation timing. Do not rely on stale frame caches or manually
refresh the permission UI in tests. Keep the full file checklist in
`reference/changed-files.md` and run the report's commands after the rebase.

## Verification And Remaining Limits

Native build passed. Real browser tests: 808 assertions pass, zero unexpected
failures, two expected harness preference-migration TODOs. Existing synchronous
and asynchronous snapshot tests: 668 pass. New and existing permissions tests:
148 pass. UI/actor pure tests: 51 pass. Exact commands and failing-first history
are in the implementation report. In the xpcshell manifest keep both
`firefox-appdir` and `umbrafox-appdir` pointing to `browser`: the harness selects
the key from the build's actual appname, not its Firefox-compatible user agent.

Actual command/actor/UI tests cover default and dismissed behavior, Yes/Always,
native success-before-grant, custom handlers, beforeinput, propagation, script
and synthetic exclusion, nested authority, stale clipboard/selection/value/target,
readonly/disabled mutation, exact tokens/windows, frame revocation after reload,
container grants and permission-store private cleanup. Physical keyboard/OS-menu,
all shadow-tree variants, real 30-second expiry, other OS builds and exhaustive
same-build Firefox A/B timing are not comprehensively verified. Optimized runs
do not supply refcount leak detection. Do not claim more than this matrix.

Use isolated native browser tests with fixture-only clipboard data. Do not use
the owner's active browser, profile or clipboard. Mock-only tests cannot establish
native command or web-visible default parity.

## Implemented Source Map

- `dom/base/UmbrafoxClipboard.h` and `.cpp`: native controller scope, pending
  document/selection/target identity, cancellation observation, expiry and retry.
- `dom/commandhandler/nsBaseCommandController.cpp`: exact native Copy/Paste
  command provenance; nested controllers cannot borrow an outer scope.
- `dom/base/Document.cpp`: whole-entry script `execCommand` exclusion.
- `dom/base/nsCopySupport.cpp`, `dom/base/nsContentUtils.cpp` and
  `editor/libeditor/EditorBase.cpp`: clipboard, beforeinput and legacy textInput
  cancellation boundaries. Ordinary event statuses remain unchanged. Explicit
  retry cannot fall back from an old snapshot to newer clipboard contents.
- `widget/nsIClipboard.idl`, `widget/nsClipboardProxy.cpp` and
  `widget/nsBaseClipboard.cpp`: appended C++-only snapshot currentness method.
  Use XPIDL `noscript, notxpcom, nostdcall`; raw C++ virtual additions are invalid.
  Preserve the four existing method slots and verify JS cannot access the helper.
- `widget/PClipboardReadRequest.ipdl`, `ClipboardReadRequestParent.h` and `.cpp`,
  plus `ipc/ipdl/sync-messages.ini`: private generation-only retry validation.
  Compare the stored native sequence directly, without cache cleanup or owner
  callbacks. It is used only during explicit retry, not normal event dispatch.
- `toolkit/actors/UmbrafoxClipboardChild.sys.mjs` and
  `UmbrafoxClipboardParent.sys.mjs`: private observer/actor bridge, authoritative
  frame principal and active-document checks. No clipboard payload crosses this
  bridge. Register through `toolkit/modules/ActorManagerParent.sys.mjs` and the
  actors' build manifest.
- `browser/modules/UmbrafoxClipboardProtection.sys.mjs`,
  `SitePermissions.sys.mjs`, `browser/modules/moz.build` and
  `browser/locales/en-US/browser/sitePermissions.ftl`: dismissed notice,
  one-shot/remembered consent and standard permission revocation. The existing
  ConfirmationHint uses `confirmationHints.ftl` for explicit failed retries only.

Permission keys are `umbrafox-clipboard-{copy|paste}^` plus the encoded complete
principal origin, including origin attributes. Defaults are UNKNOWN, exact-host
only; Always persists only after accepted native retry. Private grants are
session-scoped and removed when the last private context exits. Current-frame
grant enumeration is O(current frames); private cleanup is O(saved permissions).
Neither is represented as having a fixed traversal cap. A grant-gated private
window-global observer refreshes the standard permission icon for newly loaded
current frames. It is absent without explicit ALLOW grants. Registration scans
cost O(all saved permissions); bulk private removal may cause O(G * P) rescans.

Pending requests expire after 30 seconds and are consumed before execution.
Native validity, target, focus, range, value and mutation checks fail closed.
Content Analysis may retrieve actual data during snapshot acquisition, so the
copy-notice path skips it when Content Analysis might be active. Such notices
remain eligible, but unsafe retries are unavailable. Populated snapshots cannot
prove current native generation and fail closed. This does not disable DLP or
alter ordinary Firefox clipboard behavior.

Current prototype scope is `cmd_copy` and `cmd_paste`. Cut, primary-selection
middle-click, paste-as-quotation and other command variants are not covered.
Only safe single-range replay is supported; large or changed control values,
navigation and replacement targets can invalidate the pending action. This is
not a guarantee that hostile script cannot later erase an inserted value.
