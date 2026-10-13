# October 12 Opt-in Performance Beta

## Outcome

Prepared and separately installed experimental BuildID `20261012202039`,
Umbrafox `160.0a1`, for Wyatt's explicitly requested opt-in test. The installed
package is `/home/wyatt/Programs/umbrafox-nightly/`; `--version` passes. The
normal source defaults remain off. This is not performance/release acceptance.

The package overlay enables exactly:

- `gfx.canvas.remote.use-draw-image-fast-path-dmabuf`
- `gfx.webrender.single-image-opacity.enabled`

Existing request eligibility/header fixes, userland lifecycle/DOM work, exact
canvas fallback, readback caches, surface reuse and producer fences are already
compiled in. No profiler, extra logging, unsupported-hardware override, sandbox
change, UA override or update-channel override was added. Probe instrumentation
is explicitly compiled out. User preference overrides still take precedence.

The active October 1 installation, working profile, desktop entry and launcher
were not modified or restarted. The usual launcher prioritizes dated installs
over `umbrafox-nightly`, so it still selects the previous browser. Do not claim
that an ordinary restart selects this beta. Switching it must preserve the
per-installation default profile mapping established on October 12; do not
reintroduce forced profile arguments or copy a live profile.

## Package Identity

Export directory: `exports/umbrafox-beta-20261012/`.

- Archive: `umbrafox-beta-20261012202039-linux-x86_64.tar.xz`
- Archive size: 106,613,504 bytes
- SHA256: `75d03f82d3282c64eafbe3312087bbf2284613ef0aad3608892774ff82081e92`
- Source base: `d43214d6704182dabefff44b772764db04e386f1`
- Package source patch: `4e512d8f6a3a6f64c0b5a7ff1b99c5351723af09d79f93385dbf48f17cbc5938`
- Preference overlay: `4278e82f4538bf4058aefd3b488e77069be9c7edd1e36791456c194e79967eb2`

`package-input.json` pins every file's bytes, mode and hash, configuration, base
archive, source patch and overlay. Both INI BuildIDs and the native libxul toolkit
note agree. The package has 47 regular files, no symlinks. Installation adds only
the verified empty `.purgecaches` marker. Previous nightly is retained at
`~/Programs/umbrafox-nightly.before-beta-20261012-202039/`, a name that the usual
launcher does not select. Launcher SHA256 remains
`36b8df60cd05fea0f50fbb92ea0fe9433ddf0c9910c0df89d15cd3e07854c0cd`.

## Build And Source Fixes

The build used an isolated detached worktree to exclude unrelated old untracked
files in the working checkout. Nothing from that untracked set was removed or
staged. Durable build root:
`/home/wyatt/.cache/codex/umbrafox-beta-20261012-nYSBPOWS/`.

Native builds used two jobs and nice level 10. The first full build exhausted
its 7200-second bound. Incremental continuation exposed a missing direct
`mozilla/Services.h` include in `UmbrafoxUserlandMutation.cpp`, formerly masked
by unified compilation. Adding the include completed the normal build.

The gtest build then exposed two `DrawTargetWebgl::Init` calls missing upstream's
new `ContentParentId` parameter. Both test calls now use explicit owner 1.
Normal and test libraries were rebuilt through the build system with
`MOZ_BUILD_DATE=20261012202039`, then `mach package` produced the self-contained
normal archive. No native stamp or generated configuration was hand-edited.

Subsequent cache-test-only corrections are recorded separately from the sealed
normal archive's source patch. Small 16x16 cache fixture targets now use explicit
`Init` rather than production `Create` admission, which requires at least the
configured 128x128 area. All three fixture creation sites retain their explicit
content owner and validate `IsValid`. NVIDIA allocates RGBA input where the old
Intel fixture assumed BGRA. The fixture now admits those two explicit formats,
passes the actual input format through import, verifies surface/data formats,
and checks exact red/green/blue/alpha bytes in that layout. No tolerance, pixel
value, cache assertion or production GPU eligibility rule was weakened.

## Verification

