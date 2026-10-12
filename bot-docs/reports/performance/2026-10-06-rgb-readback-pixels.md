# RGB Readback Real-Video Pixel Gate

## Result

The corrected integrated package restores ordinary linear pixels to the
historical full-size reference in this hardware-decoded video workload. All four
320x180 raw buffers, two repeats at each of0.5s and2s, match byte-for-byte with
zero differing components. The prior scaled V2 build differed in3575 and3157
pixels, with maximum channel deltas94 and100 at those frames.

The complete correctness gate still **fails**. Fourteen of48 hashes differ from
the full-size reference. At each frame these are both repeats of odd-size,
global-alpha and readback-oriented draws, plus the second filter draw. Filter
repeats remain unstable in both frames. No ON capture or performance follow-up
was launched; no threshold was relaxed. This is progress on one concrete pixel
defect, not full parity, a general speedup or a YouTube stutter fix.

## Artifact And Execution

Package: exports/umbrafox-rgb-readback-20261006/, BuildID20261006111504.
Manifest SHA256:
`a5da86b656e6bd241e309329f0072367d2bfc891650c500abb47fe561b071a11`.
The new78-input/79-entry harness differs from the preceding integrated harness
only in four package-identity/path wrappers;74 shared inputs are unchanged.
Harness archive SHA256:
`48e197e23d328b5b499838fadbe738faeaf630132dc5ec10a367228f6672d473`.
All54 current package-source pins, source patches and configuration were guarded.

The fresh laptop harness is
`~/.cache/codex/rgb-readback-pixels-harness-20261006-UWmY19`.
After verified transfer/extraction and15s settling, admission found no observed
browser/build process and sufficient memory/disk. The owned test root is
`~/.cache/codex/laptop-rgb-readback-pixels-off-20261006-XtyhI9`.
Controller1465484/browser1465497 ran11:40:07.995..11:40:24.608UTC,16.613seconds.
Native PID/build/private application-data receipts and installation postcheck
passed. Cleanup used owned SIGTERM; all12 recorded PIDs were subsequently
absent. The271-byte log had0dropped bytes. Sandbox warnings are retained.
This is not a census of every transient helper or a no-network guarantee.

Hardware decoding was observed as ffmpeg video decoder (RDD remote), AVC,
1920x1080. Adapter inventory, X11 protocol and compositor window metadata match
the reference: Mesa Intel Iris Xe(RPL-P), mesa/iris25.2.8.0, WebRender. Both use
the same22606489-byte fixture, SHA256
`aac5b2c571eff675332728d94291137bf184c41644d7beb6f8467fee05907d27`.
This is an owned local paused-frame workload, not a YouTube session or scanout
measurement. Provider/preference observations do not prove individual imports.

## Independent Pixel Checks

The frozen strict unpack rejected unstable repeats before writing accepted
results. A separate forensic extractor requires this exact filter-only failure,
retains all original cleanup/identity/hash checks, and labels its output as
failed-repeat-stability. It does not turn capture completion into acceptance.
All38 exported files/1386984bytes were independently size/SHA256 checked.

Compared with the preceding V2 capture,20 of48 case hashes changed: both repeats
of linear, odd-size, nearest-setting, alpha and readback draws at each frame.
Linear and nearest-setting now match the historical full-size reference. The
nearest-setting label refers to imageSmoothingEnabled=false in the fixture;
Canvas2D still selects LINEAR for downscaling, as its existing DrawImage code
specifies. This result is not evidence of POINT sampling changing behavior.

The remaining odd/alpha/readback mismatches are established by hashes, not
retained raw buffers. Their magnitude is unknown. Do not describe them as
one-level noise or assume they are harmless. Filter outputs are unchanged from
the preceding V2 capture, consistent with the separately open repeat problem.

Final25 offline tests pass with no skips: package admission/identity-only
wrapper equivalence, existing collector/timeout regressions, all exported hashes
and cleanup joins, exact raw linear equality, whole-matrix rejection, corrupt
buffer/target rejection, byte-difference vectors and forensic-extractor scope.
Both intended old-package admission failures and the actual strict runtime
failure are preserved. No source code or existing sealed evidence was changed.

## Source Leads And Next Falsifiers

Current local MaybeGetScaledSourceSurfaceForRemoteVideo checks identity
transform, full source, LINEAR sampling and integral destination size, but does
not take global alpha or destination backend as an input. Its caller applies
globalAlpha in the subsequent DrawSurface. An additional quantization step
before alpha is therefore a plausible cause of the alpha mismatch, not a
demonstrated causal explanation yet. The readback destination likewise needs
comparison against the actual software target rather than assuming accelerated
and software resampling are identical.

The native synthetic suite used an8x4 source and small odd destinations, a
WebGL reference target and default DrawOptions. It does not establish the actual
1920x1080 to321x181 precision, post-scale alpha or software-target cases now
failing. Extend that native reference test first with those concrete cases,
retain a behavioral failing result, then choose the smallest parity-preserving
correction. Do not simply remove difficult cases from the acceptance matrix.

The filter-repeat issue remains separate: filtered DrawImage bypasses the sized
helper, and previous raw-RGBA tests already show that a decoder is not required.
Keep the prior source/cache/allocation investigation and original failed evidence.
Performance/memory measurement and default enablement remain downstream gates.
Desktop daily browser/profile/install/launcher, Pi, Git index and preferences
were not changed. All owned commands and the test browser are terminal.

Evidence: artifacts/umbralink-control/rgb-readback-pixels/. The final milestone
seal is artifacts/umbralink-control/rgb-readback-pixels-final.sha256; later work
must use a new namespace. The broad rendering/layout/CSS/JS objective stays active.
Final source verification matches all54 native inputs and78 harness files,
HEAD/index/working patches and configuration. Scoped documentation lint and
four-file formatting checks pass, diff-check is clean, and the123-file package
seal verifies unchanged.
