/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Parent runs this only with an isolated test profile and clipboard backend.
const SAFETY_CLIPBOARD_TEXT = "native safety clipboard fixture";
const SAFETY_COPY_TEXT = "native safety selected text";
const SAFETY_FIELD_TEXT = "original textarea fixture";

async function writeSafetyClipboard(text) {
  Cc["@mozilla.org/widget/clipboardhelper;1"]
    .getService(Ci.nsIClipboardHelper)
    .copyString(text);
  await TestUtils.waitForCondition(
    () => SpecialPowers.getClipboardData("text/plain") === text,
    "Isolated clipboard contains only the expected fixture",
    50,
    100
  );
}

async function installSafetyFixture(browser, options) {
  await SimpleTest.promiseFocus(browser);
  await SpecialPowers.spawn(
    browser,
    [options, SAFETY_COPY_TEXT, SAFETY_FIELD_TEXT],
    (configuration, copyText, fieldText) => {
      const script = content.document.createElement("script");
      script.textContent = `
        document.body.innerHTML = '<p id="copy-target" tabindex="0"></p>' +
          '<textarea id="paste-target"></textarea><textarea id="other-target">other fixture</textarea>' +
          '<div id="editing-host" contenteditable="true"><span id="inherited-target">editable fixture</span></div>';
        const config = ${JSON.stringify(configuration)};
        const paragraph = document.getElementById('copy-target');
        const field = document.getElementById('paste-target');
        paragraph.textContent = ${JSON.stringify(copyText)};
        field.value = ${JSON.stringify(fieldText)};
        window.clipboardSafetyFixture = {
          events: [], nestedAttempted: false, nested: false, scriptResult: null,
          replayControlState: null,
          exec() { this.scriptResult = document.execCommand(config.operation); },
          synthetic() {
            document.activeElement.dispatchEvent(new ClipboardEvent(config.operation,
              { bubbles: true, cancelable: true }));
          },
          mutate(kind) {
            const target = config.operation === 'copy' ? paragraph : field;
            if (kind === 'selection') {
              if (config.operation === 'copy') {
                getSelection().collapse(paragraph.firstChild, 1);
              } else {
                field.setSelectionRange(1, 1);
              }
            } else if (kind === 'focus') {
              document.getElementById('other-target').focus();
            } else if (kind === 'value') {
              if (config.operation === 'copy') {
                paragraph.textContent = 'changed selected fixture';
              } else {
                field.value = 'changed textarea fixture';
              }
            } else if (kind === 'target') {
              const replacement = target.cloneNode(true);
              if (config.operation === 'paste') {
                replacement.value = 'focused replacement fixture';
              }
              target.replaceWith(replacement);
              replacement.focus();
            } else if (kind === 'restore') {
              const replacement = document.getElementById(target.id);
              if (replacement !== target) {
                replacement.replaceWith(target);
              }
              paragraph.textContent = ${JSON.stringify(copyText)};
              field.value = ${JSON.stringify(fieldText)};
              target.focus();
              if (config.operation === 'copy') {
                getSelection().selectAllChildren(paragraph);
              } else {
                field.setSelectionRange(0, field.value.length);
              }
            }
            return this.snapshot();
          },
          snapshot() {
            const currentField = document.getElementById('paste-target');
            return {
              events: this.events.slice(),
              value: currentField?.value ?? null,
              readOnly: currentField?.readOnly ?? null,
              disabled: currentField?.disabled ?? null,
              otherValue: document.getElementById('other-target').value,
              copyText: document.getElementById('copy-target')?.textContent ?? null,
              focused: document.activeElement.id,
              nestedAttempted: this.nestedAttempted,
              scriptResult: this.scriptResult,
            };
          },
        };
        for (const type of ['copy', 'paste', 'beforeinput', 'input']) {
          document.addEventListener(type, event => {
            const fixture = clipboardSafetyFixture;
            if (type === config.operation) {
              if (config.mode === 'propagation') {
                event.stopPropagation();
              } else if (config.mode === 'immediate') {
                event.stopImmediatePropagation();
              } else if (config.mode === 'nested') {
                if (fixture.nested) {
                  event.preventDefault();
                } else if (!fixture.nestedAttempted) {
                  fixture.nestedAttempted = true;
                  fixture.nested = true;
                  try { fixture.exec(); } finally { fixture.nested = false; }
                }
              } else if (config.mode !== 'privileged' && config.mode !== 'beforeinput') {
                event.preventDefault();
              }
            } else if (type === 'beforeinput' && config.mode === 'beforeinput') {
              event.preventDefault();
            }
            if (type === 'beforeinput' && fixture.replayControlState) {
              field[fixture.replayControlState] = true;
              event.preventDefault();
            }
            fixture.events.push({
              type, trusted: event.isTrusted, canceled: event.defaultPrevented,
              inputType: event.inputType ?? null, nested: fixture.nested,
            });
          }, true);
        }
        if (config.editable === 'designMode') {
          document.designMode = 'on';
          paragraph.focus();
          getSelection().selectAllChildren(paragraph);
        } else if (config.editable === 'inherited') {
          const host = document.getElementById('editing-host');
          host.focus();
          getSelection().selectAllChildren(document.getElementById('inherited-target'));
        } else if (config.operation === 'copy') {
          paragraph.focus();
          getSelection().selectAllChildren(paragraph);
        } else {
          field.focus();
          field.setSelectionRange(0, field.value.length);
        }
      `;
      content.document.body.appendChild(script);
    }
  );
}

