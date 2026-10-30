# Hybrid Build Environment

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

Read-only sidecar, 2026-10-19 06:07-06:17 UTC. No configure, build, compiler,
test binary, installation, package generation or Pi command was run. Only this
report was written. Renderer/root-thread implementation was not reviewed.
Control: `/tmp/codex/umbra-hybrid-20261019/control` checked after every command.

## Findings

- Main HEAD is `9a9057291b5b5dd1c1362a2cc58551990532a6f6` at
  `/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox`.
  Its existing `mozconfig` selects `@TOPSRCDIR@/obj-x86_64-pc-linux-gnu` and
  sccache. Do not use that implicit config for ARM. Coordinator confirms many
  unrelated untracked upstream files: export tracked BASE plus exact owned
  patch/new-file inputs, never copy the whole working tree.
- Retained root is
  `/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR`.
  Its source HEAD is `c0e7f8a2be0460695c1f65ae8796b09c1082480c`, but current
  tracked status has seven modifications: EGL compositor cpp/header, bindings.rs,
  WR composite.rs, renderer/composite.rs, renderer/mod.rs and tile_cache/mod.rs.
  Their contents were not audited. The current source directory is NOT the
  clean retained release input. Do not reset, clean, rebuild in, or copy its
  object tree into a candidate.
- The old normal and beta exported archive hashes were independently reread and
  still match the recorded release hashes below. Their historical receipts are
  distinct from the now-modified source tree.
- Between the two exact commits, no changes were found in `build/moz.configure`,
  toolchain task definitions, `.cargo/config.toml.in`, root/WR lockfiles or the
  inspected WR workspace/renderer manifests. This supports reusing toolchain
  executables, not reusing compiled objects or assuming the new build passes.

## Existing ARM Configuration

Retained `mozconfig`, with only the home alias expanded for sharing:

```sh
mk_add_options MOZ_OBJDIR=/home/public/wyatt-desktop/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/obj
ac_add_options --target=aarch64-linux-gnu
ac_add_options --enable-bootstrap
ac_add_options --with-ccache=sccache
ac_add_options --disable-umbra-perf-probes
```

`configuration.json` and `obj/config.status.json` record browser, Firefox UA,
version 160.0a1, optimized `-O2`, no DEBUG, no probes, target CPU aarch64 and
Rust target `aarch64-unknown-linux-gnu`. Native/INI BuildID was
`20261014135715`; do not reuse it for a new candidate. Recorded configure took
33 seconds and packaging 118 seconds. The final 262-second build log is only
the last resumed portion, not a clean-build duration.

Existing tools, all below `/home/public/wyatt-desktop`:

| Tool | Location / Evidence |
| --- | --- |
| Clang / clang++ 22.1.8 | `.mozbuild/clang/bin`; installed Version.inc agrees with configured version |
| LLD / llvm-ar | `.mozbuild/clang/bin/ld.lld`, `.mozbuild/clang/bin/llvm-ar` |
| ARM sysroot | `.mozbuild/sysroot-aarch64-linux-gnu`; EGL/GL/Wayland/DRM headers present |
| Host sysroot | `.mozbuild/sysroot-x86_64-linux-gnu` |
| Rust / Cargo | `.rustup/toolchains/stable-x86_64-unknown-linux-gnu/bin`; retained configure reports 1.94.0; installed Rust manifest agrees |
| ARM Rust std | same toolchain's `lib/rustlib/aarch64-unknown-linux-gnu/lib`, present |
| Other configured tools | `.mozbuild/cbindgen/cbindgen`, `.mozbuild/node/bin/node`, `.mozbuild/pkgconf/pkg-config`, `.mozbuild/nasm/nasm` |
| Other bootstrap inputs | `.mozbuild/onnxruntime-aarch64-linux-gnu`, `.mozbuild/sysroot-wasm32-wasi`, present |

Retained compiler argv selects `--sysroot` ARM sysroot and
`--target=aarch64-linux-gnu`; C++ adds `-std=gnu++20`. Host compiles use the host
sysroot. Rust compiler commit is `4a4ef493e3a1488c6e321570238084b38948f6db`.
No compiler was executed to refresh version output in this sidecar.

## Isolated Candidate Recipe

