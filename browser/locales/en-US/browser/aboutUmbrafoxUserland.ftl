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

about-umbrafox-userland-events-heading = Cancellable events
about-umbrafox-userland-events-body = The current event API supports alert, prompt, confirm, and navigation. Event handlers are synchronous; use preventDefault, cancel, or respondWith to replace native behavior.

about-umbrafox-userland-navigation-heading = Navigation coverage
about-umbrafox-userland-navigation-body = Navigation events expose href, originalHref, source, target, and related metadata where available. Handlers can cancel an attempt or rewrite event.href before the browser continues.
about-umbrafox-userland-navigation-window-open = window.open(…)
about-umbrafox-userland-navigation-links = Primary anchor and area clicks, plus form submits.
about-umbrafox-userland-navigation-location = location.assign(…), location.replace(…), location.href changes, hash changes, and meta refresh.
about-umbrafox-userland-navigation-external = External protocol attempts that reach docshell before native protocol dispatch, such as zoom://.
about-umbrafox-userland-navigation-limits = HTTP/server redirects and History API URL changes are not covered by navigation events yet. Redirects should be handled later by network interception and substitution APIs.

about-umbrafox-userland-storage-heading = Profile storage
about-umbrafox-userland-storage-body = Scripts are stored in the active profile at:
about-umbrafox-userland-profiles-link = Open about:profiles to confirm the active profile path.

about-umbrafox-userland-detectability-heading = Detectability
about-umbrafox-userland-detectability-body = { -brand-short-name } must remain Firefox-equivalent by default. User scripts can still make the user’s browser detectable because they can mutate pages. That detectability belongs to the user’s explicit customization.
