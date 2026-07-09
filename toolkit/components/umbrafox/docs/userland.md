# Userland scripts

Userland scripts are profile-local scripts that Umbrafox runs for matching web
documents before page JavaScript runs. They are created from the Debugger source
tree, stored in the user's profile, and executed by browser-owned runtime code.

Userland is intentionally powerful. A userland script can change page behavior,
cancel browser dialogs, rewrite navigation attempts, and eventually intercept
other browser activity. That power belongs to the user. It also means a user can
make their own browser detectable or break sites with a script. Umbrafox itself
must remain Firefox-equivalent by default when no matching script is enabled.

## Availability

The current implementation supports document userland scripts for exact HTTP(S)
origins. Document-associated HTTP(S) request interception has an initial
pre-send implementation. Worker support, startup/global network interception,
full response stream replacement, sockets, and non-HTTP protocols are not
implemented yet.

The in-browser help page is available at `about:umbrafox-userland`.

Scripts are stored in the active profile at:

```text
<profile>/umbrafox/userland-scripts.json
```

Use `about:profiles` to confirm the active profile path. Do not assume it is
under `~/.config/umbrafox`; Firefox-family profile behavior normally uses the
Mozilla profile service.

## Creating a script

1. Open DevTools and switch to the Debugger.
2. In the Sources tree, select the HTTP(S) domain or thread that should own the
   script.
3. Create the script with the `New Script` button or the domain context menu.
4. Select the script under the domain's `Userland Scripts` folder.
5. Edit the source in the Debugger editor.
6. Enable the script with its checkbox.
7. Reload the target page.

The footer `New Script` button is disabled unless the current selection can be
resolved to an HTTP(S) origin. New scripts are disabled by default so creation
does not immediately change page behavior.

New blank scripts start with a removable first-line help comment:

```js
/* Feel free to visit the help at `about:umbrafox-userland` */
```

## Execution timing

Enabled userland scripts run at document start for matching documents. Umbrafox
awaits all enabled matching scripts before allowing page scripts to continue.

Scripts run sequentially in stored order. If a script performs asynchronous work
before returning, page script execution waits for that work:

```js
await new Promise(resolve => setTimeout(resolve, 100));
console.log("This runs before page scripts resume.");
```

Long-running scripts can delay or hang page startup. Keep document-start work as
short as practical, and defer non-critical work with normal page events when a
site does not need to be changed before its own scripts run.

## Wrapper context

Umbrafox wraps user script source in an async function and passes a frozen
context object:

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

The single `context` argument lets Umbrafox add future bindings without breaking
existing scripts. The wrapper is async so startup can await userland setup before
page JavaScript runs.

`userland` is a private lexical binding. Umbrafox must not install
`window.userland`, `navigator.umbrafox`, or any other page-visible marker.

## Context bindings

`window`
: The matching page window.

`document`
: The matching page document.

`globalThis`
: The userland global for this execution context.

`location`
: The page location object.

`navigator`
: The page navigator object.

`console`
: The page console.

`alert`
: A page-window-bound helper for native alert behavior.

`userland`
: The private Umbrafox capability object for this script.

## Userland API

The current `userland` object has these fields:

```js
userland.info;
userland.on(type, handler);
userland.off(type, handler);
userland.addEventListener(type, handler);
userland.removeEventListener(type, handler);
```

`userland.info` is frozen metadata for the running script:

```js
{
  id,
  name,
  scope,
  world,
}
```

`userland.on(...)` registers a synchronous handler and returns a function that
removes that handler:

```js
const stop = userland.on("alert", event => {
  event.preventDefault();
});

// Later:
stop();
```

Supported event types are `alert`, `prompt`, `confirm`, `navigation`,
`script`, and `request`.

## Cancellable events

Userland event handlers receive a cancellable event object:

```js
{
  type,
  cancelable,
  defaultPrevented,
  preventDefault(),
  cancel(),
  block(),
  respondWith(value),
}
```

`preventDefault()`, `cancel()`, and `block()` cancel the native action.
`respondWith(value)` sets `event.returnValue` and cancels the native action.

Handlers run synchronously. Do not `await` inside a handler when the browser is
waiting for an immediate answer, such as a dialog return value or a docshell
navigation decision.

### Dialog events

Cancel all alert boxes:

```js
userland.on("alert", event => {
  event.preventDefault();
});
```

Replace a prompt result:

```js
userland.on("prompt", event => {
  if (event.message.includes("name")) {
    event.respondWith("Umbrafox user");
  }
});
```

Replace a confirm result:

```js
userland.on("confirm", event => {
  event.respondWith(false);
});
```

Dialog fields:

```js
// alert
{ message }

// prompt
{ message, defaultValue }

// confirm
{ message }
```

If a prompt is cancelled without `respondWith(...)`, Umbrafox returns `null`.
If a confirm is cancelled without `respondWith(...)`, Umbrafox returns `false`.

### Navigation events

Cancel attempts to open an external application protocol:

```js
userland.on("navigation", event => {
  if (event.href.startsWith("zoom://")) {
    event.preventDefault();
  }
});
```

Rewrite a navigation target:

```js
userland.on("navigation", event => {
  const url = new URL(event.href);
  if (url.pathname == "/old") {
    event.href = new URL("/new", location.href).href;
  }
});
```

Navigation events expose:

```js
{
  href,
  originalHref,
  source,
  target,
  external,
  formSubmission,
  metaRefresh,
  redirect,
  loadType,
  native,
}
```

Not every field is present for every source. For `window.open(...)`, `features`
is also available. For form submissions, `method` is also available.

Current navigation coverage includes:

