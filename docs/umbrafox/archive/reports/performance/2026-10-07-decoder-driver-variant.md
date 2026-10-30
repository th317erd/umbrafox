# Isolated Intel Driver Variant

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Conclusion

One bounded laptop comparison supports the Intel driver-package hypothesis for
the observed AV1 hardware fallback. The full-feature driver was actually mapped
by the owned RDD process, and the same document's native after-playback receipt
reported hardware-accelerated AV1. The preceding system-driver capture reported
software AV1 and two vaEndPicture status-23 failures. This capture logged no RDD
FFmpegLib warning/error; three utility-process timestamp warnings remain.

This is not a demonstrated stutter fix. The 20-second page observations counted
25 dropped frames of 1201, versus 24 of 1199 previously. It does not reproduce or
explain the owner's desktop seeking, prolonged stutter, black flash and recovery.
Hardware status is a boundary observation, not a continuous decoder-instance
trace. No product change or system installation was made.

## Inputs And Scope

- Host: isolated `wyatt-laptop`, X11, Intel RPL-P Iris Xe device 0xa7a0.
- Browser: unchanged frozen Build20261006175655 from
  `exports/umbrafox-descriptor-borrow-20261006/`, source HEAD
  `892431809a4caadb5c73b2c03ad9bdb124c3e21e`, frozen patch
  `d1bf3bdfe9f7d36c82181db0b4487592d5b8857b070e43c1b2ee6aaea9cd1677`.
- System free driver: `intel-media-va-driver:amd64`
  `24.1.0+dfsg1-1ubuntu0.2`; library 13589472 bytes, SHA256
  `a7cecd28f70fb692a5d65c2de8c491d953bc834dc1c98c4bd93a929ffcc976ee`.
- Private comparison: `intel-media-va-driver-non-free:amd64` `24.1.0+ds1-1`,
  fetched from the official Ubuntu archive with HTTPS, timeout and byte cap.
  Package 8783954 bytes, SHA256
  `69b244049ff76f24738c8b00d09d9eda84582fe654f78a7c232191088ba6da6d`.
  Extracted library 36102104 bytes, SHA256
  `7e14725d1af6a016fda32492cd7daaa33f1e744a36c0b8907ef3bb3a98e6798c`.
- Same upstream 24.1.0, different distro revision and feature variant. This is
  not a one-source-change A/B or an exact matching-build experiment.
- Package metadata and ELF dependencies were inspected without executing
  maintainer scripts or loading the library. Installed libc6 2.39,
  libigdgmm12 22.3.17, GCC runtime 14.2 and libva 2.20 satisfy declared minima.
  No apt update/install, system loader change, LD_LIBRARY_PATH, browser pref,
  sandbox weakening, codec forcing, daily profile or desktop control.

