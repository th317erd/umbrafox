# Full-Size Readback Reference

## Result

One fresh reference-OFF laptop capture completed. Its historical full-size HTML
video source route matches the prior direct-import-ON candidate in 44 of 48
ordered output hashes. All four linear raw RGBA arrays match exactly, at both
0.5 and 2 seconds and both repeats. The four remaining differences are the
explicit software-readback case, two repeats at each time. Every within-run
reference repeat is stable, including the filter case.

The old V2-OFF candidate differs from this reference in 22 of 48 outputs:
linear, odd-size, smoothing-disabled and alpha cases at both repeats, the second
filter repeat, and both explicit-readback repeats, at each time. Its linear
raw differences are the same previously measured values:

| Time | Changed pixels | Changed components | Maximum channel delta | Total absolute error |
| --- | ---: | ---: | ---: | ---: |
| 0.5 seconds | 3575 | 7860 | 94 | 45640 |
| 2 seconds | 3157 | 7201 | 100 | 66314 |

These findings support the earlier V2 scaled-readback path as the source of the
large relative pixel difference, rather than establishing that direct import
is wrong. The candidate retains V2 on the software-readback route even when the
new import preference is ON. Removing V2 in the reference changes that route
too. This is a source-backed interpretation, not per-draw native branch proof.
The unchanged filter branch also changes its repeat pattern when surrounding
draw paths change; do not attribute that to a direct filter-code repair.

This is not universal Firefox parity, a playback speedup, an import failure or
context-loss test, or an explanation of the owner's intermittent YouTube
stutter. No new preference has been enabled by default or installed.

## Reference Construction

Plan: `bot-docs/plans/fullsize-reference.md`. The previous candidate's OFF mode
contains V2 and therefore is not a stock Firefox oracle. The exact historical
upstream canvas source is pinned to
`08a61e1a51dbb4dbff0bb8e9ef97ad19c3afb156`, with its bytes retained under
`artifacts/umbralink-control/linear-pixels/upstream-reference/`.

Only `dom/canvas/CanvasRenderingContext2D.cpp` changed temporarily. The two V2
helpers, deferred state and late sized-readback block were removed. The HTML
video branch was restored from the historical source, including normal
full-size GetAsSourceSurface and OptimizeSourceSurface behavior. The only
signature adaptation is `MaybeGetSurfaceDescriptorForRemoteCanvas(res, Nothing())`.
The new import admission, VideoFrame branch, default-OFF preference, security
checks, APIs, GL/IPC code and unrelated work were retained.

The reference source test failed first against V2, then proved the historical
branch and byte-for-byte equivalence outside the enumerated regions. Real
compiled descriptor-admission tests passed for GTK, Windows, macOS and OTHER
preprocessor configurations. These small tests are not cross-platform browser
builds. Existing V2 source assertions were not changed to hide the difference.

Configured two-job build succeeded in about 66 seconds, packaging in 94 seconds,
with no compiler warnings, fixed `MOZ_BUILD_DATE=20261006052600`, idle priority
and explicit 1800/600-second limits. No browser ran during compilation.
Preflight had about 44 GiB available memory and 75 GiB free disk, and no detected
compiler activity. Native and untracked source guards were preserved.

Export: `exports/umbrafox-fullsize-reference-20261006/`. All 46 regular package
files match the validated archive. Both INIs and the later native browser
receipt agree on BuildID `20261006052600`. Complete tracked source patch, the
minimal reference patch and the unchanged untracked-source supplement are
included. This remains a modified Umbrafox binary with a source-equivalent
readback route, not a complete corresponding stock Firefox build.

Forty package files are byte-identical to the previous candidate. Differences
are the two INIs, executable pair, libxul and omni.ja. Comparing all 2676 omni.ja
payloads finds only AppConstants.sys.mjs changed, with an exact single BuildID
substitution. No other packaged JavaScript payload changed.

- Archive: 107784404 bytes, SHA-256 `327a2999eb6bd8d17b539ada9460e37a3e34f18bb1af5ffe23fc27781d3ada2e`.
- Manifest SHA-256: `350dd9dbacb579380ed57d84f9fb3d35e5b8b0514b07725baddc51d10bd22814`.
- Reference canvas SHA-256: `3f2a75fab4d78e0d1c406d999ae81beead9af67af09e2b9fc41a8323fc583a14`.

After packaging, the exact temporary edit was reversed with guarded apply_patch.
Original canvas SHA-256 `50bd508090a87b2dd0d315b98b3894c6a94f1c2e9a6a10f0a9c6418c500981a9`,
the complete original tracked patch and the original staged index all match.
No prior edits were discarded. The object directory still contains the reference
binary; it must not be installed or packaged as the restored normal candidate.

## Test And Runtime Boundaries

New diagnostic driver admission pins the exact reference manifest and accepts
only OFF on `wyatt-laptop` at DISPLAY `:0`. Existing collectors and capture code
are reused without changes. AST checks cover the driver and preflight/export
siblings' narrow path/manifest changes. The saved reference-source tests default
to the immutable reference snapshot after restoration; `FULLSIZE_REFERENCE_LIVE=1`
was used to check the actual build source before restoration.

Final focused verification passes 90 tests in 7.10 seconds. It includes
saved-evidence replay, strict frame validation,
ordered hash differences, raw RGBA/hash/size checks, independent scalar/set
crosschecks of pixel error, native build/root joins and cleanup assertions.
No tolerance was added. The old strict pixel failure and all prior seals remain.

The first driver attempt, root suffix `aK8Dem`, failed before preparation could
launch a browser. The extracted package root was 0755 rather than the required
0700. Its only output was driver.json, browserPID was null, and controller
1294520 was absent. Failure evidence remains in `failed-prelaunch-1.json` and
`off-1.log`. Only the new owned package directory's permissions were corrected;
the actual installation admission and complete preflight then passed before
the fresh `off-2` attempt. No browser assertion or bound was relaxed.

Successful run:

- Harness: `~/.cache/codex/fullsize-reference-harness-20261006-AToRZs`.
- Run: `~/.cache/codex/laptop-fullsize-reference-off-20261006-oBCin4`.
- Controller 1298071, browser 1298102; 16.872 seconds.
- 66 harness and 46 package files verified before launch; 46-file installation postcheck passed.
- Six resource samples; peak sampled artifacts 65093721 bytes, below the existing 256 MiB cap.
- Clean owned SIGTERM, root absent, 271 log bytes, zero drops.
- Export: 38 files, 1386840 bytes; all 12 recorded owned PIDs absent at export.

Fresh private profile/application-data/local-application-data/temp roots were
used. Native receipts are post-startup only: no pre-consumer, no-earlier-access,
no-network or transient-process completeness claim. No profile/token exports,
desktop browser actions, launcher changes, installation, staging or commit.
Capture 120 seconds with 15-second cleanup reserve, controller 220 seconds and
SSH 240 seconds remain unchanged.

## Next Gate

The smallest useful next runtime is import ON in this same full-size reference
package, through a separately pinned sibling admission. It would remove the
cross-build and residual V2 software-readback distinction and test whether all
48 outputs match without tolerance. The current OFF-only admission remains
frozen. No additional native rebuild is needed for that test.

Then inspect failure/context-loss safety and perform alternating sustained
moving-video performance trials. The broad performance goal remains active.
This diagnostic alone does not authorize a default change or daily installation.

Evidence: `artifacts/umbralink-control/fullsize-reference/`, especially
`comparison.json`, `package-verification.json`, `restoration.json`, raw `off-2/`
exports and the preserved RED/build/package/test logs.
