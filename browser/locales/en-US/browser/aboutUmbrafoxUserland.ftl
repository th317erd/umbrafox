# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

about-umbrafox-userland-page-title = { -brand-short-name } Userland Scripts
about-umbrafox-userland-kicker = { -brand-short-name }
about-umbrafox-userland-heading = Userland scripts
about-umbrafox-userland-lede = Userland scripts are profile-local scripts that run for matching documents before page JavaScript runs. They are powerful browser-owned controls for inspecting and changing the user’s own browsing experience.

about-umbrafox-userland-create-heading = Create and edit a script
about-umbrafox-userland-create-step-debugger = Open DevTools and switch to the Debugger.
about-umbrafox-userland-create-step-domain = Select the HTTP(S) domain or thread that should own the script.
about-umbrafox-userland-create-step-new = Use the New Script button or the domain context menu.
about-umbrafox-userland-create-step-edit = Select the script under the domain’s Userland Scripts folder and edit it in the source editor.
about-umbrafox-userland-create-step-enable = Enable the script with its checkbox, then reload the target page.
about-umbrafox-userland-create-note = A newly created blank script starts with this removable help comment:

about-umbrafox-userland-timing-heading = Execution timing
about-umbrafox-userland-timing-body = Enabled matching scripts run at document start. { -brand-short-name } awaits all enabled userland scripts before allowing page scripts to continue, so unresolved top-level promises can delay page startup.

about-umbrafox-userland-wrapper-heading = Wrapper context
about-umbrafox-userland-wrapper-body = { -brand-short-name } wraps each script in an async strict-mode function and passes a frozen context object. The single context argument lets { -brand-short-name } add future bindings without breaking existing scripts.

about-umbrafox-userland-api-heading = Userland API
about-umbrafox-userland-api-body = The private userland object is available only as a lexical binding inside the userland wrapper. It is not installed on page globals.
about-umbrafox-userland-api-info-body = userland.info is frozen metadata for the current script. It is useful for debugging script identity and scope without exposing a page-visible marker.
about-umbrafox-userland-api-listener-body = userland.on(…) and userland.addEventListener(…) register a handler and return a cleanup function. userland.off(…) and userland.removeEventListener(…) remove a previously registered handler.

about-umbrafox-userland-events-heading = Cancellable events
about-umbrafox-userland-events-body = The current event API supports alert, prompt, confirm, navigation, script, and request. Events share this base shape, then add fields for their specific browser action.
about-umbrafox-userland-events-sync-body = Event handlers are synchronous. Use preventDefault, cancel, block, respondWith, or direct field mutation to replace native behavior. Do not await inside handlers that must answer an immediate browser decision.

about-umbrafox-userland-dialog-heading = Dialog events
about-umbrafox-userland-dialog-body = Dialog events let a script observe, cancel, or replace native alert, prompt, and confirm behavior for the matching document.
about-umbrafox-userland-dialog-example-body = Cancelling an alert returns undefined. Cancelling a prompt without respondWith returns null. Cancelling a confirm without respondWith returns false.

about-umbrafox-userland-script-heading = Script source rewriting
about-umbrafox-userland-script-body = Script events fire for DOM document classic scripts, JavaScript modules, direct eval, indirect eval, and Function constructor bodies after source is available and before Gecko compiles it. Handlers can mutate event.source to replace the source that the engine compiles.
about-umbrafox-userland-script-empty-body = respondWith(source) replaces the compiled source. preventDefault without a replacement substitutes an empty script, which keeps the load path successful while removing behavior.
about-umbrafox-userland-script-limits = Worker scripts, worklets, import maps, JSON modules, CSS modules, and WebAssembly modules need separate hooks.

about-umbrafox-userland-navigation-heading = Navigation coverage
about-umbrafox-userland-navigation-body = Navigation events expose href, originalHref, source, target, and related metadata where available. Handlers can cancel an attempt or rewrite event.href before the browser continues.
about-umbrafox-userland-navigation-window-open = window.open(…)
about-umbrafox-userland-navigation-links = Primary anchor and area clicks, plus form submits.
about-umbrafox-userland-navigation-location = location.assign(…), location.replace(…), location.href changes, hash changes, and meta refresh.
about-umbrafox-userland-navigation-external = External protocol attempts that reach docshell before native protocol dispatch, such as zoom://.
about-umbrafox-userland-navigation-example-body = Rewrite event.href to change the destination. Call preventDefault when the user wants the navigation attempt to stop entirely.
about-umbrafox-userland-navigation-limits = HTTP/server redirects and History API URL changes are not covered by navigation events yet. Redirects should be handled later by network interception and substitution APIs.

about-umbrafox-userland-request-heading = Request interception
about-umbrafox-userland-request-body = Request events fire for document-associated HTTP(S) channels after matching document userland has run and before the request is sent. Handlers can mutate the request or return synthetic content.
about-umbrafox-userland-request-url = Change event.url to redirect a request before it is sent.
about-umbrafox-userland-request-headers = Use event.headers to read, set, or delete request headers.
about-umbrafox-userland-request-block = Use event.block(), event.cancel(), or event.preventDefault() to hard-cancel a request. This is detectable like any failed request.
about-umbrafox-userland-request-respond = Use event.respondWith(…) to provide synthetic successful content when substitution is preferred.
about-umbrafox-userland-request-headers-body = event.headers supports get, has, set, delete, entries, keys, values, forEach, and iteration. Header mutations are applied in the parent process before the request continues.
about-umbrafox-userland-request-block-body = Prefer respondWith when the goal is neutralization with a successful load result. Hard cancellation is available for explicit user choices, but pages and servers can observe failed requests.
about-umbrafox-userland-request-limits = The first top-level document request, request bodies, full response status and headers, response streams, workers, sockets, and startup/global network rules need separate future hooks.

about-umbrafox-userland-storage-heading = Profile storage
about-umbrafox-userland-storage-body = Scripts are stored in the active profile at:
about-umbrafox-userland-profiles-link = Open about:profiles to confirm the active profile path.

about-umbrafox-userland-detectability-heading = Detectability
about-umbrafox-userland-detectability-body = { -brand-short-name } must remain Firefox-equivalent by default. User scripts can still make the user’s browser detectable because they can mutate pages. That detectability belongs to the user’s explicit customization.
about-umbrafox-userland-detectability-substitution = Prefer substitution over hard blocking when the page expects a successful resource load.
about-umbrafox-userland-detectability-globals = Do not add stable page-visible globals, DOM markers, CSS markers, comments, or request headers unless the user intentionally wants that behavior.
about-umbrafox-userland-detectability-errors = Preserve native return types, load events, and error timing when stealth matters.
