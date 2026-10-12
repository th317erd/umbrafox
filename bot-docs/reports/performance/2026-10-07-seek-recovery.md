# Seek-triggered video stutter and recovery

## Status

Both long 1080p progress-bar captures pass. Forward recorded 26 dropped
frames over 151.778 seconds, with 25 before the seek near second6 and only one
additional drop during the >=130-second post-seek interval. Backward recorded
three isolated drops over151.472seconds. Neither capture reproduces the
prolonged stutter/black-flash recovery; no product fix is claimed.
The daily desktop remains untouched; only fresh owned laptop profiles were
used. All owned sessions are terminal and recorded PIDs absent. Next work
should match the owner's affected stream/codec/seek pattern, not repeat the
unchanged single-click AV1 test or promote a speculative native fix.

### Long 1080p Progress-Bar Capture

Explicit `ui-forward-1080` / `ui-backward-1080` scratch modes reuse the verified
normal-menu preparation before baseline. Initial page/native dimensions and
the first baseline sample must be1920x1080. Later sampled format changes are
preserved, not rejected or silently relabelled. Three preparation clicks are
checked separately from the single progress-bar click. These modes retain
the same64-RPC/240-second envelope,185-second pre-sequence work reserve,
>=130-second post-seek window and exact document/video/input checks. No
native, public-interface, browser-default, codec/GPU preference, extension,
package, build or daily-desktop change. The profiler remains off.

The host adapter, parser, saved-data reviewer and timeline support the new
labels; existing Auto/probe/direct results reproduce exactly. Failing-first
gates:17PASS/3FAIL host and expected new-mode reviewer failure. Combined
implementation gate171PASS, including each RPC/write failure, preparation
failure, insufficient budget, first-sample mismatch, later downshift
preservation and corrupted raw quality evidence. Tests are tooling coverage,
not a native correctness or zero-observer-cost proof.

V20 runtime archive has33files/75parsed import edges/30syntax checks:
SHA256 `1a4e8ca773ae1858911cc8a0cfd00a3457774b64d3e68d8f3ceb577b50a6f528`,
manifest `9951ca2118fe6a245ffe17eaaa56e283a3aa0982d02084ee6b4c125abde686ad`.
Laptop root `youtube-recovery-v20-harness-20261007-2AGoJA`, canonical/private
uid1000/dev64512/ino37259284. Initial and reuse preflights verify all inputs,
no browser/compiler busy entries and available memory/disk. Same pinned
baseline Build20261006175655; the failed producer-fence candidate remains
unpromoted.

#### Forward

Root `laptop-youtube-ui-forward-1080-20261007-fsvdVZ` under laptop cache;
20:47:41.529-20:50:29.421UTC.156samples, zero missed intervals,1920x1080
throughout;9080additional total frames/26drops. UI seek21.254056->45.220319s,
target45s, trusted seeking->seeked385ms. Total observation151778ms,
130008ms after the session's observed seeked. Collector and session event
listeners differ by1ms in their individual timestamps, not their385ms span.

Drop increments:25 in the interval ending at6017ms, one at45022ms from
observation start. The25-frame burst precedes the seek at21384ms; it is not
evidence that the seek caused that burst. No later increases, counter resets
or sampled low-advance intervals; minimum sampled buffered-ahead15.010s,
readyState4 throughout. Brief trusted waiting/playing events accompany the
seek. These one-second samples do not measure physical scanout or establish
absence of every transient pause/black frame.

Native before receipt reports decoder shutdown with retained AV1 metadata;
all four later receipts report ffvpx software AV1/RDD,1920x1080. Decoder/sink
drops0; final compositor/container drops26. This counter placement does not
establish compositor/GPU causation. Parent/content/RDD identities are stable
at five snapshots, not a continuous reset exclusion. Different stream/codec,
profile, extensions and host remain important owner-workload mismatches.

45workload RPCs including12quality-preparation requests;36resource samples,
peak aggregate RSS2710454272B(shared pages may count repeatedly), artifacts
158855408B. Clean owned SIGTERM,271log bytes/zero log drops; before/after
native directories/build, selected-tab checks and47-file package postflight
PASS. All14recordedPIDs absent at20:50:36.849UTC. Sparse sampling cannot
exclude transient helpers or prove no-network/earlier-directory access.

Export102allowlisted files/602223raw bytes, SHA256
`d2a57882b2069a28e98659eeb49fd27197f296cf696a91ead3395f638ec67fb3`.
Derived `youtube-ui-forward-1080-{analysis,timeline,process-joins}.json`
all pass and exact saved-result regression passes. Original admission and
failed attempts remain unchanged.

#### Backward

Same V20 inputs reverified before launch. Root
`laptop-youtube-ui-backward-1080-20261007-WhgI8i`,20:51:40.991-20:54:28.972UTC.
156samples/zero missed;1920x1080 throughout,9079additional frames/3drops.
UI seek21.260976->5.189310s,target5s, trusted seeking->seeked81ms;
151472ms observation and130008ms after session seeked. Three single-frame
drop increments at45019/55018/72024ms; none before the seek. Thus the earlier
25-frame startup burst is not present in every fresh1080p run. No counter
reset or sampled low-advance interval; minimum sampled buffered-ahead15.010s
and readyState4 throughout. Same five-snapshot stable process joins and
software AV1 metadata pattern as forward; final decoder/sink drops0 and
compositor/container drops3. Not a physical-scanout or causal path proof.

42workload RPCs including12preparation requests;36resource samples, peak
aggregate RSS2713964544B and artifacts174171518B. Clean owned SIGTERM,
271log bytes/zero log drops, before/after native receipts and package
postflight PASS. All14recordedPIDs absent20:54:36.327UTC. Export99files,
596024raw bytes, SHA256
`778e3ed9e746ec979e93578725787e50d91d5a78817ea95e2cdda14066c6a3e8`.
Derived `youtube-ui-backward-1080-{analysis,timeline,process-joins}.json`.

This is one capture per direction, not a statistical directional performance
comparison. The exact owner URL/seek positions were requested earlier but
remain unanswered. Known mismatches include software AV1 versus historical
owner VP9, fresh signed-out profile/extensions, single clicks versus possible
dragging or repeated seeks, and different hardware. No extension/userland
cause is proved or excluded. Do not change the daily browser or force codecs
to manufacture a matching result.

Final combined gate171PASS/0FAIL in4.463seconds
(`quality-long-final-tests.log`), including exact saved forward/backward
analysis/timeline/process joins plus all historical analyses. Scoped
eight-file formatting passes; plan/report lint has no problems. Evidence
inventory `quality-long-final-evidence.json` seals source inputs, tests, raw
exports, derived outputs, archive/preflight proofs and verification logs.
The earlier `quality-long-evidence.json` is retained as the pre-handoff-edit
snapshot; the final inventory includes the corrected current-progress plan.

### 1080p Quality Admission

New scratch `youtube-quality.mjs` exposes an explicit `quality-1080` driver
mode. It uses only the existing native input commands and visible normal
Settings -> Quality -> 1080p/1080p60 entries, never a hidden YouTube API or a
browser/codec/GPU preference. No public browser interface/default changed.
The original Auto admission and UI-seek modes remain unchanged. The shared
120-second admission envelope, owned private directories, resources and cleanup
remain in force. This short adapter has a before-only native-directory receipt,
not the long adapter's additional after-native receipt.

Menu labels/geometry are bounded, same-document checks precede each stage,
and each target is clicked once only after positive visibility/hit testing.
Ten bounded menu reads per stage can wait through an animation. After selection,
twenty bounded metadata reads can wait for the media to become ready; they do
not click, play or seek. The ordinary 20-second admission then observes playback
and checks the final ten seconds' sampled dimensions plus the native after
dimensions. Browser defaults, extensions, login and personal profiles are not
changed. Input dispatch itself remains context-targeted, not an atomic
document-pinned operation; this is an otherwise unused owned tab.

#### Preserved Quality Failures

- V17 `laptop-youtube-quality-1080-20261007-y0akXd`: Settings and Quality clicked,
  but the visible 1080p60 submenu was still moving and not hit-testable. No
  resolution click or playback. Saved geometry reproduced the pending-state
  case; V18 waits without weakening the final hit-test requirement.
