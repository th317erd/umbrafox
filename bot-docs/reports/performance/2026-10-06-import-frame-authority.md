# Video Import Reuse: Identity And Lifetime Gate

## Finding

The next optimization candidate has a source-supported frame identity. The
remote decoder descriptor includes a new ID on every descriptor production,
separate from its recyclable texture serial. GPUVideoImage returns that stored
descriptor unchanged. Recorded drawing serializes the complete descriptor and
retains the image while the recording is pending. Repeated same-image draws can
therefore be distinguished from a different frame reusing the same texture.

This does not justify a cache keyed only by descriptor ID: the counter is
process-local. The proposed key also uses the live native TextureHost resolved
by the existing content-checked VideoBridge lookup, inside the current shared
WebGL context. A short-lived strong host key prevents pointer reuse. Missing or
invalid authority keeps the existing import path.

The corrected profile contains 146 inclusive CanvasRenderer samples in import
and 184 in descriptor replay. These are nested sample counts, not percentages or
proof of the stutter's cause. The prior profile-range bug is independently
reproduced and its corrected exports are sealed in profile-range-audit.

## Avoided Design Trap

Simply retaining the converted SourceSurfaceWebgl can cause additional GPU
readback when its texture is evicted: OnUnlinkTexture preserves retained surface
data using a PBO or a direct readback. That could undo the benefit being sought.

Instead, the proposed cache holds a weak reference to the existing TextureHandle,
not a strong source or backing texture. PruneTextureHandle invalidates before
unlinking/cleanup. A later hit must reject invalid or expired handles, match
dimensions/format/sampling state, and preserve the single weak source-owner
relationship. If an old wrapper is alive, reuse it; do not overwrite its owner
link with a new wrapper. If it has died, a new wrapper may be possible.

Reuse remains scoped to the current translation batch, with explicit clearing
for transaction end, all early returns, context loss, memory pressure and
shutdown. This is a design contract, not implemented or runtime-verified behavior.
The exact plan is [video-import-reuse.md](../../plans/video-import-reuse.md).

## Verification

Twenty source files match the saved recording's build pins or unchanged build
HEAD with no corresponding recorded patch. Native source methods for the ID
type/counter, descriptor producer and image GetDesc are extracted byte-for-byte.
A bounded standalone C++20 test passes five identity cases, including 64 stable
image copies and 1024 unique IDs across four threads. It uses stand-ins for
generated IPC structures, texture data and the Image base class. This is not a
linked Gecko/decoder/driver test, an IPC round-trip, or a performance benchmark.

Three Node groups pass: every source/region hash, full descriptor recording and
source retention, and texture invalidation/weak-owner/readback source boundaries.
Pattern checks verify current structure, not future runtime ownership. The
initial missing-snapshot failure is retained as scaffolding RED, not bug proof.
Compilation was bounded to20 seconds; the native test to3; Node tests to10.
All commands exited successfully. No browser, daemon, native browser build,
package installation, profile access, Pi action or product edit occurred.

The source audit rejected relying on a bare handle or on strong converted-surface
retention. Next is assertion-first cache implementation, native ownership tests,
unchanged exact pixel/error tests, then a fixed laptop playback comparison.
The experimental GPU path stays default OFF and uninstalled. No additional
speedup, stall fix, universal parity or release acceptance is claimed here.

Evidence: artifacts/umbralink-control/import-frame-authority/, including all
20 source snapshots, source.json, four compiled regions, native test and logs.
The independent preceding source guard retains63product/146harness pins and
unchanged staged/working patches. The phase seal is
import-frame-authority-final.sha256 beside the evidence directory.
