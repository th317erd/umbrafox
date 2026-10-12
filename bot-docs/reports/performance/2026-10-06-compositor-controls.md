# Compositor Observer Controls And Recorded Stall

## Result

The fixed unprofiled-before/profiled/unprofiled-after sequence completed on
wyatt-laptop with unchanged Build20261006175655 and GPU import ON in all three
arms. Functional, provenance, resource and owned-cleanup gates pass. There is
no new rendering-performance acceptance or daily-browser installation.

The profiled arm uses 27.54% more normalized joined-process CPU than the first
control and 27.06% more than the second. The two controls differ by 0.38%.
Only the profiled arm has a 124ms callback gap and four compositor-counted drops.
One fixed sequence does not isolate profiler causality, but it demonstrates
that profiled timing cannot substitute for unprofiled acceptance.

The saved profile narrows this particular stall: a CLI-derived 153.752ms
Renderer Composite overlaps the callback gap; WebRender reports 152.294ms for
its internal render operation. The fixture document records seven refresh
ticks waiting for paint, and the parent compositor records five back-pressure
events during the gap. A four-frame drop marker follows. This is a supported
render-pipeline/back-pressure lead, not proof of GPU saturation, a particular
driver wait, scanout behavior, or the cause of the owner's YouTube stutter.

## Controlled Comparison

Each arm uses a fresh owned installation/profile/app-data/local-data/temp tree,
the same 48-second hardware-decoded 1920x1080 H.264 input and 320x180 canvas,
and four 12-second phases with 1/4/4/1 copies. The runtime harness's 142 inputs
are unchanged. There are no new per-frame marks, preference changes, readbacks,
browser restarts, result-based retries, or excluded captures in this sequence.

| Observation | Before, unprofiled | Profiled | After, unprofiled |
| --- | ---: | ---: | ---: |
| Joined CPU, seconds | 27.693 | 35.306 | 27.804 |
| CPU seconds / elapsed second | 0.57579 | 0.73434 | 0.57796 |
| Callback gaps over 50ms, phases 0-3 | 3 / 0 / 0 / 0 | 3 / 1 / 0 / 0 | 4 / 0 / 0 / 0 |
| Maximum callback gap, phases 0-3, ms | 55 / 44 / 42 / 44 | 51 / 124 / 42 / 42 | 58 / 45 / 43 / 45 |
| Video drops, phases 0-3 | 0 / 0 / 0 / 0 | 0 / 4 / 0 / 0 | 0 / 0 / 0 / 0 |
| Four-copy draw-batch P95, ms | 2 / 2 | 1 / 1 | 2 / 2 |
| Passive resource samples | 14 | 15 | 14 |

The CPU join uses stable endpoint/sample-start identities, not every transient
process. Browser, content, decoder and several background process populations
all differ; there is no assumption of a quiet fresh profile. Hardware receipts
report ffmpeg H.264 in RDD. The profiled after receipt has decoder/sink drop
counts zero and compositor/container counts four. These are aggregate receipts,
not an atomic frame-by-frame hardware presentation join.

Canonical comparison: `artifacts/umbralink-control/compositor-controls/admitted-control-after.json`.
The earlier unprofiled OFF/ON comparison and compressed pilot remain separate;
neither their CPU numbers nor their gap populations are pooled here.

## Timeline

All times below are CLI-normalized milliseconds within this single loaded
recording. Eight retrospective UserTiming marks join the saved page clock to
this clock with one common offset. Raw rootRange is
[11327.148373, 60409.671211]; it is not added again to normalized marker times.
The page retains ordinary clock precision; submillisecond marker timestamps do
not increase the precision of its callback observations.

| Observation | Start | End / details |
| --- | ---: | --- |
| Renderer notifier Runnable | 20088.949019 | 20242.751196, 153.802ms |
| Renderer Composite, widget document 2 | 20088.980878 | 20242.732501, 153.752ms |
| Page callback gap | 20119.699323 | 20243.699323, 124ms |
| First of seven fixture waiting-for-paint ticks | 20121.504864 | Last at 20242.347714 |
| WebRender renderer_time accumulation | 20241.463012 | Reported duration 152.294ms |
| Next fixture callback-processing span | 20243.213685 | Duration 0.860ms |
| Video frames dropped | 20257.975127 | Four, frame 577 to 582, producer 1 |

Five of six complete-profile busy SkippedComposite events occur during the
callback gap. The sixth is earlier in phase 1. Idle events are counted
separately: 775 overall, 773 inside phases. None are combined with busy events
into a fabricated stutter count. The drop marker has no document ID; its
timestamp is the counting operation, not the skipped frames' due times.

The preceding/current page draw batches take 1/0ms at normal page precision.
That zero means below recorded resolution. Across the recording, all 1189
fixture callback-processing spans are at most 2.694ms. The overlapping canvas
translator event is about 1.767ms; the maximum elsewhere in phase 1 is 19.806ms.
The 124ms gap is not represented as one equally long JavaScript draw callback.

The Renderer Awake marker reports 159.617ms elapsed and a CPU-time payload of
7.592ms. This is not 159ms of demonstrated CPU execution. Within the surrounding
1124ms export window, each of the four inspected parent threads has 195 samples,
while content has 225. Actual before/after sample brackets and all phase
populations exist, but those facts do not prove complete sampling during the
stall. Unsymbolized native frames and missing split-marker completeness remain
limitations. No strict notifier/Composite subtraction or GPU-wait partition is
claimed.

## Source Meaning

