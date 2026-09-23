/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const PREF_ENABLED = "umbrafox.control.enabled";
const MAX_RECENT_EVENTS = 80;
const MAX_SLOW_EVENTS = 40;
const SLOW_EVENT_MS = 50;

let enabled = Services.prefs.getBoolPref(PREF_ENABLED, false);
let startedAt = Date.now();
let webNavigationEvents = new Map();
let webNavigationListeners = new Map();
let recentEvents = [];
let slowEvents = [];

function now() {
  return ChromeUtils.now();
}

function increment(map, key, amount = 1) {
  map.set(key, (map.get(key) ?? 0) + amount);
}

function decrement(map, key) {
  const value = (map.get(key) ?? 0) - 1;
  if (value > 0) {
    map.set(key, value);
  } else {
    map.delete(key);
  }
}

function pushBounded(list, value, maxLength) {
  list.push(value);
  if (list.length > maxLength) {
    list.splice(0, list.length - maxLength);
  }
}

function truncate(value, maxLength = 240) {
  if (typeof value != "string") {
    return value ?? null;
  }
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function listenerKey(type, metadata = {}) {
  return `${type}\u0000${metadata.extensionId ?? "<unknown>"}`;
}

function listenerSnapshotEntry(key, count) {
  const [type, extensionId] = key.split("\u0000");
  return { type, extensionId, count };
}

function mapToObject(map) {
  return Object.fromEntries([...map.entries()].sort());
}

Services.prefs.addObserver(PREF_ENABLED, () => {
  enabled = Services.prefs.getBoolPref(PREF_ENABLED, false);
});

export const UmbrafoxDiagnostics = {
  get enabled() {
    return enabled;
  },

  recordWebNavigationListenerAdded(type, metadata = {}) {
    if (!enabled) {
      return;
    }
    increment(webNavigationListeners, listenerKey(type, metadata));
  },

  recordWebNavigationListenerRemoved(type, metadata = {}) {
    if (!enabled) {
      return;
    }
    decrement(webNavigationListeners, listenerKey(type, metadata));
  },

  recordWebNavigationEvent(type, data = {}) {
    if (!enabled) {
      return;
    }
    increment(webNavigationEvents, type);
    pushBounded(
      recentEvents,
      {
        at: Date.now(),
        type,
        listenerCount: data.listenerCount ?? 0,
        browserId: data.browserId ?? null,
        frameId: data.frameId ?? null,
        parentFrameId: data.parentFrameId ?? null,
        url: truncate(data.url),
      },
      MAX_RECENT_EVENTS
    );
  },

  markWebNavigationDispatchStart() {
    return enabled ? now() : 0;
  },

  recordWebNavigationDispatchFinished(type, metadata = {}, startedAtMs = 0) {
    if (!enabled || !startedAtMs) {
      return;
    }

    const elapsedMs = now() - startedAtMs;
    if (elapsedMs < SLOW_EVENT_MS) {
      return;
    }

    pushBounded(
      slowEvents,
      {
        at: Date.now(),
        type,
        extensionId: metadata.extensionId ?? "<unknown>",
        elapsedMs: Math.round(elapsedMs * 100) / 100,
      },
      MAX_SLOW_EVENTS
    );
  },

  snapshot() {
    return {
      enabled,
      startedAt,
      uptimeMs: Date.now() - startedAt,
      webNavigation: {
        events: mapToObject(webNavigationEvents),
        listeners: [...webNavigationListeners.entries()]
          .map(([key, count]) => listenerSnapshotEntry(key, count))
          .sort((a, b) =>
            a.type == b.type
              ? a.extensionId.localeCompare(b.extensionId)
              : a.type.localeCompare(b.type)
          ),
        recentEvents: recentEvents.slice(),
        slowEvents: slowEvents.slice(),
      },
    };
  },

  resetForTests() {
    startedAt = Date.now();
    webNavigationEvents = new Map();
    webNavigationListeners = new Map();
    recentEvents = [];
    slowEvents = [];
  },
};
