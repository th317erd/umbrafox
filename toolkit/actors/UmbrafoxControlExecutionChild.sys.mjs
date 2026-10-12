/* This Source Code Form is subject to the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { executeControlScript } from "resource://gre/modules/UmbrafoxControlScript.sys.mjs";

export class UmbrafoxControlExecutionChild extends JSWindowActorChild {
  #operations = new Map();

  async receiveMessage({ name, data }) {
    if (name === "Cancel") {
      this.#operations.get(data.id)?.abort();
      return null;
    }
    if (name !== "Execute" || data.realm !== "page") {
      return {
        error: { code: "invalid argument", message: "Expected page execution" },
      };
    }
    const controller = new AbortController();
    this.#operations.set(data.id, controller);
    try {
      if (data.document !== this.manager.innerWindowId) {
        return {
          error: {
            code: "stale document",
            message: "Document changed before execution",
          },
        };
      }
      return {
        result: await executeControlScript(
          this.contentWindow,
          data,
          controller.signal
        ),
      };
    } catch (error) {
      return {
        error: {
          code: error.code ?? "javascript error",
          message: String(error.message).slice(0, 4096),
        },
      };
    } finally {
      this.#operations.delete(data.id);
    }
  }

  didDestroy() {
    for (const controller of this.#operations.values()) {
      controller.abort();
    }
    this.#operations.clear();
  }
}