These are commands for the authorized coordinator, NOT commands executed here.
Main's inspected HEAD is a starting point, not a claim that it contains the
pending hybrid implementation. Coordinator specifies a clean git archive of
that exact BASE plus the frozen owned diff. Freeze an exact base/patch/file-set/
hash manifest including all owned new files before any build. The patch must
include new-file contents, binary changes and modes as needed; ordinary
`git diff` alone omits untracked files. Validate its path set against the
explicit ownership allowlist, not main's full dirty status.

Use a NEW root, for example
`/home/public/wyatt-desktop/.cache/codex/umbrafox-hybrid-arm-20261019-candidate1`.
Fail if it exists. `OWNED_PATCH` and its SHA256 below are coordinator-frozen
evidence files outside the source tree, with a corresponding file manifest.
Each command must be run through the coordinator's bounded runner, with bus
checks before/after, retained stdout/stderr/exit receipt, and no automatic retry.

```sh
MAIN=/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox
NEW=/home/public/wyatt-desktop/.cache/codex/umbrafox-hybrid-arm-20261019-candidate1
MB=/home/public/wyatt-desktop/.mozbuild
TC=/home/public/wyatt-desktop/.rustup/toolchains/stable-x86_64-unknown-linux-gnu
BASE=9a9057291b5b5dd1c1362a2cc58551990532a6f6
: "${OWNED_PATCH:?Set the absolute frozen owned patch path}"
: "${OWNED_PATCH_SHA256:?Set the independently frozen patch SHA256}"
: "${BUILDID:?Set a new fixed 14-digit build timestamp}"
test ! -e "$NEW"
mkdir -p "$NEW/source" "$NEW/evidence"
timeout 900s git -C "$MAIN" archive --format=tar --output="$NEW/base.tar" "$BASE"
sha256sum "$NEW/base.tar" "$OWNED_PATCH"
printf '%s  %s\n' "$OWNED_PATCH_SHA256" "$OWNED_PATCH" | sha256sum --check --status
timeout 900s tar -xf "$NEW/base.tar" -C "$NEW/source"
timeout 30s git -C "$NEW/source" apply --check "$OWNED_PATCH"
timeout 30s git -C "$NEW/source" apply "$OWNED_PATCH"
```

The runner must stop on a nonzero hash-check exit and enforce the approved
path set before applying; printing the hash alone is not that gate.
After applying, compare the resulting owned files' hashes,
sizes and modes with the frozen manifest, and verify every other archive entry
is unchanged. Include source link types/targets in that comparison. Preserve
the base tar and patch as evidence. Reject patch drift or unexpected paths.

`git archive` excludes every untracked file and does not copy dirty tracked
working-tree content; only the explicit patch introduces the owned changes.
`git apply` without index options works on the extracted non-Git directory.
No clone, Git index staging, retained release source/obj output, or main-worktree
metadata change is required. The export has no `.git`: use the frozen BASE/
patch/manifest receipt as source identity, not `git status` inside the export.
If packaging requires embedded source revision metadata, provide and verify it
through the project's supported source-package metadata path; never fabricate
checkout cleanliness or mislabel BASE as an unpatched build.

Have the coordinator create `$NEW/mozconfig` in the new root. Proposed
normal-artifact config, not a modification of the retained file:

```sh
mk_add_options MOZ_OBJDIR=/home/public/wyatt-desktop/.cache/codex/umbrafox-hybrid-arm-20261019-candidate1/obj
ac_add_options --target=aarch64-linux-gnu
ac_add_options --enable-bootstrap=no-update
ac_add_options --without-ccache
ac_add_options --enable-optimize
ac_add_options --disable-debug
ac_add_options --disable-umbra-perf-probes
```

`no-update` reuses tools that exist, but bootstrap.configure explicitly permits
installation when a tool is missing. It is NOT a no-install sandbox. Preflight
all selected tools and stop for authorization if additional tools are needed.
Do not use `mach bootstrap`, silently install packages, or update shared tools.
Mach can create a new per-source virtualenv under `.mozbuild/srcdirs`; this is
separate from the retained source/obj. If that is unavailable, report the missing
prerequisite rather than changing a retained virtualenv.

