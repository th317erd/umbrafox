# Recipe 13: Browser panel key handling

## Goal

Keep browser chrome panels open while focused panel content receives ordinary
keyboard input. Panels should close from keyboard input only when Escape is
released.

This applies to browser UI popups such as extension panels, security or
permission panels, and other non-menu chrome panels. It is not a web-facing
surface and must not change page-observable keyboard events.

## Files changed

- `layout/xul/nsXULPopupManager.cpp`
- `layout/xul/nsXULPopupManager.h`
- `widget/gtk/nsWindow.cpp`
- `browser/components/customizableui/test/browser_PanelMultiView_keyboard.js`
- `toolkit/content/tests/chrome/test_panel_keyup_escape.xhtml`
- `toolkit/content/tests/chrome/chrome.toml`
- `toolkit/content/tests/chrome/mochitest.toml`

## Popup manager behavior

Firefox's popup manager handles menu keyboard navigation and popup rollup in
`nsXULPopupManager::HandleKeyboardEventWithKeyCode`.

Umbrafox keeps menu keyboard behavior intact, but makes non-menu panel keydown
events a popup-manager no-op:

```cpp
if (aTopVisibleMenuItem &&
    aTopVisibleMenuItem->GetPopupType() != PopupType::Menu) {
  return false;
}
```

Returning `false` matters. Returning `true` means the popup manager still
reports the keydown as handled, which can keep focused panel content from
receiving the event correctly. Non-menu panels close through the separate
Escape-keyup path instead.

## Native GTK focus-out behavior

Real hardware shortcuts can take native paths that synthetic DOM key events do
not reproduce. In particular, Linux window managers may process Alt+F4 variants
and briefly trigger GTK focus-out handling. Firefox's GTK focus-out path called
`RollupAllMenus()`, which rolls up any autohide popup, including browser panels.

Umbrafox adds `nsXULPopupManager::RollupMenusOnly()` and uses it from
`nsWindow::OnContainerFocusOutEvent`. This keeps native focus-out behavior for
real menu popups while preserving browser panels such as extension,
permissions, and security panels.

## Tests

`browser_PanelMultiView_keyboard.js` has browser-level coverage using a real
`PanelMultiView` panel:

- A focused textbox stays focused after ordinary keydown.
- A non-Escape keydown does not close the panel.
- Escape keydown does not close the panel.
- Escape keyup closes the panel exactly once.

`test_panel_keyup_escape.xhtml` provides lower-level chrome coverage for the
same Escape-keyup behavior.

## Rebase notes

During upstream syncs, inspect any conflict or nearby churn around:

- `nsXULPopupManager::HandleKeyboardEventWithKeyCode`
- `nsXULPopupManager::GetRollupItem`
- `nsWindow::OnContainerFocusOutEvent` on GTK
- panel rollup handling
- `PanelMultiView` keyboard tests

Do not move this behavior into web event code. It is a browser chrome popup
policy change only.

## Verification commands

```bash
./mach lint layout/xul/nsXULPopupManager.cpp layout/xul/nsXULPopupManager.h widget/gtk/nsWindow.cpp browser/components/customizableui/test/browser_PanelMultiView_keyboard.js
./mach build binaries
./mach test --headless browser/components/customizableui/test/browser_PanelMultiView_keyboard.js
./mach test --headless toolkit/content/tests/chrome/test_panel_keyup_escape.xhtml
```
