# Ordered Import Pixel Comparison

## Why This Gate

The original fresh-canvas repeat-stability gate remains failed and unchanged.
Four OFF diagnostics reproduced the same output pattern, including fresh
raw-RGBA VideoFrames with byte-identical source inputs. The candidate's frozen
DrawImage source excludes filters/shadows from direct import, but shared GPU
state still prevents assuming a filter result is unaffected by other draws.

This separate experiment compares complete ordered output sequences across
fresh browser runs. It is not a tolerance, replacement of the old gate or
installation approval. Relative OFF/ON equivalence can be tested even while
within-run repeat stability remains false. Every case/repeat ordinal must
match exactly across arms; no pixels or cases are omitted or normalized away.

## Contract

Reuse the unchanged twelve-case collector, parent/child transport, native
observer, 0.5/2-second paused targets and filter raw buffers. Validate every
schema/media/document/preference/provider/byte/hash field. Report within-pair
changes rather than labeling them stable. Require different primary hashes at
the two video times. The cross-run oracle requires all 48 hashes to match.

Use new ordered-pixels validator/capture/driver siblings, preserving every
old sealed file. The capture/driver plumbing stays equivalent to the previous
pixel capture except its validator, diagnostic classification and output root.
The validator never returns general pixel-parity or timing acceptance.

First run two OFF captures on the same pinned BuildID20261006023500 package.
Only an exact complete OFF/OFF comparison admits one isolated ON capture.
Any ON mismatch stops that arm and preserves all evidence; no repeat-until-pass.
No native edits, default changes, desktop interaction, install or timing run.
Source default and parent/content receipts remain explicit false/true per arm.

## Proof And Bounds

Fail-first tests cover differing repeat hashes with exact cross-run agreement,
single-ordinal mismatch, swapped/missing cases, wrong time/document/pref,
malformed fields, raw filter hash mismatch, unchanged video frame, async/RPC/
write/abort failure, raw-before-validation and exact capture ordering. Reuse
existing transport/page fault tests. Combined Node limit30s; formatting60s.

Fresh isolated package/profile/app-data/local-app-data/temp roots only. The
existing native-root receipts, resource caps, 120s capture/15s cleanup,
220s controller and240s SSH bounds remain. Hash-admit harness and46package
files before each run; verify package afterward and all recorded PIDs absent.
Export named evidence only, not profile/token files. Preserve the staged index.

Success here establishes only ordered same-candidate OFF/ON pixel agreement
for the observed formats/cases. Actual import execution, stock Firefox parity,
within-run stability, context loss, low-level failure propagation and moving
performance remain separate requirements before default enablement/dogfood.

## Completed Diagnostic

Two OFF captures match all 48 hashes; the one admitted ON capture differs at
18 positions against both baselines. Relative acceptance FAILS. No repeat ON,
timing run, native change, default enable or installation followed. The original
within-run repeat failure is unchanged; this separate experiment is complete.

The final focused suite passes 69 tests, including saved-evidence replay.
All three captures cleaned up; all 36 recorded PIDs were absent at export.
Results, source hypothesis, retained limitations and the formatting-evidence
correction are in
`bot-docs/reports/performance/2026-10-06-ordered-import-pixels.md`.
Further performance work requires a new scoped step, not relaxed pixel gates.
