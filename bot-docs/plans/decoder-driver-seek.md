# Private Driver Seeking Follow-Up

## Objective And Boundaries

Test seeking/recovery on the laptop's now-verified full-feature AV1 driver path,
not on the earlier software-fallback path. Previous goal turn made progress:
an owned RDD mapped the pinned private iHD library and native after-playback
reported AV1 hardware=true. The 20-second result did not show fewer dropped
frames and did not reproduce the desktop symptom.

Two sequential fresh owned runs, ui-forward-1080 then ui-backward-1080, using
the existing progress-bar input and 20-second baseline plus at least 130 seconds
after observed seeked. Run two only after run one passes cleanup and evidence
validation. No hidden retry. Preserve any failure and decide from its evidence.

No desktop/Pi intervention, system installation, browser source/default change,
sandbox weakening, extra profiler, codec forcing, extensions, login or ad skip.
No user profile/shared queue access. No agents. Driver package still differs in
distro revision from the installed free package; no one-source-change claim.

## Minimal Adapter

New namespace artifacts/umbralink-control/decoder-driver-seek. Reuse frozen
capture, YouTube entry, and streaming module with SHA-guarded generation and
AST import relocation. Reuse the already tested driver preparation and mapping
helper from the sealed decoder-driver-variant namespace without modification.

Only runtime differences from the existing unlogged 1080p seek captures:

- Add the same pinned 36102104-byte driver to the fresh installation, within
  exact extended package admission/postflight.
- Set child-only LIBVA_DRIVERS_PATH and record its path in provenance.
- After the existing final performance snapshot, obtain a bounded owned-RDD
  maps receipt. No added browser RPC, no new active-playback polling.
- Decoder logging OFF, profiler OFF, original public browser behavior and
  source workload remain unchanged. Native snapshots already exist at before,
  sparse-0/1/2 and after; retain all results, including fallback or transitions.

The maps receipt is point-in-time, not continuous proof or a decoder-instance
join. All five matching native hardware flags would establish sampled behavior,
not rule out transitions between them. Mapping read occurs after playback.

## Verification

Tests first for missing override, source drift, exact reversible deltas,
unchanged mode definitions, allowed CLI modes, exclusive generation and write
failure. Reuse 142 existing seek/quality tests and prior mapping tests. Bound
unit runs to 30 seconds; preserve RED and full final output. No browser until
source, package, runtime closure and host preflight are verified.

Each capture retains 240 seconds total, 225 seconds work, final 15 seconds
cleanup, final two seconds report; 185-second pre-sequence reserve, 64 RPC cap,
existing memory/disk/artifact/log caps. Driver bound 360 seconds, SSH 400 seconds.
No SIGKILL or cap relaxation. Prove all recorded PIDs absent, exact package and
runtime inputs unchanged, private native roots and selected document joins.

Saved-data review must check original seek/quality contracts, mapped driver
identity, all native receipts, page frame counters and per-second timeline.
Compare descriptive results to prior software-path captures; N=1 per direction,
fresh cache/startup/content scheduling and observer effects preclude a general
performance claim. Desktop codec/session/triggering pattern remains unmatched.
