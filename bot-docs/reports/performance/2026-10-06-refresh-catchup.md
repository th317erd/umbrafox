# Refresh Scheduling And Scrollbar Lead

## Result

Offline analysis of the existing profiled laptop capture identifies two different
callback dispatch paths and a concrete startup activity producer. No new browser,
native build, product edit, installation or owner-browser action occurred.

All 1189 CLI-derived video-callback spans are uniquely contained in same-document
RefreshDriverTick intervals. Of these, 1166 are also contained in
RefreshDriver::EnsureTimerStarted::catch-up runnables. The other 23 are not assumed
to be hardware ticks. A separate complete first-two-second export positively
places its 22 non-catch-up callbacks inside PVsync::Msg_Notify runnables.

| Startup callback group | First / last offset, ms | Callbacks |
| ---------------------- | ----------------------: | --------: |
| Vsync message          |        47.761 / 448.719 |        11 |
| Catch-up task          |       483.045 / 966.457 |        13 |
| Vsync message          |     1015.409 / 1415.391 |        11 |
| Catch-up task          |     1449.509 / 1980.049 |        14 |

At startup offset 1001.093 ms, ScrollbarActivity::FadeBeginTimerFired executes
for 0.127 ms. It contains two SetNeedStyleFlush markers for the exact fixture
document. An immediately following catch-up task contains a 1.072 ms Styles
interval; subsequent callbacks switch to the second vsync-message group.
The fade task itself does not consume a 50 ms interval.

The frozen GTK source supplies a 1000 ms scrollbar fade delay and 400 ms duration.
Its overlay-scrollbar stylesheet transitions opacity using that duration.
This is a strong, source-supported hypothesis for the two startup scheduling
regimes, not proof that scrollbar animation causes every callback gap. Actual
runtime look-and-feel values, scrollbar element identity and transition instances
were not collected. No dedicated Animation or Transition markers were exported;
the broad search matches only 1222 RefreshDriverTick reason strings. Reason strings
alone do not establish an active animation.

## Scope And Clock Checks

The capture is the existing compositor-controls profiled run, Build20261006175655,
parent PID1688238, content PID1688403, fixture document10737418242, thread t-26.
Profile SHA256 is
8eda357095b8945e7e132418ddc3024d16039416d470520800973e3dd464f18c.
The raw root range is [11327.148373, 60409.671211] ms; CLI marker times subtract
the first value. Phase windows are reconstructed from the previous eight-marker
UserTiming join, not compared directly to raw root times.

The old complete analysis is recomputed and deep-equal to its sealed result.
Both new scheduling exports have identical name/time/duration/payload signatures;
marker handles are session-local and are not cross-session identity keys.
Both also exactly reproduce the old callback and refresh marker populations.
The full-range CLI conversion incurs one floating-point unit of rounding at its
end. A retained failing test and correction allow only two floating-point units,
not an arbitrary analysis tolerance. The startup export is explicitly zoomed;
the previously discovered zoom-pop/clear issue is not used.

Per-phase callback counts are 297/296/298/298, matching saved page counts.
Catch-up containment counts are 275/295/298/298. All callback spans are fully
contained in their phase and have one matching refresh interval. The capture has
1225 refresh ticks, 1169 catch-up runnables and eight waiting-for-paint markers.
Some catch-up tasks do not run video callbacks; these populations are not equal.

The profiler callback-start clock has five startup gaps over 50 ms, all between
vsync-message callbacks, at offsets 132.146, 331.689, 415.250, 1181.475 and
1265.486 ms. The saved reduced-precision page clock reports three, not five.
Neither population replaces the other's threshold result. The later phase-one
124.088 ms interval and seven waiting-for-paint events inside that interval remain
the separate compositor/backpressure lead documented in the earlier report.
It is not the unprofiled 146 ms event.

The complete startup export has 1973 markers; one network marker is excluded
from interval calculations because its time contract is separate. GC occurs in
the window, but its longest reported slice pause is about 2.235 ms. The 23.824 ms
GCMajor envelope must not be treated as one stop-the-world pause. No startup
50 ms CPU stall or PiP animation is established by these exports.

## Frozen Producer And Consumer Trace

Eight source files are archived from the package's recorded HEAD
892431809a4caadb5c73b2c03ad9bdb124c3e21e. Their paths are absent from its hashed
source.patch and current bytes match the archived bytes. The complete dirty
package patch remains authoritative for other files; HEAD alone is not the build.

