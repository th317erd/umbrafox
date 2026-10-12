# Cold Worker Local Symbols

Continue the approved cold-worker diagnostic using its saved baseline/candidate
profiles only. The preceding status turn revalidated the seal but produced no
new performance evidence. Next action: exact matching native symbolication.
No browser, build, install, native source, public-interface or index changes.

Reuse the existing bounded Samply + named profiler-cli loopback workflow and
sealed workerCoverage/validateWorkerSamples. Raw profiles are only loaded by
these supported tools. Verify profile and packaged libxul hashes before load;
retain symbol-server build-ID/path evidence. Never substitute current objdir
or assumed matching system libraries. Fresh private cache and explicit local
endpoint, no browser UI or external symbol-server defaults requested. This is
not a network sandbox proof.

Each analysis has 150s work, 180s owned-server watchdog, 210s outer bound;
commands <=30s except load <=60s, cleanup <=15s CLI +5s server/absence.
Samply 8GiB address space, 256MiB file limit, core0, two Rayon workers.
Retain synchronous child ownership, stop the named CLI in finally, SIGINT the
owned server and verify exact PID/socket absence. No kill-all or SIGKILL.

Export fresh phases/readbacks/roster and reconstruct exact six scopes and first
worker identity. Verify against prior scalar scope/clock/PID/TID/sample evidence,
not unstable marker handles. Obtain complete first-window function list, tree,
samples and supported function-info library identities. Reconcile self counts;
reject filtered/truncated/mismatched exports. Pure positive and corruption tests
precede implementation. Preserve original exports and all failed attempts.

First baseline then candidate after successful identity/sample gate and cleanup.
Interpret named inclusive stacks without adding overlapping counts or treating
sampled waits as CPU. Missing system symbols remain unknown. Use frozen package
source for any optimization inference. Report the smallest justified next action.

First local loads succeeded: helper construction and program creation dominate
the named readback-stage samples in both captures. One further offline load per
saved capture may export supported assembly annotations for exactly constructor,
CreateDrawBlitProg and ReadPixelsIntoBuffer, with the loopback symbol-server
explicit on each annotation request. Keep all first-pass exports unchanged.

Outcome: four offline loads complete and clean. Named native first-window
counts resolve; exact instruction attribution remains inconclusive (six zero
instruction maps despite nonzero function totals). Complete function lists
reconcile, top-down trees do not. Matching Mesa public-symbol downloads failed
twice and are preserved unused.58focused tests and five-file format pass.
No browser/build/native edit. Report:
bot-docs/reports/performance/2026-10-05-cold-worker-symbols.md.
