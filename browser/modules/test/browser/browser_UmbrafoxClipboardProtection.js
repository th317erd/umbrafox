/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/ */

"use strict";

const { UmbrafoxClipboardProtection } = ChromeUtils.importESModule(
  "resource:///modules/UmbrafoxClipboardProtection.sys.mjs"
);

let clipboardUIRequestSequence = 0;

async function waitForClipboardUI(condition, message) {
  await TestUtils.waitForCondition(condition, message, 50, 100);
}

async function showClipboardNotice(browser, options = {}) {
  const owner = browser.documentGlobal;
  const state = { allowed: [], canceled: 0 };
  state.cancel = UmbrafoxClipboardProtection.request({
    browser,
    principal: options.principal ?? browser.contentPrincipal,
    operation: options.operation ?? "copy",
    requestId: `clipboard-ui-${++clipboardUIRequestSequence}`,
    isValid: async () => true,
    onAllow: async result => {
      state.allowed.push(result);
      return options.result ? options.result() : true;
    },
    onCancel: () => state.canceled++,
  });
  registerCleanupFunction(state.cancel);
  await waitForClipboardUI(
    () =>
      owner.PopupNotifications.getNotification(
        "umbrafox-clipboard-protection",
        browser
      ),
    "Clipboard indicator is registered"
  );
  state.notification = owner.PopupNotifications.getNotification(
    "umbrafox-clipboard-protection",
    browser
  );
  Assert.ok(state.notification);
  Assert.ok(state.notification.dismissed, "The notice starts dismissed");
  Assert.equal(
    owner.PopupNotifications.panel.state,
    "closed",
    "No popup opens without an explicit anchor click"
  );
  Assert.equal(state.allowed.length, 0, "Showing an indicator is not consent");
  if (options.open === false) {
    return state;
  }
  EventUtils.synthesizeMouseAtCenter(
    state.notification.anchorElement,
    {},
    owner
  );
  await waitForClipboardUI(
    () => owner.PopupNotifications.panel.state === "open",
    "Explicit anchor click opens the clipboard notice"
  );
  state.popup = owner.document.getElementById(
    "umbrafox-clipboard-protection-notification"
  );
  Assert.ok(state.popup);
  Assert.equal(state.allowed.length, 0, "Showing is not consent");
  return state;
}

async function clickClipboardChoice(browser, state, choice) {
  const owner = browser.documentGlobal;
  await waitForClipboardUI(
    () =>
      ChromeUtils.now() - state.notification.timeShown >=
      Services.prefs.getIntPref("security.notification_enable_delay"),
    "The actual notification security delay has elapsed"
  );
  if (choice === "always") {
    await state.popup.secondaryButton.updateComplete;
    EventUtils.synthesizeMouseAtCenter(
      state.popup.secondaryButton.chevronButtonEl,
      {},
      owner
    );
    await waitForClipboardUI(
      () => state.popup.menupopup.state === "open",
      "Always menu opens through its chevron button"
    );
    const item = state.popup.menupopup.querySelector("menuitem");
    Assert.ok(item, "Always has a real menu item");
    if (state.popup.menupopup.isNativeMenu) {
      state.popup.menupopup.activateItem(item);
    } else {
      EventUtils.synthesizeMouseAtCenter(item, {}, owner);
    }
  } else {
    const button =
      choice === "yes" ? state.popup.button : state.popup.secondaryButton;
    await button.updateComplete;
    EventUtils.synthesizeMouseAtCenter(button, {}, owner);
  }
  await waitForClipboardUI(
    () => owner.PopupNotifications.panel.state === "closed",
    "The real action removes the notification"
  );
}

