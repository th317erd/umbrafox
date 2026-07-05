/* Any copyright is dedicated to the Public Domain.
   http://creativecommons.org/publicdomain/zero/1.0/ */

"use strict";

async function readRepoFile(...pathParts) {
  const repoDir = Services.env.get("MOZ_DEVELOPER_REPO_DIR");
  Assert.ok(repoDir, "MOZ_DEVELOPER_REPO_DIR is available");
  return IOUtils.readUTF8(PathUtils.join(repoDir, ...pathParts));
}

function assertPrefValue(source, pref, expected) {
  const escapedPref = pref.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedValue = String(expected).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const prefPattern = new RegExp(
    `pref\\("${escapedPref}",\\s*${escapedValue}(?:,\\s*[^)]*)?\\);`
  );
  Assert.ok(prefPattern.test(source), `${pref} defaults to ${expected}`);
}

add_task(async function test_umbrafox_profile_defaults() {
  const firefoxPrefs = await readRepoFile(
    "browser",
    "app",
    "profile",
    "firefox.js"
  );

  assertPrefValue(firefoxPrefs, "browser.shell.checkDefaultBrowser", "false");
  assertPrefValue(firefoxPrefs, "browser.startup.page", "3");

  const expectedPrefs = {
    "app.normandy.enabled": false,
    "app.normandy.run_interval_seconds": 0,
    "app.shield.optoutstudies.enabled": false,
    "browser.crashReports.unsubmittedCheck.enabled": false,
    "browser.discovery.enabled": false,
    "browser.newtabpage.activity-stream.showSearch": true,
    "browser.newtabpage.activity-stream.customizeMenu.enabled": false,
    "browser.newtabpage.activity-stream.hideLogo": true,
    "browser.newtabpage.activity-stream.feeds.topsites": false,
    "browser.newtabpage.activity-stream.feeds.section.topstories": false,
    "browser.newtabpage.activity-stream.feeds.section.highlights": false,
    "browser.newtabpage.activity-stream.showWeather": false,
    "browser.newtabpage.activity-stream.widgets.enabled": false,
    "browser.newtabpage.activity-stream.showSponsored": false,
    "browser.newtabpage.activity-stream.showSponsoredTopSites": false,
    "browser.newtabpage.sponsor-protection.enabled": false,
    "browser.urlbar.quicksuggest.online.enabled": false,
    "browser.urlbar.recentsearches.featureGate": false,
    "browser.urlbar.suggest.engines": false,
    "browser.urlbar.suggest.recentsearches": false,
    "browser.urlbar.suggest.searches": false,
    "browser.urlbar.suggest.trending": false,
    "browser.urlbar.trending.featureGate": false,
    "nimbus.rollouts.enabled": false,
    "nimbus.telemetry.targetingContextEnabled": false,
  };

  for (const [pref, expected] of Object.entries(expectedPrefs)) {
    assertPrefValue(firefoxPrefs, pref, expected);
  }

  const allPrefs = await readRepoFile("modules", "libpref", "init", "all.js");
  assertPrefValue(allPrefs, "datareporting.usage.uploadEnabled", false);
});

add_task(function test_umbrafox_activity_stream_seed_defaults() {
  const repoDir = Services.env.get("MOZ_DEVELOPER_REPO_DIR");
  Assert.ok(repoDir, "MOZ_DEVELOPER_REPO_DIR is available");

  const resProto = Cc[
    "@mozilla.org/network/protocol;1?name=resource"
  ].getService(Ci.nsIResProtocolHandler);
  let previousSubstitution = null;
  try {
    previousSubstitution = resProto.getSubstitution("newtab");
  } catch (e) {
    if (e.result != Cr.NS_ERROR_NOT_AVAILABLE) {
      throw e;
    }
  }
  const newtabSourcePath = PathUtils.join(
    repoDir,
    "browser",
    "extensions",
    "newtab"
  );
  const newtabSource = Services.io.newURI(
    `${PathUtils.toFileURI(newtabSourcePath)}/`
  );
  resProto.setSubstitution("newtab", newtabSource);
  registerCleanupFunction(() => {
    resProto.setSubstitution("newtab", previousSubstitution);
  });

  const { PREFS_CONFIG } = ChromeUtils.importESModule(
    "resource://newtab/lib/ActivityStream.sys.mjs"
  );

  const expectedValues = {
    "customizeMenu.enabled": true,
    "feeds.topsites": false,
    "feeds.section.topstories": false,
    hideLogo: true,
    showSearch: true,
    showSponsored: false,
    "system.showSponsored": false,
    showSponsoredTopSites: false,
    showWeather: false,
    "system.showWeather": false,
    "section.highlights.includeVisited": false,
    "section.highlights.includeBookmarks": false,
    "section.highlights.includeDownloads": false,
    "section.highlights.rows": 0,
    "section.topstories.rows": 0,
    "discoverystream.sections.enabled": false,
    "logowordmark.alwaysVisible": false,
    "widgets.enabled": false,
    "widgets.weather.enabled": false,
    "widgets.weatherForecast.enabled": false,
    "widgets.system.weather.enabled": false,
  };

  for (const [key, expected] of Object.entries(expectedValues)) {
    Assert.ok(PREFS_CONFIG.has(key), `${key} exists`);
    Assert.equal(PREFS_CONFIG.get(key).value, expected, key);
  }
});
