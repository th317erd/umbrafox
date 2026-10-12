# Producer Fence Packaged Correctness

## Result

The [producer-fence candidate](2026-10-07-producer-fence-native.md) passes the
normal packaged-browser pixel and decoder-loss gates on wyatt-laptop. These are
four fresh headed browser runs, not the native-test overlay. All first attempts
pass; no capture was retried, excluded or replaced.

Both import modes match all 48 ordered pixel comparisons and four full RGBA
buffers against their immediate descriptor-borrow predecessors. Candidate ON
also matches candidate OFF; candidate OFF matches the saved full-size reference.
Both decoder-loss modes match all eight existing reference cases, including
exception names, preserved bitmap pixels and cold-readback unavailability.

This clears the first correctness part of P3, not performance acceptance.
No playback speed, fence-use frequency, automatic decoder/context recovery,
physical presentation or universal Firefox parity follows. The approximately
154 ms Renderer stall and prior failed smoothness screens remain unresolved.
Experimental GPU import remains default OFF. The daily desktop browser,
profile, installation and launcher were not touched.

## Frozen Inputs

Normal package: exports/umbrafox-producer-fence-20261007, Build20261007133500.
Manifest SHA256:
03dc06365cd39d215a69c25b32b7c06bd19f39073ce5fe0702170f33048f4463.
All 46 normal files match before launch and in every fresh installation's
postcheck. The separate 48-file gtest manifest rejects at package admission.
Both native runtime and adjacent INI identities are checked by the existing
capture. The earlier P2 native seal independently verifies unchanged afterward.

New scratch namespace: artifacts/umbralink-control/producer-fence-gpu/.
All 146 shared runtime inputs are unchanged; six new adapters make a 152-file
harness. Its SHA256 is
cfd104a8733bac36075d0e5e1ee7e2e79897d00b59da0d2b56b7e09caf8f234a.
All 32 static relative-import dependencies are pinned. Thirteen generated
adapters/replay files differ from frozen descriptor-borrow-gpu only by namespace,
date, candidate manifest and BuildID. Reverse-delta tests prove this equality.
Collectors, shaders, preferences, oracles, tolerances, bounds and cleanup are
unchanged. No product source, build, public API or default was changed here.

The guard verifies 94 source pins, the exact package, HEAD892431809a4caadb5c73b2c03ad9bdb124c3e21e
and staged-index SHA3b78253cf775a4a1e8c69a4b82cc3958b366056129a391f4ae362bdfe8e4e0c4.
Unrelated staged and working changes remain intact; no stage/commit/push.

## Runtime And Cleanup

Harness installation root:
/home/wyatt/.cache/codex/producer-fence-gpu-harness-20261007-TkTv3E.
Each capture copies the normal package into a separate owned installation and
creates private profile/application/local/temp roots. No owner profile, token,
application-data payload or shared crash queue was exported. Existing native
parent directory receipts join exact owned roots and PID.

| Arm | Browser / Controller PID | Capture ms | Public files |
| --- | --- | ---: | ---: |
| Pixels OFF | 2002639 / 2002627 | 16015 | 38 |
| Pixels ON | 2005161 / 2005149 | 16074 | 38 |
| Decoder loss OFF | 2007562 / 2007550 | 12842 | 47 |
| Decoder loss ON | 2009894 / 2009882 | 12752 | 48 |

Runs span 14:18:58 through 14:25:04 UTC on October 7. Each launch follows an
inspected successful preflight; commands returning nonzero do not authorize
the next launch. Preflights verify all package/harness hashes, no named browser
or compiler activity, and more than 4 GiB available RAM and disk. Captures are
serialized with more than 15 seconds between them and export/validation before
the next launch. No profiler, new native marker or timing comparison is used.

Budgets remain 120 seconds total, 105 seconds work and 15 seconds cleanup;
driver/SSH watchdogs remain 220/240 seconds. The 22 resource samples pass the
unchanged absolute/relative caps. Peak sampled artifact size is 66,392,821 bytes
under the 256 MiB cap. The 171 exported public files total 7,953,031 bytes and
are rehashed locally. Sampled process/resource evidence and post-startup native
directory receipts are not continuous filesystem, network or process isolation.

All four cleanups report clean owned SIGTERM and zero dropped log bytes.
Exports require absence of every collected PID; a final independent exact-PID
check records all 49 distinct browser/controller/observed child PIDs absent.
The postflight at 14:26:58 UTC re-verifies all 152 harness and 46 package files
and reports no named browser/build activity. Every transfer, browser and SSH
command reached a terminal result.

Graphics match Intel Iris Xe RPL-P, Mesa/iris25.2.8, X11 and WebRender.
At nonzero seeks the native decoder reports hardware-accelerated ffmpeg/RDD
H.264. Those receipts do not certify every individual import or fence operation.
The loss tests shut down only the exact owned RDD. Both observe a single-thread
zombie before final reaping, then verify unavailable cold readback. Retained
video draws match InvalidStateError and reference pixels; the already-copied
bitmap remains readable. This is permanent shutdown, not automatic recovery.

Logs retain the known namespace EPERM warning and successful VA-API iHD
initialization. Each intentional decoder shutdown records VideoBridge IPC
AbnormalShutdown. No warning-free process claim is made.

## Verification

- Old admission rejects the new manifest in the initial failing-first test.
  This is adapter evolution, not a production defect or failed browser run.
- Before launch, 113 focused tests pass. The final combined gate passes 121
  tests, zero failures/skips, including ten new-adapter/saved-evidence groups.
- Tests cover invalid package/host/display, wrong native overlay, exact reverse
  adapter changes, pixel corruption, ownership/termination, baseline/sample
  joins, caps, private roots, serialized run chronology and cleanup. All saved
  comparisons reproduce, including the immediate predecessor in both modes.
- New hand-written scratch modules pass the installed Prettier check. Generated
  adapters retain their original formatting for exact source equivalence.
- Report codespell, file-whitespace and trojan-source checks report zero
  problems. Scratch formatting is not a claim of registered product lint.
- Package/source/index guards and the prior P2 seal verify unchanged after
  execution. No broad native suite was rerun because product bytes did not
  change; the earlier 61 hardware and 461 tooling passes remain separate.

Replay without a browser:

```sh
timeout 30 node --test --unhandled-rejections=strict artifacts/umbralink-control/producer-fence-gpu/test/*-spec.mjs
timeout 30 node artifacts/umbralink-control/producer-fence-gpu/prepare.mjs verify
timeout 30 node artifacts/umbralink-control/producer-fence-gpu/seal.mjs
```

Generators/export/unpack/summary/postcheck commands use exclusive writes; do not
rerun them over the sealed evidence. The seal is
artifacts/umbralink-control/producer-fence-gpu-final.sha256.

## Next Gate

Construct an otherwise-matched baseline/candidate pair before timing. The new
package includes the already-tested Attachments metadata optimization; the old
descriptor-borrow package does not. An unqualified old/new timing comparison
would mix that change with the fence. Preserve correct native/INI identities,
record generated BuildID differences, and do not splice old libxul into a new
package with contradictory metadata. Keep import ON in both performance arms,
the fixed 48-second 1/4/4/1-copy workload, no profiler, old/old noise control and
predeclared minimum CPU benefit plus unchanged callback-gap/drop/pixel gates.
No daily promotion or relaxation of previous smoothness failures is authorized.