The initial analyzer incorrectly required every observed SkippedComposite
document ID to equal the fixture content ID, 10737418242. Its failure on ID2 is
preserved. The producer actually uses the root compositor bridge's ID:
nsIWidget passes its own document ID into CreateTopLevelCompositor; the
in-process session and manager forward it into CompositorBridgeParent's
constructor. WebRenderBridgeParent::CompositeToTarget reads that stored ID.
It is not necessarily a remote content document. See the indexed
[widget producer](https://searchfox.org/firefox-main/rev/4b5e436b8bc908fe7feb7341209140771397dda1/widget/nsIWidget.cpp#1518)
and [busy marker](https://searchfox.org/firefox-main/rev/4b5e436b8bc908fe7feb7341209140771397dda1/gfx/layers/wr/WebRenderBridgeParent.cpp#2671).

The new offline parent classifier preserves all IDs and labels fixture
association unproven. It requires the exact parent PID/Compositor thread and
reuses the sealed clock/payload checks through a document-free projection;
original exports are never rewritten. Content marks and callback identities
remain strict. Six constructor/caller sources match the recorded build HEAD;
the full build patch and source pins were also rechecked.

The actual patched Renderer::render_impl starts RENDERER_TIME before frame
preparation and ends it after drawing, external-image unlocks and GPU-profile
end-frame work. TransactionProfile measures elapsed zeitstempel time.
Telemetry::record_renderer_time forwards that value to the Glean metric.
RendererOGL calls wr_renderer_render before its later FlushPipelineInfo and
compositor EndFrame. Thus the reported 152ms is inside the WebRender operation,
not explained entirely by the later outer swap/tail. Driver calls and waits
inside that operation remain possible; the metric is not GPU execution time.
See the indexed [timer sites](https://searchfox.org/firefox-main/rev/4b5e436b8bc908fe7feb7341209140771397dda1/gfx/wr/webrender/src/renderer/mod.rs#1664).

The fixture's waiting-for-paint marker is emitted at the refresh driver's
IsWaitingForPaint early return, before normal tick/callback processing.
Its same-document payload provides direct evidence of that admission branch,
not just a guess from a long callback interval. See the
[early return](https://searchfox.org/firefox-main/rev/4b5e436b8bc908fe7feb7341209140771397dda1/layout/base/nsRefreshDriver.cpp#2321).

Searchfox provides discovery, not deployed provenance. `render-timer-source.json`
pins inspected local sources against the build's exact HEAD plus identical
tracked patch. An attempted HEAD-only equality check was wrong for already
patched Rust files and timed out formatting a large buffer assertion, twice.
Both stopped before producing proof. The corrected hash-based check preserves
the distinction between unchanged HEAD files and recorded patched sources.

## Verification And Cleanup

- Three browser drivers and their independent evidence exports/replays pass.
  All 36 recorded process IDs are absent; each run ends in clean owned SIGTERM
  cleanup, 271 log bytes and zero dropped log bytes. No SIGKILL.
- Original failed CLI export remains under `cli/`; daemon2560657 stopped and
  exact PID/socket absence was verified. It failed before querying drops.
- Corrected export under `cli-v2/` executes 153 supported CLI commands against
  the same gzip SHA256
  `8eda357095b8945e7e132418ddc3024d16039416d470520800973e3dd464f18c`.
  It uses explicit loopback-only symbol-server configuration and no raw parser.
  Daemon2568608 stopped successfully at21:59:13.760UTC; PID/socket absence was
  recorded immediately and PID absence rechecked. No browser was launched.
- New saved-profile analysis validates the 36-thread inventory, exact process/
  thread selections, eight clock anchors, full-export counts, actual samples,
  gap zoom clocks, content IDs and repeated full/zoom marker observations.
  Network markers are explicitly excluded from this clock join.
- Latest scoped suite: 55 tests pass, zero failures, about0.65s under30s.
  This is a named subset, not a replacement claim for earlier 84/119-test gates.
  Tests cover saved results, malformed IDs/payloads, truncation, duplicates,
  filter/clock errors, missing samples, source-preserving projection and exact
  exporter transformation. Missing-module REDs are infrastructure checks;
  the saved original identity rejection is the behavioral reproduction.
- A mechanical clone initially renamed the executable to profiler-cli-v2;
  its equality test caught that before any execution. Only the output/session
  namespace and deferral of classification are allowed differences; call
  deadlines and finally cleanup remain equal to the reviewed exporter.
- Runtime bounds, resource caps, pixel tolerances, source/defaults, desktop
  installation/profile/launcher and Pi are unchanged. The final remote guard
  verifies all142 runtime inputs again. No staging, commit, build or install.

## Next Decision

Do not change queue-depth/back-pressure thresholds to hide the symptom. First
inspect exact-gap sample availability and supported stack/marker exports for
the internal 152ms operation. If current exports cannot identify its stage,
trace existing render-stage observations before proposing minimal private
instrumentation. Separate CPU execution, driver waits, profiler interference
and GPU completion; use matched unprofiled tests for any performance decision.
The experimental import remains default OFF and the full rendering/layout/CSS/JS
objective remains active.

Final seal: `artifacts/umbralink-control/compositor-controls-final-v2.sha256`,
covering this report, the evidence namespace and142 frozen runtime inputs.
Mutable plans/context and the seal's own verification log are excluded.
The first seal attempt is retained but invalid: the final lint process was still
finishing its log. Verification detected exactly that one changed file, with no
capture/source mismatch. The replacement seal follows terminal lint completion
and includes this correction; it is checked independently before use.
