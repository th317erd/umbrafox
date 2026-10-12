# Borrowed Descriptor Correctness

## Result

The descriptor-borrow candidate builds, packages, passes all 54 required native
tests, and passes the existing laptop browser pixel and decoder-loss matrices.
Its playback benefit is not yet measured. The experimental GPU import remains
default OFF; nothing was installed in the owner's daily browser.

Both import modes match all 48 ordered pixel comparisons against their immediate
pre-change counterparts. Candidate ON also matches candidate OFF, and candidate
OFF matches the older preserved full-size reference. Each comparison includes
four byte-identical retained RGBA buffers. Both decoder-loss modes match all
eight reference cases, including exception names and preserved bitmap pixels.

This does not prove runtime reuse frequency, automatic decoder or graphics-context
recovery, physical presentation, universal Firefox parity or a YouTube stutter fix.
The readback-heavy pixel workload is not a performance comparison.

## Native Build And Ownership

The first two-job native build hit its 20-minute watchdog. Its failure and logs
remain intact. A separately bounded incremental continuation completed in
339.60 seconds; normal packaging completed in 192.15 seconds. No build was
restarted because an observation wait expired. The earlier unrelated AeorDB
test process was left untouched; a one-time build-only admission pinned that
exact noncompiling process and child. It was not a performance-run exception.

The export is exports/umbrafox-descriptor-borrow-20261006. Its 46-file manifest is
1de58db614be934fb7fe71fc46ea168ce9777a8b46e340d3f429090b4e3e6773.
Only libxul differs from the immediate frame-reuse package, whose manifest is
9ec305adc36c8c1e362ed6e74925c8c473efd999212d354c6f11431ca17b8678.
Both have BuildID 20261006175655; the shared ID cannot distinguish the artifacts.
The archive SHA256 is
ac66c75b505706ca092d240c4342d02df37f883ae7fe135ecf0d732b6e382a26.

The separate native test library passed 54 tests, zero failures or skips, on
wyatt-laptop. The new BorrowedDescriptorKeepsIndependentOwningCopies case uses
real DMABuf storage and reference-count descriptors, retaining independent owning
copies and checking pixels. The hardware-EGL fixture temporarily overrides its
headless-test software policy and restores it afterward; this is not a normal
browser acceleration result. The native process exited naturally with code 0.
All five recorded controller/native/sandbox/IPC peer PIDs were independently
absent. The hashed native exports have been replayed locally.

Compiler DWARF records SurfaceDescriptorDMABuf at 184 bytes, SurfaceDescriptor at
192 bytes, and the candidate DMABUFTextureHostOGL at 328 bytes. The eight-byte
field-storage increase is a real tradeoff. Baseline host allocation size, allocator
size class and live-playback memory cost were not measured. Avoiding an owning
copy is not a zero-overhead or net-speed claim.

## Browser Execution

The new 152-file harness preserves all 146 previous runtime inputs. Its manifest
is 9edc057ffcfc262ac711279d242a9593f494d20cec8e89d2f976ccece20e8a5b.
Generated wrappers differ only by namespace and candidate manifest. The collector,
shaders, preferences, tolerances, resource limits and cleanup protocol are unchanged.
The normal package was used, never the native-test library overlay.

All four runs passed preflight with no browser/build activity and sufficient
memory/disk. Each used fresh private installation/profile/application/local/temp
roots. Capture bounds remain 120 seconds total, 105 seconds work, 15 seconds
cleanup; driver/SSH bounds remain 220/240 seconds. Captures were serialized,
with export and comparison before the next launch. No profiler was used.

| Arm | Browser / Controller PID | Capture ms | Public Files |
| --- | --- | ---: | ---: |
| Pixels OFF | 1861803 / 1861791 | 15998 | 38 |
| Pixels ON | 1864141 / 1864129 | 16059 | 38 |
| Decoder loss OFF | 1866517 / 1866505 | 12968 | 49 |
| Decoder loss ON | 1868819 / 1868787 | 12713 | 48 |

Observed graphics match Intel Iris Xe RPL-P, Mesa/iris 25.2.8, X11 and WebRender.
At the measured nonzero seek positions the decoder reports hardware-accelerated
ffmpeg/RDD H.264. The initial shutdown decoder label is retained, not treated as
active-decoder proof. These observations do not identify every individual import.

Decoder loss is permanent owned-RDD shutdown, not crash/restart recovery. The
terminal evidence observes a single-thread zombie before final reaping. A cold
probe verifies unavailable readback; retained video draws match the reference
InvalidStateError while the already-copied bitmap retains its pixels.

All four browser cleanups use owned SIGTERM, with zero dropped log bytes. The
173 exported public files total 7,956,775 bytes and are rehashed locally. There
are 22 resource samples; peak sampled artifact size is 66,335,903 bytes under
the unchanged 256 MiB cap. All 50 distinct recorded PIDs were independently
absent at 2026-10-07T06:09:11.094Z. No profile, token or application-data payload
was exported. Sampled process and post-startup directory receipts do not prove
continuous process/network/filesystem isolation. Known sandbox EPERM, VA-API and
intentional VideoBridge-close messages remain in logs.

## Verification And Next Gate

Nineteen focused test groups pass, including exact wrapper equivalence, package
admission, all saved-file hashes, resource/baseline joins, ordered pixel results,
decoder-loss evidence, chronology, native ownership receipts and cleanup.
Fourteen corrupted pixel cases and wrong-package inputs reject. The initial ten
missing-file failures are scaffolding, not a reproduced product defect.
The 67 product/test source pins, HEAD, index and configuration remain unchanged.
Earlier failed smoothness comparisons remain failed and separate.

Evidence: artifacts/umbralink-control/descriptor-borrow-gpu/. Native build/test
evidence remains under descriptor-borrow/. Next is a fixed profiler-OFF
A1/B1/B2/A2 playback comparison against the immediate frame-reuse package, with
the existing workload and numeric criteria. No deployment or default enablement
follows from these correctness results.
