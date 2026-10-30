# PBO Composited Correctness

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Result

Both configured upload modes pass the owned laptop video-pixel and compositor
readback comparison. All 48 ordered video-pixel comparisons match exactly,
including four retained raw buffers. Two distinct canvas/image scenes have
byte-identical compositor readbacks across modes. Each scene was captured twice
in each browser; all same-state pairs agree, and the deliberate visual change
changes both the canvas and uploaded-image regions as expected.

This advances P1 of the [upload comparison plan](../../plans/pbo-upload-control.md).
It is not a speed measurement, native upload-mode acknowledgement, universal
rendering-parity proof or physical-scanout test. Retained decoder-loss checks
under both PBO settings remain required before the fixed timing comparison.
No preference default or daily installation changed.

## Protocol

The existing pixel collector and bounded ownership envelope are unchanged.
The private correctness adapter appends six serialized UmbraLink requests after
the normal pixel checks: scene zero, two readbacks, scene one, two readbacks.
There are no new page APIs or browser automation flags. All modifications to the
page are confined to the owned loopback fixture after its video checks.

The scene consists of a 120-by-128 canvas adjacent to an equally sized PNG image
decoded from an independently drawn canvas. Known opaque red, green, white and
black quadrants fill the first 240-by-128 scene. The second changes red to blue
and black to cyan. Every returned RGBA channel is checked, not just a few sample
pixels or an aggregate nonblank predicate. No text, interpolation or pixel
tolerance is involved. Both real captures use DPR 1; synthetic validation also
covers DPR 2, which is not a hardware-tested configuration here.

The actual packaged `Capture.sys.mjs` is hash-joined to the reconstructed package
source in the [preceding admission](2026-10-07-pbo-admission.md). Explicit
`readback:true` selects its parent-window widget-layer `drawWindow` path, not
software `drawSnapshot`. Each call validates the parent PID, sole browser window
and tab, selected context, inner-window ID, exact fixture URI, DPR, WebRender
layer manager and measured content rectangle. Identity and geometry are checked
again after the awaited capture. Only the scene rectangle inside that owned
content area is read. No unrelated desktop or browser region is captured.

The helper limits raw pixels to 491,520 bytes before readback and validates
dimensions afterward. Raw replies are saved before validation. Unexpected
configuration, pixels, navigation, dimensions, additional windows or failed
writes stop acceptance. Readbacks force rendering and will not be added to the
performance workload.

## Execution

Host: wyatt-laptop, Intel Iris Xe, Mesa/iris 25.2.8, X11. Both browser receipts
report hardware WebRender available, and both video checks retain hardware
ffmpeg decoding. The separate GPU-process feature is unused, not an independent
GPU process whose recovery was tested.

Both modes use the same normal 46-file descriptor-borrow package, BuildID
20261006175655, manifest SHA256
`1de58db614be934fb7fe71fc46ea168ce9777a8b46e340d3f429090b4e3e6773`.
GPU import remains ON and the profiler OFF in both private profiles. PBO is
written before launch: A requests true, B false. Actual/default/user/locked
preference receipts pass before and after the video checks and in all readbacks.
They prove configured values, not an internal renderer acknowledgement.

| Mode | Browser / Controller PID | Start UTC | Finish UTC |
| --- | --- | --- | --- |
| A, PBO true | 1904207 / 1904175 | 08:00:49.611 | 08:01:05.893 |
| B, PBO false | 1906892 / 1906880 | 08:05:14.821 | 08:05:31.128 |

Both runs are October 7, 2026. Each has 45 public evidence files, six resource
samples, a 271-byte browser log with zero drops and clean owned SIGTERM cleanup.
Peak sampled artifact sizes are 65,732,962 and 65,790,329 bytes; existing absolute
and post-baseline resource caps replay successfully. The two public exports total
4,098,553 decoded bytes. Profile, token and application-data payloads were not
exported. The sandbox EPERM and VA-API initialization messages remain preserved.

Every arm had a 15-second settle followed by exact package/harness, host, memory,
disk and no-conflicting-browser/build admission. The original 120-second capture,
105-second work, 15-second cleanup and 220/240-second driver/SSH bounds remain.
All 24 recorded PIDs were independently absent after both runs; the final remote
preflight also finds no browser/build activity and unchanged package/harness.
These are point-in-time and sampled checks, not a host or network sandbox.

## Verification

The relevant final combined gate passes 371 tests, zero failures or skips,
in 11.03 seconds under a 60-second watchdog. It includes owned Node subprocess
and loopback server tests, not only pure data. No native compiler ran here.

New checks cover wrong pixels and alpha, malformed geometry, encoded-byte caps,
changed context/document, software renderer, missing/changed/locked preferences,
late navigation, every RPC rejection and abort, and every failed evidence write.
The packaged readback branch and exact generated-adapter transformations remain
checked. The collector's original function is byte-identical. Saved real exports
reproduce the entire comparison; rehashed semantic corruption also rejects,
rather than relying solely on checksum failure.

The first baseline replay incorrectly compared the timed resource-file envelope
to the monitor's untimed baseline value. Source inspection confirmed that only
`beganMs` and `finishedMs` are added when saving resource samples. The corrected
auditor validates those ordered times separately and requires exactly one deep
match of the remaining sample to the entire baseline. The initial failed audit
and failing-first test remain. A separate negative test exposed missing explicit
hardware-feature admission in the offline auditor; that check was added before
final acceptance. Neither issue required a browser retry or changed evidence.

Evidence namespace: `artifacts/umbralink-control/pbo-upload/`.
The 158-file runtime manifest has SHA256
`3b63f2011142afaf17c91f20315180d53f6492ec0bda3e7dc74c5472ddfeae82`;
its 28 reachable static imports and all 67 milestone source pins verify.
`correctness-comparison.json` is the saved pair result. `a-export.json` and
`b-export.json` retain bounded, hashed raw exports; `composited-final-absence.json`
and `remote-final.json` preserve final cleanup/admission checks. Earlier failed
logs are retained. Source defaults, daily desktop browser/profile/launcher,
installation, Pi and Git index remain untouched.

The immutable checkpoint manifest is
`artifacts/umbralink-control/pbo-composited-correctness-final.sha256`.
It seals this report, the admission report, all current PBO artifacts and the
158 runtime inputs. Mutable plans and continuity notes are excluded. Further
adapters and verification logs must use a new namespace rather than rewriting
these as-run files.

## Remaining Gates

Run the existing retained decoder-loss comparisons with both upload settings
through a separately verified adapter. Preserve exception names and pixels,
including the difference between retained ImageBitmap data and failed future
readbacks. No timing run until that gate passes.

Then perform the planned unprofiled A1/B1/B2/A2 once, retaining all 29 numeric
criteria and startup gaps. These correctness runs are not timing arms and cannot
be substituted for them. Native path attribution, rare artifacts, partial
presentation, varied content, other backends and real-site performance remain
open. The broad performance goal is active, not completed by this checkpoint.
