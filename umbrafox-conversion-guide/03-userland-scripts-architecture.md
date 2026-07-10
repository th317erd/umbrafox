# Userland scripts architecture

Status: architecture note. The profile-local storage slice, source-tree scope derivation, Debugger context-menu creation path, Debugger footer creation path, domain-scoped `Userland` source-tree folders, source-tree enable checkbox, CodeMirror-backed editable Debugger code surface, async userland wrapper runner, first document-start parser-blocking runtime hook, first document-level userland dialog events, first docshell-backed navigation events, first script-source mutation events, first request events, and first DOM mutation events exist. Worker support, history API interception, loading-state mutation interception, parser/bulk mutation interception, and stronger isolated-world hardening are not implemented yet. HTTP/server redirects are intentionally reserved for future network interception/substitution APIs rather than the `navigation` event.

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
- Enable or disable the script with a checkbox in the source tree and eventually in the editor footer.
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

For documents, the current first path is:

1. Parent startup and DevTools mutations publish the profile-local script list into process `sharedData`, update `Services.ppmm.initialProcessData.umbrafoxUserlandScriptsActive`, and mirror whether any script is enabled into the internal `umbrafox.userlandScripts.active` pref.
2. `ActorManagerParent.sys.mjs` registers the `UmbrafoxUserland` JSWindowActor for browser documents.
3. `toolkit/actors/UmbrafoxUserlandChild.sys.mjs` listens for `DOMDocElementInserted`.
4. If child-local shared data, the active pref, and startup initial process data all say no enabled userland scripts exist, the actor returns without querying the parent or blocking the document. The pref fallback is important for already-running content processes that were created before a user enabled a script.
5. If enabled scripts exist, the child asks `toolkit/actors/UmbrafoxUserlandParent.sys.mjs` for enabled `document` scripts matching the exact HTTP(S) origin.
6. `UmbrafoxUserlandScriptRuntime.sys.mjs` calls `document.blockParsing(promise, { blockScriptCreated: false })` on the unwaived document while the promised script list is fetched and matching wrappers run.
7. The runtime evaluates wrappers with waived page references for `window`, `document`, `globalThis`, `location`, and `navigator`, passes the page `console`, binds bare `alert` to the page window, and uses the page window as the sandbox prototype so ordinary page global lookup works for explicit user scripts. The `userland` binding remains lexical and off page globals.
8. Page parser/script progress is released only after all matching enabled userland scripts resolve.
9. If a script registers dialog, navigation, script-source, request, or mutation listeners through `userland.on(...)`, `UmbrafoxUserlandEventController.sys.mjs` installs per-document hooks for explicit userland control. Dialogs are handled by page-global replacements. Navigation combines a `window.open(...)` wrapper with a native docshell observer bridge keyed by browsing-context id. Script source mutation combines native DOM script-loader/runtime-codegen observer bridges with pre-compile source replacement. Requests use an `http-on-modify-request` observer bridge for the first request-control slice. DOM mutation events use selected native DOM pre-commit hooks for child-list, attribute, and character-data changes after the document has reached `interactive` or `complete`.

The next hardening step is replacing the current system-principal wrapper sandbox with a browser-owned isolated world closer to Firefox WebExtension user-script sandboxes while preserving page-like global lookup. The current path is intentionally limited to explicit enabled user scripts and must not install any Umbrafox or userland marker on page globals.

For workers, the equivalent hook must be earlier than worker script evaluation. Do not ship worker support until we can prove the script runs before worker-global script code and without adding web-visible worker globals.

## Named contexts

All JavaScript execution should be modeled as named contexts:

- Page context: site scripts and page-owned globals.
- Userland context: browser-owned isolated globals for user scripts.
- Browser secret context: non-enumerable privileged implementation state that user scripts can call into but page scripts cannot access.

A userland script must receive a function-scope private API, not a page-visible global. The conceptual wrapper ABI is:

```js
(async function ({
  window,
  document,
  globalThis,
  location,
  navigator,
  console,
  userland,
}) {
  "use strict";

  // User code is wrapped here.
});
```

JavaScript does not allow a `"use strict"` directive inside a function with a destructuring parameter. The generated implementation therefore uses a strict async function with one `context` parameter and destructures the same bindings inside the wrapper body:

