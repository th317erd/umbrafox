/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

export function arithmeticWorkload() {
  let checksum = 0;
  for (let block = 0; block < 64; block++) {
    const values = new Uint32Array(8192);
    for (let index = 0; index < values.length; index++) {
      values[index] = (Math.imul(index + block, 1664525) + 1013904223) >>> 0;
    }
    for (const value of values) {
      checksum = (checksum + (value ^ (value >>> 13))) >>> 0;
    }
  }
  return checksum;
}

export function pixelHash(pixels) {
  let hash = 2166136261;
  for (const value of pixels) {
    hash = Math.imul(hash ^ value, 16777619) >>> 0;
  }
  return hash;
}

export function fillPixels(pixels) {
  for (let index = 0; index < pixels.length; index += 4) {
    const pixel = index / 4;
    pixels[index] = pixel % 256;
    pixels[index + 1] = Math.floor(pixel / 128) % 256;
    pixels[index + 2] = (pixel * 7) % 256;
    pixels[index + 3] = 255;
  }
}

async function run() {
  const statusOutput = document.querySelector("#status");
  let payload;
  try {
    const response = await fetch("start");
    if (!response.ok) {
      throw new Error("Start gate failed");
    }
    const config = await response.json();
    const rows = [];
    const container = document.querySelector("#rows");
    for (let index = 0; index < 160; index++) {
      const row = document.createElement("div");
      row.className = "row";
      container.append(row);
      rows.push(row);
    }
    const source = document.createElement("canvas");
    source.width = source.height = 128;
    const sourceContext = source.getContext("2d");
    const pixels = sourceContext.createImageData(128, 128);
    fillPixels(pixels.data);
    sourceContext.putImageData(pixels, 0, 0);
    const context = document.querySelector("#canvas").getContext("2d");
    const layout = interleaved => {
      let checksum = 0;
      for (let round = 0; round < 4; round++) {
        for (const row of rows) {
          row.classList.toggle("wide", round % 2 === 0);
          if (interleaved) {
            checksum += row.offsetWidth;
          }
        }
        if (!interleaved) {
          for (const row of rows) {
            checksum += row.offsetWidth;
          }
        }
      }
      return checksum;
    };
    const workloads = {
      js: arithmeticWorkload,
      "dom-batched": () => layout(false),
      "dom-interleaved": () => layout(true),
      canvas: () => {
        for (let copy = 0; copy < 128; copy++) {
          context.drawImage(source, 0, 0);
        }
        return pixelHash(context.getImageData(0, 0, 128, 128).data);
      },
    };
    const samples = [];
    const names = Object.keys(workloads);
    for (const stage of ["warmup", "trial"]) {
      const count = stage === "warmup" ? config.warmup : config.trials;
      for (let index = 0; index < count; index++) {
        for (let offset = 0; offset < names.length; offset++) {
          const workload = names[(index + offset) % names.length];
          await new Promise(resolve => setTimeout(resolve, 20));
          const label = `local-perf:${stage}:${index}:${workload}`;
          performance.mark(`${label}:start`);
          const checksum = workloads[workload]();
          performance.mark(`${label}:end`);
          const measure = performance.measure(
            label,
            `${label}:start`,
            `${label}:end`
          );
          samples.push({
            stage,
            index,
            workload,
            durationMs: measure.duration,
            checksum,
          });
        }
      }
    }
    payload = { version: 1, samples };
  } catch (error) {
    payload = { version: 1, error: String(error.message) };
  }
  try {
    const result = await fetch("result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!result.ok) {
      throw new Error("Result submission failed");
    }
    statusOutput.textContent = payload.error ? "Failed" : "Complete";
  } catch {
    statusOutput.textContent = "Failed";
  }
}

if (typeof document !== "undefined") {
  void run();
}
