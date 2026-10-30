# Full-Profile Range Correction And Import Cost

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Result

A controlled replay of the existing recording reproduces a profiler-cli 0.10.0
range-state bug. Popping a selected range reports no current range but retains
the old range as a preview filter. Clearing an already empty range stack does
not remove that filter. Explicitly selecting the full normalized duration
restores the original population. No installed tool or browser code was changed.

| Renderer query | Samples | Observation |
| --- | ---: | --- |
| Fresh full recording | 9700 | Before any range selection |
| Phase 3 | 2398 | Explicit short selection |
| Pop selection | 2398 | Context reports currentViewRange null |
| Clear selection | 2398 | Still the exact phase-3 population |
| Explicit full selection | 9700 | Matches the fresh full population |

All non-context export fields agree between fresh and explicit full queries,
and between phase, popped and cleared queries. This is not a browser sampling
loss. Previously saved t-2/t-3/t-4/t-26 full-samples exports from the controls
analysis likewise equal their last phase exports. They are not whole-profile
evidence. Their immutable originals remain preserved.

The accepted controls analysis uses explicit phase and before/after queries,
not those old full-samples summaries. The exact renderer-gap analysis also
uses explicit ranges. Process CPU-counter comparisons, including the material
profiling overhead and candidate CPU increase, are unaffected by this bug.

## Corrected Populations

The new queries hold an explicit full range of 0 to 49.082522838 seconds on
the CLI clock. Raw root range is 11327.148373 to 60409.671211 milliseconds.
Complete function lists and sample totals are cross-checked per thread.

| Thread | All samples | Non-idle | Unresolved self samples |
| --- | ---: | ---: | ---: |
| Parent GeckoMain t-0 | 9700 | 713 | 19 |
| Renderer t-2 | 9700 | 559 | 227 |
| CanvasRenderer t-4 | 9700 | 328 | 102 |
| Compositor t-3 | 9700 | 275 | 14 |
| Fixture GeckoMain t-26 | 9644 | 385 | 31 |

These are sample counts, not CPU time. Non-idle classification can include
waits. Unresolved counts come from the complete all-sample function inventory;
they are not automatically a subset of the non-idle column.

CanvasRenderer has 146 inclusive samples in ImportSurfaceDescriptor, 184 in
RecordedDrawSurfaceDescriptor::PlayEvent, 95 in CopyToSwapChain, and 38 in
DMABufSurfaceYUV::CreateTexture. Renderer has 344 in render_impl, 109 in
GLContextEGL::SwapBuffers and 38 in DMABufSurfaceYUV::CreateTexture. Nested
inclusive counts must not be added. The top-down exports are all truncated at
501 nodes, so they do not support a complete division of time among branches.
Missing driver symbols and the measured profiler overhead further limit cause.

## Source And Next Optimization Gate

Hash-verified source from the recorded build confirms the path:
RecordedDrawSurfaceDescriptor::PlayEvent calls the translator lookup; the
DMABuf lookup calls GetZeroCopySurfaceFromDMABuf and then
SharedContextWebgl::ImportSurfaceDescriptor. The latter acquires a texture
handle, imports through WebGLTexImage, and returns a new SourceSurfaceWebgl.
Backing texture allocation may already be reused; not every call necessarily
allocates a new GPU texture.

GLBlitHelper creates a DMABuf wrapper for descriptor import. Its Blit path
creates missing plane textures and releases those temporary textures afterward.
The current translator path does not retain the converted source surface across
these lookups. This makes repeated import/conversion a concrete optimization
lead, not proof that it causes the intermittent stall.

The next gate is exact frame-lifetime authority: whether repeated draws of one
immutable frame can reuse the conversion while preserving context loss, decoder
loss, buffer recycling, error behavior, pixel equality and bounded retention.
A file descriptor, texture handle or reusable buffer address alone is not proof
of unchanged pixels. No new cache is implemented or accepted by this report.

## Tool Mechanism And Verification

Installed bundle SHA256:
42bc638107e9f38d7b0d68d0b83d92ef24a5c781945c0d30ac2d80080d501e48.
Its FT action passes the old committed range into POP_COMMITTED_RANGES; the
preview-selection reducer retains that selection while the committed stack is
sliced. CLI context reports committed ranges, not the retained preview.
Explicit COMMIT_RANGE resets the preview. Exact function names, UTF-16 offsets
and excerpts are saved in source-proof.json, alongside five native-source pins.

Seven focused Node test groups pass: exporter ownership/budget preservation,
query order, full population validation, rejection of stale-range exports,
eight corruption cases, exact range-control equality, and complete saved-result
reproduction. The earlier missing-module/generated-file REDs were scaffolding
failures, not production bug reproduction. The actual same-recording query
sequence is the behavioral reproduction. Explicit-file formatting passes.
The source guard verifies 63 product pins, 146 harness pins, nine native-source
snapshots, unchanged patches/configuration and the prior playback recomputation.

One owned offline CLI session used the existing saved profile and explicit
loopback symbol service. Server logs show loopback fallback requests with
expected 404s; missing symbols are retained, not claimed resolved. The printed
profiler UI URL was not opened. No raw-profile parser or new browser recording
was used. Session duration was 10.13 seconds; finally cleanup stopped daemon
2739512 and server 2739484. Exact PID and socket absence are recorded and were
independently rechecked. No work-browser, installation, profile, Pi, source,
staging or default preference change occurred.

Evidence: artifacts/umbralink-control/profile-range-audit/. Authoritative
outputs are cli/range-result.json, results.json and source-proof.json; tests,
all command logs, source snapshots and the exact executed exporter are retained.
The phase seal is profile-range-audit-final.sha256 beside that directory.
Earlier seals and reports remain unchanged. The broad performance goal is open.
