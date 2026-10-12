# Cold Readback: Local Native Symbols

## Result

Local symbolication resolves the Gecko side of both saved readback-worker
profiles. Their largest named first-copy branches are blit-helper construction
and blit-program creation. Pixel readback is a separate observed branch. This
is stronger localization than the prior address-only stacks, not a measured
optimization or a diagnosis of recurring YouTube stutter.

No browser was launched. No native source, build, installation, owner profile,
launcher or public interface changed. The cache candidate remains uninstalled.
The original [captures and failed predecessors](2026-10-05-cold-worker-profile.md)
are unchanged. The broad rendering/layout/CSS/JavaScript goal remains active.

## Same-Window Counts

The exact first same-document UserTiming window and actual MediaSupervisor #2
receiver are re-established from each fresh CLI export. Raw root ranges, six
scope starts/durations, PID/TID, IPC joins and sample counts match the sealed
captures. Whole-function self counts independently reconcile to 36/22 samples.

| Inclusive native function samples | Baseline | Candidate |
| --- | ---: | ---: |
| Entire first-copy worker window | 36 | 22 |
| RemoteMediaManagerParent::RecvReadback | 33 | 22 |
| DMABufSurfaceYUV::BuildSurfaceDescriptorBufferForSize | 33 | 22 |
| DMABufSurface::ReadIntoBuffer | 32 | 22 |
| GLBlitHelper constructor | 21 | 7 |
| GLBlitHelper::CreateDrawBlitProg | 7 | 8 |
| ReadPixelsIntoBuffer | 4 | 6 |

These are inclusive sampled stacks, not additive exact durations or CPU/GPU
measurements. Nested rows must not be summed. Both constructor and program
creation descend into Mesa. Some descendants reach libc syscalls or waits;
the specific driver operation, wait target and shader compilation cost remain
unproved. There are 19/8 unresolved self samples out of 36/22 after this pass.

The fixed-order, profiler-on, whole-package pair still cannot establish a causal
first-copy improvement. The previous repeated-copy ABBA benefit remains separate.

## Frozen Source Boundary

The packaged libxul SHA256 values match the recorded baseline/candidate inputs.
Supported function-info exports identify their Breakpad IDs:

- Baseline: `78371A102EF02C7E463829DC94B3EBC30`, GNU ID
  `101a3778f02e7e2c463829dc94b3ebc3`.
- Candidate: `916CC9F23E07A28BCD754E10735F6B750`, GNU ID
  `f2c96c91073e8ba2cd754e10735f6b75`.

Server logs name the matching sealed package paths. These are not current objdir
libraries or the later inline-DOM candidate sharing a BuildID. Local matching
libc debug symbols also resolve some frames; missing libraries remain unresolved.

Base `892431809a4caadb5c73b2c03ad9bdb124c3e21e` plus each frozen tracked patch
is authoritative. Both GLBlitHelper patch blocks are identical and change only
the later DMABuf scaling overload, not the constructor or CreateDrawBlitProg.
Neither package patch changes GLContext.cpp. The inspected base shows:

- GLContext::BlitHelper caches a helper per context.
- The constructor sets up the quad buffer/vertex array and compiles its vertex
  shader. The current sample export cannot distinguish these operations.
- GetDrawBlitProg caches programs by key. CreateDrawBlitProg compiles the fragment
  shader, links the program, checks status and initializes uniforms.
- The sized DMABuf route allocates the requested BGRA descriptor, then uses mGL
  or the mutex-protected shared snapshot context for scaled ReadIntoBuffer.