async function installClipboardPageProbe(browser) {
  return SpecialPowers.spawn(browser, [], async () => {
    const script = content.document.createElement("script");
    script.textContent = `
      document.body.innerHTML = '<textarea id="clipboard-focus-target">fixture</textarea>';
      const target = document.getElementById('clipboard-focus-target');
      target.focus();
      target.setSelectionRange(1, 3);
      window.clipboardUIProbe = {
        events: [],
        snapshot() {
          return {
            hasFocus: document.hasFocus(),
            activeElement: document.activeElement.id,
            selection: [target.selectionStart, target.selectionEnd, target.selectionDirection],
            viewport: [innerWidth, innerHeight, visualViewport.width, visualViewport.height,
              visualViewport.scale, visualViewport.offsetLeft, visualViewport.offsetTop],
            visibility: document.visibilityState,
            events: this.events.slice(),
          };
        },
      };
      for (const type of ['focus', 'blur', 'focusin', 'focusout', 'resize',
        'visibilitychange', 'selectionchange', 'copy', 'paste', 'beforeinput', 'input',
        'keydown', 'keypress', 'keyup', 'pointerlockchange', 'pointerlockerror',
        'fullscreenchange', 'fullscreenerror']) {
        addEventListener(type, event => clipboardUIProbe.events.push({
          type: event.type, target: event.target.id || event.target.nodeName || 'window',
          trusted: event.isTrusted, canceled: event.defaultPrevented, key: event.key || '',
        }), true);
      }
      visualViewport.addEventListener('resize', () => clipboardUIProbe.events.push({type: 'visual-resize'}));
      visualViewport.addEventListener('scroll', () => clipboardUIProbe.events.push({type: 'visual-scroll'}));
    `;
    content.document.body.appendChild(script);
    await new Promise(resolve => content.requestAnimationFrame(resolve));
    await new Promise(resolve => content.requestAnimationFrame(resolve));
    content.wrappedJSObject.clipboardUIProbe.events.length = 0;
    return content.wrappedJSObject.clipboardUIProbe.snapshot();
  });
}

async function clipboardPageSnapshot(browser) {
  return SpecialPowers.spawn(browser, [], async () => {
    await new Promise(resolve => content.requestAnimationFrame(resolve));
    await new Promise(resolve => content.requestAnimationFrame(resolve));
    return content.wrappedJSObject.clipboardUIProbe.snapshot();
  });
}

async function addClipboardFrame(browser) {
  const frameID = await SpecialPowers.spawn(browser, [], async () => {
    const frame = content.document.createElement("iframe");
    const loaded = new Promise(resolve =>
      frame.addEventListener("load", resolve, { once: true })
    );
    frame.src = "https://example.org/";
    content.document.body.appendChild(frame);
    await loaded;
    return frame.browsingContext.id;
  });
  return BrowsingContext.get(frameID).currentWindowGlobal.documentPrincipal;
}

async function requestClipboardPointerLock(browser) {
  await SpecialPowers.spawn(browser, [], () => {
    content.wrappedJSObject.clipboardLockProbe.result = null;
    content.wrappedJSObject.clipboardLockProbe.events.length = 0;
  });
  await BrowserTestUtils.synthesizeMouseAtCenter("#lock-target", {}, browser);
  return SpecialPowers.spawn(browser, [], async () => {
    await ContentTaskUtils.waitForCondition(
      () => content.wrappedJSObject.clipboardLockProbe.result !== null,
      "Pointer lock request settles",
      50,
      100
    );
    return {
      result: content.wrappedJSObject.clipboardLockProbe.result,
      locked: content.document.pointerLockElement?.id,
    };
  });
}

async function exitClipboardPointerLock(browser) {
  await SpecialPowers.spawn(browser, [], async () => {
    if (content.document.pointerLockElement) {
      content.document.exitPointerLock();
      await ContentTaskUtils.waitForCondition(
        () =>
          !content.document.pointerLockElement &&
          content.wrappedJSObject.clipboardLockProbe.events.includes(
            "unlocked"
          ),
        "Pointer lock exits and delivers its content event",
        50,
        100
      );
    }
  });
}