```js
(async function (context) {
  "use strict";
  const {
    window,
    document,
    globalThis,
    location,
    navigator,
    console,
    alert,
    userland,
  } = context;

  // User code is wrapped here.
});
```

The single context-object argument is deliberate. Future context fields can be added without breaking existing scripts. The wrapper is async because page script execution must wait until every matching enabled userland wrapper resolves. The `userland` binding is lexical; it must not be installed as `window.userland`, `globalThis.userland`, `navigator.userland`, a DOM property, or any other page-visible marker.

`toolkit/components/umbrafox/UmbrafoxUserlandScriptRunner.sys.mjs` currently generates this wrapper source, freezes the outer context object, and provides `runUserlandScript(...)` and `runUserlandScripts(...)`. The batch runner awaits enabled scripts sequentially. The document-start runtime calls that primitive while parser execution is blocked, then releases page script execution only after it resolves.

When a userland script registers callbacks, hooks, or listeners, page scripts must not be able to enumerate the userland binding. If a listener causes a DOM event or page mutation, the visible event/mutation belongs to the user's enabled script, but the binding machinery must remain invisible.

## Private API shape

The first API should be small and explicit. Do not expose every planned capability in the first patch.

Current API:

```js
userland.info
userland.on(type, handler)
userland.off(type, handler)
userland.addEventListener(type, handler)
userland.removeEventListener(type, handler)
```

Current supported event types:

- `alert`
- `prompt`
- `confirm`
- `navigation`
- `script`
- `request`
- `mutation`

Handlers receive a synchronous cancellable event object:

```js
userland.on("alert", event => {
  event.message = "replacement";
  event.preventDefault();
});

userland.on("prompt", event => {
  event.respondWith("replacement return value");
});

userland.on("confirm", event => {
  event.respondWith(false);
});

userland.on("navigation", event => {
  if (event.href.startsWith("zoom://")) {
    event.preventDefault();
    return;
  }
  event.href = new URL("/rewritten", location.href).href;
});

userland.on("script", event => {
  if (event.uri.endsWith("/app.js")) {
    event.source = event.source.replace("debug = false", "debug = true");
  }
});
```

Implemented navigation event sources:

- `window.open(...)`, including external schemes such as `zoom://` when they pass through that API.
- Primary-button anchor and area clicks.
- Form submit default actions.
- Docshell navigation attempts, including `location.assign(...)`, `location.replace(...)`, `location.href = ...`, hash navigations, meta refresh, and docshell external-protocol paths.

The `navigation` event currently includes `href`, `originalHref`, `source`, `external`, `target`, and native-path fields such as `formSubmission`, `metaRefresh`, `redirect`, `loadType`, and `native`. Setting `event.href` rewrites supported navigations before they proceed; calling `preventDefault()`, `cancel()`, or `respondWith(...)` cancels where the event type supports cancellation.

Native navigation implementation details:

- `nsDocShell::MaybeHandleUmbrafoxUserlandNavigation(...)` emits an internal observer notification before docshell commits the load.
- The observer subject is an internal mutable property bag with `href`, `source`, `target`, `browsingContextId`, `loadType`, `external`, `formSubmission`, `metaRefresh`, and `redirect`.
- The content-process event controller looks up the active document controller by browsing-context id, dispatches `userland.on("navigation", ...)`, and writes back `cancelled` or rewritten `href`.
- `nsDocShellLoadState` carries an internal `UmbrafoxUserlandNavigationHandled` marker, serialized through `DocShellLoadStateInit`, to avoid double dispatch across link/form and `InternalLoad` paths.

Intentional boundary: HTTP/server redirects are network-channel behavior, not user-facing navigation-decision behavior. They should be handled by future network interception/substitution APIs instead of the `navigation` event. History API URL changes still need a separate hook because they do not create normal docshell loads. A JS `nsIContentPolicy` attempt did not catch the `location.assign(...)` path in the browser test and was not kept.

Implemented script-source event sources:

- DOM document classic scripts.
- DOM document JavaScript modules.
- Inline and external DOM script source that reaches Gecko's DOM script compile paths.
- Direct eval source.
- Indirect eval source.
- Function constructor body source.

