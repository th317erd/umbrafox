# Recipe template

Copy this file when adding a new Umbrafox conversion recipe.

## Goal

Describe the user-visible or project-visible behavior.

## Files changed

- `path/to/file`

## Data flow

Explain where the setting, build flag, asset, or UI element starts and how it reaches the built browser.

## Steps

1. Change the source file.
2. Update related defaults or generated metadata.
3. Update tests.
4. Update this guide's inventory.

## Verification

```bash
./mach lint path/to/file
./mach build faster
```

Manual checks:

- Check one.
- Check two.

## Rebase notes

List expected conflict hotspots and symptoms when this recipe is stale.
