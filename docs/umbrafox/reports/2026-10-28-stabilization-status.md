---
title: Stabilization status — what is proven, what is not
status: current
doc_type: report
audience: [maintainers, developers, QA, operators, bots]
last_verified: 2026-10-28
canonical: false
---

# Stabilization status — what is proven, what is not

> **Current dated evidence.** Source, tests and receipts outrank this report; it records only what tool output showed during the stabilization campaign.

Date: 2026-10-28
Repo: `/home/wyatt/Projects/umbrafox-workspace/umbrafox`
HEAD at time of writing: `7305e5b18a1c` (docs: umbrafox-link rAF profiling)

This file records only facts observed through tool output in this session. Anything
unproven is labelled as such.

## 1. The x86_64 build is green

`BUILD_RC=0`, "Your build was successful!" (log marker `=== FULL BUILD END
2026-10-28T00:27:51Z rc=0 ===`), after `./mach configure` exit 0 in 32.7 s.

Artifact: `obj-x86_64-pc-linux-gnu/dist/bin/umbrafox`
- ELF 64-bit LSB pie executable, x86-64, with debug_info, not stripped
- `platform.ini`: `BuildID=20261027172738`, `Milestone=160.0a1`

This is the first build of HEAD that has ever existed on this host. Every prior
proof was a single-file syntax check against a copied source tree.

## 2. Gate results

### T3 (admission counters) — PASS
- The FFI defect that killed build 1 is fixed in the real generated header:
  `obj-x86_64-pc-linux-gnu/gfx/webrender_bindings/webrender_ffi_generated.h:6748`
  now reads `constexpr static const AdmissionReason AdmissionReason_ALL[20] = {...}`
  instead of the previous unresolvable bare `COUNT`.
- `nm -C dist/bin/libxul.so | grep -c admission` → 1 (present in the linked binary).
- Consumer analysis: the only readers of `ADMISSION_COUNTERS` are in
  `composite/draw_external.rs` (`record(...)` calls) and the re-export in
  `composite.rs`. Nothing branches on the counters. They are write-only
  instrumentation, which is what makes them safe.
- The gate pref `gfx.webrender.compositor.external-surfaces-in-draw` is
  `value: false` in `modules/libpref/init/StaticPrefList.yaml:8602`, `mirror: once`,
  and its only reader is `gfx/webrender_bindings/RenderCompositorEGL.cpp:99`
  via `gfx_webrender_compositor_external_surfaces_in_draw_AtStartup()`.
  Default-off is therefore proven at the pref, not just asserted.

### T2 (emulated vsync timeout) — PASS, committed
- Symbol `GetEmulatedVSyncCallbackTimeoutMs` found in
  `obj-x86_64-pc-linux-gnu/widget/gtk/Unified_cpp_widget_gtk1.o`.
  (The first lookup reported "no objects" because I searched for
  `WaylandSurface*.o`; this tree uses unified compilation. The gate was wrong,
  not the code.)
- Source is committed as `53dd54cbdcce`, working tree clean for `widget/gtk/`.
- Net effect at default prefs is *no behaviour change*: `layout.frame_rate` is
  `-1`, so `GetSoftwareVsyncRate()` returns -1, the code falls back to
  `GetDefaultFrameRate()` which returns 60, and 1000/60 = 16 ms — the same value
  as the constant it replaced. It differs only when a rate is explicitly set.

### T4 (ffvpx V4L2-M2M) — COMPILES ONLY, NEVER BUILT
This is the important one.

`toolkit/moz.configure:764-771` gates the whole feature:

```
if target.cpu in ("arm", "aarch64", "riscv64") and toolkit_gtk:
    return True
set_config("MOZ_ENABLE_V4L2", True, when=v4l2)
```

So on x86_64 `MOZ_ENABLE_V4L2` is never defined, and that is **upstream's
intent**, not a defect of ours. Observed consequence in the x86_64 objdir:
- `mozilla-config.h` has `MOZ_FFMPEG 1` and `MOZ_WIDGET_GTK 1` but no
  `MOZ_ENABLE_V4L2`.
- `find objdir -name 'v4l2_*'` → empty; no `config_components.h` under
  `objdir/media/ffvpx`.
- `nm -D dist/bin/libmozavcodec.so | grep -E 'v4l2|mp4toannexb'` → empty.

Critically: **no objdir on this host has ever contained a v4l2 object.** I checked
all three configured objdirs under `~/.cache/codex/` (wr-render-fix, hybrid-arm
candidate1, beta-20261012) — `v4l2_objects=0` for every one. The candidate source
tree does not even contain `media/ffvpx/libavcodec/v4l2_m2m.c`.

Therefore T4's 3882 lines are proven only by single-file compilation of the six
`.c` files against a hand-recovered recipe. They have never been part of a real
build, never linked, and never produced a symbol in any artifact. The BSF hazard
I identified — `.bsfs = "h264_mp4toannexb"` is resolved *by name at runtime*, so
an unregistered BSF compiles clean and fails only at playback — is exactly the
kind of defect no single-file check can catch. T4 must not be described as
delivered until an aarch64 build produces the symbols.

## 2b. T4 aarch64 progress (added after the x86_64 section was written)

An aarch64 objdir was configured to test the claim that T4 is gated out by
upstream condition rather than broken. Result: the gate **is** the only reason it
was dormant.

- `./mach configure` with `--target=aarch64-linux-gnu` → `rc=0`, "Configure
  complete!", 2276 Makefiles generated, objdir at `obj-aarch64-linux-gnu`.
