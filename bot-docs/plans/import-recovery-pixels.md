# Corrected Import Pixel Verification

Continue the authorized performance campaign using the corrected package from
`import-playback-candidate.md`. The preceding turn made progress: R2 integrity
and embedded BuildID passed, all temporary source changes were restored, and
the diagnostic export was sealed. No runtime acceptance transfers automatically.

## Fixed Contract

Use BuildID `20261006070020` from
`exports/umbrafox-import-recovery-20261006-r2/`, manifest SHA256
`21178496e1612b579e18b6234bff4a052bbe229cb7c861872c713e11cb89c99f`.
Create new admission, driver, preflight and export siblings; reuse the existing
linear pixel collector, workload, validators and cleanup without changes.
Allow only literal OFF/ON modes on wyatt-laptop DISPLAY :0. Preserve old inputs.

Write admission tests first against the old fixed-package implementation;
preserve behavioral rejection. Cover wrong package/host/display/mode and empty,
changed or malformed evidence. Check AST equivalence of the new driver/support
scripts after only the enumerated package and namespace substitutions.

Verify the sealed previous package, frozen runtime dependencies and native/index
state. Transfer a bounded, hashed harness plus the verified self-contained
package to a fresh private laptop cache directory. Require no detected browser
or build activity, four GiB available memory/disk, and real package admission
before each run. Do not stop another process to make this gate pass.

Run exactly one OFF and one ON capture, stopping on failure rather than blindly
retrying. Existing capture120s/cleanup15s, controller220s/SSH240s and byte/resource
limits remain unchanged. Use private installation/profile/app-data/local-data/
temp roots and UmbraLink only; no profiler, desktop browser or daily install.

Require terminal reports, native build/root receipts, exact installation
postchecks and absence of all recorded owned PIDs. Export only bounded existing
diagnostic file types, excluding profiles and authentication. Independently
compare all 48 ordered hashes and all four retained linear buffers; require
stable repeats, no tolerance, no missing cases and negative replay checks.

## Acceptance Limits

This verifies only the measured paused-frame matrix. It does not prove all
Firefox pixels, per-draw GPU import, successful device-loss recovery, sustained
smoothness or YouTube performance. After this gate, prioritize alternating
sustained playback rather than another redundant paused-only matrix.
No production source, public interface, default, staged index or launcher edit.

## Outcome

One OFF and one ON run completed with clean owned shutdown and all 24 recorded
PIDs absent. All 48 hashes and four retained linear buffers match exactly;
repeats are stable. The 26 focused tests pass. No runtime retry, default change
or daily installation. Report:
`bot-docs/reports/performance/2026-10-06-import-recovery-pixels.md`.
Sustained performance remains the next separate gate.
