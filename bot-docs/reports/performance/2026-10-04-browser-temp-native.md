# Browser Temporary Directory Native Check

## Result

PASS, one disposable headless browser on `wyatt-laptop`. Capture ran from
2026-10-05 01:06:10.089 UTC to 01:06:21.413 UTC (October 4 in Phoenix):
11.324 seconds inside the 30-second total budget. No second browser was launched.

Wyatt approved this check and then authorized using the laptop for testing as
needed, noting that it is mainly a bot machine. This does not authorize touching
his desktop work browser, personal profiles, or installed daily browser.

## Native Evidence

Existing authenticated UmbraLink browser-realm execution returned PID865122,
context10 and runtime BuildID20261003071500. The native values exactly matched
the harness-created private children of the owned run:

- `UAppData`: `run/app-data`.
- `DefProfLRt`: `run/local-app-data`.
- `PathUtils.tempDir` and directory-service `TmpD`: both `run/temp`.
- Child `TMPDIR`, `TMP` and `TEMP` all matched that same temporary directory.

The run root was
`/home/wyatt/.cache/codex/browser-temp-native-20261004-ZRBCxx` on the laptop.
The existing creation-identity, owner, permissions and empty-directory prelaunch
checks passed. The native reply was saved before validation. Adjacent INI build
IDs matched the observed runtime, and libxul matched pinned SHA256
`1e2e164e54d826958361ccff1e4a75bb1c92814f9b87877ab340c3bc56f7f2fb`.

Cleanup was clean, by owned SIGTERM, with 182 log bytes and zero drops. Independent
post-run `/proc` checks established absence of the controller and all 11 browser
identities seen in the five resource samples and baseline, including the root.
The copied installation passed its postcheck with no updater-directory additions.

Peak sampled run artifact size was 187,920,913 bytes, leaving 80,514,543 bytes
(about 76.8 MiB) below the unchanged 256 MiB cap. Peak summed browser VmRSS was
1,531,564,032 bytes; shared pages may be counted repeatedly, so this is safety
accounting, not private heap usage. All samples satisfied the existing caps.

## Verification And Artifacts

- New entrypoint: `artifacts/umbralink-control/browser-temp-native.mjs`.
- It composes the existing fresh-installation, native receipt, capture, resource
  monitor and cleanup helpers. No shared harness or browser source was changed.
- The callback adds no browser RPC or wait. Existing ten-second startup quiet
  period remains inside the 15-second work budget, with 15 seconds for cleanup.
- Initial missing-entrypoint test failure is retained as scaffolding RED, not
  a behavioral regression. Final focused integration/unit selection: 92 PASS.
- Prettier and scoped diff-whitespace checks pass. The prior 447-test full-suite
  result applies to unchanged shared harness code; it was not rerun here.
- All 18 transferred harness files were hashed locally and verified remotely.
  Manifest SHA256: `dd217621f044e5594b633742ce26aed7e6b7371d5a74e677bdbadbf3c22a00f3`.
- All 26 exported evidence files were independently rehashed after transfer.
  Manifest SHA256: `9c60f258d11feb72003b6f85ca135cb50db83da91d98e11fc0b5644f2bbf3900`.
- The separate `pid-audit.json` checks sampled children as well as both roots;
  the first export's `audit.json` intentionally contains only the two root checks.
- Local evidence: `artifacts/umbralink-control/browser-temp-native/`.
  Remote harness: `~/.cache/codex/browser-temp-harness-20261004-YOFDRs`.
- Staged index SHA256 remained `3b78253cf775a4a1e8c69a4b82cc3958b366056129a391f4ae362bdfe8e4e0c4`.

## Limits And Next Work

This clears the browser-parent native temporary-directory gate. It does not
establish pre-startup containment, every child's directory provider, continuous
filesystem or network isolation, or guaranteed headroom for longer runs.
No personal profile or shared crash queue was inspected or exported.

The log retains namespace EPERM and headless SWGL warnings. This was not a GPU
or video test, and it demonstrates no new speedup. The package was the unchanged
pinned baseline, not a rebuilt attachment-cleanup candidate. Further performance
comparisons must retain matching package provenance, resource limits and owned
cleanup; desktop work-browser permission remains separate.
