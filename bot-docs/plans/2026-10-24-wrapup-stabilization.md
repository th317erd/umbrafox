# Wrap-up and stabilization plan — T2 / T3 / T4 plus general tree health

Date: 2026-10-24
Status: proposed, awaiting owner go-ahead on Phase 1
Author: coordinator (browser source/build/packaging lane)

## 0. Purpose

Three accepted changes landed in this tree over 2026-10-23/24. All three are
committed and pushed. None of them has ever been through a full build of this
repository, and none has ever run. This plan turns "committed and believed
correct" into "built, gated, measured, and documented", then closes the general
stabilization debt around them.

The guiding constraint is unchanged and overrides convenience: **Umbrafox must
remain web-visible-identical to upstream Firefox at default preferences.** Every
change below is therefore required to be *default-inert*, and inertness is an
assertion that gets tested, not an intention that gets trusted.

## 1. Verified starting state

All of the following was read from the repository on 2026-10-24, not recalled.

| Fact | Evidence |
| --- | --- |
| HEAD = `4a1f8ccefc752062b817b4fd12cfdb358928177f` | `git rev-parse HEAD` |
| HEAD == `origin/main`, `0 0` ahead/behind | `git rev-list --left-right --count`, `git ls-remote` |
| Tracked modifications: **0** | `git diff --name-only` empty |
| Untracked: **784** files | `git status --porcelain \| grep -c '^??'` |
| Tracked files: 485,251 | `git ls-files \| wc -l` |

The three commits under review:

| Task | Commit | Scope | Size |
| --- | --- | --- | --- |
| T3 admission counters | `ee9a6ec7e553` | `gfx/wr/webrender/src/composite{,.rs,/admission.rs,/draw_external.rs}` | 3 files, +507 / −40 |
| T2 vsync rate | `53dd54cbdcce` | `widget/gtk/WaylandSurface.{cpp,h}` | 2 files, +28 / −2 |
| T4 V4L2 M2M vendoring | `4a1f8ccefc75` | `media/ffvpx/**` + `config_override.h` | 18 files, +3882 |

## 2. Findings that change the plan

These are the reasons this is a stabilization plan and not a shipping
announcement. Each one is a place where the current evidence stops short of the
claim.

### F1. No build of HEAD exists anywhere on this host

This is the central finding and it invalidates any assumption that "it builds".

- This repository's own objdir `obj-x86_64-pc-linux-gnu/` is **empty**: 13 MB,
  one `docs/` subdirectory, **no `config.status`, no `Makefile`, no
  `dist/bin/libxul.so`**. It has never been configured.
- All six configured objdirs under `~/.cache/codex/*/obj` have `topsrcdir`
  pointing at `~/.cache/codex/<name>/source` — **separate plain copies, with no
  `.git`** — not at this checkout:
  `umbrafox-arm-20261014-gZmxuBOR`, `umbrafox-beta-20261012-nYSBPOWS`,
  `umbrafox-hybrid-arm-20261019-candidate1`, `umbrafox-wr-render-fix-20261016`,
  `umbrafox-wr-render-p2-layout-20261016`, `umbrafox-wr-video-p1-cIrmxHaw`.
- The newest committed binaries all predate these three commits:
  `umbrafox-clipboard-20261015235226-linux-x86_64.tar.xz`,
  `umbrafox-hybrid-20261019183200-linux-aarch64.tar.xz`,
  `umbrafox-hybrid-20261019063025-linux-aarch64.tar.xz`.
- The candidate tree used to per-file-compile T4 does not contain T4:
  `media/ffvpx/libavcodec/v4l2_m2m.c` is **absent** there, and its
  `widget/gtk/WaylandSurface.cpp` hashes to `64857365407c`, which is neither
  HEAD (`e29f131f0569`) nor pinned base `9a9057291b5b` (`becffd28f40b`).

Consequence: every T2/T3/T4 claim to date is a *per-file compile* (T2, T4), a
*unit test* (T3), or a *symbol presence* check (T4). No full link has occurred.
No artifact contains these changes. "Implement into the browser" is literally
unfinished work, not a formality.