async function revokeClipboardThroughPanel(browser, principal, operation) {
  const owner = browser.documentGlobal;
  const panel = owner.gPermissionPanel;
  EventUtils.synthesizeMouseAtCenter(panel._identityPermissionBox, {}, owner);
  await waitForClipboardUI(
    () => panel._permissionPopup.state === "open",
    "Standard site permissions panel opens"
  );
  try {
    const row = owner.document.querySelector(
      `.permission-popup-permission-item-umbrafox-clipboard-${operation}`
    );
    Assert.ok(row, "Saved override has a standard permission row");
    Assert.ok(
      row
        .querySelector(".permission-popup-permission-label")
        .textContent.includes(principal.originNoSuffix),
      "The row attributes the requesting origin"
    );
    EventUtils.synthesizeMouseAtCenter(
      row.querySelector(".permission-popup-permission-remove-button"),
      {},
      owner
    );
    await waitForClipboardUI(
      () => !UmbrafoxClipboardProtection.hasGrant(principal, operation),
      "The standard remove button revokes the original requesting principal"
    );
  } finally {
    panel._permissionPopup.hidePopup();
    await waitForClipboardUI(
      () => panel._permissionPopup.state === "closed",
      "Permissions panel closes"
    );
  }
}

add_task(
  async function test_unopened_indicator_and_removal_preserve_page_trace() {
    await BrowserTestUtils.withNewTab("https://example.com", async browser => {
      await SimpleTest.promiseFocus(browser);
      const before = await installClipboardPageProbe(browser);
      Assert.ok(before.hasFocus, "Fixture starts focused");
      const focusedElement = Services.focus.focusedElement;
      const state = await showClipboardNotice(browser, { open: false });
      try {
        Assert.equal(
          PopupNotifications.panel.getAttribute("noautofocus"),
          "true"
        );
        Assert.equal(Services.focus.focusedElement, focusedElement);
        Assert.deepEqual(
          await clipboardPageSnapshot(browser),
          before,
          "Before consent, focus, selection, viewport and content events are unchanged"
        );
        state.cancel();
        await waitForClipboardUI(
          () => state.canceled === 1,
          "Removal cleans up"
        );
        Assert.deepEqual(
          await clipboardPageSnapshot(browser),
          before,
          "Unopened removal does not create page events or viewport changes"
        );
        Assert.equal(state.allowed.length, 0);
        Assert.ok(
          !UmbrafoxClipboardProtection.hasGrant(
            browser.contentPrincipal,
            "copy"
          )
        );
        state.cancel();
        Assert.equal(state.canceled, 1);
      } finally {
        state.cancel();
      }
    });
  }
);

add_task(async function test_unopened_indicator_preserves_content_keys() {
  await BrowserTestUtils.withNewTab("https://example.com", async browser => {
    await SimpleTest.promiseFocus(browser);
    await installClipboardPageProbe(browser);
    EventUtils.synthesizeKey("a");
    EventUtils.synthesizeKey("KEY_Escape");
    const baseline = await clipboardPageSnapshot(browser);
    Assert.ok(baseline.events.some(event => event.type === "keypress"));
    Assert.ok(
      baseline.events.some(
        event => event.type === "keyup" && event.key === "Escape"
      )
    );
    await SpecialPowers.spawn(browser, [], async () => {
      const target = content.document.getElementById("clipboard-focus-target");
      target.value = "fixture";
      target.setSelectionRange(1, 3);
      await new Promise(resolve => content.requestAnimationFrame(resolve));
      await new Promise(resolve => content.requestAnimationFrame(resolve));
      content.wrappedJSObject.clipboardUIProbe.events.length = 0;
    });
    const state = await showClipboardNotice(browser, { open: false });
    try {
      EventUtils.synthesizeKey("a");
      EventUtils.synthesizeKey("KEY_Escape");
      Assert.deepEqual(
        await clipboardPageSnapshot(browser),
        baseline,
        "Printable keys and Escape retain the baseline content event trace"
      );
      Assert.equal(PopupNotifications.panel.state, "closed");
      Assert.equal(
        state.canceled,
        0,
        "Content Escape does not dismiss the indicator"
      );
      Assert.equal(state.allowed.length, 0);
    } finally {
      state.cancel();
    }
  });
});

