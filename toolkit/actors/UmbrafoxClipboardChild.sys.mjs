/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { clearTimeout, setTimeout } from "resource://gre/modules/Timer.sys.mjs";

const REQUEST_TIMEOUT_MS = 30_000;

export class UmbrafoxClipboardChild extends JSWindowActorChild {
  #pending = null;
  #timer = null;

  observe(subject, topic, data) {
    if (
      topic !== "umbrafox-clipboard-canceled" ||
      typeof data !== "string" ||
      data.length > 512 ||
      subject?.windowGlobalChild !== this.manager ||
      subject.document !== this.document ||
      !this.manager.isCurrentGlobal
    ) {
      return;
    }

    let candidate;
    try {
      candidate = JSON.parse(data);
    } catch {
      return;
    }
    if (
      !["copy", "paste"].includes(candidate?.operation) ||
      typeof candidate.requestId !== "string" ||
      !/^[A-Za-z0-9_{}-]{1,128}$/.test(candidate.requestId)
    ) {
      return;
    }
    if (this.#matches(candidate)) {
      return;
    }

    this.#clear();
    const pending = {
      operation: candidate.operation,
      requestId: candidate.requestId,
      document: this.document,
      window: this.contentWindow,
      expires: Date.now() + REQUEST_TIMEOUT_MS,
    };
    if (!this.#command("validate", pending)) {
      return;
    }
    this.#pending = pending;
    pending.window.addEventListener("pagehide", this, {
      capture: true,
      mozSystemGroup: true,
    });
    this.#timer = setTimeout(() => this.#clear(), REQUEST_TIMEOUT_MS);
    this.sendAsyncMessage("UmbrafoxClipboard:Canceled", {
      operation: pending.operation,
      requestId: pending.requestId,
    });
  }

  receiveMessage({ name, data }) {
    if (
      ![
        "UmbrafoxClipboard:Validate",
        "UmbrafoxClipboard:Retry",
        "UmbrafoxClipboard:Discard",
      ].includes(name) ||
      !this.#matches(data)
    ) {
      return false;
    }
    if (name === "UmbrafoxClipboard:Discard") {
      this.#clear();
      return true;
    }

    const pending = this.#pending;
    if (
      Date.now() >= pending.expires ||
      !this.manager.isCurrentGlobal ||
      this.document !== pending.document ||
      this.contentWindow !== pending.window ||
      pending.window.document !== pending.document
    ) {
      this.#clear();
      return false;
    }
    if (name === "UmbrafoxClipboard:Validate") {
      const accepted = this.#command("validate", pending);
      if (!accepted) {
        this.#clear();
      }
      return accepted;
    }

    this.#clear(false);
    return this.#command("retry", pending);
  }

  handleEvent(event) {
    if (
      event.type === "pagehide" &&
      event.isTrusted &&
      event.target === this.#pending?.document
    ) {
      this.#clear();
    }
  }

  didDestroy() {
    this.#clear();
  }

  #matches(data) {
    return (
      !!this.#pending &&
      data?.requestId === this.#pending.requestId &&
      data?.operation === this.#pending.operation
    );
  }

  #command(action, pending) {
    try {
      const request = Cc["@mozilla.org/hash-property-bag;1"].createInstance(
        Ci.nsIWritablePropertyBag2
      );
      request.setPropertyAsACString("requestId", pending.requestId);
      request.setPropertyAsACString("operation", pending.operation);
      request.setPropertyAsACString("action", action);
      request.setPropertyAsACString(
        "innerWindowId",
        String(this.manager.innerWindowId)
      );
      request.setPropertyAsBool("accepted", false);
      Services.obs.notifyObservers(request, "umbrafox-clipboard-action");
      return request.getPropertyAsBool("accepted") === true;
    } catch {
      return false;
    }
  }

  #clear(discard = true) {
    const pending = this.#pending;
    this.#pending = null;
    clearTimeout(this.#timer);
    this.#timer = null;
    if (!pending) {
      return;
    }
    pending.window.removeEventListener("pagehide", this, {
      capture: true,
      mozSystemGroup: true,
    });
    if (discard) {
      this.#command("discard", pending);
      try {
        this.sendAsyncMessage("UmbrafoxClipboard:Invalidated", {
          operation: pending.operation,
          requestId: pending.requestId,
        });
      } catch {
        // Actor destruction can close IPC before pending state is released.
      }
    }
  }
}
