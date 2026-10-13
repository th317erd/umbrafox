/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import vm from "node:vm";

const expected = [
  ["gfx.canvas.remote.use-draw-image-fast-path-dmabuf", true],
  ["gfx.webrender.single-image-opacity.enabled", true],
];

test("beta enables only the two opted-in graphics optimizations", async () => {
  const source = await readFile(
    new URL("../umbrafox-beta.js", import.meta.url),
    "utf8"
  );
  const calls = [];
  vm.runInNewContext(
    source,
    { pref: (preferenceName, value) => calls.push([preferenceName, value]) },
    { timeout: 100 }
  );
  assert.deepEqual(calls, expected);
});

test("normal builds retain default-off experimental graphics preferences", async () => {
  const source = await readFile(
    new URL(
      "../../../../modules/libpref/init/StaticPrefList.yaml",
      import.meta.url
    ),
    "utf8"
  );
  const entries = source.split(/^\s*- name: /m).slice(1);
  for (const [preferenceName] of expected) {
    const entriesForName = entries.filter(
      entry => entry.split("\n")[0] === preferenceName
    );
    assert.equal(entriesForName.length, 1, preferenceName);
    assert.match(entriesForName[0], /^ {2}value: false$/m, preferenceName);
    assert.match(entriesForName[0], /^ {2}mirror: always$/m, preferenceName);
  }
});
