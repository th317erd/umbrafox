/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Run only with the parent's isolated headless clipboard and test profile.
const NATIVE_CLIPBOARD_OLD = "clipboard override fixture OLD";
const NATIVE_CLIPBOARD_NEW = "clipboard override fixture NEW";
const NATIVE_CLIPBOARD_SELECTED = "clipboard override selected fixture";
const NATIVE_CLIPBOARD_REPLACEMENT = "clipboard override site replacement";
const { UmbrafoxClipboardProtection: NativeClipboardPermissions } =
  ChromeUtils.importESModule(
    "resource:///modules/UmbrafoxClipboardProtection.sys.mjs"
  );

async function writeNativeClipboardFixture(text) {
  Cc["@mozilla.org/widget/clipboardhelper;1"]
    .getService(Ci.nsIClipboardHelper)
    .copyString(text);
  await waitForNativeClipboardFixture(text);
}

async function waitForNativeClipboardFixture(text) {
  await TestUtils.waitForCondition(
    () => SpecialPowers.getClipboardData("text/plain") === text,
    "The isolated clipboard contains the fixture",
    50,
    100
  );
}

async function installNativeClipboardFixture(
  browser,
  operation,
  cancelAt,
  replacement = null
) {
  await SimpleTest.promiseFocus(browser);
  await SpecialPowers.spawn(
    browser,
    [operation, cancelAt, replacement, NATIVE_CLIPBOARD_SELECTED],
    async (fixtureOperation, cancellation, customCopy, selectedText) => {
      const script = content.document.createElement("script");
      script.textContent = `
        document.body.innerHTML = '<p id="copy-target" tabindex="0"></p><input id="paste-target">';
        const paragraph = document.getElementById('copy-target');
        const input = document.getElementById('paste-target');
        paragraph.textContent = ${JSON.stringify(selectedText)};
        window.clipboardOverrideFixture = {
          operation: ${JSON.stringify(fixtureOperation)},
          cancelAt: ${JSON.stringify(cancellation)},
          replacement: ${JSON.stringify(customCopy)},
          events: [],
          reset() {
            this.events.length = 0;
            input.value = '';
            if (this.operation === 'copy') {
              paragraph.focus();
              getSelection().selectAllChildren(paragraph);
            } else {
              input.focus();
              input.setSelectionRange(0, 0);
            }
          },
          snapshot() {
            return {
              value: input.value,
              events: this.events.slice(),
              activeElement: document.activeElement.id,
              selection: [input.selectionStart, input.selectionEnd],
            };
          },
        };
        for (const type of ['copy', 'paste', 'beforeinput', 'input']) {
          document.addEventListener(type, event => {
            const fixture = clipboardOverrideFixture;
            const data = event.clipboardData?.getData('text/plain') ??
              event.dataTransfer?.getData('text/plain') ?? event.data ?? null;
            const shouldCancel = type === fixture.cancelAt ||
              (fixture.cancelAt === 'paste-and-beforeinput' &&
                (type === 'paste' || type === 'beforeinput'));
            if (shouldCancel) {
              if (type === 'copy' && fixture.replacement !== null) {
                event.clipboardData.setData('text/plain', fixture.replacement);
              }
              event.preventDefault();
            }
            fixture.events.push({
              type, data, trusted: event.isTrusted,
              canceled: event.defaultPrevented, inputType: event.inputType ?? null,
            });
          });
        }
        if (clipboardOverrideFixture.operation === 'copy') {
          paragraph.focus();
          getSelection().selectAllChildren(paragraph);
        } else {
          input.focus();
          input.setSelectionRange(0, 0);
        }
      `;
      content.document.body.appendChild(script);
      await new Promise(resolve => content.requestAnimationFrame(resolve));
      await new Promise(resolve => content.requestAnimationFrame(resolve));
    }
  );
}

