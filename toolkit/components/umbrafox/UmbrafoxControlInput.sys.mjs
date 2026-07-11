/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const lazy = {};

ChromeUtils.defineESModuleGetters(lazy, {
  event: "chrome://remote/content/shared/webdriver/Event.sys.mjs",
  setTimeout: "resource://gre/modules/Timer.sys.mjs",
});

const DEFAULT_STEPS = 16;
const MAX_STEPS = 512;
const MAX_DURATION_MS = 30000;
const VALID_PROFILES = new Set(["linear", "easeInOut", "bezier"]);

const gLastPointerPointByContext = new Map();

function createError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function assertFiniteNumber(value, name) {
  if (!Number.isFinite(value)) {
    throw createError("invalid argument", `Expected ${name} to be a number`);
  }
}

function assertNonNegativeInteger(value, name) {
  if (!Number.isInteger(value) || value < 0) {
    throw createError(
      "invalid argument",
      `Expected ${name} to be a non-negative integer`
    );
  }
}

function getBrowsingContext(contextId) {
  if (contextId === undefined || contextId === null) {
    throw createError("invalid argument", "Expected context to be set");
  }

  const id = typeof contextId === "string" ? Number(contextId) : contextId;
  if (!Number.isInteger(id)) {
    throw createError("invalid argument", "Expected context to be an integer");
  }

  const context = BrowsingContext.get(id);
  if (!context || context.isDiscarded || !context.isContent) {
    throw createError(
      "no such frame",
      `Browsing context ${contextId} not found`
    );
  }

  if (context.top !== context) {
    throw createError(
      "invalid argument",
      "Only top-level browsing contexts are supported for pointerMove"
    );
  }

  return context;
}

function getPointerStart(context, params) {
  const { fromX, fromY } = params;
  if (fromX !== undefined || fromY !== undefined) {
    assertFiniteNumber(fromX, "fromX");
    assertFiniteNumber(fromY, "fromY");
    return { x: fromX, y: fromY };
  }

  return gLastPointerPointByContext.get(context.id) ?? { x: 0, y: 0 };
}

function createPRNG(seed) {
  let state = seed >>> 0;
  return () => {
    state = Math.imul(1664525, state) + 1013904223;
    return (state >>> 0) / 0x100000000;
  };
}

function easeInOut(t) {
  return t * t * (3 - 2 * t);
}

function cubicBezierPoint(start, control1, control2, end, t) {
  const inverse = 1 - t;
  return {
    x:
      inverse ** 3 * start.x +
      3 * inverse ** 2 * t * control1.x +
      3 * inverse * t ** 2 * control2.x +
      t ** 3 * end.x,
    y:
      inverse ** 3 * start.y +
      3 * inverse ** 2 * t * control1.y +
      3 * inverse * t ** 2 * control2.y +
      t ** 3 * end.y,
  };
}

function getBezierControls(start, end, seed) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.hypot(dx, dy);
  if (!distance) {
    return { control1: start, control2: end };
  }

  const random = createPRNG(seed);
  const normal = { x: -dy / distance, y: dx / distance };
  const offset =
    distance * (0.08 + random() * 0.08) * (random() < 0.5 ? -1 : 1);

  return {
    control1: {
      x: start.x + dx * 0.35 + normal.x * offset,
      y: start.y + dy * 0.35 + normal.y * offset,
    },
    control2: {
      x: start.x + dx * 0.7 - normal.x * offset * 0.5,
      y: start.y + dy * 0.7 - normal.y * offset * 0.5,
    },
  };
}

function buildPointerPath(start, end, steps, profile, seed) {
  if (!steps) {
    return [];
  }

  const points = [];
  const { control1, control2 } = getBezierControls(start, end, seed);
  for (let step = 1; step <= steps; step++) {
    const rawT = step / steps;
    const t = profile === "easeInOut" ? easeInOut(rawT) : rawT;
    const point =
      profile === "bezier"
        ? cubicBezierPoint(start, control1, control2, end, t)
        : {
            x: start.x + (end.x - start.x) * t,
            y: start.y + (end.y - start.y) * t,
          };

    points.push({
      x: Math.round(point.x),
      y: Math.round(point.y),
    });
  }

  points[points.length - 1] = { ...end };
  return points;
}

function delay(ms) {
  if (!ms) {
    return Promise.resolve();
  }

  return new Promise(resolve => lazy.setTimeout(resolve, ms));
}

async function dispatchPointerMove(context, point) {
  const browserRect = context.embedderElement.getBoundingClientRect();
  await lazy.event.synthesizeMouseAtPoint(
    browserRect.left + point.x,
    browserRect.top + point.y,
    {
      type: "mousemove",
      button: 0,
      buttons: 0,
      id: 0,
      allowToHandleDragDrop: true,
      asyncEnabled: true,
    },
    context.topChromeWindow
  );
}

export const UmbrafoxControlInput = {
  async pointerMove(params = {}) {
    const context = getBrowsingContext(params.context);
    const start = getPointerStart(context, params);
    const end = { x: params.x, y: params.y };
    assertFiniteNumber(end.x, "x");
    assertFiniteNumber(end.y, "y");

    const steps = params.steps ?? DEFAULT_STEPS;
    const durationMs = params.durationMs ?? 0;
    const profile = params.profile ?? "linear";
    const seed = params.seed ?? 0;

    assertNonNegativeInteger(steps, "steps");
    assertNonNegativeInteger(durationMs, "durationMs");
    assertNonNegativeInteger(seed, "seed");

    if (steps > MAX_STEPS) {
      throw createError("invalid argument", `steps must be <= ${MAX_STEPS}`);
    }
    if (durationMs > MAX_DURATION_MS) {
      throw createError(
        "invalid argument",
        `durationMs must be <= ${MAX_DURATION_MS}`
      );
    }
    if (!VALID_PROFILES.has(profile)) {
      throw createError(
        "invalid argument",
        `Unknown pointer profile: ${profile}`
      );
    }

    const path = buildPointerPath(start, end, steps, profile, seed);
    const delayMs = path.length > 1 ? durationMs / path.length : 0;

    for (const point of path) {
      await dispatchPointerMove(context, point);
      await delay(delayMs);
    }

    gLastPointerPointByContext.set(context.id, end);

    return {
      context: context.id,
      from: start,
      to: end,
      profile,
      seed,
      durationMs,
      path,
    };
  },

  resetForTests() {
    gLastPointerPointByContext.clear();
  },
};
