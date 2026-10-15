/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/ */

"use strict";

const { CustomKeys } = ChromeUtils.importESModule(
  "moz-src:///browser/components/customkeys/CustomKeys.sys.mjs"
);
const { PromptTestUtils } = ChromeUtils.importESModule(
  "resource://testing-common/PromptTestUtils.sys.mjs"
);
const { sinon } = ChromeUtils.importESModule(
  "resource://testing-common/Sinon.sys.mjs"
);

registerCleanupFunction(async () => {
  CustomKeys.resetAll();
  await Services.fog.testFlushAllChildren();
  Services.fog.testResetFOG();
});

add_task(async function testPresetDispatchAndReset() {
  CustomKeys.resetAll();
  if (!isLinux) {
    Assert.deepEqual(await CustomKeys.applyChromePreset(window), {
      applied: false,
      reason: "unsupported",
    });
    return;
  }
  const ids = [
    "key_openDownloads",
    "key_search2",
    "key_privatebrowsing",
    "key_undoCloseWindow",
    "key_selectLastTab",
  ];
  for (let i = 1; i <= 8; i++) {
    ids.push(`key_selectTab${i}`);
  }
  const attributes = id =>
    Object.fromEntries(
      Array.from(document.getElementById(id).attributes, attr => [
        attr.name,
        attr.value,
      ])
    );
  const original = Object.fromEntries(ids.map(id => [id, attributes(id)]));
  is(original.key_openDownloads.key, "Y", "Firefox Downloads default");
  is(original.key_privatebrowsing.key, "P", "Firefox private window default");

  await BrowserTestUtils.withNewTab(
    "data:text/html,<input autofocus>",
    async browser => {
      await SpecialPowers.spawn(browser, [], () => {
        content.wrappedJSObject.seenPrivateChord = 0;
        content.addEventListener("keydown", event => {
          if (
            event.ctrlKey &&
            event.shiftKey &&
            event.key.toLowerCase() == "n"
          ) {
            content.wrappedJSObject.seenPrivateChord++;
            event.preventDefault();
          }
        });
      });
      EventUtils.synthesizeKey("n", { accelKey: true, shiftKey: true });
      await SpecialPowers.spawn(browser, [], async () => {
        await ContentTaskUtils.waitForCondition(
          () => content.wrappedJSObject.seenPrivateChord == 1
        );
        ok(
          true,
          "Default Firefox unreserved chord reaches the page and can be cancelled"
        );
      });
      Assert.deepEqual(await CustomKeys.applyChromePreset(window), {
        applied: true,
      });
      Assert.deepEqual(await CustomKeys.applyChromePreset(window), {
        applied: true,
      });
      is(document.getElementById("key_search2").getAttribute("key"), "E");
      ok(!document.getElementById("key_undoCloseWindow").hasAttribute("key"));
      await TestUtils.waitForCondition(async () => {
        try {
          const saved = await IOUtils.readJSON(
            PathUtils.join(PathUtils.profileDir, "customKeys.json")
          );
          return (
            saved.key_openDownloads?.key == "J" &&
            saved.key_privatebrowsing?.key == "N"
          );
        } catch {
          return false;
        }
      }, "Preset reaches the existing profile-local JSON store");
      const downloads = sinon.stub(BrowserCommands, "downloadsUI");
      try {
        EventUtils.synthesizeKey("j", { accelKey: true });
        await TestUtils.waitForCondition(
          () => downloads.calledOnce,
          "Ctrl+J dispatches Downloads once"
        );
        EventUtils.synthesizeKey("e", { accelKey: true });
        await TestUtils.waitForCondition(
          () => gURLBar.focused,
          "Ctrl+E focuses search"
        );
      } finally {
        downloads.restore();
      }

      const tabs = [];
      try {
        for (let i = 0; i < 9; i++) {
          tabs.push(BrowserTestUtils.addTab(gBrowser, "about:blank"));
        }
        for (let i = 1; i <= 9; i++) {
          gURLBar.focus();
          EventUtils.synthesizeKey(String(i), { accelKey: true });
          is(
            gBrowser.selectedTab,
            i == 9 ? gBrowser.visibleTabs.at(-1) : gBrowser.visibleTabs[i - 1],
            `Ctrl+${i} selects expected tab`
          );
        }
      } finally {
        tabs.forEach(tab => BrowserTestUtils.removeTab(tab));
      }

      gBrowser.selectedTab = gBrowser.getTabForBrowser(browser);
      browser.focus();
      await SpecialPowers.spawn(browser, [], () =>
        content.document.querySelector("input").focus()
      );
      const opened = BrowserTestUtils.waitForNewWindow();
      EventUtils.synthesizeKey("n", { accelKey: true, shiftKey: true });
      const privateWindow = await opened;
      try {
        ok(
          PrivateBrowsingUtils.isWindowPrivate(privateWindow),
          "Ctrl+Shift+N opens private window"
        );
        await TestUtils.waitForCondition(
          () =>
            privateWindow.document
              .getElementById("key_search2")
              .getAttribute("key") == "E",
          "New private window inherits preset"
        );
        CustomKeys.resetAll();
        is(
          privateWindow.document
            .getElementById("key_privatebrowsing")
            .getAttribute("key"),
          "P",
          "Reset reaches private window"
        );
      } finally {
        await BrowserTestUtils.closeWindow(privateWindow);
      }
      await SpecialPowers.spawn(browser, [], () => {
        is(
          content.wrappedJSObject.seenPrivateChord,
          1,
          "Explicit preset reserves the private-window chord instead of delivering it to the page"
        );
      });
    }
  );
  await document.l10n.translateElements(
    ids.map(id => document.getElementById(id))
  );
  for (const id of ids) {
    Assert.deepEqual(
      attributes(id),
      original[id],
      `${id} restores all attributes including reservation`
    );
  }
});

