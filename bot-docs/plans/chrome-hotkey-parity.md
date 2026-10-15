# Chrome Hotkey Parity

Status: First-pass implementation authorized October 15. Full parity is an
aspiration, not a first-release requirement. Browser/profile/launcher state stays
untouched; installation and activating the preset in the daily profile are separate.

## Authorized First Pass

The owner approved proceeding with the proposed explicit, reversible preset and
clarified that difficult bindings and features without one-to-one equivalents may
be deferred. The broader inventory below is a roadmap, not a gate on this slice.

- Linux-only, opt-in through about:keyboard using the existing CustomKeys store.
- Ctrl+J Downloads, Ctrl+E alternate search, Ctrl+Shift+N private window, Ctrl+1
  through Ctrl+8 numbered tabs, Ctrl+9 last tab.
- Clear the conflicting reopen-window accelerator; keep its command/menu and
  the existing Ctrl+Shift+T restore command. Existing Alt+number aliases are not
  retained in this first pass.
- Replace the earlier unconditional two-file edit with this opt-in implementation;
  untouched profiles keep Firefox's original localized defaults on every platform.
- Confirm replacement of these specific assignments. Preserve unrelated custom
  bindings and reject conflicting unrelated assignments before any change.
- Use existing per-key/default reset and JSONFile persistence; no new event hook,
  new preference, or separate shortcut store. Reset restores Firefox defaults,
  not a history of earlier user overrides; make replacement explicit.
- Defer page-console/DevTools conflicts, Shift+F5, menu/focus changes, history and
  downloads destinations, other platforms/layouts, and Chrome-only features.

Territory: browser key/FTL defaults -> CustomKeys init/config/mutation observer ->
native key dispatch and menu labels; about:keyboard -> allowlisted RPM query ->
parent actor -> preset application -> existing store/reset/new-window behavior.
No source-default reservation change is allowed. Enabled reservation differences
are deliberate user configuration, not an undetectability claim.

Test gate: failing-first pure module checks; browser-chrome tests of actual key
dispatch, reset, new/private windows, UI confirmation/cancel and conflict rejection;
scoped lint. Runtime tests use only disposable owned profiles and app-data roots.
An unavailable native harness must be recorded, never replaced by a mock-only
runtime claim. Owner authorized commit/push after verification; an owner browser
restart remains outside this slice.

Progress: first-pass source implementation and isolated Linux verification pass.
See `bot-docs/reports/2026-10-15-chrome-shortcut-preset.md` for commands, results,
limits and activation instructions. Not packaged or installed; publication is
authorized by the owner's follow-up request.

The remaining sections retain the original audit and longer-term roadmap. The
authorized first-pass scope above supersedes their all-or-nothing inventory gates.

## Owner Intent And Decisions

Wyatt, October 15, 2026: "I want FULL hotkey parity with Chrome."

The earlier handoff is
`bot-docs/bug-reports/2026-10-15-chrome-parity-hotkeys.md`. Preserve its two applied
edits until an approved replacement is ready; do not apply that diff again.

Proposed starting target: desktop Linux, en-US, standard US keyboard, matching a
pinned Chrome release. Windows and macOS require separate mappings and acceptance;
Linux acceptance must not be advertised as all-platform parity. ARM Linux shares
the proposed mapping, but packaging/runtime acceptance remains platform-specific.

The original audit proposed these boundaries, now accepted for the first pass:

1. Recommend an explicit, reversible Chrome-keyboard preset, enabled only by user
   choice. Default Firefox page-event semantics remain unchanged. A global default
   change that affects events visible to websites requires a separately discussed
   rulebook exception. No exception is assumed here.
2. Shared browser actions should have Chrome's chords and interaction semantics.
   Chrome-only services and non-equivalent DevTools features must be named gaps,
   not silently replaced by unrelated commands. Decide those gaps individually
   after the inventory. The owner subsequently authorized a partial first pass
   and explicitly accepted non-equivalent features and deferred bindings.

## Evidence And Baselines

Checkout HEAD: `ed5c2e1dea6e`. Existing uncommitted patch:

- `browser/base/content/browser-sets.inc.xhtml` SHA256
  `f771addf6b6f38f8aed00856e094e5e32c6211a03fb55ee8f3dfdc633eea76b0`.
- `browser/locales/en-US/browser/browserSets.ftl` SHA256
  `4d0823bcc9a74a6fce2350739bb3ffe7313aa721b7a64406b8d8ea58c2b4af9c`.

Research consulted October 15:

- [Google's browser shortcut reference](https://support.google.com/chrome/answer/157179?hl=en).
- [Chrome DevTools shortcut reference](https://developer.chrome.com/docs/devtools/shortcuts).
- [Chromium accelerator table](https://chromium.googlesource.com/chromium/src.git/+/refs/heads/main/chrome/browser/ui/accelerator_table.cc),
  observed blob `f074c958b05748030fc9e16436e53ffa8f622cc6`.
- [Mozilla's browser shortcut reference](https://support.mozilla.org/en-US/kb/keyboard-shortcuts-perform-firefox-tasks-quickly).
- [Mozilla's shortcut customization documentation](https://support.mozilla.org/en-US/kb/customize-keyboard-shortcuts-firefox).
- [Firefox DevTools shortcuts](https://firefox-source-docs.mozilla.org/devtools-user/keyboard_shortcuts/index.html).

Searchfox source inspection used indexed revision
`976279105b2e78b8666a959eb3f25c9176cefaf8`. Upstream observations below are not
claims about the owner's loaded October 1 binary. Reconcile them with the pinned
implementation checkout before editing. Chromium main is likewise not proof of
the exact installed Chrome release's behavior.

Google's help page and Chromium source disagree on at least one binding:
the help page calls Ctrl+F5 address-bar focus, while the inspected accelerator
table maps it to cache-bypassing reload. Source and actual pinned-browser results
must resolve such discrepancies, not a copied cheat sheet. Chrome's macOS
Downloads chord also differs from its Linux chord; the existing patch's
"every platform" comment overstates its scope.

## Confirmed Patch Defect

The pending Linux patch assigns Ctrl+J to both `key_search2` (`Tools:Search`) and
`key_openDownloads` (`Tools:Downloads`). The existing search alias was not moved
or removed. A shortcut label changing does not prove the intended command wins.

Verification executed with a 10-second timeout, bytecode writes disabled:
the repository's `mozbuild.preprocessor.Preprocessor` expanded the actual XHTML
with XP_UNIX, XP_GNOME and NIGHTLY_BUILD; `fluent.syntax.FluentParser` parsed the
actual FTL, and ElementTree read the expanded XML. Assertions confirmed distinct
commands sharing J + accel. The same check confirmed numbered tabs still use alt,
private-window N + accel,shift remains reserved, and undo-window is unassigned.
This is static reproduction, not browser runtime acceptance.

## Known Gaps Beyond The Two Edits

| Area | Current evidence | Required treatment |
| --- | --- | --- |
| Downloads/search | Duplicate Linux Ctrl+J in actual patch; search alias still J | Resolve the alias as part of one change; verify exactly one action per chord |
| Numbered tabs | Actual XP_GNOME branch uses Alt for 1 through 9 | Provide Chrome's Control chords; decide aliases from the pinned target, not memory |
| Private window | Patch removes undo-window chord and remaps private-window | Preserve undo via menus; test private isolation and page-event reservation |
| Downloads destination | Upstream `downloadsUI` opens Library in normal windows, about:downloads in private windows | A remap alone does not deliver Chrome's tab-based workflow |
| History | Upstream `key_gotoHistory` toggles History sidebar | Treat tab-based history as a command/destination issue |
| Page console | Upstream Ctrl+Shift+J targets Browser Console; Web Console uses another key | Select the page console without accidentally exposing browser-wide tooling |
| Profile/device mode | Upstream responsive-design shortcut occupies Chrome's profile chord outside DevTools | Context-specific dispatch; preserve device mode inside the toolbox |
| Reload/performance | Shift+F5 is an upstream DevTools performance-panel shortcut | Resolve hard-reload conflict; preserve access to the displaced tool |
| Menu and focus | App menu, menu bar, toolbar and inactive dialog are distinct focus targets | Audit destinations and focus order, not merely key labels |
| Tab cycling | Upstream recently-used ordering is configurable; inspected default is false | Test actual selected-tab order; do not claim all Firefox defaults differ |
| Bookmarks/task manager | Several chords already correspond to related Firefox actions | Characterize before changing; equivalent command does not imply identical UI |
| Printing and DevTools | Chrome uses context-dependent chords for system print and tool command UI | Inventory normal page versus toolbox scope separately |
| Platform and locale | FTL letters and preprocessor modifiers vary independently | Test compiled/localized combinations; do not flatten macOS into Linux |

These are demonstrated source-level gaps and candidate work, not an exhaustive
runtime discrepancy count. Full inventory completion is Phase 0's acceptance gate.

## Firefox-Parity Constraint

The rulebook covers keyboard events, not just `navigator` or DOM properties.
The private-window binding retains `reserved="true"`. Moving its chord changes
the candidate keys reserved by browser chrome. Upstream
[`GlobalKeyListener::HandleEventOnCaptureInDefaultEventGroup`](https://searchfox.org/firefox-main/rev/976279105b2e78b8666a959eb3f25c9176cefaf8/dom/events/GlobalKeyListener.cpp#207)
marks matching keys reserved; its handler traversal describes suppressing delivery
to web content. Therefore "only browser UI files changed" is not an undetectability
proof. Focus/blur and navigation effects require consideration too.

An explicitly enabled user customization is the recommended rulebook-compatible
route. It is not a claim that the enabled configuration is undetectable. No new
web API, spoofed KeyboardEvent, document-level remapping script, or global OS
keyboard hook is proposed. Do not change event reservations merely to silence a
test without checking cancellation, accessibility and security consequences.

## Territory And Proposed Design

Prefer existing `browser/components/customkeys/` machinery for assignments and
reset behavior. Mozilla documents about:keyboard customization from Firefox 147;
this component exists in our checkout. Upstream source shows:

1. `BrowserComponents.manifest` registers `CustomKeys.initWindow`.
2. `CustomKeys.sys.mjs` reads profile-local `customKeys.json`, changes key/modifier
   attributes, and preserves originals. It removes Fluent IDs from customized
   bindings so localization cannot overwrite the assignment.
3. It refreshes keysets and observes late keysets, including DevTools startup.
4. `CustomKeysParent.sys.mjs` exposes menu-derived and supplementary bindings to
   the UI; it explicitly includes the alternate search binding.
5. Menu labels, shortcuts, command dispatch and native event handling are separate
   consumers. Remapping a key does not change its command or reservation policy.

Extend this system only where proven necessary. Do not introduce a second global
key listener or duplicate persistent shortcut registry. Existing user shortcuts
must be previewed and preserved or explicitly replaced, never silently wiped.
Built-in editor keys marked internal must not be cleared wholesale.

Additional territory requiring full Phase 0 tracing:

- `browser-sets.inc.xhtml`, `browserSets.ftl`, `browser-sets.js`,
  `browser-commands.js`, menu/access-key definitions and app-menu controllers.
- Tab navigation/cycling/group/split-view handlers and session-restore commands.
- URL-bar/search controllers, find bar, editable controls and focus navigation.
- DevTools startup, definitions, menus, toolbox and individual panel keymaps.
- Profile selection/guest equivalents, bookmarks/history/downloads destinations.
- Native/global key listeners, fullscreen/keyboard-lock handling, platform keymaps.
- Persisted customizations, backup/restore, locale changes and late-created windows.

No completed inventory of these consumers is claimed by this initial audit.

## Complete Coverage Ledger

Create a machine-readable ledger before implementation. Each row must contain:
stable action ID, platform/locale/layout, Chrome version/source, chord or sequence,
focus/context, target behavior, existing binding/handler, conflicting commands,
proposed disposition, reservation/page-event policy, test ID and evidence status.
Use explicit states: matches, remap, behavior-adapter, missing-feature,
OS-controlled, unresolved, or owner-approved exclusion. An unknown is not a match.

Required families, including negative/context cases:

1. New/close/reopen windows and tabs; private windows; pinned tabs; last-window quit.
2. Tab positions, cycle order, moving tabs, multi-selection, groups and split view.
3. Back/forward/home, normal and hard reload, stop, fullscreen and keyboard lock.
4. URL-bar focus, search, completion, suggestion deletion and navigation destination.
5. Find, repeat-find, selected text, scrolling and caret navigation.
6. Bookmarks, history, downloads and browser process management.
7. App menus, menu sequences, toolbar focus, dialogs and accessibility navigation.
8. Save/open/print, system print, zoom and help.
9. Profiles/guest, privacy controls and branded service commands.
10. DevTools opening and each panel's context-dependent editing/debugging shortcuts.
11. Native editing, modifier-plus-mouse, numpad and dedicated browser/media keys.
12. PDF/media viewers, extension shortcuts, webpage shortcuts, IME and alternate layouts.

Review every row from the browser and DevTools references, plus relevant active
accelerators in the pinned source. Named feature gaps stay on the roadmap until
implemented or explicitly excluded by the owner. No Chrome services should be
silently added or contacted merely to satisfy a shortcut.

## Phases And Acceptance

### 0. Ratify Contract And Freeze Baselines

Start after the owner settles the default/opt-in boundary. Pin Chrome and Firefox
versions, Umbrafox commit plus dirty patch, OS/layout/locale, build flags and
shortcut prefs. Compare source on the actual branch; complete the ledger above.
Existing destructive quit keys deserve explicit tests, but their presence is not
evidence that accidental key presses caused October 14's unexplained exits.

Use isolated profiles and owned browser processes only. Runtime permission and
resource bounds must be agreed before launches; never test quit/close/private
actions in the owner's active session. Keep no profile URLs or secrets in fixtures.

### 1. Collision-Free Assignment And Persistence

First write failing tests for duplicate Ctrl+J, numeric-tab modifiers, private
window/undo collision, absent/disabled commands and platform-specific assignments.
Implement the approved preset using existing customization machinery. If replacing
the two pending source-default edits, obtain authorization and retain their intent
and provenance. Preview conflicting existing user settings, apply coherently,
support reset, and preserve unrelated bindings. Test partial-write/reload failures,
unknown IDs, malformed configuration, repeated application and existing/new windows.

### 2. Command And Focus Semantics

Implement only the approved behavior adapters from the ledger: UI destination,
console scope, profile versus device mode, menu/focus semantics and tab ordering.
Commands requiring missing feature work receive dependency-ordered tasks, not dummy
bindings. Keep each command family independently testable and revertible.

### 3. Integration And Detectability

For every target row, send real trusted input in an isolated browser and assert
the selected command, exactly-once execution, resulting focus/tab/window state,
and menu/tooltip label. Cover content focus, URL bar, editable fields, DevTools,
popups, private windows, disabled controls, loading/startup and fullscreen.

Compare Firefox and preset-OFF Umbrafox page observations: keydown/keypress/keyup,
key/code/modifiers/repeat/isTrusted, cancellation, focus, access keys and nested
cross-origin frames. Then characterize preset-ON differences against the explicit
user-customization contract. Synthetic untrusted DOM events alone cannot prove
native accelerator behavior. Default parity failure blocks release.

### 4. Package, Install And Owner Acceptance

Build/package the integrated revision; inspect emitted browser/omni.ja and locale
resources, not only source. Repeat the behavior suite against that actual package.
Verify launcher selection and the existing profile mapping before installation.
Do not adopt the earlier report's dated-directory workaround as a substitute for
the separately prepared launcher correction. Preserve rollback and profile data.
Commit/push is now owner-authorized. Owner browser restart remains a separate gate.

## Verification Entry Points

Current existing upstream suites to reuse and extend:

- `browser/components/customkeys/tests/browser/browser_CustomKeys.js`
- `browser/components/customkeys/tests/browser/browser_aboutKeyboard.js`
- `browser/components/tabbrowser/test/browser/tabs/browser_ctrlTab.js`
- `browser/components/tabbrowser/test/browser/tabs/browser_tabkeynavigation.js`
- `browser/base/content/test/browser-fullscreen/browser_fullscreen_keyboard_lock_ctrltab.js`
- `browser/components/tests/browser/browser_quit_shortcut_warning.js`

After a test-capable isolated object directory exists, an initial focused command
is `timeout 180s ./mach test --headless browser/components/customkeys/tests/browser/`.
Redirect output to a task-specific log and inspect it after completion. This command
was not run during planning; it does not cover all families or native OS routing.
Pure parser/ledger checks should finish within 10 seconds. Each runtime chunk needs
a per-test timeout, outer watchdog and owned-process cleanup; adjust chunk size
before launch, not by repeatedly extending a hung run. No large rebuild is implied
by this planning task.

Three mandatory behavioral falsifiers:

- With page focus, Downloads runs once and search does not run; after restart the
  assignment and its menu label still agree.
- With DevTools focus, the device-mode chord operates on the toolbox; outside that
  context it performs the approved profile action, never both.
- With preset disabled, a page observing/canceling relevant keys sees the matching
  Firefox behavior, including the old/new private-window chords.

Adversarial gates: key repeat, startup races, lazy DevTools registration, two
windows applying/resetting concurrently, IME/AltGr/numpad, customization conflicts,
private-mode policies, corrupt/failed persistence, and quit confirmation/cancellation.
Test irreversible commands only with disposable data. A shortcut label, parsed
source or single successful key press is insufficient acceptance.

## Definition Of Done

- The approved platform/context ledger has no unresolved rows or silent exclusions.
- Every changed chord has one intended action per context and preserved access to
  displaced functionality, unless removal was explicitly approved.
- Default Firefox page-event parity passes; enabled differences match the approved
  customization contract. No blanket undetectability claim is inferred.
- Reset, persistence, user overrides, locale/platform behavior and failure paths pass.
- Packaged resources and real input behavior match the frozen source and ledger.
- Owner runtime remains untouched until the separately approved installation step.

Original audit conclusion: the unconditional two-file patch was not complete,
even for Linux. It has now been replaced by the opt-in preset described above.
The roadmap is not a claim that every shortcut has been enumerated or implemented.
