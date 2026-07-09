# Userland scripts recipe

Status: incremental feature recipe. The profile-local storage, scope derivation, Debugger context-menu creation, Debugger footer creation, domain-scoped source-tree visibility, source-tree enable checkbox, CodeMirror-backed editable code surface, async wrapper runner, first document-start parser-blocking runtime slice, dialog events, first docshell-backed navigation events, first script-source mutation events, and first document-associated HTTP(S) request interception events exist; see `../03-userland-scripts-architecture.md` before implementing additional slices.

## Goal

Add browser-owned userland scripts that users create from DevTools, save in the active profile, and run in isolated named contexts before matching site JavaScript executes.

## Rulebook requirements

- No behavior change when no userland script is enabled.
- No Umbrafox marker in page-visible JavaScript, CSS, DOM, WebIDL, network, storage, worker, or timing surfaces.
- Userland private APIs must be available only inside isolated userland worlds.
- Page-visible mutations are allowed only as explicit enabled user scripts.
- Request blocking is not the default network model. Prefer browser-owned interception and client-side substitution.

## Source areas

Expected implementation areas:

- `devtools/client/debugger/src/actions/context-menus/source-tree-item.js`
- `devtools/client/debugger/src/utils/umbrafox-userland-scripts.js`
- `devtools/client/debugger/src/components/PrimaryPanes/SourcesTreeItem.js`
- `devtools/client/debugger/src/components/PrimaryPanes/SourcesTree.js`
- `devtools/client/debugger/src/reducers/sources-tree.js`
- `devtools/client/debugger/src/selectors/sources-tree.js`
- `devtools/client/debugger/src/client/firefox.js`
- `devtools/client/debugger/src/client/firefox/create.js`
- `devtools/server/connectors/js-process-actor/target-watchers/content_script.sys.mjs`
- `devtools/server/actors/targets/content-script.js`
- `toolkit/components/extensions/ExtensionContent.sys.mjs`
- `toolkit/actors/UmbrafoxUserlandChild.sys.mjs`
- `toolkit/actors/UmbrafoxUserlandParent.sys.mjs`
- `toolkit/actors/moz.build`
- `toolkit/modules/ActorManagerParent.sys.mjs`
- `toolkit/components/extensions/ExtensionUserScripts.sys.mjs`
- `toolkit/components/extensions/ExtensionUserScriptsContent.sys.mjs`
- `toolkit/components/umbrafox/` modules for storage, registry, runner, and runtime
- `toolkit/components/umbrafox/UmbrafoxUserlandScriptRegistry.sys.mjs`
- `toolkit/components/umbrafox/UmbrafoxUserlandScriptRunner.sys.mjs`
- `toolkit/components/umbrafox/UmbrafoxUserlandScriptRuntime.sys.mjs`
- `toolkit/components/umbrafox/UmbrafoxUserlandEventController.sys.mjs`
- `docshell/base/nsDocShell.cpp`
- `docshell/base/nsDocShell.h`
- `docshell/base/nsDocShellLoadState.cpp`
- `docshell/base/nsDocShellLoadState.h`
- `dom/ipc/DOMTypes.ipdlh`
- `dom/script/ScriptLoader.cpp`
- `dom/script/ScriptLoader.h`
- `dom/script/ModuleLoader.cpp`
- `toolkit/components/umbrafox/docs/`
- `browser/base/content/aboutUmbrafoxUserland.xhtml`
- `browser/base/content/aboutUmbrafoxUserland.css`
- `browser/locales/en-US/browser/aboutUmbrafoxUserland.ftl`
- `browser/components/about/AboutRedirector.cpp`
- `browser/components/about/components.conf`
- `browser/base/jar.mn`
- `docs/config.yml`

## Implementation order

