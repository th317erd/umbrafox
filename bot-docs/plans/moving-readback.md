# Short Moving-Frame Copy Pilot

Use the existing sealed readback package pair on disposable headed laptop
installs only. Desktop browser/profile/install unchanged. No new engine build.
This is a short functional and measurement-admission pilot, not a statistically
valid playback comparison. Do not pool timings with profiled paused-frame data.

Serve the existing 90s1080p30 H.264 testsrc2 asset (SHA aac5b2c5...07d27) using
the existing bounded loopback sustained fixture. Retain120s capture envelope,
10s initial quiet,256MiB sampled artifact cap and private roots. Require at least
64MiB sampled headroom before workload, without deleting anything or raising
limits. Earlier near-cap60s evidence remains a warning, not cleared admission.

Run four2s phases with1/4/4/1 copies per requestVideoFrameCallback,110x75 CPU
canvas, profiler off. Per callback retain video metadata, draw-call durations,
and SHA256 of each copy's pixels. Hash asynchronously without delaying the next
callback registration, with16 pending callback batches maximum. Bound96callbacks
per phase and384 total. Cancel the pending callback/timer on every completion
or error; pause owned media in finally. A callback-free phase must fail, not
become a fast result. No extra browser RPC inside active phases.

Require advancing mediaTime/presentedFrames, strictly ordered callback receipts,
same document/element/source, visible normal playback rate, exact1920x1080/90s
asset state, equal repeated-copy hashes per callback, native hardware decoder
receipts before/after, and nondecreasing video quality counters. Preserve dropped
frames and missed-callback gaps; they are observations, not silently excluded.
Collect parent/process CPU snapshots outside the workload only. No FPS/GPU/CPU
attribution from draw wall time alone.

Profiler-off is not observer-free: pixel reads and asynchronous hashing still
consume resources. Draw-call durations exclude pixel-read and hash cost. Retain
this limitation in pilot comparisons; do not call this an uninstrumented
playback benchmark.

One baseline first. Inspect functional gates, cleanup, artifact headroom and
backend before ONE candidate. A failure ends that run and is retained; no
automatic retries or relaxation. Whole-package differences and fixed run order
mean any pilot timing difference is descriptive only. A later predeclared,
replicated order-balanced comparison is required for a performance verdict.

Tests first: serialized page callbacks/timers/hash failures, state changes,
playing/seek/error/visibility/source transitions, callback and pending caps,
RPC/evidence failures, before/after identity joins and strict typed results.
