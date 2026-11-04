---
title: Parked WebRender performance experiments
status: current
doc_type: experiment
audience: [maintainers, developers, release-engineers]
last_verified: 2026-11-02
canonical: true
---

# Parked WebRender performance experiments

> **Current documentation.** These two experiments are **not** in the shipped tree and are
> not known to be safe or beneficial. Source and measurements outrank this page; it records
> why the work was set aside and where it is preserved.

Both experiments are default-off optimisations that were written against the Firefox base
before the November 2026 upstream sync. Neither was carried across that sync. Neither is
part of the product today.

## 1. Single-image opacity (Draw compositor)

**What it does.** Folds a constant opacity that wraps exactly one image primitive into that
image's own colour during scene building, instead of wrapping the primitive list in an
opacity picture. Applies only to the Draw compositor, a single cluster, root spatial nodes,
premultiplied images with white colour, no sub-rect and no tile spacing. Motivation was the
async-canvas path, which arrives as one image behind an opacity wrapper.

**Status: unproven, with a known correctness failure.** The archived prototype record
(`docs/umbrafox/archive/reports/single-image-opacity-prototype.md`) says the opt-in pixel
gate **failed**, and the narrower isolation that followed passed the frozen fixture but
**failed the odd-dimension matrix case (AE 28)**. Work was paused default-off with no
parity claim. No performance measurement of the feature exists in the project record.

**Why it was not carried.** Upstream moved image primitives from `data_stores.image[data_handle]`
to `dl_stores.images[handle]` (`DlHandle`/`DlStores`) across the WebRender crate. Porting the
fold is a small edit, but it would carry an unresolved pixel-parity bug onto a new base without
any measurement justifying it.

**Revisit when** somebody has a workload where it demonstrably helps *and* the odd-dimension
parity case passes. It is a scene-building decision, so the port itself is five edits
(`prim_store/mod.rs`, `prim_store/image.rs`, `scene_building.rs`, `prepare.rs`, `scene_debug.rs`).

## 2. External-YUV scanout for the Draw compositor ("hybrid")

**What it does.** Admits a fullscreen opaque external YUV image and hands it to the Wayland
compositor as an external surface, then skips the final tile draw for that frame. Includes an
admission-reason counter array and a child-surface vsync path. Default-off
(`gfx.webrender.compositor.external-surfaces-in-draw`).

**Status: never validated on hardware.** It built and packaged for aarch64, had unit and
source-contract tests, and was exercised only through third-party measurements on a Raspberry
Pi 4 whose provenance was never established. It never passed the acceptance gate: 1080p60 at
>= 57 fps and < 5 % drops with real displayed output, lifecycle and resource retirement.
A third-party patch claiming to complete it was reviewed and rejected
(`docs/umbrafox/archive/reports/2026-10-23-umbralink-context-kiosk-exit-and-patch-verdict.md`).

**Why it was not carried.** The Pi 4 was dropped as a target in favour of x86_64 hardware whose
GPU composites a 1080p frame comfortably, and promotion buys nothing there. The delta is ~45 KB
in `renderer/mod.rs` and `tile_cache/mod.rs` and cannot be validated on the current hardware.

## Where the work lives

- Branch `experiment/wr-single-image-opacity-and-external-yuv` — the complete fork tree at
  `d2dfa35fd0ae`, which contains both experiments in working form.
- Branch `upstream-sync-20261102` — the November upstream merge, taken with upstream's
  WebRender for every conflicting file (both experiments excluded).
- `docs/umbrafox/experiments/patches/` — the WebRender-side deltas of both experiments plus the
  Gecko/widget plumbing they required, extracted for reference.
- `exports/umbrafox-hybrid-20261019*` — aarch64 artifacts and evidence for the hybrid path.

Nothing here is a recommendation to port. If either is ever revived it needs the measurement
and the parity gate that the original work never produced, applied to the base it is ported to.