The no-ccache setting is a conservative new-build isolation choice, not a claim
that caching caused any previous defect. Do not copy previous P2 diagnostic
debug/trace flags, generated `.cargo` configurations, config.status, dist,
buildid.h, cargo target directories, or links to any old obj directory.

From `$NEW/source`, use an allowlisted environment, preserving actual HOME:

```sh
BUILD_ENV=(env -i
  HOME="$HOME" USER="$USER" LOGNAME="$USER" SHELL=/bin/bash
  LANG=C.UTF-8 LC_ALL=C.UTF-8
  PATH="$TC/bin:$MB/clang/bin:$MB/cbindgen:$MB/nasm:$MB/node/bin:/usr/bin:/bin"
  MOZBUILD_STATE_PATH="$MB" MOZCONFIG="$NEW/mozconfig"
  MOZ_BUILD_DATE="$BUILDID" MOZ_MAKE_FLAGS=-j2
  CARGO_BUILD_JOBS=2 CARGO_INCREMENTAL=0)
"${BUILD_ENV[@]}" timeout 600s ./mach configure
"${BUILD_ENV[@]}" timeout 10800s ./mach build -j2 --verbose --priority less
"${BUILD_ENV[@]}" timeout 1800s nice -n 10 ./mach package
```

Capture each command directly to a separate evidence log; do not pipe build
output through filters. Capture attempts before launch and exit/error after.
This allowlist excludes inherited CC/CXX, RUSTFLAGS, encoded Rust flags,
RUSTC wrappers, CARGO_TARGET_DIR, cache controls, LDFLAGS, MAKEFLAGS/MFLAGS and
`WR_SHADER_OVERRIDE_DIR`. The last variable is an actual input to WR build.rs
and must not leak into the official artifact. Pin tool hashes and the complete
effective configuration after configure; record any deliberate exception.

`--verbose` and `--priority less` are supported by the pinned build command;
on Unix, `less` adds niceness 10. Do not also add nice10 to that build command.
Use both make2 and Cargo2: the retained handoff documents more than two rustc
processes when make6 exported a jobserver despite `CARGO_BUILD_JOBS=2`.

Before build, verify generated config selects the NEW source/obj, AArch64,
Firefox UA, optimized browser, DEBUG/probes unset and the expected tool paths.
Before package, require successful build, frozen input recheck, new BuildID,
and no accidental reference to retained source/obj in build configuration.

## Artifact Gates

Normal output is the new `obj/dist` mach archive, not a copied libxul or symlinked
dist/bin tree. Use a new coordinator-chosen export directory under
`/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/exports`.

The retained `verify_arm.py` and `beta_package.py` are READ-ONLY references:
they hardcode clean c0e7 and their own root. Running them unchanged cannot verify
the hybrid artifact. Adapt a new verifier with explicit root/revision/freeze
binding; never weaken the old verifier or overwrite old receipts. Retain:

- Exact source revision/patch and all input hashes before/after operations.
- Archive/staging/extraction path, SHA256, size and mode equality; no links or
  unsafe archive entries.
- Every ELF is little-endian ELF64 AArch64; required native dependencies present.
- Generated BuildID, both INI BuildIDs and native libxul BuildID agree.
- Frontend omni.ja inventories/CRC, normal-vs-overlay delta, tool/config hashes,
  command/exit logs and final archive SHA256.

Do not automatically add the old beta overlay to the official artifact.
If separately authorized, it must be the sole file delta
`defaults/pref/umbrafox-beta.js`, SHA256
`4278e82f4538bf4058aefd3b488e77069be9c7edd1e36791456c194e79967eb2`, mode0644,
348 bytes, with all original payload files unchanged. A local optimized package
does not imply Mozilla release signing, PGO/LTO, Pi playback, or runtime parity.

## Fast Rust WR Tests

`gfx/wr` is its own Cargo workspace, separate from Gecko's workspace. Searchfox
discovery and exact local `ci-scripts/linux-debug-tests.sh` agree that CI builds
WR feature combinations and eventually runs cargo tests. Do not run that whole
script for a fast check: it installs pip requirements and builds/runs wrench.

