# Exact Canvas Fallback

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Result

The integrated diagnostic build passes the previously failing real-video pixel
matrix on wyatt-laptop. All48 OFF hashes match the preserved full-size reference;
all48 ON hashes match OFF. The four retained linear RGBA buffers per comparison
are byte-identical. Every repeat is stable in both new captures, including blur.
No tolerance, case, collector predicate or acceptance threshold was changed.

The previous RGB candidate's14 different hashes remain recorded. In this matrix
the correction removes the odd-size, alpha, software/readback and second-filter
differences. This does not establish the cause of the separate historical blur
instability or rule out its recurrence in other workloads. The seven native
prescale failures remain untouched: their internal helper still exists, but this
canvas path no longer uses it.

This is bounded pixel correctness evidence, not a YouTube stutter fix, universal
Firefox parity, physical presentation proof or performance acceptance. The
experimental import preference remains default OFF. No daily build was installed.

## Source Correction

Only dom/canvas/CanvasRenderingContext2D.cpp changed in production this phase.
DrawImage no longer performs destination-sized CPU readback followed by another
backend scaling/compositing operation. HTML video instead acquires the full-size
surface at the original point, before the missing-image and security checks.
The existing exact full-size cache and descriptor-based GPU import remain.

The unused scaled helper, its DMABuf helper, deferred flag, late readback and
source-rectangle replacement were removed. Original rectangle/rotation placement
and direct-vector arguments were restored. Source comparison verifies that the
descriptor helper and GTK VideoFrame branch are byte-identical to this phase's
baseline, and the drawing tail exactly matches the frozen full-size reference.
The reference CanvasRenderingContext2D.cpp is the current HEAD blob, not a
reconstruction from an unpinned upstream revision.

Independent source review additionally caught the semantic importance of early
failure: the deferred route could perform DoSecurityCheck before discovering no
usable pixels. The correction preserves the original early no-image behavior,
full-read/optimization fallback and common getter retry. It does not broaden
platform eligibility, add public interfaces or alter preference defaults.

## Build And Package

Export: exports/umbrafox-exact-fallback-20261006/.
BuildID20261006153147 agrees in the ELF toolkit note and both INIs.
Manifest SHA256:
908633c41ff3579585a08dbaf228c158735d7f61d77fb22cc0aeb822df880f87.
Archive107782260bytes, SHA256:
147a2501536855dca2916893ec5ab36373b4f4a09bacd761b0bab8148521fc8b.
The46 files and57 archive entries total475126813 unpacked bytes.
Packaged libxul SHA256:
d7dab4fcc5eeecb5f9675e20c0455ccbc22468a0c7709ee478423abfb1919520.

All59 source pins,15 untracked inputs, HEAD, full working/index patches and
configuration are preserved. Only the canvas file changed among the preceding
58 source pins. The source patch and untracked archive accompany the export;
HEAD alone does not identify this dirty-tree build. Frontend inventories match
the previous package, with only the expected AppConstants BuildID substitution.

Three preflights refused concurrent cargo/rustc activity. Their processes were
not touched. The fourth passed with48.26GB available memory and71.50GB disk.
The two-job idle full build completed in66.85s; package completed in100.57s.
Both reported zero compiler warnings. Toolkit identity regenerated normally in
this build; no manual stamp change or generator workaround was needed.

Main commands, with output retained under the evidence namespace:

```sh
env MOZ_BUILD_DATE=20261006153147 CARGO_BUILD_JOBS=2 timeout 1800 ./mach build -j2 --priority idle
env MOZ_BUILD_DATE=20261006153147 CARGO_BUILD_JOBS=2 XZ_OPT=-T2 timeout 600 ./mach build -j2 package --priority idle
timeout 180 ./mach python --virtualenv build artifacts/umbralink-control/exact-canvas-fallback/package-export.py
```

## Browser Evidence