- ScrollContainerFrame::FinishReflowForScrollbar calls ActivityOccurred when
  scrollbar range/enabled/page-increment attributes change. ActivityOccurred
  requires the activity object and at least one scrollbar.
- ScrollbarActivity::ActivityOccurred starts/stops activity. StartFadeTimer uses
  the named callback observed in the profile. BeginFade removes active from the
  horizontal and vertical scrollbar elements.
- GTK nsLookAndFeel maps ScrollbarFadeBeginDelay to 1000 and ScrollbarFadeDuration
  to 400. The style environment variable maps the latter through int_ms.
- layout/style/res/scrollbars.css transitions overlay scrollbar opacity using
  that variable and sets inactive scrollbars to opacity zero.
- nsRefreshDriver::EnsureTimerStarted may post its named catch-up task using the
  active timer's most recent refresh timestamp. StartTimer can initialize that
  timestamp with TimeStamp::Now. Therefore a callback's recorded now argument
  is not automatically a physical-vsync timestamp.
- The tick's rendering phases execute pending video callbacks. The unchanged
  playback-position/invalidation chain can schedule further rendering steps;
  the previous 40 ms source lead is not a universal frame-rate limiter.

Searchfox discovery agrees on the
[named timer](https://searchfox.org/firefox-main/rev/4b5e436b8bc908fe7feb7341209140771397dda1/layout/generic/ScrollbarActivity.cpp#161)
and [stylesheet consumer](https://searchfox.org/firefox-main/rev/4b5e436b8bc908fe7feb7341209140771397dda1/layout/style/res/scrollbars.css#141).
The archived build sources, not current upstream indexing, establish the deployed
code correspondence. Searchfox-cli0.18.0 advertised0.20.4; no tool update occurred.

The owned fixture gives the video full viewport height. The collector prepends
a 320x180 canvas in normal flow immediately before playback. This can create
overflow and scrollbar activity. Source layout is not a measurement of the actual
scroll range. The original captures contain no post-prepend geometry/scrollbar
receipt, so the exact initiating reflow remains unproved.

## Verification And Limits

Evidence: artifacts/umbralink-control/refresh-catchup-audit/. Thirteen Node test
groups pass under a 20-second bound, including exact saved-result replay, source
hashes, both generated exporter equivalence checks, unknown/multiple containment,
foreign document rejection, missing/duplicate markers, malformed clocks, partial
phase overlap and strict floating-point bounds. Missing-module REDs are scaffolding,
not production bug reproductions. Behavioral REDs cover range conversion and
missing document authority; original logs are preserved.

Two named offline profiler-cli0.10.0 sessions used only the existing gzip and
the exact package's symbols. Local samply used loopback-only symbol endpoints,
disabled external fallbacks and bounded resources. The first server/daemon
PIDs3052999/3053043 and second3058107/3058135 have saved stop/absence receipts;
both named sockets were absent afterward. Sessions ended in about5.8/6.3 seconds.
No raw-profile parser, browser run, external symbol upload, agent or Pi action.

These are CLI-derived intervals: raw split-pair completeness is not exported.
Unique temporal containment plus document identity does not prove a causal
invalidation-to-frame join, physical display, GPU completion or a driver wait.
The original profiled arm has material observer cost and differs from its
unprofiled controls. No new performance acceptance, runtime cache-hit frequency,
automatic context recovery or general CSS/JS speedup follows.

## Next Falsifier

Create a separate, fixed diagnostic comparison of the original owned fixture
and the same fixture with root overflow suppressed by ordinary page CSS. Keep
the same native package, import mode, video, canvas dimensions, four copy phases,
timing thresholds and bounded capture envelope. Record geometry after canvas
insertion; do not change production scrollbar preferences or callback scheduling.
Use a fixed balanced order, not retries until green. A profiled confirmation must
show whether the named fade activity and vsync/catch-up transitions actually
disappear; unprofiled controls must measure whether startup gaps change.

This changes the diagnostic workload, not the original acceptance results.
It must not replace the failed27/29 and28/29 comparisons or exclude startup from
them. If the timing groups persist without the scrollbar activity, reject that
hypothesis and inspect the next actual refresh producer. Even a positive result
would not justify globally disabling scrollbar animation or changing public
callback cadence. The independent compositor stall, label-cost concern and
full performance objective remain open. Direct import stays default OFF and
uninstalled in the daily browser.
