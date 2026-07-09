/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const lazy = {};

ChromeUtils.defineESModuleGetters(lazy, {
  JSONFile: "resource://gre/modules/JSONFile.sys.mjs",
});

export const USERLAND_SCRIPT_STORE_VERSION = 1;
export const USERLAND_SCRIPT_DEFAULT_CODE =
  "/* Feel free to visit the help at `about:umbrafox-userland` */";

const DEFAULT_TARGET_KINDS = Object.freeze(["document"]);
const VALID_TARGET_KINDS = Object.freeze([
  "document",
  "frame",
  "dedicated_worker",
  "shared_worker",
  "service_worker",
]);

function defaultStorePath() {
  return PathUtils.join(
    PathUtils.profileDir,
    "umbrafox",
    "userland-scripts.json"
  );
}

function clone(value) {
  return structuredClone(value);
}

function makeId() {
  return Services.uuid.generateUUID().toString().slice(1, -1);
}

function normalizeName(name) {
  if (typeof name != "string") {
    throw new TypeError("Userland script name must be a string");
  }
  const normalized = name.trim();
  if (!normalized) {
    throw new TypeError("Userland script name must not be empty");
  }
  return normalized;
}

function normalizeCode(code) {
  if (code === undefined) {
    return "";
  }
  if (typeof code != "string") {
    throw new TypeError("Userland script code must be a string");
  }
  return code;
}

function normalizeOrigin(origin) {
  if (typeof origin != "string" || !origin) {
    throw new TypeError("Userland script scope origin must be a string");
  }

  let url;
  try {
    url = new URL(origin);
  } catch {
    throw new TypeError(`Invalid userland script scope origin: ${origin}`);
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new TypeError(`Unsupported userland script scope origin: ${origin}`);
  }

  return url.origin;
}

function normalizeTargetKinds(targetKinds = DEFAULT_TARGET_KINDS) {
  if (!Array.isArray(targetKinds) || !targetKinds.length) {
    throw new TypeError(
      "Userland script targetKinds must be a non-empty array"
    );
  }

  const normalized = [];
  for (const targetKind of targetKinds) {
    if (!VALID_TARGET_KINDS.includes(targetKind)) {
      throw new TypeError(
        `Unsupported userland script target kind: ${targetKind}`
      );
    }
    if (!normalized.includes(targetKind)) {
      normalized.push(targetKind);
    }
  }
  return normalized;
}

function normalizeSourceUrlPattern(sourceUrlPattern = null) {
  if (sourceUrlPattern === null) {
    return null;
  }
  if (typeof sourceUrlPattern != "string") {
    throw new TypeError(
      "Userland script sourceUrlPattern must be null or a string"
    );
  }
  return sourceUrlPattern;
}

function normalizeScope(scope = {}) {
  return {
    origin: normalizeOrigin(scope.origin),
    targetKinds: normalizeTargetKinds(scope.targetKinds),
    sourceUrlPattern: normalizeSourceUrlPattern(scope.sourceUrlPattern),
  };
}

function normalizeWorld(world = "default") {
  if (typeof world != "string" || !world.trim()) {
    throw new TypeError("Userland script world must be a non-empty string");
  }
  return world.trim();
}

function normalizeEnabled(enabled = false) {
  return !!enabled;
}

function normalizeTimestamp(timestamp, fallback) {
  return Number.isSafeInteger(timestamp) && timestamp >= 0
    ? timestamp
    : fallback;
}

function normalizeScript(record) {
  if (!record || typeof record != "object") {
    return null;
  }

  const now = Date.now();
  try {
    const createdAt = normalizeTimestamp(record.createdAt, now);
    return {
      id:
        typeof record.id == "string" && record.id.trim()
          ? record.id.trim()
          : makeId(),
      name: normalizeName(record.name),
      enabled: normalizeEnabled(record.enabled),
      scope: normalizeScope(record.scope),
      world: normalizeWorld(record.world),
      code: normalizeCode(record.code),
      createdAt,
      updatedAt: normalizeTimestamp(record.updatedAt, createdAt),
    };
  } catch {
    return null;
  }
}

