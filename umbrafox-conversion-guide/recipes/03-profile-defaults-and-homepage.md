# Recipe 03: Profile defaults and homepage/newtab simplification

## Goal

Make a new Umbrafox profile open into a minimal homepage/newtab experience, keep only search visible, and set startup/default-browser behavior to Umbrafox preferences.

## Files changed

- `browser/app/profile/firefox.js`
- `browser/extensions/newtab/lib/ActivityStream.sys.mjs`
- `browser/extensions/newtab/content-src/components/Base/Base.jsx`
- `browser/extensions/newtab/lib/AboutPreferences.sys.mjs`
- `browser/components/preferences/home.inc.xhtml`
- `browser/extensions/newtab/test/browser/browser_activation_window.js`
- `browser/extensions/newtab/test/browser/browser_customize_menu_content.js`
- `browser/extensions/newtab/test/browser/browser_customize_menu_key_open.js`
- `browser/extensions/newtab/test/browser/browser_customize_menu_render.js`
- `browser/components/newtab/test/xpcshell/test_UmbrafoxHomeDefaults.js`
- `browser/components/newtab/test/xpcshell/xpcshell.toml`

## Default browser and startup prefs

In `browser/app/profile/firefox.js`:

```js
pref("browser.shell.checkDefaultBrowser", false);
pref("browser.startup.page", 3);
```

`browser.startup.page = 3` means resume previous browser session. This corresponds to checking "Open previous windows and tabs" by default.

## Activity Stream/newtab defaults

Add or change defaults so new profiles start with only search:

```js
pref("browser.newtabpage.activity-stream.showSearch", true);
pref("browser.newtabpage.activity-stream.customizeMenu.enabled", false);
pref("browser.newtabpage.activity-stream.hideLogo", true);
pref("browser.newtabpage.activity-stream.feeds.topsites", false);
pref("browser.newtabpage.activity-stream.topSitesRows", 1);
pref("browser.newtabpage.activity-stream.showSponsored", false);
pref("browser.newtabpage.activity-stream.showSponsoredTopSites", false);
pref("browser.newtabpage.activity-stream.feeds.section.topstories", false);
pref("browser.newtabpage.activity-stream.section.topstories.rows", 0);
pref("browser.newtabpage.activity-stream.feeds.section.highlights", false);
pref("browser.newtabpage.activity-stream.section.highlights.rows", 0);
pref("browser.newtabpage.activity-stream.widgets.enabled", false);
pref("browser.newtabpage.activity-stream.widgets.system.enabled", false);
pref("browser.newtabpage.activity-stream.widgets.weather.enabled", false);
pref("browser.newtabpage.activity-stream.widgets.system.weather.enabled", false);
pref("browser.newtabpage.activity-stream.widgets.weatherForecast.enabled", false);
```

Also default off weather/discovery/wallpaper/sponsor regions and feature gates:

- `browser.topsites.contile.enabled = false`
- `browser.newtabpage.activity-stream.unifiedAds.tiles.enabled = false`
- `browser.newtabpage.activity-stream.unifiedAds.spocs.enabled = false`
- `browser.newtabpage.activity-stream.showWeather = false`
- Weather locale/region config strings become empty.
- `browser.newtabpage.activity-stream.discoverystream.enabled = false`
- Discovery Stream story, spoc, topic, section, contextual ad, and thumbs-up/down region/locale config strings become empty.
- `browser.newtabpage.activity-stream.discoverystream.reportAds.enabled = false`
- `browser.newtabpage.activity-stream.discoverystream.sections.cards.enabled = false`
- `browser.newtabpage.activity-stream.discoverystream.sections.personalization.inferred.user.enabled = false`
- `browser.newtabpage.activity-stream.newtabWallpapers.enabled = false`
- `browser.newtabpage.activity-stream.newtabWallpapers.customColor.enabled = false`
- `browser.newtabpage.activity-stream.newtabWallpapers.customWallpaper.enabled = false`
- `browser.newtabpage.activity-stream.improvesearch.topSiteSearchShortcuts = false`
- `browser.newtabpage.activity-stream.logowordmark.alwaysVisible = false`
- `browser.newtabpage.sponsor-protection.enabled = false`

## ActivityStream seed defaults

In `browser/extensions/newtab/lib/ActivityStream.sys.mjs`:

1. Set top sites and top stories exported defaults false:

```js
export const PREF_DEFAULT_VALUE_TOPSITES_ENABLED = false;
export const PREF_DEFAULT_VALUE_TOPSTORIES_ENABLED = false;
```

2. Remove dynamic regional default helpers for features we do not want silently re-enabled:

- Remove `REGION_WEATHER_CONFIG`.
- Remove `LOCALE_WEATHER_CONFIG`.
- Remove `REGION_SECTIONS_CONFIG`.
- Remove `LOCALE_SECTIONS_CONFIG`.
- Remove `showSpocs`.
- Remove `showWeather`.
- Remove `showSectionLayout`.

3. Set `PREFS_CONFIG` values to false/zero for:

- `hideLogo = true`
- `showSponsored = false`
- `system.showSponsored = false`
- `showSponsoredTopSites = false`
- `system.showWeather = false`
- `showWeather = false`
- `logowordmark.alwaysVisible = false`
- `section.highlights.includeVisited = false`
- `section.highlights.includeBookmarks = false`
- `section.highlights.includeDownloads = false`
- `section.highlights.rows = 0`
- `section.topstories.rows = 0`
- `discoverystream.sections.enabled = false`
- `widgets.enabled = false`
- `widgets.weatherForecast.enabled = false`
- `widgets.weather.enabled = false`
- `widgets.system.weather.enabled = false`

4. Add a `customizeMenu.enabled` pref to `PREFS_CONFIG`.

Current seed default is `true` so upstream customization tests can opt in explicitly. The product default in `firefox.js` is `false`, which is what new Umbrafox profiles receive.

## Hide the customize menu at runtime

In `browser/extensions/newtab/content-src/components/Base/Base.jsx`:

1. Add `isCustomizeMenuEnabled()`.
2. Make `openCustomizationMenu()` return early when disabled.
3. Ignore `#customize` and `#customize-topics` URL hashes when the customize menu is disabled.
4. Wrap both Nova and non-Nova customize menu render blocks in `customizeMenuEnabled && (...)`.

This prevents the floating customize button and wallpaper highlight UI from appearing even if code paths try to open the menu.

## Strip Home preferences controls

In redesigned Home settings, remove from `browser/extensions/newtab/lib/AboutPreferences.sys.mjs`:

- `supportFirefox`
- `sponsoredShortcuts`
- `sponsoredStories`
- `supportFirefoxPromo`
- `recentActivity`
- `recentActivityRows`
- `recentActivityVisited`
- `recentActivityBookmarks`
- `recentActivityDownloads`
- `chooseWallpaper`
- `firefoxLogo`

Also remove the same legacy settings path:

- Drop `support-firefox` from `PREFS_FOR_SETTINGS`.
- Stop appending `highlights` from `Sections`.
- Remove pref registrations for sponsored content and highlights.
- Remove special support-firefox child checkbox sync code.

In `browser/components/preferences/home.inc.xhtml`, remove:

- `<vbox id="support-firefox" />`
- The `.mission-message` promo box.
- `<vbox id="highlights" />`

## Test updates

Customize-menu browser tests now push:

```js
["browser.newtabpage.activity-stream.customizeMenu.enabled", true]
```

The new `test_UmbrafoxHomeDefaults.js` file verifies the expected profile defaults and Activity Stream seed defaults. Register it in `browser/components/newtab/test/xpcshell/xpcshell.toml`.

## Verification

```bash
./mach lint browser/app/profile/firefox.js browser/extensions/newtab/lib/ActivityStream.sys.mjs browser/extensions/newtab/content-src/components/Base/Base.jsx browser/extensions/newtab/lib/AboutPreferences.sys.mjs browser/components/preferences/home.inc.xhtml browser/components/newtab/test/xpcshell/test_UmbrafoxHomeDefaults.js
./mach xpcshell-test browser/components/newtab/test/xpcshell/test_UmbrafoxHomeDefaults.js
./mach build faster
./mach run --temp-profile
```

Manual checks:

- New tab does not show logo, shortcuts, stories, recent activity, weather, wallpaper, or support/sponsor content.
- about:preferences Home does not show Support Umbrafox, Recent activity, Choose a wallpaper, or Umbrafox logo.
- Existing profiles may need reset or `--temp-profile` to observe defaults.