async function observeSafetyCommand(browser, operation, source = "native") {
  return SpecialPowers.spawn(
    browser,
    [operation, source],
    async (command, route) => {
      const requests = [];
      let privilegedCancellations = 0;
      const observer = (subject, _topic, data) => {
        if (subject.windowGlobalChild === content.windowGlobalChild) {
          requests.push({
            ...JSON.parse(data),
            innerWindowId: String(content.windowGlobalChild.innerWindowId),
          });
        }
      };
      const cancelPrivileged = event => {
        event.preventDefault();
        privilegedCancellations++;
      };
      Services.obs.addObserver(observer, "umbrafox-clipboard-canceled");
      if (route === "privileged") {
        content.addEventListener(command, cancelPrivileged, {
          capture: true,
          mozSystemGroup: true,
        });
      }
      let handlingInput;
      try {
        // Exercise permitted page execCommand without making activation authority.
        if (
          (route === "script" && command === "copy") ||
          route === "permitted-script" ||
          route === "nested"
        ) {
          handlingInput = content.windowUtils.setHandlingUserInput(true);
        } else if (route === "script") {
          content.document.clearUserGestureActivation();
        }
        try {
          if (route === "script" || route === "permitted-script") {
            content.wrappedJSObject.clipboardSafetyFixture.exec();
          } else if (route === "synthetic") {
            content.wrappedJSObject.clipboardSafetyFixture.synthetic();
          } else {
            content.docShell.doCommand(`cmd_${command}`);
          }
        } finally {
          handlingInput?.destruct();
        }
        let drained = false;
        Services.tm.dispatchToMainThread(() => {
          Services.tm.dispatchToMainThread(() => {
            drained = true;
          });
        });
        await ContentTaskUtils.waitForCondition(
          () => drained,
          "Native command offer runnable has passed two main-thread turns",
          10,
          500
        );
        return {
          requests,
          privilegedCancellations,
          snapshot: content.wrappedJSObject.clipboardSafetyFixture.snapshot(),
        };
      } finally {
        Services.obs.removeObserver(observer, "umbrafox-clipboard-canceled");
        if (route === "privileged") {
          content.removeEventListener(command, cancelPrivileged, {
            capture: true,
            mozSystemGroup: true,
          });
        }
      }
    }
  );
}

