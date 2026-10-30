# Desktop Readback Pixel Check

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Result

The sealed cache candidate `20261003071500` and pre-cache prototype
`20261001103920` produce identical RGBA SHA-256 hashes for all 18 tested
frame/drawing combinations. Each combination also produces identical pixels
across 12 draws of the held frame. The two source frames have different hashes,
so the comparison is not simply accepting a stale first frame.

This is a **software-path correctness result**, not a GPU performance result.
Both builds reported `ffvpx video decoder (RDD remote)`, hardware acceleration
false, and `WebRender (Software)`. The small clip and ordinary page clock mostly
produce draw durations of zero or one millisecond. No speedup is established.
No cache-hit counter or actual `GPUVideoImage` branch observation was collected.

The owner's work browser, launcher, profile, tabs and extension settings were
not changed. The candidate remains uninstalled. The owner subsequently authorized
one bounded headed desktop window, completed below. The rendering/layout/CSS/JS
performance goal remains open.

## Authorized Headed Follow-Up

The one authorized isolated desktop run completed on October 3 at
13:35:50.963-13:36:05.923 UTC, in 14.960 seconds. It used the same sealed cache
candidate and fixed clip, without an acceleration override. Native app-data
paths, PID/build joins, selected fixture document and `webdriver === false`
passed. The browser root PID1259488 and controller PID1259474 exited; the owner
browser PID3290300 remained alive. Cleanup was owned SIGTERM, 73 log bytes and
zero dropped bytes. No additional headed run followed.

The real window reports WebRender on NVIDIA GeForce RTX2060/X11, rather than
headless software WebRender. Both native decoder observations report
`ffvpx video decoder (RDD remote)`, VP9 320x240 and
`hardwareAccelerated: true` (from the native reader's
`videoHardwareAccelerated` field). The name alone does not mean software:
upstream `FFmpegVideoDecoder::GetDescriptionName` selects the ffvpx name by
compile-time library choice. `IsHardwareAccelerated` separately tests native
hardware contexts, and `MediaFormatReader` records the decoder's flag on video
output. This establishes what the diagnostic reports, not the exact deployed
provider, driver path, `GPUVideoImage` cache entry or cache hit.

All 18 cases are stable across 12 draws per held frame and the two source frames
differ. However, **zero of the 18 headed-candidate hashes equal the existing
headless-baseline hashes**. This is explicitly a cross-backend comparison,
not an accepted cache parity result or proof the cache caused the differences.
The baseline must run with the same headed backend before assigning cause.
The small paused-seek fixture also provides no meaningful playback speedup or
dropped-frame rate. No pixel tolerance was relaxed.

The tooling change is limited to the existing readback capture module and its
spec. Headless remains the default. An explicit `headed` argument accepts only
local X11 `DISPLAY` and an optional absolute `XAUTHORITY`, while retaining the
fresh application-data roots and all deadlines. It omits the headless variables
and records the actual launch environment in provenance. Other ambient GPU,
profiler and application-data overrides are not admitted. Existing DOM adapters
remain headless. No browser API, page timer, native code, package or installation
changed in this follow-up.

Behavioral display-validation RED evidence precedes the correction; missing
new-export failures are scaffolding evidence only. Nine focused capture tests
and the final combined **344-test** tooling suite pass, with exact two-file
lint reporting zero problems. Readiness, owned launch, late rejection,
dispatch cancellation and cleanup coverage remain intact.

Evidence:

- `/home/wyatt/.cache/codex/readback-candidate-headed-20261003-1`.
- `artifacts/umbralink-control/readback-headed-runtime-audit.json`.
- `artifacts/umbralink-control/readback-headed-pixel-comparison.json`.
- `artifacts/umbralink-control/readback-headed-{red,green,final-tests,final-lint}.log`.
- Source discovery excerpts: `readback-ffmpeg-description-definition.txt`,
  `readback-ffmpeg-hardware-definition.txt` and
  `readback-reader-hardware-definition.txt` in the same artifact directory.

Any further headed desktop window needs a new heads-up and consent; the one-run
authorization has been consumed. Laptop DOM timing is a separate headless
comparison and cannot substitute for this GPU parity gate.

## Fixture And Scope

New files live in `tools/umbrafox/tests/readback/`. The driver uses the existing
app-data creation/identity checks, lifecycle deadline/evidence/resource helpers,
UmbraLink and owned-process cleanup. It does not modify those shared helpers.
There is no new browser API, preference, page global or engine instrumentation.
Explicit script execution affects only the owned local fixture document.

