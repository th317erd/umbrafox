# Web identity leak log

This is the canonical register for web-visible Umbrafox identity leaks.

Every leak entry must include:

- The web-visible surface.
- The symptom that revealed it.
- The source-level cause.
- The exact fix.
- Verification proving the surface now matches Firefox.

If a future upstream sync reopens any entry in this log, the Umbrafox conversion
is incomplete until that leak is closed again.

## Leak 001: App UA name fell back to Umbrafox

Date found: 2026-07-20

### Surface

- HTTP `User-Agent` request header.
- Page-visible `navigator.userAgent`.

### Symptom

AMO (`addons.mozilla.org`) did not offer normal Firefox extension installation
controls. It showed a Firefox download prompt instead, indicating the site did
not recognize the browser as Firefox even though the application was Firefox
compatible internally.

### Cause

`MOZ_APP_UA_NAME` was unset while local branding set the app name/vendor to
Umbrafox. In `netwerk/protocol/http/nsHttpHandler.cpp`, an unset UA app name can
fall back through app info and produce an Umbrafox app token. That creates a
server-visible and script-visible distinction from matching Firefox builds.

Relevant generated state before the fix:

```text
MOZ_APP_NAME='umbrafox'
MOZ_APP_BASENAME='Umbrafox'
MOZ_APP_DISPLAYNAME='Umbrafox'
MOZ_APP_VENDOR='Umbrafox'
MOZ_APP_UA_NAME=''
```

### Fix

In `browser/moz.configure`, keep local branding as Umbrafox but force web-facing
UA identity to Firefox:

```python
imply_option("MOZ_APP_VENDOR", "Umbrafox")
imply_option("MOZ_APP_ID", "{ec8030f7-c20a-464f-9b0e-13a3a9e97384}")
# Keep browser/server-visible identity Firefox-compatible. UI and executable
# branding are Umbrafox, but web content must not receive an Umbrafox UA token.
imply_option("MOZ_APP_UA_NAME", "Firefox")
```

Do not set this from `browser/confvars.sh`; configure rejects
`MOZ_APP_UA_NAME=Firefox` there because the option is accepted from implied
configure values.

### Verification

Build and lint:

```bash
./mach build
./mach lint browser/moz.configure
./mach package
```

Generated config must include:

```text
MOZ_APP_UA_NAME': 'Firefox',
MOZ_APP_NAME': 'umbrafox',
MOZ_APP_BASENAME': 'Umbrafox',
MOZ_APP_DISPLAYNAME': 'Umbrafox',
MOZ_APP_VENDOR': 'Umbrafox',
MOZ_APP_ID': '{ec8030f7-c20a-464f-9b0e-13a3a9e97384}',
```

A live local page probe must show no Umbrafox token in either request headers or
JavaScript:

```text
HTTP_USER_AGENT=Mozilla/5.0 (X11; Linux x86_64; rv:154.0) Gecko/20100101 Firefox/154.0
NAVIGATOR_USER_AGENT=Mozilla/5.0 (X11; Linux x86_64; rv:154.0) Gecko/20100101 Firefox/154.0
```

### Rebase checklist

- Confirm `browser/moz.configure` still implies `MOZ_APP_UA_NAME` as `Firefox`.
- Confirm `browser/confvars.sh` does not contain a rejected `MOZ_APP_UA_NAME`
  assignment.
- Confirm `obj-*/config.status` has `MOZ_APP_UA_NAME': 'Firefox'`.
- Confirm HTTP `User-Agent` and `navigator.userAgent` do not contain Umbrafox.
- Retest AMO extension installation flow after deploying the rebuilt package.

## Leak 002: Automation launch flags exposed `navigator.webdriver`

Date found: 2026-09-22

### Surface

- Page-visible `navigator.webdriver`.

### Symptom

A live Umbrafox session used for diagnostics was launched with:

```text
--marionette --remote-debugging-port 9222 --remote-allow-system-access
```

A controlled local probe showed:

```text
clean Umbrafox temp profile: navigator.webdriver === false
Umbrafox with Marionette/Remote Agent flags: navigator.webdriver === true
stock Firefox temp profile: navigator.webdriver === false
```

This is Firefox-compatible behavior for an automated browser, but it is not
acceptable for ordinary interactive Umbrafox browsing where Firefox parity is
required.

### Cause

