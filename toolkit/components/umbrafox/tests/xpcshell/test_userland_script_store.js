/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/ */

"use strict";

const { UmbrafoxUserlandScriptStore } = ChromeUtils.importESModule(
  "resource://gre/modules/UmbrafoxUserlandScriptStore.sys.mjs"
);

add_setup(() => {
  do_get_profile();
});

function storePath(name) {
  return PathUtils.join(PathUtils.profileDir, "umbrafox-test", name);
}

async function makeStore(name) {
  const store = new UmbrafoxUserlandScriptStore({
    path: storePath(name),
  });
  await store.load();
  return store;
}

add_task(async function test_create_update_delete_and_persist() {
  const store = await makeStore("scripts.json");

  Assert.deepEqual(store.listScripts(), [], "New store starts empty");

  const created = store.createScript({
    name: "Example",
    enabled: true,
    scope: {
      origin: "https://example.com/path?ignored=true",
      targetKinds: ["document", "document", "frame"],
    },
    code: "window.__test = true;",
  });

  Assert.equal(created.name, "Example", "Script name is stored");
  Assert.equal(
    created.scope.origin,
    "https://example.com",
    "Origin is normalized"
  );
  Assert.deepEqual(
    created.scope.targetKinds,
    ["document", "frame"],
    "Target kinds are normalized"
  );
  Assert.equal(
    created.scope.sourceUrlPattern,
    null,
    "Source URL pattern defaults to null"
  );
  Assert.equal(created.world, "default", "World defaults to default");

  const updated = store.updateScript(created.id, {
    name: "Updated",
    enabled: false,
    scope: {
      sourceUrlPattern: "https://example.com/app/*.js",
    },
    code: "document.documentElement.dataset.test = '1';",
  });

  Assert.equal(updated.name, "Updated", "Name can be updated");
  Assert.equal(updated.enabled, false, "Enabled flag can be updated");
  Assert.equal(
    updated.scope.sourceUrlPattern,
    "https://example.com/app/*.js",
    "Scope can be partially updated"
  );

  await store.finalize();

  const reloaded = await makeStore("scripts.json");
  Assert.deepEqual(
    reloaded.getScript(created.id),
    updated,
    "Script persists to profile storage"
  );

  Assert.equal(
    reloaded.deleteScript(created.id),
    true,
    "Existing script can be deleted"
  );
  Assert.equal(
    reloaded.deleteScript(created.id),
    false,
    "Deleting a missing script is a no-op"
  );
  Assert.deepEqual(reloaded.listScripts(), [], "Deleted script is removed");

  await reloaded.finalize();
});

add_task(async function test_validation() {
  const store = await makeStore("validation.json");

  Assert.throws(
    () =>
      store.createScript({
        name: "Bad origin",
        scope: {
          origin: "ftp://example.com",
        },
      }),
    /Unsupported userland script scope origin/,
    "Only http and https origins are supported initially"
  );

  Assert.throws(
    () =>
      store.createScript({
        name: "",
        scope: {
          origin: "https://example.com",
        },
      }),
    /name must not be empty/,
    "Empty names are rejected"
  );

  Assert.throws(
    () =>
      store.createScript({
        name: "Bad target",
        scope: {
          origin: "https://example.com",
          targetKinds: ["unknown"],
        },
      }),
    /Unsupported userland script target kind/,
    "Unknown target kinds are rejected"
  );

  Assert.throws(
    () => store.updateScript("missing", {}),
    /Unknown userland script/,
    "Updating a missing script throws"
  );

  await store.finalize();
});

add_task(async function test_loaded_data_is_migrated() {
  const path = storePath("migration.json");
  await IOUtils.makeDirectory(PathUtils.parent(path), {
    createAncestors: true,
  });
  await IOUtils.writeJSON(path, {
    version: 0,
    scripts: [
      {
        id: "valid",
        name: " Valid ",
        enabled: 1,
        scope: {
          origin: "https://example.org/foo",
          targetKinds: ["document"],
        },
        world: " default ",
        code: "1;",
        createdAt: 10,
        updatedAt: 11,
      },
      {
        id: "invalid",
        name: "",
        scope: {
          origin: "https://example.org",
        },
      },
    ],
  });

  const store = new UmbrafoxUserlandScriptStore({ path });
  await store.load();

  Assert.deepEqual(
    store.listScripts(),
    [
      {
        id: "valid",
        name: "Valid",
        enabled: true,
        scope: {
          origin: "https://example.org",
          targetKinds: ["document"],
          sourceUrlPattern: null,
        },
        world: "default",
        code: "1;",
        createdAt: 10,
        updatedAt: 11,
      },
    ],
    "Loaded store data is normalized and invalid records are dropped"
  );

  await store.finalize();
});
