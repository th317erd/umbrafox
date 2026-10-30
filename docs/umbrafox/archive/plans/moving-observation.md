# Moving Video Observation Contract

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

This prospectively replaces the measurement assumption, not the failed result,
of moving-readback.md. Keep its sealed baseline failed and its code unchanged.

Reuse the exact serialized collector, local90s1080p30 H264 media,1/4/4/1 two-second
phases, package pair, headed laptop display and all resource/cleanup limits.
No new engine code/build/install or desktop browser action. No profiler.

Validate every receipt and retain all hashes/draw timings. Require strict media,
callback and presented-frame progression, typed bounded counts, fixed schedule,
visible paused terminal state, and monotonic video counters. Hashes within a
callback may differ because each draw selects its current image independently.
Count stable and differing batches separately without dropping either. This is
not immutable-frame parity, actual image-ID attribution or a cache-hit counter.
Keep existing paused-frame pixel/request tests as the separate reuse oracle.

Save raw post-workload performance, native decoder and browser-state replies
before result classification, provided the control document/context remains
valid and the existing work budget permits. Do not perform follow-up RPC after
abort or lost identity. Native paused decoder names such as shutdown remain
explicit coverage limitations; hardwareAccelerated fields alone do not prove
active hardware decode throughout playback.

Report per-phase counts, quality deltas, every-copy wall-time distributions and
first-versus-additional-copy distributions. Do not exclude transition batches
from aggregate timings or treat a faster candidate as proof about whole-browser
stutter. Coarse page timing and pixel-read/hash observer costs are limitations.
Performance snapshots bracket the instrumented workload, not an isolated draw.

First ONE fresh baseline; inspect accepted schema, resource limits, provenance,
backend and complete owned cleanup. Only then ONE fresh candidate. No automatic
retries, cap changes or reinterpretation of failed runs. A fixed-order pair is
descriptive, not statistically valid cache-only attribution or a release gate.

Tests first: saved failed V1 data remains rejected by V1 but can be described
under the new schema; preserve all observations, invalid fields still reject,
postdiagnostics precede invalid-result rejection, and identity/abort/evidence/RPC
failures terminate without unsafe follow-up. Run existing capture/fixture/
installation regressions before runtime and verify transferred hashes.
