const PAGE =
  "https://example.com/browser/toolkit/content/tests/browser/file_silentAudioTrack.html";

async function click_unblock_icon(tab) {
  let contextMenu = document.getElementById("tabContextMenu");
  let popupShownPromise = BrowserTestUtils.waitForEvent(
    contextMenu,
    "popupshown"
  );
  EventUtils.synthesizeMouseAtCenter(tab, { type: "contextmenu", button: 2 });
  await popupShownPromise;

  let playTab = document.getElementById("context_playTab");
  ok(playTab, "Found the Play Tab context menu item");
  ok(!playTab.hidden, "The Play Tab context menu item is visible");
  ok(!playTab.disabled, "The Play Tab context menu item is enabled");

  let popupHiddenPromise = BrowserTestUtils.waitForEvent(
    contextMenu,
    "popuphidden"
  );
  contextMenu.activateItem(playTab);
  await popupHiddenPromise;
}

add_task(async function setup_test_preference() {
  await SpecialPowers.pushPrefEnv({
    set: [
      ["media.useAudioChannelService.testing", true],
      ["media.block-autoplay-until-in-foreground", true],
    ],
  });
});

add_task(async function unblock_icon_should_disapear_after_resume_tab() {
  info("- open new background tab -");
  let tab = BrowserTestUtils.addTab(window.gBrowser, "about:blank");
  BrowserTestUtils.startLoadingURIString(tab.linkedBrowser, PAGE);
  await BrowserTestUtils.browserLoaded(tab.linkedBrowser);

  info("- tab should display unblocking icon -");
  await waitForTabBlockEvent(tab, true);

  info("- select tab as foreground tab -");
  await BrowserTestUtils.switchTab(window.gBrowser, tab);

  info("- should not display unblocking icon -");
  await waitForTabBlockEvent(tab, false);

  info("- should not display sound indicator icon -");
  await waitForTabPlayingEvent(tab, false);

  info("- remove tab -");
  BrowserTestUtils.removeTab(tab);
});

add_task(async function should_not_show_sound_indicator_after_resume_tab() {
  info("- open new background tab -");
  let tab = BrowserTestUtils.addTab(window.gBrowser, "about:blank");
  BrowserTestUtils.startLoadingURIString(tab.linkedBrowser, PAGE);
  await BrowserTestUtils.browserLoaded(tab.linkedBrowser);

  info("- tab should display unblocking icon -");
  await waitForTabBlockEvent(tab, true);

  info("- use the Play Tab context menu item -");
  await click_unblock_icon(tab);

  info("- should not display unblocking icon -");
  await waitForTabBlockEvent(tab, false);

  info("- should not display sound indicator icon -");
  await waitForTabPlayingEvent(tab, false);

  info("- remove tab -");
  BrowserTestUtils.removeTab(tab);
});