async function safetyAction(browser, request, action, overrides = {}) {
  return SpecialPowers.spawn(
    browser,
    [{ ...request, action, ...overrides }],
    fields => {
      const bag = Cc["@mozilla.org/hash-property-bag;1"].createInstance(
        Ci.nsIWritablePropertyBag2
      );
      for (const key of ["operation", "requestId", "action", "innerWindowId"]) {
        bag.setPropertyAsACString(key, fields[key]);
      }
      bag.setPropertyAsBool("accepted", false);
      Services.obs.notifyObservers(bag, "umbrafox-clipboard-action");
      return {
        accepted: bag.getPropertyAsBool("accepted"),
        snapshot:
          content.wrappedJSObject.clipboardSafetyFixture?.snapshot() ?? null,
      };
    }
  );
}

async function mutateSafetyFixture(browser, kind) {
  return SpecialPowers.spawn(browser, [kind], mutation =>
    content.wrappedJSObject.clipboardSafetyFixture.mutate(mutation)
  );
}

async function withSafetyFixture(options, task) {
  await BrowserTestUtils.withNewTab("https://example.com/", async browser => {
    const requests = [];
    try {
      await writeSafetyClipboard(SAFETY_CLIPBOARD_TEXT);
      await installSafetyFixture(browser, options);
      await task(browser, async (source = "native") => {
        const result = await observeSafetyCommand(
          browser,
          options.operation,
          source
        );
        requests.push(...result.requests);
        return result;
      });
    } finally {
      try {
        for (const request of requests) {
          await safetyAction(browser, request, "discard");
        }
      } finally {
        const popups = browser.documentGlobal.PopupNotifications;
        const notification = popups.getNotification(
          "umbrafox-clipboard-protection",
          browser
        );
        if (notification) {
          popups.remove(notification);
        }
        await writeSafetyClipboard("");
      }
    }
  });
}

function assertNoSafetyNotice(result, label) {
  Assert.equal(result.requests.length, 0, `${label}: no native notice`);
  Assert.ok(
    result.snapshot.events.length,
    `${label}: event path was exercised`
  );
}

add_task(
  async function test_script_and_synthetic_events_have_no_native_authority() {
    for (const operation of ["copy", "paste"]) {
      await withSafetyFixture(
        { operation, mode: "cancel" },
        async (_browser, command) => {
          const result = await command("script");
          Assert.equal(
            result.requests.length,
            0,
            `Page execCommand(${operation}) has no native authority`
          );
          if (operation === "copy" || result.snapshot.events.length) {
            Assert.equal(
              result.snapshot.events.length,
              1,
              "The permitted script command actually dispatched"
            );
            Assert.ok(
              result.snapshot.events[0].trusted,
              "A trusted script-dispatched clipboard event is still not a native command"
            );
            Assert.ok(result.snapshot.events[0].canceled);
          } else {
            Assert.equal(
              result.snapshot.scriptResult,
              false,
              "Default script-paste permission denial remains unchanged"
            );
          }
          Assert.equal(result.snapshot.value, SAFETY_FIELD_TEXT);
          Assert.equal(
            SpecialPowers.getClipboardData("text/plain"),
            SAFETY_CLIPBOARD_TEXT
          );
        }
      );
      await withSafetyFixture(
        { operation, mode: "cancel" },
        async (_browser, command) => {
          const result = await command("synthetic");
          assertNoSafetyNotice(result, `Synthetic ${operation}`);
          Assert.equal(result.snapshot.events.length, 1);
          Assert.ok(!result.snapshot.events[0].trusted);
          Assert.ok(result.snapshot.events[0].canceled);
          Assert.equal(result.snapshot.value, SAFETY_FIELD_TEXT);
          Assert.equal(
            SpecialPowers.getClipboardData("text/plain"),
            SAFETY_CLIPBOARD_TEXT
          );
        }
      );
    }
  }
);