- `window.open(...)`.
- Primary anchor and area clicks.
- Form submits.
- `location.assign(...)`.
- `location.replace(...)`.
- `location.href = ...`.
- Hash navigations.
- Meta refresh.
- External protocol attempts that reach docshell before native protocol
  dispatch, such as `zoom://`.

HTTP/server redirects are intentionally outside the `navigation` event. They
are network-channel behavior and should be handled by future network
interception and substitution APIs. History API URL changes are not covered yet.

### Script source events

Script events fire for DOM document classic scripts, JavaScript modules, direct
eval, indirect eval, and Function constructor bodies after the source is
available and before Gecko compiles it. Handlers can mutate `event.source` to
replace the source that the engine compiles:

```js
userland.on("script", event => {
  if (event.uri.endsWith("/app.js")) {
    event.source = event.source.replace("debug = false", "debug = true");
  }
});
```

Calling `event.respondWith(source)` replaces the source. Calling
`event.preventDefault()` without a replacement substitutes an empty script,
which preserves script load completion while removing script behavior.

Script events expose:

```js
{
  source,
  originalSource,
  uri,
  url,
  kind,
  size,
  sourceLength,
  receivedLength,
  lineNumber,
  columnNumber,
  inline,
  external,
  module,
  parserInserted,
  preload,
  native,
}
```

`size` is an alias for `sourceLength`. `kind` is `classic`, `module`,
`direct-eval`, `indirect-eval`, or `function` for currently covered sources.
Function constructor events expose and mutate the body source argument, not the
synthesized wrapper that Gecko builds around it. Worker scripts, worklets,
import maps, JSON modules, CSS modules, and WebAssembly modules need separate
hooks.

### Request events

Request events fire for document-associated HTTP(S) channels after a matching
document userland script has run and before the request is sent. The parent
process suspends the channel, asks the document's hidden userland controller for
a decision, then resumes the channel with any requested mutation.

Rewrite a URL:

```js
userland.on("request", event => {
  if (event.url.endsWith("/old.json")) {
    event.url = event.url.replace("/old.json", "/new.json");
  }
});
```

Change request headers:

```js
userland.on("request", event => {
  event.headers.set("X-Debug-Mode", "1");
  event.headers.delete("DNT");
});
```

Cancel a request with a network error:

```js
userland.on("request", event => {
  if (event.url.includes("/break-this-request")) {
    event.block();
  }
});
```

Provide a synthetic successful response:

```js
userland.on("request", event => {
  if (event.url.endsWith("/settings.json")) {
    event.respondWith({
      contentType: "application/json",
      body: JSON.stringify({ enabled: true }),
    });
  }
});
```

Request events expose:

```js
{
  url,
  uri,
  originalUrl,
  originalUri,
  method,
  originalMethod,
  headers,
  originalHeaders,
  browsingContextId,
  targetBrowsingContextId,
  frameBrowsingContextId,
  associatedBrowsingContextId,
  innerWindowId,
  contentPolicyType,
  privateBrowsing,
  native,
}
```

`headers` is a mutable collection with `get`, `has`, `set`, `delete`,
`entries`, `keys`, `values`, `forEach`, and iteration support.

`preventDefault()`, `cancel()`, and `block()` hard-cancel the channel. That is
detectable to page code and servers in the same ways any failed request can be
detectable. Prefer `respondWith(...)` when the goal is to hide or neutralize a
resource while giving the initiator a successful response.

`respondWith(...)` currently synthesizes a response by redirecting the channel
to a generated `data:` response. It supports string bodies and object responses
with `body`, `text`, `contentType`, or `type`. Full HTTP status, arbitrary
response headers, byte streams, and media stream replacement still need the
future response/stream interception slice.

Current request limitations:

- The initial top-level document request is not covered by document userland,
  because no document userland context exists before that request starts.
- Request body mutation is not implemented yet.
- Full response header, status, and stream interception is not implemented yet.
- Worker, worklet, WebSocket, EventSource, WebTransport, and browser-startup
  global interception need separate hooks.
- Redirect targets are separate requests, so a rewritten request can produce a
  second request event for the replacement URL.

## Detectability model

Umbrafox defaults must remain indistinguishable from the corresponding Firefox
build. Userland does not add page-visible globals, DOM attributes, CSS features,
headers, or other Umbrafox-specific markers by default.

User scripts can still make the user's browser detectable because they can
mutate pages. That is an explicit user choice. Scripts should avoid detectable
changes when stealth matters.

Safer patterns:

- Prefer page-compatible results over visible errors.
- Preserve native return types and timing where possible.
- Avoid adding stable Umbrafox-specific DOM attributes, class names, comments,
  globals, request markers, or console messages to pages.
- Avoid changing behavior on every site unless the user intentionally wants a
  global detectable change.
- Prefer request substitution over hard cancellation when preserving successful
  load semantics matters.

## Troubleshooting

If a script does not run:

- Confirm it is enabled in the Debugger source tree.
- Confirm the page origin exactly matches the script origin.
- Reload the page after editing or enabling the script.
- Check that the active profile is the profile containing
  `umbrafox/userland-scripts.json`.
- If launching `dist/bin/umbrafox` directly after a local front-end rebuild, use
  `MOZ_PURGE_CACHES=1` to avoid stale startup-cache modules.

If the page hangs during load, disable the script and inspect any awaited work
at top level. Since document-start scripts are awaited, unresolved promises
block page script execution.

If a navigation handler seems incomplete, check whether the action is a
server-side redirect or History API URL change. Those are current limitations of
the navigation event surface.

If a request handler does not fire for the first page load, remember that
document userland cannot intercept the request that creates the document itself.
That requires the future profile-level/global network userland runtime.
