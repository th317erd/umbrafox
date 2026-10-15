# Chrome-parity keyboard shortcuts: Downloads and New Private Window

Status: **historical patch superseded by the owner-approved opt-in preset.**
The original report below records the earlier two-file edit, not current source.
That unconditional edit was replaced to fix its Linux Ctrl+J search collision
and preserve default Firefox keyboard-event semantics. Current implementation and
verification: `../reports/2026-10-15-chrome-shortcut-preset.md`. Do not reapply the
old diff. No daily browser installation or activation has occurred.

Owner request, 2026-10-15: make Umbrafox's shortcuts match Google Chrome. Target
(Chrome on Linux): Downloads `Ctrl+J`, New Incognito Window `Ctrl+Shift+N`,
New Tab `Ctrl+T`, New Window `Ctrl+N`.

## Scope of this lane

**Modified:** two tracked files in this checkout, uncommitted
(`git diff --stat`: 2 files changed, 9 insertions, 7 deletions). The patch is already
applied — review it, do not re-apply it.

**Read only:** the running installation
`~/Programs/umbrafox-20261001-103920-158.0a1` (its `browser/omni.ja`), this checkout's
`browser/` sources, the owner's screenshot, and `~/Programs/umbrafox` (launcher).

**Not touched:** no browser was closed, restarted, driven or modified; nothing in
`~/.config/umbrafox`, the launcher, the desktop entry, any install directory, or any
system setting was changed; nothing was committed or pushed. The owner's running
browser is the October 1 dated installation and therefore does **not** carry this
change.

## What the owner sees today

Owner-supplied screenshot
`~/wyatt-desktop/Pictures/Screenshots/session-2026-10-15-17-42-47.007.png` (49,236 bytes)
renders the app menu as:

    New Tab               Ctrl+T
    New Window            Ctrl+N
    New Private Window    Ctrl+Shift+P
    Downloads             Ctrl+Shift+Y

New Tab and New Window already match Chrome. Only **Downloads** and **New Private
Window** differ — the owner was right that "some of them are the same".

## Root cause

The `<key>` elements in `browser/base/content/browser-sets.inc.xhtml` carry **no**
`key=` attribute; letters come from Fluent through `data-l10n-id`, defined in
`browser/locales/en-US/browser/browserSets.ftl`. Two independent deviations:

1. **Downloads.** `downloads-shortcut` sets `[linux] Y` (other platforms `J`), and the
   key element swaps its modifier under `#ifdef XP_GNOME` to `accel,shift`. Together
   that produced `Ctrl+Shift+Y` instead of Chrome's `Ctrl+J`.
2. **New Private Window.** `private-browsing-shortcut` is `.key = P`, because Mozilla
   binds `Ctrl+Shift+N` to **Undo Close Window** (`key_undoCloseWindow`,
   `data-l10n-id="window-new-shortcut"`, `modifiers="accel,shift"`). The same Fluent
   message supplies `Ctrl+N` for New Window, so the letter `N` is legitimately shared
   and must remain.

## The patch

`browser/locales/en-US/browser/browserSets.ftl`

```diff
 downloads-shortcut =
     .key = { PLATFORM() ->
-        [linux] Y
+        [linux] J
         *[other] J
     }
@@
 private-browsing-shortcut =
-    .key = P
+    .key = N
```

`browser/base/content/browser-sets.inc.xhtml`

```diff
+    <!-- Umbrafox: Chrome parity — Downloads is Ctrl+J on every platform. The
+         GNOME shift variant below previously produced Ctrl+Shift+Y. -->
     <key id="key_openDownloads"
          data-l10n-id="downloads-shortcut"
-#ifdef XP_GNOME
-         modifiers="accel,shift"
-#else
          modifiers="accel"
-#endif
          command="Tools:Downloads"/>
@@
-    <key id="key_undoCloseWindow" command="History:UndoCloseWindow" data-l10n-id="window-new-shortcut" modifiers="accel,shift"/>
+    <!-- Umbrafox: Chrome parity — Ctrl+Shift+N opens a New Private Window, so no
+         accelerator is bound here. The menu item and the History:UndoCloseWindow
+         command still work, and Ctrl+Shift+T still reopens the last closed
+         tab/window. -->
+    <key id="key_undoCloseWindow" command="History:UndoCloseWindow"/>
```

