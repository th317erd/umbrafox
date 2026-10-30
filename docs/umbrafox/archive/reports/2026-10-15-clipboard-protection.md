# Explicit site clipboard overrides

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Outcome

The Linux prototype implements the agreed Firefox-default, explicit-override
policy in commit `47e6fdeb78fee3bde3447b348f49244025b0b738`.
Native compilation, real browser integration, clipboard snapshot
regressions and permission storage tests pass. Packaging and inactive installation
are recorded separately in `exports/umbrafox-clipboard-20261015/`. The verified
self-contained package is installed inactive at `~/Programs/umbrafox-nightly`,
with the previous installation retained and an isolated successful version check.
Launcher/profile activation is pending owner close consent; do not infer it from
the installation receipt.

Three scoped subagents handled permission UI, the private actor bridge and
independent review. The coordinator implemented native command/retry handling,
integrated their work, resolved actual runtime failures and owns packaging.
Coordination: `/tmp/codex/clipboard-20261015/teamwork.sqlite`, session
`clipboard-20261015`, control file `control.txt`. All worker lanes are closed.

## Behavior

- A content-canceled native `cmd_copy` or `cmd_paste` outside effective
  contenteditable/designMode offers a dismissed browser permission indicator.
  The original command finishes normally. Clicking the indicator opens
  No/Yes/Always; neither observing cancellation nor leaving it unanswered retries.
- No keeps the site's original result, including a custom clipboard payload.
  Yes makes one native retry only if the original document, focus, target,
  selection/value and clipboard generation are still safe. Stale requests fail
  closed; a brief browser hint can ask the owner to repeat the operation.
- Always saves only after an accepted native retry. Grants are exact-origin,
  operation and origin-attribute scoped, with standard site-permission revocation.
  A saved cross-origin frame grant remains visible when that frame loads after
  a top-level reload, before another clipboard attempt. Private grants are
  session-only and cleared when the last private context exits.
- Propagation stopping alone is not cancellation. Script `execCommand`, including
  activated/nested commands, and synthetic events cannot acquire native command
  authority. Privileged cancellation is not overridden. Native clipboard
  permissions, disabled/read-only controls and editing-host behavior remain.
- The actor messages contain only request/operation/window identity, never
  clipboard data. There is no new webpage API, event, permission name or pref.

The automatic-popup design was rejected during review: opening XUL permission
UI changes Escape/pointer-lock behavior before consent, even with autofocus
disabled. The dismissed indicator preserves those tested default behaviors.
An owner-approved retry or remembered grant can be observable by the site; this
is deliberate user customization, not a default-parity exception.

## Native And Permission Boundaries

`AutoClipboardCommand` scopes authority to native controller Copy/Paste;
`Document::ExecCommand` suspends it for the entire script command. Nested
controllers cannot borrow outer authority. Clipboard, beforeinput and legacy
textInput hooks observe content cancellation without changing default status.

One pending native request per process retains the original document/target,
range identity and at most 1 Mi UTF-16 control value for at most 30 seconds of
eligibility. The timer releases ownership; a stalled event loop can delay physical
cleanup, but time checks still reject expired actions. Tokens are consumed before
retry, with post-handler freshness checks. Changes to readonly/disabled during
replayed beforeinput now reject success rather than saving a grant for a no-op.

`nsIClipboardDataSnapshot::IsCurrentForClipboardOverride` is appended after the
four existing methods and is C++-only (`noscript, notxpcom, nostdcall`). A private
generation-only IPC validates child snapshots on explicit retry. The real native
sequence is compared without cache cleanup or clipboard-owner callbacks. Stale
paste does not fall back to newer clipboard contents. Populated snapshots cannot
prove current generation and fail closed. When Content Analysis might be active,
copy notices skip snapshot acquisition rather than fetching data for the notice;
an unavailable safe snapshot means retry is unavailable, not DLP bypass.

Grant keys are `umbrafox-clipboard-{copy|paste}^` plus the encoded full principal
origin, preserving origin attributes even if PermissionManager normalizes them.
The bridge verifies the authoritative current WindowGlobal and active selected
browser; native validation remains authoritative at execution.

Current frame grant listing is O(current frames). A private window-global-created
observer exists only while explicit ALLOW clipboard grants exist, and refreshes
chrome for an exact granted current frame. Registration scans are O(all saved
permissions), with O(G * P) worst-case rescans for G bulk removals. This is not
represented as constant-cost or a performance improvement.

## Verification

All browser runs used disposable harness profiles, fresh private MOZ_APP_DATA and
MOZ_LOCAL_APP_DATA directories, nonlocal-connection protection and the headless
clipboard backend. The daily browser, personal profile and clipboard were not
used. Logs are under `/tmp/codex/clipboard-20261015/`; durable selected copies
belong in the export's `evidence/logs/` directory.

