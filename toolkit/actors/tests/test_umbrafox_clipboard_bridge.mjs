/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/ */

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const TOPIC = "umbrafox-clipboard-canceled";
const REQUEST = { operation: "paste", requestId: "native-request-1" };

async function fixture({ buildApp = "browser" } = {}) {
  const timers = new Map();
  const commands = [];
  const sent = [];
  const notices = [];
  let nextTimer = 0;
  let now = 0;
  let nativeValid = true;
  let nativeFresh = true;
  let nativeAccepted = true;
  let nativeThrows = false;
  let hasGrant = false;
  const contentDocument = {};
  const contentWindow = {
    document: contentDocument,
    addEventListener() {},
    removeEventListener() {},
  };
  const principal = {
    isContentPrincipal: true,
    origin: "https://frame.example^userContextId=7",
    URI: { scheme: "https" },
  };
  const browser = {
    isConnected: true,
    documentGlobal: { closed: false, gBrowser: {} },
  };
  browser.documentGlobal.gBrowser.selectedBrowser = browser;
  const browsingContext = { top: { embedderElement: browser } };
  const service = {
    hasGrant: () => hasGrant,
    request(options) {
      options.wasCanceled = false;
      options.actorCancelCount = 0;
      notices.push(options);
      return () => {
        options.wasCanceled = true;
        options.actorCancelCount++;
        options.onCancel({ requestId: options.requestId });
      };
    },
  };
  const context = vm.createContext({
    JSWindowActorChild: class {},
    JSWindowActorParent: class {},
    Services: {
      focus: { activeWindow: browser.documentGlobal },
      obs: {
        notifyObservers(request, topic) {
          assert.equal(topic, "umbrafox-clipboard-action");
          assert.equal(request.getPropertyAsBool("accepted"), false);
          assert.equal(request.getPropertyAsACString("innerWindowId"), "42");
          assert.equal(
            request.getPropertyAsACString("operation"),
            REQUEST.operation
          );
          const action = request.getPropertyAsACString("action");
          commands.push({ action, request });
          if (nativeThrows) {
            throw new Error("Native action unavailable");
          }
          if (nativeAccepted !== undefined) {
            request.setPropertyAsBool(
              "accepted",
              nativeValid &&
                nativeAccepted &&
                (action !== "retry" || nativeFresh)
            );
          }
        },
      },
    },
    Date: class extends Date {
      static now() {
        return now;
      }
    },
    ChromeUtils: {
      defineESModuleGetters(target) {
        target.UmbrafoxClipboardProtection = service;
      },
    },
    Ci: { nsIWritablePropertyBag2: {} },
    Cc: {
      "@mozilla.org/hash-property-bag;1": {
        createInstance() {
          const values = new Map();
          return {
            setPropertyAsACString: (key, value) => values.set(key, value),
            getPropertyAsACString: key => values.get(key),
            setPropertyAsBool: (key, value) => values.set(key, value),
            getPropertyAsBool(key) {
              if (!values.has(key)) {
                throw new Error("Missing native response");
              }
              return values.get(key);
            },
          };
        },
      },
    },
  });
  async function load(actorName) {
    const source = await readFile(
      new URL(`../${actorName}.sys.mjs`, import.meta.url),
      "utf8"
    );
    const module = new vm.SourceTextModule(source, { context });
    await module.link(specifier => {
      if (specifier === "resource://gre/modules/AppConstants.sys.mjs") {
        return new vm.SyntheticModule(
          ["AppConstants"],
          function () {
            this.setExport("AppConstants", { MOZ_BUILD_APP: buildApp });
          },
          { context }
        );
      }
      assert.equal(specifier, "resource://gre/modules/Timer.sys.mjs");
      return new vm.SyntheticModule(
        ["setTimeout", "clearTimeout"],
        function () {
          this.setExport("setTimeout", (callback, delay) => {
            const id = ++nextTimer;
            timers.set(id, { callback, delay });
            return id;
          });
          this.setExport("clearTimeout", id => timers.delete(id));
        },
        { context }
      );
    });
    await module.evaluate();
    return new module.namespace[actorName]();
  }
  const child = await load("UmbrafoxClipboardChild");
  const parentActor = await load("UmbrafoxClipboardParent");
  child.manager = { isCurrentGlobal: true, innerWindowId: 42 };
  contentWindow.windowGlobalChild = child.manager;
  child.document = contentDocument;
  child.contentWindow = contentWindow;
  child.sendAsyncMessage = (messageName, data) =>
    sent.push({ name: messageName, data });
  parentActor.manager = {
    isCurrentGlobal: true,
    isActiveInTab: true,
    documentPrincipal: principal,
    innerWindowId: 42,
  };
  parentActor.browsingContext = browsingContext;
  browsingContext.currentWindowGlobal = parentActor.manager;
  parentActor.sendQuery = async (messageName, data) =>
    child.receiveMessage({ name: messageName, data });
  parentActor.sendAsyncMessage = (messageName, data) =>
    child.receiveMessage({ name: messageName, data });
  async function notify(request = REQUEST, subject = contentWindow) {
    child.observe(subject, TOPIC, JSON.stringify(request));
    while (sent.length) {
      await parentActor.receiveMessage(sent.shift());
    }
  }
  return {
    child,
    parent: parentActor,
    window: contentWindow,
    document: contentDocument,
    principal,
    browser,
    commands,
    notices,
    sent,
    timers,
    context,
    service,
    notify,
    setNow: value => {
      now = value;
    },
    setNativeValid: value => {
      nativeValid = value;
    },
    setNativeFresh: value => {
      nativeFresh = value;
    },
    setNativeAccepted: value => {
      nativeAccepted = value;
    },
    setNativeThrows: value => {
      nativeThrows = value;
    },
    setHasGrant: value => {
      hasGrant = value;
    },
  };
}