- V18 `laptop-youtube-quality-1080-20261007-C9rlyX`: selected 1080p60, then
  immediately observed readyState0/null duration/zero dimensions. No playback
  attempted. V19 adds the bounded post-selection readiness wait with raw-data
  regression tests. This is a tooling assumption correction, not a media fix.

Both remain failed in their immutable exports. Each has clean owned SIGTERM,
271 log bytes, zero dropped log bytes, package postflight PASS and all 14
recorded PIDs absent. Export SHA256 values:
`laptop-youtube-quality-1080-export.json` =
`1d6d3c0a1f8d7d23e01f783dd718af8c37aee2b579134c32f07a629eee0f455e`;
`laptop-youtube-quality-1080-2-export.json` =
`a7910e9f2239079f653392710c61162b6a754fc76cbf2d6c44e0321a13bbe91f`.

#### Admitted Quality Result

V19 root `/home/wyatt/.cache/codex/laptop-youtube-quality-1080-20261007-jyO18k`,
20:30:35.178-20:31:08.099 UTC. Same pinned baseline Build `20261006175655`.
Three clicks total; menu reads1/2/4 and two media-readiness reads. The actual
entry was labelled `1080p60 HD`. All 21 observed samples had 1920x1080 media;
1199 additional total frames over 20.001 seconds, zero missed sample intervals,
25 dropped frames. The drop counter rose only in the 5.001-6.002-second interval
(60 total frames in that interval); no subsequent rise through 20.001 seconds.
No observed media events were emitted during the collection window.

After immediate pause, the native receipt shows `ffvpx video decoder (RDD remote)`,
`video/av1`, hardwareAccelerated=false, decoder/sink dropped counts0 and
compositor/container dropped counts25. These counters do not establish a GPU,
driver, decoder scheduling or main-thread cause. The brief drop burst does not
reproduce the owner's one-to-two-minute post-seek stutter and black flash.
There was no seek in this admission. Software AV1 still differs from the owner's
historical VP9 path; menu label and frame counts are not physical scanout proof.

Seventeen workload RPCs, six setup attempts, nine resource samples; peak sampled
aggregate RSS2600779776 bytes (shared pages can count repeatedly), artifact
91905784 bytes. Clean owned SIGTERM, 271 log bytes/zero log drops, before native
directory/build checks, selected-tab admission and package postflight PASS.
All 14 recorded PIDs absent at 20:31:24.223 UTC. Sparse process samples do not
exclude transient helpers; no no-network or earlier-access claim.

Export `laptop-youtube-quality-1080-3-export.json`: 47 allowlisted files,
SHA256 `841a967d61a64dcd28111eb6d74c462f32fa21acf6c82f3a5d6807615c46d6e2`.
`review-quality.mjs` rechecks raw hashes, input geometry/clicks, document joins,
sample/native dimensions, sparse resources, cleanup and recorded PID absence;
output `youtube-quality-1080-analysis.json`. Tests reject old failed captures,
corrupt hashes, altered identity/menu/geometry/dimensions and counter resets.
Final combined gate: 169 PASS (`quality-ui-wave-tests.log`).

V19 archive: 33 files, 74 parsed import edges, 30 syntax checks,
SHA256 `5ec24104b4df99d1e47be50781ec72cc78d9c3987c928916d97f76ab5596e114`;
manifest `c1b7318ce26f52462cfecb808ad30f630b70970c72dad058c6d2965a73f8525c`.
Laptop harness root `youtube-recovery-v19-harness-20261007-uwqgPj` under the
owned cache namespace. V17/V18 archives and failures are preserved. Final
inventory is `quality-ui-evidence.json`; historical inventories are not rewritten.

### Earlier Full UI Status

Full actual-UI forward and backward captures now pass, including 130.007 and
130.009 seconds after observed seek completion. Each reports zero drops across
4543 frames, with no sampled non-seek low-advance interval. Earlier failed
tooling attempts remain failures. All commands are terminal; all 14 recorded
PIDs per run are absent. These are diagnostic tooling changes, not a browser
performance fix. The goal remains active; workload matching is next.

### Full UI recovery capture

The scratch driver now supports `ui-forward` and `ui-backward`. A private
listener callback observes the real input-induced events and never assigns
currentTime. Results are version 2 with `input: "progress-bar"`, distinct from
the earlier direct-element version-1 results. Baseline remains 20 seconds;
the final segment extends within its existing 50-second bound to cover at least
130 seconds after observed `seeked`. The existing 240-second total envelope,
225-second work deadline, 210-second session watchdog and cleanup reserves
remain unchanged. No browser/native/default source changed.

The shared directional capture label selects the existing budget only. Driver
and streaming mode retain the explicit `ui-` prefix, and independent result
validation requires the UI schema, one click, matching raw geometry and the
trusted event pair inside the pre/post-click page-clock bracket. Session and
collector event listeners read clocks separately; their values need not be equal.
Saved observations are not adjusted to force equality.

Each attempt uses a fresh owned installation/profile/application-data/local-data
and temp directory. Profiler remains OFF. No login, ad skipping, extension,
quality or GPU preference changes. Only isolated laptop windows are used;
the daily desktop browser is untouched. This is single-click seeking, not a
drag across multiple progress positions or proof of physical scanout/black frames.

#### Preserved failures

- V14 forward `E4NgGr`: hidden controls did not become visible after the
  single-point reveal command. No click or seek, acknowledged cancellation.
  The bounded two-point reveal change was tested before V15. V15 revealed
  controls and passed, but this does not establish a universal cause of hiding.
- V15 backward `JoQL2F`: the click reached 4.821 seconds, but the observer
  aborted during delivery of a trusted seeking event. Its raw result is
  incomplete with one baseline and one aborted segment, not a recovery result.
  The exact live flag at rejection was not recorded, so the original rejection
  cause is not proven solely by this artifact.

Both failed runs have clean owned SIGTERM, 271 log bytes, zero log drops,
package postflight PASS and all 14 recorded PIDs absent. The V15 backward
close snapshot was stale (read before its final pause); its host acknowledgment
remains failed even though OS cleanup passed. Original exports remain immutable.

