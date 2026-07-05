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

### 1. Change app vendor and application ID

In `browser/moz.configure`, change:

```python
imply_option("MOZ_APP_VENDOR", "Mozilla")
imply_option("MOZ_APP_ID", "{ec8030f7-c20a-464f-9b0e-13a3a9e97384}")
```

to:

```python
imply_option("MOZ_APP_VENDOR", "Umbrafox")
imply_option("MOZ_APP_ID", "{68018e80-d4dd-4f8d-baf1-a314380e40c2}")
```

The ID must stay stable once users have profiles and integrations depending on it.

### 2. Change the default app basename

In `build/moz.configure/init.configure`, change the default browser basename from `Firefox` to `Umbrafox`.

Current expected default:

```python
return "Umbrafox"
```

This feeds application metadata such as `application.ini` `Name`.

### 3. Rename the branding mozbuild template

In `browser/branding/branding-common.mozbuild`, rename the branding template:

```python
def FirefoxBranding():
```

to:

```python
def UmbrafoxBranding():
```

Then update every branding `moz.build` file to call `UmbrafoxBranding()`.

### 4. Update channel display names and remoting names

Set:

- Official display name: `Umbrafox`
- Unofficial display name: `Umbrafox`
- Nightly display name: `Umbrafox Nightly`
- Aurora display name: `Umbrafox Developer Edition`
- Aurora remoting name: `umbrafox-dev`
- Nightly bundle ID suffix: `umbrafoxnightly`
- Unofficial bundle ID suffix: `umbrafox`

These live in the channel-specific `configure.sh` files under `browser/branding/`.

### 5. Update brand localization files

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

### 6. Update TypeScript app constants

In `tools/@types/subs/AppConstants.sys.d.mts`, update the expected browser constants:

```ts
MOZ_APP_NAME: "umbrafox" | "thunderbird";
MOZ_APP_BASENAME: "Umbrafox";
MOZ_APP_DISPLAYNAME_DO_NOT_USE: "Umbrafox";
MOZ_MACBUNDLE_ID: "org.umbrafox.umbrafox";
MOZ_MACBUNDLE_NAME: "Umbrafox.app";
```

This keeps static analysis and editor tooling aligned with the rebrand.

### 7. Avoid duplicate version output

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

### 8. Sweep nearby user-visible comments and strings

The current patch also changes explanatory comments in `nsAppRunner.cpp` from Firefox to Umbrafox. That is not required for runtime behavior, but it keeps future searches clearer.

Do not blindly rename all identifiers. Examples like `firefoxHomeDeps`, `firefoxHomeActive`, `-firefox-home-brand-name`, and many `firefox` URL/support identifiers are still internal upstream naming conventions.

## Verification

After building:

```bash
grep -n "^Vendor=\\|^Name=" obj-*/dist/bin/application.ini
./mach run --temp-profile --version
```

Expected `application.ini` lines:

```ini
Vendor=Umbrafox
Name=Umbrafox
```

Version output should not duplicate `Umbrafox`.
