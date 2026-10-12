# Compositor Profile Integration And Coverage

## Result

The bounded compressed-profile pilot succeeds on wyatt-laptop. Its saved profile
contains actual samples before and after playback on parent GeckoMain, Renderer,
CanvasRenderer, Compositor and the fixture's content GeckoMain. Each thread also
has samples in all four workload phases. This closes the integration and observed
history-bracketing gate; it does not prove every possible marker was recorded.

The earlier 146 ms callback stall and four compositor drops do not recur here.
All four phases execute 298 callbacks. The only two gaps above 50 ms are in the
first phase, with a maximum of 51 ms. Native after-playback drop counters and page
video-drop counts are zero. This single profiled pilot is not a repeated
performance comparison, a stutter fix, or acceptance of the experimental path.
The separate ON/unprofiled-before, ON/profiled, ON/unprofiled-after sequence has
not yet run. Experimental GPU import remains default OFF and uninstalled in the
daily browser.

## Rendering Observations

All durations below are milliseconds from CLI-derived intervals. Quantiles use
nearest rank. Intervals crossing phase boundaries are excluded and counted
separately; there are none for these selected families in this capture.

| Scope | Phase 0 P95 | Phase 1 P95 | Phase 2 P95 | Phase 3 P95 | Maximum in phases |
| --- | ---: | ---: | ---: | ---: | ---: |
| Content video-callback processing | 1.078 | 1.625 | 1.514 | 1.043 | 2.235 |
| Renderer Composite | 1.719 | 1.758 | 1.749 | 1.773 | 4.354 |
| Renderer notifier runnable | 1.767 | 1.820 | 1.809 | 1.837 | 4.391 |
| Compositor CompositeToTarget | 0.126 | 0.152 | 0.157 | 0.168 | 0.774 |
| Canvas PresentTexture | 0.796 | 0.764 | 0.761 | 0.771 | 3.930 |
| Canvas event runnable | 1.739 | 2.596 | 2.488 | 1.623 | 8.781 |

The complete exports contain 1,192 callback-processing intervals, 2,094 renderer
Composite intervals, 2,094 notifier intervals, 2,885 CompositeToTarget intervals,
1,193 PresentTexture intervals and 1,195 canvas event runnables. Two Composite,
two notifier, five CompositeToTarget and two canvas-event intervals are outside
the measured phases. Full counts and per-phase quantiles remain in
`artifacts/umbralink-control/compositor-compressed/profile-analysis.json`.

All 791 SkippedComposite markers have the reason "No reason to generate frame";
788 fall inside the four phases and three outside. None report "Too many pending
frames" or a paused compositor. The Video frames dropped export has zero rows.
The [source map](2026-10-06-compositor-source.md) distinguishes idle decisions
from back-pressure and explains the limited selection-loss counter semantics.
These observations do not establish a drop-free physical display or rule out
short waits and unobserved loss modes.

Callback markers carry the exact fixture document ID. Other families have
parent-process/thread identity, not an invented document or per-frame join.
Equal notifier/Composite counts do not establish raw split-marker pairing. The
installed CLI omits incomplete/pair provenance, so no strict nested partition is
computed. Marker wall time is not CPU time, GPU completion or scanout timing.

## Background Work

Parent GeckoMain has 296/2,401 and 358/2,400 non-idle-classified samples in the
first two phases, versus 17/2,400 and 13/2,398 in the last two. Those are sample
classifications, not measured thread CPU percentages. Phases 1 and 2 both do
four copies per callback, but their parent activity differs substantially.

Sampled names include RemoteSettingsClient._cleanLocalFields, attachment
cacheAll, RemoteSecuritySettings.stringToBytes, X509 parsing and the control
serializer's visit routine. Most native frames are unsymbolicated; these names
do not allocate all parent cost or establish what caused a particular gap.

The saved parent-network export includes ordinary browser background traffic:
38 settings-service rows, 83 settings-attachment rows, 25 signature rows, codec
and component downloads, update checks and an add-on-service row. Two rows are
the owned loopback media resource. Its 155 exported rows and reported 154 request
count are preserved separately, not silently equated. Network-export timestamps
are not joined to marker clocks in this analysis.

This is evidence that a fresh profile is not a background-work-free performance
environment, not proof of the owner's YouTube cause. The profile used fresh
private application-data roots, but that does not disable ordinary network
activity. No service, security update, codec, clock, default or public API was
disabled to improve a benchmark. Any future steady-state or background-control
experiment needs its own explicit contract; it must not replace these results.

## Integration And Retention

The unchanged 48-second 1080p H.264 fixture draws to a 320x180 default canvas,
with 1/4/4/1 copies in four 12-second phases. The frozen capture uses the same
128 MiB profiler configuration, 5 ms interval, thread filters, workload, 105/120
second work/total limits, 15-second cleanup and 256 MiB sampled artifact cap.

The first pilot failed a diagnostic assertion: generation changes were wrongly
treated as buffer eviction. Native byte positions and capacity use different
units from the API entry count. Its evidence remains failed and unchanged.
The corrected-counter pilot completed playback but exceeded the 24 MiB raw-copy
cap with a 69,577,342-byte profile. That file was measured by metadata only,
never parsed or exported. Neither failure became an accepted capture.

