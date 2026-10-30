# Laptop Headed Readback Check

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

Owner permits isolated laptop test browsers as needed. Desktop work browser,
profiles and installations remain untouched. This is a fixed correctness check,
not a performance claim or a cache-only source comparison.

Run baseline then candidate once each, sequentially, on laptop X11 `:0`, with
the existing paused-video readback fixture. Keep the same two seek positions,
nine draw cases per frame and twelve repetitions per case, and exact pixel hashes.
Do not relax pixel or backend admission after observing results. No profiler,
GPU override, new browser API or userland rule is involved.

Inputs are the sealed October 1 prototype and October 3 readback candidate;
`artifacts/umbralink-control/laptop-headed-readback/packages.json` pins all46
files in each, both archive hashes and both build IDs. Preserve the originals;
each run gets a fresh private installation, profile, app-data, local-data and temp.

Reuse existing installation admission/postchecks, native-root receipts,
capture limits (105s work, 120s total, 15s cleanup) and256MiB sampled run cap.
External driver watchdog210s includes preparation and post-run hashing. Use
owned SIGTERM only. Preserve failure and stop the sequence if a run fails.

Before launch verify display availability, host resources, exact harness and
package bytes. After each run verify clean cleanup, observed PID absence and
installation postcheck before proceeding. Export only named evidence files,
not profile/discovery/app-data contents.

Use the existing readback context validator before comparing all18 hashes.
Different decoder, compositor, driver or graphics context means comparison not
admitted even if pixels match. A hardware flag alone does not prove cache hits.
Small paused frames do not establish sustained playback or performance gains.
