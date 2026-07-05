/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/ */

"use strict";

const { getDefaultUserlandScriptName, getUserlandScriptScopeForTreeItem } =
  ChromeUtils.importESModule(
    "resource://gre/modules/UmbrafoxUserlandScriptScope.sys.mjs"
  );

function makeThreadItem({
  url = "https://example.com/app/",
  targetType = "frame",
} = {}) {
  return {
    type: "thread",
    thread: {
      url,
      targetType,
    },
    parent: null,
  };
}

function run_test() {
  const thread = makeThreadItem();
  Assert.deepEqual(
    getUserlandScriptScopeForTreeItem(thread),
    {
      origin: "https://example.com",
      targetKinds: ["document"],
      sourceUrlPattern: null,
    },
    "Main thread scopes default to document scripts for the thread origin"
  );

  const group = {
    type: "group",
    origin: "https://static.example.net/assets/",
    parent: thread,
  };
  Assert.deepEqual(
    getUserlandScriptScopeForTreeItem(group),
    {
      origin: "https://static.example.net",
      targetKinds: ["document"],
      sourceUrlPattern: null,
    },
    "Origin groups scope to their HTTP(S) origin"
  );

  const source = {
    type: "source",
    source: {
      url: "https://cdn.example.org/scripts/app.js?version=1",
    },
    parent: group,
  };
  Assert.deepEqual(
    getUserlandScriptScopeForTreeItem(source),
    {
      origin: "https://cdn.example.org",
      targetKinds: ["document"],
      sourceUrlPattern: null,
    },
    "Sources scope to their own HTTP(S) origin"
  );

  const worker = makeThreadItem({
    url: "https://example.com/worker.js",
    targetType: "worker",
  });
  Assert.deepEqual(
    getUserlandScriptScopeForTreeItem(worker),
    {
      origin: "https://example.com",
      targetKinds: ["dedicated_worker"],
      sourceUrlPattern: null,
    },
    "Worker threads scope to dedicated worker scripts"
  );

  Assert.equal(
    getUserlandScriptScopeForTreeItem(makeThreadItem({ url: "about:newtab" })),
    null,
    "Non HTTP(S) threads do not support userland script creation"
  );

  Assert.equal(
    getDefaultUserlandScriptName(source),
    "Userland script for cdn.example.org",
    "Default names include the selected origin host"
  );
}
