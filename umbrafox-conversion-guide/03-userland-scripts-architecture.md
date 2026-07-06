# Userland scripts architecture

Status: architecture note. The profile-local storage slice, source-tree scope derivation, Debugger context-menu creation path, Debugger footer creation path, source-list visibility, and source-list enable checkbox exist. Script editing UI, isolated-world execution, worker support, and network APIs are not implemented yet.

This feature lets users create named scripts from DevTools, persist them in the active profile, and run them in isolated userland worlds for a matching site/thread before normal page JavaScript executes.

## Rulebook review

This feature is allowed by the Umbrafox rulebook only under these constraints:

- No default web-visible behavior changes when no userland script is enabled.
- No `navigator`, `window`, DOM, CSS, WebIDL, header, protocol, or storage marker may reveal Umbrafox.
- Userland APIs must live in browser-owned isolated script worlds, not on page globals.
- Any page-visible mutation is attributable to an explicit user script.
- Any detectable block, rewrite, substitution, proxy, DOM mutation, or timing change is a userland action and must be controlled by an enabled user script.
- Internal DevTools UI may say Umbrafox or Userland because DevTools chrome is not exposed to arbitrary websites.

The first implementation must include a detectability review before it is considered complete.

## Product model

Users can create scripts from the Debugger source tree:

- Right-click a thread, origin group, folder, or source and choose `New Userland Script`.
- Click a persistent `New Script` button in the Debugger footer/status area.
- Name the script.
- Enable or disable the script with a checkbox in the editor footer and, where practical, in the source tree.
- Store the script for the selected scope so it is remembered for future loads.

Initial scopes should be:

- Origin scope: scheme, host, and port.
- Target kind: document, frame, dedicated worker, shared worker, service worker.
- Optional source URL matcher for worker or source-specific scripts.

Do not start with eTLD+1 matching as the only behavior. It is convenient, but origin matching is more predictable and safer as a default. A later UI can add broader domain matching explicitly.

## Execution model

Do not eval userland scripts directly in the page global.

The correct primitive is a separate browser-owned JavaScript global per active userland script or per named userland world. The global should use the page or worker global as its sandbox prototype, similar to Firefox WebExtension user scripts.

Existing Firefox code paths to study and reuse:

- `toolkit/components/extensions/ExtensionContent.sys.mjs`
- `toolkit/components/extensions/ExtensionPolicyService.cpp`
- `toolkit/components/extensions/ExtensionUserScripts.sys.mjs`
- `toolkit/components/extensions/ExtensionUserScriptsContent.sys.mjs`
- `devtools/server/connectors/js-process-actor/target-watchers/content_script.sys.mjs`
- `devtools/server/actors/targets/content-script.js`

The extension user-script implementation already provides important pieces:

- `document_start` execution.
- parser blocking through `document.blockParsing(...)` while compiled scripts are pending.
- a sandbox whose prototype is the content window.
- private APIs installed in the sandbox instead of the page global.
- DevTools content-script target support.

Umbrafox should not expose userland scripts as a normal installed extension. The implementation can reuse the same internal mechanisms, but should present userland scripts as browser-owned DevTools/runtime objects and avoid extension identity artifacts where possible.

## Timing guarantee

The requirement is stronger than ordinary DevTools eval:

- userland document scripts must run before page scripts for matching future documents;
- userland worker scripts must run before worker script code for matching future workers;
- reload is required after creating or changing a script if the current document or worker already executed page JavaScript.

For documents, the likely path is:

1. On document request open, preload and compile matching enabled userland scripts.
2. On document element insertion, create userland worlds for the inner window.
3. Block parser progress while compiled scripts are resolved.
4. Execute userland scripts before page script execution is allowed to continue.
5. Release parser blocking and preserve Firefox page timing when no script is enabled.

For workers, the equivalent hook must be earlier than worker script evaluation. Do not ship worker support until we can prove the script runs before worker-global script code and without adding web-visible worker globals.

