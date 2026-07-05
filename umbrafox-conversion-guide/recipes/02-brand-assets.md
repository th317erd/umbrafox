# Recipe 02: Brand assets

## Goal

Replace visible Firefox/Nightly icons and wordmarks with Umbrafox assets.

## Files changed

SVG and text-like assets:

- `browser/branding/aurora/content/about-wordmark.svg`
- `browser/branding/aurora/content/firefox-wordmark.svg`
- `browser/branding/nightly/content/about-wordmark.svg`
- `browser/branding/nightly/content/firefox-wordmark.svg`
- `browser/branding/official/content/about-wordmark.svg`
- `browser/branding/official/content/firefox-wordmark.svg`
- `browser/branding/unofficial/content/about-logo.svg`
- `browser/branding/unofficial/content/about-wordmark.svg`
- `browser/branding/unofficial/content/firefox-wordmark.svg`

Windows installer metadata:

- `browser/branding/aurora/branding.nsi`
- `browser/branding/nightly/branding.nsi`
- `browser/branding/official/branding.nsi`
- `browser/branding/unofficial/branding.nsi`

Raster/icon assets currently replaced under `browser/branding/unofficial/`:

- `PrivateBrowsing_150.png`
- `PrivateBrowsing_70.png`
- `VisualElements_150.png`
- `VisualElements_70.png`
- `content/about-logo-private.png`
- `content/about-logo-private@2x.png`
- `content/about-logo.png`
- `content/about-logo@2x.png`
- `content/about.png`
- `default16.png`
- `default22.png`
- `default24.png`
- `default32.png`
- `default48.png`
- `default64.png`
- `default128.png`
- `default256.png`
- `document.ico`
- `document_pdf.ico`
- `firefox.ico`
- `firefox64.ico`
- `newtab.ico`
- `newwindow.ico`
- `pbmode.ico`

## Steps

### 1. Replace channel wordmarks

For all four branding channels, update `about-wordmark.svg` and `firefox-wordmark.svg` so the visible text/paths represent Umbrafox.

Keep filenames unchanged unless you also update all build references. Firefox source still expects filenames such as `firefox-wordmark.svg`.

### 2. Replace unofficial channel raster assets

The current conversion replaced the unofficial channel PNG and ICO assets. Keep dimensions and file formats compatible with upstream callers.

Before replacing a future asset, inspect current dimensions:

```bash
file browser/branding/unofficial/default*.png
file browser/branding/unofficial/*.ico
file browser/branding/unofficial/content/*.png
```

After replacement:

```bash
git diff --numstat -- browser/branding/unofficial
./mach build faster
```

### 3. Update Windows installer branding metadata

Update each changed `branding.nsi` file for Umbrafox naming. These files affect Windows installer strings, registry-facing names, and shortcut labels.

During future rebases, use a focused diff:

```bash
git diff -- browser/branding/*/branding.nsi
```

### 4. Do not rename asset paths casually

Many internal paths still contain `firefox` in filenames. That is acceptable if the asset content and built display are Umbrafox.

Renaming files like `firefox.ico` or `firefox-wordmark.svg` requires tracing all build and packaging references. Avoid that until there is a dedicated asset-path cleanup recipe.

## Verification

Build and inspect:

```bash
./mach build faster
./mach run --temp-profile
```

Manual checks:

- Window/taskbar icon.
- New tab icon.
- About dialog logo.
- Private browsing icon.
- Installer/shortcut names on Windows when Windows packaging is tested.