The source is the existing `dom/media/test/vp9.webm`: 97,465 bytes, VP9,
320 by 240, 30 fps, four seconds. The fixture serves it on loopback, with bounded
single-byte-range support, at most 64 recorded requests and 5 MiB served bodies.
It seeks while paused to 0.5 and 2 seconds. Cases are linear CPU canvas,
odd destination dimensions, full size, crop, fractional destination, nearest
filtering, rotation, alpha and default-context canvas. The first draw targets
110 by 75 directly, without a preceding canvas copy that could populate another
readback size. Hashing follows each timed draw and is excluded from that draw's
recorded duration. This does not remove synchronization costs from `drawImage`.

Each browser has a fresh private profile plus `MOZ_APP_DATA` and
`MOZ_LOCAL_APP_DATA` roots. A native parent receipt joins PID, build ID and both
actual directory paths; both adjacent INIs must match. Exactly one selected
fixture tab is required at the recorded admission points. Profilers were
observed inactive. No acceleration override or automation launch flag is used.
The normal headless environment is intentional, not a substitute for testing
the desktop GPU. Root receipts are post-startup proof, not a network sandbox or
proof that no earlier directory access happened.

## Evidence

All paths below are under `/home/wyatt/.cache/codex/`:

| Run | Build ID | Root PID | Outcome |
| --- | --- | --- | --- |
| `readback-candidate-headless-20261003-1` | 20261003071500 | 951687 | PASS |
| `readback-baseline-headless-20261003-1` | 20261001103920 | 952584 | PASS |
| `readback-candidate-headless-20261003-2` | 20261003071500 | 956120 | PASS |

Runs completed in about 12 seconds each, under a 120-second total budget with
15 seconds reserved for cleanup and two seconds for terminal reporting.
All three used owned SIGTERM cleanup, confirmed root absence and recorded
182 log bytes with zero dropped bytes. The logs retain the sandbox user-namespace
EPERM and headless SWGL framebuffer warnings; they were not suppressed.
Sampled resource checks are not continuous process or OS-I/O cancellation proof.

Each directory preserves `run.json`, native root receipt, provenance,
preferences, graphics/performance snapshots, frame replies, native decoder
replies, fixture requests and resource samples. Do not inspect or publish the
profile discovery token. Comparison outputs are:

- `artifacts/umbralink-control/readback-headless-comparison.json`
- `artifacts/umbralink-control/readback-headless-final-comparison.json`

The final comparison uses the baseline and second candidate run. The second
candidate run verifies the final driver after a dispatch-cancellation fix.
Original evidence was not overwritten. Fixed ordering, small inputs, correlated
repeats and the previously documented build/source differences prohibit a
causal timing claim or universal stock-Firefox parity claim.

## Tooling Verification

Fifteen focused tests pass. Coverage includes malformed result rejection,
stale/changed pixels, seek timeout, media errors, range handling, request/byte
caps, pre-abort, idempotent close, retained spawn ownership, late identity
resolution, expired budgets and late promise rejection.

A real failing-first regression exposed a microtask race: an admitted operation
could start after cancellation but before its queued dispatch. The final
`boundedOperation` rechecks both the signal and remaining budget inside the
dispatch thunk. `readback-dispatch-red.log` retains the one expected failure;
the final suite passes. Underlying OS reads already started before cancellation
are not claimed to be forcibly canceled.

The combined new-fixture, existing performance-tooling and control mock suite
passes all **304 tests** in about nine seconds. Exact-file ESLint, license,
whitespace and trojan-source lint report zero problems. No native source changed
in this follow-up, so no rebuild or package reseal was needed. The existing
candidate archive and its original manifest remain unchanged.

Commands, from the repository root:

```sh
timeout 15 node --test --unhandled-rejections=strict \
  tools/umbrafox/tests/readback/test/*-spec.mjs
timeout 30 node --test --unhandled-rejections=strict \
  tools/umbrafox/tests/readback/test/*-spec.mjs \
  tools/umbrafox/performance/test/*-spec.mjs \
  tools/umbrafox/tests/control/control-spec.mjs
timeout 150 node --unhandled-rejections=strict \
  tools/umbrafox/tests/readback/capture.mjs ABS_BINARY NEW_ABS_OUTPUT
```