add_task(async function test_permitted_script_paste_has_no_native_authority() {
  await SpecialPowers.pushPrefEnv({
    set: [["dom.events.testing.asyncClipboard", true]],
  });
  try {
    await withSafetyFixture(
      { operation: "paste", mode: "cancel" },
      async (_browser, command) => {
        const result = await command("permitted-script");
        assertNoSafetyNotice(result, "Permitted script paste");
        Assert.deepEqual(
          result.snapshot.events.map(event => event.type),
          ["paste"]
        );
        Assert.ok(result.snapshot.events[0].trusted);
        Assert.ok(result.snapshot.events[0].canceled);
        Assert.equal(result.snapshot.value, SAFETY_FIELD_TEXT);
        Assert.equal(
          SpecialPowers.getClipboardData("text/plain"),
          SAFETY_CLIPBOARD_TEXT
        );
      }
    );
  } finally {
    await SpecialPowers.popPrefEnv();
  }
});

add_task(async function test_propagation_stopping_does_not_offer_override() {
  for (const operation of ["copy", "paste"]) {
    for (const mode of ["propagation", "immediate"]) {
      await withSafetyFixture(
        { operation, mode },
        async (_browser, command) => {
          const result = await command();
          assertNoSafetyNotice(result, `${operation} ${mode}`);
          Assert.ok(
            result.snapshot.events.every(
              event => event.trusted && !event.canceled
            )
          );
          Assert.equal(result.snapshot.events[0].type, operation);
          if (operation === "copy") {
            Assert.equal(
              SpecialPowers.getClipboardData("text/plain"),
              SAFETY_COPY_TEXT
            );
          } else {
            Assert.equal(result.snapshot.value, SAFETY_CLIPBOARD_TEXT);
            Assert.deepEqual(
              result.snapshot.events.map(event => event.type),
              ["paste", "beforeinput", "input"]
            );
          }
        }
      );
    }
  }
});

add_task(
  async function test_privileged_only_cancellation_is_not_content_cancellation() {
    for (const operation of ["copy", "paste"]) {
      await withSafetyFixture(
        { operation, mode: "privileged" },
        async (_browser, command) => {
          const result = await command("privileged");
          assertNoSafetyNotice(result, `Privileged-only ${operation}`);
          Assert.equal(result.privilegedCancellations, 1);
          Assert.equal(result.snapshot.events.length, 1);
          Assert.ok(result.snapshot.events[0].trusted);
          Assert.ok(
            !result.snapshot.events[0].canceled,
            "Content listener did not cancel before the system group"
          );
          Assert.equal(result.snapshot.value, SAFETY_FIELD_TEXT);
          Assert.equal(
            SpecialPowers.getClipboardData("text/plain"),
            SAFETY_CLIPBOARD_TEXT
          );
        }
      );
    }
  }
);

add_task(
  async function test_editing_hosts_preserve_page_cancellation_without_notice() {
    for (const operation of ["copy", "paste"]) {
      for (const editable of ["inherited", "designMode"]) {
        await withSafetyFixture(
          { operation, mode: "cancel", editable },
          async (_browser, command) => {
            const result = await command();
            assertNoSafetyNotice(result, `${editable} ${operation}`);
            Assert.equal(result.snapshot.events.length, 1);
            Assert.equal(result.snapshot.events[0].type, operation);
            Assert.ok(
              result.snapshot.events[0].trusted &&
                result.snapshot.events[0].canceled
            );
            Assert.equal(
              SpecialPowers.getClipboardData("text/plain"),
              SAFETY_CLIPBOARD_TEXT
            );
          }
        );
      }
    }
  }
);

add_task(
  async function test_textarea_beforeinput_cancellation_is_notice_eligible() {
    await withSafetyFixture(
      { operation: "paste", mode: "beforeinput" },
      async (browser, command) => {
        const result = await command();
        Assert.equal(result.requests.length, 1);
        Assert.equal(result.requests[0].operation, "paste");
        Assert.deepEqual(
          result.snapshot.events.map(event => event.type),
          ["paste", "beforeinput"]
        );
        Assert.ok(!result.snapshot.events[0].canceled);
        Assert.ok(result.snapshot.events[1].canceled);
        Assert.equal(result.snapshot.events[1].inputType, "insertFromPaste");
        Assert.equal(result.snapshot.value, SAFETY_FIELD_TEXT);
        const validated = await safetyAction(
          browser,
          result.requests[0],
          "validate"
        );
        Assert.ok(validated.accepted);
        Assert.deepEqual(
          validated.snapshot,
          result.snapshot,
          "Validation performs no edit"
        );
        Assert.ok(
          (await safetyAction(browser, result.requests[0], "discard")).accepted
        );
        Assert.ok(
          !(await safetyAction(browser, result.requests[0], "retry")).accepted
        );
      }
    );
  }
);

