# Exact Canvas Fallback

## Entry And Goal

The preceding availability phase is verified progress: 38 native cases pass,
including the five reproduced cache-loss defects and real manager authority.
Its sealed evidence remains immutable. The performance goal is still active.

Current DrawImage still calls MaybeGetScaledSourceSurfaceForRemoteVideo, changing
the source pixels before backend scaling/compositing. Earlier real native tests
retain seven failures, and the real-video OFF matrix differs from the full-size
reference in odd-size, alpha and software/readback cases. RGB conversion alone
did not restore operation-order equivalence. Remove this active canvas shortcut
instead of relaxing those tests. Keep descriptor-based GPU import and the exact
full-size cache, with import default OFF until its separate gates pass.

## Territory And Scope

The canvas helper's only call is in its deferred HTMLVideoElement readback path.
It invokes the sized GPUVideoImage overload, then rewrites the source rectangle
to the smaller returned surface. VideoFrame already uses full-size fallback;
filters/shadows use the standard layout surface path. Descriptor admission has
platform, union and preference gates with four compiled stand-in test variants.

Restore full-size HTMLVideoElement acquisition before the existing unusable-image
check and security check. Retain accelerated/recording/filter/shadow eligibility,
the existing GTK-only DMABuf VideoFrame branch, and other source/platform paths.
Remove the now-unused canvas DMABuf helper, scaled helper, deferred flag and late
readback/rectangle rewrite. Do not invent new shared abstractions or broaden
fast-path eligibility. Restore rectangle/rotation placement to the baseline
drawing branch, keeping self-canvas ExtractSubrect and direct-vector drawing.
Internal sized-readback transport/helpers and their
failing pixel tests remain unchanged historical/diagnostic work; do not call
them corrected or delete their failure evidence in this phase.

Production ownership: dom/canvas/CanvasRenderingContext2D.cpp only. Focused source
contracts in tools/umbrafox/tests/readback/test/dmabuf-import-spec.mjs must change
their old prescale-preservation expectation to enforce exact fallback. Preserve
all unrelated staged/unstaged work and all 58 prior source pins except this
explicit production file. Source-only reviewer owns acquisition-review.md in the
new evidence namespace, not code or runtime. No desktop/Pi/install/default/index/
commit/push action. Authorized isolated laptop execution remains permitted.

## Tests And Execution

First run the changed source contract against the old production file and retain
its expected failure. Existing native and real-video failure artifacts are the
behavioral RED, not a claim that source regex tests establish pixel correctness.
Keep four platform descriptor-admission compilations, malformed union/pref cases,
readback fixture and collector tests, and the preceding cache/native regressions.
The changed contracts must enforce early full-size fallback, absence of source
rectangle replacement, unchanged descriptor admission and GTK VideoFrame scope.

After source review and correction, run the focused bounded source/collector
suite and scoped formatting/lint. Pin source/HEAD/index/config and retain exact
phase diff. Build a fresh integrated diagnostic package using the existing
configured two-job idle mach route, never a gtest-library overlay or a daily
installation. Pin a fresh BuildID and verify actual ELF identity plus both INIs;
use only the existing configured generator recipe if incremental identity needs
invalidation. Preserve unsuccessful attempts instead of relabeling binaries.
Build timeout1800s, package600s, helper tests60s, source/lint60s, archive checks120s.

Reuse the strict real-video collector with new namespace/package identity only.
Fresh owned laptop roots, hash/resource/no-browser-build preflight, 15s settle,
120s capture and15s cleanup inside existing220s controller/240s SSH limits.
One OFF capture first; only a full strict pass permits the ON comparison.
The separate filter-repeat defect may still fail the overall gate. Retain all48
case hashes, exact available raw buffers and every failed predicate. Report any
case-specific improvement without treating the whole gate as passed. Do not
change collector thresholds, remove filters or use a passing subset to claim
parity. Performance and browser-loss/cost gates remain separate.

## Review And Completion Boundary

Check error/security ordering and platform/source branches, not only successful
draws. No new web-visible name, API, pixel convention or preference default.
The target is Firefox-compatible full-source scaling/compositing. Any unresolved
observable mismatch blocks release, including channel-loss behavior outside the
tested local authority and the direct-import descriptor route. Preserve all
recorded failures and collect native process cleanup plus package/source checks.

This phase can establish removal of the unsafe active prescale route and its
measured pixel consequences. It cannot establish a general YouTube speedup,
physical presentation, universal Firefox parity or completion of the full
rendering/layout/CSS/JS performance program. Record those distinctions, update
continuity and leave the broad goal active.

## Current Checkpoint

The source correction and source review are complete. Behavioral source-contract
RED and geometry RED were retained before their respective corrections. Final
readback tooling passes31 tests, scoped JavaScript/native lint is clean, and
four helper/source-equivalence tests pass. Descriptor and GTK VideoFrame source
regions remain byte-identical; restored drawing tail matches the frozen baseline.
These are source/tooling gates, not rebuilt-browser pixel acceptance.

Build inputs are frozen in source.json:59 files,15 untracked inputs, unchanged
HEAD/index/config and unrelated tracked diff. Only the canvas production source
changed among the58 preceding pins. Intended BuildID is20261006153147.

First build preflight on October6 at15:45:27UTC rejected concurrent cargo/rustc
activity before any build started. No existing process was changed. Preserve
preflight-build.json/log and use new observation names after the host clears.
Integrated build/package and real-video OFF/ON verification remain pending.

## Superseding Verified Outcome

The fourth resource/source preflight passed. Integrated build66.85s and
package100.57s succeeded with0 reported warnings. Native ELF and both INIs
match20261006153147. The46-file export and frontend identity-only delta passed.

OFF and ON each completed in about16.1s, retaining38 public evidence files and
clean owned cleanup with12 recorded PIDs absent per arm. OFF matches all48
preserved full-size reference hashes; ON matches all48 OFF hashes. Four raw
linear buffers match in each comparison and all repeats are stable, including
filter. This does not establish the mechanism of historical filter instability.
No criteria were relaxed and no old evidence was overwritten.

Final combined tests62PASS, BuildID6PASS and archive helper9PASS. Source/index/
configuration and previous availability seal checks pass. Package manifest:
908633c41ff3579585a08dbaf228c158735d7f61d77fb22cc0aeb822df880f87.
Report: bot-docs/reports/performance/2026-10-06-exact-canvas-fallback.md.
This phase establishes the scoped source/pixel consequence, not completion of
the broad objective. Keep default OFF and continue actual failure-recovery and
integrated cache/dispatch cost and performance gates. Desktop/Pi/install remain
untouched, and no owned execution remains live.
