/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const MAX_RANGES = 16;
const MAX_STRING_LENGTH = 2048;

function truncate(value) {
  if (typeof value !== "string") {
    return value ?? null;
  }
  return value.length > MAX_STRING_LENGTH
    ? `${value.slice(0, MAX_STRING_LENGTH)}...`
    : value;
}

function safeRead(callback, fallback = null) {
  try {
    return callback();
  } catch {
    return fallback;
  }
}

function finiteNumber(value) {
  return Number.isFinite(value) ? value : null;
}

function readTimeRanges(ranges) {
  const values = [];
  const length = safeRead(() => ranges.length, 0);
  const count = Math.min(length, MAX_RANGES);

  for (let i = 0; i < count; i++) {
    values.push({
      start: finiteNumber(safeRead(() => ranges.start(i))),
      end: finiteNumber(safeRead(() => ranges.end(i))),
    });
  }

  return {
    length,
    ranges: values,
    truncated: length > count,
  };
}

function readMediaError(error) {
  if (!error) {
    return null;
  }

  return {
    code: error.code,
    message: truncate(error.message),
  };
}

function readPlaybackQuality(element) {
  if (typeof element.getVideoPlaybackQuality !== "function") {
    return null;
  }

  return safeRead(() => {
    const quality = element.getVideoPlaybackQuality();
    return {
      creationTime: finiteNumber(quality.creationTime),
      totalVideoFrames: quality.totalVideoFrames,
      droppedVideoFrames: quality.droppedVideoFrames,
      corruptedVideoFrames: quality.corruptedVideoFrames,
    };
  });
}

function readOptionalNumber(element, property) {
  if (!(property in element)) {
    return null;
  }
  return finiteNumber(safeRead(() => element[property]));
}

function readOptionalBoolean(element, property) {
  if (!(property in element)) {
    return null;
  }
  return !!safeRead(() => element[property], false);
}

function readMediaElement(element, index) {
  const rect = safeRead(() => element.getBoundingClientRect());
  return {
    index,
    type: element.localName,
    id: truncate(element.id),
    currentSrc: truncate(safeRead(() => element.currentSrc)),
    src: truncate(safeRead(() => element.getAttribute("src"))),
    readyState: element.readyState,
    networkState: element.networkState,
    paused: element.paused,
    ended: element.ended,
    seeking: element.seeking,
    muted: element.muted,
    defaultMuted: element.defaultMuted,
    volume: finiteNumber(element.volume),
    duration: finiteNumber(element.duration),
    currentTime: finiteNumber(element.currentTime),
    playbackRate: finiteNumber(element.playbackRate),
    defaultPlaybackRate: finiteNumber(element.defaultPlaybackRate),
    autoplay: element.autoplay,
    controls: element.controls,
    loop: element.loop,
    preload: element.preload,
    error: readMediaError(element.error),
    buffered: readTimeRanges(element.buffered),
    played: readTimeRanges(element.played),
    seekable: readTimeRanges(element.seekable),
    audioTracks: safeRead(() => element.audioTracks?.length, null),
    videoTracks: safeRead(() => element.videoTracks?.length, null),
    textTracks: safeRead(() => element.textTracks?.length, null),
    videoWidth: readOptionalNumber(element, "videoWidth"),
    videoHeight: readOptionalNumber(element, "videoHeight"),
    clientWidth: rect ? finiteNumber(rect.width) : null,
    clientHeight: rect ? finiteNumber(rect.height) : null,
    mozDecodedFrames: readOptionalNumber(element, "mozDecodedFrames"),
    mozPresentedFrames: readOptionalNumber(element, "mozPresentedFrames"),
    mozPaintedFrames: readOptionalNumber(element, "mozPaintedFrames"),
    mozFrameDelay: readOptionalNumber(element, "mozFrameDelay"),
    mozHasAudio: readOptionalBoolean(element, "mozHasAudio"),
    playbackQuality: readPlaybackQuality(element),
  };
}

function collectMediaSnapshot(window) {
  const document = window.document;
  const mediaElements = [...document.querySelectorAll("audio, video")].map(
    (element, index) => readMediaElement(element, index)
  );

  return {
    documentURI: truncate(document.documentURI),
    documentTitle: truncate(document.title),
    visibilityState: document.visibilityState,
    mediaElements,
  };
}

export class UmbrafoxControlDiagnosticsChild extends JSWindowActorChild {
  receiveMessage(message) {
    switch (message.name) {
      case "UmbrafoxControlDiagnostics:MediaSnapshot":
        return collectMediaSnapshot(this.contentWindow);
    }

    return null;
  }
}