No `gfx/wr/target` exists in main, and no reusable target was found in the
bounded top-level Umbrafox cache survey. Main has no `.cargo/config.toml`, only
the generated template. The WR lock has 714 packages; 563 source-backed entries
have no exact name/version counterpart in Gecko's vendor tree. This is a whole
workspace inventory, NOT a selected-package dependency resolution. Concrete
missing local inputs include mozangle0.5.2 and freetype-sys0.13.1 (neither vendor
nor registry source/archive present), and the required gl-rs git checkout.
Registry gl_generator0.14.0 does not substitute for that pinned git source.
Do not copy the Gecko vendor template and call this an offline-ready WR setup.

Use the new candidate's `gfx/wr` directory and an independent
`$NEW/wr-host-target`, not ARM obj or any retained target. Pin `$TC/bin` first in
PATH, clear cross compiler/linker/flags/wrappers and shader override variables,
and use a separate host-test environment. Initial dependency acquisition, if
authorized, is separate from compilation and must preserve Cargo.lock:

```sh
timeout 600s "$TC/bin/cargo" fetch --locked --target x86_64-unknown-linux-gnu
timeout 600s "$TC/bin/cargo" test --frozen -j2 -p webrender --lib \
  --target x86_64-unknown-linux-gnu --target-dir "$NEW/wr-host-target" --no-run
timeout 120s "$TC/bin/cargo" test --frozen -j2 -p webrender --lib \
  --target x86_64-unknown-linux-gnu --target-dir "$NEW/wr-host-target" \
  "$TEST_FILTER" -- --test-threads=2
```

Set `TEST_FILTER` to the integrated unit-test module/name; an empty filter runs
all library unit tests. These commands were not run and are not a passing-test
claim. If locked resolution or missing cached data fails, stop and preserve the
error; do not regenerate the lockfile or substitute dependencies. The first
compile may exceed ten minutes because build.rs optimizes shaders and dev
dependencies include native ANGLE; bounded timeout failure is not a renderer
test failure. Reuse only this new host target for subsequent quick iterations.

`--lib` avoids the separate `angle_shader_validation`/`gl_leaks` integration
targets and wrench graphics runs, but does not eliminate compiling dev deps.
Do not enable Gecko or performance-probe features without their integration
environment. Pure Rust unit results are not C++/Rust FFI, EGL, ARM-link or
rendering-equivalence proof. Wrench image/reftest setup requires the separate
documented headless/distrobox path; no container setup or graphics run was done.

## Resources And Receipts

At inspection: /home had about1.2TiB free; MemAvailable about32GiB, total RAM
about63GiB. Retained source uses4.9GiB and obj18GiB. Reserve at least40GiB for a
new source/obj/package/evidence root plus host tests; 60GiB is a conservative
planning allowance, not a measured new-build peak. Start make2/Cargo2 and
nice10. Monitor memory/disk and owned process group, never signal unrelated
browser/VM/build processes. Do not start competing full builds. A three-hour
build cap, ten-minute configure cap and thirty-minute package cap match the
retained bounded workflow; elapsed time is not an automatic retry permission.

Independently rehashed retained exports:

```text
ebc8f575843aac6e9e19d2e45f488422250892858f7c291516a01fbbdf70c059  normal/umbrafox-20261014135715-linux-aarch64.tar.xz
fc3ba2d3139fc1021fb2c1d20db2b041b9a34759270300f8e8984a992fec1436  beta/umbrafox-beta-20261014135715-linux-aarch64.tar.xz
```

Both are below
`/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/exports/umbrafox-arm-20261014`.

Tool SHA256 snapshot (paths relative to `/home/public/wyatt-desktop`):

```text
5231884d44340f3ea87509366f49329e866079ce97a0d99fb87f4330c5982373  .mozbuild/clang/bin/clang
b5239be8c0b512a3b7778e69c163395f632eeff63bcdc30e79c59531410aebf4  .mozbuild/clang/bin/ld.lld
ce20f217bc1cc7ce8873f7d3261c33f4e3ece0c19037e0c7c42bc74e644d2a9b  .mozbuild/clang/bin/llvm-ar
103b60e1b1339968c1d74202ea1d45686037e82c4ea3e0569de24b18a1e6836a  .rustup/toolchains/stable-x86_64-unknown-linux-gnu/bin/rustc
77f14b761b02b47e6747473f556b3bc9f98f7e4525b7c3b8d74898ff816e4636  .rustup/toolchains/stable-x86_64-unknown-linux-gnu/bin/cargo
45067e0285d56701e7dd6fa3dbc5fabdb68ada638bb52d6c968c673148c5dea5  .mozbuild/toolchains/fd151890e804f838-public%2Fbuild%2Fsysroot-aarch64-linux-gnu.tar.zst
```