add_task(async function testPresetConflicts() {
  if (!isLinux) {
    return;
  }
  CustomKeys.changeKey("key_gotoHistory", { key: "J", modifiers: "control" });
  const result = await CustomKeys.applyChromePreset(window);
  is(result.applied, false);
  is(result.keyID, "key_gotoHistory");
  is(
    document.getElementById("key_openDownloads").getAttribute("key"),
    "Y",
    "No partial changes"
  );
  CustomKeys.resetAll();
});

add_task(async function testPresetUI() {
  await BrowserTestUtils.withNewTab("about:keyboard", async browser => {
    await SpecialPowers.spawn(browser, [isLinux], async supported => {
      await ContentTaskUtils.waitForCondition(() =>
        content.document.getElementById("resetAll")
      );
      await ContentTaskUtils.waitForCondition(
        () =>
          content.document.getElementById("table").querySelectorAll(".key")
            .length > 50
      );
      await ContentTaskUtils.waitForCondition(
        () =>
          content.document.getElementById("chromePreset").hidden == !supported
      );
    });
    if (!isLinux) {
      return;
    }
    for (const accept of [false, true]) {
      const prompt = PromptTestUtils.handleNextPrompt(
        window,
        { modalType: Services.prompt.MODAL_TYPE_CONTENT },
        { buttonNumClick: accept ? 0 : 1 }
      );
      await SpecialPowers.spawn(browser, [], () =>
        content.document.getElementById("chromePreset").click()
      );
      await prompt;
      await SpecialPowers.spawn(browser, [accept], async applied => {
        await ContentTaskUtils.waitForCondition(
          () => !content.document.getElementById("chromePreset").disabled
        );
        const row = content.document.querySelector(
          '.key[data-id="key_openDownloads"]'
        );
        is(
          row.classList.contains("customized"),
          applied,
          "Confirmation controls application"
        );
        is(
          row.querySelector(".currentShortcut").wrappedJSObject.value,
          applied ? "Ctrl+J" : "Ctrl+Shift+Y"
        );
      });
    }
  });
  CustomKeys.resetAll();
});
