/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import assert from "node:assert/strict";
import { Buffer } from "node:buffer";

const strings = (record, fields) => {
  for (const field of fields) {
    assert.ok(
      typeof record[field] === "string" && !!record[field].length,
      `missing ${field}`
    );
  }
};
const integers = (value, expectedLength, signed = false) => {
  assert.ok(
    Array.isArray(value) && value.length === expectedLength,
    "array shape"
  );
  for (const integer of value) {
    assert.ok(Number.isInteger(integer), "integer required");
    assert.ok(integer >= (signed ? -2147483648 : 0));
    assert.ok(integer <= (signed ? 2147483647 : 4294967295));
  }
};
const optionalIntegers = (value, expectedLength, signed = false) => {
  if (value !== null) {
    integers(value, expectedLength, signed);
  }
};
const unique = (map, record) => {
  assert.ok(Number.isSafeInteger(record.id) && record.id >= 0);
  assert.ok(!map.has(record.id), "duplicate ID");
  map.set(record.id, record);
};

// Input is the text payloads of one Renderer submission's WR sampling operands markers.
export function parseSamplingRecords(lines) {
  assert.ok(
    lines.length >= 2 && lines.length <= 1024,
    "missing or excess records"
  );
  assert.ok(
    lines.reduce((size, line) => size + Buffer.byteLength(line), 0) <= 262144
  );
  const records = lines.map(line => JSON.parse(line));
  const begin = records[0];
  const end = records.at(-1);
  assert.equal(begin.event, "begin", "missing begin");
  assert.equal(end.event, "end", "missing end or incomplete trace");
  assert.equal(typeof begin.submission, "string");
  assert.ok(begin.submission.length);
  strings(begin, ["source", "key"]);
  for (const record of records) {
    assert.equal(record.schema, 1);
    assert.equal(
      record.submission,
      begin.submission,
      "mixed submission tuples"
    );
  }
  for (const field of [
    "gpu_texture_size",
    "sampler_weights",
    "intermediate_texels",
  ]) {
    assert.equal(begin[field], null, `${field} must remain unknown`);
  }
  assert.equal(begin.submission_is_gpu_completion, false);
  assert.equal(end.gpu_values, "unknown");
  const tasks = new Map();
  const targets = new Map();
  const textures = new Map();
  const quads = new Map();
  const composites = new Map();
  const surfaces = new Map();
  const compositionPasses = new Map();
  const cleared = new Set();
  const quadDraws = new Set();
  const compositeDraws = new Set();
  const reached = new Set([begin.source]);
  let presented = false;
  let draws = 0;
  const sourcesKnown = sources => {
    assert.ok(Array.isArray(sources) && sources.length === 3);
    for (const source of sources) {
      assert.ok(
        source === "Invalid" || textures.has(source),
        "missing texture metadata"
      );
    }
  };
  for (const record of records.slice(1, -1)) {
    switch (record.event) {
      case "texture":
        strings(record, ["source"]);
        assert.ok(!textures.has(record.source));
        if (record.provenance === "resolved-cpu-wrapper") {
          for (const key of ["allocation_size", "format", "sampler_state"]) {
            assert.equal(record[key], null, "external GPU state is unknown");
          }
          integers(record.uv_bits, 4);
          assert.equal(typeof record.normalized, "boolean");
        } else {
          assert.ok(["cpu-allocation", "constant"].includes(record.provenance));
          integers(record.size, 2);
          if (record.provenance === "cpu-allocation") {
            strings(record, ["format", "filter", "kind"]);
          } else {
            assert.equal(record.source, "Dummy");
            assert.deepEqual(record.size, [1, 1]);
          }
        }
        textures.set(record.source, record);
        break;
      case "descriptor":
        assert.ok(textures.has(record.source));
        assert.equal(record.provenance, "producer-descriptor");
        integers(record.size, 2);
        strings(record, ["format", "rendering"]);
        assert.equal(typeof record.composited, "boolean");
        break;
      case "external-surface":
        unique(surfaces, record);
        integers(record.producer_uv_bits, 4);
        integers(record.modulation_bits, 4);
        strings(record, ["source", "key", "generation"]);
        break;
      case "task":
        unique(tasks, record);
        strings(record, ["source", "kind"]);
        integers(record.bits, 8);
        if (record.uv_quad_bits !== null) {
          assert.equal(record.uv_quad_bits.length, 4);
          for (const bits of record.uv_quad_bits) {
            integers(bits, 4);
          }
        }
        break;
      case "target":
        unique(targets, record);
        optionalIntegers(record.clear_bits, 4);
        optionalIntegers(record.render_area, 4, true);
        integers(record.draw_size, 2);
        integers(record.draw_offset, 2, true);
        integers(record.size, 2);
        strings(record, ["source", "format", "filter", "swizzle"]);
        assert.equal(record.provenance, "cpu-allocation");
        break;
      case "clear":
        assert.ok(targets.has(record.target));
        assert.ok(!cleared.has(record.target));
        assert.ok(["Load", "Clear", "DontCare"].includes(record.color_load));
        optionalIntegers(record.framebuffer_clear_rect, 4, true);
        assert.equal(record.precise, false, "untraced precise clear");
        assert.equal(typeof record.with_quads, "boolean");
        cleared.add(record.target);
        break;
      case "quad-input":
        unique(quads, record);
        integers(record.words, 4, true);
        assert.ok(tasks.has(record.words[3]), "missing destination task");
        sourcesKnown(record.sources);
        integers(record.header, 4, true);
        strings(record, ["binding"]);
        assert.ok(
          Number.isInteger(record.transform_id) && record.transform_id >= 0
        );
        assert.ok([5, 7].includes(record.bits.length));
        for (const bits of record.bits) {
          integers(bits, 4);
        }
        assert.equal(record.transform_bits.length, 2);
        for (const bits of record.transform_bits) {
          integers(bits, 16);
        }
        break;
      case "quad-draw": {
        const input = quads.get(record.id);
        const target = targets.get(record.target);
        assert.ok(input && target, "missing actual draw join");
        assert.ok(cleared.has(record.target), "missing clear plan");
        assert.equal(record.pass, target.pass);
        assert.equal(
          tasks.get(input.words[3]).source,
          target.source,
          "task/target mismatch"
        );
        optionalIntegers(record.framebuffer_scissor, 4, true);
        integers(record.projection_bits, 16);
        strings(record, ["pattern", "blend"]);
        draws++;
        assert.equal(record.draw, draws);
        quadDraws.add(record.id);
        if (input.sources.some(source => reached.has(source))) {
          reached.add(target.source);
        }
        break;
      }
      case "composite-input":
        unique(composites, record);
        integers(record.bits, 38);
        strings(record, ["binding", "tile_id", "surface_kind"]);
        assert.ok(
          Number.isInteger(record.tile_index) && record.tile_index >= 0
        );
        assert.ok(
          ["color", "texture", "external"].includes(record.surface_kind)
        );
        integers([record.features], 1);
        // Texture records may be emitted at batch flush, after these inputs.
        if (record.surface_kind === "external") {
          integers(record.external_surface, 1);
          const surface = surfaces.get(record.external_surface[0]);
          assert.ok(
            surface && record.sources.includes(surface.source),
            "missing external surface join"
          );
        } else {
          assert.equal(record.external_surface, null);
        }
        break;
      case "composite-draw": {
        const input = composites.get(record.id);
        assert.ok(
          input && !compositeDraws.has(record.id),
          "missing or repeated composite join"
        );
        assert.equal(record.binding, input.binding);
        assert.equal(record.features, input.features);
        assert.deepEqual(record.bits, input.bits);
        integers(record.projection_bits, 16);
        strings(record, ["blend"]);
        assert.ok(
          compositionPasses.has(record.composition_pass),
          "missing composite pass"
        );
        optionalIntegers(record.texture_size_uniform_bits, 2);
        sourcesKnown(input.sources);
        presented ||= input.sources.some(source => reached.has(source));
        compositeDraws.add(record.id);
        break;
      }
      case "composite-pass":
        unique(compositionPasses, record);
        integers(record.draw_size, 2);
        integers(record.draw_offset, 2, true);
        integers(record.clear_bits, 4);
        assert.ok(["Load", "Clear"].includes(record.color_load));
        assert.equal(record.provenance, "cpu-draw-target");
        assert.equal(record.format, null);
        break;
      case "composite-clear":
        assert.ok(compositionPasses.has(record.composition_pass));
        integers(record.framebuffer_clear_rect, 4, true);
        break;
      default:
        assert.fail(`unexpected event: ${record.event}`);
    }
  }
  assert.ok(textures.has(begin.source), "missing selected source");
  assert.ok(presented, "selected source never reaches composition");
  assert.equal(end.reason, "");
  assert.equal(end.quad_inputs, quads.size);
  assert.equal(end.quad_draws, draws);
  assert.equal(quadDraws.size, quads.size, "unemitted quad input");
  assert.equal(end.composite_draws, compositeDraws.size);
  assert.equal(
    compositeDraws.size,
    composites.size,
    "unemitted composite input"
  );
  assert.ok(
    draws <= 128 &&
      composites.size <= 64 &&
      tasks.size + targets.size + compositionPasses.size <= 64
  );
  return {
    submission: begin.submission,
    quads: quads.size,
    draws,
    composites: composites.size,
  };
}
