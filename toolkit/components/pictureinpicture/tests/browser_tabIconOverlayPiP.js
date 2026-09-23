/* Any copyright is dedicated to the Public Domain.
   http://creativecommons.org/publicdomain/zero/1.0/ */

"use strict";

async function toggleMuteFromTabContextMenu(tab, expectMuted) {
  let contextMenu = document.getElementById("tabContextMenu");
  let popupShownPromise = BrowserTestUtils.waitForEvent(
    contextMenu,
    "popupshown"
  );
  EventUtils.synthesizeMouseAtCenter(tab, { type: "contextmenu", button: 2 });
  await popupShownPromise;

  let toggleMute = document.getElementById("context_toggleMuteTab");
  ok(toggleMute, "Found the mute tab context menu item");
  ok(!toggleMute.hidden, "The mute tab context menu item is visible");
  ok(!toggleMute.disabled, "The mute tab context menu item is enabled");

  let popupHiddenPromise = BrowserTestUtils.waitForEvent(
    contextMenu,
    "popuphidden"
  );
  contextMenu.activateItem(toggleMute);
  await popupHiddenPromise;
  await BrowserTestUtils.waitForMutationCondition(
    tab,
    { attributes: true },
    () => tab.hasAttribute("muted") == expectMuted,
    { msg: `Waiting for tab muted state to become ${expectMuted}` }
  );
}

/**
 * The goal of this test is check the that "tab-icon-overlay" image is
 * showing when the tab is using PiP.
 *
 * The browser will create a tab and open a video using PiP
 * then the tests check that the tab icon overlay image is showing*
 *
 *
 */
add_task(async () => {
  let videoID = "with-controls";
  await BrowserTestUtils.withNewTab(
    {
      url: TEST_PAGE_WITH_SOUND,
      gBrowser,
    },
    async browser => {
      await ensureVideosReady(browser);

      // Need tab to access the tab-icon-overlay element
      let tab = gBrowser.getTabForBrowser(browser);

      await SpecialPowers.spawn(browser, [videoID], async videoID => {
        await content.document.getElementById(videoID).play();
      });

      // Check that video is playing
      ok(!(await isVideoPaused(browser, videoID)), "The video is not paused.");
      await TestUtils.waitForCondition(
        () => tab.hasAttribute("soundplaying"),
        "Waiting for soundplaying attribute"
      );

      // Use tab to get the tab-icon-overlay element
      let tabIconOverlay = tab.getElementsByClassName("tab-icon-overlay")[0];
      is(
        tab.getElementsByClassName("tab-audio-button").length,
        0,
        "The inline tab audio button is not created"
      );

      // Not in PiP yet so the tab-icon-overlay does not have "pictureinpicture" attribute
      ok(!tabIconOverlay.hasAttribute("pictureinpicture"), "Not using PiP");

      // Sound is playing so tab should have "soundplaying" attribute
      ok(tab.hasAttribute("soundplaying"), "Sound is playing");

      // Start the PiP
      let pipWin = await triggerPictureInPicture(browser, videoID);
      ok(pipWin, "Got Picture-in-Picture window.");

      // Check that video is still playing
      ok(!(await isVideoPaused(browser, videoID)), "The video is not paused.");

      // Video is still playing so the tab should have the "soundplaying" attribute.
      ok(tab.hasAttribute("soundplaying"), "Tab knows sound is playing");

      // Now in PiP. "pictureinpicture" is an attribute
      ok(
        tabIconOverlay.hasAttribute("pictureinpicture"),
        "Tab knows were using PiP"
      );

      // Check tab is not muted
      ok(!tab.hasAttribute("muted"), "Tab is not muted");

      // Use the tab context menu to mute tab and check it is muted
      await toggleMuteFromTabContextMenu(tab, true);
      ok(tab.hasAttribute("muted"), "Tab is muted");

      // Use the tab context menu to unmute tab and check it is not muted
      await toggleMuteFromTabContextMenu(tab, false);
      ok(!tab.hasAttribute("muted"), "Tab is not muted");
    }
  );
});
