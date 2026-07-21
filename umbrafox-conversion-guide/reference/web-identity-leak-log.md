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