async function stageNativeClipboardCancellation(browser, operation) {
  return SpecialPowers.spawn(browser, [operation], async expectedOperation => {
    let resolveNotice;
    let rejectNotice;
    const notice = new Promise((resolve, reject) => {
      resolveNotice = resolve;
      rejectNotice = reject;
    });
    const observer = (subject, _topic, data) => {
      if (subject.windowGlobalChild !== content.windowGlobalChild) {
        return;
      }
      const request = JSON.parse(data);
      if (request.operation === expectedOperation) {
        resolveNotice({
          ...request,
          innerWindowId: String(content.windowGlobalChild.innerWindowId),
        });
      }
    };
    Services.obs.addObserver(observer, "umbrafox-clipboard-canceled");
    const timer = content.setTimeout(
      () =>
        rejectNotice(
          new Error("No native canceled clipboard notice within 5s")
        ),
      5000
    );
    try {
      content.docShell.doCommand(`cmd_${expectedOperation}`);
      return {
        request: await notice,
        snapshot: content.wrappedJSObject.clipboardOverrideFixture.snapshot(),
      };
    } finally {
      content.clearTimeout(timer);
      Services.obs.removeObserver(observer, "umbrafox-clipboard-canceled");
    }
  });
}

async function nativeClipboardAction(browser, request, action, overrides = {}) {
  return SpecialPowers.spawn(
    browser,
    [{ ...request, action, ...overrides }],
    fields => {
      const bag = Cc["@mozilla.org/hash-property-bag;1"].createInstance(
        Ci.nsIWritablePropertyBag2
      );
      for (const property of [
        "operation",
        "requestId",
        "action",
        "innerWindowId",
      ]) {
        bag.setPropertyAsACString(property, fields[property]);
      }
      bag.setPropertyAsBool("accepted", false);
      Services.obs.notifyObservers(bag, "umbrafox-clipboard-action");
      return {
        accepted: bag.getPropertyAsBool("accepted"),
        snapshot: content.wrappedJSObject.clipboardOverrideFixture.snapshot(),
      };
    }
  );
}

async function withNativeClipboardFixture(task) {
  await BrowserTestUtils.withNewTab("https://example.com/", async browser => {
    try {
      await writeNativeClipboardFixture(NATIVE_CLIPBOARD_OLD);
      await task(browser);
    } finally {
      const notice = PopupNotifications.getNotification(
        "umbrafox-clipboard-protection",
        browser
      );
      if (notice) {
        PopupNotifications.remove(notice);
      }
      await writeNativeClipboardFixture("");
    }
  });
}

async function observeActorNativeRetry(browser, operation, requestId = null) {
  await SpecialPowers.spawn(browser, [], () => {
    content.wrappedJSObject.clipboardOverrideFixture.retryObserverReady = false;
  });
  const completion = SpecialPowers.spawn(
    browser,
    [operation, requestId],
    async (expectedOperation, expectedRequest) => {
      let resolveRetry;
      let rejectRetry;
      const retry = new Promise((resolve, reject) => {
        resolveRetry = resolve;
        rejectRetry = reject;
      });
      const observer = subject => {
        const bag = subject.QueryInterface(Ci.nsIPropertyBag2);
        if (
          bag.getPropertyAsACString("action") !== "retry" ||
          bag.getPropertyAsACString("operation") !== expectedOperation ||
          bag.getPropertyAsACString("innerWindowId") !==
            String(content.windowGlobalChild.innerWindowId) ||
          (expectedRequest &&
            bag.getPropertyAsACString("requestId") !== expectedRequest)
        ) {
          return;
        }
        // Observe the native answer after all synchronous topic observers run.
        Services.tm.dispatchToMainThread(() => {
          try {
            resolveRetry({
              accepted: bag.getPropertyAsBool("accepted"),
              requestId: bag.getPropertyAsACString("requestId"),
              snapshot:
                content.wrappedJSObject.clipboardOverrideFixture.snapshot(),
            });
          } catch (error) {
            rejectRetry(error);
          }
        });
      };
      const timer = content.setTimeout(
        () => rejectRetry(new Error("No actor-owned native retry within 5s")),
        5000
      );
      Services.obs.addObserver(observer, "umbrafox-clipboard-action");
      content.wrappedJSObject.clipboardOverrideFixture.retryObserverReady = true;
      try {
        return await retry;
      } finally {
        content.clearTimeout(timer);
        Services.obs.removeObserver(observer, "umbrafox-clipboard-action");
        content.wrappedJSObject.clipboardOverrideFixture.retryObserverReady = false;
      }
    }
  );
  completion.catch(() => {});
  await SpecialPowers.spawn(browser, [], async () => {
    await ContentTaskUtils.waitForCondition(
      () => content.wrappedJSObject.clipboardOverrideFixture.retryObserverReady,
      "The read-only native retry observer is ready",
      50,
      100
    );
  });
  return { completion };
}