The `script` event currently includes `source`, `originalSource`, `uri`, `url`, `kind`, `size`, `sourceLength`, `receivedLength`, `lineNumber`, `columnNumber`, `inline`, `external`, `module`, `parserInserted`, `preload`, and `native`. Setting `event.source` rewrites the source before Gecko compiles it. `respondWith(source)` also replaces the source. Calling `preventDefault()` without a replacement substitutes an empty script.

Native script-source implementation details:

- `ScriptLoader::MaybeApplyUmbrafoxUserlandScriptSourceEvent(...)` emits an internal observer notification after source is available and before `CompileGlobalScriptToStencil(...)` or `CompileModuleScriptToStencil(...)`.
- `JSRuntimeCodeSourceTransform` is an Umbrafox-added SpiderMonkey host callback invoked from direct eval, indirect eval, and Function-constructor body compilation before source is compiled.
- `nsScriptSecurityManager::ApplyUmbrafoxUserlandRuntimeScriptSourceEvent(...)` bridges that callback into the same internal observer topic used by DOM script loads.
- The observer subject is an internal mutable property bag with source text, URI, script kind, browsing-context id, length fields, line/column metadata, and inline/module/parser/preload booleans.
- The content-process event controller looks up the active document controller by browsing-context id, dispatches `userland.on("script", ...)`, and writes back rewritten `source`.
- `ScriptLoader::TryUseCache(...)`, `StartLoadInternal(...)`, and `CalculateCacheFlag(...)` avoid compiled stencil cache bypasses while userland scripts are active, so source events are not skipped and mutated compiled stencils are not reused without userland.

Intentional boundary: worker scripts, worklets, import maps, JSON modules, CSS modules, and WebAssembly modules are not covered by the current script-source event slice. The existing CSP/runtime-codegen callback remains boolean-only and is still used only for CSP/codegen policy decisions; source rewriting uses a separate mutable host callback.

Follow-up APIs can cover:

- request substitution for images, scripts, stylesheets, media, fonts, fetch, XHR, WebSocket, EventSource, beacons, and documents;
- notification and external-link policies beyond the currently supported document-level navigation hooks;
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
- a userland script source/editor model; implemented as virtual source-tree items that open editable profile-stored code in a real `SourceEditor`/CodeMirror 6 instance;
- source-tree visibility and enable checkboxes; implemented for scripts matching the current target origin under a `Userland` folder;
- runtime shared-data and initial-process-data publishing; implemented through `UmbrafoxUserlandScriptRegistry.sys.mjs`;
- document-start runtime execution; implemented through `UmbrafoxUserlandScriptRuntime.sys.mjs`, `toolkit/actors/UmbrafoxUserlandChild.sys.mjs`, `toolkit/actors/UmbrafoxUserlandParent.sys.mjs`, and the `UmbrafoxUserland` JSWindowActor registration in `ActorManagerParent.sys.mjs`;
- editor-footer enable checkbox; planned;
- script name editing; planned beyond the initial name prompt;
- dirty-state handling; planned;
- reload-needed indicator when a matching document has already run page scripts; planned.

## Runtime modules

Current and recommended modules:

- `toolkit/components/umbrafox/UmbrafoxUserlandScriptScope.sys.mjs` exists.
- `toolkit/components/umbrafox/UmbrafoxUserlandScriptStore.sys.mjs` exists.
- `toolkit/components/umbrafox/UmbrafoxUserlandScriptRunner.sys.mjs` exists.
- `toolkit/components/umbrafox/UmbrafoxUserlandScriptRegistry.sys.mjs` exists.
- `toolkit/components/umbrafox/UmbrafoxUserlandScriptRuntime.sys.mjs` exists.
- `toolkit/actors/UmbrafoxUserlandParent.sys.mjs` exists.
- `toolkit/actors/UmbrafoxUserlandChild.sys.mjs` exists.

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
- userland scripts appear under a dedicated `Userland` folder below their matching source-tree domain group;
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

The first code patch should be deliberately narrow. The store, scope, source-tree context-menu creation, footer creation, source-tree visibility, source-tree enable checkbox, editable code surface, and async wrapper runner portions are implemented; the rest of this slice remains:

1. Editor affordances for script name and enabled state.
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
