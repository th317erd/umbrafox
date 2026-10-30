# Same-Build Import Pixel Gate

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

Continue `fullsize-reference.md` without changing its frozen artifacts. Its
full-size OFF capture matches the old import ON arm except software readback.
Test import ON in the exact same reference package to remove residual V2 and
cross-build differences. This advances the hardware-acceleration goal without
weakening Firefox pixel-parity requirements.

## Fixed Inputs And Scope

Use reference BuildID `20261006052600`, manifest
`350dd9dbacb579380ed57d84f9fb3d35e5b8b0514b07725baddc51d10bd22814`,
and the unchanged `linear-pixels-capture.mjs` collector/capture dependencies.
The comparator is the saved `fullsize-reference/off-2` capture. Do not pool
the old V2 OFF or import ON evidence into a same-build claim.

Only new admission/driver/preflight/export/test siblings, evidence and docs may
be written. New admission is ON-only, fixed laptop/DISPLAY and manifest hash.
No native edits, build, default change, installation in Programs, public API,
daily profile, desktop browser, agents, staging or commit. The existing object
directory still contains reference binaries despite restored source.

## Verification

Write the ON-admission regression first against the frozen OFF admission;
preserve its expected rejection. Cover wrong host/display/mode, empty/malformed
or changed manifest and source-operation equivalence. Keep old tests unchanged.
Prove the new driver differs only in admission import/output root, and support
scripts only in exact namespace and additional private package-root checks.

Before runtime, verify prior seal, all harness/package files, actual installation
admission (including owner-private root), no detected laptop browser/build, and
at least 4 GiB available memory/disk. Use a fresh owned installation/profile/
application-data/local-application-data/temp root. Existing capture120s/cleanup15s,
controller220s/SSH240s and evidence/resource caps remain. No live profiling.

After the one ON capture, require terminal report, exact build/root receipt,
46-file installation postcheck, bounded export excluding profiles/tokens, and
all recorded owned PIDs absent. Independently revalidate all 12 cases x 2 repeats
x 2 paused frames. Require stable repeats, strict ordered OFF/ON hash equality,
and byte equality of all retained linear buffers. Preserve any failure; no
tolerance, dropped cases or blind retries.

Run bounded focused/replay tests and exact formatting/docs lint, verify old
native/index and sealed evidence unchanged, and record a frozen report. One
same-build match is scoped pixel evidence, not complete stock Firefox parity,
native branch proof, import failure/context-loss safety, or performance proof.
Further progress should target those native safety gates and alternating
sustained moving-video runs, not more redundant paused-pixel measurements.

## Progress

The one ON capture completed with clean owned cleanup. All 48 ordered hashes
and four retained linear RGBA buffers match the frozen same-package OFF run;
all repeats are stable. Final 68 focused tests passed including saved replay
and corruption rejection. Native failure/context-loss and sustained moving
performance remain separate next gates; no default or installation change.