## Named contexts

All JavaScript execution should be modeled as named contexts:

- Page context: site scripts and page-owned globals.
- Userland context: browser-owned isolated globals for user scripts.
- Browser secret context: non-enumerable privileged implementation state that user scripts can call into but page scripts cannot access.

A userland script should receive a function-scope private API, not a page-visible global:

```js
function runUserlandScript({ window, document, privateApi }) {
  // User code is wrapped here.
}
```

The wrapper is conceptual. The actual implementation can compile a generated wrapper or install bindings in the sandbox global, but the private API must not be reachable through the page global.

When a userland script registers callbacks, hooks, or listeners, page scripts must not be able to enumerate the userland binding. If a listener causes a DOM event or page mutation, the visible event/mutation belongs to the user's enabled script, but the binding machinery must remain invisible.

## Private API shape

The first API should be small and explicit. Do not expose every planned capability in the first patch.

Initial candidate:

```js
privateApi.info
privateApi.onDocumentStart(callback)
privateApi.onBeforeRequest(filter, callback)
privateApi.replaceResponse(filter, callback)
privateApi.log(...args)
```

Follow-up APIs can cover:

- request substitution for images, scripts, stylesheets, media, fonts, fetch, XHR, WebSocket, EventSource, beacons, and documents;
- native alert, confirm, prompt, notification, and external-link policies;
- DOM and style mutation helpers;
- page-world unsafe eval with a clear detectable-risk label;
- import and export of userland rule packs.

Network APIs must follow Rule 2 and Rule 7. Do not default to canceling a request. Preserve Firefox request shape and substitute client-side unless the user explicitly chooses detectable blocking.

## Persistence

Store scripts in the user profile, not in the source tree and not in remote settings.

Current first storage:

- `ProfD/umbrafox/userland-scripts.json`
- loaded through `JSONFile.sys.mjs`;
- atomic writes;
- schema versioned from the first patch.

Record shape:

```json
{
  "version": 1,
  "scripts": [
    {
      "id": "uuid",
      "name": "Example script",
      "enabled": true,
      "scope": {
        "origin": "https://example.com",
        "targetKinds": ["document"],
        "sourceUrlPattern": null
      },
      "world": "default",
      "code": "",
      "createdAt": 0,
      "updatedAt": 0
    }
  ]
}
```

Do not sync this storage by default. Userland scripts are high-risk executable code and should stay local unless the user explicitly exports or imports them.

## DevTools UI touchpoints

Known files from the current source tree:

- `devtools/client/debugger/src/actions/context-menus/source-tree-item.js`
- `devtools/client/debugger/src/components/PrimaryPanes/SourcesTreeItem.js`
- `devtools/client/debugger/src/components/PrimaryPanes/SourcesTree.js`
- `devtools/client/debugger/src/reducers/sources-tree.js`
- `devtools/client/debugger/src/selectors/sources-tree.js`
- `devtools/client/debugger/src/client/firefox.js`
- `devtools/client/debugger/src/client/firefox/create.js`
- `devtools/client/locales/en-US/debugger.properties`

The Debugger currently uses `debugger.properties` for nearby strings. New UI should prefer Fluent if practical, but the implementation may need a small localization bridge if the Debugger panel cannot consume a new Fluent file cleanly yet.

The UI should add:

- context-menu item for thread/group/directory/source scopes; implemented as a disabled-script creation path;
- footer `New Script` action; implemented as a disabled-script creation path for local tabs;
- a userland script source/editor model; planned;
- source-list visibility and enable checkboxes; implemented for scripts matching the current target origin;
- editor-footer enable checkbox; planned;
- script name editing; planned beyond the initial name prompt;
- dirty-state handling; planned;
- reload-needed indicator when a matching document has already run page scripts; planned.

## Runtime modules

Current and recommended modules:

