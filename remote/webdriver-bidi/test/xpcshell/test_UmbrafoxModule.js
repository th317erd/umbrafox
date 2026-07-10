/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/ */

"use strict";

const { RemoteAgent } = ChromeUtils.importESModule(
  "chrome://remote/content/components/RemoteAgent.sys.mjs"
);
const { WebDriverSession } = ChromeUtils.importESModule(
  "chrome://remote/content/shared/webdriver/Session.sys.mjs"
);

function createBiDiSession() {
  const session = new WebDriverSession(
    {},
    new Set([WebDriverSession.SESSION_FLAG_BIDI])
  );
  registerCleanupFunction(() => session.destroy());
  return session;
}

add_task(async function test_umbrafox_commands_require_system_access() {
  if (RemoteAgent.allowSystemAccess) {
    info("System access was already enabled by the environment");
    return;
  }

  const session = createBiDiSession();
  await Assert.rejects(
    session.execute("umbrafox", "status", {}),
    err => err.name == "UnsupportedOperationError",
    "Umbrafox bot-control commands require privileged system access"
  );
});

add_task(async function test_umbrafox_status_and_capabilities() {
  RemoteAgent.allowSystemAccess = true;

  const session = createBiDiSession();
  const status = await session.execute("umbrafox", "status", {});

  Assert.equal(status.channel, "umbrafox", "Status identifies the channel");
  Assert.equal(status.protocol, "webdriver-bidi", "Status identifies BiDi");
  Assert.equal(status.systemAccess, true, "Status confirms privileged access");
  Assert.equal(
    status.appName,
    Services.appinfo.name,
    "Status includes app name"
  );
  Assert.equal(
    status.appVersion,
    Services.appinfo.version,
    "Status includes app version"
  );
  Assert.equal(
    status.platformVersion,
    Services.appinfo.platformVersion,
    "Status includes platform version"
  );
  Assert.equal(
    status.appBuildID,
    Services.appinfo.appBuildID,
    "Status includes build ID"
  );

  const { capabilities } = await session.execute(
    "umbrafox",
    "listCapabilities",
    {}
  );

  Assert.ok(Array.isArray(capabilities), "Capabilities are returned as a list");
  Assert.deepEqual(
    capabilities.filter(capability => capability.implemented).map(c => c.name),
    ["channel.status", "channel.capabilities"],
    "Only the initial bot-control channel commands are marked implemented"
  );
  Assert.ok(
    capabilities.some(capability => capability.name == "network.interception"),
    "Planned network interception bucket is advertised"
  );
  Assert.ok(
    capabilities.some(capability => capability.name == "userland.scripts"),
    "Planned userland script bucket is advertised"
  );
});