Searchfox discovery is retained, including the
[program-creation source permalink](https://searchfox.org/firefox-main/rev/00a4d527cdb9807ecb561c9fcf7d211e7e568ddf/gfx/gl/GLBlitHelper.cpp#779-799).
Current upstream is context, not a substitute for frozen deployed source.
Installed searchfox-cli 0.18.0 advertises 0.20.4; no tool update occurred.

## Limits Found

Two more supported offline loads requested assembly annotations for constructor,
program creation and pixel readback, using explicit local symbol-server URLs.
All six return instructions without fetch errors, but every instruction has zero
sample attribution despite nonzero function totals. A new reconciliation guard
rejects them. No exact GL call, source line or instruction cost is claimed.

The top-down exports requested limit200 but contain101 nodes including their
synthetic root. Their self counts total only8/7 versus36/22. Treat these trees
as partial, not exhaustive partitions. The complete function lists have178/133
rows, empty filters and reconciled self totals, and are the count authority.

The laptop Mesa library is stripped; its GNU ID exactly matches the profile:
`198701d4b61dc1afd1949464114e27c1e90498a2`. Its matching .debug file is absent
on the laptop and desktop. No system package was installed or changed.

Ubuntu's official [debuginfod service](https://ubuntu.com/server/docs/how-to/debugging/about-debuginfod/)
was queried explicitly for that public build ID only. HEAD returned400; a bounded
GET returned200 and identified the exact Mesa debug package and69,365,760-byte
file, but HTTP/2 cancelled after680,149 bytes. One bounded HTTP/1.1 attempt ended
early after372,233 bytes. Both failures and partial files are preserved and were
not used as symbols. No further retry or limit increase. These were public
symbol-file requests, not profile uploads; no global network-isolation claim.

No saved browser-launch environment explicitly set XDG_CACHE_HOME or MESA_*
variables. This does not prove driver cache location, hit/miss state or sandbox
access; no personal cache was read or changed. Fresh browser/profile state must
not be casually equated to a cold Mesa disk cache.

## Verification And Cleanup

Artifacts: `artifacts/umbralink-control/cold-symbols/`; plan:
`bot-docs/plans/cold-worker-symbols.md`. Raw profile JSON was loaded only by
supported profiler-cli/Samply, never a custom profile parser. Existing raw profile
hashes were checked before each load. Code snapshots are post-analysis/formatted
sources, not a claim of independently recorded launch-time source hashes.

Failing-first contract checks1pass/1fail; assembly guard checks2pass/2fail before
correction. Final58focused tests PASS, including actual saved exports, clock,
worker, filtered/truncated lists, malformed counts and all six missing instruction
maps. Exact five-file Prettier check PASS. Results recompute byte-for-byte.
No full-repository lint, new native build or new browser parity test was needed.

Each named session uses its own private cache, explicit loopback Samply endpoint,
no-open flag and matching symbol directory. Samply has8GiB address-space and
256MiB file limits, core0 and two Rayon workers. Commands/work/watchdog/outer
bounds are recorded in the plan; observed lifetimes were4.96/4.91/6.64/6.88s.
All named daemons stopped and servers received owned SIGINT. Exact PIDs absent:
849819/849844,850521/850548,853639/853668,854529/854554. Named sockets and
listeners on37531/37532 are absent. Recompute repeats exact absence checks.
This is observed cleanup, not a universal OS-I/O cancellation guarantee.

The prior232-file seal verifies unchanged. Staged diff remains231628bytes,
SHA256 `3b78253cf775a4a1e8c69a4b82cc3958b366056129a391f4ae362bdfe8e4e0c4`.
No commit, stage, reset or unrelated change. All analysis commands are terminal.

## Next Action

Do not add a duplicate helper/program cache: the frozen code already has them.
Do not assume eager warmup eliminates work; it may merely move work earlier or
waste resources for videos never copied to canvas.

The smallest justified engine experiment is a private, gated first-use timing
split around helper buffer setup, vertex compile, fragment compile, link/status
and pixel readback, preserving defaults and exact pixels. Matching Mesa symbols
could still distinguish driver internals without a browser run when obtainable.
Keep cold first-copy latency separate from steady playback and recurring stutter.
No speculative shader, synchronization, fence, precision or filtering change is
justified by these profiles alone.
