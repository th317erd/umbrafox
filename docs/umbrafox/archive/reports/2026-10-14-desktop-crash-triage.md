# October 14 Desktop Crash Triage

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

Status: recent exits confirmed; their cause is not established.

Wyatt reported random hard crashes of the latest nightly. This investigation
read process identity, crash metadata and journals only. No browser was closed,
restarted, driven or modified. No profile settings, launcher, system settings,
queued reports or dumps were changed. No dump was extracted or uploaded.

## Actual Running Installation

At approximately 15:09 Arizona time, parent PID3651740, started15:05:30, ran
`~/Programs/umbrafox-20261001-103920-158.0a1/umbrafox`. Its mapped `libxul.so`
was also in that installation. Both adjacent INIs report Build20261001103920,
version158.0a1. This is not today's installed fixed nightly, whose application
INI reports Build20261014043800, version160.0a1. No live runtime BuildID RPC was
issued; these are native path and adjacent metadata observations.

The desktop entry invokes `~/Programs/umbrafox`. The actual launcher assigns
dated installations priority3, nightly staging priority2, and `umbrafox-nightly`
priority1, then selects the largest entry. Consequently its latest selection
does not mean newest build time across all installation types. The previously
prepared nightly/profile switch has not been applied by this lane.

The current process has files open under the established
`cjmrhtcu.default-default-2` profile. Standard output and error both point to
`/dev/null`, so this launch does not retain browser console diagnostics.

## Recent Exit Evidence

User-systemd records two gtk-launch scope exits on October14:

- 14:32:27: previous scope had run18h54m, with10GiB peak memory and5.8GiB peak swap.
- 15:05:18: next scope had run32m32s, with6.2GiB peak memory and842.8MiB peak swap.

Subsequent launches occurred14:32:45 and15:05:30. These scope accounting records
do not give the browser's exit status or signal and do not themselves distinguish
a crash, external termination, or normal close. Owner confirmation of the
matching incident times and whether Crash Reporter appeared was requested.

The accessible kernel/system journals searched for October14 show no OOM-kill,
segfault or GPU-reset entry explaining these exits. Absence of such entries is
not a complete exclusion of resource pressure, driver trouble or external signals.
The scope memory peaks are not evidence of an OOM kill.

Systemd's coredump inventory since October13 has no Umbrafox entry. Firefox can
handle faults through its own minidump system, so that result alone is insufficient.
The normal application-data pending/event paths and current/previous profile
minidump paths contain no new dump for today's incidents. The current profile's
`crashes/store.json.mozlz4`, modified15:06:29, was decoded locally using the
installed LZ4 library with bounded input/output and only diagnostic record fields
printed. It contains eight main-crash records, newest October5, and a null
corruptDate. No recent registered crash was found there either.

The active installation's application.ini has Crash Reporter enabled, and the
current parent has unlimited core-file limits. An allowlisted startup-environment
check found no crash-reporter disabling/reporting override, relocated app-data
override or MOZ_LOG_FILE. These observations do not establish why no recent
dump or console log was retained.

## Older Confirmed Failure, Not Today's Diagnosis

Pending report `7f328388-20f2-8e64-9726-a66d7d96a00a` is from October5,
Build20261001103920. Its annotation reports an AsyncShutdown timeout during
`profile-change-teardown`: one pending ServiceWorkerShutdownBlocker promise,
state `content process main thread`. This repeats the mechanism of the older
September17-build failure documented in `2026-10-01-shutdown-crash.md`.

The October5 report does not establish the cause of random mid-session exits on
October14. No new code fix, audio-regression attribution, extension attribution,
or claim that the current nightly fixes these exits follows from it.

## Next Useful Evidence

Confirm the incident timestamps and visible symptoms. At an owner-approved next
launch, retain bounded private stdout/stderr and parent exit status while keeping
the same verified profile, and recheck for a new crash annotation immediately
after recurrence. Attaching a debugger or restarting the work browser requires
separate consent. The desired nightly selection/profile correction is also a
separate action, not something this read-only triage silently performs.

The isolated ARM build continued under its existing resource limits throughout.
No Pi activity was performed, and its package acceptance must not be described
as proof that these desktop exits are fixed.