async function registeredNativeClipboardNotice(browser) {
  const owner = browser.documentGlobal;
  await TestUtils.waitForCondition(
    () =>
      owner.PopupNotifications.getNotification(
        "umbrafox-clipboard-protection",
        browser
      ),
    "The real registered actors deliver the native cancellation notice",
    50,
    100
  );
  const notification = owner.PopupNotifications.getNotification(
    "umbrafox-clipboard-protection",
    browser
  );
  Assert.ok(
    notification.dismissed,
    "Actor notice starts as an unopened indicator"
  );
  Assert.equal(owner.PopupNotifications.panel.state, "closed");
  return notification;
}

async function clickActorClipboardChoice(
  browser,
  notification,
  operation,
  choice,
  requestId
) {
  const owner = browser.documentGlobal;
  EventUtils.synthesizeMouseAtCenter(notification.anchorElement, {}, owner);
  await TestUtils.waitForCondition(
    () => owner.PopupNotifications.panel.state === "open",
    "Real anchor click opens the native cancellation notice",
    50,
    100
  );
  const popup = owner.document.getElementById(
    "umbrafox-clipboard-protection-notification"
  );
  await TestUtils.waitForCondition(
    () =>
      ChromeUtils.now() - notification.timeShown >=
      Services.prefs.getIntPref("security.notification_enable_delay"),
    "The real security delay elapses without preference changes",
    50,
    100
  );
  let button;
  if (choice === "always") {
    await popup.secondaryButton.updateComplete;
    EventUtils.synthesizeMouseAtCenter(
      popup.secondaryButton.chevronButtonEl,
      {},
      owner
    );
    await TestUtils.waitForCondition(
      () => popup.menupopup.state === "open",
      "Always menu opens",
      50,
      100
    );
    button = popup.menupopup.querySelector("menuitem");
  } else {
    button = choice === "yes" ? popup.button : popup.secondaryButton;
    await button.updateComplete;
  }
  const observed =
    choice === "no"
      ? null
      : await observeActorNativeRetry(browser, operation, requestId);
  if (choice === "always" && popup.menupopup.isNativeMenu) {
    popup.menupopup.activateItem(button);
  } else {
    EventUtils.synthesizeMouseAtCenter(button, {}, owner);
  }
  await TestUtils.waitForCondition(
    () => owner.PopupNotifications.panel.state === "closed",
    "Actual consent closes the notification",
    50,
    100
  );
  return observed ? observed.completion : null;
}

async function resetActorClipboardFixture(browser) {
  await SimpleTest.promiseFocus(browser);
  await SpecialPowers.spawn(browser, [], () => {
    content.wrappedJSObject.clipboardOverrideFixture.reset();
  });
}

async function assertActorClipboardResult(
  browser,
  operation,
  staged,
  result,
  text
) {
  Assert.ok(
    result.accepted,
    "The real actor/native retry accepts actual chrome consent"
  );
  Assert.equal(result.requestId, staged.request.requestId);
  const retried = result.snapshot.events.slice(staged.snapshot.events.length);
  Assert.deepEqual(
    retried.map(event => event.type),
    operation === "copy" ? ["copy"] : ["paste", "beforeinput", "input"],
    "Exactly one native retry follows the canceled command"
  );
  Assert.ok(retried.every(event => event.trusted));
  if (operation === "copy") {
    await waitForNativeClipboardFixture(NATIVE_CLIPBOARD_SELECTED);
  } else {
    Assert.equal(
      result.snapshot.value,
      text,
      "Actual native paste updates the input"
    );
  }
  Assert.ok(
    !browser.documentGlobal.PopupNotifications.getNotification(
      "umbrafox-clipboard-protection",
      browser
    )
  );
}

