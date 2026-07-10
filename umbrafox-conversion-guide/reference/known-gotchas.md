# Known gotchas

## Existing profiles hide default-pref changes

Many Umbrafox changes are default prefs. Existing profiles can keep old values in `prefs.js`.

Use:

```bash
./mach run --temp-profile
```

or create a new profile from `about:profiles`.

## Do not clear only `~/.config/umbrafox`

Firefox-family profile data is not normally stored under `~/.config/umbrafox`. Verify paths in `about:profiles`. On Linux, expect paths under `~/.mozilla/...` unless profile directory behavior is explicitly changed.

## Search engine dumps are not enough

Removing engines from `services/settings/dumps/main/search-config-v2.json` does not fully solve engine reappearance. Runtime Remote Settings data can reintroduce engines. Keep the `SearchEngineSelector.sys.mjs` blocklist.

## `lintpref` catches duplicate static prefs

Do not set `datareporting.healthreport.uploadEnabled` in `modules/libpref/init/all.js` when `StaticPrefList.yaml` already has the same value. The `lintpref` rule treats that as a duplicate error.

## Internal `firefox` identifiers often stay

Do not rename IDs just because they contain `firefox`.

Examples that currently remain:

- `-firefox-home-brand-name`
- `-firefox-suggest-brand-name`
- `firefoxHomeDeps`
- support page identifiers such as `firefox-suggest`
- filenames such as `firefox-wordmark.svg`

Rename identifiers only when every reference path is traced.

## Browser tests may need opt-in prefs

Because Umbrafox defaults the customize menu off, upstream tests that expect it must push:

```js
["browser.newtabpage.activity-stream.customizeMenu.enabled", true]
```

## Regenerate exports after upstream IPDL changes

After a large upstream merge, generated IPDL headers under `obj-*/ipc/ipdl/_ipdlheaders/` can be stale even when the source `.ipdl` files are current. If `./mach build binaries` fails with constructor arity mismatches such as `SendPDocAccessibleConstructor` or `RecvPExternalHelperAppConstructor`, run:

```bash
./mach build export
./mach build binaries
```

## Documentation folder is not Sphinx-linked

`umbrafox-conversion-guide/` is intentionally not under Firefox's source docs system. If it is moved under `docs/`, add proper Sphinx config and toctree entries or documentation builds may fail.

## en-US sweep does not cover all locales

The current conversion touches en-US strings. Localized builds may still contain Firefox references until localization strategy is defined.