1. Keep the profile-local store and schema migration tests passing.
2. Keep source-tree scope derivation and disabled-script creation working.
3. Keep the footer `New Script` path local-tab-only and disabled when no HTTP(S) scope can be derived.
4. Keep created scripts visible under matching domain groups in a `Userland` source-tree folder.
5. Keep the source-tree enable checkbox updating profile storage only; it must not execute scripts until runtime injection is implemented.
6. Keep source-tree script selection opening editable profile-stored code in a real Debugger `SourceEditor`/CodeMirror 6 instance. Do not replace it with a native `textarea` or other parallel text input.
7. Keep the wrapper ABI centralized in `UmbrafoxUserlandScriptRunner.sys.mjs`.
8. Keep startup and DevTools mutations publishing the current script list through `UmbrafoxUserlandScriptRegistry.sys.mjs`.
9. Keep document-only runtime execution in `UmbrafoxUserlandScriptRuntime.sys.mjs`, called from the `UmbrafoxUserland` JSWindowActor on `DOMDocElementInserted`.
10. Keep the child actor gated by child-local shared data, the internal `umbrafox.userlandScripts.active` pref, or `initialProcessData` so the no-enabled-scripts default does not query the parent or block documents. The pref must be updated by `publishUserlandScripts(...)` so scripts enabled after content process startup still run on later navigation or reload.
11. Keep the parent actor filtering enabled document scripts by exact HTTP(S) origin from parent-side published script data.
12. Keep `document.blockParsing(...)` wrapping the exact promise that fetches matching scripts and awaits `runUserlandScripts(...)`.
13. Add editor UI for name, enabled state, and scope.
14. Replace the first system-principal wrapper sandbox with a hardened browser-owned isolated world, preserving page-like global lookup for explicit user scripts.
15. Keep browser-level tests proving enabled scripts run before the first inline page script in a real document.
16. Add tests that disabled scripts do not create runtime worlds.
17. Add tests that no Umbrafox globals or source markers appear in page-visible state.
18. Add worker support only after document support is stable.
19. Add network interception APIs only after isolated script timing is proven.
20. Keep the user-facing documentation in `toolkit/components/umbrafox/docs/userland.md` aligned with the actual runtime API and known limitations.
21. Keep `about:umbrafox-userland` aligned with the canonical docs when the user-facing API changes.
22. Keep `userland.on("script", ...)` source mutation gated behind active userland scripts and native observers so Firefox-equivalent behavior remains the default.
23. Keep compiled script caches disabled while userland scripts are active, otherwise a rewritten stencil can be reused without the userland handler or a cached stencil can bypass the source event.
24. Keep `userland.on("request", ...)` implemented through a parent-process `http-on-modify-request` observer plus `UmbrafoxUserland` JSWindowActor query bridge. Content processes cannot register `http-on-*` observers directly.
25. Keep request interception gated behind enabled userland scripts. No enabled userland script should mean no parent request observer work for normal browsing.

## Wrapper ABI

The conceptual wrapper shape is:

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

  // User script source is inserted here.
});
```

Because JavaScript forbids `"use strict"` inside a function with a destructuring parameter, the actual generated wrapper is:

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

  // User script source is inserted here.
});
```

The context object is frozen by the runner, but its referenced page proxies and private capability object are controlled by the runtime. `console` should resolve to the page console, and `alert` is currently provided as a page-window-bound lexical helper so bare `alert(...)` behaves like page code without installing any Umbrafox marker on page globals. `userland` must remain a lexical binding and must not be installed on page-visible globals. `runUserlandScripts(...)` awaits enabled scripts before returning; the document-start implementation must use that awaited boundary before releasing page JavaScript.

## Event API

The current document-level event API is:

```js
userland.on("alert", event => event.preventDefault());
userland.on("prompt", event => event.respondWith("value"));
userland.on("confirm", event => event.respondWith(false));
userland.on("navigation", event => {
  event.href = new URL("/replacement", location.href).href;
});
userland.on("script", event => {
  event.source = event.source.replace("original", "replacement");
});
userland.on("request", event => {
  if (event.url.endsWith("/settings.json")) {
    event.respondWith({
      contentType: "application/json",
      body: JSON.stringify({ enabled: true }),
    });
  }
});
```

Implemented navigation sources are:

- `window.open(...)`, including external schemes such as `zoom://` when they pass through that API.
- Primary anchor/area clicks.
- Form submits.
- Docshell navigation attempts, including `location.assign(...)`, `location.replace(...)`, `location.href = ...`, hash navigations, meta refresh, and external schemes that reach docshell before external protocol dispatch.

