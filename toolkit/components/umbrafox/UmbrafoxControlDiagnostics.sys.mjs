/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const MEMORY_REPORT_FILENAME_RE = /^[A-Za-z0-9._-]+$/;
const MAX_URL_LENGTH = 2048;

function createError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function assertObject(value, name) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createError("invalid argument", `Expected ${name} to be an object`);
  }
}

function assertString(value, name) {
  if (typeof value !== "string") {
    throw createError("invalid argument", `Expected ${name} to be a string`);
  }
}

function truncate(value, maxLength = MAX_URL_LENGTH) {
  if (typeof value !== "string") {
    return value ?? null;
  }
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function safeRead(callback, fallback = null) {
  try {
    return callback();
  } catch {
    return fallback;
  }
}

function getGfxInfo() {
  return safeRead(() =>
    Cc["@mozilla.org/gfx/info;1"].getService(Ci.nsIGfxInfo)
  );
}

function readGfxProperty(gfxInfo, property) {
  return safeRead(() => gfxInfo[property]);
}

function readGraphicsWindows() {
  const windows = [];
  let index = 0;

  for (const win of Services.ww.getWindowEnumerator()) {
    const entry = {
      index: index++,
      type: safeRead(() =>
        win.document?.documentElement?.getAttribute("windowtype")
      ),
      devicePixelRatio: safeRead(() => win.devicePixelRatio),
      layerManagerType: null,
      layerManagerRemote: null,
    };

    const winUtils = safeRead(() => win.windowUtils);
    if (winUtils) {
      entry.layerManagerType = safeRead(() => winUtils.layerManagerType);
      entry.layerManagerRemote = safeRead(() => winUtils.layerManagerRemote);
    }

    windows.push(entry);
  }

  return windows;
}

function readGraphicsSnapshot() {
  const gfxInfo = getGfxInfo();
  const snapshot = {
    collectedAt: Date.now(),
    nowMs: ChromeUtils.now(),
    desktopEnvironment: Services.appinfo.desktopEnvironment,
    windows: readGraphicsWindows(),
    adapters: [],
    features: null,
    info: null,
    failures: [],
    failureIndices: [],
    featureLog: null,
    crashGuards: [],
  };

  if (!gfxInfo) {
    snapshot.error = "nsIGfxInfo unavailable";
    return snapshot;
  }

  const adapterProperties = [
    "adapterDescription",
    "adapterVendorID",
    "adapterDeviceID",
    "adapterSubsysID",
    "adapterRAM",
    "adapterDriver",
    "adapterDriverVendor",
    "adapterDriverVersion",
    "adapterDriverDate",
    "adapterDescription2",
    "adapterVendorID2",
    "adapterDeviceID2",
    "adapterSubsysID2",
    "adapterRAM2",
    "adapterDriver2",
    "adapterDriverVendor2",
    "adapterDriverVersion2",
    "adapterDriverDate2",
    "isGPU2Active",
  ];

  for (const property of adapterProperties) {
    snapshot.adapters.push({
      property,
      value: readGfxProperty(gfxInfo, property),
    });
  }

  for (const property of [
    "DWriteEnabled",
    "DWriteVersion",
    "TargetFrameRate",
    "windowProtocol",
    "fontVisibilityDeterminationStr",
    "CodecSupportInfo",
  ]) {
    snapshot[property] = readGfxProperty(gfxInfo, property);
  }

  snapshot.features = safeRead(() => gfxInfo.getFeatures());
  snapshot.info = safeRead(() => gfxInfo.getInfo());
  const failureIndices = {};
  snapshot.failures = safeRead(() => gfxInfo.getFailures(failureIndices), []);
  snapshot.failureIndices = failureIndices.value ?? [];
  snapshot.featureLog = safeRead(() => gfxInfo.getFeatureLog());
  snapshot.crashGuards = safeRead(() => gfxInfo.getActiveCrashGuards(), []);

  return snapshot;
}

function readAudioDevices(winUtils, type) {
  return safeRead(() => {
    const devices = winUtils.audioDevices(type).QueryInterface(Ci.nsIArray);
    const infos = [];
    for (let i = 0; i < devices.length; i++) {
      const device = devices.queryElementAt(i, Ci.nsIAudioDeviceInfo);
      infos.push({
        name: device.name,
        groupId: device.groupId,
        vendor: device.vendor,
        type: device.type,
        state: device.state,
        preferred: device.preferred,
        supportedFormat: device.supportedFormat,
        defaultFormat: device.defaultFormat,
        maxChannels: device.maxChannels,
        defaultRate: device.defaultRate,
        maxRate: device.maxRate,
        minRate: device.minRate,
        maxLatency: device.maxLatency,
        minLatency: device.minLatency,
      });
    }
    return infos;
  });
}

function readAudioSnapshot() {
  const winUtils = Services.wm.getMostRecentWindow("")?.windowUtils;
  if (!winUtils) {
    return {
      error: "No window available",
    };
  }

  return {
    currentAudioBackend: safeRead(() => winUtils.currentAudioBackend),
    currentMaxAudioChannels: safeRead(() => winUtils.currentMaxAudioChannels),
    currentPreferredSampleRate: safeRead(
      () => winUtils.currentPreferredSampleRate
    ),
    audioOutputDevices: readAudioDevices(
      winUtils,
      Ci.nsIDOMWindowUtils.AUDIO_OUTPUT
    ),
    audioInputDevices: readAudioDevices(
      winUtils,
      Ci.nsIDOMWindowUtils.AUDIO_INPUT
    ),
  };
}

function getContextURL(context) {
  return truncate(
    safeRead(() => context.currentURI?.spec) ??
      safeRead(() => context.currentWindowGlobal?.documentURI?.spec)
  );
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

  return context;
}

function* walkBrowsingContexts(context) {
  if (!context || context.isDiscarded) {
    return;
  }

  yield context;
  for (const child of context.children) {
    yield* walkBrowsingContexts(child);
  }
}

function getOpenTabContexts() {
  const tabs = [];
  let windowIndex = 0;

  for (const chromeWindow of Services.wm.getEnumerator("navigator:browser")) {
    let tabIndex = 0;
    for (const tab of chromeWindow.gBrowser?.tabs ?? []) {
      const browser = tab.linkedBrowser;
      if (browser?.browsingContext) {
        tabs.push({
          windowIndex,
          tabIndex,
          context: browser.browsingContext,
          label: tab.label ?? "",
          selected: tab.selected,
          pinned: tab.pinned,
        });
      }
      tabIndex++;
    }
    windowIndex++;
  }

  return tabs;
}

async function readFrameMedia(context) {
  const windowGlobal = context.currentWindowGlobal;
  if (!windowGlobal) {
    return {
      context: context.id,
      parentContext: context.parent?.id ?? null,
      isTop: context.top === context,
      processID: null,
      url: getContextURL(context),
      mediaElements: [],
      error: "No active window global",
    };
  }

  try {
    const result = await windowGlobal
      .getActor("UmbrafoxControlDiagnostics")
      .sendQuery("UmbrafoxControlDiagnostics:MediaSnapshot", {});
    return {
      context: context.id,
      parentContext: context.parent?.id ?? null,
      isTop: context.top === context,
      processID: windowGlobal.osPid ?? null,
      url: getContextURL(context),
      ...result,
    };
  } catch (error) {
    return {
      context: context.id,
      parentContext: context.parent?.id ?? null,
      isTop: context.top === context,
      processID: windowGlobal.osPid ?? null,
      url: getContextURL(context),
      mediaElements: [],
      error: error.message,
    };
  }
}

function normalizeWindowInfo(windowInfo) {
  return {
    outerWindowId: windowInfo.outerWindowId,
    documentURI: truncate(safeRead(() => windowInfo.documentURI?.spec)),
    documentTitle: windowInfo.documentTitle,
    isProcessRoot: windowInfo.isProcessRoot,
    isInProcess: windowInfo.isInProcess,
  };
}

function normalizeThreadInfo(thread) {
  return {
    tid: thread.tid,
    name: thread.name,
    cpuTime: thread.cpuTime,
    cpuTimeMs: Math.round(thread.cpuTime / 1000000),
    cpuCycleCount: thread.cpuCycleCount,
  };
}

function normalizeProcessInfo(process, options = {}) {
  const info = {
    pid: process.pid,
    type: process.type,
    childID: process.childID ?? null,
    origin: truncate(process.origin),
    memory: process.memory,
    cpuTime: process.cpuTime,
    cpuTimeMs: Math.round(process.cpuTime / 1000000),
    cpuCycleCount: process.cpuCycleCount,
    threadCount: process.threads?.length ?? 0,
    utilityActors: (process.utilityActors ?? []).map(actor => actor.actorName),
  };

  if (options.includeThreads) {
    info.threads = (process.threads ?? []).map(normalizeThreadInfo);
  }

  if (options.includeWindows ?? true) {
    info.windows = (process.windows ?? []).map(normalizeWindowInfo);
  }

  if (process.children) {
    info.children = process.children.map(child =>
      normalizeProcessInfo(child, options)
    );
  }

  return info;
}

function accumulateProcessTotals(process, totals) {
  totals.processCount++;
  totals.memory += process.memory ?? 0;
  totals.cpuTime += process.cpuTime ?? 0;

  const type = process.type ?? "unknown";
  const byType = totals.byType[type] ?? {
    processCount: 0,
    memory: 0,
    cpuTime: 0,
  };
  byType.processCount++;
  byType.memory += process.memory ?? 0;
  byType.cpuTime += process.cpuTime ?? 0;
  totals.byType[type] = byType;

  for (const child of process.children ?? []) {
    accumulateProcessTotals(child, totals);
  }
}

function getProcessTotals(process) {
  const totals = {
    processCount: 0,
    memory: 0,
    cpuTime: 0,
    byType: {},
  };
  accumulateProcessTotals(process, totals);
  totals.cpuTimeMs = Math.round(totals.cpuTime / 1000000);
  for (const byType of Object.values(totals.byType)) {
    byType.cpuTimeMs = Math.round(byType.cpuTime / 1000000);
  }
  return totals;
}

function getProfilerBufferInfo() {
  const currentPosition = {};
  const totalSize = {};
  const generation = {};
  safeRead(() =>
    Services.profiler.GetBufferInfo(currentPosition, totalSize, generation)
  );
  return {
    currentPosition: currentPosition.value ?? null,
    totalSize: totalSize.value ?? null,
    generation: generation.value ?? null,
  };
}

function getProfilerStatus() {
  return {
    active: Services.profiler.IsActive(),
    paused: safeRead(() => Services.profiler.IsPaused(), false),
    samplingPaused: safeRead(() => Services.profiler.IsSamplingPaused(), false),
    elapsedTimeMs: safeRead(() => Services.profiler.getElapsedTime()),
    buffer: getProfilerBufferInfo(),
    activeConfiguration: safeRead(() => Services.profiler.activeConfiguration),
    supportedFeatures: safeRead(() => [...Services.profiler.GetFeatures()], []),
    allFeatures: safeRead(() => [...Services.profiler.GetAllFeatures()], []),
  };
}

async function readProcessSnapshot(params = {}) {
  assertObject(params, "params");
  const processInfo = await ChromeUtils.requestProcInfo();
  const options = {
    includeThreads: !!params.includeThreads,
    includeWindows: params.includeWindows ?? true,
  };

  return {
    collectedAt: Date.now(),
    nowMs: ChromeUtils.now(),
    processID: Services.appinfo.processID,
    cpuTimeSinceProcessStartMs: ChromeUtils.cpuTimeSinceProcessStart,
    profiler: getProfilerStatus(),
    process: normalizeProcessInfo(processInfo, options),
    totals: getProcessTotals(processInfo),
  };
}

function getDecoderProcessSummary(processSnapshot) {
  const decoderProcesses = [];
  const stack = [processSnapshot.process];

  while (stack.length) {
    const process = stack.pop();
    if (
      process.type === "rdd" ||
      process.type === "gpu" ||
      process.utilityActors.length
    ) {
      decoderProcesses.push({
        pid: process.pid,
        type: process.type,
        memory: process.memory,
        cpuTime: process.cpuTime,
        cpuTimeMs: process.cpuTimeMs,
        utilityActors: process.utilityActors,
      });
    }
    stack.push(...(process.children ?? []));
  }

  return decoderProcesses.sort((a, b) => a.pid - b.pid);
}

function normalizeProfileFilename(filename) {
  const normalized = filename ?? `umbrafox-profile-${Date.now()}.json`;
  assertString(normalized, "filename");
  if (
    !normalized ||
    normalized == "." ||
    normalized == ".." ||
    !MEMORY_REPORT_FILENAME_RE.test(normalized)
  ) {
    throw createError(
      "invalid argument",
      "filename must contain only letters, numbers, dot, underscore, or dash"
    );
  }
  return normalized.endsWith(".json") ? normalized : `${normalized}.json`;
}

export const UmbrafoxControlDiagnostics = {
  gfxSnapshot() {
    return readGraphicsSnapshot();
  },

  async mediaSnapshot(params = {}) {
    assertObject(params, "params");

    const processSnapshot = await readProcessSnapshot({
      includeThreads: false,
      includeWindows: false,
    });
    const gfxInfo = getGfxInfo();
    const tabs = [];
    const requestedContext =
      params.context === undefined ? null : getBrowsingContext(params.context);
    const tabContexts = requestedContext
      ? [
          {
            windowIndex: null,
            tabIndex: null,
            context: requestedContext.top,
            label: "",
            selected: null,
            pinned: null,
          },
        ]
      : getOpenTabContexts();

    for (const tab of tabContexts) {
      const frames = [];
      for (const frameContext of walkBrowsingContexts(tab.context)) {
        const frame = await readFrameMedia(frameContext);
        if (
          params.includeEmptyFrames ||
          frame.mediaElements.length ||
          frame.error
        ) {
          frames.push(frame);
        }
      }

      tabs.push({
        windowIndex: tab.windowIndex,
        tabIndex: tab.tabIndex,
        context: tab.context.id,
        label: tab.label,
        selected: tab.selected,
        pinned: tab.pinned,
        url: getContextURL(tab.context),
        frames,
      });
    }

    return {
      collectedAt: Date.now(),
      nowMs: ChromeUtils.now(),
      audio: readAudioSnapshot(),
      codecSupportInfo: gfxInfo
        ? readGfxProperty(gfxInfo, "CodecSupportInfo")
        : null,
      decoderProcesses: getDecoderProcessSummary(processSnapshot),
      tabs,
    };
  },

  performanceSnapshot(params = {}) {
    return readProcessSnapshot(params);
  },

  async dumpProfile(params = {}) {
    assertObject(params, "params");
    if (!Services.profiler.IsActive()) {
      throw createError("invalid state", "The profiler is not active");
    }

    const filename = normalizeProfileFilename(params.filename);
    const directory = PathUtils.join(
      PathUtils.profileDir,
      "umbrafox",
      "diagnostics",
      "profiles"
    );
    const path = PathUtils.join(directory, filename);
    await IOUtils.makeDirectory(directory, {
      ignoreExisting: true,
      permissions: 0o700,
    });
    await Services.profiler.dumpProfileToFileAsync(path, params.sinceTime ?? 0);
    await IOUtils.setPermissions(path, 0o600);
    return { path };
  },
};
