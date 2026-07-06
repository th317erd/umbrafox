# Current Umbrafox conversion state

This document summarizes what has been changed from upstream Firefox so far. It is a map, not a patch.

## High-level goals already implemented

Umbrafox currently changes Firefox in these broad ways:

1. Application identity and branding are changed from Firefox/Mozilla to Umbrafox.
2. The default browser check is disabled by default.
3. Session restore is enabled by default via `browser.startup.page = 3`.
4. The new tab/homepage is reduced toward a search-only experience.
5. The new tab customize menu, wallpaper entry points, logo toggle, sponsored content, recent activity, weather, widgets, top sites, stories, and Discovery Stream defaults are disabled.
6. DuckDuckGo is the default search engine.
7. Google, Bing, Amazon, and eBay search engines are removed or blocked from the search engine list.
8. Search suggestions and Umbrafox Suggest sponsored/online/recent/trending controls are stripped or default-off.
9. The Settings data-collection card is removed.
10. Normandy, Nimbus rollouts, feature studies, technical/interaction data upload, usage ping, extension recommendations, and crash submission prompt defaults are disabled.
11. en-US visible copy and comments were swept from Firefox to Umbrafox where appropriate.
12. Focused regression tests were added or adjusted so the Umbrafox defaults remain intentional.
13. The built browser executable name is explicitly `umbrafox` via `MOZ_APP_NAME`.

## Userland scripts state

The userland scripts feature has an architecture note and recipe:

- `03-userland-scripts-architecture.md`
- `recipes/09-userland-scripts.md`

The profile-local script store is implemented in `toolkit/components/umbrafox/UmbrafoxUserlandScriptStore.sys.mjs` with xpcshell coverage. Scope derivation is implemented in `toolkit/components/umbrafox/UmbrafoxUserlandScriptScope.sys.mjs`, and the Debugger source tree can create disabled userland script records from its context menu and footer `New Script` button. Created scripts now appear under matching domain groups in a `Userland` folder, can be enabled or disabled from that tree row, and open editable stored code in the Debugger editor. Do not expect the current browser build to execute userland scripts until a later runtime injection slice lands.

## Important state note

At the time this guide was first created, Umbrafox changes were working-tree modifications. They were later committed as `5d89f338f5e9 Convert Firefox to Umbrafox`.

Future major Umbrafox changes should preferably be committed in subsystem-sized commits. A practical split would be:

1. Identity and branding.
2. Branding assets and localization sweep.
3. Homepage/newtab defaults and UI stripping.
4. Search engine policy.
5. Preferences data-collection and suggest stripping.
6. Tests.

That split will make future rebases and conflict diagnosis much easier than another large snapshot commit.

## Profile behavior note

Do not assume user data lives under `~/.config/umbrafox`.

This source tree changes application identity, but Firefox profile location behavior is controlled by the built application metadata and toolkit profile service behavior. The built `application.ini` currently contains:

```ini
Vendor=Umbrafox
Name=Umbrafox
```

On Linux, Firefox-family profiles are normally under `~/.mozilla/...`, not `~/.config/...`. Always verify the exact active profile path in `about:profiles`, or run with an explicit profile:

```bash
./mach run --temp-profile
./mach run --profile /absolute/path/to/profile
```

When testing default prefs, use a new or temporary profile. Existing `prefs.js` values can override changed defaults.

## Last verified commands

The current conversion state was verified with:

```bash
./mach lint browser/components/preferences/config/search.mjs browser/components/preferences/home.inc.xhtml browser/components/preferences/config/permissions-data.mjs browser/extensions/newtab/lib/AboutPreferences.sys.mjs browser/app/profile/firefox.js modules/libpref/init/all.js browser/components/newtab/test/xpcshell/test_UmbrafoxHomeDefaults.js
./mach xpcshell-test browser/components/newtab/test/xpcshell/test_UmbrafoxHomeDefaults.js
./mach build faster
git diff --check
```

The search-engine selector test was previously verified with:

```bash
./mach xpcshell-test toolkit/components/search/tests/xpcshell/test_engine_selector_remote_settings.js
```