- `obj-aarch64-linux-gnu/config/autoconf.mk` line 199: `MOZ_ENABLE_V4L2 = 1`
- same file, `ACDEFINES`: `-DMOZ_ENABLE_V4L2=1` (alongside `-DMOZ_FFMPEG=1`,
  `-DMOZ_WIDGET_GTK=1`, `-DMOZ_ENABLE_VAAPI=1`)
- `obj-aarch64-linux-gnu/mozilla-config.h`: `#define MOZ_ENABLE_V4L2 1`
- `obj-x86_64-pc-linux-gnu/config/autoconf.mk`: **zero** occurrences of
  `MOZ_ENABLE_V4L2` — the contrast is the proof that the target condition, not
  the code, controls this.

Decisive for T4's reachability: the generated
`obj-aarch64-linux-gnu/media/ffvpx/libavcodec/backend.mk` lists all six vendored
sources and the BSF in the build graph:

```
CSRCS += $(srcdir)/v4l2_buffers.c
CSRCS += $(srcdir)/v4l2_context.c
CSRCS += $(srcdir)/v4l2_fmt.c
CSRCS += $(srcdir)/v4l2_m2m.c
CSRCS += $(srcdir)/v4l2_m2m_dec.c
CSRCS += $(srcdir)/v4l2_m2m_enc.c
...
    v4l2_buffers.o v4l2_context.o v4l2_fmt.o v4l2_m2m.o v4l2_m2m_dec.o
    v4l2_m2m_enc.o ... bsf/h264_mp4toannexb.o
```

So T4 is genuinely wired into the build graph, not merely present on disk. That
is stronger than anything previously established, but it is still not a
compilation: `make v4l2_m2m.o` currently fails on missing *generated* headers
(`mozilla-config.h` first, then `fdlibm.h`), both of which are produced by the
build rather than by configure. `make mozilla-config.h` succeeded; `make export`
is the remaining prerequisite. **No v4l2 object has been produced yet.**

## 2c. Correction to my own risk note

I wrote above that no objdir anywhere on this host contained a v4l2 object, which
is true, but I had checked only the three under `~/.cache/codex/`. The reason none
of them had one is now proven rather than assumed: those objdirs were configured
for aarch64 against *older source trees that predate T4*, so the sources were not
in the tree at all. The new `obj-aarch64-linux-gnu` in the main checkout is the
first objdir that both enables the gate and contains the sources.

## 3. Worktree state — the real risk, and it is not what I said earlier

Measured with `git status --porcelain -uall` (the `-uall` matters; without it git
collapses untracked directories and the count is meaningless):

- deleted, uncommitted: **314** files
- modified, uncommitted: **7** files
- untracked: **1493** files

My earlier figure of "784 untracked" came from directory-collapsed output and
understated the tree by roughly half. Corrected here.

The 314 deletions are a docs reorganization that exists **only on disk**:
`bot-docs/` and `umbrafox-conversion-guide/` are gone; their contents live under
`docs/umbrafox/`. Verified: all 314 deleted files have a same-basename counterpart
under `docs/umbrafox/`, so nothing was lost by filename. 313 of them differ from
their HEAD version — expected, because the migration also rewrote cross-links from
`bot-docs/...` to `docs/umbrafox/archive/...` and added a "Current conversion
guidance" banner.

Notable: `docs/umbrafox/conversion-guide/` is **not** in `docs/config.yml`'s
category tree, and is not built by Sphinx. `docs/index.md` gains a pointer to
`umbrafox/README.md`, which *is* reachable. So the conversion guide is
plain-markdown documentation outside the built docs, which is fine as long as
nobody expects `./mach doc` to publish it.

The 7 modified files contain **zero** references to the old paths — verified by
grep for `bot-docs/` and `umbrafox-conversion-guide/` in each. `AGENTS.md:15`
already points at `docs/umbrafox/conversion-guide/02-mandatory-modification-rules.md`
and that file exists.

## 4. What this means for "stabilize"

Ordered by risk, not by interest:

1. **The docs migration is uncommitted.** 314 deletions and ~350 files of new
   documentation exist in exactly one place. A `git checkout .` or an accidental
   `git clean` destroys the reorganization. This is the largest exposure in the
   tree and it has nothing to do with T2/T3/T4.
2. **T4 is unproven and dormant on x86_64.** Either finish it (aarch64 build +
   symbol gates) or stop counting it as landed. Keeping it as "committed but
   never built" is the worst of both.
3. **T2 and T3 are genuinely done** for the x86_64 target: committed, built,
   symbol-present, default-inert. Their remaining risk is behavioural, not
   structural — T2 needs a 50 Hz/120 Hz display to show any effect at all, and
   T3 needs a pref flip plus a compositor path to emit anything.
4. **No runtime test of any kind has been performed** on this artifact. No
   `mach run`, no playback, no WebRender verification. The build is a
   compile+link proof only.

## 5. Contradictions corrected in this session

- "784 untracked files" → 1493 (directory collapsing).
- "T4 compiles" → compiles in isolation only; never built or linked.
- "T2 symbol absent" → present in `Unified_cpp_widget_gtk1.o`; my search pattern was wrong.
- "the wrapup plan document is missing" → it moved to
  `docs/umbrafox/archive/plans/2026-10-24-wrapup-stabilization.md` as part of the
  uncommitted migration; still present in HEAD at the old path.
- "no new prefs were added" → one was added
  (`gfx.webrender.compositor.external-surfaces-in-draw`, default false); my first
  grep pattern missed it.
