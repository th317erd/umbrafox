/**
 * Global variables for testing.
 */
const gEMPTY_PAGE_URL = GetTestWebBasedURL("file_empty.html");

/**
 * Return a web-based URL for a given file based on the testing directory.
 *
 * @param {string} fileName
 *        file that caller wants its web-based url
 * @param {boolean} cors [optional]
 *        if set, then return a url with different origin
 */
function GetTestWebBasedURL(fileName, cors = false) {
  // eslint-disable-next-line sdl/no-insecure-url
  // eslint-disable-next-line sdl/no-insecure-url
  const origin = cors ? "http://example.org" : "http://example.com";
  return (
    getRootDirectory(gTestPath).replace("chrome://mochitests/content", origin) +
    fileName
  );
}

/**
 * Wait until tab sound indicator appears on the given tab.
 *
 * @param {tabbrowser} tab
 *        given tab where tab sound indicator should appear
 */
async function waitForTabSoundIndicatorAppears(tab) {
  if (!tab.soundPlaying) {
    info("Tab sound indicator doesn't appear yet");
    await BrowserTestUtils.waitForEvent(
      tab,
      "TabAttrModified",
      false,
      event => {
        return event.detail.changed.includes("soundplaying");
      }
    );
  }
  ok(tab.soundPlaying, "Tab sound indicator appears");
}

/**
 * Wait until tab sound indicator disappears on the given tab.
 *
 * @param {tabbrowser} tab
 *        given tab where tab sound indicator should disappear
 */
async function waitForTabSoundIndicatorDisappears(tab) {
  if (tab.soundPlaying) {
    info("Tab sound indicator doesn't disappear yet");
    await BrowserTestUtils.waitForEvent(
      tab,
      "TabAttrModified",
      false,
      event => {
        return event.detail.changed.includes("soundplaying");
      }
    );
  }
  ok(!tab.soundPlaying, "Tab sound indicator disappears");
}

/**
 * Return a new foreground tab loading with an empty file.
 *
 * @param {boolean} needObserver
 *        If true, sets an observer property on the returned tab. This property
 *        exposes `hasEverUpdated()` which will return a bool indicating if the
 *        sound indicator has ever updated.
 */
async function createBlankForegroundTab({ needObserver } = {}) {
  const tab = await BrowserTestUtils.openNewForegroundTab(
    gBrowser,
    gEMPTY_PAGE_URL
  );
  if (needObserver) {
    tab.observer = createSoundIndicatorObserver(tab);
  }
  return tab;
}

function createSoundIndicatorObserver(tab) {
  let hasEverUpdated = false;
  let listener = event => {
    if (event.detail.changed.includes("soundplaying")) {
      hasEverUpdated = true;
    }
  };
  tab.addEventListener("TabAttrModified", listener);
  return {
    hasEverUpdated: () => {
      tab.removeEventListener("TabAttrModified", listener);
      return hasEverUpdated;
    },
  };
}

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
  await TestUtils.waitForCondition(
    () => tab.linkedBrowser.audioMuted == expectMuted,
    `Waiting for tab audio muted state to become ${expectMuted}`
  );
}

/**
 * Create a media element in the given tab and point it at fileName. The element
 * is stored on the content window as `content.media` for playMedia/pauseMedia.
 */
function initMediaPlaybackDocument(
  tab,
  fileName,
  { preload, createVideo, muted = false, volume = 1.0 } = {}
) {
  return SpecialPowers.spawn(
    tab.linkedBrowser,
    [fileName, preload, createVideo, muted, volume],
    // eslint-disable-next-line no-shadow
    async (fileName, preload, createVideo, muted, volume) => {
      if (createVideo) {
        content.media = content.document.createElement("video");
      } else {
        content.media = content.document.createElement("audio");
      }
      if (preload) {
        content.media.preload = preload;
      }
      content.media.muted = muted;
      content.media.volume = volume;
      content.media.src = fileName;
    }
  );
}

function playMedia(tab, { resolveOnTimeupdate } = {}) {
  return SpecialPowers.spawn(
    tab.linkedBrowser,
    [resolveOnTimeupdate],
    // eslint-disable-next-line no-shadow
    async resolveOnTimeupdate => {
      await content.media.play();
      if (resolveOnTimeupdate) {
        await new Promise(r => (content.media.ontimeupdate = r));
      }
    }
  );
}

function pauseMedia(tab) {
  return SpecialPowers.spawn(tab.linkedBrowser, [], async _ => {
    content.media.pause();
  });
}
