# Recipe 14: Browser chrome control UI

## Goal

Keep Umbrafox-specific power-user controls in browser chrome, not in web-visible
surfaces.

This slice adds an app-menu toggle for UmbraLink, the local `umbrafox-control`
service, and removes the inline tab mute button/click target from the tab
strip. Tab muting must remain available from the tab context menu and keyboard
shortcut.

## Files

- `browser/base/content/appmenu-viewcache.inc.xhtml`
- `browser/components/customizableui/content/panelUI.js`
- `browser/locales/en-US/browser/appmenu.ftl`
- `browser/components/customizableui/test/browser_umbrafox_control_toggle.js`
- `browser/components/customizableui/test/browser.toml`
- `browser/components/tabbrowser/content/tab.js`
- `browser/components/tabbrowser/content/tabs.mjs`
- `browser/components/tabbrowser/Tabbrowser.sys.mjs`
- `browser/themes/shared/tabbrowser/tabs.css`
- `browser/components/tabbrowser/test/browser/tabs/head.js`
- `browser/components/tabbrowser/test/browser/tabs/browser_audioTabIcon.js`
- `browser/components/tabbrowser/test/browser/tabs/browser_multiselect_tabs_mute_unmute.js`
- `browser/components/tabbrowser/test/browser/tabs/browser_tab_play.js`
- `browser/components/tabbrowser/test/browser/tabs/browser_multiselect_tabs_play.js`
- `browser/components/tabbrowser/test/browser/tabMediaIndicator/head.js`
- `browser/components/tabbrowser/test/browser/tabMediaIndicator/browser_mute_webAudio.js`
- `browser/components/sidebar/tests/browser/browser_sidebar_expand_on_hover.js`
- `browser/tools/mozscreenshots/mozscreenshots/extension/configurations/Nova.sys.mjs`
- `toolkit/content/tests/browser/browser_delay_autoplay_silentAudioTrack_media.js`
- `toolkit/components/pictureinpicture/tests/browser_tabIconOverlayPiP.js`

## App-menu control toggle

Add `appMenu-umbrafox-control-button` to the main application menu near
Settings. It is a checkbox-style `toolbarbutton` with `closemenu="none"` and
uses the Fluent id `appmenuitem-umbrafox-control`.

`panelUI.js` imports `UmbrafoxControlService`, mirrors the checked state from
`umbrafox.control.enabled` when the main view is shown, and handles command
events by:

1. setting `umbrafox.control.enabled`;
2. starting or stopping `UmbrafoxControlService` immediately;
3. restoring the previous pref state if service start/stop fails.

The service itself remains disabled by default in `browser/app/profile/firefox.js`.
This menu item is labeled "UmbraLink" and is the user-facing control for
enabling it in a profile without starting Firefox's stock Marionette, WebDriver
BiDi, or Remote Agent paths.

## Tab mute affordance removal

Keep tab audio state and context-menu commands intact, but remove the inline
mute button from the tab strip:

- `tab.js` no longer creates `.tab-audio-button` in the tab template.
- `tabs.mjs` no longer maintains aria labels for the removed inline button.
- `.tab-icon-overlay` remains available as a state indicator for pinned or
  collapsed vertical tabs, but audio-state overlays do not receive pointer
  events.
- `tab.js` no longer treats `.tab-icon-overlay` or `.tab-audio-button` clicks
  as mute/play commands. Clicking the tab surface selects/activates the tab as
  expected.

Do not remove `context_toggleMuteTab`, `context_toggleMuteSelectedTabs`, the
tab `toggleMuteAudio(...)` method, or the keyboard mute shortcut.

## Detectability review

This is browser chrome only. It does not change page DOM, JavaScript, CSS,
WebIDL, network, storage, media, timing, or user-agent behavior.

## Verification

Run focused checks:

```bash
./mach lint browser/base/content/appmenu-viewcache.inc.xhtml browser/components/customizableui/content/panelUI.js browser/locales/en-US/browser/appmenu.ftl browser/components/customizableui/test/browser_umbrafox_control_toggle.js browser/components/customizableui/test/browser.toml browser/components/tabbrowser/content/tab.js browser/components/tabbrowser/content/tabs.mjs browser/components/tabbrowser/Tabbrowser.sys.mjs browser/themes/shared/tabbrowser/tabs.css browser/components/tabbrowser/test/browser/tabs/head.js browser/components/tabbrowser/test/browser/tabs/browser_audioTabIcon.js browser/components/tabbrowser/test/browser/tabs/browser_multiselect_tabs_mute_unmute.js browser/components/tabbrowser/test/browser/tabs/browser_tab_play.js browser/components/tabbrowser/test/browser/tabs/browser_multiselect_tabs_play.js browser/components/tabbrowser/test/browser/tabMediaIndicator/head.js browser/components/tabbrowser/test/browser/tabMediaIndicator/browser_mute_webAudio.js browser/components/sidebar/tests/browser/browser_sidebar_expand_on_hover.js browser/tools/mozscreenshots/mozscreenshots/extension/configurations/Nova.sys.mjs toolkit/content/tests/browser/browser_delay_autoplay_silentAudioTrack_media.js toolkit/components/pictureinpicture/tests/browser_tabIconOverlayPiP.js
./mach test --headless browser/components/customizableui/test/browser_umbrafox_control_toggle.js
./mach test --headless browser/components/tabbrowser/test/browser/tabs/browser_audioTabIcon.js browser/components/tabbrowser/test/browser/tabs/browser_multiselect_tabs_mute_unmute.js browser/components/tabbrowser/test/browser/tabs/browser_tab_play.js browser/components/tabbrowser/test/browser/tabs/browser_multiselect_tabs_play.js browser/components/tabbrowser/test/browser/tabMediaIndicator/browser_mute_webAudio.js
./mach test --headless browser/components/sidebar/tests/browser/browser_sidebar_expand_on_hover.js toolkit/content/tests/browser/browser_delay_autoplay_silentAudioTrack_media.js toolkit/components/pictureinpicture/tests/browser_tabIconOverlayPiP.js
```

Manual checks:

1. Open the app menu and toggle "UmbraLink" on/off. Confirm
   `<profile>/umbrafox/control.json` appears and disappears.
2. Load an audible tab. Confirm no inline mute button appears on the tab.
3. Right-click the tab and confirm Mute Tab/Unmute Tab still works.