Resulting bindings:

| action | before | after |
| --- | --- | --- |
| Downloads | Ctrl+Shift+Y | **Ctrl+J** |
| New Private Window | Ctrl+Shift+P | **Ctrl+Shift+N** |
| New Tab | Ctrl+T | Ctrl+T (unchanged) |
| New Window | Ctrl+N | Ctrl+N (unchanged) |
| Undo Close Window | Ctrl+Shift+N | no accelerator; menu item and command intact |

## Static verification already performed

- Preprocessor balance in the edited `.inc.xhtml`: 27 `#if`, 14 `#else`, 27 `#endif`,
  nesting depth 0 — the removed `#ifdef XP_GNOME / #else / #endif` was a complete block.
- Fluent braces balanced in the edited message (`{`/`}` = 1/1).
- Collision check: `window-new-shortcut` (letter `N`) now reaches only
  `key_newNavigator` (`accel` + N = Ctrl+N), so `accel,shift+N` is uniquely New Private
  Window.
- `bash`-level and build-level syntax checks were **not** run; there is no lint or
  build in this lane.

**Not proven:** any built artefact. Nothing has been compiled, packaged or run.

## Remaining work (work order)

1. **Build and package** in the usual lane flow, then install and mark the install
   directory with `.purgecaches` (the established convention; both current installs
   carry it).
2. **Install placement matters.** `~/Programs/umbrafox` ranks `umbrafox-[0-9]*` (priority
   3) above `umbrafox-nightly.next-*` (2) above `umbrafox-nightly` (1), then selects the
   largest entry. A dated install directory is therefore what makes the launcher pick
   the new build up.
3. **Verify structurally** against the installed artefact: the new install's
   `browser/omni.ja` must contain `localization/en-US/browser/browserSets.ftl` with
   `[linux] J` and `.key = N`, and `chrome/browser/content/browser/browser.xhtml` with
   the two edited key elements.
4. **Verify behaviourally:** the app menu must read `Downloads Ctrl+J` and
   `New Private Window Ctrl+Shift+N`, and Ctrl+J, Ctrl+Shift+N, Ctrl+T and Ctrl+N must
   perform the Chrome actions. The menu label derives from the same key elements, so it
   is a fair proxy but not a substitute for pressing the keys.
5. **Commit/push** only if the owner asks: two files,
   `browser/base/content/browser-sets.inc.xhtml` and
   `browser/locales/en-US/browser/browserSets.ftl`. This report is also uncommitted.

## Caveats and follow-ups

- **Deliberate divergence from upstream.** Both edits are fork-local. A future upstream
  merge or revert touching these keys will restore the old bindings. The XHTML carries
  explanatory comments; the Fluent message cannot (comments are not valid inside a
  message body), so the FTL edit is bare — watch it during conflict resolution.
- **en-US only.** `browser/locales/` contains only `en-US` in-tree; other locales live
  elsewhere and will keep `P`/`Y` unless changed there. The owner's UI is en-US.
- **All Linux builds are affected** by removing the `#ifdef XP_GNOME` branch. Non-GNOME
  Linux already used `accel`, so this aligns GTK/GNOME builds with them. If a future lane
  needs the old Linux behaviour, restore the ifdef rather than editing the FTL.
- **Losing Ctrl+Shift+N as Undo Close Window is intentional**: Chrome has no equivalent
  shortcut, the menu item and command still work, and Ctrl+Shift+T
  (`key_restoreLastClosedTabOrWindowOrSession`) is untouched. If the owner wants the
  accelerator retained, reassign it rather than reverting New Private Window.
- **Not checked:** whether any add-on, policy (`enterprisepolicies`) or GTK binding in the
  owner's environment also claims Ctrl+J or Ctrl+Shift+N. No such conflict was found in
  the browser source, but the live check in step 4 is where that would surface.

## Build state observed in this checkout

`mozconfig` is present, but `obj-x86_64-pc-linux-gnu/` is a stub — 12 MB containing only
`.mozbuild/` and `docs/`, with no `dist/` and no built binary. So no tree built from this
checkout is present right now. Most recent recorded packaging run:
`bot-docs/reports/performance/2026-10-14-arm-build.md` (`mach package` exited 0).
