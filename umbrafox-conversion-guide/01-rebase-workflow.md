# Rebase workflow for new Firefox source

Use this workflow when pulling new upstream Firefox source and reapplying Umbrafox conversion changes.

## 1. Start from a clean state

Before fetching upstream, save or commit all local Umbrafox changes.

Recommended:

```bash
git status --short
git diff --stat
git diff --check
```

If the conversion is still uncommitted, create a safety branch before touching upstream:

```bash
git switch -c umbrafox-conversion-snapshot-YYYYMMDD
git add -A
git commit -m "Umbrafox conversion snapshot"
```

Then return to the integration branch and update from upstream:

```bash
git switch main
git fetch upstream
git merge upstream/main
```

If the project has moved to a commit stack, prefer rebasing the Umbrafox commits onto the new upstream base.

## 2. Apply recipes in subsystem order

Apply changes in this order because later recipes depend on earlier identity and preference defaults:

1. Application identity and branding.
2. Brand assets.
3. Profile defaults and homepage/newtab behavior.
4. Search engine policy.
5. Preferences UI stripping.
6. Data collection and remote feature disablement.
7. Localization/copy sweep.
8. Tests and verification.

## 3. Conflict hotspots

Expect conflicts in these files:

- `browser/app/profile/firefox.js`
- `browser/extensions/newtab/lib/ActivityStream.sys.mjs`
- `browser/extensions/newtab/lib/AboutPreferences.sys.mjs`
- `browser/extensions/newtab/content-src/components/Base/Base.jsx`
- `browser/components/preferences/config/search.mjs`
- `browser/components/preferences/config/permissions-data.mjs`
- `services/settings/dumps/main/search-config-v2.json`
- `toolkit/components/search/SearchEngineSelector.sys.mjs`
- `browser/branding/**`
- `toolkit/locales/en-US/toolkit/branding/brandings.ftl`
- `browser/locales/en-US/browser/preferences/preferences.ftl`

## 4. Verification tiers

Fast tier after conflict resolution:

```bash
./mach lint browser/app/profile/firefox.js browser/extensions/newtab/lib/ActivityStream.sys.mjs browser/extensions/newtab/lib/AboutPreferences.sys.mjs browser/extensions/newtab/content-src/components/Base/Base.jsx browser/components/preferences/config/search.mjs browser/components/preferences/config/permissions-data.mjs modules/libpref/init/all.js
./mach xpcshell-test browser/components/newtab/test/xpcshell/test_UmbrafoxHomeDefaults.js
./mach xpcshell-test toolkit/components/search/tests/xpcshell/test_engine_selector_remote_settings.js
./mach build faster
```

Manual browser tier:

```bash
./mach run --temp-profile
```

Check:

- New tab is search-only or as close as current recipe specifies.
- about:preferences Search has no blocked engines and no stripped suggest controls.
- about:preferences Home has no stripped Support, Recent Activity, wallpaper, or logo controls.
- about:preferences Privacy has no data collection card.
- Default engine is DuckDuckGo.
- Google, Bing, Amazon, and eBay are not available search engines.

Full tier before distributing builds:

```bash
./mach build
./mach test --auto
```

Use CI/try only after the local targeted tier is clean.