add_task(
  async function test_unopened_indicator_removal_does_not_refocus_content() {
    await BrowserTestUtils.withNewTab("https://example.com", async browser => {
      await SimpleTest.promiseFocus(browser);
      const state = await showClipboardNotice(browser, { open: false });
      gURLBar.focus();
      const focused = Services.focus.focusedElement;
      state.cancel();
      await TestUtils.waitForTick();
      Assert.equal(
        Services.focus.focusedElement,
        focused,
        "Removing an unopened indicator does not refocus the browser"
      );
      Assert.equal(state.allowed.length, 0);
      Assert.equal(state.canceled, 1);
    });
  }
);

add_task(
  async function test_explicitly_opened_notice_can_be_dismissed_without_allow() {
    await BrowserTestUtils.withNewTab("https://example.com", async browser => {
      await SimpleTest.promiseFocus(browser);
      const state = await showClipboardNotice(browser);
      PopupNotifications.panel.hidePopup();
      await waitForClipboardUI(
        () => state.canceled === 1,
        "Dismissal cleans up"
      );
      Assert.equal(state.allowed.length, 0);
      Assert.ok(
        !UmbrafoxClipboardProtection.hasGrant(browser.contentPrincipal, "copy")
      );
      state.cancel();
      Assert.equal(state.canceled, 1);
    });
  }
);

add_task(
  async function test_unopened_indicator_does_not_prevent_or_release_pointer_lock() {
    await BrowserTestUtils.withNewTab("https://example.com", async browser => {
      await SimpleTest.promiseFocus(browser);
      await SpecialPowers.spawn(browser, [], () => {
        const script = content.document.createElement("script");
        script.textContent = `
        document.body.innerHTML = '<button id="lock-target">Lock fixture</button>';
        window.clipboardLockProbe = { result: null, events: [] };
        document.addEventListener('pointerlockchange', () =>
          clipboardLockProbe.events.push(document.pointerLockElement ? 'locked' : 'unlocked'));
        document.addEventListener('pointerlockerror', () => clipboardLockProbe.events.push('error'));
        document.getElementById('lock-target').addEventListener('click', async event => {
          try {
            await event.currentTarget.requestPointerLock();
            clipboardLockProbe.result = 'locked';
          } catch (error) {
            clipboardLockProbe.result = error.name;
          }
        });
      `;
        content.document.body.appendChild(script);
      });
      let state;
      try {
        const baseline = await requestClipboardPointerLock(browser);
        Assert.deepEqual(
          baseline,
          { result: "locked", locked: "lock-target" },
          "The true page can acquire pointer lock before any indicator exists"
        );
        await exitClipboardPointerLock(browser);
        state = await showClipboardNotice(browser, { open: false });
        const locked = await requestClipboardPointerLock(browser);
        Assert.deepEqual(
          locked,
          baseline,
          "The same page request remains eligible with an unopened indicator"
        );
        Assert.equal(
          locked.result,
          "locked",
          "An unopened indicator permits a later pointer-lock request"
        );
        Assert.equal(locked.locked, "lock-target");
        state.cancel();
        state = await showClipboardNotice(browser, { open: false });
        const after = await SpecialPowers.spawn(browser, [], async () => {
          await new Promise(resolve => content.requestAnimationFrame(resolve));
          await new Promise(resolve => content.requestAnimationFrame(resolve));
          return {
            locked: content.document.pointerLockElement?.id,
            events: content.wrappedJSObject.clipboardLockProbe.events.slice(),
          };
        });
        Assert.equal(
          after.locked,
          "lock-target",
          "A new indicator preserves an existing pointer lock"
        );
        Assert.deepEqual(after.events, ["locked"]);
        Assert.equal(PopupNotifications.panel.state, "closed");
      } finally {
        state?.cancel();
        await exitClipboardPointerLock(browser);
      }
    });
  }
);

