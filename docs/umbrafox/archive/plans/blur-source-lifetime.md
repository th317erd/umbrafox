# Blur Source Lifetime

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

The previous two OFF matrices reproduced every hash and difference summary.
Video and frozen-video-frame inputs varied by one component level; shared
canvas raster/synthetic inputs did not. This leaves source type and reuse
confounded. The next experiment keeps source pixels fixed while varying source
object reuse. No engine/default/desktop/install change or ON run is authorized
by this diagnostic phase.

## Contract

Capture one paused 1920x1080 frame at 0.5s into an explicit-readback source
canvas. Preserve those exact RGBA bytes. Use shared and fresh canvas sources,
and shared and fresh raw-RGBA VideoFrame sources. Each source type is tested
with default and explicit-readback 320x180 destinations, two fresh destinations
per pair, always with blur(1px). Eight pairs, sixteen draws. Source inputs are
hashed before use; canvas source readbacks and VideoFrame copyTo RGBA receipts
must match the seed. Source and frame objects are always released. Readback
after each target draw is diagnostic, not timed performance.

Reuse existing pixel parent transport/native observer. Save exact source,
target, context/document/PID, frame and OFF-pref receipts, source hashes,
target hashes, attributes and per-pair pixel differences. Keep the original
strict pixel gate unchanged and return no parity/performance acceptance.

A new small canvas-matrix orchestration helper reuses captureLocalWorkload,
installation admission and the existing pinned package; it permits supplied
trusted request/validator functions instead of copying each old capture/driver
again. Old sealed helpers and evidence remain byte-identical. The new helper
must preserve OFF-only configuration, raw-before-validation, native private
roots, observed document isolation, resource caps, 120s capture/15s cleanup
and 220s controller/240s SSH bounds. No extra full source tree copy.

## Tests And Gates

Write focused tests first for exact sixteen-draw order, shared/fresh object
lifetimes, source byte equality, copyTo failure, draw/read/seek/timeout failures,
native-before-read ordering, stale/malformed input and cleanup. Test reusable
orchestration with fake RPC responses, rejecting wrong PID/document/pref,
profiler state, write/RPC/abort failure and preserving raw rejections. Run the
new and existing focused suites under 30s and formatting under 60s.

Hash-admit sources and the 46-file candidate before one isolated laptop OFF
capture; export only named evidence and verify recorded PID absence. Repeat
once if the matrix completes and is informative. No repeated-until-green
policy. Identical source pixels but differing fresh-object outputs would
implicate source identity/lifetime or downstream allocation, not prove a
specific shader issue. All-matching results leave the GPU-video route distinct.
Changing formats may itself change results; compare repeat pairs within each
format, not assume cross-format equivalence. The broad performance goal,
default-OFF import candidate, original frame-2/ON pixel gate and failure-path
tests remain open.

## Completed Diagnostic

Two isolated OFF captures and 63 combined tests completed. Sixteen output
hashes repeat exactly across runs. Only fresh raw-RGBA VideoFrames differ
within their accelerated pair: eleven components by one level, matching the
previous video-blur output hashes. Reused frame and both canvas-source pairs
are identical; all explicit-readback controls are identical. This does not
clear pixel parity or establish a performance cause. Full evidence and limits:
`docs/umbrafox/archive/reports/performance/2026-10-06-blur-source-lifetime.md`.