test("rejects malformed and wrong-window native notifications", async () => {
  const f = await fixture();
  for (const data of [
    null,
    "",
    "{",
    "[]",
    "null",
    "{}",
    JSON.stringify({ ...REQUEST, operation: "cut" }),
    JSON.stringify({ ...REQUEST, requestId: "x".repeat(129) }),
  ]) {
    f.child.observe(f.window, TOPIC, data);
  }
  await f.notify(REQUEST, { document: f.document, windowGlobalChild: {} });
  assert.equal(f.notices.length, 0);
  assert.equal(f.commands.length, 0);
});

test("uses native token, exact inner window, and authoritative frame principal", async () => {
  const f = await fixture();
  await f.notify({
    ...REQUEST,
    principal: "https://attacker.example",
    text: "ignored",
  });
  assert.equal(f.notices.length, 1);
  assert.equal(f.notices[0].principal, f.principal);
  assert.equal(f.notices[0].browser, f.browser);
  assert.ok(f.commands.every(call => call.action === "validate"));
});

test("missing embedder document global fails closed", async () => {
  const f = await fixture();
  delete f.browser.documentGlobal;
  await f.notify();
  assert.equal(f.notices.length, 0);
});

test("Yes is one-shot even when called concurrently", async () => {
  const f = await fixture();
  await f.notify();
  const response = { requestId: REQUEST.requestId, remember: false };
  const results = await Promise.all([
    f.notices[0].onAllow(response),
    f.notices[0].onAllow(response),
  ]);
  assert.equal(results.filter(Boolean).length, 1);
  assert.equal(f.commands.filter(call => call.action === "retry").length, 1);
  assert.equal(
    await f.child.receiveMessage({
      name: "UmbrafoxClipboard:Retry",
      data: REQUEST,
    }),
    false
  );
});

test("No and actor destruction discard without retry", async () => {
  for (const destroy of [false, true]) {
    const f = await fixture();
    await f.notify();
    if (destroy) {
      f.parent.didDestroy();
      f.child.didDestroy();
    } else {
      f.notices[0].onCancel({ requestId: REQUEST.requestId });
    }
    assert.equal(
      await f.notices[0].onAllow({ requestId: REQUEST.requestId }),
      false
    );
    assert.equal(f.commands.filter(call => call.action === "retry").length, 0);
  }
});

