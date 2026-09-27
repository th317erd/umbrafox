# Browser presentation evidence boundary

Read-only source audit for PERF-011; no new browser/compositor behavior or runtime
measurement. Full reviewed map with local source links remains in private scratch
`~/.cache/codex/umbra-perf-20260927/presentation-browser.md`.

## What existing values mean

- `WaylandSurface` frame callbacks feed `WaylandVsyncSource`. Callback millisecond
  timestamps are compared with monotonic browser time; its 50 ms fallback is
  about that clock comparison, not the Wayland presentation protocol's refresh
  field. The scheduler smooths a period and predicts output time.
- `VsyncTimestamp` marks the supplied vsync time. It does not carry the full
  surface/clock-fallback/physical-presentation identity needed for a scanout join.
- Video frame callbacks use refresh/prediction inputs. `presentedFrames` can
  advance using media frame identities even when offscreen; it is not a physical
  display counter.
- WebRender image-composite feedback uses CPU composition setup before rendering,
  not GPU completion or scanout. `RenderCompositorEGL` inherits a no-op
  `WaitForGPU`; generic GPU-wait timing is not complete driver/fence coverage.
- The audited Gecko Wayland registry does not bind `wp_presentation` directly.
  That does **not** establish which version Mesa, GDK or the compositors bind.
  The inspected system-EGL swap wrapper returns a success boolean, not refresh
  or presentation-sequence data to the Gecko scheduler.

l8ros independently traced nested/outer Cage feedback forwarding of realized
timestamps and commit sequence. It also identified a wlroots presentation-v1
zero-refresh condition when adaptive sync is enabled. No direct consumer linking
that zero to Gecko's 50 ms fallback was found. Keep output mode refresh, protocol
feedback refresh, frame callbacks, GPU readiness and realized presentation
separate. Missing cross-stack joins do not prove the protocol is absent or that
nesting forces a particular frame-rate cap.

## Smallest next observation

Use existing vsync/refresh, video queue, image-composite and compositor markers
for a bounded browser interval. The OS owner correlates physical presentation
and fence readiness using actual installed versions and clock uncertainty.
Preserve missing IDs and dropped feedback; nearest timestamps do not create an
identity join. Only add a bounded private stage probe if this leaves a specific
unresolved edge. No forced refresh rate, fence removal, fixed-step video
workaround or public timing API follows from this audit.

Pi lifecycle and nested/direct/nested comparisons remain l8ros-owned. No
performance or exact-pixel acceptance criterion changes.