The docshell hook is internal and synchronous. It uses an observer topic named `umbrafox-userland-navigation-attempt` with an internal mutable property bag keyed by browsing-context id. `UmbrafoxUserlandEventController.sys.mjs` registers active per-document controllers in the content process using weak references, dispatches the userland `navigation` event, and writes `cancelled` or rewritten `href` back into the property bag before docshell continues. `nsDocShellLoadState` carries an internal `UmbrafoxUserlandNavigationHandled` marker, serialized through `DocShellLoadStateInit`, to avoid duplicate events when a link/form path later re-enters `InternalLoad`.

Do not document this as total navigation coverage yet. HTTP/server redirects are intentionally outside the `navigation` event because they are network-channel behavior; handle them later through network interception/substitution APIs. History API URL changes also still need a separate hook because they do not create normal docshell loads. A JS content-policy attempt did not catch `location.assign(...)` in browser coverage and was not kept.

Implemented script-source event sources are DOM document classic scripts and DOM document JavaScript modules, both inline and external, that reach the DOM script loader compile paths, plus direct eval, indirect eval, and Function constructor body source. The DOM hook is `ScriptLoader::MaybeApplyUmbrafoxUserlandScriptSourceEvent(...)`, called from off-thread compile setup, main-thread classic compile, and main-thread module compile. Runtime-generated source uses the Umbrafox-added `JSRuntimeCodeSourceTransform` host callback, invoked by eval and Function-constructor compile paths and bridged by `nsScriptSecurityManager::ApplyUmbrafoxUserlandRuntimeScriptSourceEvent(...)`. Both paths use an internal observer topic named `umbrafox-userland-script-source` with a mutable property bag keyed by browsing-context id. `UmbrafoxUserlandEventController.sys.mjs` dispatches `userland.on("script", ...)` and writes rewritten `source` back before Gecko compiles it.

The script event exposes source text plus metadata: `uri`, `kind`, `size`, `sourceLength`, `receivedLength`, `lineNumber`, `columnNumber`, `inline`, `external`, `module`, `parserInserted`, `preload`, and `native`. Setting `event.source` or calling `respondWith(source)` replaces the compiled source. Calling `preventDefault()` without a replacement substitutes an empty script.

While userland scripts are active, `TryUseCache(...)`, `StartLoadInternal(...)`, and `CalculateCacheFlag(...)` avoid compiled-cache bypasses and mutated-stencil reuse. This is required so source events are not skipped and rewritten compiled scripts do not leak into later Firefox-equivalent browsing.

Do not document this as total script coverage yet. Worker scripts, worklets, import maps, JSON modules, CSS modules, and WebAssembly modules need separate hooks. Keep the existing runtime-codegen host callback boolean-only for CSP/codegen policy decisions; source rewriting belongs in the separate mutable SpiderMonkey host callback.

Implemented request event coverage is the first document-associated HTTP(S)
slice. The parent actor imports `ensureUmbrafoxUserlandRequestObserver()` when
document scripts are queried. The observer listens for `http-on-modify-request`
in the parent process, derives the channel browsing-context id from
`nsILoadInfo`, suspends the channel, sends `DispatchUserlandRequest` through the
matching `UmbrafoxUserland` actor, applies the returned decision, and resumes the
channel. The child actor dispatches into the content-process
`UmbrafoxUserlandEventController` that user scripts registered handlers with.

The request event exposes URL, method, mutable headers, original headers,
browsing-context ids, content policy type, private-browsing state, and `native`.
Handlers can mutate `event.url`, mutate `event.method`, use
`event.headers.set(...)` or `event.headers.delete(...)`, hard-cancel with
`preventDefault()`, `cancel()`, or `block()`, or synthesize a successful response
with `respondWith(...)`. The current synthetic response implementation redirects
to a generated `data:` URI and sets the internal data-redirect allowance. It is
useful for string/object body substitution but is not full response control.

Do not document this as total network coverage yet. The initial top-level
document request starts before document userland exists. Request body mutation,
full response headers/status, response stream swapping, media stream
replacement, workers, worklets, WebSocket, EventSource, WebTransport, and
profile-level startup/global network rules need separate future hooks. Hard
blocking is explicitly userland-owned and detectable; substitution remains the
preferred model when stealth matters.

