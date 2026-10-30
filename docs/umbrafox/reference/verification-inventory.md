---
title: Umbrafox test and verification inventory
status: current
doc_type: reference
audience: [developers, QA, maintainers]
last_verified: 2026-10-27
canonical: true
---

# Umbrafox test and verification inventory

> **Current documentation.** Test presence is not a claim that every suite passed on the current checkout.

## Product/default tests

- Umbrafox home/defaults xpcshell coverage.
- Search selector runtime filtering and region-default tests.
- Activity Stream/preferences browser tests adjusted for opt-in upstream UI.
- Web identity parity smoke tooling under `tools/umbrafox/tests/control/`.

## Userland and UmbraLink

- Toolkit browser manifests cover control service, browsing/script, input,
  document start, event families, and mutation inactivity.
- Toolkit xpcshell tests cover store, scope, runner, and runtime.
- Standalone Node userland tests cover capability, controller, and request logic.
- Customizable UI tests cover the UmbraLink toggle.

## Chrome controls and clipboard

- Panel keyup/Escape chrome and browser coverage.
- Tabbrowser media tests preserve non-inline mute behavior.
- CustomKeys browser and standalone preset tests.
- Clipboard GTests, browser tests, xpcshell tests, actor tests, permission tests,
  and retained package evidence.

## Graphics, media, and performance

- Canvas/DMABUF/readback/import/fence GTests and standalone tests.
- WebRender unit tests for markers/admission and hybrid source contracts.
- Media audio/remote-image tests.
- Mutation, opacity, probe-gate, performance, lifecycle, playback, marker, and
  cache analysis tools with focused Node/Python tests.

## Verification tiers

1. Static: documentation drift, syntax/lint, generated inventory, diff checks.
2. Focused: subsystem unit/xpcshell/browser/GTest/Rust tests.
3. Integration: full build, package, clean-profile startup, parity probes.
4. Hardware: matching x86/ARM artifact, decoder/compositor selection, pixels,
   timing, lifecycle, fallback, shutdown, and resource behavior.

The [testing guide](../guides/testing.md) maps changes to commands. Historical
pass counts remain evidence for their exact revision/environment only.
