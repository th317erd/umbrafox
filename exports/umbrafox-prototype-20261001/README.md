# UmbraLink Prototype, October 1, 2026

## Artifact

- Umbrafox 158.0a1, Linux x86-64, BuildID `20261001103920`.
- Archive: `umbrafox-158.0a1-20261001103920-linux-x86_64.tar.xz`.
- Size: 106947896 bytes.
- SHA256: `4a3b9608c856bf6b9cf0d28e10a4183a553c2313b8db404c8cab39db6c3e5fe5`.
- `umbrafox/` is a clean extraction of the archive, not a symlinked dist/bin tree.
- Build host: wyatt-desktop. Base commit: `892431809a4caadb5c73b2c03ad9bdb124c3e21e`.
- Built from the existing dirty checkout, including prior native performance
  work. `tracked-source.patch` and `new-source-files.tar.gz` preserve the relevant
  tracked delta and additional source files; the base commit alone is not the
  complete source. Unrelated staged/unstaged work was not reverted or committed.

The installed browser and launcher have NOT been replaced. Wyatt's active work
browser was not closed, restarted or modified. Installation waits until he is
ready to close it; never replace its files while it is running.

## Implemented Control

- `umbrafox.browsingContext.create`, `.navigate`, `.close`.
- `umbrafox.script.execute`, with page or explicitly privileged browser realm.
- Existing per-run authenticated loopback transport; no automation flags or
  unsolicited public page bindings added by these commands.
- Full protocol and limitations: `toolkit/components/umbrafox/docs/control.md`.

Real integration caught two defects missed by the initial mocks: this Gecko
version requires `BrowsingContext.topChromeWindow` instead of the nonexistent
browser `ownerGlobal` property, and ordinary privileged execution needs the
supported per-evaluation filename-restriction opt-out. Only explicit browser
realm opts out; page realm and global security preferences remain unchanged.

## Verification

Evidence directory: `artifacts/umbralink-control/` in the source checkout.

- Full normal build `./mach build -j 2` passed (approximately nine minutes).
- The first build regenerated INI timestamps after compiling the executable.
  A failing runtime/INI assertion preserved that mismatch. Normal rebuild and
  package with `MOZ_BUILD_DATE=20261001103920` produced matching runtime and INI
  IDs; no generated INI values were hand-edited.
- `./mach package` passed. Extracted package `--version`: Umbrafox 158.0a1.
- Strict Node suite: 12/12 pass; scoped ESLint, formatting and diff checks pass.
- Browser control/input/service suite: 84 assertions pass, zero failures,
  one harness-reported TODO, zero unexpected results. New control test accounts
  for 23 passing assertions. Coverage includes actual page globals/prototypes,
  private/container tabs, privileged execution with filename enforcement enabled,
  Promise results, serialization errors, timeouts, stale documents, navigation,
  tab lifecycle and existing authentication/input/diagnostics behavior.
- Mochitest itself enables automation; its results are not evidence that
  webdriver is false in an ordinary launch.
- Separate non-automation OFF/ON test passed on the build and extracted package.
  Ordinary local page code compared 1030 window names, 49 Navigator prototype
  descriptors, 232 Document prototype descriptors, 146 Element prototype
  descriptors, native function strings, UA and DOM before/after read-only
  commands and between OFF/ON. Webdriver remained false; Services/control
  bindings were absent from the page.
- Packaged smoke additionally passed create/navigate/execute/close, explicit
  parent execution, exact native owned application-data paths, runtime BuildID,
  owned SIGTERM cleanup and subsequent exact root PID absence.
- Fresh private profile, app-data and local-app-data directories were used for
  every standalone launch. No personal profile or shared crash queue was used.
  Failed attempts are retained alongside successful evidence.

## Limits And Defaults

These are targeted same-build OFF/ON regression checks, NOT a comprehensive
independent stock-Firefox comparison or proof about every JS, network, rendering
or timing surface. No performance improvement or GPU correctness claim follows.
Headless runs retained host sandbox-namespace EPERM and SWGL warnings.

Optional Umbrafox performance probes were not enabled. Experimental single-image
opacity remains default OFF. No personal preference or extension changes were
made. This is a dogfood prototype, not a production-release certification of all
earlier native experiments.

Authenticated browser-realm scripts have full owner privilege. Asynchronous
timeouts do not preempt infinite synchronous JavaScript or undo explicit script
effects. Owner-written scripts can deliberately change pages; plumbing parity
does not promise invisibility of those deliberate actions.

## Repeatable Commands

```sh
MOZ_BUILD_DATE=20261001103920 ./mach build -j 2
MOZ_BUILD_DATE=20261001103920 ./mach package
timeout 30 node --unhandled-rejections=strict --test tools/umbrafox/tests/control/control-spec.mjs
timeout 120 node tools/umbrafox/tests/control/parity-smoke.mjs ABS_PACKAGED_BINARY NEW_ABS_OUTPUT
```

The standalone test creates its own local server, fresh directories and browser
processes, and closes only its owned test processes. Its result JSON records the
scope and cleanup. Never point it at the owner's existing profile or use its
launch as authorization to restart the work browser.
