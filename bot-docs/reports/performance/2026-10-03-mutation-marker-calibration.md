# Mutation Preference Marker Calibration

## Result

The small actual-page experiment confirms the observer-effect mechanism identified
in the [failed mixed-profile comparison](2026-10-03-profile-observer-effect.md).
With userland inactive, the baseline records one `Preference Read` marker for
`umbrafox.userlandScripts.active` per text mutation in each tested loop. The
candidate records none in those loops. No browser source or package changed.

| Phase | Iterations | Baseline A target markers | Candidate B target markers |
| --- | ---: | ---: | ---: |
| Arithmetic control | 1000 | 0 | 0 |
| Detached text mutation | 1000 | 1000 | 0 |
| Attached text mutation | 1000 | 1000 | 0 |

A has 2008 target markers total: 2000 strictly inside the two mutation intervals
and eight outside all three intervals. B has zero. There are no markers exactly
on interval boundaries, and no other preference names in these thread exports.
All A target payloads say `Bool`, `false`, and `User`.

These are recorded marker counts, not timing estimates or a calibrated speedup.
They confirm differential profiler work. They do not establish the cause of
YouTube stutter, decompose the earlier 210-MB failed dump, or invalidate earlier
separate unprofiled results. The earlier oversized dump remains unparsed.

## Workload And Capture

The new version-5 `marker-calibration` fixture reuses the existing loopback
server, page-owned script bridge and retained browser capture/cleanup path.
It performs three fixed cases once, with no warmup. Each has 1000 iterations;
the arithmetic checksum is 499500 and both text checksums are 98. The DOM is
empty before and after. Creation, attachment, removal, reporting and 20-ms
inter-case waits are outside the named loop intervals.

Exactly nine UserTiming entries form three unique start/measure/end triplets.
Four realm checks confirm actual Window execution; the UmbraLink transport
sandbox is not the benchmark realm. Existing mixed and layout workloads retain
their defaults and source/checksum guards. Only five tooling files changed:
the fixture, profile adapter, new marker workload, and two specifications.
No public browser interface, native code, preference, build or install changed.

The profile settings remain one requested 1048576-entry buffer, 2-ms interval,
`stackwalk`, `js`, `processcpu`, `nomarkerstacks`, and the previous thread list.
The same 105/120-second work/total deadline, private fresh profile/application
data, 24-MiB profile preservation cap and 512-MiB sampled ON artifact cap apply.
One baseline then one candidate ran on wyatt-laptop; no retry or owner browser
was involved. No compiler was observed by the admission check.

| Variant | UTC start/end, October 3 | Controller/browser | Raw copied bytes |
| --- | --- | --- | ---: |
| A | 18:29:45.501 / 18:29:57.858 | 369203 / 369237 | 1144798 |
| B | 18:30:23.092 / 18:30:35.379 | 370277 / 370347 | 812848 |

Both captures pass three functional receipts, explicit profiler stop and clean
owned SIGTERM. Each has 182 browser-log bytes, zero drops and five resource
observations within the existing caps. Independent post-run audits found all
four exact browser/controller PIDs absent. Maximum sampled artifact sizes are
155857624 and 189632203 bytes, not final sizes or continuous peaks.

Both packages remain the same sealed BuildID20261003071500 candidates. A uses
libxul SHA `82faf41661bd92231acfaff88da1598f403f63c0a399f9dbd008cb724524b61b`;
B uses `d00138528b1410b81405fc9533b8771a8284ec98e6968a2bce313bc2177c4231`.
The copied profiles have SHA-256:

- A: `2d07334b350e5b0f860358ed4f9c9bd9e9e2ae23063a4e7e30c37c2569a9d708`.
- B: `b29da5d48b989a428193435a82f3ad0fbf5ffa8ebb193980a76372e81907ef22`.

## Attribution And Clock Bounds

Only profiler-cli loaded the raw profiles. Each used its own named session and
explicit `http://127.0.0.1:9` symbol-server endpoint; no Samply server or remote
symbolication endpoint was used. The small saved CLI exports were analyzed by
the local strict validator, not a custom raw-profile parser.