The adapter adds one file exclusively inside a fresh admitted browser copy and
sets child-only `LIBVA_DRIVERS_PATH` to that directory. Firefox's frozen
`SandboxBrokerPolicyFactory::GetRDDPolicy` already admits NS_GRE_DIR; its
46675-byte source hashes to
`2985097fff6962b4de8afac46e583b432aac8993526efba153f08bb416a7d418` and is untouched
by the deployed patch. libva's normal loader consumes this environment setting.
See [libva 2.20 loader source](https://github.com/intel/libva/blob/2.20.0/va/va.c).

The prior driver lead is supported by Intel's
[reported free-kernel AV1 failure](https://github.com/intel/media-driver/issues/1852),
[documentation correction](https://github.com/intel/media-driver/pull/1853), and
[later free-build capability correction](https://github.com/intel/media-driver/pull/1862).
The documentation correction was not itself a decoding implementation fix.

## Capture And Receipts

Run root on laptop:
`/home/wyatt/.cache/codex/laptop-youtube-quality-1080-20261007-qXM2xi`.

Capture 21:48:00.312 through 21:48:33.269 UTC, 32.957 seconds. Fresh private
profile/application-data/local-data/temp roots, fixed signed-out YouTube video,
ordinary visible 1080p menu, muted 20-second playback then pause. No seek,
login, ad skipping, extension change or profiler. Logging remained exactly
`timestamp,FFmpegLib:2`, as in the preceding library-error capture.

Native after receipt: context 11, document 10737418243, AV1 1920x1080,
`ffvpx video decoder (RDD remote)`, hardwareAccelerated=true, 1206 outputs,
zero decoded/sink drops, 25 compositor/container drops. The before receipt is
paused/shutdown metadata with one output and must not be treated as an active
decode interval. The after receipt is also paused immediately after observation.

Mapping receipt at 21:48:33.070 UTC:

- Controller 2194061; browser 2194073, start tick 42707872.
- RDD 2194210, start tick 42707947, parent fork server 2194168.
- Fork server parent, group and session join the owned browser root.
- Five mappings, including executable pages, all point to the private
  installation's iHD library, device 64512 (`fc:00`), inode 37357475.
- Exact file identity and hash checked around the bounded maps read; root,
  fork-server and RDD identities checked before/after. Mapping identity also
  matches installation admission and postflight plus resource history.
- Only matching driver rows are retained, not unrelated process maps. This is
  point-in-time evidence, not hostile-same-user or continuous isolation proof.

The log additionally records private-path libva loading, the version-1.20 init
symbol and successful open. These messages alone were not used as mapping proof.
The sandbox namespace EPERM line is preserved and not relabeled a decode error.

## Safety And Verification

- PASS: driver, quality admission, native roots, mapping, all nine resource
  samples, owned SIGTERM cleanup and browser-root absence.
- All 14 recorded controller/browser-tree PIDs absent at 21:49:03.826 UTC.
  Sampling does not rule out unobserved transient helpers.
- Log 770 bytes, zero dropped bytes. Existing 1 MiB cap unchanged.
- Peak summed RSS 2395881472 bytes (shared pages may be counted repeatedly),
  peak sampled run artifacts 92862467 bytes. Safety figures, not heap metrics.
- Extended installation postflight: 48 files, 511211099 bytes, including the
  added driver and empty parent lock; only previously admitted update dirs.
- All 39 remote runtime inputs unchanged after cleanup. Post-run system driver
  hash/version unchanged; the full-feature package remains not installed.
- 154 strict Node tests pass, zero failures/skips, 5.02 seconds. Ten new adapter
  tests plus two audit tests, with multiple injected failures per test; 142
  existing seek/quality tests retained. Six exact manual JS files format clean.
- Initial RED retained: one real missing-environment assertion failure, one
  passing drift test, and five missing-module failures (not five behavioral
  proofs). Audit RED was missing-module only. Semantic corruption tests verify
  rejection despite recomputed export hashes.
- Byte/hash/source drift, file replacement/corruption/symlink/partial copy,
  process ambiguity/ownership/PID reuse, maps limits, cancellation and late
  completion, missing cleanup evidence and export corruption are covered.

Runtime closure: 39 files, 97 import edges, 35 syntax checks; 81776640-byte
archive SHA256 `9edea29071d57677e52e7c013412c11729cbf8e9157b76d376956b8d561c1a87`;
manifest `056c3240712422e2ed474bf6eeb45437172cddc9c28f70c4e6465add922a1450`.
Remote harness root `decoder-driver-variant-harness-20261007-hxxB8x` under the
laptop Codex cache: device 64512, inode 37356642, owner 1000, mode 0700.

## Evidence And Next Gate

Local namespace: `artifacts/umbralink-control/decoder-driver-variant/`.
The 47-file export totals 171445 bytes and has SHA256
`dc6a925ba5fce1f3f3f863d2677b88734b357fb465ad81d0917a4c97060ac396`.
Audit output SHA256
`d5bd62bd4a608b34a5d23201eabee06e029d9e82b03b4d21f29b07d9194bb092`.
Package, dependency, sandbox-source, generation, failing/passing tests,
preflight, launch, export, system-driver and postflight records are preserved.
`commands.json` records exact scripts; `evidence.json` seals the namespace.

The next useful laptop gate is a bounded seeking/recovery capture using this
verified private driver route, retaining native before/after and frame-quality
observations. It would test a healthy hardware path, not repeat the known
software-fallback condition. A performance claim needs matched windows and
repetition; actual system installation requires separate owner consent. The
owner desktop's codec/build/session and triggering seek sequence remain distinct.

No browser source/default/public API changed. No staged work changed, no commit,
no prototype installation, no desktop/Pi intervention, and no active test process.
