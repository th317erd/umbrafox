# Current Umbrafox conversion state

This document summarizes what has been changed from upstream Firefox so far. It is a map, not a patch.

## High-level goals already implemented

Umbrafox currently changes Firefox in these broad ways:

1. Application identity and branding are changed from Firefox/Mozilla to Umbrafox.
2. The default browser check is disabled by default.
3. Session restore is enabled by default via `browser.startup.page = 3`.
4. The new tab/homepage is reduced toward a search-only experience.
5. The new tab customize menu, wallpaper entry points, logo toggle, sponsored content, recent activity, weather, widgets, top sites, stories, and Discovery Stream defaults are disabled.
6. DuckDuckGo is the default search engine.
7. Google, Bing, Amazon, and eBay search engines are removed or blocked from the search engine list.
8. Search suggestions and Umbrafox Suggest sponsored/online/recent/trending controls are stripped or default-off.
9. The Settings data-collection card is removed.
10. Normandy, Nimbus rollouts, feature studies, technical/interaction data upload, usage ping, extension recommendations, and crash submission prompt defaults are disabled.
11. en-US visible copy and comments were swept from Firefox to Umbrafox where appropriate.
12. Focused regression tests were added or adjusted so the Umbrafox defaults remain intentional.
13. The built browser executable name is explicitly `umbrafox` via `MOZ_APP_NAME`.

## Userland scripts state

The userland scripts feature has an architecture note and recipe:

- `03-userland-scripts-architecture.md`
- `recipes/09-userland-scripts.md`

The canonical user-facing userland documentation now lives in
`toolkit/components/umbrafox/docs/userland.md` and is registered with Firefox
Source Docs through `toolkit/components/umbrafox/moz.build`. A browser-visible
internal help page is registered as `about:umbrafox-userland` and maps to
`browser/base/content/aboutUmbrafoxUserland.xhtml`.

The profile-local script store is implemented in `toolkit/components/umbrafox/UmbrafoxUserlandScriptStore.sys.mjs` with xpcshell coverage. Scope derivation is implemented in `toolkit/components/umbrafox/UmbrafoxUserlandScriptScope.sys.mjs`, and the Debugger source tree can create disabled userland script records from its context menu and footer `New Script` button. Created scripts now appear under matching domain groups in a `Userland` folder, can be enabled or disabled from that tree row, and open editable stored code in the Debugger editor.

The async wrapper ABI and runner primitive are implemented in `toolkit/components/umbrafox/UmbrafoxUserlandScriptRunner.sys.mjs` with xpcshell coverage. The conceptual wrapper requested for userland scripts was:

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

JavaScript does not allow a `"use strict"` directive inside a function with a destructuring parameter, so the generated implementation uses the equivalent strict form:

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

The runner freezes the outer context object, passes the page console, provides a page-window-bound lexical `alert`, keeps `userland` lexical instead of installing it on page globals, and awaits enabled scripts sequentially.

The first document-start runtime slice is implemented. Browser startup and DevTools script mutations publish the profile-local script list through process shared data, update `initialProcessData`, and mirror active state to the internal `umbrafox.userlandScripts.active` pref so already-running content processes know when scripts become enabled. `ActorManagerParent.sys.mjs` registers the `UmbrafoxUserland` JSWindowActor for browser documents. Its child actor listens for `DOMDocElementInserted`, avoids parent queries when no enabled userland scripts exist, asks the parent actor for exact-origin matching document scripts when active, and calls `UmbrafoxUserlandScriptRuntime.sys.mjs`. Matching scripts are run through the async wrapper runner with waived page references and page-window sandbox prototype lookup, while parser blocking uses the unwaived document. The runtime calls `document.blockParsing(...)` on the returned promise so parser/page script progress waits until userland scripts resolve.

The first userland event slices are implemented in `toolkit/components/umbrafox/UmbrafoxUserlandEventController.sys.mjs`. Enabled document scripts can call `userland.on(...)` for `alert`, `prompt`, `confirm`, `navigation`, and `script` events. Dialog events are cancellable and can provide prompt/confirm return values. Navigation events can be cancelled or rewritten by changing `event.href`. Script events can rewrite `event.source` before Gecko compiles DOM document classic scripts, JavaScript modules, direct eval, indirect eval, and Function constructor bodies.

Navigation coverage now combines the `window.open(...)` wrapper with a native docshell bridge in `docshell/base/nsDocShell.cpp`. The bridge uses an internal observer topic and mutable property bag keyed by browsing-context id, with an internal `nsDocShellLoadState` marker serialized through `dom/ipc/DOMTypes.ipdlh` to avoid duplicate dispatch. Covered paths include primary anchor/area clicks, form submits, `location.assign(...)`, `location.replace(...)`, `location.href = ...`, hash navigations, meta refresh, and docshell external-protocol paths such as `zoom://` before external protocol dispatch. HTTP/server redirects are intentionally outside the `navigation` event and should be handled by future network interception/substitution APIs. History API URL changes still need a separate hook.