### F2. T2 is correct but currently a no-op at default prefs

`53dd54cbdcce` replaced a hardcoded `(int)(1000.0/60)` with
`gfxPlatform::GetSoftwareVsyncRate()` plus a `GetDefaultFrameRate()` fallback.
Traced by hand through the actual sources:

- `modules/libpref/init/StaticPrefList.yaml:11671` — `layout.frame_rate`,
  `value: -1`.
- `gfxPlatform.cpp:3491` `LayoutFrameRateFromPrefs()` returns that −1.
- `gfxPlatform.cpp:3506` `GetSoftwareVsyncRate()` returns
  `GetDefaultFrameRate()` when the pref is `<= 0`.
- `gfxPlatform.cpp:3515` `GetDefaultFrameRate()` returns literal **60**.

So at default preferences the new code computes `1000/60 = 16` ms — exactly the
old constant. The change only alters behaviour when `layout.frame_rate > 0`.

This is the *safe* direction (default-inert), and it is genuinely the right
shape: a hardcoded 60 Hz fallback would silently disagree with the compositor on
a 50 Hz panel. But the plan must not credit T2 with an improvement it does not
currently deliver, and any test for T2 must set the pref or it proves nothing.

### F3. T4 is fail-open by construction, which is the property to preserve

`FFmpegVideoDecoder.cpp` resolves `h264_v4l2m2m` **by name at runtime** and is
called as:

```cpp
#  ifdef MOZ_ENABLE_V4L2
  // ...
  if (NS_SUCCEEDED(InitV4L2Decoder())) {
```

So a missing decoder, a missing device, or a failed probe falls through to the
next path rather than failing playback. Ordering also matters and is already
sensible: VA-API is attempted **before** V4L2, so x86 Intel boxes keep VA-API and
only the Pi (no VA-API) reaches the V4L2 path. T4 is therefore compile-safe and
runtime-fail-open. What is *not* proven is that the vendored sources are
actually compiled and registered into the shipped `libmozavcodec.so`, and that a
Pi 4 selects the hardware path at playback time.

### F4. T3 is measurement-only and currently unconditioned

`ee9a6ec7e553` touches only three Rust files in the `webrender` crate. There is
no C++ consumer; nothing outside webrender reads the counters. It cannot change
rendering by itself, which makes it safe — but it also cannot be verified from
outside, so if it is to have any value it needs a readable surface (a pref-gated
`about:support` row or a probe getter). The 20 passing
`cargo test -p webrender --lib composite::` tests are real and are the strongest
evidence in the whole set.

### F5. The worktree carries 784 files that upstream deliberately deleted

`browser/Makefile.in`, `dom/Makefile.in`, and
`testing/mozharness/scripts/desktop_partner_repacks.py` are untracked, are **not**
ignored, and were **tracked and later deleted upstream** —
`git log -- browser/Makefile.in` shows `7b33b38397fa` *"Remove the Make driven
Windows installer build"*. So these are stale pre-removal files sitting in a
Firefox 160.0a1 tree, not new local work.

They are almost certainly inert (160 removed the Makefile-driven build), but
"almost certainly inert" is exactly the class of premise this plan exists to
stop trusting. They are a configure-time hazard until checked.

### F6. Pariah-surface risk is the reason for ordering

Six non-upstream commits now sit on a 160.0a1 snapshot. The three under review
are all default-inert, and that property is what keeps the fork invisible to
sites. It must be protected by assertions, and it is why the gate order below
runs "does default Firefox still behave identically" before "does the new path
work".

## 3. Goals and non-goals

Goals
1. Prove HEAD links: one full build of *this* repository at *this* commit.
2. Prove the three changes are present in the built artifacts and default-inert.
3. Prove each change does what it claims, on a device that can show it.
4. Make the docs match reality (MEMORY.md §1/§4/§12 are now stale).
5. Leave the tree in a state where the next agent does not have to re-derive
   any of section 1 or 2.

Non-goals
- No re-implementation or re-vendoring of T4. It is accepted; this plan
  validates it.