| Gate | Result |
| --- | --- |
| Full native build, then final incremental build8 | PASS; build8 1m43, 2 C++/Rust jobs, nice10 |
| Seven browser files, `browser-final-4.log` | 808 assertions PASS, 0 unexpected failures, 2 expected harness preference-migration TODOs |
| Sync/async existing clipboard snapshots | 668 assertions PASS, 0 failures |
| New permissions plus existing SitePermissions xpcshell | 148 assertions PASS across 2 files |
| UI/actor strict Node suites | 51 tests PASS |
| Package source/archive and installer adapters | 12 tests PASS |
| Launcher selection and beta overlay | 16 tests PASS; launcher not activated |
| Exact 12-file registered JS lint | 0 errors/warnings; final source formatting applied |

The browser matrix exercises actual native commands through registered actors,
real No/Yes/Always buttons, saved retries and standard revocation for copy/paste.
It includes default event/focus/viewport/key/pointer-lock traces, custom handlers,
copy/paste snapshot staleness, inherited editing hosts/designMode, propagation
versus cancellation, privileged cancellation, nested and synthetic commands,
target replacement, navigation, wrong tokens/windows/operations, single-use
failure, and read-only/disabled mutation during beforeinput.

The safety fixture initially stalled on activated script paste because Firefox
waited for normal clipboard permission UI. It now separately tests default
no-activation denial and explicitly permitted script paste using the existing
test-only asyncClipboard preference, restored in `finally`. Production prefs
were not changed. Both paths must remain without native override authority.

Initial xpcshell runs crashed at `CheckForBrokenChromeURL` before test execution:
the harness derives `<appname>-appdir`, while this manifest only had
`firefox-appdir`. Its command-line app-path is reset for each manifest test.
Adding the equivalent `umbrafox-appdir = "browser"` fixed module registration;
the existing SitePermissions test independently failed before and passed after.
Both failed logs and their explicit missing-resource crash reason are retained.
This was a harness configuration failure, not evidence of a daily-browser crash.

## Commands

Native build source:
`/home/wyatt/.cache/codex/umbrafox-beta-20261012-nYSBPOWS/source`.
Use its sibling `obj/.mozconfig`, `CARGO_BUILD_JOBS=2`,
`MOZ_BUILD_DATE=20261015235226`, `nice -n 10`, and a 1800-second outer timeout for
`./mach build -j2`. Preserve logs; frontend-only refreshes use `mach build faster`.

From that source, with fresh private app-data roots for each invocation:

```sh
timeout 300s ./mach mochitest --headless --keep-open=false --timeout 20 --max-timeouts 1 \
  browser/modules/test/browser/browser_UmbrafoxClipboardProtection.js \
  dom/events/test/clipboard/browser_umbrafox_clipboard.js \
  dom/events/test/clipboard/browser_umbrafox_clipboard_override.js \
  dom/events/test/clipboard/browser_umbrafox_clipboard_safety.js \
  dom/events/test/clipboard/browser_document_command_copy.js \
  dom/events/test/clipboard/browser_document_command_cut.js \
  dom/events/test/clipboard/browser_document_command_paste.js
timeout 180s ./mach mochitest --headless --keep-open=false --timeout 20 --max-timeouts 1 \
  widget/tests/test_clipboard_getDataSnapshotSync_chrome.html \
  widget/tests/test_clipboard_getDataSnapshot_chrome.html
timeout 120s ./mach xpcshell-test --sequential --verbose \
  browser/modules/test/unit/test_UmbrafoxClipboardPermissions.js \
  browser/modules/test/unit/test_SitePermissions.js
```

From the main checkout:

```sh
timeout 30s node --experimental-vm-modules --unhandled-rejections=strict --test \
  browser/modules/test/unit/test_UmbrafoxClipboardProtection.mjs \
  toolkit/actors/tests/test_umbrafox_clipboard_bridge.mjs
timeout 30s python -B -m unittest discover \
  -s exports/umbrafox-clipboard-20261015/evidence -p '*_spec.py'
timeout 30s node --test tools/umbrafox/beta/test/launcher-spec.mjs \
  tools/umbrafox/beta/test/preferences-spec.mjs
```

## Limits And Reapplication

This is Linux x86_64 prototype evidence, not cross-platform release acceptance.
It is not an exhaustive same-build Firefox A/B fingerprint or timing proof.
Optimized tests do not provide refcount leak detection. Physical OS keyboard/menu
matrices, all shadow-tree editing cases and a real 30-second expiry boundary are
not comprehensively runtime-tested; bounded fake-clock lifecycle checks cover the
UI/actor timer. Cut, middle-click primary selection, paste-as-quotation, CSS
selection suppression and canceled keydown before a native command exists are
outside this first version. No guarantee is made against a page subsequently
erasing inserted text. Single-range replay only; unsafe states require a fresh
user command.

Canonical reapply record: conversion-guide recipe19. Build provenance must retain
base `d43214d6704182dabefff44b772764db04e386f1` PLUS its exported binary source patch
and new-file supplement, not label the package as that base or main HEAD alone.
The beta overlay retains the owner's two earlier experimental graphics opts;
it does not imply those experiments now passed their separate smoothness gates.

The installed nightly and current dated installation were found to select
different profiles. Do not switch the launcher or alter installation profile
mapping while the owner is using the browser. The separate launcher candidate
is tested, but activation requires a verified mapping and owner close consent.
