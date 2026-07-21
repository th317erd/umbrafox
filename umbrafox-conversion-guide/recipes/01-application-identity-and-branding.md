# Recipe 01: Application identity and branding

## Goal

Make the built application identify as Umbrafox instead of Firefox, without changing every internal Firefox identifier that is still part of Mozilla's source architecture.

## Files changed

Core identity:

- `browser/moz.configure`
- `build/moz.configure/init.configure`
- `browser/branding/branding-common.mozbuild`
- `tools/@types/subs/AppConstants.sys.d.mts`
- `toolkit/xre/nsAppRunner.cpp`

Branding channels:

- `browser/branding/aurora/configure.sh`
- `browser/branding/nightly/configure.sh`
- `browser/branding/official/configure.sh`
- `browser/branding/unofficial/configure.sh`
- `browser/branding/aurora/moz.build`
- `browser/branding/nightly/moz.build`
- `browser/branding/official/moz.build`
- `browser/branding/unofficial/moz.build`
- `browser/branding/*/locales/en-US/brand.ftl`
- `browser/branding/*/locales/en-US/brand.properties`
- `browser/branding/*/branding.nsi`

## Steps

### 1. Change app vendor, but keep the Firefox application ID

In `browser/moz.configure`, change:

```python
imply_option("MOZ_APP_VENDOR", "Mozilla")
imply_option("MOZ_APP_ID", "{ec8030f7-c20a-464f-9b0e-13a3a9e97384}")
```

to:

```python
imply_option("MOZ_APP_VENDOR", "Umbrafox")
imply_option("MOZ_APP_ID", "{ec8030f7-c20a-464f-9b0e-13a3a9e97384}")
```

The application ID must remain Firefox's canonical desktop ID. Browser startup categories, some privileged components, add-on compatibility, and other internal Firefox plumbing use this ID as a product selector. Changing it can prevent `BrowserGlue` from starting, which breaks JSWindowActor registration and leaves the address bar/search UI unusable.

### 2. Keep web-facing user-agent identity as Firefox

In `browser/moz.configure`, explicitly set the app UA name:

```python
# Keep browser/server-visible identity Firefox-compatible. UI and executable
# branding are Umbrafox, but web content must not receive an Umbrafox UA token.
imply_option("MOZ_APP_UA_NAME", "Firefox")
```

This is mandatory. `MOZ_APP_NAME`, `MOZ_APP_BASENAME`, `MOZ_APP_DISPLAYNAME`,
and `MOZ_APP_VENDOR` can identify the local application as Umbrafox. The web
identity must not.

If `MOZ_APP_UA_NAME` is unset, `netwerk/protocol/http/nsHttpHandler.cpp` falls
back through app info and can append an `Umbrafox/<version>` token to the
outbound HTTP `User-Agent` and expose Umbrafox through `navigator.userAgent`.
That leak was observed on AMO: `addons.mozilla.org` treated the browser as not
Firefox and showed "Download Firefox and get the extension" instead of normal
install controls.

Do not put `MOZ_APP_UA_NAME=Firefox` in `browser/confvars.sh`; configure rejects
that as an invalid confvars-owned option. Use `imply_option(...)` in
`browser/moz.configure`, matching Firefox's supported configure flow.

### 3. Change the default app basename and executable name

In `build/moz.configure/init.configure`, change the default browser basename from `Firefox` to `Umbrafox`.

Current expected default:

```python
return "Umbrafox"
```

This feeds application metadata such as `application.ini` `Name`.

In each browser branding `configure.sh`, explicitly set:

```sh
MOZ_APP_NAME=umbrafox
```

`MOZ_APP_NAME` is the build-system source for the executable and package app name. The expected Linux build outputs are:

```text
dist/bin/umbrafox
dist/bin/umbrafox-bin
```

Do not confuse this with `MOZ_APP_DISPLAYNAME`, which controls visible product text, or with user-agent/app-version web surfaces, which must remain Firefox-equivalent under the mandatory rulebook.

### 4. Rename the branding mozbuild template

In `browser/branding/branding-common.mozbuild`, rename the branding template:

```python
def FirefoxBranding():
```

to:

```python
def UmbrafoxBranding():
```

