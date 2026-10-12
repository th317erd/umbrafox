# Borrow Immutable Video Descriptors

## Contract

This is a scoped continuation of the rendering-performance campaign. The current
tree and immediate baseline are the frame-reuse candidate, not the older
pre-import browser. The experimental path stays default OFF and uninstalled.
No daily browser, profile, launcher, Pi, index, commit or public interface changes
are included.

The translator currently obtains an owning SurfaceDescriptor copy before every
cache lookup. The actual DMABUFTextureHostOGL getter copies its stored immutable
descriptor; it does not reserialize the image. The generated DMABuf descriptor
contains arrays, shared FileHandleWrapper references and a FileDescriptor array
for reference counting. FileDescriptor copy duplicates its OS handle. Actual
playback field populations and total copy cost are not yet measured.

Add an optional native BorrowSurfaceDescriptor method on TextureHost, returning
null by default. Only DMABUFTextureHostOGL opts in by storing its existing
immutable descriptor in the SurfaceDescriptor union and returning its address.
The owning getter remains available and keeps returning an independent copy.
Do not forward the borrowing method through wrappers or infer concrete host type
from GetTextureHostType. Unsupported hosts use the unchanged owning fallback.

CanvasTranslator keeps the borrowed pointer only for the synchronous import call.
The existing strong host reference in LookupSourceSurfaceFromSurfaceDescriptor
outlives this use. If borrowing is unavailable, a local Maybe owns the descriptor.
Every existing descriptor-type, size, format, context, translation-scope and
cache-admission check remains in the same order. No cache lifetime, identity,
shader, filtering, allocation failure or fallback policy changes.

## Work And Gates

1. Preserve current source/index/config and narrow before files. Run a
   failing-first test of the actual compiled translator region: a lending host
   must perform zero owning descriptor reads while a non-lending host still
   performs one per draw. Retain the original mutable-descriptor rejection test.
2. Edit only TextureHost.h, DMABUFTextureHostOGL.h/.cpp, CanvasTranslator.cpp and
   focused existing source-region/native tests. Test invalid descriptors, absent
   host, empty size, unsupported format, failed import/context, scope boundaries,
   interleaved owning/borrowing hosts and changed descriptor admission. Prove the
   public platform and default prefs are untouched.
3. Verify actual native borrowing lifetime, equality and independent owning copy
   behavior; real GPU pixels and existing cache/loss regressions remain required.
   Run focused lint and relevant tooling regression suites. Source-region tests
   use GL/IPC stand-ins and cannot substitute for native tests.
4. Build with at most two jobs after resource/compilation preflight, package a
   complete isolated candidate and retain source/package identities. Reuse the
   established isolated laptop native/pixel tests before performance comparison.
   Do not install into the daily browser. No speed or smoothness claim follows
   solely from fewer copies; runtime cache-hit frequency and automatic translator
   recovery remain separate open gates.

## Evidence And Limits

New evidence namespace: artifacts/umbralink-control/descriptor-borrow/.
Earlier namespaces and seals are immutable. Tests run under bounded watchdogs;
build sessions must be polled to terminal rather than overlapped after a wait.
Any rollback is limited to this phase's saved delta, never the existing dirty
work. Report implementation, native verification and performance acceptance as
separate states. Original failed smoothness comparisons remain failed.

## Current Checkpoint

The six-file implementation and focused source-region tests are complete.
Behavioral failing-first evidence has nine expected failures across 42 cases;
the corrected compiled-region suite passes all 42. Full tooling passes 460
tests, exact source lint reports zero problems, and six source/native-runner
contract groups pass. The source-region tests use stand-ins, not a real GPU.

The first native build hit its 20-minute watchdog; that failure is preserved.
A separately admitted two-job continuation completed in 339.60 seconds, followed
by successful packaging in 192.15 seconds. The complete isolated export is
exports/umbrafox-descriptor-borrow-20261006, manifest
1de58db614be934fb7fe71fc46ea168ce9777a8b46e340d3f429090b4e3e6773.
Only libxul differs from the immediate frame-reuse package. BuildID remains
20261006175655; hashes, not that shared ID, distinguish these builds.

The separate native test library passed all 54 required tests on wyatt-laptop,
with no skips, including real descriptor ownership and independent copies.
The native process exited naturally with code 0; all five recorded controller,
native, sandbox and IPC peer PIDs were independently absent afterward. Compiler
DWARF shows the stored union is 192 bytes versus the old payload's 184 bytes:
an eight-byte field-size tradeoff, not measured allocator or playback overhead.

Next bounded gate: the unchanged 48-case ordered pixel matrix with import OFF,
then ON, and the existing retained-decoder-loss OFF/ON cases. Use a fresh
descriptor-borrow-gpu namespace and the normal package, never the gtest overlay.
Compare OFF against the preserved immediate baseline OFF and ON against both
new OFF and preserved baseline ON. Keep exact raw-buffer equality. Validate each
terminal capture and cleanup before launching the next. Driver/SSH bounds remain
220/240 seconds, capture bounds 120/105/15 seconds, resource caps unchanged.
No new profiler, default, public interface, owner-browser action or installation.
The four browser runs now pass: 48 exact comparisons per import mode against
the immediate baseline, ON/OFF parity, and eight retained-decoder-loss checks
per mode. All 50 recorded PIDs are absent; 19 saved-data/preparation test groups
pass. See ../reports/performance/2026-10-06-descriptor-borrow-gpu.md. This closes
the bounded native/pixel/decoder-loss gate, not automatic recovery, actual reuse
frequency or playback benefit.

The next fixed comparison uses A=frame-reuse package (9ec305ad) and B=descriptor
borrow (1de58db6), order A1/B1/B2/A2, import ON in both, profiler OFF. Preserve the
same 48-second 1080p H.264 fixture, 320x180 canvas, 1/4/4/1 draws per callback,
ordinary clocks and all 29 existing numeric criteria. Each run uses fresh owned
roots, 15-second settling and idle/resource/hash preflight. Validate each complete
prefix before the next arm. No retries, pooling with previous runs, changed
thresholds, observer additions, forced acceleration or daily install. Report the
complete-package comparison separately from missing native hit/copy counts.

That fixed playback comparison is now complete: 29/29 regression criteria pass,
all sixteen phases report zero dropped frames, but CPU is 0.334% higher and draw
timings are unchanged. This is no demonstrated speedup. Startup gaps remain in
both variants; no retry or changed threshold is justified. See
../reports/performance/2026-10-06-descriptor-borrow-playback.md. Keep the candidate
uninstalled/default-OFF and return priority to remaining scheduling/compositor
work and actual hot-path-frequency evidence. Full performance acceptance remains
open; this plan's bounded correctness and comparative measurement are complete.
