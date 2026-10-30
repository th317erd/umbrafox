# Current Startup And Image Progress

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Result

Offline analysis of the already admitted current-package recording separates
three observations that must not be treated as one bottleneck:

1. The parent main thread performs substantial Remote Settings and security-data
   work later in the recording, but is idle in 399 of 400 samples during the first
   two playback seconds containing the four short callback gaps.
2. Three 51 ms callback gaps contain ordinary refresh ticks without intervening
   video callbacks. The fourth, 53 ms gap, includes a delayed refresh catch-up
   whose layout/style tick lasts about 2.14 ms, not the entire gap.
3. The recorded compositor image stream continues selecting changing frames
   through all four gaps. Across its full recorded population, its longest
   inter-selection interval is 25.857 ms and its longest interval between frame
   changes is 42.989 ms. No interval between recorded frame changes exceeds 50 ms.

The third observation is not a certified same-document or physical-presentation
join: the compositor Text markers lack a document, layer or native-instance ID.
Producer ID 1 is the observed changing population, not a globally unique video
identity. It is consistent with the single-video fixture, but that inference is
not promoted to proof. The evidence does rule against treating page callback
spacing alone as a measurement of complete compositor inactivity.

No browser or playback was launched in this phase. No product source, preference,
default, installed package, owner profile, launcher or public interface changed.
This is not a YouTube fix or performance acceptance. The earlier 146 ms callback
gap, four compositor-counted drops and separate approximately 154 ms Renderer
stall remain unresolved. The failed 27/29 and 28/29 comparisons remain failed.

## Exact Recording And Clocks

Input is the sealed `current-compositor-r2/profiled/run/profile.json.gz`,
11290955 bytes, SHA256
`335206038875249534a47c0e344665291dc5949c45d6847d76390c7169debbbe`.
The [capture report](2026-10-07-current-compositor.md) retains the surrounding
unprofiled controls and their approximately 27% profiler CPU overhead. That
overhead still limits causal and unprofiled-performance conclusions here.

The exact normal descriptor-borrow package is Build20261006175655, manifest
`1de58db614be934fb7fe71fc46ea168ce9777a8b46e340d3f429090b4e3e6773`.
Its libxul SHA256 is
`6a98b03cc87ce22beb0daab78368ccdc217d581cd204e3a7978819d8b62acde8`;
the exported Breakpad ID is `C2346865C069E9063F7067BD2014CD860`.
Existing authenticated Mesa symbols identify
`D40187191DB6AFC1D1949464114E27C10`. Local package and symbol bytes were checked
before the one supported profiler-cli 0.10.0 load. No public symbol service,
download, raw-profile parser or new recording was used.

Raw root range is 11310.979029..60452.423589 ms. CLI marker times are normalized
by subtracting that root start; the ordinary page-to-CLI offset is
-10332.585530828124 ms. All phase, sample, marker and tree contexts agree.
Content thread t-28 is PID1950828/document10737418242; parent compositor t-4 is
PID1950654. Page gap endpoints join unique adjacent callback markers within 1 ms,
retaining ordinary page-clock precision rather than claiming exact native edges.

## Main-Thread Attribution

Seventeen range/thread exports retain idle-inclusive samples, every function,
complete active call trees and markers of at least 1 ms. Phase sample categories
match the previous unsymbolized exports exactly. The call-tree leaf totals
conserve the non-idle counts, with no truncated children or double-counted
inclusive function totals.

| Range, parent main thread | All samples | Non-idle | Settings/security group |
| --- | ---: | ---: | ---: |
| Phase 0 | 2401 | 339 | 140 |
| Phase 1 | 2400 | 282 | 104 |
| Phase 2 | 2400 | 16 | 0 |
| Phase 3 | 2397 | 18 | 0 |
| First two playback seconds | 400 | 1 | 0 |

Grouping assigns each active leaf once to its outermost recognized component.
The combined group includes services-settings, services-common/kinto and psm
modules. Native work without a recognized component ancestor remains unassigned;
these group counts are neither wall durations nor complete causal attribution of
asynchronous work. Fifteen, four, zero and one parent active leaves respectively
remain unresolved in the four phases.

Recorded stacks include certificate attachment handling, ZIP-entry decompression,
attachment caching and IndexedDB transactions. Four exact modules were extracted
from the package's omni.ja, hashed and inspected. RemoteSecuritySettings can call
`attachments.cacheAll()` for the missing-data path; that consumer reads bundled
metadata and attachments and writes batches through the database helper. The
package already includes the earlier deterministic archive/reader cleanup fix.
This is not a newly discovered leak or justification for disabling security data.

Each short gap contains ten samples on each main thread. Gaps 0, 2 and 3 have
zero non-idle samples on both; gap 1 has one on each. The content sample is a
profiler-related lock path, not evidence of a 51 ms lock hold. Five-ms sampling
misses brief work, and idle-category counts do not prove zero CPU or no waiting.

The saved recording also contains ordinary browser background network work.
Network marker lifetimes can cross the recording start; they are validated as
overlapping intervals, not summed or described as CPU time. Fresh test roots do
not constitute a network sandbox. No new browser network activity occurred here.