- No cleaning, resetting, or reverting of the worktree, and no deletion of the
  784 untracked files without an explicit decision (see Q3).
- No touching of the owner's daily browser at any point.
- No `./mach bootstrap` (already ruled out of scope by the owner).

## 4. Phases, tests, and gates

Each test has a `verify` command and a pass condition. A phase is done only when
all its blocker-severity tests pass. Status starts `pending`.

### Phase 0 — Freeze and record (no build, no risk)

| id | assert | severity | verify |
| --- | --- | --- | --- |
| P0-01 | Starting revision recorded in this plan | blocker | this file, §1 |
| P0-02 | Remote parity reconfirmed before any build | high | `git rev-list --left-right --count origin/main...HEAD` → `0 0` |
| P0-03 | Untracked-file policy decided and written down | high | Q3 answered; decision recorded here |
| P0-04 | MEMORY.md §1/§4/§12 corrected to name `4a1f8ccefc75` and the three commits | medium | grep MEMORY.md for stale `b3ca97a4a136`/`9a9057291b5b` claims |
| P0-05 | No source file modified by this phase | blocker | `git diff --name-only` empty |

Rationale: the build in Phase 1 is expensive. A record of exactly what is being
built, and of whether the tree was clean when it started, is what makes the
build's result attributable.

### Phase 1 — First full build of HEAD (x86_64, native, 2 jobs)

The repo's `mozconfig` already targets
`MOZ_OBJDIR=@TOPSRCDIR@/obj-x86_64-pc-linux-gnu` with `--with-ccache=sccache`.
`sccache` is warm under `~/.cache/sccache`. This is a genuine from-scratch
configure, and its duration is unknown; treat it as long-running.

| id | assert | severity | verify |
| --- | --- | --- | --- |
| P1-01 | `mach configure` succeeds on a tree carrying 784 stale files | blocker | `./mach configure` exit 0 |
| P1-02 | The 784 stale files did not enter the build graph (F5) | high | grep the generated `backend.mk`/`Makefile` set for `browser/Makefile.in`, `dom/Makefile.in` |
| P1-03 | `mach build` links successfully at 4a1f8ccefc75 | blocker | exit 0; `dist/bin/libxul.so`, `dist/bin/firefox` exist |
| P1-04 | No new warnings attributable to the three commits | medium | build log diff against a clean baseline for `WaylandSurface.cpp`, `composite/*.rs`, `media/ffvpx/**` |

### Phase 2 — Artifact and symbol gates

| id | assert | severity | verify |
| --- | --- | --- | --- |
| P2-01 | T4 registrations are in the built libavcodec | blocker | `nm -D dist/lib/libmozavcodec.so \| grep -E 'h264_v4l2m2m_decoder\|h264_mp4toannexb_bsf'` → both present |
| P2-02 | `config_override.h` actually enabled the gate | blocker | preprocessor dump shows `CONFIG_V4L2_M2M 1`, `CONFIG_H264_V4L2M2M_DECODER 1`, `CONFIG_H264_MP4TOANNEXB_BSF 1` |
| P2-03 | T3 unit tests green at HEAD | blocker | `cargo test -p webrender --lib composite::` → 20 passed, 0 failed |
| P2-04 | T2 compiled into the GTK widget code | high | `nm -C dist/bin/libxul.so \| grep GetEmulatedVSyncCallbackTimeoutMs` |
| P2-05 | Failure is bounded, not a crash, when no V4L2 device exists | high | run with no `/dev/video*` M2M; playback falls back, no assert/abort |

P2-01 is the single most valuable gate in this plan: it is the first proof that
eighteen committed files are actually inside a shipped binary.

### Phase 3 — Default-inertness regression (the pariah gate)