The sysroot archive hash is not a rehash of every installed sysroot file.
Retained root config hashes:

```text
fd5548984f9a536bb34ddc0a61aa9d2c2b402ecd09a20988061961763ec3a254  mozconfig
6737858b7def39a5188f62e784fb41259f376f1942077482c7ae89d6eddc49ab  configuration.json
ea0143f02e3d4dbc0eac2bb5084e6420ed42d5ce5a9e33fcb649bc6d677ed734  obj/config.status.json
```

Main test/build input hashes:

```text
9ef6fadc7a4b8f74013e8d99edf50d9a0a9ca3c3f4528abda2821444e77bffcd  gfx/wr/Cargo.toml
ae0dd3e3567073e5b164598fd881fa02b15d8b020d88b79510028a2fd05f9201  gfx/wr/Cargo.lock
744b7aa16741b68cd3927d5aa7ded78f10d58fcc9baf53b167937b2c45871c04  gfx/wr/webrender/Cargo.toml
7e77f63fd108440ffa40ac04a6461de06b5222fb7dca49858b4641808aa36609  gfx/wr/ci-scripts/linux-debug-tests.sh
9e4d8c5c53fa6bda389c810d7f9f15eb4f00be6c28cb243c447bc6f33f3a75a9  mozconfig
```

Searchfox CLI reported installed0.18.0 with0.20.5 available; no update attempted.
Read-only TOML/JSON inventory and archive/tool hashing completed; no native
build/test result is implied. Final candidate freeze, missing host dependencies,
new verifier binding, artifact production and any runtime acceptance remain with
the coordinator.

## Independent Hybrid Source Review, 2026-10-19

Bounded read-only review of the evolving selector, renderer composite path,
composite state, Gecko bridge and EGL implementation. Source root:
`/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox`.
NativeLayer implementation belongs to the native worker and was not inspected.
No tests, compiler, browser, Pi, child agents or source edits in this review.

### Accepted Finding: Failed Frame Cleanup

The inspected `RenderCompositorEGL::BeginFrame` returned false for a missing
EGL surface or failed `MakeCurrent` without `CancelFrame`; the failed-begin
branch in `RendererOGL::UpdateAndRender` also returned without cancellation.
After a previously accepted external frame, `mDrawExternalActive` and the root
could therefore remain live. `PrepareDrawExternalSurface` also returned false
for no frame in progress or an unavailable surface lock without clearing the
previous state, contrary to the new `DrawExternalCompositor::prepare` contract
that rejection hides the previous surface.

This is a source-level cleanup/contract finding, not a reproduced visible stale
frame: a missing/destroyed surface may already be invisible. Failed
`MakeCurrent` with a previously accepted frame is the stronger failure case.
The intentional no-present/offscreen route must not be conflated with a failed
presentation attempt.

Coordinator accepted the finding and reported correction through `CancelFrame`
for failed Begin/Prepare while preserving intentional no-present behavior.
At the coordinator's finalization/HOLD request, that correction was in progress
and was not independently reread or tested by this lane. Useful regression
sequence: accept frame A, fail Begin or Prepare on B, verify old external state
is cleared; separately verify no-present preserves the last presented state and
the next ordinary Draw frame receives full damage.

### Contract Checks And Coordinator Responses

- `BufferSurface::IsHDRSurface` checks PQ/HLG transfer functions, not bit depth.
  The inspected EGL checks alone did not establish actual eight-bit NV12/I420:
  `PlanarYCbCr` is a generic three-plane format. This was raised as a backend
  contract question, not an asserted downstream bug. Coordinator reports the
  native worker explicitly checks channel depth 8, FOURCC NV12 or YUV420,
  BT709 limited range and BT709 transfer. That resolves the stated responsibility
  subject to the native worker's verification; its implementation was out of
  this lane's scope.
