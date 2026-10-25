# x86_64 pivot: artifact pin, VA-API configuration, promotion scope, packaging deltas

Date: 2026-10-25. Answer to `l8ros/bot-docs/plans/2026-10-24-jessica-laptop-x86_64-pivot.md` §7.2,
plus the three follow-on questions in that request. Owner decision under implementation: the Pi 4
is scrapped as the target, jessica-laptop (i3-8130U / UHD 620, x86_64) is the target, everything is
staged in QEMU first, and the drive may be reformatted.

**No build was started for this document.** Every number below is either read from this repository,
read from the pinned build's own objdir, or quoted from the feasibility report's measured runs.

## 0. State of this checkout, because it changes what "pin" can mean

The tree moved after the October 23 handoff. Verified now:

| Fact | Value |
| --- | --- |
| HEAD | `772182e42afb` (Keep the AdmissionReason array bound out of cbindgen's reach) |
| Unpushed | 2 commits: `51c2edc4859f` (wrap-up plan), `772182e42afb` |
| Commits since the memory dump | `c7bc4c798160` hybrid landed, `ee9a6ec7e553` admission counters, `53dd54cbdcce` vsync rate, `4a1f8ccefc75` V4L2 M2M vendoring, `51c2edc4859f`, `772182e42afb` |
| Local x86_64 objdir | `obj-x86_64-pc-linux-gnu`, configured Oct 24, `dist/bin/libxul.so` linked (3.0 GB, Oct 25 01:21Z), **no `dist/bin/firefox`, no package** |
| Any newer x86_64 package | none. No `linux-x86_64` tarball anywhere in `~/.cache/codex/*/obj*/dist` or `exports/` is newer than October 15 |

So "the current source" has no artifact yet; the wrap-up plan's Phase 1 build reached libxul and
stopped before packaging. Anything pinned today is pinned from before those commits, which is fine
for VA-API (none of them touch it) but must be re-pinned once a HEAD package exists.

## 1. The artifact to pin

**Yes, `74ec5e39…` is still the right pin, and nothing newer exists.** Verified this session by
hashing the file itself, not by quoting the report:

| Item | Value |
| --- | --- |
| Path | `/home/public/wyatt-desktop/.cache/codex/umbrafox-beta-20261012-nYSBPOWS/obj/dist/umbrafox-160.0a1.en-US.linux-x86_64.tar.xz` |
| Size | 107,883,996 B |
| SHA256 | `74ec5e39e103313be042a01fe625a29d1bfe961b5c38849a4f129f1354fafb1a` |
| BuildID | `20261015235226` (`application.ini` and `platform.ini` agree) |
| Version | 160.0a1 |
| Build config | `MOZ_ENABLE_VAAPI 1`, `MOZ_FFMPEG 1`, `MOZ_WAYLAND 1` (from that objdir's `mozilla-config.h` and `config.status`) |
| Archive | 57 members, 477,829,120 B uncompressed, self-contained `umbrafox/` tree |

Two things to get right when relaying this:

1. **Do not pin the clipboard archive instead.** `exports/umbrafox-clipboard-20261015/package/
   umbrafox-clipboard-20261015235226-linux-x86_64.tar.xz` has the *same* BuildID but is a different
   archive: 119,460,288 B, sha256 `b4db996ef95a01d5e967126f…`, one extra member
   (`umbrafox/defaults/pref/umbrafox-beta.js`, the `4278e82f` two-pref overlay) and single-block xz
   compression. Its own `package-input.json` records `baseArchiveSHA256: 74ec5e39…`, i.e. the
   108 MB file above *is* its base. The overlay enables DMABuf drawImage and single-image opacity —
   do not ship it in the appliance.
2. **BuildID is not an identity.** Two archives share `20261015235226`. The image must pin
   path + sha256, which `image/assemble.sh` already does.

**VP9 VA-API "by default": already true in this build, and it is not a build flag.** Checked in the
same source that produced the artifact:

- `media.ffmpeg.vaapi.enabled` **does not exist** in this tree. Grepping that source's
  `StaticPrefList.yaml` finds no such pref; the only VA-API pref is
  `media.ffmpeg.vaapi.force-surface-zero-copy` (uint32, default 2 = default behaviour, 0 = force
  copy).
- Capability comes from a runtime probe, not a pref: `widget/gtk/GfxInfo.cpp` launches a
  `vaapitest` child with the DRM render device, reads `VAAPI_SUPPORTED` and a codec bitmask, and
  `gfxPlatform.cpp` turns that into `gfxVars::UseVP9HwDecode()` /
  `UseH264HwDecode()` / `UseHEVC…` through `CODEC_HW_FEATURE_SETUP`. The pinned source contains both
  the probe and `CODEC_HW_DEC_VP9`.
- `dom/media/platforms/ffmpeg/FFmpegDecoderModule.h` therefore offers VP8/VP9/AV1/H264/HEVC only
  when the driver reported them, and `FFmpegVideoDecoder.cpp` refuses the hw path otherwise.

Consequence: on jessica-laptop, with iHD 24.1.0 answering the probe, this exact build should offer
VP9 hardware decode with **no prefs set**. That is a prediction from source plus the host-side
`ffmpeg` evidence in the feasibility report; it is verified on the device by `about:support` →
HARDWARE_VIDEO_DECODING and by the log check in §2, not by inference.

**Recommendation:** pin `74ec5e39…` for the bring-up, but copy it out of the objdir first — that
directory belongs to a build that the wrap-up plan may clobber, and a pin must not point into it.
I can do that copy plus a hash receipt as an export without any build; say the word. Re-pin to the
first packaged HEAD artifact from the wrap-up build when it exists, keeping one BuildID + one path
+ one sha256 per image.

## 2. VA-API on x86_64: prefs, runtime, and what the build does not need

**Build: nothing to change.** `toolkit/moz.configure:755` sets `MOZ_ENABLE_VAAPI` unconditionally
whenever `toolkit_gtk` (so every Linux build, all arches), and `MOZ_FFMPEG` comes from finding the
system ffmpeg at configure time. The pinned artifact already has both, and so will the wrap-up
build. There is no `--enable-vaapi` to add and no source change required.

**Prefs: nothing needs to be enabled; a few must not be broken.** Verified defaults in this tree:

| Pref | Default | Action |
| --- | --- | --- |
| `media.ffmpeg.vaapi.force-surface-zero-copy` | 2 (default) | leave. `0` forces CPU copies and is a useful A/B, not a fix |
| `media.hardware-video-decoding.enabled` | true | leave |
| `media.hardware-video-decoding.force-enabled` | false | leave; it can enable paths the driver refused |
| `media.rdd-process.enabled` | true on Linux GTK | leave. Decode runs out of process; do not disable it to "simplify" the image |
| `media.ffvpx-hw.enabled` | true on GTK | irrelevant to VA-API (see below); leave |
| `media.prefer-non-ffvpx` | false | leave |
| `media.ffmpeg.vaapi.enabled` | **does not exist** | setting it does nothing; remove it from any pref file or plan that names it |

`media.ffvpx-hw.*` cannot help on x86_64: the vendored ffvpx has `CONFIG_VAAPI` off (it appears
nowhere in `media/ffvpx/config_unix64.h`), and the vendored V4L2 M2M sources from `4a1f8ccefc75` are
not even compiled there — `toolkit/moz.configure` only defines `MOZ_ENABLE_V4L2` for
`arm`/`aarch64`/`riscv64`. VA-API on x86_64 is the **system** ffmpeg module, loaded by soname.

**Runtime, which is the actual delta:**

- `libva.so.2` — dlopened by `VALibWrapper`, so it is not in `libxul.so`'s `NEEDED` list. Must be
  installed.
- A VA driver: `intel-media-va-driver-non-free` (iHD 24.1.0, the one measured) or
  `intel-media-va-driver`. Gen9.5 is covered by iHD; the old i965 driver also works but is not what
  the feasibility run measured.
- A DRM render node the kiosk user can open: `/dev/dri/renderD128`. Group/ACL, not root.
- Mesa EGL/gbm for the zero-copy import path (`libegl-mesa0`, `libgbm1`, `libgl1-mesa-dri`).
- System ffmpeg: `libavcodec.so.<n>` must exist. This tree dlopens, in order,
  `libavcodec.so.63` down to `.so.53`, so a distro build in that range works - 24.04 is expected to be
  `libavcodec.so.60`, which should be confirmed with `ldconfig -p | grep libavcodec` rather than
  assumed. Ubuntu 26.04 is unverified here: if it ships a major **above 63**,
  Firefox loses ffmpeg entirely and therefore *all* H.264 decode, software included.

**Per-run verification, cheapest first:**

1. `about:support` → HARDWARE_VIDEO_DECODING = Enabled, and the codec table showing VP9 decode.
2. UmbraLink `umbrafox.gfx.snapshot` — its `nsIGfxInfo` section carries the codec support summary,
   which is what the probe fed. This avoids touching the browser.
3. `MOZ_LOG=FFmpegVideoDecoder:5,PDMFactory:5` on one playback, grepping for `vaapi` and the selected
   decoder. This is the same evidence shape the host `ffmpeg` run gave (`pix_fmt: vaapi`).
4. A/B `media.ffmpeg.vaapi.force-surface-zero-copy=0` against default to see whether the kiosk's
   session actually gets the zero-copy import. Under XWayland the decode is unaffected; only the
   display copy may differ, and that is a CPU cost question, not a decode question.

## 3. Promotion: agreed, drop attach/skip and the pump from the x86_64 port

**I agree with your read, and I would go further: on this target the promotion path is not merely
unnecessary, it is inapplicable, and porting it would carry known defects for no measurable gain.**

Reasons, with their evidence:

1. **The Pi's problem was the blit, and we have the number.** On the ordinary path the Pi sustained
   ~27.7 fps on a 1080p60 clip while burning ~61 % of one content-process core
   ([source-sized cost](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/bot-docs/reports/2026-10-18-source-sized-video-cost.md)),
   which is why the external-layer prototype that skipped the compositor blit reached 59.3 fps. The
   limit is V3D fill/texture throughput, not the decoder - and that report is explicit that its
   22.1 ms figure is a CPU quotient, not a measured blit cost, so it must not be quoted as one.
2. **Gen9.5 does this blit in a different class.** A fullscreen YUV quad at 1080p60 is ~124 M
   pixels/s; two or three-plane sampling plus a single write target is a few GB/s of traffic against
   the laptop's ~38 GB/s of DDR4-2400 bandwidth and a couple of dozen EUs. **Estimate, not a
   measurement**: this should land in single-digit percent of both budgets, so the ordinary Draw
   path should hold 60 fps with the CPU left to the page. This is exactly the class of claim that
   must be measured, which is why §5 gates it with one run rather than assuming it.
3. **VA-API already removes the reason the pump existed.** The pump existed because content was
   starved of ticks while the compositor stopped compositing. In this target nothing stops
   compositing: decode is offloaded, the compositor still draws every frame.
4. **Our tree already has the tick-safety mechanism, in the right shape.** `WaylandSurface` has an
   emulated VSync timer (`RequestEmulatedVSyncLocked`, gated by `mVSyncEmulateCheck`) that covers a
   stalled real frame callback per surface, and `53dd54cbdcce` now derives its interval from
   `gfxPlatform::GetSoftwareVsyncRate()` (clamped 4-1000 ms) instead of a hardcoded 60 Hz. That is
   the per-surface, lifecycle-owning, rate-correct version of what the global `static
   RefPtr<SoftwareVsyncSource>` pump approximated.
5. **The hybrid is a Wayland subsurface path, and the working kiosk session is XWayland.** The
   feasibility report records that native Wayland aborts in `wlr_xdg_surface_schedule_configure`
   with Cage 0.2.1 / wlroots 0.19.2, and that the working configuration is
   `MOZ_ENABLE_WAYLAND=0` + `GDK_BACKEND=x11`. Under XWayland the external-root attach cannot
   engage at all. So on the current image the pref would be a no-op, and on a future native-Wayland
   image it would still be the wrong first optimisation (fix the session, not the blit).
6. **The patch under discussion remains unaccepted, and its defects are now moot rather than
   fixed.** Skip without an attach result, an undrained `pending_native_surface_updates` queue, the
   per-frame `exists()` calls, and the process-global software source are all still there in
   `bot-docs/patches/2026-10-21-l8ros-attach-skip-and-vsync-pump.patch`. Dropping the port retires
   them; there is nothing to fix.

**What that means concretely for the port:**

- The hybrid stays committed (`c7bc4c798160`) and stays default-off. Nothing is removed from the
  browser, and nothing is added to the image.
- The x86_64 image must **not** set `gfx.webrender.compositor.external-surfaces-in-draw`, must not
  set the `umbrafox-beta.js` overlay, and must not carry the two L8ROS marker files
  (`/etc/l8ros-session/video-subsurface`, `/etc/l8ros-session/vsync-pump`). If any of those exist on
  a build, the measurement is of a different product.
- Promotion is not "out of scope forever" by fiat: it becomes the subject of a new proposal only if
  the gate in §5 fails.

**The one gate that settles it** (on the real machine, after the image boots — not in QEMU, which
has no VA-API):

```
1080p60 local H.264, single tab, hybrid pref off, overlay absent
presented >= 57 fps, dropped < 5 %, page cadence >= 470/480 intervals <= 18 ms
plus a screenshot of the TV actually showing video
```

If that passes, promotion is out of scope for this GPU and we close the topic. If it fails, the next
step is native Wayland plus zero-copy DMABuf import and a measured compositor budget — not skipping
the final tile draw without a displayed frame, which is the ambiguity we already spent three weeks
on.

## 4. x86_64 packaging deltas versus the aarch64 image

| Area | aarch64 today | x86_64 target |
| --- | --- | --- |
| Arch gates | `image/install-root.py:42` asserts `arm64`; `image/media_libraries.py:31-32` requires the AArch64 ELF magic | target parameter, `amd64` / `EM_X86_64`, keyed off a target not a constant |
| Media libraries | private ffmpeg pinned by `source_commit`, `libavcodec.so.62` + `libavutil.so.60`, hash + ARM64 checks | **drop this step.** VA-API uses the distro ffmpeg through `dlopen`; shipping the ARM libs would be wrong and shipping x86 builds of them is unnecessary |
| `libxul` NEEDED | 49 libraries | identical 49, only `ld-linux-x86-64.so.2` differs (verified by `objdump -p` on both artifacts) — so the host-library contract is the same |
| VA-API runtime | not used | `libva2`, `libva-drm2`, iHD driver, `vainfo`, `/dev/dri/renderD128` access, Mesa EGL/gbm |
| V4L2 M2M | vendored into ffvpx, intended for `/dev/video10` | not compiled (`MOZ_ENABLE_V4L2` is arm/aarch64/riscv64 only), nothing to configure |
| cage | `scripts/build-display.sh` builds v0.2.1 `f9626f79` with Pi/display patches + idle-inhibit | distro `cage` 0.1.5 on 24.04, or build 0.2.1 with only the arch-neutral idle-inhibit patch; the V3D/persistent-display patches do not apply. The 0.2.1 Wayland assertion may or may not reproduce on 0.1.5 — untested, must not be assumed either way |
| Session | greetd → cage → `umbrafox --kiosk` | unchanged, but see the XWayland caveat: today's working config is `MOZ_ENABLE_WAYLAND=0`, `GDK_BACKEND=x11` |
| Boot | raspi kernel + `/boot/firmware` + Pi firmware | generic Ubuntu kernel, initramfs (`i915`, no `vc4`), MBR/GRUB on a BIOS-only machine, no EFI, no Secure Boot |
| Rust services | cross `aarch64-unknown-linux-gnu` | native `x86_64-unknown-linux-gnu`, no cross toolchain |
| Browser artifact | `umbrafox-arm64.tar.xz` + its own pin | `umbrafox-amd64.tar.xz` + the §1 pin, and no overlay pref file |
| Audio | PipeWire/WirePlumber packages, Pi ALSA quirks | same packages; HDMI/analog routing is simpler, no delta beyond device naming |
| OS | 26.04 stack, image built cross | host is 24.04.5; 26.04 is what `config/stack.toml` targets, so either upgrade or accept a documented version skew |

**One blocker that is not arch-specific and outranks all of the above:** the browser package ships
only `gmp-clearkey` (57 members, no `libwidevinecdm.so`, no `gmp-widevinecdm`). `config/stack.toml`
sets `protected_streaming_required = true`, and no commercial service accepts Clearkey. The CDM bits
exist on the host (Brave 4.10.3112.0, snap Firefox 4.10.2891.0) but copying a CDM into a profile is an
integration task the image pipeline has no step for. This affects the Pi identically and needs an
explicit owner decision: add a CDM install step, or drop the requirement.

## 5. What I need from l8ros, and what I will do next

From l8ros, in the order that unblocks things:

1. **Do not set `media.ffmpeg.vaapi.enabled`** anywhere (it does not exist), and do not set the
   hybrid pref or carry the beta overlay in the appliance. If a pref file already names them, remove
   them so the image cannot silently measure a different product.
2. **Skip the private ffmpeg step on x86_64** and instead assert the distro ffmpeg is present and
   new enough (`libavcodec.so.60`-`.63`), plus the VA-API runtime list from §2 in the package set.
3. **Confirm 24.04.5 or 26.04** for the image. If 26.04, check its `libavcodec` major against the
   63 ceiling before trusting H.264 at all.
4. **Confirm the session protocol for the first image**: XWayland (known-working) or native Wayland
   (currently aborting with Cage 0.2.1). This decides whether zero-copy VA-API display is even in
   scope for the first measurement.

From me, on your word and in this order:

1. Copy the `74ec5e39…` archive into an `exports/` directory with a hash receipt so the pin has a
   durable path (no build).
2. After the wrap-up build packages HEAD, produce the matching x86_64 artifact and re-pin.
3. Then the single gate measurement in §3, on hardware, through UmbraLink rather than Marionette.
   That result decides whether the promotion topic is closed.

## 6. Limits of this document

- No Firefox playback, compositing or VA-API selection has been measured on jessica-laptop; the
  decode numbers are the feasibility report's `ffmpeg` benchmarks, and the browser-side claim is
  source-derived plus one prediction that the device check in §2 must confirm.
- The Gen9.5 blit estimate in §3 is arithmetic, not a measurement. It is labelled as such and is
  exactly what the §3 gate exists to replace.
- Ubuntu 26.04's ffmpeg major version, the Cage 0.1.5 assertion, and the QEMU image behaviour are all
  unverified here.
- The wrap-up build in `obj-x86_64-pc-linux-gnu` is another lane's work. I did not build, clean,
  configure or package anything, and nothing in this document depends on that objdir being valid.