Script-source mutation coverage now combines `dom/script/ScriptLoader.cpp`, `dom/script/ScriptLoader.h`, `dom/script/ModuleLoader.cpp`, `js/public/Principals.h`, `js/src/vm/JSContext.cpp`, `js/src/vm/JSContext.h`, `js/src/builtin/Eval.cpp`, `js/src/vm/JSFunction.cpp`, `caps/nsScriptSecurityManager.cpp`, and `caps/nsScriptSecurityManager.h` with the same content-process event controller. The native hook emits `umbrafox-userland-script-source` after DOM script source is available and before classic/module source compilation. A separate SpiderMonkey host callback bridges direct eval, indirect eval, and Function constructor body source through the same event. While userland scripts are active, compiled script cache paths are bypassed or disabled so DOM source events are not skipped and rewritten compiled stencils are not reused outside userland. Workers, worklets, import maps, JSON modules, CSS modules, and WebAssembly modules still need separate hooks.

This first runtime slice is intentionally document-only. Worker support, network APIs, and a hardened isolated-world implementation still need to land. The current runtime must remain limited to explicit enabled user scripts and must not install Umbrafox or userland markers on page-visible globals.

## Important state note

At the time this guide was first created, Umbrafox changes were working-tree modifications. They were later committed as `5d89f338f5e9 Convert Firefox to Umbrafox`.

Future major Umbrafox changes should preferably be committed in subsystem-sized commits. A practical split would be:

1. Identity and branding.
2. Branding assets and localization sweep.
3. Homepage/newtab defaults and UI stripping.
4. Search engine policy.
5. Preferences data-collection and suggest stripping.
6. Tests.

That split will make future rebases and conflict diagnosis much easier than another large snapshot commit.

## Profile behavior note

Do not assume user data lives under `~/.config/umbrafox`.

This source tree changes application identity, but Firefox profile location behavior is controlled by the built application metadata and toolkit profile service behavior. The built `application.ini` currently contains:

```ini
Vendor=Umbrafox
Name=Umbrafox
```

On Linux, Firefox-family profiles are normally under `~/.mozilla/...`, not `~/.config/...`. Always verify the exact active profile path in `about:profiles`, or run with an explicit profile:

```bash
./mach run --temp-profile
./mach run --profile /absolute/path/to/profile
```

When testing default prefs, use a new or temporary profile. Existing `prefs.js` values can override changed defaults.

When testing changed chrome JS from a direct `dist/bin/umbrafox` launch, purge the profile startup cache after `./mach build faster` if the application `BuildID` did not change. Otherwise the profile can reuse stale bytecode for `resource://` modules even though files under `dist/bin/modules/` were updated. Use one of:

```bash
MOZ_PURGE_CACHES=1 obj-x86_64-pc-linux-gnu/dist/bin/umbrafox -no-remote -profile /absolute/path/to/profile
rm -rf ~/.cache/umbrafox/umbrafox/<profile>/startupCache
```

This matters for userland runtime work because stale cached `UmbrafoxUserland*.sys.mjs` modules can make DevTools show an enabled script while the content actor still runs the previous implementation.

## Last verified commands

The current conversion state was verified with:

```bash
./mach lint browser/components/preferences/config/search.mjs browser/components/preferences/home.inc.xhtml browser/components/preferences/config/permissions-data.mjs browser/extensions/newtab/lib/AboutPreferences.sys.mjs browser/app/profile/firefox.js modules/libpref/init/all.js browser/components/newtab/test/xpcshell/test_UmbrafoxHomeDefaults.js
./mach xpcshell-test browser/components/newtab/test/xpcshell/test_UmbrafoxHomeDefaults.js
./mach build faster
git diff --check
```

The userland document-start/dialog/native-navigation slice was later verified with:

```bash
./mach build export
./mach build binaries
./mach build faster
./mach lint toolkit/components/umbrafox docshell/base/nsDocShell.cpp docshell/base/nsDocShell.h docshell/base/nsDocShellLoadState.cpp docshell/base/nsDocShellLoadState.h dom/ipc/DOMTypes.ipdlh
./mach test --headless toolkit/components/umbrafox/tests/browser/browser_userland_document_start.js toolkit/components/umbrafox/tests/browser/browser_userland_events.js
./mach xpcshell-test --force toolkit/components/umbrafox/tests/xpcshell
```

The search-engine selector test was previously verified with:

```bash
./mach xpcshell-test toolkit/components/search/tests/xpcshell/test_engine_selector_remote_settings.js
```