- The inspected unconditional `swapped` local was consumed only under
  `MOZ_WAYLAND`, creating a possible non-Wayland unused-variable warning.
  Coordinator reports it is already `maybe_unused`; no build failure was
  claimed and no compiler was run here.

### Covered Source Paths

- Selector uses the first/frontmost tile and its exact resolved external-surface
  index, not an unrelated descriptor slot. It rejects non-Draw, alpha, clip or
  cached tiles, nonidentity transforms, cropped/nonfullscreen rectangles,
  nonpositive/oversized output, missing host ID, update surfaces, and color/depth
  outside the requested SDR8 Rec709Narrow NV12/planar set. Dependency resolution
  populates the resolved surface only after required image planes resolve.
- `composite_simple` returns early only after a candidate and explicit backend
  acceptance. Frontmost opaque full coverage makes lower tiles occluded under
  the narrow selector contract. Debug flags/overlay, output-size mismatch and
  nonzero default framebuffer origin disable this handoff. Backend rejection
  falls through to ordinary composition; no acceptance is inferred from a
  candidate alone.
- Interface availability disables partial-present reuse, providing full damage
  for accepted-to-rejected fallback. Default configuration has no external
  compositor; the startup pref defaults false and the EGL support path is
  Wayland-gated.
- Readback buffers, profiler screenshots and composition recording are armed
  before WR rendering so that the backend declines external presentation for
  those frames. WR frame/resource capture was traced separately: it captures
  resources/state rather than simply reading the omitted default framebuffer.
  No concrete capture defect was established in the inspected paths.
- Rust bridge ownership follows the existing renderer/compositor lifetime;
  generated ABI compatibility, producer synchronization, release/lifetime,
  hide/commit ordering and actual compositor presentation remain native
  integration gates. No NativeLayer correctness or rendering-equivalence
  clearance is implied by this source review.

### Evidence Boundary And Snapshot

Coordinator reports 174 WR library tests passing and a fresh ARM export ready,
with no ARM build yet. Those are coordinator-reported results, not this lane's
executions. Test names/assertions and native integration were not independently
validated here. Review is complete and on HOLD; only this report was appended.

Hashes below identify the inspected evolving snapshot around 06:26 UTC, not a
final freeze or the subsequent cleanup/native-worker corrections. Paths are
relative to the source root above.

```text
85f0fef183f8f87b78e90461ff5d58609d8d773ea82dc54f4933f3bffdce3145  gfx/wr/webrender/src/composite/draw_external.rs
92a152641a284ceb6181a32466dce02f220ac07d431678d2a73998db37ee586f  gfx/wr/webrender/src/renderer/composite.rs
10ecf64750e252bf814a0650daf95311615cc7205168af0d88e2d700eb043774  gfx/wr/webrender/src/composite.rs
8e6de5c6fd38bca2afcf2eccc387b0f5b9fccf3f0388fa5ab979be775622000f  gfx/webrender_bindings/src/bindings.rs
33c10a1055afac4cf880cccd83092d26968d94778b03f1e3a23e7bce514c45d3  gfx/webrender_bindings/RenderCompositor.cpp
b095c1f0b83b523a3b5ec3c9264de02fd48ef688c7c1900e3f5d20e251cb4341  gfx/webrender_bindings/RenderCompositor.h
a2a49250f31ec393ebb3e7dd9312d299c017ca9b924b3c815c51f0039ae4f6e8  gfx/webrender_bindings/RenderCompositorEGL.cpp
66020e44b3161510bba3e6366416e4ac164296a8a901104f79d054c6a12f7059  gfx/webrender_bindings/RenderCompositorEGL.h
c39f8380cd69b09417701575e295f1efd068294f6d39dd394f2d781670d12e58  gfx/webrender_bindings/RendererOGL.cpp
bb66ec58f43d20a489f9330b8fc22243a5875235eb3b0fb38310793479a16db7  gfx/webrender_bindings/WebRenderAPI.cpp
baa3cdcf981e825c9e20d7cf91ad481eddaae6d2d8fa98083e35b5ea51f6c104  modules/libpref/init/StaticPrefList.yaml
```
