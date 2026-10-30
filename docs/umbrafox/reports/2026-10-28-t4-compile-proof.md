---
title: T4 (V4L2-M2M decode) — first compile proof, 2026-10-28
status: current
doc_type: report
audience: [maintainers, developers, QA, operators, bots]
last_verified: 2026-10-28
canonical: false
---

# T4 (V4L2-M2M decode) — first compile proof, 2026-10-28

> **Current dated evidence.** Source and receipts outrank this report; it records a compile milestone only, not a linked or running build.

Status: **objects compile; nothing linked, nothing run.** This is a compile milestone only.

## What was previously claimed and is now retracted

Two earlier statements were unsupported and are withdrawn:

1. "T4 compiles." At the time it did not — no `v4l2_*.o` existed in any objdir on
   this host, and `obj-aarch64-linux-gnu` held only 61 objects with an empty
   `dist/bin`.
2. "The aarch64 build is essentially complete; only the link is missing." False.
   The aarch64 objdir has never had a full build. Its `export` tier installed
   834 headers against x86_64's 2044 and never ran the `modules/fdlibm/src`
   tier at all.

## Evidence

Seven aarch64 objects now exist, each reported by `file` as
`ELF 64-bit LSB relocatable, ARM aarch64`:

```
cfb5859d1f82659ae56a47371ab431d561686f3d68567ead70414c2544311013  v4l2_buffers.o
35461fa7487403e9f43d3e36ea2412b103c5d3a461bc2c16185c8954fc450e4a  v4l2_context.o
d06fe8630718353db95b779b234e969a4b589d677e6b1ef263f7dfaf5aeed97a  v4l2_fmt.o
1ea89038efa8b53b8460ee1fac48f23959050c6c29a57a5d201ac57b4f785069  v4l2_m2m.o
53553754d225f0eae35ce82d08ada1066aaf823accf89c1d2ff82c34145ed033  v4l2_m2m_dec.o
1b9d329a8d7eea8f846b5fc9838416335661f52b80128feb25508abaed464e93  v4l2_m2m_enc.o
7ca173b8c3f9375c16f189dde1850aada04c1b53d59bb15c0d0bd189555dcc12  bsf/h264_mp4toannexb.o
```

Symbols (`nm`), which is what a link would consume:

- `v4l2_m2m_dec.o` defines `ff_h264_v4l2m2m_decoder`, plus h263/hevc/mpeg1/mpeg2/mpeg4
  and the `ff_h264_*` variants.
- `v4l2_m2m.o` defines `ff_v4l2_m2m_codec_init`, `ff_v4l2_m2m_codec_end`,
  `ff_v4l2_m2m_codec_reinit`, `ff_v4l2_m2m_create_context`.
- `bsf/h264_mp4toannexb.o` defines `ff_h264_mp4toannexb_bsf`.

## How it was made to compile, and why the first attempt failed

The build config is correct — that part was never the problem:

- `toolkit/moz.configure:766` gates V4L2 on `target.cpu in ("arm","aarch64","riscv64")`.
- `obj-aarch64-linux-gnu/autoconf.mk:199` has `MOZ_ENABLE_V4L2 = 1`, the compiler
  line carries `-DMOZ_ENABLE_V4L2=1`, and `mozilla-config.h` has
  `#define MOZ_ENABLE_V4L2 1`.
- `obj-aarch64-linux-gnu/media/ffvpx/libavcodec/backend.mk` lists all six v4l2
  sources and `bsf/backend.mk` lists `h264_mp4toannexb.c`.

The first compile attempt failed with:

```
modules/fdlibm/inexact-math-override/math.h:25:10: fatal error: 'fdlibm.h' file not found
```

Cause: the aarch64 objdir's export tier is incomplete. `fdlibm.h` is declared
`EXPORTS += ['fdlibm.h']` in `modules/fdlibm/src/moz.build`, and on x86_64 it
exists as a symlink `dist/include/fdlibm.h -> modules/fdlibm/src/fdlibm.h`. No
aarch64 rule installs it, and `make export` at the root never entered that
directory. ffvpx puts `modules/fdlibm/inexact-math-override` on the include path,
which pulls in `math.h` -> `<fdlibm.h>`.

Workaround applied (one symlink, reversible):

```
ln -sfn $SRC/modules/fdlibm/src/fdlibm.h \
        obj-aarch64-linux-gnu/dist/include/fdlibm.h
```

Then:

```
cd obj-aarch64-linux-gnu/media/ffvpx/libavcodec
make -j2 v4l2_buffers.o v4l2_context.o v4l2_fmt.o \
         v4l2_m2m.o v4l2_m2m_dec.o v4l2_m2m_enc.o
cd bsf && make -j2 h264_mp4toannexb.o
```

All seven compiled with no errors and no warnings.

## What this does not prove

- **No link.** `dist/bin/libmozavcodec.so` has never been produced for aarch64,
  so `ff_h264_v4l2m2m_decoder` has never been resolved into a shared object, and
  `codec_list.c` / `bsf_list.c` referencing it is untested.
- **No runtime.** No hardware decode path has been exercised. V4L2-M2M needs a
  real `/dev/video*` stateful M2M device; nothing here touches one.
- **The symlink is a workaround, not a fix.** A correct aarch64 build regenerates
  `dist/include` from the export tier; if a full build is started, confirm whether
  it installs `fdlibm.h` on its own and remove the manual link if it does.

## Next step

The aarch64 objdir needs a full build before any link-level T4 claim is possible.
That is a multi-hour job on an unbuilt tree, so it needs a decision first: with
l8ros moved to amd64 (Intel VA-API is the decode path there), an aarch64 link
proof may be reference-only work.
