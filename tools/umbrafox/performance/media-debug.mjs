/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Serialized inside a one-shot privileged closure, not the page global.
export async function collectMediaDebug(target, expectedDocument) {
  if (target.windowGlobalChild?.innerWindowId !== expectedDocument) {
    throw new Error("Changed media document");
  }
  const videos = target.document.querySelectorAll("video");
  if (videos.length !== 1) {
    throw new Error("Expected exactly one video");
  }
  const video = videos[0];
  if (typeof video.mozRequestDebugInfo !== "function") {
    throw new Error("Native media diagnostics unavailable");
  }
  const info = await video.mozRequestDebugInfo();
  const current = target.document.querySelectorAll("video");
  if (
    target.windowGlobalChild?.innerWindowId !== expectedDocument ||
    current.length !== 1 ||
    current[0] !== video
  ) {
    throw new Error("Changed media document or element");
  }
  const reader = info?.decoder?.reader;
  const text = value => {
    if (value === undefined) {
      return null;
    }
    if (typeof value !== "string" || value.length > 512) {
      throw new Error("Invalid media debug string");
    }
    return value;
  };
  const number = value => (Number.isFinite(value) && value >= 0 ? value : null);
  return {
    document: expectedDocument,
    paused: video.paused,
    time: number(video.currentTime),
    decoder: text(reader?.videoDecoderName),
    codec: text(reader?.videoType),
    width: number(reader?.videoWidth),
    height: number(reader?.videoHeight),
    hardwareAccelerated:
      typeof reader?.videoHardwareAccelerated === "boolean"
        ? reader.videoHardwareAccelerated
        : null,
    outputSamples: number(reader?.videoNumSamplesOutputTotal),
    skippedSamples: number(reader?.videoNumSamplesSkippedTotal),
    droppedDecodedFrames: number(reader?.frameStats?.droppedDecodedFrames),
    droppedSinkFrames: number(reader?.frameStats?.droppedSinkFrames),
    droppedCompositorFrames: number(
      reader?.frameStats?.droppedCompositorFrames
    ),
    containerCompositorDrops: number(info?.compositorDroppedFrames),
  };
}

async function queryInBrowser(
  context,
  expectedDocument,
  replyName,
  childSource
) {
  const browser = window.gBrowser.browsers.find(
    item => item.browsingContext?.id === context
  );
  if (
    browser?.browsingContext.currentWindowGlobal?.innerWindowId !==
    expectedDocument
  ) {
    throw new Error("Changed media document");
  }
  const manager = browser.messageManager;
  if (!manager) {
    throw new Error("No frame message manager");
  }
  let timer;
  let listener;
  try {
    return await new Promise((resolve, reject) => {
      listener = message => {
        if (message.target !== browser) {
          return;
        }
        if (
          browser.browsingContext.currentWindowGlobal?.innerWindowId !==
          expectedDocument
        ) {
          reject(new Error("Changed media document"));
        } else if (message.data?.ok !== true) {
          reject(new Error("Native media query failed"));
        } else if (message.data.value?.document !== expectedDocument) {
          reject(new Error("Mismatched media document"));
        } else {
          resolve(message.data.value);
        }
      };
      manager.addMessageListener(replyName, listener);
      timer = setTimeout(
        () => reject(new Error("Native media query timed out")),
        4000
      );
      manager.loadFrameScript(
        `data:application/javascript,${encodeURIComponent(childSource)}`,
        false,
        true
      );
    });
  } finally {
    clearTimeout(timer);
    if (listener) {
      manager.removeMessageListener(replyName, listener);
    }
  }
}

export function mediaDebugRequest(context, documentID, nonce) {
  if (
    !Number.isSafeInteger(context) ||
    context <= 0 ||
    !Number.isSafeInteger(documentID) ||
    documentID <= 0 ||
    typeof nonce !== "string" ||
    !/^[a-zA-Z0-9-]{1,80}$/.test(nonce)
  ) {
    throw new Error("Invalid native media request identity");
  }
  const replyName = `UmbrafoxMediaRead:${nonce}`;
  const childSource = `(async () => {
    const { setTimeout, clearTimeout } = ChromeUtils.importESModule("resource://gre/modules/Timer.sys.mjs");
    let timer;
    try {
      const value = await Promise.race([
        (${collectMediaDebug.toString()})(content, ${documentID}),
        new Promise((resolve, reject) => {
          timer = setTimeout(() => reject(new Error("Timed out")), 3000);
        }),
      ]);
      sendAsyncMessage(${JSON.stringify(replyName)}, {ok: true, value});
    } catch {
      sendAsyncMessage(${JSON.stringify(replyName)}, {ok: false});
    } finally {
      clearTimeout(timer);
    }
  })()`;
  return {
    context,
    document: documentID,
    realm: "browser",
    timeoutMs: 6000,
    body: `return await (${queryInBrowser.toString()})(...arguments);`,
    args: [context, documentID, replyName, childSource],
  };
}
