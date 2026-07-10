/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { RootBiDiModule } from "chrome://remote/content/webdriver-bidi/modules/RootBiDiModule.sys.mjs";

const lazy = {};

ChromeUtils.defineESModuleGetters(lazy, {
  assert: "chrome://remote/content/shared/webdriver/Assert.sys.mjs",
});

const CAPABILITIES = Object.freeze([
  { name: "channel.status", implemented: true },
  { name: "channel.capabilities", implemented: true },
  { name: "browser.inventory", implemented: false },
  { name: "userland.scripts", implemented: false },
  { name: "userland.runtime", implemented: false },
  { name: "network.interception", implemented: false },
  { name: "dom.mutationControl", implemented: false },
  { name: "chrome.control", implemented: false },
  { name: "debugging", implemented: false },
  { name: "audit", implemented: false },
]);

class UmbrafoxModule extends RootBiDiModule {
  destroy() {}

  status() {
    lazy.assert.hasSystemAccess();

    return {
      channel: "umbrafox",
      protocol: "webdriver-bidi",
      systemAccess: true,
      appName: Services.appinfo.name,
      appVersion: Services.appinfo.version,
      platformVersion: Services.appinfo.platformVersion,
      appBuildID: Services.appinfo.appBuildID,
    };
  }

  listCapabilities() {
    lazy.assert.hasSystemAccess();

    return {
      capabilities: CAPABILITIES.map(capability => ({ ...capability })),
    };
  }
}

export const umbrafox = UmbrafoxModule;