async function revokeActorClipboardGrant(browser, principal, operation) {
  const owner = browser.documentGlobal;
  const panel = owner.gPermissionPanel;
  EventUtils.synthesizeMouseAtCenter(panel._identityPermissionBox, {}, owner);
  await TestUtils.waitForCondition(
    () => panel._permissionPopup?.state === "open",
    "The standard permissions panel opens",
    50,
    100
  );
  const row = owner.document.querySelector(
    `.permission-popup-permission-item-umbrafox-clipboard-${operation}`
  );
  Assert.ok(row, "The actual native Always grant has a revocation row");
  EventUtils.synthesizeMouseAtCenter(
    row.querySelector(".permission-popup-permission-remove-button"),
    {},
    owner
  );
  await TestUtils.waitForCondition(
    () => !NativeClipboardPermissions.hasGrant(principal, operation),
    "The standard remove button revokes the native-backed grant",
    50,
    100
  );
  panel._permissionPopup.hidePopup();
  await TestUtils.waitForCondition(
    () => panel._permissionPopup.state === "closed",
    "The permissions panel closes",
    50,
    100
  );
}

add_task(async function test_real_actor_notice_and_yes_retry_copy_and_paste() {
  for (const operation of ["copy", "paste"]) {
    await withNativeClipboardFixture(async browser => {
      const principal = browser.contentPrincipal;
      try {
        Assert.ok(!NativeClipboardPermissions.hasGrant(principal, operation));
        await installNativeClipboardFixture(
          browser,
          operation,
          operation === "copy" ? "copy" : "paste-and-beforeinput"
        );
        const staged = await stageNativeClipboardCancellation(
          browser,
          operation
        );
        const notification = await registeredNativeClipboardNotice(browser);
        Assert.equal(staged.snapshot.value, "");
        await waitForNativeClipboardFixture(NATIVE_CLIPBOARD_OLD);
        const result = await clickActorClipboardChoice(
          browser,
          notification,
          operation,
          "yes",
          staged.request.requestId
        );
        await assertActorClipboardResult(
          browser,
          operation,
          staged,
          result,
          NATIVE_CLIPBOARD_OLD
        );
        Assert.ok(
          !NativeClipboardPermissions.hasGrant(principal, operation),
          "Actual Yes remains one-shot"
        );
      } finally {
        NativeClipboardPermissions.revoke(principal, operation);
      }
    });
  }
});

add_task(async function test_real_always_autoretry_and_standard_revocation() {
  for (const operation of ["copy", "paste"]) {
    await withNativeClipboardFixture(async browser => {
      const principal = browser.contentPrincipal;
      try {
        Assert.ok(!NativeClipboardPermissions.hasGrant(principal, operation));
        await installNativeClipboardFixture(browser, operation, operation);
        const first = await stageNativeClipboardCancellation(
          browser,
          operation
        );
        const notification = await registeredNativeClipboardNotice(browser);
        Assert.ok(
          !NativeClipboardPermissions.hasGrant(principal, operation),
          "No grant exists before actual Always consent"
        );
        const accepted = await clickActorClipboardChoice(
          browser,
          notification,
          operation,
          "always",
          first.request.requestId
        );
        await assertActorClipboardResult(
          browser,
          operation,
          first,
          accepted,
          NATIVE_CLIPBOARD_OLD
        );
        await TestUtils.waitForCondition(
          () => NativeClipboardPermissions.hasGrant(principal, operation),
          "Always is saved after the real accepted native retry",
          50,
          100
        );

        await writeNativeClipboardFixture(NATIVE_CLIPBOARD_NEW);
        await resetActorClipboardFixture(browser);
        const automatic = await observeActorNativeRetry(browser, operation);
        const second = await stageNativeClipboardCancellation(
          browser,
          operation
        );
        const retried = await automatic.completion;
        await assertActorClipboardResult(
          browser,
          operation,
          second,
          retried,
          NATIVE_CLIPBOARD_NEW
        );

        await revokeActorClipboardGrant(browser, principal, operation);
        await writeNativeClipboardFixture(NATIVE_CLIPBOARD_NEW);
        await resetActorClipboardFixture(browser);
        const revoked = await stageNativeClipboardCancellation(
          browser,
          operation
        );
        const defaultNotice = await registeredNativeClipboardNotice(browser);
        Assert.equal(
          revoked.snapshot.value,
          "",
          "Revocation restores canceled paste"
        );
        await waitForNativeClipboardFixture(NATIVE_CLIPBOARD_NEW);
        await clickActorClipboardChoice(
          browser,
          defaultNotice,
          operation,
          "no",
          revoked.request.requestId
        );
        const unchanged = await SpecialPowers.spawn(browser, [], () =>
          content.wrappedJSObject.clipboardOverrideFixture.snapshot()
        );
        Assert.deepEqual(
          unchanged.events,
          revoked.snapshot.events,
          "Revocation and No leave the normal canceled operation unchanged"
        );
        Assert.equal(unchanged.value, "");
        await waitForNativeClipboardFixture(NATIVE_CLIPBOARD_NEW);
      } finally {
        NativeClipboardPermissions.revoke(principal, operation);
      }
    });
  }
});

