# Recipe 05: Preferences UI stripping

## Goal

Remove settings UI that advertises or controls features Umbrafox does not want exposed:

- Trending search suggestions.
- Recent searches in the address bar.
- Suggest search engines to use.
- Umbrafox Suggest sponsored/online suggestions.
- Restore dismissed sponsored suggestions.
- Data collection and use.
- Home page support/sponsor/recent/wallpaper/logo controls.

## Search settings UI

File:

- `browser/components/preferences/config/search.mjs`

Remove these pref registrations from `Preferences.addAll`:

- `browser.urlbar.suggest.trending`
- `browser.urlbar.trending.featureGate`
- `browser.urlbar.recentsearches.featureGate`
- `browser.urlbar.suggest.recentsearches`
- `browser.urlbar.suggest.engines`
- `browser.urlbar.suggest.quicksuggest.all`
- `browser.urlbar.suggest.quicksuggest.sponsored`
- `browser.urlbar.quicksuggest.online.enabled`

Remove these setting registrations:

- `trendingFeaturegatePref`
- `showTrendingSuggestionsCheckbox`
- `enableRecentSearchesFeatureGate`
- `enableRecentSearches`
- `enginesSuggestion`
- `firefoxSuggestAll`
- `firefoxSuggestSponsored`
- `firefoxSuggestOnlineEnabledToggle`
- `restoreDismissedSuggestions`
- `dismissedSuggestionsDescription`
- helper `determineSuggestionSettingsVisibility`

Remove these controls from the `SettingGroupManager.registerGroups` trees:

- `showTrendingSuggestionsCheckbox`
- `enableRecentSearches`
- `enginesSuggestion`
- `firefoxSuggestAll`
- nested `firefoxSuggestSponsored`
- nested `firefoxSuggestOnlineEnabledToggle`
- `dismissedSuggestionsDescription`
- nested `restoreDismissedSuggestions`

Leave local, useful address-bar controls intact:

- History.
- Bookmarks.
- Clipboard.
- Open tabs.
- Shortcuts/top sites.
- Quick actions.

## Data collection UI

File:

- `browser/components/preferences/config/permissions-data.mjs`

Remove the entire data-collection group and its settings:

- `PRIVACY_SEGMENTATION_PREF`
- `BACKUP_ENABLED_ON_PROFILES_PREF_NAME`
- `PREF_UPLOAD_ENABLED`
- `PREF_ADDON_RECOMMENDATIONS_ENABLED`
- `PREF_NORMANDY_ENABLED`
- `PREF_OPT_OUT_STUDIES_ENABLED`
- `dataCollectionCategory`
- `dataCollectionLink`
- `preferencesPrivacyProfiles`
- `privacyProfilesLink`
- `telemetryContainer`
- `profilesBackupEnabled`
- `submitHealthReportBox`
- `addonRecommendationEnabled`
- `normandyEnabled`
- `optOutStudiesEnabled`
- `viewShieldStudies`
- `enableNimbusRollouts`
- `submitUsagePingBox`
- `automaticallySubmitCrashesBox`
- `backup-multi-profile-warning-message-bar`
- `dataCollection` group inside `SettingGroupManager.registerGroups`

Also remove now-unused lazy imports:

- `AppConstants`
- `SelectableProfileService`

Keep permissions UI intact.

## Home settings UI

Files:

- `browser/extensions/newtab/lib/AboutPreferences.sys.mjs`
- `browser/components/preferences/home.inc.xhtml`

Remove Home controls from both redesigned and legacy paths:

- Support Umbrafox.
- Sponsored shortcuts.
- Sponsored stories.
- Support promo message.
- Recent activity.
- Recent activity rows.
- Recent activity visited/bookmarks/downloads.
- Choose wallpaper.
- Umbrafox logo toggle.

See `recipes/03-profile-defaults-and-homepage.md` for the exact Home path.

## Verification

Greps should find no live controls in the touched preferences files:

```bash
rg -n 'showTrendingSuggestionsCheckbox|enableRecentSearches|enginesSuggestion|firefoxSuggestAll|firefoxSuggestSponsored|firefoxSuggestOnlineEnabledToggle|restoreDismissedSuggestions|dismissedSuggestionsDescription' browser/components/preferences/config/search.mjs
rg -n 'dataCollectionCategory|submitHealthReportBox|enableNimbusRollouts|submitUsagePingBox|automaticallySubmitCrashesBox' browser/components/preferences/config/permissions-data.mjs
rg -n 'supportFirefox|support-firefox|recentActivity|chooseWallpaper|firefoxLogo|mission-message|showSponsoredCheckboxes|showSponsoredTopSites|showSponsored' browser/extensions/newtab/lib/AboutPreferences.sys.mjs browser/components/preferences/home.inc.xhtml
```

Expected: no matches for live stripped controls.

Run:

```bash
./mach lint browser/components/preferences/config/search.mjs browser/components/preferences/config/permissions-data.mjs browser/extensions/newtab/lib/AboutPreferences.sys.mjs browser/components/preferences/home.inc.xhtml
./mach build faster
```

Manual checks:

- about:preferences Search has no highlighted stripped suggestion controls.
- about:preferences Privacy has no data collection card.
- about:preferences Home has no Support Umbrafox, Recent activity, wallpaper, or logo rows.
