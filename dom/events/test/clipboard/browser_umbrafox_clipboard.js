/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

add_task(async function test_private_clipboard_action_rejects_unknown_token() {
  await BrowserTestUtils.withNewTab("https://example.com/", async browser => {
    await SpecialPowers.spawn(browser, [], () => {
      const params = Cc["@mozilla.org/hash-property-bag;1"].createInstance(
        Ci.nsIWritablePropertyBag2
      );
      params.setPropertyAsACString("operation", "copy");
      params.setPropertyAsACString("requestId", "unknown");
      params.setPropertyAsACString("action", "retry");
      params.setPropertyAsACString(
        "innerWindowId",
        String(content.windowGlobalChild.innerWindowId)
      );
      params.setPropertyAsBool("accepted", false);
      Services.obs.notifyObservers(params, "umbrafox-clipboard-action");
      is(
        params.getPropertyAsBool("accepted"),
        false,
        "Unknown native retry tokens fail closed without a clipboard action"
      );
    });
  });
});

add_task(async function test_native_cancellation_notice() {
  await BrowserTestUtils.withNewTab("https://example.com/", async browser => {
    await SpecialPowers.spawn(browser, [], async () => {
      const script = content.document.createElement("script");
      script.textContent = `
        document.body.innerHTML = '<p id="selection">fixture copy text</p>';
        window.getSelection().selectAllChildren(document.getElementById('selection'));
        document.addEventListener('copy', event => event.preventDefault());
      `;
      content.document.body.appendChild(script);
      const notices = [];
      const observer = (subject, topic, data) => notices.push(JSON.parse(data));
      Services.obs.addObserver(observer, "umbrafox-clipboard-canceled");
      try {
        content.docShell.doCommand("cmd_copy");
        await new Promise(resolve => content.setTimeout(resolve, 100));
        is(notices.length, 1, "A real canceled native Copy offers one notice");
        if (notices.length) {
          is(notices[0].operation, "copy", "The operation is native copy");
          const bag = Cc["@mozilla.org/hash-property-bag;1"].createInstance(
            Ci.nsIWritablePropertyBag2
          );
          bag.setPropertyAsACString("operation", "copy");
          bag.setPropertyAsACString("requestId", notices[0].requestId);
          bag.setPropertyAsACString("action", "discard");
          bag.setPropertyAsACString(
            "innerWindowId",
            String(content.windowGlobalChild.innerWindowId)
          );
          bag.setPropertyAsBool("accepted", false);
          Services.obs.notifyObservers(bag, "umbrafox-clipboard-action");
          ok(
            bag.getPropertyAsBool("accepted"),
            "Discard consumes the pending request"
          );
        }
      } finally {
        Services.obs.removeObserver(observer, "umbrafox-clipboard-canceled");
      }
    });
  });
});