add_task(
  async function test_real_stale_always_never_saves_copy_or_paste_grants() {
    for (const operation of ["copy", "paste"]) {
      await withNativeClipboardFixture(async browser => {
        const principal = browser.contentPrincipal;
        try {
          await installNativeClipboardFixture(browser, operation, operation);
          const staged = await stageNativeClipboardCancellation(
            browser,
            operation
          );
          const notification = await registeredNativeClipboardNotice(browser);
          await writeNativeClipboardFixture(NATIVE_CLIPBOARD_NEW);
          const rejected = await clickActorClipboardChoice(
            browser,
            notification,
            operation,
            "always",
            staged.request.requestId
          );
          Assert.ok(
            !rejected.accepted,
            "Native freshness rejects real Always consent"
          );
          Assert.deepEqual(rejected.snapshot.events, staged.snapshot.events);
          Assert.equal(rejected.snapshot.value, "");
          await SpecialPowers.spawn(browser, [], () => true);
          await TestUtils.waitForTick();
          Assert.ok(
            !NativeClipboardPermissions.hasGrant(principal, operation),
            "Rejected native retry cannot save Always"
          );
          await waitForNativeClipboardFixture(NATIVE_CLIPBOARD_NEW);
          await TestUtils.waitForCondition(
            () =>
              document.getElementById("confirmation-hint")?.state === "open",
            "Real native failure produces post-consent feedback",
            50,
            100
          );
          const hint = document.getElementById("confirmation-hint");
          Assert.equal(
            hint.getAttribute("data-message-id"),
            `confirmation-hint-umbrafox-${operation}-not-retried`
          );
          Assert.ok(!hint.classList.contains("with-checkmark"));
          const reloaded = BrowserTestUtils.reloadTab(
            gBrowser.getTabForBrowser(browser)
          );
          await TestUtils.waitForCondition(
            () => hint.state === "closed",
            "Navigation removes the real failure hint",
            50,
            100
          );
          await reloaded;
          Assert.ok(!NativeClipboardPermissions.hasGrant(principal, operation));
        } finally {
          NativeClipboardPermissions.revoke(principal, operation);
        }
      });
    }
  }
);

add_task(
  async function test_existing_snapshot_xpidl_methods_and_private_helper_shape() {
    await withNativeClipboardFixture(async browser => {
      const snapshot = await SpecialPowers.spawn(browser, [], async () => {
        const clipboard = Cc["@mozilla.org/widget/clipboard;1"].getService(
          Ci.nsIClipboard
        );
        const request = clipboard.getDataSnapshotSync(
          ["text/plain"],
          Ci.nsIClipboard.kGlobalClipboard,
          content.browsingContext.currentWindowContext
        );
        const transferable = Cc[
          "@mozilla.org/widget/transferable;1"
        ].createInstance(Ci.nsITransferable);
        transferable.init(null);
        transferable.addDataFlavor("text/plain");
        const result = {
          valid: request.valid,
          flavors: request.flavorList,
          helperVisible:
            "isCurrentForClipboardOverride" in request ||
            "IsCurrentForClipboardOverride" in request,
        };
        request.getDataSync(transferable);
        const data = {};
        transferable.getTransferData("text/plain", data);
        result.syncText = data.value.QueryInterface(Ci.nsISupportsString).data;
        await new Promise((resolve, reject) => {
          const timer = content.setTimeout(
            () => reject(new Error("Snapshot getData callback timed out")),
            5000
          );
          request.getData(transferable, status => {
            content.clearTimeout(timer);
            if (Components.isSuccessCode(status)) {
              resolve();
            } else {
              reject(new Error(`Snapshot getData failed: ${status}`));
            }
          });
        });
        transferable.getTransferData("text/plain", data);
        result.asyncText = data.value.QueryInterface(Ci.nsISupportsString).data;
        result.stillValid = request.valid;
        return result;
      });
      Assert.ok(snapshot.valid, "Existing XPIDL valid getter still works");
      Assert.deepEqual(
        snapshot.flavors,
        ["text/plain"],
        "Existing flavorList getter still works"
      );
      Assert.equal(
        snapshot.syncText,
        NATIVE_CLIPBOARD_OLD,
        "Existing getDataSync slot still works"
      );
      Assert.equal(
        snapshot.asyncText,
        NATIVE_CLIPBOARD_OLD,
        "Existing getData slot still works"
      );
      Assert.ok(snapshot.stillValid);
      Assert.ok(
        !snapshot.helperVisible,
        "Native freshness helper is not exposed to JavaScript"
      );
    });
  }
);

