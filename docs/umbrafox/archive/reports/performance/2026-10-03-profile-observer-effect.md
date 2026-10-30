# Mixed-Profile Comparison: Censored Baseline

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Outcome

The next comparison after the [page-owned profile](2026-10-03-window-dom-profile.md)
stopped at its existing preservation gate. The baseline profiler-ON dump is
210314088 bytes, exceeding the unchanged 24-MiB copy limit. It remains in its
owned laptop run directory, uncopied and unparsed. No larger-cap retry occurred.
The four-cell comparison is incomplete and **no A/B performance result is
accepted from it**. All three launched browsers and their controllers exited.

Source investigation also found a differential observer effect: baseline A's
mutation gate uses the generic preference getter, which can emit a profiler
marker on every successful preference lookup. Candidate B's always-mirrored
atomic read bypasses that getter. Profiler-ON timings therefore cannot be
treated as equivalent to ordinary unprofiled browsing costs.

This does not invalidate the earlier, separate profiler-OFF comparisons. It
does prevent presenting this failed baseline profile as a much larger speedup
or raising its capture cap merely to obtain a superficially complete result.

## Fixed Experiment And Receipts

The predeclared sequence was A-off, B-on, A-on, B-off, one fresh process per
cell. The unchanged version-4 page-owned collector has 80 cases, exact prior
checksums/iteration counts, one complete pass and fixed requested profiler
settings. Baseline A is the sealed readback candidate; B is the mutation-mirror
candidate. Both have BuildID20261003071500 but distinct libxul identities.

The source/protocol/resource limits remain unchanged: 105/120-second work/total
limits, 45-second compiler admission, 24-MiB profile-copy limit, 256-MiB OFF or
512-MiB ON sampled artifact limits. The driver pins the four cell definitions,
binary hashes and output paths, and refuses subsequent cells unless every
prior cell passed and its exact controller/browser roots are absent.
Two pure driver tests cover the fixed plan and invalid arguments; no browser
source changed. All 18 earlier harness hashes plus the new driver are recorded.

| Cell | UTC start/end, October 3 | Controller/browser | State | Workload ms |
| --- | --- | --- | --- | ---: |
| A-off | 17:56:31.749 / 17:56:47.956 | 346300 / 346314 | PASS, 80 cases | 4821 |
| B-on | 17:57:28.478 / 17:57:45.717 | 347377 / 347469 | PASS, 80 cases | 4735 |
| A-on | 17:58:25.105 / 17:58:46.462 | 349051 / 349067 | FAIL profile preservation cap, 80 case receipts | 7650 |
| B-off | Not launched | None | Prerequisite rejected | Not measured |

The B-off command was submitted after the A-on command returned failure; its
guard rejected the failed prerequisite before launch or output creation.
That controller error is retained. It was not a retry, and no missing cell
is imputed or pooled from an earlier run.

Each launched browser has clean owned SIGTERM, 182 log bytes, zero drops and
six resource observations within the sampled limits. Independent audits check
all six browser/controller PIDs absent. A-on explicitly stopped its profiler
after preservation failed. Its 80 case receipts remain functional evidence,
not accepted captured-profile or completed-comparison evidence.

Maximum sampled artifact bytes: A-off188055746, B-on185719664, A-on188100210.
These samples are not final-directory sizes or continuous peaks; notably the
large A-on dump was produced after the last sampled size. Native parent buffer
generation is zero before and after both ON workloads. This is parent-local
information, not proof that the content buffer retained every marker.

The successful B-on profile is 16125890 bytes, SHA-256
`2e898a662d98396479b2ebcc509751ef0ca3e7c632d7eea1681be4f321fa834b`.
Thirty-one A-off, 35 B-on and 32 A-on direct evidence files were exported and
hash-verified. The failed dump's fixed path was only checked with file metadata;
no private/shared profile, crash queue or token was inspected. Original failures
and earlier seals remain intact.

The preserved failure audit has a stale generic limitation sentence saying the
raw profile was copied/hashed. That sentence is incorrect for A-on: its explicit
`rawProfileMetadata` records `copied: false` and `parsed: false`, and the executed
failure auditor only used `lstat` on that raw path. The export list excludes it.
The original audit and script are retained unchanged; this paragraph corrects
the contradictory prose rather than rewriting the historical record.

## Source-Supported Observer Effect

Both sealed packages' base is `892431809a4caadb5c73b2c03ad9bdb124c3e21e`.
Their frozen tracked patches contain no change to `modules/libpref/Preferences.cpp`.
The inspected local file has Git blob
`454f796d6492b9ec2859dc3a4cb5cd2e3f76193c`, matching that base.

The relevant path is:

1. Baseline `UmbrafoxUserlandMutation::ShouldDispatchMutation` calls
   `UmbrafoxUserlandScriptsActive` before the target/document checks.