add_task(
  async function test_nested_page_execcommand_cannot_borrow_native_authority() {
    await withSafetyFixture(
      { operation: "copy", mode: "nested" },
      async (_browser, command) => {
        const result = await command("nested");
        assertNoSafetyNotice(result, "Only nested page copy was canceled");
        Assert.ok(result.snapshot.nestedAttempted);
        Assert.equal(
          result.snapshot.events.length,
          2,
          "Both outer native and inner script copy actually dispatched"
        );
        Assert.ok(result.snapshot.events.every(event => event.trusted));
        Assert.ok(
          result.snapshot.events[0].nested && result.snapshot.events[0].canceled
        );
        Assert.ok(
          !result.snapshot.events[1].nested &&
            !result.snapshot.events[1].canceled
        );
        Assert.equal(
          SpecialPowers.getClipboardData("text/plain"),
          SAFETY_COPY_TEXT
        );
      }
    );
  }
);

add_task(async function test_stale_retry_is_consumed_without_page_dispatch() {
  for (const operation of ["copy", "paste"]) {
    for (const mutation of ["selection", "focus", "value", "target"]) {
      await withSafetyFixture(
        { operation, mode: "cancel" },
        async (browser, command) => {
          const staged = await command();
          Assert.equal(
            staged.requests.length,
            1,
            `${operation} ${mutation}: pending command`
          );
          const request = staged.requests[0];
          const changed = await mutateSafetyFixture(browser, mutation);
          const eligible = await safetyAction(browser, request, "validate");
          Assert.ok(
            eligible.accepted,
            "Notice eligibility does not require replay freshness"
          );
          Assert.deepEqual(eligible.snapshot, changed);
          const retried = await safetyAction(browser, request, "retry");
          Assert.ok(
            !retried.accepted,
            `${operation} ${mutation}: stale replay fails closed`
          );
          Assert.deepEqual(
            retried.snapshot,
            changed,
            "No extra event, edit, or focus restoration"
          );
          Assert.ok(
            !(await safetyAction(browser, request, "validate")).accepted,
            "A failed matched retry consumes the token"
          );
          const restored = await mutateSafetyFixture(browser, "restore");
          const repeated = await safetyAction(browser, request, "retry");
          Assert.ok(
            !repeated.accepted,
            "Restoring the old target cannot revive the token"
          );
          Assert.deepEqual(repeated.snapshot, restored);
          Assert.equal(
            SpecialPowers.getClipboardData("text/plain"),
            SAFETY_CLIPBOARD_TEXT
          );
        }
      );
    }
  }
});

