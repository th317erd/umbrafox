# Packaged Render Loop And Sampling Audit

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Decision

The allocation-free label candidate does not increase the renderer's entry
stack reservation. Its helper remains out of line in the actual packaged
browser, not merely in the preceding synthetic benchmark. Neither observation
explains or dismisses the earlier 6.05% playback CPU increase. No further label
rewrite, installation, preference change or browser capture follows from this
audit. The GPU import experiment remains default OFF.

The increase is not confined to the browser process: the same saved comparison
also has higher content and decoder CPU rates. Keep the unfavorable result;
these small populations do not establish whether code generation, host/core
frequency, scheduling or another effect explains it.

The captured rare stall cannot supply per-round sampler overhead: that recording
did not enable the environment flag required both to record and stream it.
Before any new diagnostic solely for this question, establish a supported route
for exporting the overhead evidence. No raw-profile parser, profiler-tool change,
PHC disablement or guessed workaround was introduced.

## Actual Machine Code

Complete function ranges were decoded from the two preserved stripped packages
using LLVM objdump. The candidate ranges were independently decoded from the
unstripped object library. Their instruction bytes match exactly, and their
GNU build identities agree. The old renderer's complete instruction-address
list also matches the earlier supported profiler-cli assembly export.

| Static property | Baseline render_impl | Candidate render_impl | Candidate label helper |
| --- | ---: | ---: | ---: |
| Function bytes | 29211 | 28855 | 317 |
| Instructions | 5569 | 5504 | 76 |
| Call instructions | 397 | 394 | 6 |
| Stack-referencing instructions | 1616 | 1576 | 21 |
| Entry stack reservation, bytes | 1992 | 1992 | 136 |

These are static counts, not execution frequencies, latency or total stack
usage. Both renderer bodies also contain eight small eight-byte reservations.
Saved-register pushes are not included in the reservation column. The new
renderer plus helper bodies are only 39 bytes smaller than the old renderer;
this is not a total-library size or cache-efficiency result. Register and stack
slot assignments elsewhere change, so equal entry reservation does not prove
equal register pressure or code-generation cost.

The candidate renderer loads the helper through GOT address 0xde1e078 and calls
it at 0xbbb70a6. The stored pointer is exactly 0xbbaec10, the native symbol's
start_pass_marker address. The former call at 0xbba185c uses GOT 0xde15538,
whose stored target is 0xd6afcf0. The earlier supported symbolization identifies
that target as format_inner. These addresses describe only these binaries.
The candidate supported path still performs formatting and a UTF-8 check;
unsupported marker groups return before formatting. No zero-cost claim follows.

Both packages have toolkit BuildID 20261006175655, which is not a unique
binary identity. Their distinct native GNU identities and libxul hashes are:

- Baseline: GNU 88d9c3b44c2dcacd18aceac64340af1f;
  SHA256 cd8bf5baecb3d51a0de9b8c73f0db4e8faad4f2a0d92d846dda939ae7efa846f.
- Candidate: GNU 24ade56db38a1cfc2065b7b6dd496719;
  SHA256 371a173cf7995acf013553e576d801c5e732d9d280d17589ff63757cfc124330.

The selected candidate instruction hashes are
5d36d0c36c2daf421bf84fb7ad9f9361658c23c61e30a59c094fc91428d5b8fb
for render_impl and
73f4bd532e246ff195cd23e41ea826979cc3575f43776167abc10769af013781
for start_pass_marker. This establishes selected code equivalence, not equality
of the complete stripped and unstripped libraries.

## Saved CPU Comparison

The existing four-run analyzer was replayed without modifying its files; its
complete result deep-equals the saved comparison. Dividing each variant's
summed process CPU by its summed observation time gives:

| Process type | Baseline CPU seconds / second | Candidate | Change |
| --- | ---: | ---: | ---: |
| Browser | 0.39427 | 0.41816 | +6.06% |
| Web content | 0.11081 | 0.11815 | +6.63% |
| Remote decoder | 0.04021 | 0.04203 | +4.53% |

Only two processes per variant contribute to each type. This is the same
ABBA workload and identity intersection, not a new experiment or independent
replication. Host scheduling, hybrid-core placement and frequency were not
controlled. It does not prove a common external cause, and it does not clear
the candidate for release.

## Sampler Producer And Consumer

Nine relevant native source files match the recorded build HEAD and are absent
from both preserved dirty patches. Exact snapshots and hashes are retained.
The source chain is SamplerThread::Run in platform.cpp, Linux
SuspendAndSampleAndResumeThread, ProfileBuffer::CollectOverheadStats and
ProfileBuffer::StreamProfilerOverheadToJSON.

The parent sampler visits selected threads serially. Each thread gets its own
timestamp, rather than all sharing one round timestamp. Linux sampling sends
SIGPROF, waits for the target's suspension handshake, collects its stack, resumes
it and waits for completion. A late round skips catch-up and schedules the next
round from the new current time plus the interval. Consequently, simultaneous
sparse samples in several parent threads are not independent evidence of several
stalls. This mechanism permits correlated gaps; actual sampler delay during the
recorded renderer interval remains unmeasured.

PHC allocation stack capture precedes its mutex acquisition. On this Linux x86-64
path, MozStackWalk uses _Unwind_Backtrace. The one sampled allocation stack is
consistent with that code, but does not prove the allocator occupied the entire
interval, that the PHC mutex blocked, or that sampling caused the renderer stall.

CollectOverheadStats maintains runtime aggregate statistics, but emits per-round
buffer entries only with nonempty MOZ_PROFILER_RECORD_OVERHEADS. The JSON streamer
also returns immediately when that flag is absent. The hashed saved launch
environment does not contain it; the corresponding capture/helpers/run sources
match the recorded harness and pass that environment to the owned child.
The parent nsIProfiler.getBufferInfo interface exposes position, size and
generation, not the native aggregate overhead statistics.

Installed profiler-cli 0.10.0 has internal profile-processing references to
profilerOverhead. No supported overhead-export route was established from the
guide, schemas and source examined. Those internal references are not a public
query contract, nor is the absence of a found command universal proof that no
such route could exist. Reloading the current capture cannot recover overhead
entries that were never recorded.

## Verification And Boundaries

Evidence namespace: artifacts/umbralink-control/render-loop-audit/.
Seven strict Node test groups pass, covering contiguous complete instruction
ranges, truncated/unknown/malformed output, mismatched bytes, GNU identity,
little-endian GOT addressing, duplicate pointers and replay of the actual saved
function summaries. Invalid-output attempts are preserved, including initial
tab/comment parser failures and a package-manifest size-field mismatch.
The missing-module RED is scaffolding, not a production regression.

Source guards verify 63 product inputs, 146 harness inputs, HEAD, staged and
working patches, configuration, and all nine native source snapshots. No product
source, public interface, installed browser, profile, launcher, extension,
GPU default, Pi state or Git index changed. LLVM/readelf read files only;
there was no browser, profiler daemon or native probe execution in this phase.

The complete rare-stall capture, previous microbenchmarks and unfavorable
browser results remain immutable. Static code and sampler-source findings
narrow the next investigation; they are not a new performance fix. The next
useful offline step is broader existing-profile cost attribution before another
runtime experiment. The full rendering/layout/CSS/JavaScript goal remains open.
