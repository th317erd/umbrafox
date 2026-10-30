# Opt-in Chrome-style Linux shortcut preset

> **Current conversion guidance.** Verify this operational guidance against source and the canonical Umbrafox documentation before applying it to a new Firefox base.

## Status and goal

Implemented in `25de5d0b584d830c174f6060c8af5fcff0422912` and pushed to
`origin/main`. Verified in an isolated Linux test build; not packaged, installed
or activated in the owner's daily profile at this milestone. This is a partial
Chrome-style preset, not complete Chrome command/UI parity.

## Files changed

- `browser/components/customkeys/CustomKeys.sys.mjs`
- `browser/components/customkeys/CustomKeysParent.sys.mjs`
- `browser/components/customkeys/content/customkeys-sidebar.mjs`
- `browser/components/customkeys/content/customkeys.js`
- `browser/components/customkeys/tests/browser/browser.toml`
- `browser/components/customkeys/tests/browser/browser_ChromePreset.js`
- `browser/locales/en-US/browser/customkeys.ftl`
- `toolkit/modules/RemotePageAccessManager.sys.mjs`
- `tools/umbrafox/tests/keyboard/preset-spec.mjs`

Design and evidence:
[plan](../../archive/plans/chrome-hotkey-parity.md),
[verification report](../../archive/reports/2026-10-15-chrome-shortcut-preset.md).

## Data flow and behavior

The Linux-only Use Chrome shortcuts button in `about:keyboard` confirms intent,
then sends the allowlisted `CustomKeys:ApplyChromePreset` query to
`CustomKeysParent`. `CustomKeys.applyChromePreset` validates targets and checks
active and dormant saved bindings before modifying the existing `customKeys.json`
configuration. It refreshes each window's keysets and uses the existing deferred
JSONFile save, not a second preference or persistence mechanism.

Bindings are Ctrl+J Downloads, Ctrl+E alternate search focus, Ctrl+Shift+N private
window, Ctrl+1 through Ctrl+8 numbered tabs and Ctrl+9 last tab. Clear the
conflicting reopen-window shortcut without removing its command/menu. Replace
the old Alt+number bindings rather than adding aliases. Keep unrelated custom
assignments; reject conflicting batches before mutation. Missing/protected targets
also reject. Hide and reject this preset on Windows/macOS.

Reset restores Firefox defaults, not an earlier snapshot of user customizations.
Default web-visible key delivery remains unchanged. Opt-in changes the reserved
private-window chord; that detectable behavior is explicit user customization.

## Reapply after upstream updates

1. Inspect the commit with `git show 25de5d0b584d` and compare current upstream
   CustomKeys APIs, key IDs, default bindings and remote-page allowlists.
2. Preserve the coherent UI -> parent -> validated batch -> existing store path.
   Do not replace it with page-injected listeners or unconditional default keys.
3. Recheck collision rules, protected keys, localization, private/new windows,
   persisted assignments and reset behavior against the new upstream tree.
4. Preserve both test layers and rerun them after resolving conflicts.

Do not reapply the superseded two-file patch from
`docs/umbrafox/archive/bug-reports/2026-10-15-chrome-parity-hotkeys.md`. In particular, do not
unconditionally change `browser-sets.inc.xhtml` or `browserSets.ftl`: the earlier
patch created a Ctrl+J collision and changed default page event delivery.

## Verification

```sh
timeout 10s node --test tools/umbrafox/tests/keyboard/preset-spec.mjs
timeout 180s ./mach mochitest --headless --keep-open=false \
  --timeout 30 --max-timeouts 1 browser/components/customkeys/tests/browser/
```

Use a configured isolated build with current frontend files, a disposable test
profile and fresh owned application-data roots. See the linked report for the
environment and frontend refresh procedure. Never test in the owner's profile.
Run scoped lint and `git diff --check` too.

Original evidence: 13/13 Node tests; full browser directory 350 passed, zero
failed, one expected/todo result. Real command dispatch, all nine tab targets,
private-window inheritance, content-event reservation, persistent JSON,
confirmation/cancel, collision rejection and reset were covered. These historical
results must not substitute for new tests after an upstream merge.

Full process restart, other platforms/layouts, DevTools mappings and Chrome-style
command destinations remain outside this first pass.
