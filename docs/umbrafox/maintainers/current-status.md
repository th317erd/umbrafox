---
title: Current Umbrafox implementation status
status: current
doc_type: maintainer-status
audience: [maintainers, developers, QA, operators]
last_verified: 2026-10-27
canonical: true
---

# Current Umbrafox implementation status

> **Current documentation.** Evidence was audited at `7305e5b18a1c`; documentation edits do not change runtime behavior.

## Repository state at campaign start

- Branch `main` matched `origin/main` at `7305e5b18a1c`.
- The fork had 61 commits after recorded upstream base
  `1a097ed8d31f6b307a5d0ebc34a82ceaf7f3727b`.
- The source/test/build-configuration/tool exception inventory contained 505 paths: 172 added and 333 modified.
- The checkout already contained a modified stabilization plan and hundreds of
  untracked files, many identified by that plan as files deleted by newer
  upstream Firefox. This campaign did not clean, stage, or alter those source files.

## Source-backed current features

- Internal Umbrafox branding plus explicit Firefox UA identity.
- Quiet/default-pref, home/newtab, search, suggestion, data-collection, and remote-feature changes.
- Partial document-focused userland scripts with six event families.
- Default-off, token-authenticated loopback UmbraLink with 19 commands.
- Panel, tab mute-affordance, and opt-in Chrome-shortcut behavior.
- Linux clipboard override prototype.
- Linux DMABUF/canvas, WebRender/Wayland, media seek, V4L2, diagnostics, and performance-tool exceptions.

## Evidence boundary

Source, manifests, tests, recipes, commits, and retained reports were audited.
This documentation campaign did not run a full Firefox build, package, install,
live browser, hardware decoder, Pi compositor, or cross-browser parity matrix.
The proposed stabilization plan records that the latest T2/T3/T4 source set had
not received a full build/package/runtime gate as of 2026-10-24; later commits
through the audited head are documentation-only.

Therefore:

- Source presence is not a current artifact/runtime claim.
- Historical pass counts apply only to their recorded revision and environment.
- V4L2 device selection, hybrid external-video hardware acceptance, and full
  current-head parity remain open until the roadmap gates run.
- The installed daily browser may differ from this checkout; inspect its BuildID and package receipt.

## Documentation verification

The campaign adds a read-only verifier for indexes, banners, relative links,
legacy-root removal, UmbraLink command coverage, and exact exception inventory.
See the campaign report for the final results.