add_task(async function test_native_copy_default_and_one_shot_retry() {
  for (const replacement of [null, NATIVE_CLIPBOARD_REPLACEMENT]) {
    await withNativeClipboardFixture(async browser => {
      await installNativeClipboardFixture(browser, "copy", "copy", replacement);
      const staged = await stageNativeClipboardCancellation(browser, "copy");
      Assert.equal(staged.snapshot.events.length, 1);
      Assert.ok(staged.snapshot.events[0].trusted);
      Assert.ok(staged.snapshot.events[0].canceled);
      await waitForNativeClipboardFixture(replacement ?? NATIVE_CLIPBOARD_OLD);
      const valid = await nativeClipboardAction(
        browser,
        staged.request,
        "validate"
      );
      Assert.ok(
        valid.accepted,
        "Custom copy replacement remains eligible for a notice"
      );
      Assert.deepEqual(
        valid.snapshot,
        staged.snapshot,
        "Validation does not replay"
      );
      const result = await nativeClipboardAction(
        browser,
        staged.request,
        "retry"
      );
      Assert.ok(
        result.accepted,
        "Explicit native retry overrides content cancellation"
      );
      await waitForNativeClipboardFixture(NATIVE_CLIPBOARD_SELECTED);
      Assert.deepEqual(
        result.snapshot.events.map(event => event.type),
        ["copy", "copy"]
      );
      const replay = await nativeClipboardAction(
        browser,
        staged.request,
        "retry"
      );
      Assert.ok(!replay.accepted, "Consumed native request cannot run twice");
      Assert.deepEqual(replay.snapshot, result.snapshot);
    });
  }
});

add_task(async function test_native_paste_and_beforeinput_default_and_retry() {
  for (const cancelAt of ["paste", "beforeinput", "paste-and-beforeinput"]) {
    await withNativeClipboardFixture(async browser => {
      await installNativeClipboardFixture(browser, "paste", cancelAt);
      const staged = await stageNativeClipboardCancellation(browser, "paste");
      Assert.equal(
        staged.snapshot.value,
        "",
        "Default content cancellation is respected"
      );
      Assert.ok(staged.snapshot.events.some(event => event.canceled));
      Assert.ok(staged.snapshot.events.every(event => event.trusted));
      const valid = await nativeClipboardAction(
        browser,
        staged.request,
        "validate"
      );
      Assert.ok(valid.accepted);
      Assert.deepEqual(valid.snapshot, staged.snapshot);
      const result = await nativeClipboardAction(
        browser,
        staged.request,
        "retry"
      );
      Assert.ok(result.accepted, `${cancelAt} retry succeeds`);
      Assert.equal(result.snapshot.value, NATIVE_CLIPBOARD_OLD);
      const retriedEvents = result.snapshot.events.slice(
        staged.snapshot.events.length
      );
      Assert.deepEqual(
        retriedEvents.map(event => event.type),
        ["paste", "beforeinput", "input"],
        "One native paste follows the normal event sequence"
      );
      Assert.equal(retriedEvents[1].inputType, "insertFromPaste");
      const replay = await nativeClipboardAction(
        browser,
        staged.request,
        "retry"
      );
      Assert.ok(!replay.accepted);
      Assert.deepEqual(replay.snapshot, result.snapshot);
    });
  }
});

