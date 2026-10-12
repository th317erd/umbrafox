# Producer Fence Matched Playback

## Purpose And Authority

Continue P3 of [local producer fence](local-producer-fence.md), not replace the
broader rendering/layout/CSS/JavaScript objective. Native and packaged pixel/loss
gates have passed; the fence's performance benefit remains unmeasured.
The daily browser, profile, launcher and installation remain protected.
No product changes, native rebuild, public API, default preference, shader or
pixel-tolerance changes are part of this phase. Existing laptop diagnostic
permission covers later bounded owned runs, not deployment.

The two frozen normal packages are descriptor-borrow Build20261006175655 and
producer-fence Build20261007133500. Their direct comparison is confounded by
the candidate's Attachments metadata optimization. Preserve each arm's native
library, executable aliases, application.ini, platform.ini and AppConstants
BuildID; never put the old library underneath new build metadata.

## Matched Pair Contract

Create new owned copies in ~/.cache/codex, using the existing mozpack archive
reader/writer in request-artifact.py. Rewrite both root archives through that
same helper, substituting the exact candidate Attachments payload into both.
Do not modify originals or rewrite browser/omni.ja. Preserve archive entry
order, compression, permissions, optimization and preload endpoint. An output
directory must be new and canonical; preserve partial failures without retry
or cleanup over the evidence. Publish pair.json only after all checks pass.

Verify the following before and after construction:

- Both input manifests and complete 46-file trees, current 94 source pins,
  unchanged HEAD and staged patch, config and frozen source artifacts.
- The tracked patch delta contains only four native fence files, the native
  test registration, attachment source/test and performance documentation.
  The 20 old supplemental inputs are unchanged; three new fence tests are the
  only additions. This is source provenance, not a reproducible compiler proof.
- Original package file differences are exactly the two INIs, libxul.so,
  executable aliases and root omni.ja. Browser archive payloads are unchanged.
- Both launchers have identical section tables and entire file bytes after
  normalizing only the recorded BuildID string and GNU build-note digest.
  Do not treat a native-library byte difference as proof of only one function.
- Both native toolkit notes and INIs agree with their own recorded BuildID.
- Each output differs from its input only at root omni.ja. Across outputs the
  only root-archive payload difference is the generated AppConstants BuildID.
  Attachments is byte-identical; all other native differences remain recorded.

New tools/tests/evidence live in artifacts/umbralink-control/producer-fence-pair/.
The builder emits a versioned pair proof and separate per-arm package-input.json
files, without claiming an original archive hash for a rewritten package.
The original archive receipt stays under source provenance instead.
Consumers must use these new hashes and per-arm IDs, not the old single-ID
playback adapters. No browser may launch from an unverified partial pair.

## Falsification And Build Gate

First retain the real old/new attachment inequality as a failing matching
assertion. This is an experiment-design RED, not a newly discovered product bug.
Then test small real mozpack archives and synthetic ELF section projections:
exact replacement, both-arm rewrite, immutable originals, native preservation,
unexpected files/payloads/order/modes/compression, stale hashes, aliases, malformed
archives, invalid BuildIDs, code changes outside allowed bytes, and copy/write
failure without a success receipt. Existing archive tests stay unchanged.

Use the existing build venv; no dependency installation is required:

```sh
timeout 30 /home/wyatt/.mozbuild/srcdirs/umbrafox-a0680b76db69/_virtualenvs/build/bin/python artifacts/umbralink-control/producer-fence-pair/test/pair-spec.py
timeout 30 /home/wyatt/.mozbuild/srcdirs/umbrafox-a0680b76db69/_virtualenvs/build/bin/python artifacts/umbralink-control/test/request-artifact-spec.py
timeout 180 /home/wyatt/.mozbuild/srcdirs/umbrafox-a0680b76db69/_virtualenvs/build/bin/python artifacts/umbralink-control/producer-fence-pair/pair.py build
timeout 180 /home/wyatt/.mozbuild/srcdirs/umbrafox-a0680b76db69/_virtualenvs/build/bin/python artifacts/umbralink-control/producer-fence-pair/pair.py verify ABSOLUTE_PAIR_ROOT
```

Capture full output in new logs. The 180-second bound allows copying and hashing
approximately one GiB plus archive validation, not browser execution. Check exit
codes explicitly. A command returning nonzero must not admit its successor.

## Prospective Runtime Protocol

Runtime remains pending until the pair and adapted admission/evidence tests pass.
First repeat the existing import-ON pixel gate on the matched baseline; the new
candidate's previous pixel/loss results remain separate saved evidence. Record
any repack differences and require runtime/INI native identity consistency.

Preserve the existing 48-second owned H.264 video-to-canvas workload, four
12-second phases with 1/4/4/1 copies, import ON in both arms and profiler OFF.
No new per-frame observer. Fresh private installation/profile/application/local/
temp roots per run; hash preflight, no competing browser/build, at least 4 GiB
available RAM/disk, 15-second settle, existing 120/220/240-second capture/driver/
SSH limits, original resource/evidence caps and exact-owned SIGTERM cleanup.
Inspect preflight exit zero, not merely a returned tool object.

Before comparative timing, run two independent baseline controls, N1/N2. Define
noise as max(CPU-rate)/min(CPU-rate)-1. If noise exceeds 3%, stop as inconclusive;
do not run extra controls to select quieter data. Otherwise fix the minimum
CPU benefit to max(2%, 2*noise). This conservative engineering screen is not a
confidence interval or population-wide statistical inference.

Then run A1/B1/B2/A2, without favorable-result retries or discarded runs. Require
each B CPU rate to be at least that fixed benefit below the better A rate, and
all 29 existing descriptor-borrow playback regression criteria to pass unchanged.
Retain failures, resource censoring, gaps and drops. Rehash/export only public
evidence and verify all recorded owned PIDs absent. A passing synthetic screen
does not resolve the earlier import smoothness failures or rare 154 ms stall,
nor authorize daily promotion.

## Progress

- Native and original candidate pixel/loss correctness: complete, prior reports.
- Matched input audit, constructor and real package verification: complete.
  Twelve constructor/verifier groups and nine existing archive groups pass;
  an independent stdlib ZIP readback agrees. See the
  [matched-pair report](../reports/performance/2026-10-07-producer-fence-pair.md).
- Runtime adapters, matched baseline pixel gate and timing: not started.
- No staging, commit, push or installation in this diagnostic phase.