test("expiry, navigation, background tab, and inactive frame fail closed", async () => {
  for (const invalidate of [
    f => f.setNow(30001),
    f => {
      f.parent.manager.isCurrentGlobal = false;
    },
    f => {
      f.child.manager.isCurrentGlobal = false;
    },
    f => {
      f.browser.documentGlobal.gBrowser.selectedBrowser = {};
    },
    f => {
      f.parent.manager.isActiveInTab = false;
    },
  ]) {
    const f = await fixture();
    await f.notify();
    invalidate(f);
    assert.equal(
      await f.notices[0].onAllow({ requestId: REQUEST.requestId }),
      false
    );
    assert.equal(f.commands.filter(call => call.action === "retry").length, 0);
  }
});

test("changed native target or missing native acceptance never succeeds", async () => {
  for (const invalidate of [
    f => f.setNativeValid(false),
    f => f.setNativeAccepted(undefined),
    f => f.setNativeThrows(true),
  ]) {
    const f = await fixture();
    await f.notify();
    invalidate(f);
    assert.equal(
      await f.notices[0].onAllow({ requestId: REQUEST.requestId }),
      false
    );
  }
});

test("request identity mismatch cannot validate, retry or clear another request", async () => {
  const f = await fixture();
  await f.notify();
  for (const messageName of ["Validate", "Retry", "Discard"]) {
    assert.equal(
      await f.child.receiveMessage({
        name: `UmbrafoxClipboard:${messageName}`,
        data: { ...REQUEST, requestId: "wrong-request" },
      }),
      false
    );
  }
  assert.equal(
    await f.notices[0].onAllow({ requestId: REQUEST.requestId }),
    true
  );
});

test("pagehide invalidates pending state without document clipboard listeners", async () => {
  const f = await fixture();
  await f.notify();
  f.child.handleEvent({
    type: "pagehide",
    target: f.document,
    isTrusted: true,
  });
  assert.equal(
    await f.notices[0].onAllow({ requestId: REQUEST.requestId }),
    false
  );
  assert.equal(f.commands.filter(call => call.action === "retry").length, 0);
});

test("saved explicit grant retries with no new prompt", async () => {
  const f = await fixture();
  f.setHasGrant(true);
  await f.notify();
  assert.equal(f.notices.length, 0);
  assert.equal(f.commands.filter(call => call.action === "retry").length, 1);
});

test("custom replacement still offers notice when native replay is stale", async () => {
  const f = await fixture();
  f.setNativeFresh(false);
  await f.notify();
  assert.equal(f.notices.length, 1);
  assert.equal(await f.notices[0].isValid(), true);
  assert.equal(
    await f.notices[0].onAllow({ requestId: REQUEST.requestId }),
    false
  );
  assert.equal(f.notices[0].wasCanceled, false);
});

test("current retry failure reaches UI completion without premature cancellation", async () => {
  for (const fail of [
    f => f.setNativeFresh(false),
    f => f.setNativeAccepted(undefined),
    f => f.setNativeThrows(true),
    f => {
      f.parent.sendQuery = async () => {
        throw new Error("Retry IPC rejected");
      };
    },
  ]) {
    const f = await fixture();
    await f.notify();
    fail(f);
    const notice = f.notices[0];
    const delivered = [];
    const accepted = await notice.onAllow({ requestId: REQUEST.requestId });
    if (!notice.wasCanceled) {
      delivered.push(accepted);
      notice.onCancel({ requestId: REQUEST.requestId });
    }
    assert.deepEqual(
      delivered,
      [false],
      "UI can handle strict false before settling itself"
    );
    assert.equal(notice.actorCancelCount, 0);
    assert.equal(f.timers.size, 0, "Both actor timers are released");
    assert.equal(await notice.isValid(), false);
    const commands = f.commands.length;
    notice.onCancel({ requestId: REQUEST.requestId });
    f.parent.didDestroy();
    assert.equal(
      notice.actorCancelCount,
      0,
      "Completion does not cancel the UI twice"
    );
    assert.equal(
      f.commands.length,
      commands,
      "Completion sends no duplicate discard"
    );
    assert.equal(await notice.onAllow({ requestId: REQUEST.requestId }), false);
  }
});

