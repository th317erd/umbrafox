/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const launcher =
  process.env.UMBRAFOX_TEST_LAUNCHER ??
  fileURLToPath(new URL("../launch-umbrafox", import.meta.url));

function fixture(t) {
  const home = mkdtempSync(join(tmpdir(), "umbrafox launcher \n"));
  t.after(() => rmSync(home, { recursive: true, force: true }));
  const programs = join(home, "Programs");
  mkdirSync(programs);
  return {
    install(directoryName, buildID, platformID = buildID, executable = true) {
      const path = join(programs, directoryName);
      mkdirSync(path);
      writeFileSync(
        join(path, "application.ini"),
        `[App]\nBuildID=${buildID}\n`
      );
      writeFileSync(
        join(path, "platform.ini"),
        `[Build]\nBuildID=${platformID}\n`
      );
      if (executable) {
        writeFileSync(
          join(path, "umbrafox"),
          '#!/usr/bin/env bash\nprintf "%s\\0" "$0" "$@"\n',
          { mode: 0o755 }
        );
      }
      return path;
    },
    launch(...args) {
      const output = execFileSync("bash", [launcher, ...args], {
        env: { ...process.env, HOME: home },
        encoding: "utf8",
        timeout: 2000,
        stdio: ["ignore", "pipe", "pipe"],
      });
      assert.ok(output.endsWith("\0"));
      return output.slice(0, -1).split("\0");
    },
  };
}

test("newer nightly supersedes an older dated installation", t => {
  const f = fixture(t);
  f.install("umbrafox-20261001-103920-158.0a1", "20261001103920");
  const nightly = f.install("umbrafox-nightly", "20261015235226");
  assert.deepEqual(f.launch("--new-tab", "https://example.com/a b"), [
    join(nightly, "umbrafox"),
    "--new-tab",
    "https://example.com/a b",
  ]);
});

test("a published dated installation launches without nightly", t => {
  const f = fixture(t);
  const dated = f.install("umbrafox-20261001-103920-158.0a1", "20261001103920");
  assert.deepEqual(f.launch(), [join(dated, "umbrafox")]);
});

test("actual BuildID wins over directory name", t => {
  const f = fixture(t);
  f.install("umbrafox-nightly", "20261015235226");
  f.install("umbrafox-20990101-000000-158.0a1", "20261001103920");
  const newest = f.install(
    "umbrafox-20261016-010000-160.0a1",
    "20261016010000"
  );
  assert.deepEqual(f.launch(), [join(newest, "umbrafox")]);
});

test("unpublished staging and incomplete or mismatched installs are ignored", t => {
  const f = fixture(t);
  const valid = f.install("umbrafox-nightly", "20261015235226");
  f.install("umbrafox-nightly.next-staging", "20261017000000");
  f.install(
    "umbrafox-20261018-000000-160.0a1",
    "20261018000000",
    "20261017000000"
  );
  f.install(
    "umbrafox-20261019-000000-160.0a1",
    "20261019000000",
    undefined,
    false
  );
  f.install("umbrafox-20261020-000000-160.0a1", "not-a-build");
  assert.deepEqual(f.launch(), [join(valid, "umbrafox")]);
});

test("nightly wins equal BuildIDs without injecting a profile argument", t => {
  const f = fixture(t);
  f.install("umbrafox-20261015-235226-160.0a1", "20261015235226");
  const nightly = f.install("umbrafox-nightly", "20261015235226");
  assert.deepEqual(f.launch("--private-window"), [
    join(nightly, "umbrafox"),
    "--private-window",
  ]);
});

test("duplicate BuildIDs and missing installations fail closed", t => {
  const f = fixture(t);
  assert.throws(
    () => f.launch(),
    error => error.status === 1
  );
  f.install("umbrafox-nightly", "20261015235226\nBuildID=20261016010000");
  assert.throws(
    () => f.launch(),
    error => error.status === 1
  );
});

for (const directoryName of [
  "umbrafox-20261016-010000-160.0a1.next-staging",
  "umbrafox-20261016-010000-160.0a1.before-upgrade",
  "umbrafox-20261016",
  "umbrafox-20261016-010000-160x0a1",
  "umbrafox-20261016-010000-160.0a1-extra",
  "umbrafox-2garbage",
]) {
  test(`ignores unpublished directory ${directoryName}`, t => {
    const f = fixture(t);
    const valid = f.install("umbrafox-nightly", "20261015235226");
    f.install(directoryName, "20261016010000");
    assert.deepEqual(f.launch(), [join(valid, "umbrafox")]);
  });
}

test("ignores a newer candidate with a directory instead of an executable", t => {
  const f = fixture(t);
  const valid = f.install("umbrafox-nightly", "20261015235226");
  const invalid = f.install(
    "umbrafox-20261016-010000-160.0a1",
    "20261016010000",
    undefined,
    false
  );
  mkdirSync(join(invalid, "umbrafox"));
  assert.deepEqual(f.launch(), [join(valid, "umbrafox")]);
});

test("preserves arguments verbatim including explicit profile arguments", t => {
  const f = fixture(t);
  const valid = f.install("umbrafox-nightly", "20261015235226");
  const args = [
    "",
    " leading and trailing \t",
    "line one\nline two\n",
    "quotes'\" and \\backslash",
    "$(exit 99); *?[a] `echo wrong`",
    "-profile",
    "supplied profile path",
    "-P",
    "supplied profile name",
    "--",
    "--private-window",
    "",
  ];
  assert.deepEqual(f.launch(...args), [join(valid, "umbrafox"), ...args]);
});
