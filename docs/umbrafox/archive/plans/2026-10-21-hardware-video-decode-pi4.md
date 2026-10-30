# Hardware video decode on the Pi 4 (L8ROS request, 2026-10-21)

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

> **ASSIGNED TO UMBRAFOX** by the owner (2026-10-21): "Yes please. Instruct the Umbrafox bot to work on
> this." Umbrafox owns browser source/build/artifact for the Pi, so this task is theirs end to end.
> Deliver a packaged aarch64 tarball; l8ros will flash/deploy and run the acceptance below.

## Task list (Umbrafox)

1. Vendor `libavcodec/v4l2_m2m.c`, `v4l2_m2m_dec.c`, `v4l2_context.c`, `v4l2_fmt.c` and their headers into
   `media/ffvpx/libavcodec/`, and add them to `media/ffvpx/libavcodec/moz.build` (they need `libdrm`).
2. Flip `CONFIG_V4L2_M2M` and `CONFIG_LIBDRM` to 1 for aarch64 in `media/ffvpx/config_unix_aarch64.h`.
3. Wire the libdrm include/link flags (the VA-API path already carries `MOZ_DRM_CFLAGS`; reuse it).
4. Confirm `h264_v4l2m2m` is exported and selected by `FindVideoHardwareAVCodec()`.
5. Keep software H.264 as a fallback when `/dev/video10` is missing or busy.
6. Package and hand back the tarball path plus a one-line summary of what changed.

## Correction first: there is no hardware VP9 decoder on a Pi 4

BCM VideoCore VI (Pi 4 / BCM2711) decodes **H.264, MPEG-2, MPEG-4 and HEVC** in hardware. It does **not**
decode VP9 or AV1 in hardware - no Raspberry Pi model does. On the L8ROS device the kernel exposes:

```
video10 = bcm2835-codec-decode     (H.264 etc., V4L2 M2M)
video11 = bcm2835-codec-encode
video12 = bcm2835-codec-isp
video19 = rpi-hevc-dec             (HEVC/H.265, V4L2 stateless)
```

So the reachable goal is **hardware H.264 decode via V4L2 M2M**, with YouTube steered onto H.264 by
disabling VP9/AV1 in MSE (l8ros already sets `media.mediasource.webm.enabled=false`,
`media.av1.enabled=false`, `media.webm.enabled=false`; measure shows that alone cuts dropped frames
from ~70 % to ~33 % on the same clip).

## Why it does not work today, with evidence

Firefox's V4L2 support is compiled in and correct; the codec library is not:

- `toolkit/moz.configure` sets `MOZ_ENABLE_V4L2=1` for aarch64 + GTK, and
  `dom/media/platforms/ffmpeg/ffmpeg60/moz.build` defines `MOZ_USE_HWDECODE` when VA-API/V4L2/Vulkan is
  enabled. `obj/config.status` confirms `MOZ_FFMPEG=1`.
- The decoder implementation exists: `FFmpegVideoDecoder::InitV4L2Decoder()`
  (`dom/media/platforms/ffmpeg/FFmpegVideoDecoder.cpp:786`), reached from `:1039` after VA-API fails.
- But the shipped library is Mozilla's vendored **ffvpx** subset, and:
  - `media/ffvpx/config_unix_aarch64.h` has `CONFIG_V4L2_M2M 0` and `CONFIG_LIBDRM 0`
  - there is **no** `libavcodec/*v4l2*` source vendored under `media/ffvpx/libavcodec/`
  - `strings /opt/l8ros/umbrafox/libmozavcodec.so` contains `h264` but **no** `h264_v4l2m2m`,
    `h264_vaapi` or `h264_vulkan`
- Consequence on device: `FindVideoHardwareAVCodec(mLib, mCodecID)` returns null, `InitV4L2Decoder()`
  fails with "No appropriate v4l2 codec found", and playback silently falls back to the software H.264
  decoder - which on this SoC presents ~33-40 % dropped frames at 720p60.

## What we are asking Umbrafox for

Enable the V4L2 M2M decode path in the browser binary:

1. Vendor FFmpeg's `libavcodec/v4l2_m2m.c`, `v4l2_m2m_dec.c`, `v4l2_context.c`, `v4l2_fmt.c` (+ headers)
   into `media/ffvpx/libavcodec/`, and add them to that directory's `moz.build`.
2. Set `CONFIG_V4L2_M2M 1` and `CONFIG_LIBDRM 1` in the aarch64 config header
   (`config_unix_aarch64.h`; consider `config_generic.h` too if others should inherit it).
3. Link libdrm (`MOZ_DRM_CFLAGS`/`USE_LIBS += ["mozva"]` machinery already exists for the VA-API path;
   `ffmpeg60/moz.build` already adds `MOZ_DRM_CFLAGS` when `MOZ_ENABLE_V4L2`).
4. Keep the existing fallback: software H.264 must still work when `/dev/video10` is unavailable.
5. Alternative if vendoring is rejected: build against a system ffmpeg/libavcodec that is compiled with
   `--enable-v4l2-m2m` and ship it as `libmozavcodec.so`. Either way the resulting library must expose
   `h264_v4l2m2m`.

## Acceptance

Measured on the L8ROS device (Pi 4, 1080p panel, YouTube `aqz-KE-bpKQ`, 1280x720@60 served as H.264):

- `strings libmozavcodec.so | grep h264_v4l2m2m` is non-empty.
- Browser log shows `Initialising V4L2-DRM FFmpeg decoder` and `V4L2 codec h264_v4l2m2m` for the video
  stream (set `MOZ_LOG="FFmpeg:5"` to see it).
- Dropped frames below 2 % of rendered frames (today: 12-15 % best case, ~70 % with VP9), and 720p60
  presents at 59-60 fps.
- CPU load during 1080p60 playback materially below the software-decoder figure (record before/after
  with `pidstat -p $(pgrep umbrafox) 5`).

## Measurement harness on our side

`/tmp/codex/ytprobe.mjs` (Marionette over `ssh -W 127.0.0.1:2828`) samples `currentTime`,
`getVideoPlaybackQuality()` dropped/total, `videoWidth/Height`, `readyState` and `networkState` every
10 s, which is how the numbers above were produced. l8ros will run it against any build you hand over.

## Separate defect (not yours to fix, noted for context)

YouTube tears the pipeline down at ~45-50 s (`videoWidth` 0, `readyState` 0, `src` cleared) on **every**
configuration including the vendor baseline and at every drop rate from 70 % down to 12 %. It is being
investigated on the l8ros side as an MSE/player issue and is independent of decode performance.