test("lost frame during retry still cancels UI even without didDestroy", async () => {
  for (const nativeAccepted of [true, false, "reject"]) {
    const f = await fixture();
    await f.notify();
    const query = f.parent.sendQuery;
    let resolve;
    f.parent.sendQuery = async (messageName, data) => {
      await new Promise(done => {
        resolve = done;
      });
      if (nativeAccepted === "reject") {
        throw new Error("Frame IPC closed");
      }
      return query(messageName, data);
    };
    const retried = f.notices[0].onAllow({ requestId: REQUEST.requestId });
    f.parent.manager.isCurrentGlobal = false;
    f.setNativeFresh(nativeAccepted);
    resolve();
    assert.equal(await retried, false);
    assert.equal(f.notices[0].actorCancelCount, 1);
    assert.equal(f.timers.size, 0);
    f.parent.didDestroy();
    assert.equal(f.notices[0].actorCancelCount, 1);
  }
});

test("saved-grant retry failure releases actors without creating UI", async () => {
  const f = await fixture();
  f.setHasGrant(true);
  f.setNativeFresh(false);
  await f.notify();
  assert.equal(f.notices.length, 0);
  assert.equal(f.timers.size, 0);
  assert.equal(f.commands.filter(call => call.action === "retry").length, 1);
});

test("in-flight retry expiry or replacement cancels only its own UI once", async () => {
  for (const replace of [false, true]) {
    const f = await fixture();
    await f.notify();
    const query = f.parent.sendQuery;
    let resolve;
    f.parent.sendQuery = async (messageName, data) => {
      if (
        messageName === "UmbrafoxClipboard:Retry" &&
        data.requestId === REQUEST.requestId
      ) {
        await new Promise(done => {
          resolve = done;
        });
      }
      return query(messageName, data);
    };
    const retried = f.notices[0].onAllow({ requestId: REQUEST.requestId });
    if (replace) {
      await f.notify({ ...REQUEST, requestId: "replacement-request" });
    } else {
      f.setNow(30001);
      for (const { callback } of Array.from(f.timers.values())) {
        callback();
      }
    }
    assert.equal(f.notices[0].actorCancelCount, 1);
    resolve();
    assert.equal(await retried, false);
    assert.equal(f.notices[0].actorCancelCount, 1);
    if (replace) {
      assert.equal(f.notices[1].actorCancelCount, 0);
      assert.equal(await f.notices[1].isValid(), true);
    }
    f.parent.didDestroy();
    f.child.didDestroy();
    assert.equal(f.timers.size, 0);
    assert.equal(f.notices[0].actorCancelCount, 1);
  }
});

test("UI cancellation ownership survives asynchronous successful retry", async () => {
  const f = await fixture();
  await f.notify();
  let resolve;
  f.parent.sendQuery = () =>
    new Promise(done => {
      resolve = done;
    });
  const pending = f.notices[0].onAllow({ requestId: REQUEST.requestId });
  assert.equal(f.notices[0].wasCanceled, false);
  assert.equal(
    await f.notices[0].onAllow({ requestId: REQUEST.requestId }),
    false
  );
  assert.equal(f.notices[0].wasCanceled, false);
  resolve(true);
  assert.equal(await pending, true);
  assert.equal(f.notices[0].wasCanceled, false);
});

test("navigation while retry is in flight prevents successful grant result", async () => {
  const f = await fixture();
  await f.notify();
  let resolve;
  f.parent.sendQuery = () =>
    new Promise(done => {
      resolve = done;
    });
  const pending = f.notices[0].onAllow({ requestId: REQUEST.requestId });
  f.parent.manager.isCurrentGlobal = false;
  f.parent.didDestroy();
  resolve(true);
  assert.equal(await pending, false);
  assert.equal(f.notices[0].wasCanceled, true);
});

