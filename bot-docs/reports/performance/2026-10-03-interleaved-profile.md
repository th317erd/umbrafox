# Interleaved Layout: Sampling Attribution

## Decision

Keep the inline inactive mutation-gate candidate uninstalled. The profiles
localize most sampled main-thread work to synchronous style/layout, but do not
explain the small unprofiled slowdown. Profiling reverses the observed A/B
direction in this four-process diagnostic. No layout optimization, GPU claim,
YouTube diagnosis, regression clearance or installation follows from it.

The next useful experiment is a fixed, profiler-OFF laptop comparison with
identical-build controls alongside A/B, retaining content-process CPU deltas.
That can test whether benchmark drift is comparable to the observed difference.
Do not alter layout flush semantics or pool profiled and unprofiled timings.

## Inputs And Scope

This follows [the isolated unprofiled comparison](2026-10-03-interleaved-inline.md).
The unchanged 46-file pair differs only in `libxul.so`; JavaScript, resources,
executable and INIs are common. Both report BuildID `20261003071500`.

| Variant | libxul SHA256 | GNU build ID |
| --- | --- | --- |
| A, static-pref mirror | d00138528b1410b81405fc9533b8771a8284ec98e6968a2bce313bc2177c4231 | 9be8527d27b64ed4999b502e44c55a2b |
| B, inline inactive gate | 1e2e164e54d826958361ccff1e4a75bb1c92814f9b87877ab340c3bc56f7f2fb | 3d0df43839ec8175c982b56a6cad7072 |

Pair proof SHA256:
`92cc0076f575b28b93c87c1135df544e2630e25c57d2bb40d2d31cfd280e2d86`.
Both local trees and the runtime harness hashes were checked after execution.

The unchanged version-6 `layout-interleaved` Window fixture runs 12 warmups and
16 trials, with a 20-ms wait between samples. Each sample alternates a class
assignment and `offsetWidth` read for 64 rounds over 32 rows: 2048 checks and
checksum 163840, with initial/final width 64. Script SHA256 remains
`9f4b94551b761261c756d4684c62cf36cb0b8dfcedfbea85561f6ac4c17c246d`.
No instrumentation was inserted in the timed loop.

Only `profile-capture.mjs` and its spec changed in the project test tooling:
reuse this fixture for OFF or sampling-only capture, reject marker-enabled
capture for this workload, and validate its existing result contract. Mixed
and calibration routes remain covered. No native or product implementation,
public interface, default, owner profile, extension, launcher or installation
changed. Headed laptop/GPU testing still requires separate consent.

## Fixed Four-Process Diagnostic

Order was fixed before execution: A OFF, B sampled, A sampled, B OFF. All four
fresh isolated headless laptop processes passed. They ran October 4 UTC,
00:37:09-00:38:07, which is October 3 in Phoenix.

| Order | Variant | Profiler | Median trial, ms | Whole workload, ms | Content CPU delta, ms |
| ---: | --- | --- | ---: | ---: | ---: |
| 0 | A | OFF | 41 | 1755 | 1206.106287 |
| 1 | B | Samples only | 47.5 | 1920 | 1539.734637 |
| 2 | A | Samples only | 55.5 | 2149 | 1789.911220 |
| 3 | B | OFF | 45.5 | 1862 | 1319.381754 |

The OFF pair has B 10.98% higher; the sampled pair has B lower. A sampled/OFF
medians differ by 35.37%, B by 4.40%. These are single-process, order-confounded
observations, not calibrated profiler overhead, independent trial replicates or
a significance test. The earlier 18-process experiment remains separate.

CPU deltas were independently recomputed from same-PID, same-window-list,
nondecreasing integer nanosecond counters in the before/after snapshots.
They cover the whole content process, including other threads and control work;
they are not timed-loop-only, main-thread-only or frequency-normalized CPU.

## Profile Attribution

| Main-thread sample observation | A | B |
| --- | ---: | ---: |
| Active samples | 802 | 685 |
| Including idle | 1080 | 966 |
| Layout | 740 (92.27%) | 623 (90.95%) |
| Reflow, within Layout | 404 | 346 |
| Style computation, within Layout | 243 | 197 |
| DOM | 44 | 50 |
| JavaScript | 9 | 8 |
| Graphics | 2 | 1 |
| GC/CC | 1 | 1 |
| Address-only self samples | 37 (4.61%) | 32 (4.67%) |

Sampled stacks include `offsetWidth`, `Element::GetOffsetRect`,
`PresShell::DoFlushPendingNotifications`, `ProcessReflowCommands`,
`ProcessPendingRestyles` and `Servo_TraverseSubtree`. Their respective inclusive
counts for the final four functions are A 745/430/307/244 and B 631/366/255/211.
Nested inclusive counts must not be summed. Complete function self counts and
category counts independently reconcile to active totals.