Then update every branding `moz.build` file to call `UmbrafoxBranding()`.

### 5. Update channel display names and remoting names

Set:

- Official display name: `Umbrafox`
- Unofficial display name: `Umbrafox`
- Nightly display name: `Umbrafox Nightly`
- Aurora display name: `Umbrafox Developer Edition`
- Executable name for every channel: `umbrafox`
- Aurora remoting name: `umbrafox-dev`
- Nightly bundle ID suffix: `umbrafoxnightly`
- Unofficial bundle ID suffix: `umbrafox`

These live in the channel-specific `configure.sh` files under `browser/branding/`.

### 6. Update brand localization files

For each channel brand file:

- Replace `-brand-shorter-name`
- Replace `-brand-short-name`
- Replace `-brand-shortcut-name`
- Replace `-brand-full-name`
- Replace `-brand-product-name`
- Replace `-vendor-short-name`
- Clear Mozilla trademark text where it no longer applies.

Expected official/unofficial values:

```ftl
-brand-shorter-name = Umbrafox
-brand-short-name = Umbrafox
-brand-shortcut-name = Umbrafox
-brand-full-name = Umbrafox
-brand-product-name = Umbrafox
-vendor-short-name = Umbrafox
trademarkInfo = { " " }
```

### 7. Update TypeScript app constants

In `tools/@types/subs/AppConstants.sys.d.mts`, update the expected browser constants:

```ts
MOZ_APP_NAME: "umbrafox" | "thunderbird";
MOZ_APP_BASENAME: "Umbrafox";
MOZ_APP_DISPLAYNAME_DO_NOT_USE: "Umbrafox";
MOZ_MACBUNDLE_ID: "org.umbrafox.umbrafox";
MOZ_MACBUNDLE_NAME: "Umbrafox.app";
```

This keeps static analysis and editor tooling aligned with the rebrand.

### 8. Avoid duplicate version output

After setting both vendor and app name to Umbrafox, version output can become `Umbrafox Umbrafox ...`.

In `toolkit/xre/nsAppRunner.cpp`, add a helper that prints the vendor only when it differs from the app name:

```cpp
static inline bool ShouldDumpVendor() {
  return gAppData->vendor && *gAppData->vendor &&
         (!gAppData->name ||
          strcmp((const char*)gAppData->vendor, (const char*)gAppData->name));
}
```

Use this helper in `DumpVersion()` and `DumpFullVersion()`.

### 9. Sweep nearby user-visible comments and strings

The current patch also changes explanatory comments in `nsAppRunner.cpp` from Firefox to Umbrafox. That is not required for runtime behavior, but it keeps future searches clearer.

Do not blindly rename all identifiers. Examples like `firefoxHomeDeps`, `firefoxHomeActive`, `-firefox-home-brand-name`, and many `firefox` URL/support identifiers are still internal upstream naming conventions.

## Verification

After building:

```bash
grep -n "^Vendor=\\|^Name=" obj-*/dist/bin/application.ini
grep -n "MOZ_APP_NAME" obj-*/config.status
grep -n "MOZ_APP_UA_NAME" obj-*/config.status
ls obj-*/dist/bin/umbrafox obj-*/dist/bin/umbrafox-bin
./mach run --temp-profile --version
```

Expected `application.ini` lines:

```ini
Vendor=Umbrafox
Name=Umbrafox
```

Version output should not duplicate `Umbrafox`.

If stale `dist/bin/firefox` files remain after changing branding, they are old object-directory build artifacts. A clobber or manual removal of those generated files clears them; source builds should use `umbrafox` once `MOZ_APP_NAME=umbrafox` is configured.

Also verify web-facing identity with a local page or equivalent browser test.
Both the HTTP request header and page-visible navigator value must match
Firefox and must not contain Umbrafox:

```text
HTTP_USER_AGENT=Mozilla/5.0 (X11; Linux x86_64; rv:154.0) Gecko/20100101 Firefox/154.0
NAVIGATOR_USER_AGENT=Mozilla/5.0 (X11; Linux x86_64; rv:154.0) Gecko/20100101 Firefox/154.0
```

Record any future identity leak in
`umbrafox-conversion-guide/reference/web-identity-leak-log.md`.