add_task(async function test_no_button_never_allows_or_remembers() {
  await BrowserTestUtils.withNewTab("https://example.com", async browser => {
    await SimpleTest.promiseFocus(browser);
    const state = await showClipboardNotice(browser);
    await clickClipboardChoice(browser, state, "no");
    Assert.equal(state.allowed.length, 0);
    Assert.equal(state.canceled, 1);
    Assert.ok(
      !UmbrafoxClipboardProtection.hasGrant(browser.contentPrincipal, "copy")
    );
    state.cancel();
    Assert.equal(state.canceled, 1);
  });
});

add_task(async function test_yes_button_keeps_async_retry_alive_once() {
  await BrowserTestUtils.withNewTab("https://example.com", async browser => {
    await SimpleTest.promiseFocus(browser);
    let resolveRetry;
    const retry = new Promise(resolve => {
      resolveRetry = resolve;
    });
    const state = await showClipboardNotice(browser, { result: () => retry });
    await clickClipboardChoice(browser, state, "yes");
    await waitForClipboardUI(
      () => state.allowed.length === 1,
      "Yes invokes one retry"
    );
    Assert.equal(state.allowed[0].remember, false);
    Assert.equal(
      state.canceled,
      0,
      "Automatic popup removal does not cancel the retry"
    );
    Assert.ok(
      !UmbrafoxClipboardProtection.hasGrant(browser.contentPrincipal, "copy")
    );
    resolveRetry(true);
    await TestUtils.waitForTick();
    state.cancel();
    Assert.equal(state.canceled, 0, "Successful callback settled the request");
    Assert.equal(state.allowed.length, 1);
  });
});

add_task(
  async function test_always_waits_for_success_and_rejects_native_failure() {
    await BrowserTestUtils.withNewTab("https://example.com", async browser => {
      const principal = browser.contentPrincipal;
      for (const success of [false, true]) {
        await SimpleTest.promiseFocus(browser);
        let resolveRetry;
        const retry = new Promise(resolve => {
          resolveRetry = resolve;
        });
        const state = await showClipboardNotice(browser, {
          result: () => retry,
        });
        try {
          await clickClipboardChoice(browser, state, "always");
          await waitForClipboardUI(
            () => state.allowed.length === 1,
            "Always invokes one retry"
          );
          Assert.equal(state.allowed[0].remember, true);
          Assert.equal(state.canceled, 0);
          Assert.ok(
            !UmbrafoxClipboardProtection.hasGrant(principal, "copy"),
            "Always is not saved before native success"
          );
          resolveRetry(success);
          await waitForClipboardUI(
            () =>
              success
                ? UmbrafoxClipboardProtection.hasGrant(principal, "copy")
                : state.canceled === 1,
            "Native result settles without a premature grant"
          );
          Assert.equal(
            UmbrafoxClipboardProtection.hasGrant(principal, "copy"),
            success
          );
          Assert.ok(!UmbrafoxClipboardProtection.hasGrant(principal, "paste"));
          if (success) {
            await revokeClipboardThroughPanel(browser, principal, "copy");
          } else {
            await waitForClipboardUI(
              () =>
                document.getElementById("confirmation-hint")?.state === "open",
              "Explicit failed Always shows neutral retry feedback"
            );
            const hint = document.getElementById("confirmation-hint");
            Assert.equal(
              hint.getAttribute("data-message-id"),
              "confirmation-hint-umbrafox-copy-not-retried"
            );
            Assert.ok(!hint.classList.contains("with-checkmark"));
            await waitForClipboardUI(
              () => hint.state === "closed",
              "Failure feedback closes automatically"
            );
            Assert.equal(state.allowed.length, 1, "Feedback never retries");
            Assert.ok(!UmbrafoxClipboardProtection.hasGrant(principal, "copy"));
          }
        } finally {
          resolveRetry(false);
          state.cancel();
          UmbrafoxClipboardProtection.revoke(principal, "copy");
        }
      }
    });
  }
);

