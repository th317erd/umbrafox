# Recipe 07: Localization and copy sweep

## Goal

Replace visible Firefox product references with Umbrafox in en-US strings and selected comments while preserving internal identifiers that still need upstream naming.

## Files changed

The current sweep touches en-US browser, devtools, and toolkit localization files:

- `browser/locales/en-US/browser/**`
- `browser/locales/en-US/chrome/**`
- `browser/locales/en-US/updater/updater.ini`
- `devtools/client/locales/en-US/**`
- `toolkit/locales/en-US/**`
- `toolkit/content/aboutTelemetry.xhtml`
- `tools/lint/fluent-lint/exclusions.yml`

See `reference/changed-files.md` for the full file list.

## Important terms

In `toolkit/locales/en-US/toolkit/branding/brandings.ftl`, update Firefox-branded terms:

```ftl
-monitor-brand-name = Umbrafox Monitor
-send-brand-name = Umbrafox Send
-screenshots-brand-name = Umbrafox Screenshots
-profiler-brand-name = Umbrafox Profiler
-translations-brand-name = Umbrafox Translations
-focus-brand-name = Umbrafox Focus
-relay-brand-name = Umbrafox Relay
-firefox-suggest-brand-name = Umbrafox Suggest
-firefox-home-brand-name = Umbrafox Home
-firefoxview-brand-name = Umbrafox View
-firefoxlabs-brand-name = Umbrafox Labs
```

The term IDs still contain `firefox`. Do not rename term IDs unless every reference is also updated.

## about:telemetry string ID

The conversion renamed the telemetry JSON viewer string ID:

In `toolkit/content/aboutTelemetry.xhtml`:

```html
data-l10n-id="about-telemetry-show-in-umbrafox-json-viewer"
```

In `tools/lint/fluent-lint/exclusions.yml`, update the matching ID exclusion from `about-telemetry-show-in-Firefox-json-viewer` to `about-telemetry-show-in-umbrafox-json-viewer`.

If future upstream changes restore the original ID, update both files together.

## How to sweep safely

Use search, but do not blindly replace:

```bash
rg -n '\\bFirefox\\b|\\bMozilla Firefox\\b|\\bNightly\\b' browser/locales/en-US toolkit/locales/en-US devtools/client/locales/en-US
```

Review each hit. Preserve:

- URLs under `support.mozilla.org` unless we own the replacement target.
- Hard-coded `Mozilla` where the text intentionally describes Mozilla services.
- Internal IDs such as `-firefox-home-brand-name`.
- Policy names or support-page IDs where renaming breaks lookup.
- Historical references when they refer to actual Firefox history.

## Copy groups already touched

Current conversion includes:

- About dialog/update/support strings.
- New tab/Home settings comments and labels.
- Onboarding comments and some body text.
- Sync/mobile promo string.
- Firefox Suggest/Home/View/Labs branded terms.
- DevTools visible copy and comments.
- about:addons/about:support/about:telemetry text.
- updater strings.
- default bookmarks text.
- policy descriptions.

## Verification

Run Fluent lint after copy changes:

```bash
./mach lint browser/locales/en-US toolkit/locales/en-US devtools/client/locales/en-US tools/lint/fluent-lint/exclusions.yml toolkit/content/aboutTelemetry.xhtml
```

Manual checks:

- about:preferences.
- about:support.
- about:telemetry.
- about:addons.
- about:welcome.
- about:newtab.