The fixture document is 10737418242 in each separate run. Native before/after
process-window inventories join its exact fixture URL to content PID369393 in
A and PID370961 in B. CLI metadata joins those PIDs to GeckoMain threads t-41
and t-11 respectively. The three UserTiming triplets carry the same document.
Preference markers do not carry document IDs: their attribution is a same-thread
temporal join to those synchronous loop spans, not per-marker document/stack proof.

The audit requires equal finite original CLI root ranges and compares normalized
CLI marker timestamps with each other. It does not mix them with raw root times.
Public `performance.mark().startTime` receipts are reduced-precision and are
not used as counting boundaries. Exact CLI start/end entries must reconcile with
the matching measure duration, and intervals must be ordered and disjoint.
Missing/duplicate phases, incorrect IDs, incomplete lists, malformed payloads,
mixed clocks and duplicate preference handles are rejected. Boundary markers
are reported separately rather than assigned arbitrarily.

Owned CLI daemons1616260 and1616645 stopped with status0 at18:32:15.262 and
18:32:29.565UTC; exact PID and named socket absence were verified afterward.
These finite captures and checks are not universal buffer-retention proof.

## Verification And Preserved Failures

- Assertion-first fixture test rejected the new workload before implementation;
  new-module import failures are separately visible in the same RED log.
- Final combined tooling suite: 388 PASS. Exact five-file lint: zero problems.
- Saved-data analysis: two test groups PASS, including fifteen corruptions and
  an exact-boundary case. Observed counts match both complete exports.
- Twenty-one harness/dependency hashes matched locally and on the laptop before
  capture, within each driver, and after. Thirty-four direct evidence files per
  run were exported and hash-verified, plus their manifests/file lists.
- Copied driver receipts and the deployed auditor match remote hashes.
- The first offline audit incorrectly expected the old driver's `profiling`
  field. Both audits failed before producing exports; the subsequent archive
  commands failed because their file lists did not exist. The assertion now
  requires literal `on`, and audits/archives were regenerated from existing
  completed runs under new names. No browser rerun or capture alteration.
- An initial remote manifest command omitted the working directory and failed;
  the explicit-directory check and both drivers verified the actual manifest.

## Next Attribution Route

There may be a supported way to obtain baseline CPU stacks without enabling its
preference markers. The saved runtime feature lists include `samplingallthreads`.
In [ActivePS::ProfilingFeaturesForThread](https://searchfox.org/firefox-main/rev/bf9757d91e2e53b8ab836f2a08bf4c0275fdcd23/tools/profiler/core/platform.cpp#1483),
explicitly selected threads get all profiling features. Unselected registered
threads receive sampling and markers independently, controlled by
`samplingallthreads` and `markersallthreads`. Upstream `GeckoProfiler.AllThreads`
tests this separation, including `profiler_thread_is_being_profiled_for_markers`.

The exact packaged base revision has the same selection logic, and neither
sealed tracked patch nor new-source archive changes profiler files. This is
source-supported, not yet a runtime-proved capture mode. A proposed next step is
to leave content GeckoMain outside explicit selection while enabling registered
thread sampling, then prove useful content samples and absence of the target
markers in a small fresh capture. Do not silently select GeckoMain, use an empty
filter without checking its semantics, or enable `markersallthreads`.

That mode would also remove content UserTiming markers. Before using it for the
original mixed-layout question, establish a separately validated clock/window
contract or use a dedicated workload with appropriately bounded attribution.
It must not be pooled with the current marker-bearing profiles. Sampling other
registered threads can itself add overhead. No mode change, system-security
change or additional browser launch has been performed for this proposal.

## Evidence Locations

- Remote harness: `~/.cache/codex/marker-calibration-harness-20261003-eBoebP`.
- Remote runs: `~/.cache/codex/marker-calibration-20261003-{A,B}-1`.
- Local direct exports: `~/.cache/codex/laptop-marker-calibration-evidence-20261003-{A,B}-1`.
- Local CLI exports/audits: `~/.cache/codex/marker-calibration-analysis-20261003-{A,B}-1`.
- Drivers, validators, tests and logs: `artifacts/umbralink-control/*marker-calibration*`.
- Final manifest: `artifacts/umbralink-control/marker-calibration-final.sha256`.

All owned runtime/CLI commands are terminal. The broader optimization goal,
unresolved mixed-layout signal and separately gated headed-GPU acceptance remain
open. The daily-use browser and installed prototype were not touched.