The new adapter reuses the frozen capture through an exact dump-method override.
An existing private browser-realm command invokes the native gzip-profile API,
checks parent PID and native profile directory, and exclusively writes one
owned gzip file. A fixed parent-clock deadline, active-profiler checks and exact
receipt validation constrain late work. The copied compressed file remains
under the unchanged 24 MiB encoded cap. Native gathering still materializes JSON
in memory, and started native I/O cannot be canceled by a JavaScript timeout.
No hard native-memory or zero-post-abort-I/O guarantee is claimed.

The accepted gzip file is 11,278,862 bytes, SHA256
`20fc631f94e8a4a99934470b9955232920bbac8f0f9bd44d25d59c27a1fd9826`.
Only profiler-cli loaded it; no alternative raw-profile parser or decompressor
was used. Native gathering and writing took about 1.242 seconds after playback.

The CLI raw root range is [11308.463862, 60436.54154] ms. Eight retrospective
UserTiming anchors join the page clock to normalized CLI time with offset
-10312.235153203126 ms and exact content PID/document identity. These anchors
establish the clock relationship, not retained history.

The separate coverage export supplies actual sample evidence. Parent threads
have 126 pre-workload and 17 post-workload samples each; content has 40 and 17.
Each phase/thread has 2,398-2,401 samples. Sampling includes idle. Raw zoom ranges
are validated against the original root plus normalized phase boundaries, never
by applying the root offset twice. Edge marker exports are retained too, but
missing Renderer markers before work do not override its positive sample proof.
There is no claim of lossless marker recording or raw pair completeness.

## Provenance, Verification And Cleanup

BuildID is 20261006175655. The package and 142-input diagnostic manifest match
the source-admitted predecessor plus four new frozen runtime files. Manifest SHA:
`e3f3b6e68b320ec099c20e6d21dd9185e202d7d74030b5d645e18fbc13a3a5d4`.
The final source guard checks 38 inspected files, all 60 build-source pins, 135
predecessor harness inputs, HEAD, staged/working patches and configuration.
Thirty-five inspected files match the recorded HEAD; three use explicit modified
build pins. No product source, native build, package or index changed here.

Pilot root: `/home/wyatt/.cache/codex/laptop-composition-r3-pilot-20261006-H5vjfG`.
Controller 1678437, browser 1678449, content 1678616; document 10737418242.
Run time: 21:12:09.024-21:13:11.122 UTC, October 6. Profiler stop succeeds, owned
SIGTERM cleanup succeeds, logs contain 271 bytes with zero drops, and all 12
recorded PIDs are absent afterward. The package's 46 immutable files plus empty
lock are unchanged. Fifteen resource samples pass; peak sampled artifacts are
151,454,498 bytes, not a continuous peak bound.

Export/replay verifies 52 files totaling 11,637,471 bytes. An initial offline
relative-resource check accidentally compared nonexistent atMs fields. The
corrected replay joins the saved baseline exactly to sample 3 and applies the
relative caps after it. A regression rejects relative RSS growth even below the
absolute cap. Original captured evidence and the failed check are preserved.

Two named offline CLI sessions use explicit symbol server http://127.0.0.1:9.
The first exports the inventory and marker families; the second adds actual
sample brackets, phase samples, canvas/notifier families and network evidence.
Both load the same hash and revalidate the same eight phase anchors. Their own
PIDs 2524148 and 2530184 and sockets are absent after successful stops at
21:16:56.210 and 21:23:33.278 UTC. There is no remaining owned browser or daemon.
No other session was stopped and no external symbol service was requested.

The selected strict Node suite passes 119 tests. New analysis coverage rejects
truncated exports, mismatched raw/normalized clocks, wrong identity, active-only
sampling, malformed categories and durations, duplicates and missing brackets.
Saved evidence replays exactly. The second export's bounded command helper and
final cleanup body match the first runner mechanically. Missing-module REDs are
infrastructure checks, not production behavioral reproductions; earlier setup
syntax/extraction errors remain recorded. No full Gecko suite or native build
was rerun for this diagnostic-only work.

After final formatting, all 119 selected tests pass again in 0.721 seconds.
Explicit Prettier checks cover eight new/offline files; mechanically cloned
drivers/exporters retain their equivalence-checked formatting. Scoped report/
plan codespell, whitespace and source-text checks report zero problems, and
tracked diff whitespace checks pass. The final read-only laptop guard verifies
all 142 frozen inputs and the original private harness-directory identity at
21:28:07.371 UTC. Scratch files ignored by product lint are not claimed as
product-ESLint coverage.

## Next Step

Proceed with the already specified fresh-process unprofiled-before/profiled/
unprofiled-after observer-control sequence only after unchanged source, package,
harness and host admission checks. Preserve every result, including background
traffic and failed smoothness criteria; do not retry until an acceptable outcome
appears. This pilot establishes usable integration and observed thread history,
not the observer effect or a reproducible stall. Any optimization decision must
follow the resulting attribution, while exact pixels and Firefox-equivalent
web behavior remain mandatory. Desktop daily browser, profile, launcher,
installation and Pi were untouched.
