/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const REGION_DEFAULTS_PREF = "quicksuggest.regionDefaults.enabled";
const SUGGEST_PREFS = [
  "quicksuggest.enabled",
  "quicksuggest.online.available",
  "quicksuggest.settingsUi",
  "suggest.quicksuggest.all",
  "suggest.quicksuggest.sponsored",
  "addons.featureGate",
  "amp.featureGate",
  "importantDates.featureGate",
  "mdn.featureGate",
  "weather.featureGate",
  "wikipedia.featureGate",
  "yelp.featureGate",
];
let originalDefaults;

add_setup(async () => {
  await UrlbarTestUtils.initNimbusFeature();
  let defaults = new Preferences({
    branch: "browser.urlbar.",
    defaultBranch: true,
  });
  Assert.equal(defaults.get(REGION_DEFAULTS_PREF), false);
  originalDefaults = Object.fromEntries(
    SUGGEST_PREFS.map(name => [name, defaults.get(name)])
  );
  let restoreRegion = await QuickSuggestTestUtils.setRegionAndLocale({
    region: "US",
    locale: "en-US",
    skipSuggestReset: true,
  });
  registerCleanupFunction(restoreRegion);
  await QuickSuggestTestUtils.ensureQuickSuggestInit();
  registerCleanupFunction(async () => {
    UrlbarPrefs.set(REGION_DEFAULTS_PREF, false);
    for (let name of SUGGEST_PREFS) {
      UrlbarPrefs.clear(name);
    }
    await QuickSuggestTestUtils.forceSync();
  });
});

add_task(async function disabled_init_finishes() {
  await Promise.all([
    QuickSuggest.init(),
    QuickSuggest.init(),
    QuickSuggest.initPromise,
  ]);
  Assert.ok(!QuickSuggest.rustBackend.isEnabled);
  Assert.ok(!QuickSuggest.getFeature("AmpSuggestions").isEnabled);
  for (let [name, value] of Object.entries(originalDefaults)) {
    Assert.equal(UrlbarPrefs.get(name), value, name);
    Assert.ok(!Services.prefs.prefHasUserValue("browser.urlbar." + name));
  }
});

add_task(async function live_regional_opt_in_and_out() {
  for (let enabled of [true, false, true, false]) {
    UrlbarPrefs.set(REGION_DEFAULTS_PREF, enabled);
    await QuickSuggestTestUtils.forceSync();
    Assert.equal(UrlbarPrefs.get("quicksuggest.enabled"), enabled);
    Assert.equal(QuickSuggest.rustBackend.isEnabled, enabled);
    Assert.equal(QuickSuggest.getFeature("AmpSuggestions").isEnabled, enabled);
    if (!enabled) {
      for (let [name, value] of Object.entries(originalDefaults)) {
        Assert.equal(UrlbarPrefs.get(name), value, name);
      }
    }
  }
});

add_task(async function explicit_choices_are_preserved() {
  for (let mainEnabled of [false, true]) {
    UrlbarPrefs.set("quicksuggest.enabled", mainEnabled);
    UrlbarPrefs.set("suggest.quicksuggest.sponsored", false);
    try {
      for (let enabled of [true, false]) {
        UrlbarPrefs.set(REGION_DEFAULTS_PREF, enabled);
        await QuickSuggestTestUtils.forceSync();
        Assert.equal(UrlbarPrefs.get("quicksuggest.enabled"), mainEnabled);
        Assert.equal(QuickSuggest.rustBackend.isEnabled, mainEnabled);
        Assert.ok(!UrlbarPrefs.get("suggest.quicksuggest.sponsored"));
        Assert.ok(!QuickSuggest.getFeature("AmpSuggestions").isEnabled);
      }
    } finally {
      UrlbarPrefs.set(REGION_DEFAULTS_PREF, false);
      UrlbarPrefs.clear("quicksuggest.enabled");
      UrlbarPrefs.clear("suggest.quicksuggest.sponsored");
      await QuickSuggestTestUtils.forceSync();
    }
  }
});

add_task(async function region_changes_respect_the_control() {
  for (let [region, locale] of [
    ["DE", "de"],
    ["US", "ja"],
    ["US", "en-US"],
  ]) {
    await QuickSuggestTestUtils.withRegionAndLocale({
      region,
      locale,
      callback: async () => {
        Assert.ok(!UrlbarPrefs.get("quicksuggest.enabled"));
        Assert.ok(!QuickSuggest.rustBackend.isEnabled);
        UrlbarPrefs.set(REGION_DEFAULTS_PREF, true);
        try {
          await QuickSuggestTestUtils.forceSync();
          Assert.equal(QuickSuggest.rustBackend.isEnabled, locale != "ja");
        } finally {
          UrlbarPrefs.set(REGION_DEFAULTS_PREF, false);
          await QuickSuggestTestUtils.forceSync();
        }
      },
    });
  }
});