2. That helper calls `Preferences::GetBool` for
   `umbrafox.userlandScripts.active` with fallback false.
3. `PreferencesImpl::GetPref` calls `GetPrefValue`. On a found preference,
   it gets the value, then checks `profiler_thread_is_being_profiled_for_markers()`.
4. When true, it formats the value and emits a `Preference Read` marker with
   name, kind, type and value. `nomarkerstacks` does not bypass this source path.
5. The frozen B patch replaces the generic getter with
   `StaticPrefs::umbrafox_userlandScripts_active()`, declared as an always-mirrored
   relaxed atomic boolean, retaining the same preference key and default.

The corresponding upstream [GetPrefValue implementation](https://searchfox.org/firefox-main/rev/bf9757d91e2e53b8ab836f2a08bf4c0275fdcd23/modules/libpref/Preferences.cpp#5884-5903)
has the same marker branch. The registry's `publishUserlandScripts` writes the
active preference even for an empty list. This is a source-backed explanation
for differential profiling work, not a count or causal decomposition of the
210-MB file: that failed profile has not been parsed. Other marker/sample data,
buffer retention and duration also affect its size.

The measured 4821/7650 ms A-off/A-on totals are descriptive, order-confounded
single-process observations. They must not be labeled a calibrated profiler
overhead estimate. Do not use A-on versus B-on to claim an ordinary browsing gain.

## Candidate Repeat Audit

The successful B-on profile was loaded only through a new owned profiler-cli
session, using explicit `http://127.0.0.1:9` and no symbol server. No raw JSON
parser was used. Missing native names limit this export to marker/category
attribution; no native-function comparison with the symbolized earlier profile.

All243 entries form81 exact UserTiming triplets in document10737418242,
content PID348064/thread t-41. The before/after native process window points to
the same fixture URL; profiler process metadata joins that PID/thread. Every
case filter matches exactly30 intended entries, including the corrected `-js`
filter. Function self totals, root totals and category totals reconcile.
Two audit tests pass, including six deliberate identity/clock corruptions.

There are1585 active pass samples: DOM1096, layout264, JavaScript182, GC/CC23,
profiler12, other7 and graphics1. Batched layout has55 active samples,44 layout
and11 DOM. As in the earlier candidate capture, no exported exact-name GC/CC
interval intersects its ten batched-layout cases. This repeats a bounded
observation, not proof about earlier unprofiled runs or the baseline.

Owned CLI stop returned0; exact daemon PID1592269 and its named socket were
independently checked absent. No Samply server was started for this follow-up.
All capture, export, test and transfer commands are complete.

## Next Safe Experiment

A small, separately versioned marker-production diagnostic can test whether
ordinary DOM mutations on A emit the suspected preference markers and whether
B avoids them. It should use a fixed small count, strict same-document start/end
marks, actual page-owned execution and the existing preservation/resource limits.
Its purpose is observer calibration, not throughput or a substitute for the
original mixed-workload comparison. No such diagnostic has run yet.

An external userspace sampler would avoid enabling Gecko's preference markers,
but harmless `perf stat -e task-clock:u -- true` preflights were denied on both
wyatt-laptop and wyatt-desktop. Both expose `perf_event_paranoid=4`; laptop
perf version is7.0.14. No sudo, capability, kernel-setting or security-policy
change was attempted. Any change requires owner approval. Linux documents
the [per-process/userspace scope at level2](https://www.kernel.org/doc/html/latest/admin-guide/perf-security.html)
and warns that captured process data can be sensitive; a future capture must
remain scoped to owned isolated test processes.

The baseline package does retain `.symtab`/`.strtab`, with GNU build ID
`f2c96c91073e8ba2cd754e10735f6b75`. Candidate ID is
`9be8527d27b64ed4999b502e44c55a2b`. Full debug-symbol availability for A is not
established, and no attempt was made to symbolize A with B's binary.
Initial seal verification used the wrong working directory and failed to find
its relative paths; rerunning in each package root verified both complete seals.

## Evidence

- Remote run roots: `~/.cache/codex/window-profile-ab-20261003-{A-off,B-on,A-on}-1` on wyatt-laptop.
- Local exports: `~/.cache/codex/laptop-window-profile-ab-evidence-20261003-{A-off,B-on,A-on}-1`.
- B-on CLI exports and audit: `~/.cache/codex/window-profile-ab-analysis-20261003-B-on-1`.
- Fixed driver, success/failure audits, CLI exporter and tests:
  `artifacts/umbralink-control/*window-profile-ab*` and its `test/` directory.
- Source, admission, runtime, failure, hash and analysis logs:
  `artifacts/umbralink-control/window-profile-ab-*`.
- Final seal: `artifacts/umbralink-control/window-profile-ab-final.sha256`.

No native/browser source, package, installation, launcher, personal browser
state, profile or desktop window changed. The broader optimization goal and
the independent headed-GPU acceptance gate remain open.
