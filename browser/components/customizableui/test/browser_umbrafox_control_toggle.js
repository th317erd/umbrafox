"use strict";

const { UmbrafoxControlService } = ChromeUtils.importESModule(
  "resource://gre/modules/UmbrafoxControlService.sys.mjs"
);

const UMBRAFOX_CONTROL_ENABLED_PREF = "umbrafox.control.enabled";

add_setup(async function () {
  await UmbrafoxControlService.resetForTests();
  await IOUtils.remove(UmbrafoxControlService.getStatusFilePath(), {
    ignoreAbsent: true,
  });
  await SpecialPowers.pushPrefEnv({
    clear: [[UMBRAFOX_CONTROL_ENABLED_PREF]],
  });
  registerCleanupFunction(async () => {
    if (PanelUI.panel.state == "open") {
      await gCUITestUtils.hideMainMenu();
    }
    await UmbrafoxControlService.resetForTests();
    await IOUtils.remove(UmbrafoxControlService.getStatusFilePath(), {
      ignoreAbsent: true,
    });
    if (Services.prefs.prefHasUserValue(UMBRAFOX_CONTROL_ENABLED_PREF)) {
      Services.prefs.clearUserPref(UMBRAFOX_CONTROL_ENABLED_PREF);
    }
  });
});

add_task(async function test_app_menu_toggles_umbrafox_link() {
  const statusFile = UmbrafoxControlService.getStatusFilePath();
  ok(!UmbrafoxControlService.running, "The control service starts stopped");
  ok(
    !Services.prefs.getBoolPref(UMBRAFOX_CONTROL_ENABLED_PREF, false),
    "The control service pref starts disabled"
  );

  await gCUITestUtils.openMainMenu();
  const button = PanelMultiView.getViewNode(
    document,
    "appMenu-umbrafox-control-button"
  );

  ok(button, "The UmbraLink toggle exists in the app menu");
  ok(!button.hasAttribute("checked"), "The menu item starts unchecked");

  EventUtils.synthesizeMouseAtCenter(button, {});
  await TestUtils.waitForCondition(
    () => UmbrafoxControlService.running,
    "The control service starts after checking the app menu toggle"
  );
  ok(
    Services.prefs.getBoolPref(UMBRAFOX_CONTROL_ENABLED_PREF, false),
    "The app menu toggle enables the pref"
  );
  ok(await IOUtils.exists(statusFile), "The control discovery file is written");
  ok(button.hasAttribute("checked"), "The menu item is checked after enabling");
  await TestUtils.waitForCondition(
    () => !button.disabled,
    "The menu item is enabled after starting the service"
  );

  EventUtils.synthesizeMouseAtCenter(button, {});
  await TestUtils.waitForCondition(
    () => !UmbrafoxControlService.running,
    "The control service stops after unchecking the app menu toggle"
  );
  ok(
    !Services.prefs.getBoolPref(UMBRAFOX_CONTROL_ENABLED_PREF, false),
    "The app menu toggle disables the pref"
  );
  await TestUtils.waitForCondition(
    async () => !(await IOUtils.exists(statusFile)),
    "The control discovery file is removed"
  );
  ok(!button.hasAttribute("checked"), "The menu item is unchecked");

  await gCUITestUtils.hideMainMenu();
});