## Callback And Compositor Evidence

The complete previously exported callback and refresh families retain 1192 and
1228 records respectively. Typed checks require the expected filters, full
exported populations, matching clock, thread, PID and document identity.

| Gap | Page gap, ms | Native callback gap, ms | Selection events inside gap | Changed-frame events | Queue updates |
| --- | ---: | ---: | ---: | ---: | ---: |
| 0 | 51 | 50.584 | 3 | 2 | 2 |
| 1 | 51 | 50.550 | 3 | 2 | 2 |
| 2 | 53 | 52.680 | 4 | 2 | 2 |
| 3 | 51 | 50.574 | 3 | 1 | 1 |

In gaps 0, 1 and 3, two intervening refresh ticks are about 16-17 ms apart and
record animation work, not video callback work. Gap 2 has a 40.319 ms spacing to
the catch-up tick; its 2.139 ms duration includes approximately 1.26 ms of style
work. Neither short event accounts for the whole page gap.

The image analysis admits all 2884 UpdateCompositedFrame and 1444 SetImages
records. Producer 0 has two initial unchanged selections. Producer 1 has 2882
selections and 1441 changed-frame records, with consecutive observed frame IDs.
All selected frames inside the four gaps report two later images in their local
queue. That is a queue count, not proof those later textures are ready or decoded
on time. The maximum intervals above apply to this complete exported producer-ID
population, not to an unobserved display or another recording.

The frozen native source distinguishes these events. `ChooseImageIndex` chooses
a valid texture using composition time; `UpdateCompositedFrame` emits the Text
marker before updating its frame bookkeeping. `OnFinishRendering` is a later
boundary. Therefore selection does not certify completed rendering or scanout.
The Text markers omit the native instance, layer and document needed for a strict
cross-process source join. No synthetic IDs are fabricated to close that gap.

HTMLVideoElement separately schedules callbacks on invalidation, and
`WillFireVideoFrameCallbacks` can refuse when no image, no eligible image, an
already-reported frame or a dummy image is available. The previously identified
40 ms playback-position update path remains unchanged. These paths explain why
callback progress and image selection can differ; there is no recorded per-event
invalidation/admission trace proving which branch caused each pause.

Five native files were archived from frozen base
`892431809a4caadb5c73b2c03ad9bdb124c3e21e`. Their absence from the exact package
patch/supplement and equality to current bytes are checked. Searchfox supplied
upstream discovery, not a substitute for the deployed-source proof. Its installed
0.18.0 CLI advertises 0.20.4; no update was installed.

## Verification And Cleanup

The final combined offline suite passes 48 tests, no failures or skips. It covers
the preceding compositor analyzers plus fourteen current-startup groups. Saved
results replay exactly. Negatives reject truncated trees, inconsistent function
identity, changed library grouping, malformed labels, integer overflow, duplicate
events, wrong threads/documents/clocks, filtered exports and incorrect counts.
A synthetic inserted 80 ms selection pause remains visible; it is not hidden by
the analysis or a relaxed threshold.

The earlier library-consistency test failed before its correction. Missing-module
REDs are scaffold evidence, not product failures. One source archival attempt
used an obsolete HTMLVideoElement path and stopped; its script, log and partial
snapshots are preserved. The corrected bounded source audit uses the discovered
mediaelement path and distinct snapshot names. No recording was retried. The
first formatting invocation skipped ignored artifacts; an explicit ignore-path
override then formatted the new helper/spec. Executed exporter and audit inputs
are retained as run.

The single CLI/symbolization run used a named owned session, loopback-only symbol
endpoint, missing-symbol 404 control, two Rayon workers and 8 GiB address-space
limit. Its work/cleanup/outer bounds were 150/190/210 seconds, with 12 MiB per CLI
output. These are not a total artifact quota or OS cancellation guarantee.
Symbol server PID3556897 and CLI daemon PID3556958 exited cleanly; both exact
roots and the named socket were absent at 10:02:00.125 UTC, 21.842 seconds after
launch. The replay and later image audit independently rechecked their absence.
No profiler daemon, browser, remote capture or test process remains running.

Evidence is `artifacts/umbralink-control/current-startup/`. Primary outputs are
`results.json`, `image-progress-results.json`, full `cli/` exports and command
receipts, packaged-module excerpts, five native source snapshots and retained
tests/failures. Product source pins, staged index, HEAD and build configuration
are checked separately. The prior current-compositor seal is unchanged.

## Next Decision

Do not optimize the public callback cadence or weaken its regression gate to
make this fixture pass. Do not call ordinary security initialization the cause
of gaps occurring before that work. Further stutter diagnosis needs an actual
frame or presentation interval with a delay and an authoritative identity join,
or a bounded private observation connecting invalidation, callback admission
and compositor frame selection. Reuse existing recorded spans first. Distinguish
the native video and the callback-driven canvas: the latter can update less
often without a native video stall.

The next runtime experiment, if needed, must be prospective, separate from
acceptance retries, preserve exact pixels and Firefox callback semantics, and
retain profiler-off controls. No new default, daily deployment or broad
layout/CSS/JavaScript performance claim follows from this phase. The full
performance objective remains active.
