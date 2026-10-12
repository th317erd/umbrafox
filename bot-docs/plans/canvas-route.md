# Moving Canvas Backend Comparison

## Purpose And Scope

Compare ordinary default Canvas2D with explicit willReadFrequently on the
authorized isolated laptop, using the two sealed existing packages. No engine,
public API, preference, installation or daily-browser change. Existing V2 pixel
parity and repeated-readback results remain separate. Do not infer acceleration
from absent IPC or from WebRender alone.

## Contract

- New artifact-only collector: exactly120 video callbacks, one110x75 draw per
  callback, no getImageData/hash during playback. Eight-second work watchdog;
  public clocks retain their native granularity. Frame metadata and draw times
  are separate clocks; no unsupported relative-order assertion.
- Attach the canvas in the owned local fixture. Require unchanged document,
  media source, visible/muted/normal-rate1920x1080 video, advancing frame IDs and
  media timestamps. Pause and cancel callbacks on all collector exits.
- Two owned-fixture events, after timed first and last draws, let a temporary
  privileged frame-script listener call existing getDebugInfo(false). This does
  not allocate a target. Native ReturnTarget runs at stable state; later RPC
  inspection is insufficient. Record unavailable as unknown, never force true.
- Reuse the existing exported executeControlScript helper inside that child
  closure so workload execution still has page principal and the established
  disposable sandbox. No page-visible diagnostic API or global hook. Verify
  page getDebugInfo is absent. Listener/timer removed in finally.
- Only after pause, read the final canvas once for bounded nonblank evidence.
  Different moving-frame hashes are not cross-run pixel mismatch evidence. Prior
  separate paused pixel tests remain the parity gate; this run is not a new
  exact-frame parity comparison or physical presentation test.
- Preserve raw replies before validation. Use the existing captureLocalWorkload,
  private app/local/temp roots, fresh verified install and resource monitor.
 120s total,105s work,15s cleanup/final2s,10s quiet,256MiB sampled artifacts,
 64MiB launch headroom unchanged. No profiler in the initial comparison.

## Gates

Tests first: modes,120-frame cap, no timed readbacks, event placement, unavailable
backend, stale document/element, error/timeout/cancellation, malformed receipts,
native reply identities and full capture ordering. Commands bounded. First
baseline default/readback pair decides whether expanded comparison is useful;
no automatic retries or cap relaxation. Package/source hashes, native private
roots, backend/decoder receipts and exact owned PID cleanup must be retained.

Source discovery: Searchfox CanvasRenderingContext2D.getDebugInfo and
nsRFPService::IsSystemPrincipalOrAboutFingerprintingProtection. Frozen base
892431809a4caadb5c73b2c03ad9bdb124c3e21e plus exact export patches is authority.
getDebugInfo is system-principal/about-fingerprinting gated, not simply
ChromeOnly. The method reports provider/target state, not GPU execution time or
proof that a specific video draw avoided a CPU transfer.

## Completed Small-Canvas Gate

Two baseline runs PASS: default/readback both shared Skia, native accelerated
false at first/last draw.120draws330/326ms total, no per-frame pixel reads;
one nonblank read after pause. All24 recorded PIDs absent; package postchecks
and sampled caps pass. Report2026-10-05-canvas-route.md has exact evidence.

Source identifies a minimum-area gate:110x75=8250 <128^2=16384 default.
Runtime pref value was not collected, so do not assert exhaustive cause.
Further same-size candidate runs would not answer accelerated routing.
Next prospective sibling must use320x180 and record actual min/max preferences,
without changing them. Current code/captures remain frozen after final sealing.