add_task(
  async function test_cross_origin_frame_grant_uses_its_own_revoke_row() {
    await BrowserTestUtils.withNewTab("https://example.com", async browser => {
      const principal = await addClipboardFrame(browser);
      await SimpleTest.promiseFocus(browser);
      const state = await showClipboardNotice(browser, {
        principal,
        operation: "paste",
      });
      try {
        await clickClipboardChoice(browser, state, "always");
        await waitForClipboardUI(
          () => UmbrafoxClipboardProtection.hasGrant(principal, "paste"),
          "Frame grant is saved"
        );
        Assert.ok(
          !UmbrafoxClipboardProtection.hasGrant(
            browser.contentPrincipal,
            "paste"
          )
        );
        Assert.ok(!UmbrafoxClipboardProtection.hasGrant(principal, "copy"));
        await BrowserTestUtils.reloadTab(gBrowser.getTabForBrowser(browser));
        const reloadedPrincipal = await addClipboardFrame(browser);
        Assert.equal(reloadedPrincipal.origin, principal.origin);
        const permissionBox = browser.documentGlobal.document.getElementById(
          "identity-permission-box"
        );
        await waitForClipboardUI(
          () =>
            permissionBox.hasAttribute("hasPermissions") &&
            BrowserTestUtils.isVisible(permissionBox),
          "The late frame grant makes the standard permission icon visible without a clipboard attempt"
        );
        const { SitePermissions } = ChromeUtils.importESModule(
          "resource:///modules/SitePermissions.sys.mjs"
        );
        Assert.ok(
          SitePermissions.getAllForBrowser(browser).some(
            permission =>
              permission.id ===
              UmbrafoxClipboardProtection.getPermissionID(principal, "paste")
          ),
          "A reloaded frame grant is listed before any new clipboard attempt"
        );
        await revokeClipboardThroughPanel(browser, principal, "paste");
      } finally {
        state.cancel();
        UmbrafoxClipboardProtection.revoke(principal, "paste");
      }
    });
  }
);

add_task(
  async function test_container_grants_do_not_inherit_other_attributes() {
    const tab = gBrowser.addTab("https://example.com/", {
      userContextId: 1,
      triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),
    });
    const browser = tab.linkedBrowser;
    await BrowserTestUtils.browserLoaded(browser);
    gBrowser.selectedTab = tab;
    const principal = browser.contentPrincipal;
    Assert.equal(principal.originAttributes.userContextId, 1);
    let state;
    try {
      await SimpleTest.promiseFocus(browser);
      state = await showClipboardNotice(browser);
      await clickClipboardChoice(browser, state, "always");
      await waitForClipboardUI(
        () => UmbrafoxClipboardProtection.hasGrant(principal, "copy"),
        "Container grant is saved"
      );
      for (const attributes of [
        {},
        { userContextId: 2 },
        { privateBrowsingId: 1 },
      ]) {
        const other = Services.scriptSecurityManager.createContentPrincipal(
          principal.URI,
          attributes
        );
        Assert.ok(
          !UmbrafoxClipboardProtection.hasGrant(other, "copy"),
          `Grant does not cross origin attributes ${JSON.stringify(attributes)}`
        );
      }
      await revokeClipboardThroughPanel(browser, principal, "copy");
    } finally {
      state?.cancel();
      UmbrafoxClipboardProtection.revoke(principal, "copy");
      await BrowserTestUtils.removeTab(tab);
    }
  }
);
