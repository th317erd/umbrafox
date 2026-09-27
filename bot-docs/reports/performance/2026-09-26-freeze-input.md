# Historical Freeze Capture Triage

Session/task: `perf-20260926` / `js`. Inspection: 2026-09-26.
Named profiler session: `umbra-perf-freeze-js-20260926`.

## Verdict

**Unusable as supplied through the mandated profiler-cli 0.10.0 workflow.** The loader rejected the artifact because it could not find a `meta` field in the expected Gecko profile structure. This establishes a tool/input compatibility gap, not that all possible decoders would reject it, that the file is corrupt, or that the historical browser was idle.

No raw-profile parser, extraction, conversion, repair, recapture, browser, or source investigation was attempted. This result supplies no current performance finding and no historical root-cause claim. The six current catalog candidates remain UNMEASURED.

## Artifact Identity

- Repository-relative input: `artifacts/umbrafox-freeze-live-20260922/live-1790098768.json.gz`.
- Size: 223731 bytes.
- Filesystem modification time: 2026-09-22 10:39:40.410388738 -0700. This is not validated profile capture time.
- SHA-256: `bab58c5cbb82366ea16b7e71cd545a707e9bb857c81bbe338605e44a5650d939`.
- Historical browser build ID, source revision, runtime settings and patch state: **unknown**. Do not associate this input with the current checkout or pool it with the parent's new harness captures/current baseline.

## Observed Tool Results

`profiler-cli --version` returned `0.10.0`. The full guide and `load --help` were read, together with the skill's cross-process timeout CLI reference. A preflight status query confirmed the specified session did not already exist.

The local-file load used the requested named session and a loopback-discard symbol-server override to avoid public symbol-service access. It was bounded by `timeout 50` and failed promptly with exit status 1:

```text
Profile load failed: Unserializing the profile failed: Error:
This does not appear to be a valid Gecko Profile, there is no meta field.
```

Both `status --session umbra-perf-freeze-js-20260926` and `profile info --session umbra-perf-freeze-js-20260926 --json`, each bounded by 15 seconds, returned the same load error. No fallback reader was used.

| Requested coverage | Result |
| --- | --- |
| Profile metadata, build identity and capture settings | Unavailable: loader rejection |
| Process identities/count and thread identities/count | Unknown, not zero |
| Sample count, sample interval and actual time coverage | Unknown, not zero |
| Missing versus present JS/native stacks | Cannot determine |
| High-cost/long-task intervals and GC/CC markers | Presence cannot be established; no marker queries or payload inspection after load failure |
| Hot-path attribution or custom-hook lead | None supported |

The filename and nonzero byte count cannot substitute for these missing measurements. No profile URLs, page/script identities, script bodies, or user content are included in this report or coordination findings.

## Cleanup and Bounds

`timeout 20 profiler-cli stop --session umbra-perf-freeze-js-20260926` succeeded and printed:

```text
Session umbra-perf-freeze-js-20260926 stopped
```

A subsequent bounded status query reported the named session unknown with no metadata found. No other session was stopped; `stop --all` was never used.

Inspection began at 23:31:31 UTC; cleanup verification completed at 23:32:27 UTC, within the five-minute deadline. Every substantive analysis command had a timeout of 50 seconds or less. Only the authorized local daemon state, this scratch report, and coordination DB were written. No public upload, browser launch, build, Pi access, install, source edit, or duplicate harness capture occurred.

## Remaining Gap

Parent review should treat this artifact as **not analyzable by the approved tool as supplied**. A valid profiler-supported export with metadata/process/thread/sample tables and known historical build identity would be required for historical triage. Determining why the supplied file lacks the expected structure or transforming it is outside this assignment. Do not use the failed load as evidence for or against a JS/JIT/GC/queue performance hypothesis.