function normalizeStoreData(data) {
  const normalized = {
    version: USERLAND_SCRIPT_STORE_VERSION,
    scripts: [],
  };

  if (!data || typeof data != "object" || !Array.isArray(data.scripts)) {
    return normalized;
  }

  const seenIds = new Set();
  for (const record of data.scripts) {
    const script = normalizeScript(record);
    if (!script || seenIds.has(script.id)) {
      continue;
    }
    seenIds.add(script.id);
    normalized.scripts.push(script);
  }

  return normalized;
}

/**
 * Profile-local storage for Umbrafox userland script records.
 */
export class UmbrafoxUserlandScriptStore {
  constructor({ path = defaultStorePath(), finalizeAt = undefined } = {}) {
    this.path = path;
    this._file = new lazy.JSONFile({
      path,
      sanitizedBasename: "umbrafoxuserlandscripts",
      dataPostProcessor: normalizeStoreData,
      beforeSave: () =>
        IOUtils.makeDirectory(PathUtils.parent(path), {
          createAncestors: true,
        }),
      finalizeAt,
    });
  }

  async load() {
    await this._file.load();
  }

  async finalize() {
    await this._file.finalize();
  }

  _ensureReady() {
    if (!this._file.dataReady) {
      throw new Error("Userland script store has not been loaded");
    }
  }

  _saveSoon() {
    this._file.saveSoon();
  }

  listScripts() {
    this._ensureReady();
    return clone(this._file.data.scripts);
  }

  getScript(id) {
    this._ensureReady();
    const script = this._file.data.scripts.find(
      candidate => candidate.id == id
    );
    return script ? clone(script) : null;
  }

  createScript({
    name = "New Userland Script",
    enabled = false,
    scope,
    world = "default",
    code = USERLAND_SCRIPT_DEFAULT_CODE,
  } = {}) {
    this._ensureReady();

    const now = Date.now();
    const script = {
      id: makeId(),
      name: normalizeName(name),
      enabled: normalizeEnabled(enabled),
      scope: normalizeScope(scope),
      world: normalizeWorld(world),
      code: normalizeCode(code),
      createdAt: now,
      updatedAt: now,
    };

    this._file.data.scripts.push(script);
    this._saveSoon();
    return clone(script);
  }

  updateScript(id, patch) {
    this._ensureReady();
    if (!patch || typeof patch != "object") {
      throw new TypeError("Userland script update patch must be an object");
    }

    const script = this._file.data.scripts.find(
      candidate => candidate.id == id
    );
    if (!script) {
      throw new Error(`Unknown userland script: ${id}`);
    }

    if ("name" in patch) {
      script.name = normalizeName(patch.name);
    }
    if ("enabled" in patch) {
      script.enabled = normalizeEnabled(patch.enabled);
    }
    if ("scope" in patch) {
      script.scope = normalizeScope({
        ...script.scope,
        ...(patch.scope || {}),
      });
    }
    if ("world" in patch) {
      script.world = normalizeWorld(patch.world);
    }
    if ("code" in patch) {
      script.code = normalizeCode(patch.code);
    }

    script.updatedAt = Date.now();
    this._saveSoon();
    return clone(script);
  }

  setScriptEnabled(id, enabled) {
    return this.updateScript(id, { enabled });
  }

  deleteScript(id) {
    this._ensureReady();
    const index = this._file.data.scripts.findIndex(script => script.id == id);
    if (index == -1) {
      return false;
    }

    this._file.data.scripts.splice(index, 1);
    this._saveSoon();
    return true;
  }

  clear() {
    this._ensureReady();
    this._file.data = normalizeStoreData(null);
    this._saveSoon();
  }
}
