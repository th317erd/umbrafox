# Existing Startup Profile: Smooth Reference

## Result

The existing laptop profile was recovered by a separate bounded opaque gzip
export and verified byte-for-byte on both machines. The original capture is
still **failed at its 24 MiB copy cap**; recovery does not rewrite that result.
No browser was launched, no driver installed, no product source/default changed,
and the owner's desktop browser was not controlled. The owner means progress-bar
seeking, not searching YouTube. This short startup capture does not reproduce
the prolonged post-seek stutter or black-flash recovery.

The profile is a **smooth reference**, with 1,200 observed frames and zero
reported drops. Its separate unprofiled control had 24 drops. Those N=1 runs
differ in startup/site/cache state, geometry and profiler activity; zero drops
under the profiler is not an optimization or proof that profiling fixed it.

## Exact Preservation

Original on `wyatt-laptop`:

```text
/home/wyatt/.cache/codex/laptop-startup-profiled-20261007-odI1jl/run/profile/umbrafox/diagnostics/profiles/dom-profile.json
```

The 52,241,866-byte original retained device 64512, inode 37366171, uid 1000,
mode 0600 and modification time 1791413908022.1409. Its SHA256 is
`414c126d2d9438373bd4aa152cc1a1990dc3a36a7ba768ed843df56c5f548eb3`.

The gzip is 8,298,417 bytes, SHA256
`eafa42c6eeaf5c4f18813a81bb6ebae56403d144a13427ba14682667414d66a7`.
The exporter enforced 64 MiB input and 24 MiB output limits, exact source
identity, exclusive creation, O_NOFOLLOW, private permissions and a 30-second
abort signal. It streamed gzip back into a size/hash sink and compared exact
raw and compressed bytes without parsing profile JSON. All 14 recorded run
PIDs were absent before export. A separate local streamed verification passed.

Remote output: `/home/wyatt/.cache/codex/startup-profile-export-20261007-k4uk5g/`.
Local gzip and receipt:
`/home/wyatt/.cache/codex/startup-profile-analysis-20261007-bdY4jy/`.
The original run, reports, cap and failed-run evidence remain unchanged.

## Clock And Identity

Installed profiler-cli 0.10.0 loaded that local gzip once in the unique session
`umbra-startup-smooth-20261007-bdY4jy`, explicitly using
`--symbol-server http://127.0.0.1:9`. No raw-profile parser, public symbol-server
fallback or new capture was used. The daemon log confirms the loopback override.
This is configuration evidence, not a packet-level network audit.

The actual profile reports BuildID 20261006175655, 57 threads/12 processes,
5 ms sampling and 128 MiB buffer capacity. Its one private complete interval
`startup-proof-oct7-profiled` matches content PID 2222564, document 10737418243,
the nonce, and every saved native/page clock field. The marker detail agrees
with the list export. The marker producer was source-traced in the preceding
[drop audit](2026-10-07-startup-drop-audit.md).

- CLI normalized playback interval: 1056.4778811875..21061.6310281875 ms.
- Raw root range: 12434.459188..33671.202882 ms.
- Raw playback interval: 13490.9370691875..33496.0902161875 ms.
- Derived content-native to raw-root offset: 499.7294921875 ms.
- Native playback duration: 20005.153147 ms.
- Marker emission extends 3.029113 ms beyond playback; that tail is excluded.

The CLI marker times are normalized, while its context and zoom range remain
raw-root times. Validators reject mixed clocks, stale/ambiguous identities,
missing markers, invalid ranges and mismatched emission brackets. Page time is
not substituted for native time. All summarized exports have the same raw
context and requested zoom.

## Saved Observations

Nearest-rank quantiles below describe fully contained **CLI-derived wall-time
intervals**, not CPU/GPU cost or certified raw split-marker pairs. No crossing
intervals occurred in these selected groups.

| Scope | Count | Median ms | P95 ms | Maximum ms |
| --- | ---: | ---: | ---: | ---: |
| Renderer notifier | 1201 | 1.134005 | 1.684426 | 5.938140 |
| Renderer Composite | 1201 | 1.089696 | 1.626098 | 5.924033 |
| Compositor CompositeToTarget | 1205 | 0.081081 | 0.121436 | 2.254511 |
| Compositor ImageBridgeTransaction | 1202 | 0.061913 | 0.097645 | 0.359053 |

Composite payloads expose `innerWindowID=2`, not the content document ID.
These are parent rendering-window observations during the playback interval,
not per-video/per-frame joins. Equal notifier/Composite counts are not pairing
proof. CLI output lacks raw edge mappings and incomplete-edge provenance.

The Compositor export contains 1,205 UpdateCompositedFrame instants and no
`Video frames dropped` marker in this interval. The media state-machine export
contains 1,201 VideoSink::RenderVideoFrames instants. These counts are not
physical scanout counts, and marker absence is not proof of zero physical loss.

Including idle samples, content GeckoMain has 3,639/3,998 idle-classified samples
(91.02%), parent GeckoMain 3,668/4,000 (91.7%), Renderer 3,704/4,000 (92.6%) and
Compositor 3,860/4,000 (96.5%). These are sampled categories, not evidence that
every short deadline was met. Content layout appears in 16/3,998 samples and
JavaScript in 159/3,998. This smooth recording does not establish a layout or
JavaScript bottleneck in the owner's bad interval.

## Partial Query And Cleanup

The query wave deliberately stopped after `thread info` for t-49,
MediaSupervisor #9, exceeded its 10-second bound. That command returned no data;
the timeout is a tool observation, not a diagnosed browser bug. 21 threads have
complete saved sample/selected-marker exports. The full inventory exists, but
this is not full detailed coverage of every recorded thread.

The first query selector also omitted the actual `ImageBridgeChld` and
`IPC I/O Parent/Child` spellings, and CanvasRenderer. Their inventory entries
remain available; no detailed coverage is claimed and no retry/load was made.
Do not carry that exact-name selector into a future capture analysis. Select
from actual inventory and record coverage explicitly.

The daemon also logged a symbol lookup warning. Despite the metadata field
`symbolicated=true`, many native stacks remain address-only. No native function
or GPU wait attribution is inferred from those unresolved addresses.

The `finally` cleanup issued the supported named-session stop, which exited 0
at 23:14:51.636 UTC. At 23:14:51.996 UTC, exact daemon PID 471264, its session
JSON and named socket were absent. Its live process stamp and socket identity
were preserved before queries. No other session was stopped. The timeout,
partial exports and successful cleanup are retained separately.

## Verification And Next Experiment

32 focused strict-unhandled Node tests pass: 14 opaque exporter tests and 18
clock/identity/interval tests. The initial red tests were missing-module failures,
not reproductions of a production browser defect. The actual gzip round trip,
saved marker/detail/status joins, and complete exported rows were independently
checked by the offline recomputation. No browser/engine tests were run here.

Artifacts are under `artifacts/umbralink-control/startup-profile-analysis/`:
commands, output/error files, timeout, daemon receipts, exporter, tests,
`results.json` and hashes. Original capture evidence is in the separate sealed
`startup-profile/` namespace.

Next: design a lower-overhead marker-focused laptop trial with a fresh
unprofiled control and fixed settings geometry. Retain an actual drop burst
before assigning a cause; use the already-traced compositor drop marker and
private native interval rather than treating the delayed page counter bucket
as the exact drop instant. Do not promote a workaround from this smooth sample,
change codecs/sandbox/system drivers, or intervene in the daily desktop browser.
Recover any future oversized dump through the verified separate opaque export,
not by silently relaxing the original capture limit. The larger performance
goal remains active; this step validates evidence, not a new performance fix.
