# Playback Measurement Admission Repair

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Finding And Change

Preparing the video comparison exposed a diagnostic correctness bug, not a
browser slowdown: `summarizePlaybackInterval` could accept missing document or
source identity, and CPU subtraction could coerce `null` or string counters
into plausible percentages. Duplicate PID records were also silently joined
to the first match. These inputs must not support performance conclusions.

The change is limited to `capture-playback.mjs` and its spec:

- Playback intervals require a positive safe-integer document identity, finite
  nonnegative media timestamps and a valid SHA256 source-identity string.
- CPU counters require positive safe-integer PIDs, explicit nullable or
  nonnegative safe-integer child IDs, stable process type and nonnegative
  safe-integer nanosecond counters.
- Duplicate PID records at either endpoint, identity/type changes, counter
  resets, invalid process clocks and nonfinite computed percentages produce
  unknown CPU usage (`null`), without discarding otherwise valid media data.
- Explicit zero CPU and multicore values above 100% remain valid. Explicit
  nullable child IDs remain supported, matching the diagnostics producer.
- One index per endpoint replaces repeated linear PID searches. This is a tool
  implementation change, not a measured browser speedup.

The browser-side read body, RPC schedule, URL hashing, capture limits and output
shape for valid data are unchanged. No product/native code, public web surface,
preference, launcher, installed build or owner-browser state changed. The
mandatory Firefox-parity rule is unaffected by this diagnostic-only correction.

## Verification

Failing-first tests reproduce two failures: 22 pass / 2 fail before the change,
then all 24 focused tests pass. Tests cover malformed/missing identities,
coercible/negative/unsafe counters, duplicate joins, type changes, invalid
clocks, zero CPU and multicore CPU. Existing transport, abort, save, malformed
envelope and process-tree-cap tests remain green.

The final combined performance/control suite passes 306 tests in 9.222 seconds.
Exact two-file ESLint/license/whitespace/trojan checks have zero problems.
Initial lint failures and the pre-edit source archive are retained. The actual
delta was reviewed against that archive because ordinary Git diff omits these
untracked files. Existing staged work is not altered.

One authorized headless laptop smoke used the existing isolated capture driver
and the unchanged 97,465-byte, four-second 320x240 VP9 test asset, SHA256
`10f28950d0eb80065e7547a8635c16bca7a11ecad207086fa58d6176d7fb5440`.
Only this owned fixture was started playing. It used baseline A from the sealed
native pair, with userland inactive and profiler OFF before/after.

The actual interval spans 2015.422057 ms, advances 1.983548 media seconds,
and records 60 total-frame increments with zero dropped-frame increments.
Both endpoint ready states are 4. The 11 process records include valid zero and
nonzero CPU deltas. These numbers verify sampler integration only, not sustained
smoothness, GPU routing, physical presentation, streaming, YouTube or a speedup.

Offline replay exactly reproduces the saved summary. Extracting only the two
original pure summary functions from the pre-edit archive also reproduces the
entire valid native result; malformed-counter replays now return unknown CPU.
No raw Firefox profile parsing, profiler or new browser API is involved.

## Containment And Evidence

Runtime was October 4 UTC, 01:11:11.686 to 01:11:25.103, October 3 in Phoenix.
Native BuildID `20261003071500`, actual owned application-data paths, document
and context receipts passed. All five resource observations pass unchanged
caps; maximum sampled artifact size is 153598347 bytes. This is not a continuous
peak or network/filesystem sandbox proof.

Owned SIGTERM cleanup is clean with zero log drops. The 182-byte log retains
EPERM user-namespace, headless and SWGL framebuffer warnings. Exact browser
PID 613901 and controller PID 613887 are absent at the independent audit time,
01:12:13.237 UTC; this is not exhaustive descendant coverage. No owned capture,
test, lint or transfer remains active at this checkpoint.

- Local export: `~/.cache/codex/playback-admission-evidence-20261003-3JypVi`:
  30 whitelisted files, 136021 bytes, plus `evidence.sha256`.
- Laptop capture: `~/.cache/codex/playback-admission-20261003-3JypVi`.
- Laptop harness: `~/.cache/codex/playback-admission-harness-20261003-TzaHwE`.
- Source bundle: 34 file hashes verified before/after, locally and remotely.
- Archive, source diff, failing/passing tests, lint, runtime/audit and replay:
  `artifacts/umbralink-control/playback-admission-*` and its replay spec.
- Final seal: `artifacts/umbralink-control/playback-admission-final.sha256`.

Exports omit profile trees, discovery tokens and application-data contents.
Authentication used only the owned test process's discovery file. No personal
profile or shared crash queue was inspected by the harness.

## Remaining Work

This repair does not complete the planned sustained-playback fixture. The
four-second clip is only an integration smoke, not a replacement for a pinned
longer media interval. Next prepare the longer fixed-media comparison, retain
minimal-observer controls, then perform matched headed backend/pixel admission
and playback only after the owner's window permission. Do not enable a GPU
candidate or install the inline candidate from these results.