The upstream `Element::GetOffsetRect` implementation obtains its frame through
`GetPrimaryFrame(FlushType::Layout)`, consistent with this fixture's deliberate
write/read alternation. [Searchfox definition](https://searchfox.org/firefox-main/rev/d0f18859d99ecb16f4c5d641b35a5f3bdb7b4f36/dom/base/Element.cpp#6994-7014)
and generated permalink output are preserved. This is upstream source context,
not a claim of whole-file deployed source equality. Searchfox advertises an
update from installed 0.18.0 to 0.20.4; no update was performed.

No `UmbrafoxUserlandMutation` function row appears in either sampled function
list. An absent sampled symbol does not prove no execution, zero overhead or
absence of an inlined cost. Likewise these headless profiles cannot attribute
the owner's intermittent video stutter, GPU waits, extension cost or networking.

## Clocks, Symbols And Analysis

Only profiler-cli 0.10.0 parsed raw profiles. Supported CLI exports were analyzed
offline; raw profile files were only bounded, copied and hashed outside it.
Each load used its own named session and explicit loopback Samply endpoint,
with the matching sealed variant supplied as the symbol directory. Server logs
record the matching GNU build-ID and libxul path. Full DWARF companions were
unavailable and some system symbols remained unresolved.

The fixture URL/window list and content PID agree before/after; receipt context
and document agree with capture metadata. CLI process/thread inventory identifies
exactly the target GeckoMain. This is not raw-profile document metadata proof or
a cross-profile identity join based on equal numeric document IDs.

| Variant | Content PID / CLI thread | Raw process bracket, ms | CLI normalized input, ms |
| --- | --- | --- | --- |
| A | 591317 / t-233 | 12019.163055 to 14179.559187 | 831.198071 to 2991.594203 |
| B | 590875 / t-230 | 11819.963699 to 13750.532823 | 788.268365 to 2718.837489 |

CLI zoom inputs subtract `context.rootRange.start`; returned raw view ranges
must equal the native bracket. Both complete function exports and status retain
that exact range without stack filters. The outer bracket includes warmups,
waits, setup/removal, and control/snapshot overhead, not just timed trials.
Requested/observed sampling configuration agrees, and supported searches find
zero `Preference Read` and zero workload `dom-window-` UserTiming markers.

Local symbol servers used fresh private caches and explicit loopback addresses,
an 8-GiB address-space limit, 256-MiB file-size limit, and 180-second SIGINT
watchdog. This configuration is not a network sandbox or packet-level proof.
Neither default external symbolication nor a browser profiler UI was requested.

## Verification And Cleanup

All 112 sample oracles pass: 48 warmups and 64 trials. All 20 resource snapshots
pass their existing absolute and relative caps. Maximum sampled artifact size
is 202936207 bytes, not a continuous or final peak. Existing 105/120-second
work/total deadlines, standard/profiler artifact limits and the 24-MiB profile
copy cap remain unchanged.

Every browser exited through clean owned SIGTERM with zero dropped log bytes.
Each 182-byte log contains only the retained EPERM user-namespace warning,
headless notice and SWGL framebuffer mapping warning. At 00:46:12.289 UTC,
all five recorded browser/controller roots were absent. This is not exhaustive
descendant or no-network proof.

Both profiler daemons stopped successfully and both symbol servers exited 0.
At 00:46:12.520 UTC exact PIDs 2004358, 2004383, 2004805 and 2004830 were absent;
owned sockets and listeners on 37523/37524 were absent as well. No owned runtime,
profiler, symbol server, build or test remains active at this checkpoint.

Failing-first workload admission tests precede the adapter change. Final
combined tooling: 70 pass, zero failures, 13.639 seconds. Exact two-file lint:
zero errors, warnings or fixes. Saved-data replay rejects corrupted native
identity, clocks, configuration, counts, copied INIs and resource evidence.
Initial lint and saved-loader failures remain preserved. The source delta is
reviewed against its pre-edit archive, since these files are untracked and an
ordinary Git diff would omit them. All 27 bundled hashes and the previous
599-file evidence seal pass; staged index bytes remain unchanged.

## Evidence

- Local run exports: `~/.cache/codex/interleaved-profile-evidence-20261003-7N7bTZ`:
  131 whitelisted files, 14482928 bytes, plus `evidence.sha256`.
- Laptop captures: `~/.cache/codex/interleaved-profile-20261003-7N7bTZ`.
- Laptop harness: `~/.cache/codex/interleaved-profile-harness-20261003-rnuMdO`.
- CLI exports and symbol logs: `~/.cache/codex/interleaved-profile-symbols-20261003-A-5rnSbp`
  and `~/.cache/codex/interleaved-profile-symbols-20261003-B-WbM0UG`.
- A profile: 7408205 bytes, SHA256
  `149b5b12f34564a2f0b6ff67c80b2d4a49297c5d0342988eb70f62ca9d33c454`.
- B profile: 6715126 bytes, SHA256
  `f33e8a12ffecf202c068873147a502edc54c86849483ddc6b329a0b39ead8c2e`.
- Scripts, tests, before-source archive, reviewed diff, logs, CPU deltas,
  harness manifest/archive and cleanup receipts:
  `artifacts/umbralink-control/*interleaved-profile*` and matching test files.
- Final seal: `artifacts/umbralink-control/interleaved-profile-final.sha256`.

The owner browser is untouched. The broad performance goal remains active.
