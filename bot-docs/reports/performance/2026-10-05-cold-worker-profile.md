# Cold Readback: Receiver Worker Captured

## Result

One fresh baseline and one fresh candidate passed the prospective diagnostic on
wyatt-laptop. Both profiles positively identify the receiver as `MediaSupervisor
#2` with samples inside the first draw's same-document UserTiming interval.
This closes the missing-worker gap in the
[previous diagnostic](2026-10-05-cold-copy-profile.md).

The named readback handler occurs in 33/36 baseline worker samples and all 22
candidate worker samples in that interval. Stacks include Mesa/Gallium frames,
but native library addresses are mostly unresolved. Context initialization,
shader compilation, conversion, lock contention and GPU waiting are not yet
separated. Next: resolve these saved profiles with matching local symbols, not
another browser run or speculative graphics patch.

No engine/build/install/desktop-browser change. The candidate remains uninstalled.
No retry. The older failed capture and validator remain sealed and unchanged.

## Prospective Correction

Plan: `bot-docs/plans/cold-worker-profile.md`. Runtime siblings under
`artifacts/umbralink-control/`: `cold-worker.mjs`, `cold-worker-profile.mjs`,
`laptop-cold-worker.mjs`. Evidence: `artifacts/umbralink-control/cold-worker/`.

The exact previous collector is imported unchanged: same H264 asset, 110x75 CPU
canvas, four two-second phases with 1/4/4/1 copies, pixel/hash observer and first
six UserTiming scopes. No Firefox public-interface or timer-protection change.

Validation now orders Performance-mark intervals only, allowing equal rounded
endpoints. It does not order that clock against the differently reduced video
callback clock. Six names, finite/nonnegative times, no extra/overlapping traces,
draw duration inside mark duration and all V3 moving checks remain. The saved
`11473 < 11473.14` counterexample passes the new contract while still failing
the unchanged old validator. No guessed timing tolerance was added.

The controller adds `MediaSupervisor` to `GeckoMain` and `RemVid`, retaining 1ms
sampling, stackwalk/js/processcpu/ipcmessages/flows/nomarkerstacks, eleven serial
RPCs, raw-before-validation, finally-stop and the existing bounds. Requested
configuration and no wrap are checked. Actual buffer minimum remains unchanged.

## Observations

| Item | Baseline | Candidate |
| --- | ---: | ---: |
| BuildID | 20261001103920 | 20261003071500 |
| Harness elapsed | 21.424 s | 21.205 s |
| First UserTiming interval | 36.665978 ms | 21.674356 ms |
| Request-start to reply-end | 34.594568 ms | 21.362254 ms |
| Between endpoint transfer spans | 33.756382 ms | 21.184646 ms |
| First-window worker samples | 36 | 22 |
| Samples under readback handler | 33 | 22 |
| Profile bytes | 21,124,358 | 16,641,802 |
| Resource samples | 7 | 7 |
| Sampled artifact peak | 233,845,669 B | 221,799,616 B |

Fixed-order profiler-on whole-package pair, not a causal speedup comparison.
Do not compare against unprofiled ABBA or captures with fewer sampled threads.
Endpoint spans are not exact receiver execution; samples include waits, not
just CPU execution. No per-stage CPU/GPU, YouTube, scanout or sustained-playback
improvement claim follows from these numbers.

RDD PID/worker TID pairs: `1137068/1139276`, `1142788/1143082`. Content PIDs:
`1137102`, `1142824`. First requests use sequence -34 in separate process pairs.
Document ID 10737418242 is joined within each capture, never across captures.

When the worker is sampled, parent IPC payloads omit the old relocation
`threadId`. `coverage.mjs` takes the TID from the exact thread-handle/PID roster
and cross-checks `recvTid` or `sendTid`. It passes that explicit in-memory
projection to the sealed endpoint analyzer, preserving original exports.
998/416 parent endpoint records use this projection. This is not a guess based
on a task-queue name. Sample validation requires that worker, positive count,
idle inclusion, and the exact root/zoom range corresponding to the first measure.
`results.json` reproduces byte-for-byte; StackMarker raw pairing remains unclaimed.

## Provenance and Next Symbols

Same frozen package pair as the prior report: base
`892431809a4caadb5c73b2c03ad9bdb124c3e21e`, baseline patch `a90f9969...`,
original readback patch `46f9b2e4...` and pinned supplements. Not the later
inline-DOM package sharing the candidate BuildID. All 47 regular package files
pass postchecks; only previously admitted empty update directories are allowed.
Both after receipts report hardware ffmpeg RDD H264, not continuous decode proof.

Packaged `libxul.so` files are not stripped. `file` reports GNU ELF IDs:
baseline `101a3778f02e7e2c463829dc94b3ebc3`, candidate
`f2c96c91073e8ba2cd754e10735f6b75`. These are promising inputs, not evidence of
successful symbolication. Use exact ID matching, not current objdir/source guesses.
The earlier bounded local symbol-server workflow is documented in
[interleaved sampling](2026-10-03-interleaved-profile.md). Retain isolated caches,
explicit loopback, lifetime/resource bounds and exact cleanup. No symbol server
ran this turn. CLI metadata `symbolicated:true` is not complete native resolution.

## Verification and Cleanup

Clock RED1pass/2fail and worker-filter RED4pass/5fail preceded corrections.
Coverage synthetic RED1pass/1fail prompted endpoint/roster-TID cross-checking.
Final54focused tests PASS, including both real saved captures and malformed,
missing, ambiguous, crossing, clock, identity, cancellation and evidence cases.
Exact11file Prettier check PASS; no native build or full-repository lint claim.

Both native profilers stopped; clean owned SIGTERM, zero log drops. All24
recorded browser/controller PIDs were checked absent after analysis. Named CLI
daemons used explicit `http://127.0.0.1:9`; PIDs812889/828933 and their sockets
are absent. Raw profile copies match exported hashes; only profiler-cli parsed
raw profiles. No personal profile/shared crash queue access or network-sandbox
claim. No active browser/controller/profiler from this work remains.

Bounds unchanged:120s total/105s work/15s cleanup/final2s,10s quiet,64MiB initial
headroom,256MiB sampled artifacts,24MiB each dump/copy. Sampling is not a proof
of instantaneous peaks or continuous process/network isolation.

Remote harness `/home/wyatt/.cache/codex/cold-worker-harness-20261006-4r6EiD`:
42files23311667B, manifest SHA256
`31a2ad1ecfe9627236fdf87364bdb8975592a0fddf8fa40b088bc887fbaca063`.
All runtime hashes match after execution. Remote roots:
`/home/wyatt/.cache/codex/laptop-cold-worker-baseline-20261006-0tFCKa` and
`/home/wyatt/.cache/codex/laptop-cold-worker-candidate-20261006-VjrtA2`.

Prior cold-profile seal verifies unchanged. Staged diff SHA256 remains
`3b78253cf775a4a1e8c69a4b82cc3958b366056129a391f4ae362bdfe8e4e0c4`.
No commit/stage/reset/native-source change. The broader performance goal remains
active; local resolution of these worker stacks is the next useful action.