add_task(
  async function test_retry_beforeinput_cannot_make_control_unwritable() {
    for (const property of ["readOnly", "disabled"]) {
      await withSafetyFixture(
        { operation: "paste", mode: "cancel" },
        async (browser, command) => {
          const staged = await command();
          Assert.equal(staged.requests.length, 1);
          Assert.deepEqual(
            staged.snapshot.events.map(event => event.type),
            ["paste"]
          );
          Assert.ok(!staged.snapshot.readOnly && !staged.snapshot.disabled);
          const request = staged.requests[0];
          await SpecialPowers.spawn(browser, [property], state => {
            content.wrappedJSObject.clipboardSafetyFixture.replayControlState =
              state;
          });
          Assert.ok(
            (await safetyAction(browser, request, "validate")).accepted
          );
          const result = await safetyAction(browser, request, "retry");
          const replayEvents = result.snapshot.events.slice(
            staged.snapshot.events.length
          );
          Assert.deepEqual(
            replayEvents.map(event => event.type),
            ["paste", "beforeinput"],
            "Replay reached the content mutation handler without dispatching input"
          );
          Assert.ok(
            replayEvents.every(event => event.trusted && event.canceled)
          );
          Assert.equal(replayEvents[1].inputType, "insertFromPaste");
          Assert.ok(
            result.snapshot[property],
            `Content beforeinput set ${property}`
          );
          Assert.ok(
            !result.accepted,
            `${property} during replay must not report success`
          );
          Assert.equal(
            result.snapshot.value,
            SAFETY_FIELD_TEXT,
            "Nothing was inserted into the unwritable original control"
          );
          Assert.equal(result.snapshot.otherValue, staged.snapshot.otherValue);
          Assert.ok(
            !(await safetyAction(browser, request, "validate")).accepted
          );
          const repeated = await safetyAction(browser, request, "retry");
          Assert.ok(!repeated.accepted, "Failed replay remains consumed");
          Assert.deepEqual(repeated.snapshot, result.snapshot);
          Assert.equal(
            SpecialPowers.getClipboardData("text/plain"),
            SAFETY_CLIPBOARD_TEXT
          );
        }
      );
    }
  }
);

add_task(async function test_mismatched_actions_do_not_consume_or_replay() {
  await withSafetyFixture(
    { operation: "copy", mode: "cancel" },
    async (browser, command) => {
      const staged = await command();
      Assert.equal(staged.requests.length, 1);
      const request = staged.requests[0];
      for (const overrides of [
        { requestId: `${request.requestId}-wrong` },
        { operation: "paste" },
        { innerWindowId: `0${request.innerWindowId}` },
        { innerWindowId: "0" },
      ]) {
        for (const action of ["validate", "discard", "retry"]) {
          const rejected = await safetyAction(
            browser,
            request,
            action,
            overrides
          );
          Assert.ok(
            !rejected.accepted,
            `${action} rejects mismatched identity`
          );
          Assert.deepEqual(rejected.snapshot, staged.snapshot);
          Assert.ok(
            (await safetyAction(browser, request, "validate")).accepted,
            "An unrelated request does not consume the real token"
          );
        }
      }
      Assert.ok(
        !(await safetyAction(browser, request, "unknown-action")).accepted
      );
      Assert.ok((await safetyAction(browser, request, "discard")).accepted);
      const replay = await safetyAction(browser, request, "retry");
      Assert.ok(!replay.accepted);
      Assert.deepEqual(replay.snapshot, staged.snapshot);
      Assert.equal(
        SpecialPowers.getClipboardData("text/plain"),
        SAFETY_CLIPBOARD_TEXT
      );
    }
  );
});

add_task(async function test_navigation_cannot_redirect_a_pending_paste() {
  await withSafetyFixture(
    { operation: "paste", mode: "cancel" },
    async (browser, command) => {
      const staged = await command();
      Assert.equal(staged.requests.length, 1);
      const request = staged.requests[0];
      const destination = "https://example.com/?clipboard-safety-navigation";
      BrowserTestUtils.startLoadingURIString(browser, destination);
      await TestUtils.waitForCondition(
        () =>
          browser.currentURI.spec === destination &&
          !browser.webProgress.isLoadingDocument &&
          String(browser.browsingContext.currentWindowGlobal?.innerWindowId) !==
            request.innerWindowId,
        "Navigation replaces the native request document",
        50,
        100
      );
      await installSafetyFixture(browser, {
        operation: "paste",
        mode: "cancel",
      });
      const before = await SpecialPowers.spawn(browser, [], () =>
        content.wrappedJSObject.clipboardSafetyFixture.snapshot()
      );
      for (const action of ["validate", "retry", "retry"]) {
        const result = await safetyAction(browser, request, action);
        Assert.ok(
          !result.accepted,
          `${action} cannot target the replacement document`
        );
        Assert.deepEqual(result.snapshot, before);
      }
      Assert.equal(
        SpecialPowers.getClipboardData("text/plain"),
        SAFETY_CLIPBOARD_TEXT
      );
    }
  );
});