## Verification commands

Use targeted tests once implementation files exist:

```bash
./mach lint devtools/client/debugger toolkit/components/umbrafox
./mach test --auto devtools/client/debugger toolkit/components/umbrafox
```

For front-end-only slices after a full build exists:

```bash
./mach build faster
```

For C++ or platform hook changes:

```bash
./mach build binaries
```

For the docshell navigation slice, the focused verification used:

```bash
./mach build export
./mach build binaries
./mach build faster
./mach lint toolkit/components/umbrafox docshell/base/nsDocShell.cpp docshell/base/nsDocShell.h docshell/base/nsDocShellLoadState.cpp docshell/base/nsDocShellLoadState.h dom/ipc/DOMTypes.ipdlh
./mach test --headless toolkit/components/umbrafox/tests/browser/browser_userland_document_start.js toolkit/components/umbrafox/tests/browser/browser_userland_events.js
./mach xpcshell-test --force toolkit/components/umbrafox/tests/xpcshell
```

For the script-source event slice, include:

```bash
./mach build binaries
./mach build faster
./mach lint toolkit/components/umbrafox dom/script/ScriptLoader.cpp dom/script/ScriptLoader.h dom/script/ModuleLoader.cpp caps/nsScriptSecurityManager.cpp caps/nsScriptSecurityManager.h js/public/Principals.h js/src/vm/JSContext.cpp js/src/vm/JSContext.h js/src/builtin/Eval.cpp js/src/vm/JSFunction.cpp browser/base/content/aboutUmbrafoxUserland.xhtml browser/locales/en-US/browser/aboutUmbrafoxUserland.ftl
./mach test --headless toolkit/components/umbrafox/tests/browser/browser_userland_events.js
```

For the first request-event slice, include:

```bash
./mach lint toolkit/components/umbrafox toolkit/actors/UmbrafoxUserlandChild.sys.mjs toolkit/actors/UmbrafoxUserlandParent.sys.mjs browser/base/content/aboutUmbrafoxUserland.xhtml browser/locales/en-US/browser/aboutUmbrafoxUserland.ftl
./mach test --headless toolkit/components/umbrafox/tests/browser/browser_userland_events.js
```

## Rebase notes

During upstream updates, inspect conflicts in:

- DevTools source tree item shape and context-menu action signatures.
- target watcher behavior for `CONTENT_SCRIPT` or any new target type.
- `ActorManagerParent.sys.mjs` JSWindowActor registration.
- `toolkit/actors/UmbrafoxUserlandChild.sys.mjs`.
- `toolkit/actors/UmbrafoxUserlandParent.sys.mjs`.
- `ExtensionContent.sys.mjs` document_start and sandbox creation logic.
- `docshell/base/nsDocShell.cpp` and `nsDocShellLoadState` when upstream changes navigation or external protocol plumbing.
- `dom/ipc/DOMTypes.ipdlh` if upstream changes `DocShellLoadStateInit`.
- `dom/script/ScriptLoader.cpp`, `dom/script/ScriptLoader.h`, and `dom/script/ModuleLoader.cpp` when upstream changes script source retrieval, bytecode cache policy, off-thread compile setup, or module compile paths.
- `js/public/Principals.h`, `js/src/vm/JSContext.cpp`, `js/src/vm/JSContext.h`, `js/src/builtin/Eval.cpp`, `js/src/vm/JSFunction.cpp`, `caps/nsScriptSecurityManager.cpp`, and `caps/nsScriptSecurityManager.h` when upstream changes JS security callbacks, eval, Function constructors, or runtime-codegen policy.
- any new tests that assert user-script ordering.
- `toolkit/actors/UmbrafoxUserlandParent.sys.mjs` and
  `toolkit/actors/UmbrafoxUserlandChild.sys.mjs` if upstream changes
  `JSWindowActor` query behavior.
- networking observer behavior around `http-on-modify-request`, especially if
  upstream changes channel suspension, `nsILoadInfo` browsing-context ids, or
  data-URI redirect allowances.

If upstream changes document_start semantics, stop and redo the timing proof before carrying the patch forward.
