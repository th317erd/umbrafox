/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const { publishUserlandScripts } = ChromeUtils.importESModule(
  "resource://gre/modules/UmbrafoxUserlandScriptRegistry.sys.mjs"
);
const ACTIVE_PREF = "umbrafox.userlandScripts.active";
const TEST_ORIGIN = "https://example.com";
const TEST_URL =
  `${TEST_ORIGIN}/browser/toolkit/components/umbrafox/tests/browser/` +
  "file_userland_order.html";

registerCleanupFunction(() => publishUserlandScripts([]));

add_task(async function test_mutation_gate_tracks_live_activation() {
  publishUserlandScripts([
    {
      id: "mutation-gate",
      name: "Mutation gate",
      enabled: true,
      scope: {
        origin: TEST_ORIGIN,
        targetKinds: ["document"],
        sourceUrlPattern: null,
      },
      world: "default",
      code: `
        window.gateCalls = 0;
        userland.on("mutation", event => {
          if (event.kind == "attribute" &&
              event.attributeName == "data-gate-probe") {
            ++window.gateCalls;
            event.newValue = "rewritten";
          } else if (event.kind == "characterData" &&
                     event.newData == "gate-original") {
            ++window.gateCalls;
            event.newData = "rewritten";
          } else if (event.kind == "childList" &&
                     event.addedNodes.some(node => node.id == "gate-blocked")) {
            ++window.gateCalls;
            event.preventDefault();
          }
        });
      `,
      createdAt: 0,
      updatedAt: 0,
    },
  ]);

  await BrowserTestUtils.withNewTab(TEST_URL, async browser => {
    for (const active of [false, true, false, true, false]) {
      Services.prefs.setBoolPref(ACTIVE_PREF, active);
      await TestUtils.waitForCondition(
        () =>
          SpecialPowers.spawn(
            browser,
            [ACTIVE_PREF, active],
            (pref, expected) =>
              Services.prefs.getBoolPref(pref, false) === expected
          ),
        "The content process received the current activation preference"
      );

      const result = await SpecialPowers.spawn(browser, [], () => {
        const document = content.document;
        const window = content.wrappedJSObject;
        const calls = window.gateCalls;
        const parent = document.createElement("div");
        const text = document.createTextNode("initial");
        const blocked = document.createElement("span");
        blocked.id = "gate-blocked";
        parent.append(text);
        document.body.append(parent);
        parent.setAttribute("data-gate-probe", "original");
        text.data = "gate-original";
        const returned = parent.appendChild(blocked);
        const observation = {
          attribute: parent.getAttribute("data-gate-probe"),
          text: text.data,
          inserted: parent.contains(blocked),
          returnedNode: returned === blocked,
          calls: window.gateCalls - calls,
        };
        parent.remove();
        return observation;
      });

      Assert.deepEqual(
        result,
        {
          attribute: active ? "rewritten" : "original",
          text: active ? "rewritten" : "gate-original",
          inserted: !active,
          returnedNode: true,
          calls: active ? 3 : 0,
        },
        `Native mutation behavior follows activation=${active}`
      );
    }
  });
});
