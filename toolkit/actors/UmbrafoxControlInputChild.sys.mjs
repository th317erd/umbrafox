/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const lazy = {};

ChromeUtils.defineESModuleGetters(lazy, {
  event: "chrome://remote/content/shared/webdriver/Event.sys.mjs",
  keyData: "chrome://remote/content/shared/webdriver/KeyData.sys.mjs",
});

function getModifiers(data) {
  return {
    altKey: data.altKey ?? false,
    ctrlKey: data.ctrlKey ?? false,
    metaKey: data.metaKey ?? false,
    shiftKey: data.shiftKey ?? false,
  };
}

function getKeyData(data) {
  return { ...lazy.keyData.getData(data.key), ...getModifiers(data) };
}

function withNativeMicrotaskLevel(window, callback) {
  const windowUtils = window.windowUtils;
  const microTaskLevel = windowUtils.microTaskLevel;
  windowUtils.microTaskLevel = 0;
  try {
    return callback();
  } finally {
    windowUtils.microTaskLevel = microTaskLevel;
  }
}

export class UmbrafoxControlInputChild extends JSWindowActorChild {
  receiveMessage(message) {
    switch (message.name) {
      case "UmbrafoxControlInput:KeyDown":
        return this.#keyDown(message.data);
      case "UmbrafoxControlInput:KeyUp":
        return this.#keyUp(message.data);
      case "UmbrafoxControlInput:Type":
        return this.#type(message.data);
    }

    return null;
  }

  #keyDown(data) {
    const key = getKeyData(data);
    withNativeMicrotaskLevel(this.contentWindow, () =>
      lazy.event.sendKeyDown(key, this.contentWindow)
    );
    return {
      key: key.key,
      code: key.code,
      location: key.location,
    };
  }

  #keyUp(data) {
    const key = getKeyData(data);
    withNativeMicrotaskLevel(this.contentWindow, () =>
      lazy.event.sendKeyUp(key, this.contentWindow)
    );
    return {
      key: key.key,
      code: key.code,
      location: key.location,
    };
  }

  #type(data) {
    withNativeMicrotaskLevel(this.contentWindow, () =>
      lazy.event.sendKeys(data.text, this.contentWindow)
    );
    return {
      textLength: data.text.length,
    };
  }
}