- `toolkit/components/umbrafox/UmbrafoxUserlandScriptScope.sys.mjs` exists.
- `toolkit/components/umbrafox/UmbrafoxUserlandScriptStore.sys.mjs` exists.
- `toolkit/components/umbrafox/UmbrafoxUserlandScriptsParent.sys.mjs` is planned.
- `toolkit/components/umbrafox/UmbrafoxUserlandScriptsChild.sys.mjs` is planned.

The parent service should:

- own profile storage;
- validate script records;
- answer DevTools CRUD requests;
- publish enabled script matchers to content processes;
- avoid remote settings, studies, telemetry upload, or sponsored integration.

The child service should:

- receive enabled matchers and compiled script metadata;
- create userland worlds for matching windows/workers;
- install private API bindings;
- execute scripts at the earliest safe hook;
- clean up worlds on document/worker teardown and bfcache transitions.

## DevTools target visibility

Userland scripts should be visible in DevTools as internal userland sources, but hidden from page scripts.

Expected UI shape:

- top-level source tree keeps `Main Thread`;
- userland scripts appear under a dedicated internal group such as `Userland Scripts`;
- script names are user-provided;
- disabled scripts remain visible in the userland group, but do not create runtime worlds;
- userland script runtime targets should not be reported as WebExtension content scripts unless reusing that target type is unavoidable.

If we reuse `CONTENT_SCRIPT` targets internally, ensure labels and icons are chrome-only and do not leak into page-visible exception text, source URLs, stack traces exposed to page code, or network requests.

## Network interception model

Network interception is a separate subsystem from script execution.

The private API should communicate requested policies to a browser-owned network substitution layer. That layer must:

- observe matching requests without altering default request shape;
- avoid HEAD-for-GET substitutions unless proven equivalent;
- prefer downstream response substitution over request cancellation;
- keep service worker, cache, CORS, CSP, SRI, Resource Timing, and load/error semantics under detectability review;
- mark explicit user-chosen blocking as detectable in UI.

Do not implement network APIs by monkeypatching page `fetch`, `XMLHttpRequest`, or `WebSocket` as the default path. Monkeypatching can be a userland unsafe option, but browser-owned interception is the rulebook-compliant core.

## First implementation slice

The first code patch should be deliberately narrow. The store, scope, source-tree context-menu creation, footer creation, source-list visibility, and source-list enable checkbox portions are implemented; the rest of this slice remains:

1. Script editor surface for name, enabled state, and code.
2. Document-only isolated-world execution at document_start for future navigations.
3. Tests proving an enabled script runs before the first inline page script.
4. Tests proving no Umbrafox globals are added to `window`, `navigator`, or `document`.

Do not include network interception in the first slice. Add it after the userland world and timing guarantees are proven.

## Verification plan

Minimum tests for the first implementation:

- xpcshell tests for storage schema, migration, and atomic write/read behavior;
- browser mochitest for creating a script from the source tree context menu;
- browser mochitest for the footer `New Script` button;
- browser mochitest for enabled/disabled behavior across reloads;
- browser or xpcshell content-script-style test proving document_start order before inline page script;
- page-observable parity test proving no default `window.umbrafox`, `navigator.umbrafox`, DOM attribute, CSS marker, source URL, or global property is present;
- bfcache or navigation teardown test proving worlds are destroyed and recreated correctly.

Later network tests must compare request method, headers, credentials, cache mode, redirect behavior, load/error events, Resource Timing, CORS, CSP, SRI, service worker visibility, and substitution behavior against Firefox-compatible semantics.

## Open decisions

- Whether userland worlds should be one sandbox per script or one sandbox per named world containing multiple scripts.
- Whether script source URLs should use a chrome-only synthetic protocol or source actor metadata without a URL.
- Whether to expose page-world unsafe eval at all in the first release.
- How to represent worker-specific scopes in UI before worker target support is complete.
- Whether userland script errors should appear only in DevTools or also in the Web Console when the user opts in.
