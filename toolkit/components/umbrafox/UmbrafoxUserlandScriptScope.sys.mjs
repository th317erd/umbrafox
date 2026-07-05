/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function normalizeHttpOrigin(url) {
  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }
    return parsed.origin;
  } catch {
    return null;
  }
}

function getAncestorThreadItem(item) {
  for (let current = item; current; current = current.parent) {
    if (current.type == "thread") {
      return current;
    }
  }
  return null;
}

function getItemOrigin(item) {
  return (
    normalizeHttpOrigin(item?.source?.url) ||
    normalizeHttpOrigin(item?.origin) ||
    normalizeHttpOrigin(item?.thread?.url) ||
    normalizeHttpOrigin(getAncestorThreadItem(item)?.thread?.url)
  );
}

function getTargetKind(item) {
  const thread = item?.thread || getAncestorThreadItem(item)?.thread;
  switch (thread?.targetType) {
    case "worker":
      return "dedicated_worker";
    case "shared_worker":
      return "shared_worker";
    case "service_worker":
      return "service_worker";
    default:
      return "document";
  }
}

export function getUserlandScriptScopeForTreeItem(item) {
  const origin = getItemOrigin(item);
  if (!origin) {
    return null;
  }

  return {
    origin,
    targetKinds: [getTargetKind(item)],
    sourceUrlPattern: null,
  };
}

export function getDefaultUserlandScriptName(item) {
  const scope = getUserlandScriptScopeForTreeItem(item);
  if (!scope) {
    return "New Userland Script";
  }
  return `Userland script for ${new URL(scope.origin).host}`;
}
