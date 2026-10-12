# Staged Versus Immediate Uploads

## Decision

The fixed A1/B1/B2/A2 laptop comparison passes all 29 unchanged regression
criteria, but demonstrates no meaningful performance benefit from immediate
uploads. Elapsed-normalized joined-process CPU is only 0.031% lower, while
within-mode maximum/minimum spreads are 1.203% staged and 1.525% immediate.
Four-copy draw medians and P95 are unchanged. Keep the existing default.

All sixteen phases report zero dropped video frames, and all final native
decoder, sink, compositor and container drop counters are zero. Eight startup
callback gaps remain across the four runs. This is not a stutter fix, evidence
that the GPU never waits, or proof of the renderer's actual upload path. No
capture was repeated, excluded, pooled with older results or replaced.

The preceding exact video, composited-image and decoder-loss gates passed in
both modes. Those remain separate correctness evidence. This comparison adds
unprofiled timing, not a new optimization or broader release acceptance.

## Measurements

A configures `gfx.webrender.pbo-uploads=true`; B configures it false before
launch. Both use the same normal descriptor-borrow package, GPU import ON,
profiler OFF, hardware WebRender, Intel Iris Xe RPL-P, Mesa/iris 25.2.8.0 and X11.
Both use hardware ffmpeg/RDD H.264 decoding. No hardware acceleration is disabled.

The existing owned 1920x1080 H.264 clip plays for 48 seconds into a 320x180
default canvas. Four 12-second phases perform 1/4/4/1 copies per video callback.
The collector, nine workload controller requests and page timing precision are
unchanged. No per-frame readback, marker, hash, GPU wait or profiling is added.

| Measurement | A1 Staged | B1 Immediate | B2 Immediate | A2 Staged |
| --- | ---: | ---: | ---: | ---: |
| CPU window, seconds | 48.097 | 48.090 | 48.088 | 48.079 |
| Joined CPU, seconds | 26.659 | 26.604 | 27.009 | 26.970 |
| CPU seconds per elapsed second | 0.554280 | 0.553224 | 0.561661 | 0.560949 |
| Browser CPU, seconds | 18.729 | 19.055 | 19.457 | 19.482 |
| RDD CPU, seconds | 2.049 | 1.924 | 1.884 | 1.858 |
| Web-content CPU, seconds | 5.665 | 5.418 | 5.450 | 5.415 |
| Four-copy medians, ms | 1 / 1 | 1 / 1 | 1 / 1 | 1 / 1 |
| Four-copy P95, ms | 2 / 2 | 2 / 2 | 2 / 2 | 2 / 2 |
| Callback gaps over 50 ms, phases 0-3 | 0 / 0 / 0 / 0 | 3 / 0 / 0 / 0 | 2 / 0 / 0 / 0 | 3 / 0 / 0 / 0 |
| Reported video drops, all phases | 0 | 0 | 0 | 0 |

Elapsed-weighted CPU rates are 0.557614 staged and 0.557443 immediate. With two
processes per mode and no affinity, frequency or thermal controls, the tiny
difference cannot establish a speedup. Stable endpoint PID/childID/type joins
exclude unobserved transient processes. CPU is not GPU time or frame latency.

All eight long callback gaps are 51-60 ms, within the first 1.382 seconds. Their
adjacent draw batches take 0-1 ms. That does not locate all intervening work or
waiting, identify a particular scheduling cause, or establish physical scanout.
The fixed gap criterion compares against the larger baseline count, three here;
its pass does not mean the gaps disappeared. Earlier failed comparisons remain
failed and are not superseded by this different control experiment.

## Identity And Admission

All arms use BuildID 20261006175655 and package manifest
`1de58db614be934fb7fe71fc46ea168ce9777a8b46e340d3f429090b4e3e6773`.
Source is the complete frozen package input, not HEAD alone or a test overlay.
Before and after preference receipts join the exact owned document and parent
PID, requested/actual boolean, true default, explicit user value and unlocked
state. Import stays enabled and the profiler inactive. These receipts establish
configured mode, not an acknowledged renderer-internal device mode or path count.

