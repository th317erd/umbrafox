/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { clearTimeout, setTimeout } from "resource://gre/modules/Timer.sys.mjs";
import { AppConstants } from "resource://gre/modules/AppConstants.sys.mjs";

const lazy = {};
if (AppConstants.MOZ_BUILD_APP === "browser") {
  ChromeUtils.defineESModuleGetters(lazy, {
    UmbrafoxClipboardProtection:
      // eslint-disable-next-line mozilla/no-browser-refs-in-toolkit
      "resource:///modules/UmbrafoxClipboardProtection.sys.mjs",
  });
}

const REQUEST_TIMEOUT_MS = 30_000;

export class UmbrafoxClipboardParent extends JSWindowActorParent {
  #pending = null;
  #timer = null;

  async receiveMessage({ name, data }) {
    if (name === "UmbrafoxClipboard:Invalidated") {
      if (
        data?.requestId === this.#pending?.requestId &&
        data?.operation === this.#pending?.operation
      ) {
        this.#clear(this.#pending);
      }
      return;
    }
    if (
      name !== "UmbrafoxClipboard:Canceled" ||
      !["copy", "paste"].includes(data?.operation) ||
      typeof data.requestId !== "string" ||
      !/^[A-Za-z0-9_{}-]{1,128}$/.test(data.requestId)
    ) {
      return;
    }
    if (
      data.requestId === this.#pending?.requestId &&
      data.operation === this.#pending?.operation
    ) {
      return;
    }
    this.#clear(this.#pending);

    const manager = this.manager;
    const principal = manager.documentPrincipal;
    const browser = this.browsingContext.top.embedderElement;
    const pending = {
      operation: data.operation,
      requestId: data.requestId,
      manager,
      principal,
      browser,
      expires: Date.now() + REQUEST_TIMEOUT_MS,
      cancel: null,
      consumed: false,
    };
    this.#pending = pending;
    this.#timer = setTimeout(() => this.#clear(pending), REQUEST_TIMEOUT_MS);
    if (!(await this.#validate(pending))) {
      this.#clear(pending);
      return;
    }

    try {
      if (
        lazy.UmbrafoxClipboardProtection.hasGrant(
          principal,
          data.operation,
          browser
        )
      ) {
        await this.#retry(pending, data.requestId);
        return;
      }
      pending.cancel = lazy.UmbrafoxClipboardProtection.request({
        browser,
        principal,
        operation: pending.operation,
        requestId: pending.requestId,
        isValid: () => this.#validate(pending),
        onAllow: ({ requestId }) => this.#retry(pending, requestId),
        onCancel: ({ requestId }) => {
          if (requestId === pending.requestId) {
            this.#clear(pending);
          }
        },
      });
    } catch {
      this.#clear(pending);
    }
  }

  didDestroy() {
    this.#clear(this.#pending);
  }

  #current(pending) {
    return (
      this.#pending === pending &&
      !!pending &&
      Date.now() < pending.expires &&
      this.manager === pending.manager &&
      pending.manager.isCurrentGlobal &&
      pending.manager.isActiveInTab &&
      this.browsingContext.currentWindowGlobal === pending.manager &&
      this.browsingContext.top.embedderElement === pending.browser &&
      pending.principal.isContentPrincipal &&
      ["http", "https"].includes(pending.principal.URI?.scheme) &&
      pending.browser?.isConnected &&
      !!pending.browser.documentGlobal &&
      !pending.browser.documentGlobal.closed &&
      Services.focus.activeWindow === pending.browser.documentGlobal &&
      pending.browser.documentGlobal.gBrowser?.selectedBrowser ===
        pending.browser
    );
  }

  async #validate(pending) {
    if (pending.consumed || !this.#current(pending)) {
      return false;
    }
    try {
      const accepted = await this.sendQuery("UmbrafoxClipboard:Validate", {
        operation: pending.operation,
        requestId: pending.requestId,
      });
      return accepted === true && this.#current(pending);
    } catch {
      return false;
    }
  }

  async #retry(pending, requestId) {
    if (requestId !== pending.requestId || pending.consumed) {
      return false;
    }
    if (!this.#current(pending)) {
      this.#clear(pending);
      return false;
    }
    pending.consumed = true;
    try {
      const accepted =
        (await this.sendQuery("UmbrafoxClipboard:Retry", {
          operation: pending.operation,
          requestId: pending.requestId,
        })) === true && this.#current(pending);
      // A current UI request owns completion after onAllow settles, even false.
      this.#clear(pending, {
        discard: false,
        cancel: !this.#current(pending),
      });
      return accepted;
    } catch {
      this.#clear(pending, { cancel: !this.#current(pending) });
      return false;
    }
  }

  #clear(pending, { discard = true, cancel = true } = {}) {
    if (!pending || this.#pending !== pending) {
      return;
    }
    this.#pending = null;
    clearTimeout(this.#timer);
    this.#timer = null;
    if (cancel) {
      pending.cancel?.();
    }
    if (discard) {
      try {
        this.sendAsyncMessage("UmbrafoxClipboard:Discard", {
          operation: pending.operation,
          requestId: pending.requestId,
        });
      } catch {
        // The child also expires its request when IPC is already closed.
      }
    }
  }
}
