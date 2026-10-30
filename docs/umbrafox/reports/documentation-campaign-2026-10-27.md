---
title: Umbrafox documentation campaign evidence — 2026-10-27
status: current
doc_type: report
audience: [maintainers, bots]
last_verified: 2026-10-27
canonical: false
---

# Umbrafox documentation campaign evidence — 2026-10-27

> **Current dated evidence.** Source and tests outrank this report; it records what the documentation campaign actually inspected and verified.

## Scope

The campaign read project/global instructions, the complete UmbraLink skill,
mandatory modification rules, conversion/current-state/changed-file/gotcha/leak
references, root and subsystem docs, fork history, source/test/tool diff, key
Umbrafox modules, prefs, manifests, test registrations, and the complete legacy
document inventory. It traced exception categories through producers,
consumers, tests, recipes, and retained reports.

## Documentation consolidation

- Moved the complete former 283-file legacy documentation tree under
  `docs/umbrafox/archive/` and applied visible archive authority banners.
- Moved the 31-file conversion guide under `docs/umbrafox/conversion-guide/`
  with current-guidance banners.
- Repaired old executable/navigation paths throughout the relevant repository material.
- Added canonical architecture, reference, guide, operations, maintainer,
  roadmap, and index pages under one Umbrafox documentation root.
- Retained export evidence and embedded source patches byte-for-byte; historical
  path references inside immutable exports were deliberately not rewritten.

## Mechanical inventory

- Recorded upstream base: `1a097ed8d31f6b307a5d0ebc34a82ceaf7f3727b`.
- Fork commits after base at audit: 61.
- Source/test/build-configuration/tool exception paths: 505 (172 added, 333 modified).
- UmbraLink commands in current dispatcher: 19.
- Historical project files preserved: 283.
- Conversion-guide files preserved: 31.

## Runtime/build boundary

No full build, package, installation, live browser, external consumer, parity
matrix, or target-hardware run was performed. This was a documentation-only
campaign on a heavily dirty checkout. Existing untracked source and the owner's
modified stabilization plan were preserved.

## Verification

- Documentation verifier: 348 linked, reachable, authoritative Umbrafox pages;
  289 archive pages; 31 conversion-guide pages.
- Exception drift guard: all 505 paths match source (172 added, 333 modified).
- UmbraLink coverage: all 19 dispatcher methods appear in the protocol reference.
- Documentation verifier Python syntax: passed.
- UmbraLink standalone control contract: 12 passed, 0 failed.
- Chrome-style keyboard preset contract: 13 passed, 0 failed.
- Git diff check and dedicated documentation trailing-whitespace scan: passed.
- Full Firefox build, browser/xpcshell/GTest/Rust suites, package, live browser,
  installation, parity matrix, and hardware gates were not run because no
  runtime source changed and the checkout's current build status is itself an
  explicitly documented open gate.
