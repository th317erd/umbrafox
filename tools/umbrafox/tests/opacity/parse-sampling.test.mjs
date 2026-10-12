/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import assert from "node:assert/strict";
import { test } from "node:test";
import { parseSamplingRecords } from "./parse-sampling.mjs";

const bits = count => Array(count).fill(0);
function fixture(clear = null) {
  const records = [
    {
      event: "begin",
      source: "image",
      key: "image-key",
      gpu_texture_size: null,
      sampler_weights: null,
      intermediate_texels: null,
      submission_is_gpu_completion: false,
    },
    {
      event: "texture",
      source: "image",
      provenance: "resolved-cpu-wrapper",
      uv_bits: bits(4),
      normalized: true,
      allocation_size: null,
      format: null,
      sampler_state: null,
    },
    {
      event: "task",
      id: 0,
      kind: "Picture",
      source: "picture",
      bits: bits(8),
      uv_quad_bits: null,
    },
    {
      event: "quad-input",
      id: 0,
      words: [0, 0, 255, 0],
      binding: "image-binding",
      sources: ["image", "Invalid", "Invalid"],
      header: bits(4),
      bits: Array.from({ length: 5 }, () => bits(4)),
      transform_id: 0,
      transform_bits: [bits(16), bits(16)],
    },
    {
      event: "target",
      id: 1,
      pass: 0,
      source: "picture",
      clear_bits: clear,
      render_area: [0, 0, 400, 300],
      draw_size: [400, 300],
      draw_offset: [0, 0],
      provenance: "cpu-allocation",
      size: [400, 300],
      format: "RGBA8",
      filter: "Linear",
      swizzle: "Rgba",
    },
    {
      event: "clear",
      target: 1,
      color_load: "Clear",
      framebuffer_clear_rect: null,
      precise: false,
      with_quads: false,
    },
    {
      event: "quad-draw",
      id: 0,
      target: 1,
      pass: 0,
      draw: 1,
      framebuffer_scissor: [2, 3, 399, 299],
      projection_bits: bits(16),
      pattern: "ColorOrTexture",
      blend: "PremultipliedAlpha",
    },
    {
      event: "composite-input",
      id: 0,
      surface_kind: "texture",
      binding: "picture-binding",
      tile_index: 0,
      tile_id: "tile0",
      external_surface: null,
      features: 1,
      bits: bits(38),
      sources: ["picture", "Invalid", "Invalid"],
    },
    {
      event: "texture",
      source: "picture",
      provenance: "cpu-allocation",
      size: [400, 300],
      format: "RGBA8",
      filter: "Linear",
      kind: "Texture2D",
    },
    {
      event: "composite-pass",
      id: 1,
      draw_size: [1280, 972],
      draw_offset: [0, 0],
      clear_bits: bits(4),
      color_load: "Clear",
      provenance: "cpu-draw-target",
      format: null,
    },
    {
      event: "composite-draw",
      id: 0,
      composition_pass: 1,
      binding: "picture-binding",
      features: 1,
      bits: bits(38),
      projection_bits: bits(16),
      blend: "None",
      texture_size_uniform_bits: null,
    },
    {
      event: "end",
      reason: "",
      quad_inputs: 1,
      quad_draws: 1,
      composite_draws: 1,
      gpu_values: "unknown",
    },
  ];
  return records.map(record => ({
    schema: 1,
    submission: "doc1:frame2:submission3",
    ...record,
  }));
}
const parse = records =>
  parseSamplingRecords(records.map(record => JSON.stringify(record)));

for (const clear of [null, [0, 2147483648, 1065353216, 4294967295]]) {
  test(`complete trace permits ${clear === null ? "null" : "array"} clear bits`, () => {
    assert.deepEqual(parse(fixture(clear)), {
      submission: "doc1:frame2:submission3",
      quads: 1,
      draws: 1,
      composites: 1,
    });
  });
}

test("direct promoted source can be complete without a quad", () => {
  const records = fixture().filter(
    record =>
      !["task", "quad-input", "target", "clear", "quad-draw"].includes(
        record.event
      )
  );
  records.find(record => record.event === "composite-input").sources[0] =
    "image";
  records.at(-1).quad_inputs = 0;
  records.at(-1).quad_draws = 0;
  assert.equal(parse(records).composites, 1);
});

const cases = {
  "absent begin": records => records.shift(),
  "absent end": records => records.pop(),
  incomplete: records => {
    records.at(-1).event = "incomplete";
  },
  "mixed tuple": records => {
    records[2].submission = "another";
  },
  "duplicate begin": records => records.splice(1, 0, records[0]),
  "duplicate ID": records => records.splice(3, 0, records[2]),
  "missing quad draw": records => records.splice(6, 1),
  "missing composite input": records => records.splice(7, 1),
  "missing composite emission": records => records.splice(10, 1),
  "wrong final variant": records => {
    records[10].features = 2;
  },
  "changed final operand": records => {
    records[10].bits[6] = 1;
  },
  "wrong binding": records => {
    records[10].binding = "unrelated";
  },
  "missing composite pass": records => records.splice(9, 1),
  "missing composite uniform": records => {
    delete records[10].texture_size_uniform_bits;
  },
  "missing target": records => records.splice(4, 1),
  "missing clear": records => records.splice(5, 1),
  "wrong destination": records => {
    records[2].source = "wrong";
  },
  "source not presented": records => {
    records[7].sources[0] = "Invalid";
  },
  "fabricated textureSize": records => {
    records[0].gpu_texture_size = [320, 180];
  },
  "fabricated allocation": records => {
    records[1].allocation_size = [320, 180];
  },
  "missing unknown": records => {
    delete records[0].sampler_weights;
  },
  "submission as completion": records => {
    records[0].submission_is_gpu_completion = true;
  },
  "invalid clear shape": records => {
    records[4].clear_bits = "None";
  },
  "invalid scissor shape": records => {
    records[6].framebuffer_scissor = "Some(Rect)";
  },
  "task outside snapshot": records => {
    records[3].words[3] = 19;
  },
  "wrong terminal counts": records => {
    records.at(-1).quad_draws = 2;
  },
  "missing allocation format": records => {
    delete records[8].format;
  },
  "missing allocation filter": records => {
    delete records[8].filter;
  },
  "missing allocation kind": records => {
    delete records[8].kind;
  },
  "missing target format": records => {
    delete records[4].format;
  },
  "missing target filter": records => {
    delete records[4].filter;
  },
  "missing target swizzle": records => {
    delete records[4].swizzle;
  },
};
for (const [caseName, alter] of Object.entries(cases)) {
  test(`reject ${caseName}`, () => {
    const records = fixture();
    alter(records);
    assert.throws(() => parse(records));
  });
}
test("reject invalid JSON and byte/record overflow", () => {
  const lines = fixture().map(record => JSON.stringify(record));
  lines[4] = lines[4].replace(
    '"clear_bits":null',
    '"clear_bits":Some([0,0,0,0])'
  );
  assert.throws(() => parseSamplingRecords(lines), SyntaxError);
  assert.throws(() => parseSamplingRecords([" ".repeat(262144), ...lines]));
  assert.throws(() => parseSamplingRecords(Array(1025).fill("{}")));
});
