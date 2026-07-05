# Recipe 04: Search engine policy

## Goal

Use DuckDuckGo as the default search engine and prevent Google, Bing, Amazon, and eBay search engines from appearing in available engines.

## Files changed

- `services/settings/dumps/main/search-config-v2.json`
- `services/settings/dumps/main/search-config-overrides-v2.json`
- `services/settings/dumps/main/search-default-override-allowlist.json`
- `toolkit/components/search/SearchEngineSelector.sys.mjs`
- `toolkit/components/search/tests/xpcshell/test_engine_selector_remote_settings.js`

## Why there are two layers

Editing local Remote Settings dumps is not enough by itself. Firefox can still consume Remote Settings data at runtime. The selector filter in `SearchEngineSelector.sys.mjs` is the guardrail that prevents blocked engines from leaking back in when settings data changes or is refreshed.

## Dump changes

In `services/settings/dumps/main/search-config-v2.json`:

1. Change default engine:

```json
"globalDefault": "ddg"
```

2. Clear `specificDefaults` for the `defaultEngines` record:

```json
"specificDefaults": []
```

3. Remove engine records whose identifiers are:

- `google`
- `bing`
- `amazondotcom-us`
- every identifier beginning with `ebay`

4. Remove blocked engines from engine order lists, such as:

```json
"order": [
  "baidu",
  "wikipedia*"
]
```

In `services/settings/dumps/main/search-config-overrides-v2.json`, clear Amazon overrides:

```json
{
  "data": [],
  "timestamp": 1710333238310
}
```

In `services/settings/dumps/main/search-default-override-allowlist.json`, remove Bing allowlist entries.

## Runtime filter

In `toolkit/components/search/SearchEngineSelector.sys.mjs`, add a blocklist:

```js
const UMBRAFOX_BLOCKED_SEARCH_ENGINE_IDS = new Set(["bing", "google"]);
const UMBRAFOX_BLOCKED_SEARCH_ENGINE_PREFIXES = ["amazon", "ebay"];

function isUmbrafoxBlockedSearchEngineId(identifier) {
  identifier ??= "";
  return (
    UMBRAFOX_BLOCKED_SEARCH_ENGINE_IDS.has(identifier) ||
    UMBRAFOX_BLOCKED_SEARCH_ENGINE_PREFIXES.some(prefix =>
      identifier.startsWith(prefix)
    )
  );
}
```

Apply it in three places:

1. Contextual engine host map setup should skip blocked engine records.
2. `findContextualSearchEngineById(id)` should return `null` for blocked IDs.
3. `fetchEngineConfiguration()` should filter out blocked engines alongside optional engines:

```js
refinedSearchConfig.engines = refinedSearchConfig.engines.filter(
  e => !e.optional && !isUmbrafoxBlockedSearchEngineId(e.identifier)
);
```

## Regression test

In `toolkit/components/search/tests/xpcshell/test_engine_selector_remote_settings.js`, add a test that feeds the selector:

- `google`
- `amazondotcom-us`
- `bing`
- `ddg`
- `ebay-us`
- `perplexity`

Expected result:

- Visible engines: `["ddg", "perplexity"]`
- Default falls back to `ddg`
- contextual lookup for `google` returns `null`

## Verification

```bash
./mach xpcshell-test toolkit/components/search/tests/xpcshell/test_engine_selector_remote_settings.js
./mach build faster
./mach run --temp-profile
```

Manual checks in about:preferences Search:

- Default search engine is DuckDuckGo.
- Additional engines list does not contain Google.
- Additional engines list does not contain Amazon.
- Additional engines list does not contain Bing.
- Additional engines list does not contain eBay.

If blocked engines still show, check that you are using a new profile or that the runtime selector filter is present. Removing `~/.config/umbrafox` is not sufficient.
