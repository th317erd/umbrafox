# WebRender profiler-only instrumentation handoff

Coordination: `scaled-v2/browser-review`, approved scope in teamwork event 84.
Pi installation and validation belong to l8ros. No Pi changes were made here.

## ARM64 package

`umbrafox-158.0a1-linux-aarch64-wr-profiler.tar.xz`

SHA256:
`f8e34f95fcc7d1b4e76986bd0038c002e6cc07fe3a7267af9be81cf0b34387d3`

Run `sha256sum -c SHA256SUMS` after transferring this directory. The archive
passed `xz --test`. It contains the normal self-contained `umbrafox/` runtime,
not a build-directory symlink tree. The source executable and libxul are ARM
aarch64 ELF; final libxul GNU build ID is
`473f3de5e4e986783d201ddeec9851f7`.

The incremental build retains older application/toolkit BuildID strings. Use
the archive checksum and GNU libxul build ID above to identify this package,
not its application.ini BuildID alone.

The matching x86_64 package is also included. It was installed on wyatt-desktop
at `/home/wyatt/Programs/umbrafox-20260925-121545-158.0a1`, with `.purgecaches`.
The existing `~/Programs/umbrafox` launcher selects this versioned directory.
Older installations and the user's running browser were left alone.

`base-revision.txt` identifies HEAD. `working-tree.patch` records all tracked
working differences included in this build, including the previously existing
scaled-readback repair. `profiler-only.patch` isolates this assignment's source
change to exactly:

- `gfx/wr/webrender/src/tile_cache/mod.rs`
- `gfx/wr/webrender/src/renderer/mod.rs`

Other working changes were preserved, not committed or reverted by this task.

## Capture setup

Set `gfx.webrender.debug.surface-promotion-logging=true` in the isolated test
profile, and start a Gecko profiler capture including **Renderer** and
**WRRenderBackend** threads. Both the flag and active profiling of the emitting
thread are required. The flag alone will not produce these profiler records.
Do not enable visual overlays, screenshots or GPU timer queries for this test.

Use UmbraLink's existing `umbrafox.performance.profile.dump` to retrieve the
capture. No new control command or web API was added. Reset the preference
afterward. The existing Rust warnings may still be enabled by this flag;
profiler records do not depend on those warnings reaching the journal.

## Marker contract

All new records are standard Gecko Graphics/Text markers. Their Details/name
payload is a bounded, fixed-field string, with no URL, page text, pixel data or
unbounded collection. Rectangles are explicitly labeled; dimensions and offsets
are device target values, while RGB `rect` is picture-space coverage.

### WR RGB promotion

Emitted after the RGB promotion decision, before either the successful overlay
return or fallback bookkeeping. Fields:

`update`, `candidate`, `frame`, `slice`, `surface`, `primitive_surface`, `key`,
`generation`, `preferred`, `root`, `alpha`, `color_alpha`, `mask`, `atomic`,
`sub_slice`, `yuv_remaining`, `rect`, `result`.

`result` is the existing final Result value, such as `Ok(Overlay)`, `Ok(Blit)`
or `Err(OverlaySurfaceLimit)`. A false `preferred` with `Ok(Blit)` means no
promotion was requested, not a rejected request. Unpreferred images are included
so lack of candidacy is observable. RGB only; this is not a YUV rejection log.

The existing guards retain their original ordering. An early capacity failure
may conceal a later root/effect failure; use `root`, mask and alpha metadata
rather than assuming the reported failure is the only obstacle.

`update` is a process-local profiler-only sequence assigned when recording the
first candidate in a tile-cache update. Group by process + update. `candidate`
is 1-based. `frame` is cache-local and can be reused with retained/rebuilt cache
state; it is NOT a globally unique frame ID or a Renderer-frame join key.

At most 64 RGB records per tile-cache update. The first additional candidate
emits one **WR RGB promotion truncated** marker with `update`, `frame`, `slice`
and `limit=64`. Missing later images must not be interpreted as non-candidates.

### WR picture target

A CPU-duration record around the existing picture-cache target draw/blit path.
Fields:

`renderer_frame`, `ordinal`, `kind`, `dimensions`, `offset`, `dirty`, `valid`,
`scissored`, `color_clear`, `depth_clear`, `clear_with_quads`, `draw_calls`.

`kind` is Draw or Blit. Draw count is the existing RendererStats delta; clear
quads are excluded by upstream's existing accounting. A Blit can have zero draw
calls. The clear flags describe the existing chosen path; no GL state is queried.

At most 64 target records per rendered frame; the 65th produces one
**WR picture target truncated** marker. `ordinal` indexes rendered picture
targets, not a GPU job or stable texture. `renderer_frame` is local to that
renderer; use its thread and marker interval when comparing captures.

This is CPU submission duration, NOT GPU execution duration. GL calls may
submit asynchronous work; do not assign kernel job time to a target merely
because timestamps are nearby.

### WR promotion counters

One record per rendered frame after merging the existing transaction profile:
`renderer_frame`, `overlays`, `underlays`, `blits`, `picture_tiles`.

These publish existing counts without modifying them. Overlay here is a
WebRender promotion category, not proof of hardware/native-compositor scanout.

## Verification

- Focused `mach lint`: zero errors/warnings.
- Final x86_64 and ARM64 `mach build binaries -j2`: passed.
- Both architectures packaged using `mach package`.
- Previous installed build with the flag on: zero new markers (negative baseline).
- Final build, flag off: zero new markers despite active profiling/canvas updates.
- Final build, flag on: 12,820 records with rejection, target and frame metadata.
- Stress fixture: 46,544 records; successful overlay paths and 555 truncated
  update groups. Automated checks enforce <=64 candidates per update, exactly
  one overflow marker, payloads <1024 characters, nonnegative finite durations,
  and target ordinal bounds. Candidate IDs fixed a real verifier failure caused
  by reused cache-local frame numbers.

Fixtures/capture runner/checker:
`/home/wyatt/.cache/codex/l8ros/wr-profiler-verification/`

Logs and parsed marker query outputs:
`artifacts/umbrafox-wr-profiler-*20260925*`

The local Xvfb tests used **software WebRender**. They verify marker emission,
gating, successful/rejected paths and RGB volume limits, not Pi GPU performance
or hardware pixels. The >64 picture-target overflow branch was source-reviewed
but not exercised by these fixtures. Physical ARM64 validation remains pending.

## Behavior and review boundaries

The patch adds only profiler metadata, CPU timing and diagnostic counters.
It does not change a rendering condition, shader, texture, promotion result,
GL call, synchronization operation, web interface or default preference.
Formatting, generation lookup and diagnostic ID allocation run only while
explicit diagnostics and thread profiling are active. Profiling itself has
overhead: use this package to locate the path, not as an unqualified performance
acceptance run. No behavioral playback repair is claimed by this package.