Use the last command only for an authorized isolated run. The driver refuses
existing output roots. All logs are preserved under
`artifacts/umbralink-control/readback-*`. There are no remaining test/browser
sessions from this follow-up.

## Frame Lifetime Review

A subsequent source-only review found no new lifetime blocker in the candidate.
This supports the per-image cache boundary; it does not establish actual GPU
routing, decoder correctness, pixel parity or a measured speedup. No browser,
native test, build or installation ran during this review.

The reviewed producer/consumer chain is:

1. `RemoteVideoDecoderChild::ProcessOutput` consumes each `RemoteImageHolder`
   into an image before creating its `VideoData`. For a remote GPU descriptor,
   `RemoteMediaManagerChild::TransferToImage` constructs a new `GPUVideoImage`.
   The holder clears its descriptor and manager after transfer. The cache is
   therefore attached to that image, not to the video element or decoder.
2. `TextureClient::GetSurfaceDescriptorRemoteDecoder` uses the texture serial
   as the remote handle. The serial is assigned when the texture is constructed;
   it is not a new per-frame identity each time a pooled texture is reused.
   The stronger relevant invariant is ownership: the parent `StoreImage` retains
   both `Image` and `TextureClient` in maps of strong references while the
   remote descriptor is owned. Descriptor deallocation erases both entries.
3. `TextureClientRecycleAllocator::CreateOrRecycle` retains an in-use holder
   and installs a recycle callback. `AtomicRefCountedWithFinalize::Release`
   invokes that callback when the reference count drops to one. The parent's
   additional strong reference prevents this transition while its map entry
   remains. This is the inspected pooling contract, not a certification of every
   platform decoder or driver. `Image` also explicitly requires immutable pixels
   after publication through `ImageContainer::SetImage`.
4. `GPUVideoTextureData::Deallocate` releases the remote descriptor through its
   manager. The consumer image owns that texture client; its existing `RECYCLE`
   flag delays deallocation while the compositor still uses the texture.
5. `RemoteMediaManagerParent::RecvReadback` allocates separate shared memory for
   the readback result. The child wraps it in a `DataSourceSurface` and attaches
   `SurfaceDescriptorUserData`, which retains the allocator and frees that
   shared memory when the surface is released. The cache does not point directly
   at a decoder buffer that will be overwritten by the next frame.
6. `CachedSurface` publishes only its first retained surface under a lock and
   releases it on the main thread. The candidate does not hold that lock across
   synchronous manager-thread dispatch or readback IPC. Concurrent misses can
   still perform duplicate readbacks; it is not a single-flight mechanism.

Searchfox was used to locate the upstream texture/refcount contracts, then the
actual local producers and consumers were read, including the existing sized
readback changes. Exact local hashes are retained in
`artifacts/umbralink-control/readback-lifetime-source.sha256`. The original
`readback-native-source.sha256` still identifies the cache and native tests;
this review does not replace their earlier runtime evidence or package seals.

The 1 MiB limit is **per live image's retained raster payload**, computed from
stride times height. It is not a process-wide memory budget, a shared-memory
allocation-size bound including overhead, or a bound on concurrent temporary
readbacks. Images retained by callers can each retain a cache; off-main-thread
destruction can defer the final surface release. The first read remains
synchronous and a workload doing one copy per new frame avoids no readback IPC.
That workload must be checked for extra retention and overhead, not described
as accelerated by this cache.

## Remaining Gates

The authorized single headed run establishes the observations above, but not
same-backend baseline parity. Obtain consent for the additional bounded baseline
window, establish actual provider/cache routing, then repeat exact-pixel checks
on an appropriate larger clip.
Measure same-frame reuse separately from one-copy-per-new-frame playback, include
control/order repetitions and retained-resource checks, and keep the owner
browser untouched. Do not infer that the observed YouTube stutter is caused by
this readback path or that the cache benefits that workload without evidence.

The hardware falsifier must include distinctly different frames across repeated
seeks and decoder/texture reuse, not merely repeated draws of a paused frame.
Compare crop, filter, transform and alpha exclusions as well as the eligible
small linear copy. Retain actual provider/routing evidence: a hardware-decoder
label by itself does not prove the sized readback or cache-hit branch executed.
Check release/steady-state resource behavior after dropping held images. Until
those gates pass, this remains an uninstalled candidate with software-path
pixel evidence and a source-supported lifetime contract.
