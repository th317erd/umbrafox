# Audio Path Admission

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Purpose

The October 7 muted startup and seek tests do not establish coverage of normal
audio-stream playback. First prove an audio sink is present and progressing in
an isolated laptop test. Do not infer that audio causes Wyatt's prolonged
post-seek stutter or that short startup drops reproduce it.

This is a narrow continuation of the authorized performance investigation,
not a native change, new browser API, driver installation, or desktop action.
Preserve all earlier sealed evidence and the dirty/staged source tree.

## Evidence And Contract

New tooling belongs in artifacts/umbralink-control/audio-clock-admission.
Pin source to deployed Build20261006175655, base892431809a4caadb5c73b2c03ad9bdb124c3e21e
plus the frozen descriptor-borrow package patch, not the current dirty tree.
Existing private mozRequestDebugInfo diagnostics are the only native input.
Their privilege guard is HasDebuggerOrTabsPrivilege, not a new public API.

Allowlist only document identity, ordinary element playback state, native
hasAudio, audio wrapper state, output rate, written frames, audio position,
error/completion state, and media/clock times. Omit pointers, source URLs,
EME information, session strings, devices and unrelated fields. Default-zero
sink dictionaries cannot establish absence. The sink's isStarted field is not
populated by its native producer and must not be an admission criterion.

Two same-document, non-seeking, non-muted, nonzero-volume observations with
positive output rate/written frames and advancing lastGoodPosition establish
an observed progressing audio sink, not continuous use of that clock. Require
the same startTime/outputRate across the pair; a transition is inconclusive.
The private clock-source enum is not exported: report it as unobserved.
Queries call GetClock and may affect handoff/queue state. They are not passive
or zero-overhead observations, and must not be added to historical comparisons.

## Phases

1. Source audit and typed projection/collector tests. Bound a query to3s using
   the caller's abort signal; retain and observe a late rejecting promise.
   Revalidate exact document and video identity after the native query. No
   element mutation, browser process, IPC bridge or network in this phase.
2. Integrate through the existing private frame bridge and owned capture
   lifecycle. Preserve120s total/105s work/15s cleanup, resource/artifact caps,
   private installation/profile/app-data/local-data/temp, no profiler and exact
   process ownership. Test the complete request/write/cleanup failure ledger,
   privilege/document/PID joins, serialized import closure and source pins.
   No driver exists until these gates are implemented and pass.
3. One prospective laptop audio-on admission, same package/private iHD/public
   fixture. Only the owned media element gets nonzero low volume; never change
   host audio, a user's tab, default preferences, codec or audio backend.
   Record actual muted/volume state before/after both queries, about one second
   apart. Stop on missing sink, identity change, timeout or failed cleanup;
   do not retry until evidence explains the failed gate. This is path admission,
   not a muted/unmuted performance comparison or proof of audible output.
4. Only after phase3, define a matched post-seek experiment with audio path
   coverage and a separate observer control. Do not repeat the earlier ABBA
   sequence or edit its sealed conclusions. A new seek plan must retain the
   distinction between a native sink observation and the unexposed clock enum.

## Verification

Write tests before implementation: valid projection and no sensitive-field
escape; default/missing/NaN/unsafe fields; muted/zero-volume/paused/seeking,
error/drain, changed anchor/rate/document; stalled/regressing position; timeout,
abort-before/during, late reject/resolve, navigation/element replacement and
timer cleanup. Small Node tests have10s outer and1s per-test watchdogs.
Saved prior evidence must remain hash-identical. No tests claim native-runtime
or device audibility proof. Record failures and limitations in the report.

## Status

Phase1 complete at2026-10-08T01:38UTC:12 frozen source files and5 mute-setting
fixtures pinned;18 strict Node tests PASS,3 JS format checks PASS, source proof
replays exactly. Prior102 sealed evidence files and53 runtime inputs unchanged.
Report: docs/umbrafox/archive/reports/performance/2026-10-07-audio-clock-coverage.md.
No new browser run or runtime driver. Phases2-4 pending. The phase2 bridge must
retain the same video across both reads and join owned PID/context/document;
individual collector identity checks alone do not establish that pair identity.
Already-started native queries may remain pending after timeout/abort. This is
bounded waiting and late-result rejection, not native cancellation or a hard
real-time deadline when the JavaScript event loop itself is blocked.
The broader rendering/layout/CSS/JavaScript performance objective remains open.