The78-input harness reuses74 byte-identical shared inputs. Only four package
admission, driver, preflight and export wrappers changed identity/namespace.
The new bundle has79 entries and SHA256
226abeea2f3af9623bf8f74587416248737f6e788aa8a447afb5be641f520fa1.
Remote extraction validates package and bundle hashes before execution.

Fresh laptop harness: ~/.cache/codex/exact-fallback-pixels-harness-20261006-G1c6e5.
Each run had fresh private profile/application/local/temp roots, no observed
browser/build activity at admission, sufficient resources, and the existing
120s capture/15s cleanup,220s driver and240s SSH bounds. There was more than15s
settling after extraction and between captures. OFF fully passed before ON.

| Arm | Root Suffix | Controller / Browser PID | Duration | Export Bytes |
| --- | --- | --- | --- | --- |
| OFF | z1CuLU |1562045 /1562076|16.117s|1386926|
| ON | Nx3kW4 |1564536 /1564548|16.111s|1386873|

OFF ran15:57:40.404..15:57:56.521UTC; ON ran16:00:04.315..16:00:20.426UTC.
Each has38 independently rehashed public evidence files,12 recorded PIDs
independently absent, clean owned SIGTERM cleanup, and271 log bytes with0 drops.
Combined evidence is76 files/2773799bytes. The installation postchecks retain
the exact46-file package. Six resource samples per arm peaked at65082448 and
65057238 artifact bytes. These are sampled bounds, not continuous isolation.

Reference/OFF/ON adapter inventory, window protocol, compositor observations and
hardware decoder observations match: Intel Iris Xe(RPL-P), mesa/iris25.2.8.0,
X11/WebRender, hardware H.264 via ffmpeg in RDD at both measured frames. The
unchanged fixture is1920x1080,22606489bytes, SHA256
aac5b2c571eff675332728d94291137bf184c41644d7beb6f8467fee05907d27.
Native receipts join PID/build and the owned roots. They are post-startup proof,
not no-earlier-access or no-network guarantees. Sandbox warnings are retained.

## Verification And Limits

Source and geometry contracts each failed before their corresponding correction.
The final combined source/collector/admission/saved-data suite passes62 tests.
Separate BuildID reader6 and archive helper9 tests pass. Saved-data negatives
reject stable-but-wrong hashes, corrupt raw buffers, wrong mode and stale frames.
All four platform descriptor stand-ins still compile and pass. Scoped permanent
source/test lint is clean. The preceding availability evidence seal verifies.

The initial runtime wrapper admission still had the old manifest pin and
rejected the new package, providing the intended failing-first identity check.
One pre-runtime mechanical-equivalence test caught a two-space indentation drift
in the new extractor; it was corrected before transfer/execution, with failure
retained. Original captures and prior failed tests were not overwritten.

Pixel queries observe only two paused frames and can influence rendering state.
Provider/preference observations do not establish every individual import or
GPU completion. The earlier35.48% CPU result used another diagnostic package;
it must not be attributed to this integrated build without new measurements.
Cache-hit manager-thread validation cost, actual decoder/channel-loss behavior,
direct-import failure recovery, long playback and YouTube remain separate gates.

Evidence: artifacts/umbralink-control/exact-canvas-fallback/ and
artifacts/umbralink-control/exact-fallback-pixels/. The earlier comparison.json
is explicitly the OFF-only checkpoint; pair-comparison.json is the later ON/OFF
result. Desktop browser/profile/launcher/install, Pi, index and defaults remain
untouched. No commit/push; all owned commands and browsers are terminal. The
broad rendering/layout/CSS/JavaScript performance goal remains active.

Final milestone seal: artifacts/umbralink-control/exact-canvas-fallback-final.sha256.
It covers the plan/report, new evidence and wrappers/tests, and diagnostic export;
mutable continuity notes and generated Python caches are excluded. Later work
must use a new namespace rather than altering this evidence.