test("timer expiry clears both actors and notice", async () => {
  const f = await fixture();
  await f.notify();
  const callbacks = Array.from(f.timers.values());
  for (const { callback, delay } of callbacks) {
    assert.equal(delay, 30000);
    callback();
  }
  assert.equal(
    await f.notices[0].onAllow({ requestId: REQUEST.requestId }),
    false
  );
  assert.equal(f.timers.size, 0);
  assert.equal(f.commands.filter(call => call.action === "retry").length, 0);
});

test("new native request invalidates old notice without accepting old callback", async () => {
  const f = await fixture();
  await f.notify();
  const request = { ...REQUEST, requestId: "native-request-2" };
  await f.notify(request);
  assert.equal(f.notices.length, 2);
  assert.equal(f.notices[0].wasCanceled, true);
  assert.equal(
    await f.notices[0].onAllow({ requestId: REQUEST.requestId }),
    false
  );
  assert.equal(
    await f.notices[1].onAllow({ requestId: request.requestId }),
    true
  );
  assert.equal(f.commands.filter(call => call.action === "retry").length, 1);
});

test("malformed parent messages and mismatched callbacks leave active request intact", async () => {
  const f = await fixture();
  await f.notify();
  await f.parent.receiveMessage({
    name: "UmbrafoxClipboard:Canceled",
    data: null,
  });
  await f.parent.receiveMessage({
    name: "UmbrafoxClipboard:Invalidated",
    data: { ...REQUEST, requestId: "wrong" },
  });
  assert.equal(await f.notices[0].onAllow({ requestId: "wrong" }), false);
  assert.equal(
    await f.notices[0].onAllow({ requestId: REQUEST.requestId }),
    true
  );
});

test("inactive owner window blocks saved-grant retry", async () => {
  const f = await fixture();
  f.setHasGrant(true);
  f.context.Services.focus.activeWindow = {};
  await f.notify();
  assert.equal(f.notices.length, 0);
  assert.equal(f.commands.filter(call => call.action === "retry").length, 0);
});

test("actor IPC and UI failures release pending state without retry", async () => {
  for (const fail of [
    f => {
      f.parent.sendQuery = async () => {
        throw new Error("IPC closed");
      };
    },
    f => {
      f.service.request = () => {
        throw new Error("UI unavailable");
      };
    },
  ]) {
    const f = await fixture();
    fail(f);
    await f.notify();
    assert.equal(f.timers.size, 0);
    assert.equal(f.commands.filter(call => call.action === "retry").length, 0);
  }
});

test("toolkit applications without browser UI fail closed", async () => {
  const f = await fixture({ buildApp: "mobile/android" });
  await f.notify();
  assert.equal(f.notices.length, 0);
  assert.equal(f.timers.size, 0);
  assert.equal(f.commands.filter(call => call.action === "retry").length, 0);
});

test("untrusted lifecycle event cannot invalidate native pending state", async () => {
  const f = await fixture();
  await f.notify();
  f.child.handleEvent({
    type: "pagehide",
    target: f.document,
    isTrusted: false,
  });
  assert.equal(
    await f.notices[0].onAllow({ requestId: REQUEST.requestId }),
    true
  );
});

test("missing native observer or property-bag factory never offers a notice", async () => {
  for (const unavailable of [
    f => f.setNativeAccepted(undefined),
    f => {
      f.context.Services.obs.notifyObservers = () => {};
    },
    f => {
      delete f.context.Cc["@mozilla.org/hash-property-bag;1"];
    },
  ]) {
    const f = await fixture();
    unavailable(f);
    await f.notify();
    assert.equal(f.notices.length, 0);
    assert.equal(f.timers.size, 0);
    assert.equal(f.commands.filter(call => call.action === "retry").length, 0);
  }
});

test("non-web principals cannot produce browser permission notices", async () => {
  for (const principalChange of [
    principal => {
      principal.isContentPrincipal = false;
    },
    principal => {
      principal.URI.scheme = "file";
    },
    principal => {
      principal.URI.scheme = "moz-extension";
    },
  ]) {
    const f = await fixture();
    principalChange(f.principal);
    await f.notify();
    assert.equal(f.notices.length, 0);
    assert.equal(f.commands.filter(call => call.action === "retry").length, 0);
  }
});
