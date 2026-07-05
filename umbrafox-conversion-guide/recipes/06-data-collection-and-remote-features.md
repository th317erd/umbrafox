# Recipe 06: Data collection and remote feature disablement

## Goal

Default Umbrafox away from Mozilla data collection, remote rollouts, studies, sponsored discovery, and automated usage reporting.

This recipe is separate from UI stripping. UI stripping hides controls. These pref changes set the actual defaults.

## Files changed

- `browser/app/profile/firefox.js`
- `modules/libpref/init/all.js`
- `browser/components/preferences/config/permissions-data.mjs`

## Pref defaults

In `browser/app/profile/firefox.js`, set:

```js
pref("nimbus.telemetry.targetingContextEnabled", false);
pref("nimbus.rollouts.enabled", false);
pref("browser.crashReports.unsubmittedCheck.enabled", false);
pref("app.normandy.enabled", false);
pref("app.normandy.run_interval_seconds", 0);
pref("app.shield.optoutstudies.enabled", false);
pref("browser.discovery.enabled", false);
```

Where prefs are inside preprocessor branches, keep both branches false. For example:

```js
#if defined(MOZ_ARTIFACT_BUILDS)
  pref("nimbus.telemetry.targetingContextEnabled", false);
#else
  pref("nimbus.telemetry.targetingContextEnabled", false);
#endif
```

For crash report prompt:

```js
#ifdef NIGHTLY_BUILD
  pref("browser.crashReports.unsubmittedCheck.enabled", false);
#else
  pref("browser.crashReports.unsubmittedCheck.enabled", false);
#endif
```

For Shield studies, replace the `MOZ_DATA_REPORTING` conditional with one unconditional false:

```js
pref("app.shield.optoutstudies.enabled", false);
```

## Usage ping

In `modules/libpref/init/all.js`, set:

```js
pref("datareporting.usage.uploadEnabled", false);
```

Do not duplicate `datareporting.healthreport.uploadEnabled` in `all.js` if `modules/libpref/init/StaticPrefList.yaml` already defines it as false. The pref linter treats identical duplicates as errors.

Current local `StaticPrefList.yaml` already has:

```yaml
- name: datareporting.healthreport.uploadEnabled
  type: RelaxedAtomicBool
  value: false
  mirror: always
  rust: true
```

## Related UI

The Settings card for data collection is removed in `recipes/05-preferences-ui-stripping.md`. Keep both recipes in sync:

- Defaults must be false.
- The card should not be visible.
- Existing profiles may still have user prefs, so use new profiles for verification.

## Verification

```bash
./mach lint browser/app/profile/firefox.js modules/libpref/init/all.js browser/components/preferences/config/permissions-data.mjs
./mach xpcshell-test browser/components/newtab/test/xpcshell/test_UmbrafoxHomeDefaults.js
```

Useful source checks:

```bash
rg -n 'nimbus.telemetry.targetingContextEnabled|nimbus.rollouts.enabled|browser.crashReports.unsubmittedCheck.enabled|app.normandy.enabled|app.normandy.run_interval_seconds|app.shield.optoutstudies.enabled|browser.discovery.enabled' browser/app/profile/firefox.js
rg -n 'datareporting.healthreport.uploadEnabled|datareporting.usage.uploadEnabled' modules/libpref/init/all.js modules/libpref/init/StaticPrefList.yaml
```