| id | assert | severity | verify |
| --- | --- | --- | --- |
| P3-01 | Default build behaviour identical to upstream at default prefs | blocker | H.264 playback + `about:support` on the built binary; decode path chosen matches a stock Firefox build on the same host |
| P3-02 | T2 changes nothing at default prefs (F2) | blocker | with `layout.frame_rate=-1`, emulated timeout == 16 ms (log/`MOZ_LOG` or debugger) |
| P3-03 | T2 does change at `layout.frame_rate=50` | high | timeout == 20 ms; proves the change is functional, not decorative |
| P3-04 | T3 alters no rendering at default prefs | high | counters read zero-cost path; no visual or timing delta vs P3-01 |
| P3-05 | No new network-visible or JS-visible difference | blocker | fingerprint delta check: `navigator`/UA/`User-Agent`/feature probes unchanged vs stock 160.0a1 |

P3-02 and P3-03 are deliberately paired. Testing only the default case would
"pass" a function that does nothing; testing only the pref case would miss the
pariah regression.

### Phase 4 — aarch64 artifact and Pi 4 runtime proof

Owned jointly with l8ros; the device and measurement side is theirs.

| id | assert | severity | verify |
| --- | --- | --- | --- |
| P4-01 | aarch64 build of 4a1f8ccefc75 links | blocker | `MOZCONFIG=mozconfig.aarch64 ./mach build` exit 0 |
| P4-02 | `h264_v4l2m2m` registered in the aarch64 artifact | blocker | `nm` on packaged `libmozavcodec.so` |
| P4-03 | Pi 4 selects hardware decode at playback | blocker | `about:support` → HARDWARE_VIDEO_DECODING; ffmpeg log shows `h264_v4l2m2m`; no software decode |
| P4-04 | Meets the l8ros acceptance bar | high | 1080p60 ≥ 57 fps, < 5 % dropped, page cadence ≥ 470/480 intervals ≤ 18 ms |
| P4-05 | Fallback intact when the decoder is removed | high | rename/disable the module, playback still succeeds in software |

P4-03 is the only test that can turn T4 from "vendored" into "working". Until
then T4 must be described as built-but-unproven.

### Phase 5 — Close-out

| id | assert | severity | verify |
| --- | --- | --- | --- |
| P5-01 | MEMORY.md and DETAILS.md match the final state | high | stale HEAD/pin claims gone; new commits named |
| P5-02 | A new versioned export exists for the validated revision | high | `exports/<tag>/` with sha256, ELF identities, package input |
| P5-03 | T3 has a readable surface or is explicitly declared instrumentation-only | medium | decision recorded in this plan |
| P5-04 | Risks and any failed gate recorded, not silently dropped | blocker | this file's §7 populated |

## 5. Order and why

0 → 1 → 2 → 3 → 4 → 5, strictly.

The build (1) must precede symbol gates (2), because symbol presence is the
first real evidence for T4. Default-inertness (3) must precede the Pi work (4),
because shipping a fingerprint regression to a device is worse than shipping
nothing. Docs (5) last, because they are the only phase that can be written
correctly only once the results exist.

Within Phase 1, run at two jobs as the standing constraint requires. The build
is the long pole; everything else is minutes.

## 6. Risk register

| risk | likelihood | impact | falsifying check | mitigation |
| --- | --- | --- | --- | --- |
| Stale 784 files break configure (F5) | low-medium | high | P1-01/P1-02 | identify offenders, move aside non-destructively; never clean the tree |
| From-scratch build fails for unrelated reasons | medium | medium | P1-03 | failures are informative; fix forward, record them |
| T4 compiles but never registers | medium | high | P2-01 | moz.build/`codec_list.c` audit, already partly done |
| T4 registers but Pi never selects it | medium | high | P4-03 | runtime probe on device |
| T2 has no observable effect (F2) | **certain at default prefs** | low | P3-02/P3-03 | documented as intentional; value only with `layout.frame_rate` set |
| T3 is unread dead weight (F4) | medium | low | P5-03 | add gated surface or declare instrumentation-only |
| Fingerprint regression from the fork | low | critical | P3-01/P3-05 | default-inert tests are blockers, not nice-to-haves |
| Build duration exceeds patience | medium | low | — | 2 jobs, sccache warm, background, report progress |

## 7. Results

Filled in as phases complete. Failures go here as failures.

- (pending)

## 8. Open questions

See the numbered list at the end of the accompanying message.