V16 corrects two independently falsified tooling assumptions. A queued seeking
event does not require the live seeking flag to remain true at callback time.
[HTMLMediaElement::SeekStarted queues the event](https://searchfox.org/firefox-main/rev/cfd140a311d8523d3d35e00ee1a9f2403c033dfd/dom/media/mediaelement/HTMLMediaElement.cpp#6502),
while [MediaDecoder::OnSeekResolved clears the flag before notifying completion](https://searchfox.org/firefox-main/rev/cfd140a311d8523d3d35e00ee1a9f2403c033dfd/dom/media/MediaDecoder.cpp#962).
The corresponding local producer/consumer bodies were also inspected. The
observer still requires a typed boolean, trusted ordered events, same media,
and the settled target. The close receipt now reads current state after cleanup.
Failing-first tests cover both, including generated frame-script integration.
Neither correction is a native media fix or attribution of the owner's stutter.

#### Forward result

V15 root `/home/wyatt/.cache/codex/laptop-youtube-ui-forward-20261007-haBFOB`.
Capture 19:59:47.685-20:02:34.705 UTC; exact-PID absence at 20:02:45.858 UTC.
Same pinned package Build `20261006175655`. One click at (88.700, 504),
21.376 -> 45.220 seconds, 71 ms between collector seeking/seeked events.
151.556 seconds observed, 130.007 seconds after listener seeked, 156 samples,
zero missed intervals, 4543 frames and zero dropped frames. All samples ready4;
minimum sampled buffered-ahead 14.526 seconds. Boundary gaps of 8/4/4 ms are
retained, not counted as playback stalls. No sampled counter resets.

Five native decoder/process/tab checkpoints, 31 workload RPCs, 36 resource
samples; peak sampled artifact 165276323 bytes and aggregate RSS 2478440448
bytes (shared pages can be counted repeatedly). AV1/854x480/software at all
decoder checkpoints. Same content/RDD PIDs at those five snapshots only.
Clean SIGTERM, 271 log bytes, zero drops, package postflight PASS, all 14
recorded PIDs absent. Native directories/build match before and after.
Export `laptop-youtube-ui-forward-2-export.json`: 88 allowlisted files,
SHA256 `0926c3f3ce7b820f3e5fc9ea7e0a34709f1257e79c361ec66bbbaec9e78380d9`.
Derived files: `youtube-ui-forward-{analysis,timeline,process-joins}.json`.

#### Backward result

V16 root `/home/wyatt/.cache/codex/laptop-youtube-ui-backward-20261007-dhXbHU`.
Capture 20:08:36.160-20:11:23.215 UTC; exact-PID absence at 20:11:39.290 UTC.
One click at (34.744, 504), 21.340 -> 5.234 seconds. Collector seeking/seeked
were 3 ms apart; the independently timestamped listener pair was 4 ms apart.
151.499 seconds observed, 130.009 seconds after listener seeked, 156 samples,
zero missed intervals, 4543 frames and zero drops. No sampled counter reset
or non-seek low-advance interval. All samples ready4; minimum sampled buffer
ahead 15.006 seconds. Its last short 458 ms sample interval is reported among
short intervals, not mistaken for an inter-segment gap or dropped frame.

Same AV1/854x480/software decoder observations, five native/process/tab
checkpoints, 31 workload RPCs and 36 resource samples. Peak sampled artifact
161674377 bytes and aggregate RSS 2486882304 bytes. Same content/RDD PIDs at
the five snapshots only. Clean SIGTERM, 271 log bytes, zero log drops, package
postflight PASS and all 14 recorded PIDs absent. Before/after native directory
and build receipts match. Export `laptop-youtube-ui-backward-2-export.json`:
88 allowlisted files, SHA256
`54b1f06b9e38904176ef128a3eca22986c6cc4f72f8469c21cc98b70ae389902`.
Derived files: `youtube-ui-backward-{analysis,timeline,process-joins}.json`.

Forward V15 and backward V16 are functional captures, not a same-harness
performance A/B or direction-cost comparison. The event latencies do not prove
a cache, decoder, GPU, compositor or network cause. No continuous process-reset
exclusion, audio assessment or physical black-frame observation is available.
The current signed-out software AV1/480p workload still differs substantially
from the historical owner's VP9/1080p60, extensions, build and video conditions.
Next match the affected video/stream and seek pattern; do not infer a fix or
repeat unchanged captures to seek a favorable number.

#### Verification

Scratch root: `artifacts/umbralink-control/seek-recovery/`. The final V16
pre-runtime combined gate passes 156 tests (`ui-v16-tests.log`) and scoped
Prettier checks pass. Five historical analyses reproduce exactly; a synthetic
long-UI analysis plus altered click/clock/target/event copies exercise the new
review path. V14/V15/V16 archive manifests preserve each source revision;
all have 32 runtime files, 71 parsed import edges and 29 syntax checks.
V16 archive SHA256 `433a9bca91dee760b5c6fc7b23b90d63097dc0f17a578f0be9a0119cac272f12`,
manifest `6c98b144f9a61c04b14b1af86927596489b3a870aad497f97618c89d05ad3d26`.
After the real captures, `ui-wave-final-tests.log` passes 157 tests including
exact reproduction of both new analyses/timelines/process joins and three old
timelines, plus rejection of the two new original failed captures. Documentation
lint is scoped to this report and the plan. Final source/evidence inventory is
`ui-long-evidence.json`; earlier inventories are retained as historical seals.
Runtime harness roots: V14 `youtube-recovery-v14-harness-20261007-gamuMw`,
V15 `youtube-recovery-v15-harness-20261007-CjWtD9`, V16
`youtube-recovery-v16-harness-20261007-4Yjtal`, all under the laptop's owned
`/home/wyatt/.cache/codex/`. The failed exports are
`laptop-youtube-ui-forward-export.json` (SHA256
`e58ccc26a7588162446337ed679e7570ecfc4e815b3eee020d196800484a4596`) and
`laptop-youtube-ui-backward-export.json` (SHA256
`c8f95e32216e990b125fc26beaf2d8ead738ad185490405017c31990b8ce2dfe`).

### Earlier Short UI Status

The actual progress-bar interaction probe now passes. One native-input click
on the owned laptop page produced trusted seeking/seeked events 113 ms apart
and moved playback from 2.988 to 45.261 seconds. Cleanup, package and before/after
native receipts pass; all 14 recorded processes were absent afterward. This
only establishes the short UI test path, not a fix or a long recovery result.
Three failed tooling attempts are preserved below. Daily desktop untouched.

The isolated laptop smoke and fixed control/forward/backward wave passed.
The reported prolonged stutter/recovery was not reproduced by their counters
and events. No product performance fix, native build, daily installation, or
desktop interaction occurred. The performance goal remains active. The owner
meant progress-bar seeking, not a YouTube search-box operation. Historical
pre-runtime sections below describe their respective earlier phases.

The subsequent short YouTube admission also passed, after a reproduced harness
timeout was corrected. It is deliberately not a seek/recovery result. The
fresh signed-out page selected AV1 at 854x480, unlike the historical owner
VP9/1080p60 observation. No codec, quality, extension, or GPU setting was forced.

The continuous YouTube control/forward/backward wave is now complete too.
Both seek cases reported zero drops over their 150-second observations and
did not reproduce the prolonged recovery. They used direct element seeks in
AV1/480p software playback, not the owner's progress-bar/VP9/1080p60 conditions.
All owned runs are terminal and cleanup checks passed. The next useful test
is a longer actual-UI recovery capture and closer workload matching, not a
claimed fix.

## Actual progress-bar probe

Scratch `youtube-ui.mjs` uses the existing `umbrafox.input.click` command,
not `video.currentTime` or DOM `.click()`. It inspects a unique visible slider,
bounded viewport geometry, ancestor visibility, hit testing, orientation and
ARIA progress before dispatch. If already visible, no reveal move is needed.
Hidden controls get one bounded pointer move/read sequence, never guessed
alternative selectors. The click is issued once. Same-document replies,
same retained video object, target-position tolerance and trusted ordered
seek events must all agree. The context-targeted input is not an atomic
document-pinned command; this was an otherwise unused owned tab.

No product/browser source, public interface, preference default, native build,
daily installation, codec/quality selection or personal profile changed.
The private session gained a same-document video replacement check and handles
inspection failure during close without losing cleanup. Metadata-only readiness
is allowed only as pending during an actual seek or in the paused close receipt;
it cannot satisfy seek completion. Event timestamps may legitimately follow
the latest one-second sample. They remain typed, ordered and bounded by the
collector's last observed time. No counter or timestamp was rewritten in evidence.

### Preserved attempts

All run roots start with `/home/wyatt/.cache/codex/laptop-youtube-ui-probe-20261007-`:

| Version | Suffix | Outcome |
| --- | --- | --- |
| V10 | `JhVHQ2` | Initial bar visible, hidden after reveal move; no click. Failed readiness, acknowledged cancellation. |
| V11 | `b0sPly` | One click reached 45.220 seconds; metadata-only pending seek wrongly rejected. Raw close was closed/clean, but host acknowledgment also rejected readiness. |
| V12 | `KxcBu9` | UI seek completed in 113 ms; host incorrectly required last sample 3008 ms to equal last event 3189 ms. Failed run retained. |
| V13 | `wVxCG7` | Entire short interaction, after receipts and cleanup passed. |

Each attempt has clean owned SIGTERM, package postflight PASS, 271 log bytes,
zero dropped log bytes and independently absent 14 recorded PIDs. Only the
last attempt reached the full after-checkpoint/native-root gates. These are
tooling corrections, not four performance trials or a best-run statistic.
The V10 visibility transition's exact cause remains unknown. V11/V12 failures
were verified against their exact saved state, not dismissed as browser failures.

Exports under `artifacts/umbralink-control/seek-recovery/`:

| File | SHA256 |
| --- | --- |
| `laptop-youtube-ui-probe-export-2.json` (V10) | `79be790c07ed9ee6f79fc06821889a75cc879abd8c2c38fd54ecec9dbd9eef1a` |
| `laptop-youtube-ui-probe-2-export.json` | `07c4be16584e529b8b1ffadbbee6dc79d7730910e5e502b2a390084ac1437562` |
| `laptop-youtube-ui-probe-3-export.json` | `6e534a9436ae31d10dcb59f5964a5e9030bcf82317636c826f3900288a7fa92a` |
| `laptop-youtube-ui-probe-4-export.json` | `b9a82324ea6acb8bb54fc1c3babcc230327ea790c7717a3c121ce88af8fe0d02` |

The first V10 export invocation had a missing CLI placeholder argument and
failed before reading evidence; the corrected `export-2` is authoritative.
That invocation's stderr is retained separately.

### Verified result

V13 capture ran 19:32:55.310-19:33:10.676 UTC. Build `20261006175655` from the
unchanged pinned baseline. Context 11/document 10737418243, browser PID 2129228,
controller 2129216. Independent exact-PID absence at 19:33:20.025 UTC.
43 allowlisted files/143898 bytes, with no profile/token/app-data export.
One click at content point (88.700, 504), no pointer movement, three geometry
reads, 16 workload RPCs, two native/process/tab checkpoints, five resources.
Peak sampled artifact 80777842 bytes; aggregate RSS 2462744576 bytes includes
shared-page double counting. Package postflight preserved 46 original files.

Before/after observations retained AV1/854x480; post-pause ffvpx software-decoder
receipt, zero native reported drops at that receipt. Neither this short test
nor a post-pause receipt establishes interval-wide smoothness, physical black
frames, decoder resets, GPU causes, network delay, or zero observer overhead.
Owner's historical VP9/1080p60 path remains unmatched.

V13 runtime archive: 31 files, 70 parsed module edges, 28 syntax checks,
45588480 bytes. Archive SHA256
`329d6e930f3fd6cf9eafe419b2ef4b86a35ef6a9e706e83ddd2a13de0b9e564e`;
manifest `de490ca98e8d908001751b2a522c6a5cd0a429836a5885c534303d3815486e01`.
Remote harness `youtube-recovery-v13-harness-20261007-r21g8Y` under owned cache.
Prior archives V10-V12 and failing-first logs are retained.

140 focused/source/host tests passed before the final browser run. Two saved
analysis tests additionally reproduce the new UI result and four old probe/wave
outputs exactly, reject seven corrupted copies, and reject the original three
failed attempts as successful runs. Actual V12 event/sample evidence has a
direct regression test. Final combined gate and formatting logs use prefix
`youtube-ui-final-`; derived result is `youtube-ui-probe-4-analysis.json`.
Final combined result: 142 PASS, ten-file explicit formatting PASS and
scoped documentation lint zero errors/warnings. Runtime source hashes still
match all 31 V13 manifest members after verification.

The next phase requires a genuine long UI action contract, not relabelling a
direct-element control result. Existing control validation correctly rejects
seek events. Preserve >=130 seconds after the actual click and continuous
document/video ownership, then improve workload matching before inferring a
product cause or changing native rendering code.

## Continuous YouTube diagnostic

The private session and host adapter are implemented in the unsealed scratch
`youtube-session.mjs` and `youtube-recovery.mjs`. They reuse the original
20/45/45/40-second sequencer rather than rebuilding its timing rules. The
direct fixture retains strict 1920x1080 admission; an explicit callback admits
the fixed YouTube content's actual adaptive dimensions. No product interface,
default, codec selection or extension setting changed.

This first sequence seeks by setting the existing video's `currentTime`.
It does not click or drag YouTube's progress bar, and therefore does not prove
that the player's additional interaction logic has been exercised. A negative
result must not be generalized to the owner's exact progress-bar symptom.

The existing browser-realm control route loads a temporary private frame script.
It retains the original document/video through short subsequent queries; no
page global, attribute or diagnostic event is installed. Queries pin browser,
document, nonce and ordered request IDs. The fixed 210-second child watchdog,
two-second cancellation wait, request/byte caps and existing owned-browser
cleanup bound the diagnostic. These timers do not establish OS cancellation.

There are 129 passing focused/integration tests in
`youtube-probe-partial-green.log`, including all old fixture tests. Coverage
includes actual generated source with the real sequencer/collector in a fake
clock, all three full schedules, short cancellation, stale documents, ordering,
caps, late completion, all host RPC/write failures, and unchanged legacy capture
budgets. `youtube-binding-red.log` preserves a receiver-sensitive message-method
test; closure wrappers remove dependence on borrowed native-method behavior.
This is a preventive contract check, not a reproduced Firefox binding defect.
Eight changed scratch files pass explicit Prettier checking.

### Cancellation probe

V8's first probe, `laptop-youtube-probe-20261007-sJYqNr`, failed a host assertion:
the real sequencer retained its aborted first observation, while the fake host
fixture returned an empty segment array. The session itself acknowledged close,
settled, paused playback and reported zero cleanup errors. Raw partial samples
remain preserved. Clean SIGTERM, zero log drops and all 14 recorded PIDs absent
were independently checked. This is a harness assertion defect, not stutter.

`youtube-probe-partial-red.log` records 17 PASS / 1 FAIL. The corrected host
accepts zero or one bounded, correctly timed aborted first observation, with
no seek action, and rejects malformed partials. Generated-source cancellation
now explicitly verifies that the real collector can retain the partial segment.
The full focused gate then passes 129 tests.

V9 archive SHA256:
`7f96aa2ca276da50c41bac58077dd7faa0b1b97a54f60dbc8b5ee281f4f79bb8`.
Manifest SHA256:
`c2be728cb1eabd53951993282576d40462b3fae415e5b6ba485e16b419e5dc3c`.
All 30 local/archive/remote files match; all 68 parsed static/literal dynamic
module edges resolve and 27 JS modules pass syntax checking. Earlier archives
and failures remain unchanged. V6/V7 were not launched.

The corrected probe, `laptop-youtube-probe-20261007-5ULKog`, passed from
18:55:32.127 to 18:55:47.120 UTC. Playback advanced 2.9516 seconds, then
cancellation retained one partial observation. Twelve workload RPCs and two
native decoder/process/tab checkpoints completed. Before/after native roots
and build receipts match the same owned directories and Build20261006175655.
Five resource samples passed; peak summed RSS was 2,459,189,248 bytes and
sampled artifacts 80,318,765 bytes. Clean SIGTERM, 271 log bytes, zero drops,
package postflight PASS, and all 14 recorded PIDs absent at 18:56:03.200 UTC.
The post-pause decoder receipt reports AV1/854x480/ffvpx software decoding and
one compositor/container drop; the probe is not a performance comparison.

Allowlisted export: `laptop-youtube-probe-2-export.json`, 38 files, 129,034 bytes,
SHA256 `cdee61ccb4e1a17f763343d762f05f5a7103e44385ebbfc04518e35a262bab43`.
Embedded hashes, directory receipts, tab joins, safety caps and cleanup were
rechecked in `laptop-youtube-probe-2-analysis.json`. An initial offline assertion
used the wrong terminal label (`complete` instead of the shared harness's
`pass`); its error is retained separately from the corrected analysis.

### Full direct-element wave

The same V9 sources and pinned Build20261006175655 completed one control,
one forward seek to 45 seconds, and one backward seek to 5 seconds. Each
uses a fresh owned browser; there is no restart inside a recovery interval.

| Case | Observation | After action | Reported frames | Reported drops | Seeking-to-seeked |
| --- | ---: | ---: | ---: | ---: | ---: |
| Control | 150.046 s | 130.019 s | 4,500 | 10 | No seek |
| Forward | 150.046 s | 130.019 s | 4,498 | 0 | 66 ms |
| Backward | 150.043 s | 130.019 s | 4,499 | 0 | 40 ms |

These are frame-counter differences, not measured display refresh or physical
presentation counts. No sampled counter reset occurred. Each has 154 visible
samples, zero missed sample intervals, and four segments separated by small
4-7 ms observer gaps. Those short segment-boundary intervals are retained but
not mislabeled as playback stalls merely because `currentTime` did not advance
within a few milliseconds. Excluding the actual seek-crossing interval, no
sample interval of at least 0.5 seconds advanced media by less than half its
wall duration. This one-second sampling cannot rule out subsecond jank.

Control drops occurred at approximately 1.019 seconds (one frame) and 6.019
seconds (nine frames), with no further increase. The native compositor counter
also remains at 10 from the first active checkpoint onward. Seek cases record
only the expected seeking/waiting/seeked/playing event group near the action;
control records no subscribed media event. Minimum sampled buffered-ahead
values were 15.00/14.30/15.01 seconds for control/forward/backward. All sampled
ready states were 4, dimensions 854x480, and active decoder receipts showed
software ffvpx AV1 in RDD. No resolution or active decoder-label change was
observed. Paused-before/after `shutdown` labels are not evidence of a recovery
reset during playback.

All five checkpoints per case retained the same content and RDD PIDs and exact
selected-tab/document joins. These are discrete observations, not continuous
reset exclusion. Each case completed 24 workload RPCs and 36 resource samples;
peak sampled artifacts were 163,498,950 / 163,784,458 / 149,583,165 bytes, below
the unchanged 256 MiB cap. Peak summed RSS was approximately 2.47/2.49/2.43 GB;
shared pages may be double-counted, so these are safety checks only. All runs
passed native-directory/build receipts before and after, profiler-OFF checks,
clean SIGTERM, package verification, 271-byte browser logs with zero drops,
and independent absence of all 14 recorded controller/browser/sample PIDs.

Remote roots and UTC capture intervals:

- Control: `laptop-youtube-control-20261007-6Hcx6R`, 18:57:21.671-19:00:08.756.
- Forward: `laptop-youtube-forward-20261007-QWQqyG`, 19:00:41.594-19:03:28.614.
- Backward: `laptop-youtube-backward-20261007-aqhVxk`, 19:04:00.395-19:06:47.399.

Roots are under `/home/wyatt/.cache/codex/` on wyatt-laptop. Each corresponding
`laptop-youtube-{mode}-export.json` contains 81 allowlisted files. SHA256 values:

- Control: `dc8335bf40b49db7bc11c3ead935b154325dfd677681368e9c8862247b2f7dbe`.
- Forward: `700b91ee248fd5751c69299bb196b33cb380d38f641d65728a1b8c803a292d71`.
- Backward: `7e90f5b31ec9ec3ebd93a1d6325c95b06704725347eb6e8f85934646f6cd06c0`.

All embedded hashes were rechecked. Derived `laptop-youtube-*-analysis.json`,
`youtube-*-timeline-reviewed.json` and `youtube-*-process-joins.json` preserve
the numerical checks, actual events, process IDs, caps and cleanup evidence.
The saved `review-youtube.mjs`, `timeline-youtube.mjs` and
`process-joins-youtube.mjs` accept an exported JSON path. Running them reproduced
all 10 derived probe/wave outputs exactly. Seven deliberately corrupted copies
(hash, native path, profiler, selection, resource cap, cleanup failure and
incomplete sequence) were rejected. `youtube-wave-review-checks.log` retains
those bounded Node subprocess checks; no browser was rerun for this verification.
No completed run was repeated to obtain better performance. This is negative
reproduction evidence for these workloads, not a comparative performance win.
Physical black frames, audio recovery, the actual progress-bar UI and the
owner's exact stream/build/extensions remain outside this wave's proof.
No personal profile/token/app-data/temp contents were exported, and the daily
desktop browser remains untouched.

## YouTube admission

The fixed public target is the Blender Foundation upload at
`https://www.youtube.com/watch?v=aqz-KE-bpKQ`. The new scratch `youtube.mjs`
uses the same pinned laptop baseline, fresh private installation/profile/
application-data/temp roots, and existing UmbraLink. There is no local fixture
server or request-timing evidence. It checks the exact selected page, video ID,
player/ad state and visible single video before playback, then collects
20 seconds of muted playback without seeking and pauses its owned test video.
No login, ad skipping, quality selection, extension changes, or daily browser
access occurred. Page state is checked again afterward, including actual video
object identity; raw replies are saved before host validation.

The standard 120-second capture remains unchanged: 105 seconds for work,
15 seconds for cleanup including the final report reserve, 256 MiB sampled
artifact cap. Driver/SSH watchdogs are 360/400 seconds. Five workload RPCs are
serialized; setup/discovery and shared before/after receipts are additional.
This short adapter has one post-startup native-directory receipt before
playback, not a second native-directory receipt afterward. Before/after tab,
document-bound media, and profiler-OFF observations are retained separately.

### Failed attempt and correction

The first real run, root ending `7G7m9G`, reached the intended video but stopped
with `umbrafox.script.execute timed out`. Its client request used the default
15-second transport timeout around a 20-second collector despite a longer
native script timeout. This is a demonstrated harness defect, not browser
freeze evidence. Its raw export, log, clean SIGTERM, package postflight, and
independently absent 14 recorded PIDs remain preserved in
`laptop-youtube-admission-export.json`.

`youtube-timeout-red.log` records 5 PASS / 1 FAIL for the missing transport
timeout argument. The corrected adapter explicitly passes 28 seconds to the
transport, 27 seconds to native execution, and 29 seconds to the enclosing
operation, all still constrained by the capture work deadline. No shared
timeout default changed. `youtube-timeout-green.log` has 107 PASS.

The six focused YouTube tests also exercise malformed/foreign/ad/player state,
each RPC/write failure, document changes, profiler activation, raw-preserving
replacement rejection, and actual collector/page-body VM execution for success,
rejected/hung play, and element replacement. An earlier replacement RED is
retained. Fakes do not establish site behavior; the runtime admission below
provides the separate integration result.

### Corrected runtime

Version 5 archive SHA256:
`6d8b6580c1f4f1df590089c9b2b296f653677110564cea6ad0634d3d2337e732`.
Manifest SHA256:
`4b2dc84e33635fdcaa919604402cf4bc488dcb9de3e6e4ca1b57ffd6302ec39d`.
All 28 archive/remote files and 24 module syntax checks passed. The inherited
manifest edge list describes the original closure; it is not a complete count
of the added YouTube module's edges. Its imports were separately checked.
Remote harness root ends `youtube-admission-v5-harness-20261007-cFcuDh`.

Corrected run:
`/home/wyatt/.cache/codex/laptop-youtube-admission-20261007-E0nVro`.
Capture: 2026-10-07 18:19:59.278 to 18:20:31.302 UTC. It passed once after the
timeout correction, with no favorable timing retry.

- 20,003 ms observed, 21 visible samples, zero missed intervals.
- Media time advanced 20.000268 seconds; 600 reported total frames, zero drops.
- All samples remained 854x480, playback rate 1, ready state 4, and unpaused
  until the intentional final pause. No subscribed media events were observed.
- The immediate post-pause native receipt reports
  `ffvpx video decoder (RDD remote)`, `video/av1`, hardware acceleration false,
  612 output samples, and zero native drop counts. This is not an interval-wide
  decoder trace. The paused-before `shutdown` label does not establish a reset.
- Exact document/context joins and selected target tab passed; before/after
  profiler observations were inactive. Boundary ad checks were false, not
  proof of continuously ad-free playback.
- Nine resource samples passed existing caps; peak summed owned RSS was
  2,368,172,032 bytes and sampled artifacts 154,523,621 bytes. RSS can double-count
  shared pages; these are safety observations, not comparative memory results.
- Clean SIGTERM, 271 log bytes with zero drops, package postflight PASS.
  All 14 recorded controller/browser/sample PIDs were independently absent
  at 18:20:38.720 UTC. Five-second sampling can miss transient processes.

The 34-file allowlisted export is `laptop-youtube-admission-2-export.json`,
SHA256 `711a0fa34f2083fbfd183cbd01fa35b5ddc4eb91f78cdaf17e0f53a111bf0ef2`.
Every embedded byte count/hash was checked. Derived assertions/results are in
`youtube-admission-review.log` and `youtube-admission-analysis.json`. No profile,
control-token, application-data, or temp contents were exported. Logs retain
sandbox EPERM and VA-API initialization messages; they do not establish a
network sandbox, no-upload result, or GPU use for this AV1 stream.

### Remaining YouTube test

This establishes that the corrected short collector works on the external
page. It does not test seeking, prolonged recovery, physical scanout, black
frames, audio continuity, or observer overhead. The low-resolution AV1 path is
not interchangeable with the owner's historical VP9/1080p60 path or the local
hardware-AVC fixture. The exact affected video and seek positions were requested
from the owner, without making them a prerequisite for isolated investigation.

Next, adapt the explicit long seek/recovery contract to this external page,
retaining raw partial evidence and document/video continuity rather than
silently reusing the owned fixture's fixed 1080p oracle. Observe buffering,
codec/dimensions and decoder/process transitions throughout the post-seek
window. Do not infer a reset from the reported black flash or change a GPU
preference before capturing the relevant transition. The shared 60-second
maximum request timeout cannot simply enclose a 150-second injected body;
long execution/observation needs a tested bounded integration contract.

## Laptop smoke and runtime admission

The laptop had no browser/build activity at initial admission, more than 11 GiB
available memory and 50 GiB free disk. The 46-file baseline package matched
its pinned manifest. Runs use fresh private installation/profile/application
data roots, existing UmbraLink, display :0, and no profiler or GPU-pref override.

Two failed smoke attempts are retained, not used as performance samples:

1. `laptop-smoke-export.json`: provenance tried to hash three shared fixture
   files omitted from the import-only runtime bundle. Failure occurred before
   browser launch; controller absence was independently checked. Version 2
   includes those explicit runtime reads, bringing the bundle to 27 files.
2. `laptop-smoke-2-export.json`: the real collector returned `read-error` before
   its first sample. The collector incorrectly required
   `VideoPlaybackQuality.corruptedVideoFrames`, absent from the upstream
   Firefox WebIDL. The owned browser exited cleanly; postflight verified all
   46 package files and all 12 recorded controller/browser PIDs were absent.

The narrow collector/validator correction treats that optional field as null,
not zero. Total and dropped counts remain mandatory; present invalid counters
still fail closed. `quality-red.log` preserves two expected failures;
`quality-final-tests.log` has 72 PASS. Only two scratch runtime files changed,
plus their tests; no browser interface or product preference changed.

Version 3 archive SHA256:
`e2147203c703f50b6cf1f09fcff6ce3e119079d46693acd34c075c43f245a9e5`.
Manifest SHA256:
`e416051ec36730bdb07b465f8e553b48a9224b9a66b80bec6c99144366ef9f84`.
All 27 source/archive/remote files verified; all JavaScript syntax checks pass.
Remote harness:
`/home/wyatt/.cache/codex/seek-recovery-harness-v3-20261007-xUGaVf`.

`laptop-smoke-3-export.json` records a passing one-second observation with
two visible samples, advancing playback, null corruption counter, and zero
observed drops. Native receipt reports 1920x1080 AVC with hardware-accelerated
FFmpeg decoding in RDD. This is not full-sequence or stutter-recovery evidence.
Clean SIGTERM, zero log drops, package postflight PASS, and all 12 recorded PIDs
absent were independently checked. Smoke root ends in `Yi6Xb9`.

Fixed long order: control, forward, backward, each with its own fresh browser,
but no restart within a seek/recovery observation. Runtime watchdogs are
360 seconds for the driver and 400 for SSH, with the existing 240-second
capture and cleanup reserves. Only allowlisted evidence files are exported;
no profile/token/application-data/temp contents are copied.

## Completed fixed wave

All three ran once after the corrected smoke, in the planned order. No
favorable timing retries, cap increases, or restarts within an observation.
Local exports and derived checks are in the same scratch namespace:
`laptop-{control,forward,backward}-export.json`, the corresponding analysis
files, `wave-summary.json`, and `wave-review.log`.

| Case | Observation | After action | Seeking to seeked | Total frame delta | Dropped delta |
| --- | --- | --- | --- | --- | --- |
| Control | 150.076 s | 130.062 s | Not applicable | 4,501 | 0 |
| Forward, about 20 s to 45 s | 150.056 s | 130.042 s | 80 ms | 4,497 | 0 |
| Backward, about 20 s to 5 s | 150.108 s | 130.079 s | 73 ms | 4,498 | 0 |

Each has 154 visible media samples, zero missed intervals, four exact progress
joins, five document/tab/process/decoder checkpoints, 24 workload RPCs, and
35 passive resource samples. All three scheduled checkpoint starts were less
than 2.3 ms late; that is scheduling evidence, not zero observer cost. Whole
frame deltas include segment-boundary progress, unlike sums of individual
segment deltas.

The two seeks each produced one trusted seeking/waiting/seeked/playing
sequence. No later waiting, stalled, emptied, error, or resize event was
recorded. The backward analysis has one mechanical low-advance flag: the
intentional rewind crosses that first one-second sample. It is retained in
the raw analysis, not classified as an additional stall or smoothed away.
No other one-second interval advanced less than 80% of its elapsed time.
This threshold is an analysis aid, not a validated stutter detector.

Active native snapshots consistently reported hardware-accelerated FFmpeg
AVC decoding in RDD, 1920x1080, with zero native decoded/sink/compositor drop
counts. Each case retained its content and RDD PID across the five snapshots.
The paused-before decoder description was `shutdown` in all three; this is
not evidence of a reset during the observed playback/recovery window.

All runs passed exact fixture/tab admission, profiler-OFF and inactive
userland checks, and post-startup private-directory/build receipts. They ended
with clean SIGTERM, zero lost log bytes, package postflight PASS and independently
absent controller/browser/sample PIDs (12 per run). Peaks were approximately
1.82 GB summed owned RSS and 145.9 MB sampled artifacts, below the existing
caps. Summed RSS can double-count shared pages and is safety evidence only.
Logs retain the sandbox EPERM and successful VA-API initialization messages.

The combined local regression suite after the optional-counter correction
has **411 PASS**, no failures/skips/cancellations, in
`runtime-final-tests.log`. Explicit four-file formatting and all archive
syntax/hash checks pass. No native browser build or product change occurred.

### Interpretation and next step

This is a negative reproduction on one silent direct-AVC fixture and a pinned
diagnostic baseline, not proof of smooth physical scanout or a YouTube fix.
No pixels or audio were captured; a brief black flash, transient internal
transition, different codec, or adaptive-stream behavior remains untested.
The repeated media content at 90 seconds is not a reset/recovery signal.

Next, use an explicitly owned laptop YouTube tab and identify its actual codec,
resolution, media-source/decoder state, and buffer/counter transitions around
seeking. Keep the profiler off initially and do not alter extensions or GPU
preferences merely to get a smoother run. Match the owner's affected stream
when possible before claiming equivalence. A desktop attachment still needs
the promised heads-up; no active daily tab is to be navigated or sought behind
the owner's back. Audio continuity and whether quality changes at the reported
black flash are still useful missing observations.

## Host capture integration

The next continuation added the explicit host capture contract in
`tools/umbrafox/tests/readback/capture.mjs`, its regression tests, and scratch
`capture.mjs`/`driver.mjs` plus two test files. No browser/SSH/profiler/deployment
or personal-profile operation occurred. This prepares a reproduction; it does
not demonstrate a video performance improvement.

Only `capturePlan: "seek-recovery"`, the three exact headed mode names, no
timeout override, and the standard artifact policy can select 240 seconds.
The budget reserves work/cleanup/terminal boundaries at 225/238/240 seconds.
Legacy 30-120-second capture rules remain unchanged. Both pre-start checks
require at least 165 seconds of work time remaining. Tests cover fractional
cutoffs, invalid/backward clocks, wrong plans and displays, unchanged short
budgets, and final reporting after work expiry or oversized fixture evidence.

The capture joins all four progress receipts to the terminal result before
acceptance. It retains the raw replies before checking document, tab, native
directory/build, profiler and process-window admission. Observation bundles
run before/after and at fixed host-start offsets of 21, 65 and 110 seconds.
Each contains a page clock/document check, native decoder, process snapshot and
selected-tab inventory. Host RPC intervals remain explicit; these clocks are
not silently mixed with the page's action time. Missed slots over five seconds,
early terminal results, cancellation and any RPC/write failure stop the run.
No hardware or decoder-name stability is assumed from an earlier snapshot.

A failing test exposed a separate harness defect: failure writing final
`run.json` replaced an earlier preflight failure and left SIGINT/SIGTERM
handlers attached. The correction preserves the primary error, records the
terminal-write error where possible, and always removes those handlers.
`terminal-cleanup-red.log` and `terminal-cleanup-green.log` retain the evidence.
This is not attributed to the owner's rendering symptom.

The driver pins the previously verified baseline package, BuildID
`20261006175655`, manifest
`09261b9b755eb2295aa92393ddaab215ab8936cb79ebd27699ab8695ca3d1eae`.
It only admits wyatt-laptop display :0, creates a private installation, and
reuses installation mutation/owned-root absence checks. There is no claim that
this baseline equals the owner's daily installation. The 60-second smoke
entrypoint checks readiness and one second of actual collector/playback; the
full page start/result sequence remains for the subsequent long cases.
External 360-second driver and 400-second SSH watchdogs are launch requirements,
not yet exercised and not supplied merely by the driver's limits object.

Final `host-final-tests.log`: **408 PASS**, no failures/skips/cancellations,
under a 30-second watchdog. It covers shared performance/readback capture,
legacy readback, installation driver and all seek tests. These include real
loopback/temporary-filesystem and harmless child-process tests, not Firefox
runtime. The earlier broader `capture-integrated.log` had 403 PASS and also
compiled/executed the existing standalone DMABuf/import/fence unit harnesses;
it must not be described as JavaScript-only or a native browser build.
Exact two-file registered lint is clean after three test-style corrections.
Explicit Prettier checking covers all seek files and the shared pair.

`host-runtime-inputs.json` enumerates 24 runtime files, 48 import edges and
45,505,188 source bytes, including the media. The initially strict scan stopped
on two literal dynamic imports in the shared runner; both are now included.
A prior one-line scanner syntax error is retained as tooling evidence only.
Every source and archived member was independently rehashed, and all 23 modules
pass syntax checking. `host-runtime.tar` is 45,527,040 bytes, SHA256
`a3c39d88e739abc7704c0b31e0eab08c0b658a38930f742ed4bb99ce1128bfd4`;
manifest SHA256
`d1a38bc95228d637ee6494ab116059b5bfff0d899d64977b833ffdd27f5cf134`.
The archive is local only. Remote identity/transfer verification, current host
readiness, actual package admission, isolated short smoke and the fixed
control/forward/backward wave remain required. No favorable retries or cap
increases are authorized by a test failure.

## Fixture and media follow-up

The latest continuation completes the supplied-data/HTTP portions of phases
1-2 and the asset portion of phase 4. It does not change product code or connect
to a browser. Scratch files are under
`artifacts/umbralink-control/seek-recovery/`, which remains unsealed.

`server.mjs` serves the owned page, stylesheet, three actual modules and media
on 127.0.0.1 with an unpredictable per-run path, exact Host validation, and
same-origin CSP. It reuses the existing single-range parser. It bounds requests
(128), connections (8), concurrent receipt bodies (4), readiness (4 KiB), each
of four progress receipts (64 KiB), and terminal body (1 MiB). Media is capped
at 64 MiB and scheduled response bytes at four media copies plus 64 KiB, no
more than 256 MiB. Scheduled bytes are not a measured wire-byte count.

Readiness, the host start barrier, and terminal delivery are single-use.
Malformed, duplicate, oversized, disconnected or aborted receipts fail
explicitly. Parsed observations survive later validation failures. A closed
fixture cannot publish late receipt state. Shutdown initiates listener and
connection cleanup together; callers still need a bounded host cleanup wait.

`bootstrap.mjs` uses an owned page-local AbortController, a 210-second page
timer, and bounded readiness/POST waits. It waits for host admission before
playback, publishes completed segments, and sends one terminal result attempt.
It removes its own listeners/timer. This ordinary page module neither adds
browser interfaces nor relies on an inaccessible injected-script abort signal.
Page timers are not protection against a hung browser process/event loop.

`validation.mjs` validates exact record fields, finite ordered timestamps,
typed samples/counters, four segments, action direction, trusted seek events,
visible single-video observations and zero cleanup errors. Missing optional
counters remain null. Raw incomplete/error receipts are preserved but cannot
pass this complete-result validator. The future driver must also prove actual
native identity, selected document, progress/result joins, and owned cleanup.

Two new diagnostic defects were reproduced before correction. Fractional
observer setup could leave less than 130 seconds after the actual seek; the
last nominal 40-second segment now extends to the remaining deadline, bounded
by 50 seconds. A 0.5 ms setup test requires 40,001 ms. Closing while a terminal
body was incomplete could otherwise look clean; receipt-header arrival and
accepted-result completion are now separate states. RED and GREEN evidence
is retained in `recovery-boundaries-red.log` and `server-sequence-green.log`.
These are fixture defects, not established causes of the owner's stutter.

Partial publication happens before segment validation and must succeed before
another action/segment. Rejection, timeout, and late rejection tests verify
there is no subsequent seek. Gaps remain explicit. Observer/publication cost
is unmeasured and must be present in the control, not assumed free.

### Media proof

`video-180.mp4`: 45,212,087 bytes, SHA256
`585de5a1064ad6dfd7f365346a3c3b11b68ebcf1e94c9b9ba4da7040ee190e97`.
Existing ffmpeg stream-copied the pinned 90-second synthetic clip twice without
re-encoding: H.264 High, yuv420p, 1920x1080, 30 fps, 180 seconds, no audio.
ffprobe packet checks verify both compressed halves against the original,
continuous DTS, complete unique PTS and correct second-half offsets. Bounded
ffmpeg decoding completed all 5,400 frames with no stderr errors; the two
2,700-frame decoded checksum sequences are identical. This is ffmpeg evidence,
not Firefox/RDD/GPU decoder admission.

The source SHA256 is
`aac5b2c571eff675332728d94291137bf184c41644d7beb6f8467fee05907d27`.
Creation/decode/probe outputs are retained, and `media-proof.mjs` pins both
asset hashes plus output size. `media-proof-final.json` records the successful
recheck. The repeated-content boundary at media time 90 seconds is deliberate
and must not be interpreted as a recovery/reset. At steady normal playback it
falls near 90/65/105 seconds of control/forward/backward wall time respectively.

### Verification and remaining gates

`fixture-final-verification.log`: **60 PASS**, zero failures/skips/cancellations,
using a 30-second outer watchdog and strict unhandled-rejection handling.
Coverage is 18 collector, 19 sequencer, 13 server, 4 bootstrap, 4 validator and
2 media-proof groups. The bootstrap VM uses real loopback HTTP but a synthetic
sequencer; the separate actual collector/sequencer integration uses fake media
and clocks. Neither is a real-browser test. The actual 180-second asset is also
range-served byte-exactly in the HTTP tests.

All 13 JavaScript files pass syntax and explicit Prettier checks with the
artifact ignore path disabled. Initial missing-module failures were scaffolding
RED, not product failures. An initial Host-negative test used fetch's ignored
Host override; it was corrected to raw node:http and is not claimed as a server
bug. Other retained negatives cover malformed schemas, timeline/seek corruption,
request/response/body limits, EOF, abort, and late publication.

Next is the explicit 240-second host adapter/driver, including bounded writes
of worst-case partial snapshots, progress/result identity joins, legacy budget
regressions, and real cleanup failure tests. Existing 120-second defaults are
unchanged. Static dependency/package admission and a short isolated Firefox
integration gate must precede the fixed laptop control/forward/backward wave.
No browser, profiler, SSH, native compilation, deployment, personal-profile,
index or staging operation occurred in this fixture phase.

## Owned-page sequence follow-up

The next continuation implemented the first phase of the
[seek-recovery plan](../../plans/seek-recovery.md), without starting runtime.
New scratch files are `sequence.mjs` and `test/sequence-spec.mjs` in the same
namespace. Three immutable cases use the same 20/45/45/40-second observation
segments: control makes no position change, forward seeks to 45 seconds after
the baseline, and backward seeks to 5 seconds. Each has 130 seconds of
post-action observation in the same document and video object.

This sequencer is for the owned fixture only. Unlike the passive collector,
it deliberately starts playback, performs the selected seek, and pauses on
exit. It has not been injected into YouTube or the daily browser. The planned
owned-page module has its own cancellation signal, avoiding reliance on an
unexposed UmbraLink sandbox signal. At this earlier milestone, actual
server/bootstrap wiring remained open; see the completed follow-up above.

The post-baseline observer is installed before changing currentTime. A
control action receipt records the same boundary without a seek. Native video
object and document references are checked at segment boundaries; local
observer IDs are not treated as cross-segment identity proof. Each segment's
raw clock, receipt time and preceding gap remain in the report. No subtraction
or smoothing hides the gaps.

Initial media must be visible, paused at zero, normal rate, not looping,
muted, healthy 1920x1080, and at least 180 seconds long. Playback and each
observation have bounded page-timer waits and abort handling. These page timers
are still not a host watchdog. A late rejection is handled, and a late result
cannot append records or trigger a subsequent action after cancellation.

Review found a real diagnostic admission error: boundary-only checks could
accept a segment whose intermediate sample was hidden, replaced, paused,
ended, or errored. The failing test is retained in
`sequence-intermediate-red.log`; the correction checks the recorded samples
as well as current media state. Another failure in that run was a fake-window
setup gap (missing networkState/listener multiplicity), not a product defect.
The initial missing-module failure remains scaffolding evidence only.

Final combined result: 33 tests pass, zero failures/skips/cancellations, in
`sequence-final-tests.log`. Fifteen new groups include all three schedules,
abort/pagehide, playback rejection, seek/cleanup exceptions, hung play/observer,
late rejections, malformed metadata, visibility/media transitions, and gaps.
The actual collector plus sequencer retain 21/46/46/41 samples in each fake-clock
case, with seeking/seeked events present for the two seek cases and absent for
the control. Timers and page/media listeners are empty after each successful
integrated case. This does not demonstrate real Firefox playback or recovery.

No shared harness, browser/native source, package, profile, or installation
changed. At that earlier milestone, the longer media asset, loopback
server/start/result protocol, strict
untrusted-result validator, fixed 240-second host capture/cleanup contract, and
laptop runtime remained pending. The existing 120-second harness limit remains
unchanged. Do not launch a long test with the old driver/watchdogs.

## Owner observation

The owner used the video's progress bar to change playback position, meaning
seek, rewind, or fast-forward. Playback became choppy. Roughly one or two
minutes later the picture briefly went black/flashed for a few frames; when it
returned, playback was immediately smooth.

This is a reported sequence, not yet a captured or independently reproduced
event. Audio continuity and any simultaneous quality/resolution change are
unknown. The flash is not proof of a GPU reset, decoder restart, or browser
process replacement. Do not turn those hypotheses into diagnoses.

The daily desktop browser remains protected: no close, restart, navigation,
seek, preference change, or test attachment without the required heads-up and
permission. The laptop remains the preferred authorized isolated test target.

## Why this changes the investigation

Recent continuous-playback measurements do not cover this sequence. The
48-second callback-delivery tests in
[the October 6 report](2026-10-06-callback-delivery.md) did not reproduce a
seek followed by a one-to-two-minute recovery. The forced permanent RDD-loss
test in [the descriptor report](2026-10-06-descriptor-availability.md) tests
error parity, not automatic recovery after an ordinary seek.

The latest [producer-fence comparison](2026-10-07-producer-fence-playback.md)
passed its regression criteria but failed its minimum CPU-benefit criteria.
It must not be presented as an accepted stutter fix. Its sealed artifacts
remain untouched. The script-cache investigation is paused behind this more
specific owner-reported symptom; no cache change was implemented here.

## Scratch collector

Files, relative to the repository:

- `artifacts/umbralink-control/seek-recovery/collector.mjs`
- `artifacts/umbralink-control/seek-recovery/test/collector-spec.mjs`

`collectSeekRecovery(target, durationMs = 45000, signal)` is self-contained
for later execution in a private control sandbox. It requires an abort signal;
accepted segment duration is 1,000 through 50,000 milliseconds.

It observes existing video elements once per second and records existing
media events. Samples contain playback position/rate, readiness/network state,
paused/seeking/ended flags, dimensions, buffered intervals, available frame
counters, playback-quality counters, error code, and visibility. Missing
optional counters remain `null`, not fabricated zeroes. Events include
seeking, seeked, waiting, playing, stalled, resize, metadata/data load, emptied,
error, and ended; their trust flag is retained.

Per-segment weak identities distinguish the same element from a replacement,
including an earlier element reappearing. The collector does not read URLs,
titles, source strings, or error messages. It does not seek, play, pause, load,
read pixels, request frame callbacks, query layout geometry, mutate DOM
attributes, or install public globals/prototype replacements.

Bounds are four concurrently observed videos, eight distinct elements,
52 samples, 256 events, and 16 buffered intervals per video. Overflow ends the
segment as incomplete rather than silently dropping required evidence.
Delayed polling skips and counts missed intervals instead of catching up in a
burst; fractional early wakes re-wait for the fixed monotonic deadline.

Completion, abort, pagehide, malformed reads, and capacity failures attempt to
remove all owned listeners and the timer. Removal failures are counted, not
hidden. Failed cleanup after otherwise normal completion is explicitly
`cleanup-failed`; another primary failure remains primary with its cleanup
error count. `lastObservedAt` is the last observed relative timestamp, not a
claim about the exact finish or cleanup time.

Sample/event arrays are encoded as JSON strings to fit the existing control
serializer's node limit. The maximum-count fixture passes the actual local
serializer twice and is below 256 KiB. This is a fixture measurement, not a
new independent byte-limit guarantee for all possible numeric values.

## Verification

Final command, with output preserved in `final-tests.log`:

```sh
timeout 10 node --test --unhandled-rejections=strict artifacts/umbralink-control/seek-recovery/test/collector-spec.mjs
```

18 tests pass, zero failures, skips, or cancellations. Both files also pass
`node --check` and explicit-file Prettier checking with the ignore path set to
`/dev/null`, so the ignored artifact directory is actually checked.

Coverage includes seek/event sequencing, no playback writes, element
replacement/reappearance, early/late wakes, abort, pagehide, invalid input,
capacity, missing counters, getter failures, cleanup failures, abort reentry,
backwards/nonfinite clocks, self-contained VM execution, and transport encoding.
These are supplied-data tests, not browser or Firefox-parity certification.

Failing-first evidence is retained. The missing-module initial failure is
scaffolding evidence only. Cleanup tests then exposed listener-removal failure
leaving the promise unresolved, startup listener failure leaving an abort
listener, and abort reentry allowing work to continue. The original 10-second
outer timeout is saved; the bounded rerun has two failures and one timed-out
test, followed by the passing corrections. These were defects in the new
diagnostic helper, not established browser defects.

## Integration limits

The helper is not installed, attached, or connected to a runtime driver.
Existing `executeControlScript` in
`toolkit/components/umbrafox/UmbrafoxControlScript.sys.mjs` has an internal
abort signal and a 60-second maximum timeout, but does not supply that signal
to the executed body. Signal ownership and cancellation must be integrated
and verified; merely serializing this function is insufficient.

The current local capture budget in
`tools/umbrafox/tests/readback/capture.mjs` is capped at 120 seconds including
cleanup. It cannot silently be stretched into a long recovery experiment.
Separate short segments also do not by themselves preserve element identity
or prove gap-free coverage across boundaries. A stalled event loop can delay
page timers; those timers are not an independent process-lifetime watchdog.

One-second samples can miss transient replacements, short stalls, and black
frames. Media events and counters are observations, not causal proof. A
complete empty/hidden-page segment is not smooth-playback evidence. Actual
observation overhead, DOM/Xray behavior, cancellation, and cleanup are still
unverified in Firefox. A failed listener removal may leave a stopped callback
attached; the helper reports that gap rather than claiming leak-free cleanup.

No product or default web surface changes here. VM tests verify no new target
properties for the fake environment, not universal invisibility or zero
observer cost. Any eventual diagnosis must preserve normal Firefox interfaces
and avoid diagnostic markers in page-visible objects or attributes.

## Original experiment proposal

Use the same browser session for an uninterrupted control and forward/backward
seek observations, keeping at least 120 seconds after the final seek. Design
the total deadline, resource/evidence bounds, owned cleanup, and cancellation
before launching. Do not relaunch the browser between the choppy and recovered
states. The original short local clip and capture budget were insufficient;
the longer asset is now verified, but the host budget/driver revision remains
open. Do not silently loop the video or change playback rate.

Start without the profiler because prior profiling had material observer cost.
Identify the actual package, document, media element, codec/decoder/backend,
and rendering path. A video-to-canvas fixture is not automatically YouTube's
direct video presentation path. Existing private media-debug and process
diagnostics can supplement the passive sequence at justified boundaries,
without collecting unrelated tabs or claiming their cost is zero.

Discriminating observations to seek:

| Observation around recovery | What it can help distinguish |
| --- | --- |
| Waiting/readiness changes with diminishing buffered media | A buffering lead, not proof of network or interception cause |
| Dimension, codec, decoder, or process-identity changes | Format/reconfiguration/recreation leads requiring exact joins |
| Stable element ID replaced by a new ID | Element replacement within one observed segment |
| Decoded counters advancing while presentation stalls | A delivery/composition lead, not GPU-reset proof |
| No observed identity/state change | Does not exclude unobserved internal transitions |

An audio-continuity report and quality-change observation would narrow the
comparison. The immediate engineering question is what changes at recovery,
not which speculative reset or cache toggle might hide the symptom.
