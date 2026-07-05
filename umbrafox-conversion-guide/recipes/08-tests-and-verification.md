# Recipe 08: Tests and verification

## Goal

Keep Umbrafox-specific defaults and blocked search engine behavior protected by tests, and define the minimum verification suite for future upstream updates.

## Files changed

- `browser/components/newtab/test/xpcshell/test_UmbrafoxHomeDefaults.js`
- `browser/components/newtab/test/xpcshell/xpcshell.toml`
- `toolkit/components/search/tests/xpcshell/test_engine_selector_remote_settings.js`
- `browser/extensions/newtab/test/browser/browser_activation_window.js`
- `browser/extensions/newtab/test/browser/browser_customize_menu_content.js`
- `browser/extensions/newtab/test/browser/browser_customize_menu_key_open.js`
- `browser/extensions/newtab/test/browser/browser_customize_menu_render.js`

## Umbrafox defaults xpcshell test

`test_UmbrafoxHomeDefaults.js` is a source-file test. It reads:

- `browser/app/profile/firefox.js`
- `modules/libpref/init/all.js`
- `browser/extensions/newtab/lib/ActivityStream.sys.mjs`

It asserts:

- Default-browser check is false.
- Startup page is session restore.
- Search/newtab/sponsor/weather/story/widget prefs are disabled as expected.
- Urlbar search/suggest/trending/recent/engine suggestions are disabled.
- Normandy/Nimbus/discovery/studies/crash prompt/usage ping defaults are disabled.
- Activity Stream seed defaults match Umbrafox behavior.

Register it in `browser/components/newtab/test/xpcshell/xpcshell.toml`:

```toml
["test_UmbrafoxHomeDefaults.js"]
head = ""
```

## Search selector xpcshell test

`toolkit/components/search/tests/xpcshell/test_engine_selector_remote_settings.js` includes `test_selector_filters_umbrafox_blocked_engines`.

It verifies:

- Blocked engine IDs/prefixes are filtered from Remote Settings data.
- Default engine falls back to an allowed engine.
- Contextual lookup cannot retrieve blocked engines.

## Browser test adjustments

New tab customize menu tests must opt into the customize menu because Umbrafox defaults it off:

```js
["browser.newtabpage.activity-stream.customizeMenu.enabled", true]
```

Affected files:

- `browser_activation_window.js`
- `browser_customize_menu_content.js`
- `browser_customize_menu_key_open.js`
- `browser_customize_menu_render.js`

## Minimum verification commands

After recipe changes:

```bash
./mach lint browser/app/profile/firefox.js browser/extensions/newtab/lib/ActivityStream.sys.mjs browser/extensions/newtab/lib/AboutPreferences.sys.mjs browser/extensions/newtab/content-src/components/Base/Base.jsx browser/components/preferences/config/search.mjs browser/components/preferences/config/permissions-data.mjs browser/components/preferences/home.inc.xhtml modules/libpref/init/all.js browser/components/newtab/test/xpcshell/test_UmbrafoxHomeDefaults.js toolkit/components/search/SearchEngineSelector.sys.mjs toolkit/components/search/tests/xpcshell/test_engine_selector_remote_settings.js
./mach xpcshell-test browser/components/newtab/test/xpcshell/test_UmbrafoxHomeDefaults.js
./mach xpcshell-test toolkit/components/search/tests/xpcshell/test_engine_selector_remote_settings.js
./mach build faster
git diff --check
```

For a full release candidate:

```bash
./mach build
./mach test --auto
```

## Manual verification checklist

Use a fresh profile:

```bash
./mach run --temp-profile
```

Check:

- New tab is reduced to search.
- No customize pencil/menu is present.
- about:preferences Search default is DuckDuckGo.
- Google, Bing, Amazon, and eBay are absent from search engines.
- about:preferences Search lacks stripped suggestion controls.
- about:preferences Privacy lacks the data collection card.
- about:preferences Home lacks Support Umbrafox, Recent activity, wallpaper, and logo controls.
- Default-browser check is unchecked.
- Open previous windows and tabs is checked.
