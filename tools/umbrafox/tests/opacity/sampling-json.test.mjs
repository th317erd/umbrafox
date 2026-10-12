/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import process from "node:process";
import { test } from "node:test";

test("producer clear bits serialize as an array or null", () => {
  const output = execFileSync(process.env.SAMPLING_JSON_FIXTURE, [], {
    encoding: "utf8",
    timeout: 5000,
    maxBuffer: 4096,
  });
  const records = output
    .trim()
    .split("\n")
    .map(line => JSON.parse(line));
  assert.equal(records.length, 2);
  assert.deepEqual(
    records[0].clear_bits,
    [0, 2147483648, 1065353216, 4294967295]
  );
  assert.equal(records[1].clear_bits, null);
  for (const record of records) {
    assert.equal(record.schema, 1);
    assert.equal(record.submission, "fixture:1:2");
    assert.equal(record.event, "target");
  }
});