add_task(
  async function test_stale_clipboard_rejects_paste_without_exposing_new_data() {
    for (const cancelAt of ["paste", "beforeinput"]) {
      await withNativeClipboardFixture(async browser => {
        await installNativeClipboardFixture(browser, "paste", cancelAt);
        const staged = await stageNativeClipboardCancellation(browser, "paste");
        Assert.equal(staged.snapshot.value, "");
        Assert.equal(staged.snapshot.events[0].data, NATIVE_CLIPBOARD_OLD);
        await writeNativeClipboardFixture(NATIVE_CLIPBOARD_NEW);
        const valid = await nativeClipboardAction(
          browser,
          staged.request,
          "validate"
        );
        Assert.ok(
          valid.accepted,
          "Clipboard changes do not suppress the cancellation notice"
        );
        const result = await nativeClipboardAction(
          browser,
          staged.request,
          "retry"
        );
        Assert.ok(
          !result.accepted,
          "Changing the native clipboard generation rejects retry"
        );
        Assert.equal(
          result.snapshot.value,
          "",
          "No fallback paste inserts NEW"
        );
        Assert.ok(
          result.snapshot.events.every(
            event => event.data !== NATIVE_CLIPBOARD_NEW
          ),
          "Neither paste nor beforeinput exposes NEW to page script"
        );
        Assert.deepEqual(
          result.snapshot.events,
          staged.snapshot.events,
          "Stale retry is rejected before dispatching any additional page event"
        );
        await waitForNativeClipboardFixture(NATIVE_CLIPBOARD_NEW);
        const replay = await nativeClipboardAction(
          browser,
          staged.request,
          "retry"
        );
        Assert.ok(!replay.accepted);
        Assert.deepEqual(replay.snapshot, result.snapshot);
      });
    }
  }
);

add_task(
  async function test_stale_clipboard_rejects_copy_before_page_dispatch() {
    await withNativeClipboardFixture(async browser => {
      await installNativeClipboardFixture(browser, "copy", "copy");
      const staged = await stageNativeClipboardCancellation(browser, "copy");
      await waitForNativeClipboardFixture(NATIVE_CLIPBOARD_OLD);
      await writeNativeClipboardFixture(NATIVE_CLIPBOARD_NEW);
      const valid = await nativeClipboardAction(
        browser,
        staged.request,
        "validate"
      );
      Assert.ok(
        valid.accepted,
        "The pending cancellation notice remains eligible"
      );
      const result = await nativeClipboardAction(
        browser,
        staged.request,
        "retry"
      );
      Assert.ok(
        !result.accepted,
        "Changed clipboard generation rejects copy retry"
      );
      Assert.deepEqual(
        result.snapshot,
        staged.snapshot,
        "Rejected copy dispatches no second event"
      );
      await waitForNativeClipboardFixture(NATIVE_CLIPBOARD_NEW);
      Assert.ok(
        !(await nativeClipboardAction(browser, staged.request, "retry"))
          .accepted
      );
    });
  }
);

add_task(async function test_native_window_operation_and_discard_are_exact() {
  await withNativeClipboardFixture(async browser => {
    await installNativeClipboardFixture(browser, "copy", "copy");
    const staged = await stageNativeClipboardCancellation(browser, "copy");
    for (const overrides of [
      { innerWindowId: "0" },
      { operation: "paste" },
      { requestId: `${staged.request.requestId}-wrong` },
    ]) {
      const rejected = await nativeClipboardAction(
        browser,
        staged.request,
        "retry",
        overrides
      );
      Assert.ok(
        !rejected.accepted,
        "Mismatched request identity cannot replay"
      );
      Assert.deepEqual(rejected.snapshot, staged.snapshot);
    }
    Assert.ok(
      (await nativeClipboardAction(browser, staged.request, "validate"))
        .accepted
    );
    Assert.ok(
      (await nativeClipboardAction(browser, staged.request, "discard")).accepted
    );
    const replay = await nativeClipboardAction(
      browser,
      staged.request,
      "retry"
    );
    Assert.ok(
      !replay.accepted,
      "Discard is final and never performs the command"
    );
    Assert.deepEqual(replay.snapshot, staged.snapshot);
    await waitForNativeClipboardFixture(NATIVE_CLIPBOARD_OLD);
  });
});