Upstream `Navigator::Webdriver()` in `dom/base/Navigator.cpp` returns true when
Marionette or the Remote Agent reports browser automation running. UmbraLink
does not participate in this check, but launching the browser with Firefox's
built-in automation flags does.

### Fix

Operational fix:

- Do not launch ordinary Umbrafox browsing sessions with `--marionette`,
  `--remote-debugging-port`, or `--remote-allow-system-access`.
- Use the normal launcher, `~/Programs/umbrafox`, for interactive browsing.
- Keep UmbraLink as the owner-local diagnostics channel; it is not wired into
  `Navigator::Webdriver()`.

No source change was made for this entry. Hiding Firefox's upstream automation
state would itself be a web-platform behavior change and requires separate
rulebook discussion before any patch.

### Verification

Controlled probe artifacts:

```text
artifacts/umbrafox-parity-probe-20260922/umbrafox-normal.json
artifacts/umbrafox-parity-probe-20260922/umbrafox-remote-flags.json
artifacts/umbrafox-parity-probe-20260922/firefox-direct-full.json
```

Expected results:

```text
umbrafox-normal.navigator.webdriver = false
umbrafox-remote-flags.navigator.webdriver = true
firefox-direct-full.navigator.webdriver = false
```

### Rebase checklist

- Confirm `~/Programs/umbrafox` remains a plain launcher and does not add
  Marionette or Remote Agent flags.
- Confirm ordinary browsing probes report `navigator.webdriver === false`.
- Confirm any diagnostic/automation launch mode is clearly separated from normal
  interactive browsing.

## Leak 003: Native userland navigation bridge stayed active after disable

Date found: 2026-09-22

### Surface

- Page-observable navigation behavior after `umbrafox.userlandScripts.active`
  becomes false.
- Timing and side effects from previously installed userland navigation handlers.

### Symptom

During the Firefox-parity audit, the native docshell bridge was found to notify
`umbrafox-userland-navigation-attempt` for every eligible docshell navigation
even when userland scripts were inactive. A regression test reproduced the leak:

1. Install a userland `navigation` handler that writes the attempted URL to
   `localStorage`.
2. Load a page so the native navigation observer and controller are installed.
3. Disable userland by publishing an empty script list.
4. Navigate again.

Before the fix, the disabled handler still observed the navigation and wrote:

```text
https://example.com/browser/toolkit/components/umbrafox/tests/browser/file_userland_script_event.html
```

### Cause

`nsDocShell::MaybeHandleUmbrafoxUserlandNavigation(...)` did not check
`umbrafox.userlandScripts.active` before setting the load-state handled marker,
allocating the property bag, and notifying the internal observer topic. Other
native userland bridges, such as script-source and mutation events, were already
pref-gated and observer-gated; docshell navigation was the outlier.

### Fix

In `docshell/base/nsDocShell.cpp`:

- Add an `UmbrafoxUserlandScriptsActive()` helper backed by
  `umbrafox.userlandScripts.active`.
- Return immediately from `MaybeHandleUmbrafoxUserlandNavigation(...)` when the
  pref is false.
- Check `HasObservers(kUmbrafoxUserlandNavigationAttemptTopic)` before marking a
  load state as handled or building the event property bag.

Regression coverage was added to
`toolkit/components/umbrafox/tests/browser/browser_userland_events.js`:

- `test_native_navigation_inert_after_userland_disabled`

### Verification

Failing-before-fix evidence:

```bash
./mach test --headless toolkit/components/umbrafox/tests/browser/browser_userland_events.js
```

Before rebuilding native code, the new test failed with:

```text
Native navigation events are not dispatched after userland scripts are disabled
"https://example.com/browser/toolkit/components/umbrafox/tests/browser/file_userland_script_event.html" == null
```

After rebuilding:

```bash
./mach build binaries
./mach test --headless toolkit/components/umbrafox/tests/browser/browser_userland_events.js
./mach lint docshell/base/nsDocShell.cpp toolkit/components/umbrafox/tests/browser/browser_userland_events.js
./mach package
```

Result:

```text
browser_userland_events.js: Passed 49, Failed 0
lint: 0 problems
package: Created umbrafox-158.0a1.en-US.linux-x86_64.tar.xz
```

### Rebase checklist

- Confirm docshell native navigation dispatch remains gated by
  `umbrafox.userlandScripts.active`.
- Confirm docshell checks observer presence before setting
  `UmbrafoxUserlandNavigationHandled`.
- Rerun `browser_userland_events.js` after rebasing the userland navigation
  bridge.