The 167-file harness manifest is
`4d1477a7613707e9b5d0d0a7c9eb7d0cbea65e72da43912a5e01ccf814dbd8e7`.
All 164 preceding loss-harness inputs are preserved; only three admission/export
adapters are added. Timing directly reuses the sealed pbo-upload driver and
playback collector. Generated analysis preserves the entire 29-criterion
evaluator function. Its historical `repeatSpread.off/on` keys mean A/staged and
B/immediate respectively here, not import OFF/ON; import is ON in every run.

Package postchecks retain the existing policy permitting an absent or empty
ordinary lock file. No post-result rule change was made. The final generated
wrapper hashes are in frozen-wrappers.json; the earlier wrappers.json records
the preceding preparation snapshot. All 67 product-source pins, HEAD, staged
patch and mozconfig guards remain unchanged before and after runtime.

## Execution And Cleanup

Each arm uses fresh owned installation/profile/application/local/temp roots,
a 15-second quiet interval and package/harness/resource/no-browser-or-build
preflight. Limits remain 120 seconds capture, 105 work, 15 cleanup, 220 driver
and 240 SSH. Each completed prefix passed admission before the next launch.

| Arm | Root suffix | Browser / Controller PID | Capture milliseconds |
| --- | --- | --- | ---: |
| A1 | FdaVGr | 1926690 / 1926678 | 59857 |
| B1 | HBuzzG | 1929144 / 1929112 | 59882 |
| B2 | EUcNo6 | 1931577 / 1931565 | 59875 |
| A2 | AOcCCZ | 1934030 / 1934018 | 59858 |

Run roots use /home/wyatt/.cache/codex/laptop-pbo-playback-MODE-20261007-SUFFIX.
Captures span 08:51:05.665 through 08:58:40.486 UTC on October 7. All four owned
SIGTERM cleanups pass. Each browser log is 271 bytes with zero drops; existing
sandbox EPERM and successful VA-API initialization lines remain preserved.

Public exports contain 177 files, 1,371,185 bytes and 56 resource samples.
Peak sampled artifact use is 145,514,251 bytes, below the unchanged 256 MiB cap.
At 09:00:43.915 UTC all 48 structured-evidence PIDs and four separately identified
sandbox-warning PIDs are absent. Final admission at 09:01:47.982 finds unchanged
46 package/167 harness files and no browser/build activity. These checks do not
prove continuous process/network isolation or complete descendant history.
No profile, control token or application-data payload was exported.

## Verification And Next Action

Final strict tooling: 381 tests pass, zero failures or skips, 11.077 seconds.
Ten focused groups include full saved-result/hash replay, independent weighted
CPU calculation, exact gap sets, prefix rejection, malformed/stale receipts,
mode/hardware joins, cleanup and unchanged numerical failure cases. The broad
tooling gate includes Node child and loopback-server tests, not pure-only tests.
Scoped report/plan documentation lint and tracked diff whitespace checks pass.
Both preceding pixel/loss evidence seals verify unchanged. The timing seal is
artifacts/umbralink-control/pbo-playback-final.sha256; it includes this report,
the complete evidence namespace, runtime inputs and exact PID-check source.
No native compiler or profiler ran in this phase. Initial missing-module RED
was scaffolding, not a product bug reproduction. Evidence is under
artifacts/umbralink-control/pbo-playback/; original captures remain immutable.

Do not change the PBO default or add a new upload implementation based on this
result. It does not establish that the profiled fence subtree vanished, that
work moved, or that all upload workloads are equivalent. Without a benefit in
the target fixture, the planned conditional profiling pair is not justified.
Return to the remaining refresh/compositor scheduling and actual workload
attribution, keeping the earlier rare long stall and frame drops unresolved.
Broader rendering/layout/CSS/JavaScript and real-page improvements remain active.
Daily desktop browser, installation, launcher, personal profiles, Pi and source
defaults were untouched; no staging, commit or new agents occurred.
