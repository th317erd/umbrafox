# Chrome Shortcut Preset: First Pass

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Result

Implemented and verified on Linux in an isolated headless test build. Not
packaged, installed, or activated in the owner's profile. The owner subsequently
authorized committing and pushing this source milestone.
The owner approved incremental progress and accepted features without exact
Chrome equivalents. This is not full Chrome parity.

In a build containing this patch, open `about:keyboard`, choose **Use Chrome
shortcuts**, and confirm. It applies these bindings through Firefox's existing
CustomKeys system:

| Binding | Firefox command |
| --- | --- |
| Ctrl+J | Downloads |
| Ctrl+E | Alternate search focus |
| Ctrl+Shift+N | New private window |
| Ctrl+1 through Ctrl+8 | Select numbered tab |
| Ctrl+9 | Select last tab |

The conflicting Ctrl+Shift+N reopen-window assignment is cleared; its command
and menu remain, and Ctrl+Shift+T is unchanged. The prior Alt+number bindings are
replaced, not retained as extra aliases. Ctrl+K and other existing shortcuts are
untouched unless the user has separately customized them.

The confirmation explains that these specific custom assignments are replaced.
Unrelated assignments are preserved. An unrelated conflicting key, including a
saved key not currently present in a window, rejects the entire preset before
mutation. Missing/protected target keys also reject it. The button is hidden and
the API refuses the Linux preset on Windows/macOS.

The existing per-key reset and **Restore defaults** restore Firefox defaults.
They do not undo to a historical snapshot of previous user customizations. The
preset uses existing `customKeys.json` and JSONFile deferred/atomic persistence,
not a second settings file. Runtime verification observed the new assignments
on disk; pure checks cover reconstructing the module from saved configuration.

## Implementation And Parity

`CustomKeys.sys.mjs` validates the batch, checks active windows and saved
assignments, applies the batch with one keyset refresh per window, and schedules
one existing JSONFile save. `CustomKeysParent` routes two allowlisted messages
from `about:keyboard`; the page provides confirmation and refreshes its rows.
No webpage listener, native event interception layer, web API, global preference,
OS binding, network behavior or profile-selection change was introduced.

The earlier unconditional edits in `browser-sets.inc.xhtml` and `browserSets.ftl`
were replaced with the approved opt-in approach. Those two files now exactly
match HEAD defaults. Their original intent and history remain in the superseded
bug report; do not reapply that diff.

Default reservation semantics remain Firefox's. Explicitly enabling this preset
changes which private-window chord is reserved. A real content-focused test proves
Ctrl+Shift+N reaches the page and is cancellable before opt-in, then is reserved
and opens a private window after opt-in. Enabled behavior is intentional user
customization, not claimed invisible. Reset restores the original attributes,
including localization and reservation, in existing/private windows.

## Verification

Source checkout base: `ed5c2e1dea6e` plus this patch. Frontend-only
test refresh used the existing isolated source/object tree:
`~/.cache/codex/umbrafox-beta-20261012-nYSBPOWS/{source,obj}`. Existing native
seek fixes there were preserved; this was not a release build or package proof.
The test binary reports native BuildID `20261014043800`. Exact copied frontend
files were checksum-compared against this checkout after tests, with no differences.

Logs: `/tmp/codex/chrome-hotkeys-20261015/`.

- Failing-first Node checks: 1 baseline pass, 12 expected failures for the absent
  preset API. Final: 13/13 pass in about 0.08 seconds.
- Browser first run: 35 passes, two test assertions failed because the test read
  a custom element through an Xray wrapper. Corrected to `wrappedJSObject`;
  no production behavior was changed for this test failure.
- Final entire CustomKeys browser-chrome directory: 350 passed, 0 failed, 1
  harness expected/todo result, 3 test files, about 19 seconds. No unexpected results.
- Real browser coverage: Downloads command dispatch once, search focus, all nine
  tab positions, private-window creation/inheritance, page-event reservation,
  on-disk persistence, all-attribute reset, conflicting customization rejection,
  UI confirmation/cancel, and the existing customization/editor regressions.
- Scoped ESLint, whitespace, license, test-manifest and trojan-source: zero errors
  or warnings. `git diff --check` passes.
- Both test browser runs exited; all 17 process IDs recorded in each log were
  absent in `/proc` afterward. Harness logs report stopping its test servers.

Commands (logs redirected; use fresh owned app-data directories for each run):

```sh
timeout 10s node --test tools/umbrafox/tests/keyboard/preset-spec.mjs
# In the isolated source, with MOZCONFIG pointing at its existing obj/.mozconfig:
timeout 180s ./mach build faster
timeout --signal=TERM 180s ./mach mochitest --headless --keep-open=false \
  --timeout 30 --max-timeouts 1 browser/components/customkeys/tests/browser/
```

Runtime env additionally forced `MOZ_APP_DATA` and `MOZ_LOCAL_APP_DATA` to fresh
0700 directories under `~/.cache/codex/chrome-hotkeys-test-{CxHefJve,7fL1yY9z}`,
plus `MOZ_CRASHREPORTER_NO_REPORT=1` and `MOZ_DISABLE_NONLOCAL_CONNECTIONS=1`.
Mochitest created its own disposable profiles. No owner browser, profile, launcher,
desktop pin, installed package or shared crash queue was intentionally accessed.
No general network-sandbox or zero-background-I/O claim follows from these flags.

## Limits And Next Steps

Deferred: Windows/macOS presets, other layouts/IME, retaining Alt+number aliases,
page-console and other DevTools conflicts, Shift+F5, app-menu/focus behavior,
Chrome-style Downloads/History destinations and Chrome-only features. Existing
Firefox commands still determine the resulting UI. Future extension-added keys
can create new conflicts after application; this is not a global shortcut arbiter.

Tests use Linux en-US, automation/headless settings and an existing native binary.
The suite logs SWGL/drag-service warnings, an existing expected pref-change result,
and disabled refcount leak checking; no leak, GPU or performance claim is made.
Native Windows/macOS and full process-restart acceptance were not run. Low-level
disk-full/atomic-write fault injection was not rerun for unchanged JSONFile code.
The API schedules the same deferred save as ordinary CustomKeys edits; success is
not a synchronous durable-write guarantee.

Packaging and the owner-approved daily-browser switch remain separate work.
Do not install or restart the owner's working browser as part of this handoff.