| Gate | Result |
| --- | --- |
| Tooling on pinned Node 24.13.0 | 467 pass, zero failures/skips |
| Exact beta defaults / normal defaults | 2 pass, included above |
| Archive validation | 5 pass |
| Native inventory contract | 3 pass |
| Installer guards | 4 pass |
| Native graphics, corrected fixture | 79 pass, 7 fail, zero skips |
| Isolated UmbraLink OFF/ON browser smoke | PASS |
| Installed version command | PASS: Umbrafox 160.0a1 |

The ambient Node 21 run failed due to missing APIs and incompatible test-timer
behavior. Its log is retained; the supported Node 24 run passed. Initial native
launch omitted DISPLAY and could not create its GPU context; that failed/skipped
attempt is also retained, not counted as a product failure or a passing gate.

The corrected native run used an actual NVIDIA GeForce RTX 2060 EGL context.
All 63 non-prescale cases pass: 12 canvas cache, 7 producer fence, 4 invalid
descriptor import, 27 video readback/cache, 4 IPC and 9 remote image holder.
The extra 23-case prescale suite passes 16 and fails the same seven named
characterization cases retained from October 6. Their mismatch counts differ
from the older Intel run; no equality across drivers is claimed.

| Retained prescale failure | Differing components | Maximum channel delta |
| --- | ---: | ---: |
| VideoOddCompositionMatches | 4,023 | 2 |
| VideoAlphaCompositionMatches | 28,139 | 1 |
| VideoSoftwareCompositionMatches | 23,638 | 1 |
| VideoOddSoftwareCompositionMatches | 159,091 | 27 |
| VideoAlphaSoftwareCompositionMatches | 12,486 | 1 |
| SmallAlphaCompositionMatches | 2 | 1 |
| SmallSoftwareCompositionMatches | 4 | 1 |

These failures remain failures: the runner exits 1 and reports `not-accepted`
for the full 86-case matrix. They are not excluded, relabeled as passing, or
fixed by this beta. The current `DrawImage` fallback calls full-size
`GetAsSourceSurface`; it no longer uses the destination-sized CPU prescaling
helper exercised by those tests. See [Exact Canvas Fallback](2026-10-06-exact-canvas-fallback.md)
and [Readback Operation-Order Isolation](2026-10-06-readback-operation-order.md).

The cache setup failures were preserved before both fixture corrections. The
final tests cover actual reuse, exact pixels, content-owner isolation, missing
targets/identity, invalid imports, memory pressure, context loss and explicit
replacement. This is not physical driver-reset or uninterrupted playback proof.

The browser smoke used only fresh owned profile/application/local/temp roots
and a loopback fixture. Public-surface snapshots match with UmbraLink off/on and
before/after commands; `navigator.webdriver` is false and privileged service
globals are absent in page JS. Navigation, synchronous/asynchronous evaluation,
privileged evaluation and tab lifecycle pass. Native receipts confirm the
BuildID, actual owned directory roots, both optimization preferences true and
profiler inactive. Both owned browsers received clean SIGTERM cleanup. This
does not compare against an independently built stock Firefox, prove universal
pixel/network parity, or measure YouTube playback.

## Limits And Next Step

The prior two smoothness comparisons still fail; their 26-29% CPU improvement
must not be attributed to this new upstream-integrated beta without new paired
measurements. No new YouTube performance claim is made. The next performance
investigation remains the separately planned audio-on seek test.

Only the experimental package defaults are enabled by this request. Normal
builds still default both switches off. No public JavaScript interface was
added by this beta overlay or the compile/test fixes. The owner knowingly opted
into the experimental rendering paths; this is not a blanket parity exception
for ordinary builds or other browser behavior.

Before daily dogfooding, coordinate closing the active browser and verify the
chosen installation maps to the current working profile. The existing nightly
profile mapping is different from the active dated installation; a direct
launch without that check can display an older profile. Do not silently switch
the taskbar/launcher or migrate profile data while the owner is working.

Selected build logs, exact runners, package/installation receipts, raw native
results and public smoke snapshots are in the export's `evidence/` directory.
Private test profiles, control tokens and generated browser libraries are not
copied into that evidence directory. The original scratch logs and intermediate
diagnostic packages remain available; no failed attempt was overwritten.
