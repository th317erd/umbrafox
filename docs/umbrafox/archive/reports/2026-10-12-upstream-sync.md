# October 12, 2026: Upstream Source Integration

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Scope and Recovery

Wyatt requested committing and pushing existing work, then merging upstream
before returning to performance optimization. This operation changes source
control only; it does not build, install, or control the daily browser.

- Existing work: `f16351a82412975c779644ddf963d0b49435af84`, pushed to `origin/main`.
- Recovery branch: `sync-before-upstream-20261012`, at that same commit.
- Previous upstream base: `08a61e1a51dbb4dbff0bb8e9ef97ad19c3afb156`.
- Incoming upstream: `1a097ed8d31f6b307a5d0ebc34a82ceaf7f3727b`.
- Incoming history: 4,399 commits; 21 merge conflicts resolved.
- `origin` is the Umbrafox fork; `upstream` is Mozilla Firefox. Never push to
  `upstream` or rewrite either published history for this operation.

The pre-merge commit preserves development source, tests, plans, reports, source
snapshots, and manifests. Generated browser packages and extracted installations
remain on disk and are excluded from Git. Original staged/unstaged patches and
the untracked inventory are retained under the evidence directory below.

## Important Resolutions

- Move the fork's tab-audio UI customization from deleted `tab.js` into upstream
  `tab.mjs`; retain upstream module, split-view, and tab-metrics changes.
- Preserve existing internal UI, widget-default, userland-menu and search-dump
  choices while retaining new upstream APIs and strings.
- Adapt canvas imports to upstream draw-target/content ownership. Cache reuse
  requires the matching content owner as well as the prior frame/host/format
  checks. A null target does not publish a reusable cache entry.
- Reject null, CPU, foreign-context and lost-context targets in the translator's
  video import path. Preserve the fallback path and existing admission checks.
- Adapt DMABuf code and native GL test sources to upstream's `BufferSurface`
  representation and `CreateTextures()` API. Retain destination-sized readback,
  producer fences, and format handling.
- Keep both the fork's single-image opacity configuration and upstream's YUV
  overlay stability configuration throughout WebRender constructors.
- Keep experimental graphics paths and probes disabled by default. No new web
  interface, identity marker, browser API, or product-default opt-in was added.

The rulebook remains mandatory. Source review and focused tests do not constitute
new end-to-end Firefox parity certification for the merged browser.

## Verification

Checks ran against the actual resolved worktree, not just a merge preview.

| Check | Result |
| --- | --- |
| Combined Umbrafox Node suite, including extracted C++ fixtures | 465 passed, 0 failed |
| Extracted import-cache native cases, included above | 48 passed |
| Probe source contracts | 14 passed |
| Sampling parser | 36 passed |
| Isolated Rust source-region probes, OFF / ON | 3 / 22 passed |
| Installed ESLint, seven resolved/test JS files | 0 errors |
| Scoped resolution/test whitespace | Passed |
| Resolution hash guard | 36 prepared files unchanged after tests |
| Unresolved Git conflict entries | None |

Regression evidence includes a deliberately removed content-owner guard failing
the cross-content cache test before restoration. The mutant lived only in
scratch. Import and fence fixtures were adapted to the new source boundaries
without dropping their original behavioral assertions.

`./mach lint -l eslint` exceeded its 120-second bound while preparing updated
Python lint dependencies. Direct installed ESLint then completed successfully;
its only warning was the repository-configured ignore for `firefox.js`. This is
not a claim that every upstream file or every lint type was checked.

Full-merge `git diff --cached --check` reported whitespace in 133 paths. Every
such index blob was verified byte-identical to the corresponding upstream blob;
no mass formatting of upstream/vendor content was performed. The resolved and
adapted files pass the scoped check.

No full Gecko build, real-GPU/gtest execution, browser-chrome suite, or browser
runtime parity test ran. Updated native test sources therefore still require
compilation and execution before a new prototype is accepted. Isolated C++/Rust
fixtures are not substitutes for a complete native integration build. October 7
cleanup removed the old object directories; regeneration is a separate step.

## Evidence and Continuation

Durable evidence root:
`/home/wyatt/.cache/codex/umbrafox-upstream-sync-20261012-ssNJPxDz/`.

Important files: `before-all.patch`, `before-index.patch`,
`untracked-before.list`, `push-before-upstream.log`, `fetch-upstream.log`,
`merge-final.log`, `resolution-manifest.json`, `postmerge-tests.log`,
`postmerge-eslint-direct.log`, `postmerge-whitespace.log`,
`ownership-guard-red.log`, `probe-contract.log`, `sampling-tests.log`, and
`probe-pure/`. Interrupted fetch/merge attempts are retained separately; use the
final merge and post-merge results, not earlier preview failures, as evidence.

The merge commit's parents and the final `origin/main` ref are the publication
receipt; inspect Git rather than inferring publication from this report.
Installed browser files, launchers, desktop associations, and profiles were not
changed by this synchronization.

The next performance contract is `docs/umbrafox/archive/plans/audio-on-seek.md`. The existing
audio-on admission is not a reproduction of the long seek/stutter/recovery issue.
Do not resume the old muted comparison or present the merge as a performance fix.
