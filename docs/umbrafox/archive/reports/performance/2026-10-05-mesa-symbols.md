# Cold Readback: Mesa Symbols

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Result

Matching Mesa debug symbols resolve the saved first-copy stacks into shader
compilation, built-in shader initialization and compiler-queue waits. This is
new localization, not an optimization, causal A/B improvement, or explanation
of recurring YouTube stutter. No browser, native source, build, installation,
launcher or owner profile changed. The readback candidate remains uninstalled.

| Inclusive first-window samples | Baseline | Candidate |
| --- | ---: | ---: |
| Entire worker window | 36 | 22 |
| mesa_compile_shader | 22 | 7 |
| ensure_builtin_types / create_builtins | 19 | 6 |
| iris_schedule_compile / util_queue_fence_wait | 6 | 9 |
| mesa_ReadPixels | 4 | 6 |

Rows overlap and must not be added. These are sampled stacks, including waits,
not exact milliseconds, CPU time or GPU duration. Equal numbers alone are not
a stack join. Supported top-down exports separately show helper-constructor
stacks reaching shader compilation and built-in initialization. Their truncated
trees remain unsuitable for an exhaustive partition; complete function lists
reconcile all36/22 self samples. Unresolved self samples fall from19/8 to6/1.
New complete lists contain174/156 functions, including resolved inline frames.

The upstream Mesa25.2.8
[iris_schedule_compile](https://gitlab.freedesktop.org/mesa/mesa/-/blob/mesa-25.2.8/src/gallium/drivers/iris/iris_program.c)
queues a shader job and conditionally waits for its ready fence when synchronous
compilation or a debug callback applies. This supports a compiler-queue wait
interpretation, not a GPU-frame fence diagnosis. Exact runtime condition and
Ubuntu source-patch equivalence were not established. The versioned
[built-in implementation](https://gitlab.freedesktop.org/mesa/mesa/-/blob/mesa-25.2.8/src/compiler/glsl/builtin_functions.cpp)
constructs function IR under a reference-counted singleton. Both downloaded
source files are preserved. A sampled symbol named link_program_error does not
by itself establish a shader error. Cache location, hit/miss and whole-worker
compiler cost remain unknown.

## Symbol Provenance

The two failed debuginfod attempts remain untouched. The alternate source is
Ubuntu's [debug-symbol package archive](https://ubuntu.com/server/docs/how-to/debugging/debug-symbol-packages/).
No package/key was installed, no system configuration changed, and no profile
was sent to a public symbol endpoint.

1. Fetch ubuntu-dbgsym-keyring2023.11.28.1 from archive.ubuntu.com over HTTPS.
   Its4528bytes match the SHA256 published on the official
   [package page](https://packages.ubuntu.com/noble/all/ubuntu-dbgsym-keyring/download):
   `777b6a23443c60e54ccd3c5ee960a975450a8c4a0255affe0b7121df938a0cb1`.
   Extract only the keyring into the artifact directory.
2. gpgv verifies noble-updates InRelease with key fingerprint
   `F2EDC64DC5AEE1F6B9C621F0C8CAB6595FDFF622` in an isolated keyring/home.
   Initial missing-key failure is retained separately.
3. Its SHA256 authenticates main/binary-amd64/Packages.xz,261340bytes:
   `516b022739ceb3d514afbc22b0a18b9bc70e969cccef147ad605fff4b720554e`.
4. The index authenticates mesa-libgallium-dbgsym25.2.8-0ubuntu0.24.04.4,
   65987654bytes,SHA256
   `9619d1a298b8566514a20048b7bfc242bb88f38b9959bd38e23d63705dd8efc2`.
   The archive uses HTTP after an HTTPS redirect; the signed hash chain is
   therefore checked before extraction. Download70s/8MiB-per-second/size bound.
5. Extract only the named .debug entry,69365760bytes, into an owned symbol
   directory under the profile's debugName. SHA256
   `a9d10145543cfd2851f2204f510ea2b305aae49d96c9088c31b5804a13637e71`;
   readelf GNU ID `198701d4b61dc1afd1949464114e27c1e90498a2` matches the
   recorded laptop library. Both CLI library receipts return matching Breakpad
   ID `D40187191DB6AFC1D1949464114E27C10`; server logs name this exact local file.

The keyring trust anchor here is official HTTPS plus its separately published
checksum, not an existing-system-keyring chain. No maintainer scripts ran.

## Verification

Artifacts: artifacts/umbralink-control/driver-symbols/.
Plan: docs/umbrafox/archive/plans/driver-symbols.md. Query reuses the frozen coverage/function
contracts, requires original profile/package hashes and exact worker/root/scope
counts, and additionally checks the Mesa file hash, library ID and named symbols.
Raw profiles are loaded only by supported profiler-cli0.10.0/Samply0.13.1.

11preload tests and39final focused cold-profile tests PASS. Two-file Prettier
check PASS. Recompute verifies exact file sizes/hashes, marker/worker joins,
complete self totals and current exact-PID/socket absence; its output repeats
byte-for-byte. The previous342-file seal and staged-diff SHA remain unchanged.
New224-file seal: artifacts/umbralink-control/driver-symbols-final.sha256,
SHA256 `316ac3a086812a46c836de2580285642a7007816d96ebcb981fd57f766a9d079`.
Independent sha256sum verification passed; future analysis must use siblings.
No new native test or general repository lint/build was run. Query source was
formatted afterward; do not imply launch-time formatted-source hashes existed.

Only two named offline sessions were launched. Baseline server928106 and daemon
928187 exited; candidate server934073 and daemon934163 exited. Their owned
sockets are absent, with7.379/6.895s observed lifetimes. Explicit loopback Samply
endpoints, fresh private caches, no-open and previous8GiB/256MiB/two-worker
bounds apply. No SIGKILL or unrelated-session stop. This is observed cleanup,
not a universal OS-I/O or network isolation proof.

## Next Action

The frozen Gecko source already caches helpers/programs per context. Do not
add duplicate caches, change synchronization/filtering, or call warmup a free
improvement. The cheapest next check is later-copy windows in these SAME saved
profiles: test whether built-in initialization/compiler waits are first-use-only
or recur. That informs whether an engine experiment should target first-use
scheduling, repeated compilation or a separate steady-playback path.

The existing native probe gate is OFF; enabling it needs a reviewed configure/
build step. No such change occurred. Recurring real-world playback stutter and
general CPU improvement remain unproved; repeated-copy ABBA results are separate.
