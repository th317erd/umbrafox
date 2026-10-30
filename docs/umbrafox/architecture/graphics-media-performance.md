---
title: Graphics, media, and performance architecture
status: current
doc_type: architecture
audience: [graphics-developers, media-developers, maintainers]
last_verified: 2026-10-27
canonical: true
---

# Graphics, media, and performance architecture

> **Current documentation.** This page separates committed mechanisms from historical experiments and hardware acceptance claims.

Umbrafox carries Linux graphics/media work beyond its product and user-control
features. These changes are exceptions to upstream Firefox and therefore belong
in the fork ledger even when default-inert or experimental.

## DMABUF video-to-canvas path

Changes span canvas/WebGL, remote media IPC, `GPUVideoImage`, GL blitting,
DMABUF surfaces, texture hosts, and GTK format/fence handling. The intended
shape reduces avoidable CPU readback/copy work while preserving exact pixel,
lifetime, synchronization, fallback, and Firefox-visible behavior. GTests and
standalone readback/import/fence harnesses cover slices of the contract; the
archive records many rejected or superseded candidates.

## WebRender instrumentation and hybrid external video

Umbrafox carries bounded renderer markers, sampling tools, admission counters,
and a default-inert external-YUV handoff across WebRender, EGL, NativeLayer
Wayland, and child-surface vsync lifecycle code. The source contains strict
admission/fallback paths; archived reports distinguish build/source evidence
from actual device behavior. A committed mechanism is not proof that a given
compositor, color protocol, modifier set, or display accepted it.

## Media behavior

- Audio seek handling recreates stopped streams to recover playback after seeks.
- FFvpx carries a vendored V4L2 M2M H.264 path intended to fail open to other decoders.
- VA-API remains preferred where available; device selection and shipped-symbol proof are separate gates.

## Performance beta and tools

`tools/umbrafox/performance/` and the opt-in beta launcher provide isolated
preference sets, fixtures, capture tools, analyzers, and tests. They do not
change ordinary defaults. UmbraLink snapshots/profiler export are the private
control route; historical performance plans and reports live under the archive.

## Acceptance discipline

Every optimization must preserve default parity, rendering correctness,
fallback, resource lifetime, fences, shutdown, and restart behavior. CPU/GPU
markers, successful compilation, package contents, and a single frame-rate
number prove different stages. Consult [current status](../maintainers/current-status.md)
before claiming release or hardware acceptance.
