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
const VALID_BUTTONS = new Set([0, 1, 2, 3, 4]);

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

function assertString(value, name) {
  if (typeof value !== "string") {
    throw createError("invalid argument", `Expected ${name} to be a string`);
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

function getEventWindow(context) {
  const eventWindow = context.currentWindowGlobal;
  if (!eventWindow) {
    throw createError(
      "no such frame",
      `Browsing context ${context.id} has no active window`
    );
  }
  return eventWindow;
}

function getInputActor(context) {
  return getEventWindow(context).getActor("UmbrafoxControlInput");
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

function getPointerPoint(context, params) {
  const hasX = params.x !== undefined;
  const hasY = params.y !== undefined;
  if (hasX !== hasY) {
    throw createError("invalid argument", "Expected x and y together");
  }
  if (hasX) {
    const point = { x: params.x, y: params.y };
    assertFiniteNumber(point.x, "x");
    assertFiniteNumber(point.y, "y");
    return point;
  }

  return gLastPointerPointByContext.get(context.id) ?? { x: 0, y: 0 };
}

function getButton(params) {
  const button = params.button ?? 0;
  assertNonNegativeInteger(button, "button");
  if (!VALID_BUTTONS.has(button)) {
    throw createError("invalid argument", "button must be between 0 and 4");
  }
  return button;
}

function getButtonsForButton(button) {
  if (button === 0) {
    return 1;
  }
  if (button === 1) {
    return 4;
  }
  if (button === 2) {
    return 2;
  }
  return 1 << button;
}

function getButtons(params, fallback) {
  const buttons = params.buttons ?? fallback;
  assertNonNegativeInteger(buttons, "buttons");
  return buttons;
}

function getModifiers(params) {
  return {
    altKey: params.altKey ?? false,
    ctrlKey: params.ctrlKey ?? false,
    metaKey: params.metaKey ?? false,
    shiftKey: params.shiftKey ?? false,
  };
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

function getChromePoint(context, point) {
  const browserRect = context.embedderElement.getBoundingClientRect();
  return {
    x: browserRect.left + point.x,
    y: browserRect.top + point.y,
  };
}

async function dispatchMouseAtPoint(context, point, eventData) {
  const chromePoint = getChromePoint(context, point);
  await lazy.event.synthesizeMouseAtPoint(
    chromePoint.x,
    chromePoint.y,
    {
      id: 0,
      allowToHandleDragDrop: true,
      asyncEnabled: true,
      ...eventData,
    },
    context.topChromeWindow
  );
}

async function dispatchWheelAtPoint(context, point, eventData) {
  const chromePoint = getChromePoint(context, point);
  await lazy.event.synthesizeWheelAtPoint(
    chromePoint.x,
    chromePoint.y,
    {
      asyncEnabled: true,
      ...eventData,
    },
    context.topChromeWindow
  );
}

function getKeyData(params) {
  assertString(params.key, "key");
  if (!params.key) {
    throw createError("invalid argument", "key must not be empty");
  }
  return { key: params.key, ...getModifiers(params) };
}

export const UmbrafoxControlInput = {
  async click(params = {}) {
    const context = getBrowsingContext(params.context);
    const point = getPointerPoint(context, params);
    const button = getButton(params);
    const clickCount = params.clickCount ?? 1;
    assertNonNegativeInteger(clickCount, "clickCount");
    if (!clickCount) {
      throw createError("invalid argument", "clickCount must be at least 1");
    }

    await dispatchMouseAtPoint(context, point, {
      button,
      clickCount,
      ...getModifiers(params),
    });
    gLastPointerPointByContext.set(context.id, point);

    return {
      context: context.id,
      point,
      button,
      clickCount,
    };
  },

  async keyDown(params = {}) {
    const context = getBrowsingContext(params.context);
    const key = getKeyData(params);
    const result = await getInputActor(context).sendQuery(
      "UmbrafoxControlInput:KeyDown",
      key
    );

    return {
      context: context.id,
      ...result,
    };
  },

  async keyUp(params = {}) {
    const context = getBrowsingContext(params.context);
    const key = getKeyData(params);
    const result = await getInputActor(context).sendQuery(
      "UmbrafoxControlInput:KeyUp",
      key
    );

    return {
      context: context.id,
      ...result,
    };
  },

  async pointerDown(params = {}) {
    const context = getBrowsingContext(params.context);
    const point = getPointerPoint(context, params);
    const button = getButton(params);

    await dispatchMouseAtPoint(context, point, {
      type: "mousedown",
      button,
      buttons: getButtons(params, getButtonsForButton(button)),
      ...getModifiers(params),
    });
    gLastPointerPointByContext.set(context.id, point);

    return {
      context: context.id,
      point,
      button,
    };
  },

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
      await dispatchMouseAtPoint(context, point, {
        type: "mousemove",
        button: 0,
        buttons: 0,
      });
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

  async pointerUp(params = {}) {
    const context = getBrowsingContext(params.context);
    const point = getPointerPoint(context, params);
    const button = getButton(params);

    await dispatchMouseAtPoint(context, point, {
      type: "mouseup",
      button,
      buttons: getButtons(params, 0),
      ...getModifiers(params),
    });
    gLastPointerPointByContext.set(context.id, point);

    return {
      context: context.id,
      point,
      button,
    };
  },

  async type(params = {}) {
    const context = getBrowsingContext(params.context);
    assertString(params.text, "text");
    const result = await getInputActor(context).sendQuery(
      "UmbrafoxControlInput:Type",
      { text: params.text }
    );

    return {
      context: context.id,
      ...result,
    };
  },

  async wheel(params = {}) {
    const context = getBrowsingContext(params.context);
    const point = getPointerPoint(context, params);
    const deltaX = params.deltaX ?? 0;
    const deltaY = params.deltaY ?? 0;
    const deltaZ = params.deltaZ ?? 0;
    const deltaMode = params.deltaMode ?? 0;
    assertFiniteNumber(deltaX, "deltaX");
    assertFiniteNumber(deltaY, "deltaY");
    assertFiniteNumber(deltaZ, "deltaZ");
    assertNonNegativeInteger(deltaMode, "deltaMode");

    await dispatchWheelAtPoint(context, point, {
      deltaX,
      deltaY,
      deltaZ,
      deltaMode,
      ...getModifiers(params),
    });
    gLastPointerPointByContext.set(context.id, point);

    return {
      context: context.id,
      point,
      deltaX,
      deltaY,
      deltaZ,
    };
  },

  resetForTests() {
    gLastPointerPointByContext.clear();
  },
};
