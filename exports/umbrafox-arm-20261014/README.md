# ARM64 Normal And Opt-in Beta

Status: build, packaging and structural verification PASS. No Pi runtime test
or deployment was performed by this lane.

## Artifacts

Both variants have BuildID `20261014135715` in the object header, native libxul
note, application.ini and platform.ini. Both archives contain one `umbrafox/`
top-level directory. Paths below are relative to this export directory.

| Variant | Archive | Bytes | SHA256 |
| --- | --- | ---: | --- |
| Normal | `normal/umbrafox-20261014135715-linux-aarch64.tar.xz` | 99237048 | `ebc8f575843aac6e9e19d2e45f488422250892858f7c291516a01fbbdf70c059` |
| Beta | `beta/umbrafox-beta-20261014135715-linux-aarch64.tar.xz` | 110565684 | `fc3ba2d3139fc1021fb2c1d20db2b041b9a34759270300f8e8984a992fec1436` |

Each variant has `package-input.json`, `source.patch`, `mozconfig`,
`configuration.json` and `elf-identities.txt`. The normal overlay is absent.
The beta overlay hash is listed below. The identical empty source patches have
SHA256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.
`artifacts.json` summarizes the handoff; `SHA256SUMS` seals the archives and
exported provenance. Archive/runtime trees are intentionally excluded from Git.

## Ownership

Wyatt authorized this build. `l8ros` coordinates and owns Pi deployment, profile
overrides, runtime validation and restoration. This lane owns source, cross-build,
packaging and provenance only. No Pi writes or owner desktop-browser changes.

## Source

Both variants use clean detached source
`c0e7f8a2be0460695c1f65ae8796b09c1082480c`, already published to origin. This
includes the stopped-audio-stream seek correction and previous optimizations.
No untracked main-checkout remnants are build inputs. A zero-byte `source.patch`
records that no patch was applied beyond the pinned commit; it does not mean
that the commit lacks Umbrafox modifications relative to Firefox.

Build root: `/home/wyatt/.cache/codex/umbrafox-arm-20261014-gZmxuBOR/`.
Target `aarch64-linux-gnu`, optimized `-O2`, browser application, Firefox UA,
debug build off, Umbra performance probes off. Normal debug-symbol generation
remains enabled; that is distinct from a debug build. Existing Clang22.1.8,
Rust/Cargo1.94.0 and the bootstrapped ARM Linux sysroot are used.

## Variants

- `normal/`: unchanged `mach package` archive, without the beta preference file.
  Both experimental preferences retain their normal source default of `false`.
- `beta/`: the same normal payload plus exactly
  `umbrafox/defaults/pref/umbrafox-beta.js`, mode0644, repacked.
  All original runtime files must retain identical bytes and modes.

The overlay enables only:

```js
pref("gfx.canvas.remote.use-draw-image-fast-path-dmabuf", true);
pref("gfx.webrender.single-image-opacity.enabled", true);
```

Its pinned SHA256 is
`4278e82f4538bf4058aefd3b488e77069be9c7edd1e36791456c194e79967eb2`.
These are ordinary user-overridable preferences, not locked settings. l8ros will
choose the per-profile baseline overrides. No profile is modified by packaging.
Both archives use one top-level directory, `umbrafox/`, not loose root files.

This beta is the owner's explicit experimental opt-in. It is not a source-default
change or a claim of universal pixel parity. Previous smoothness/pixel failures
remain relevant; x86 seek results cannot establish ARM or Pi playback results.

## Build Continuity

The initial two-job build completed its Rust release portion. The coordinator
approved an increase to six C++ jobs while Cargo remains at two and nice10 is
preserved. Only the verified owned build process group received SIGTERM; exit143
and the initial `build.log` are retained. Its absence was verified before an
incremental resume in the same object directory, recorded in `build-j6.log`.
`MOZ_BUILD_DATE=20261014135715` uses the supported timestamp input to retain the
initial host-local BuildID. Header, mozconfig and config.status hashes matched
after the resumed generation step. Native/package ID checks subsequently passed.
The memory reduction thresholds are 8GiB available for four jobs and 5GiB for two.

Later, remaining host Cargo tooling was observed to inherit make's six-token
jobserver despite `CARGO_BUILD_JOBS=2`. To enforce the independent cap, the owned
build was stopped after the ARM libxul link, its group absence verified, and
remaining work resumed at make2/Cargo2 with unchanged inputs. The second exit143,
stop receipt and original log are retained; final log is `build-final-j2.log`.

## Acceptance Boundary

Passed package checks: clean pinned source, successful build/package, matching
object/native/INI BuildIDs, all packaged ELF files AArch64, archive/staging/tree
file/hash/mode equality, dependent-library inventory, both Gecko archive CRCs,
and exact beta-only overlay delta. Normal has46files, beta47; all28ELFs are ARM64.
The Gecko archives contain2716 and5358 entries, with CRC checks passed. Nine ARM/
overlay unit cases, five archive-safety cases and two beta-pref tests passed.
The verifier, tests, build/packaging logs and successful verification logs remain
in the build root; `verification-inputs.json` records their hashes. Successful
static checks do not prove external-library compatibility,
hardware acceleration, native startup, browser parity, or Pi performance.

Do not install this ARM package over the desktop x86 nightly. The coordinator
must verify archive hashes after transfer and owns Pi deployment, per-profile
baseline overrides, runtime validation and restoration.
