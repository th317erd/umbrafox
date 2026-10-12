# Pi opacity benefit trial: diagnostic ARM64 build

Research-only artifact. NOT a release, parity fix, or hardware validation.
The owner authorized measuring the existing prototype's performance/pixel
tradeoff on the Pi despite the retained desktop FAIL20. Default enablement,
source repairs, eligibility expansion, production deployment and relaxed pixel
acceptance were not authorized. The coordinator owns Pi deployment and cleanup.

## Artifact and verification

`umbrafox-158.0a1-linux-aarch64-opacity-trial-20260926.tar.xz`

- Size: 99,282,092 bytes.
- SHA256: `91f653d78aaa50139a83fc7820a4e23f3474f9e02f5f6beb4f6710b8601b0914`.
- Application BuildID: `20260926103749`, version `158.0a1`.
- Executable ELF build ID: `0cf7aeda046f3bd238ee82e70a1c944b`.
- libxul ELF build ID: `5dc4f55084596678ff1eeb31efd93f10`.
- `umbrafox` and `umbrafox-bin` SHA256:
  `f6e6cef6fa51e115239fc2efb7f90b5f2443810c77326027cf206a73c1ab3256`.
- libxul SHA256:
  `77adedb949e1861541e457c79a51be1bf17c19414aa9f8f20ccc08c1c9d15feb`.

Sole ARM build: exit 0, 57m49s. Package: exit 0, 1m34s. No retry/source repair.
`xz -t` and fresh extraction passed. All 46 extracted file contents match the
package staging tree; all 28 ELF files are 64-bit little-endian AArch64. Both
omni.ja files and every dependentlibs.list entry are present; there are no
symlinks. See `package-verification.json`, `elf-identities.txt` and
`runtime-SHA256SUMS`. Normal export archives and the desktop launcher retained
their preflight hashes. Owned build/package processes exited.

The package contains the application runtime, not a standalone Linux system:
the target still needs its compatible AArch64 loader, GTK and other system
libraries. Dynamic linkage is recorded in `elf-dynamic.txt`; no ARM runtime
execution or Pi validation was performed by this task.

Verify the handoff directory with `sha256sum -c SHA256SUMS`. After extracting
the runtime into a new isolated directory, run `sha256sum -c` on the absolute
path to `runtime-SHA256SUMS` from the directory containing `umbrafox/`.

## Provenance

- Base HEAD: `44f0ad5f3277a51138cba9dd11aeb3a61d5a31c9`.
- `source.patch` is the complete tracked working diff, SHA256
  `61cb4559189766e235a3b9e34bdb58384992582cd715c8777c40c94cf0955fb9`.
  It exactly matches the snapshot used for the desktop diagnostic controls.
- `source-before.sha256` records all tracked modified file contents.
- `untracked-build-inputs.sha256` covers `renderer/sampling.rs` and
  `mozconfig.aarch64`; the source supplement archive includes these and the
  current tests/fixtures. Apply the patch to the base and unpack the supplement
  at the source root to recover these local inputs, not a clean release tree.
- The working tree contains pre-existing DMABUF scaled-readback repairs,
  the opacity/no-rect-AA prototype, diagnostics and documentation. None were
  edited for this build. See `git-status-before.txt` for unrelated dirty files.
- The earlier source-tests manifest differs only for the capture helper, whose
  current SHA matches the later accepted control/continuation manifest:
  `d3e105829ed62d2d68adbf6544d7b8ab54ba0f1a9630ddb64f0d4960fc3ec783`.
- Configuration: unchanged `mozconfig.aarch64`, existing
  `obj-aarch64-linux-gnu`, bootstrapped LLVM/sysroot, cross-target
  `aarch64-linux-gnu`, sccache. Build command:

  ```sh
  timeout --signal=TERM --kill-after=30s 10800s env \
    MOZCONFIG=mozconfig.aarch64 CARGO_BUILD_JOBS=2 MOZ_MAKE_FLAGS=-j2 \
    ./mach build -j2
  ```

Packaging used `timeout --signal=TERM --kill-after=30s 1800s taskset -c 0,1 env
MOZCONFIG=mozconfig.aarch64 CARGO_BUILD_JOBS=2 XZ_OPT=-T2 ./mach package`.
The log confirms mach selected two jobs using the two-CPU affinity. This keeps
the original mozconfig unchanged. Build and packaging completed within the
overall three-hour boundary. The desktop launcher and normal exports were not
installation targets of this task.

## Experimental preferences

Both shipped defaults remain **false**:

```js
user_pref("gfx.webrender.single-image-opacity.enabled", false);
user_pref("gfx.webrender.debug.surface-promotion-logging", false);
```

For an isolated ON trial, set only `single-image-opacity.enabled` to true.
Restart between OFF and ON arms and preserve the other environment/profile
settings. For a separate instrumented capture, also enable
`surface-promotion-logging`. Do not infer actual eligibility or rendering path
from the preference: verify the markers below. Do not force native WebRender,
drop fences, change driver settings, or modify the fixture to make a path pass.

The prototype preserves narrow single-image eligibility checks. Shader variant
selection additionally requires a Texture2D RGBA surface with no clip mask and
the experimental feature bit. Other paths may remain unchanged or excluded.
No new page-facing API is included in this package. That does NOT establish
undetectability: the known pixel difference and timing/performance effects
remain unresolved. Official Firefox-equivalence requirements are unchanged.

## Separate diagnostic capture

Use the coordinator's isolated ARM profile, physical display and owned-process
lifecycle. Enable UmbraLink in that profile only if needed:

```js
user_pref("umbrafox.control.enabled", true);
user_pref("umbrafox.control.port", 0);
user_pref("gfx.webrender.debug.surface-promotion-logging", true);
```

Start the diagnostic browser with these existing profiler settings:

```sh
MOZ_PROFILER_STARTUP=1 \
MOZ_PROFILER_STARTUP_FEATURES=nostacksampling \
MOZ_PROFILER_STARTUP_FILTERS=Renderer,WRRenderBackend \
MOZ_PROFILER_STARTUP_ENTRIES=4194304 \
  /absolute/isolated/umbrafox/umbrafox -no-remote -profile /absolute/test-profile URL
```

Retain the coordinator's native Wayland/display environment. Do not use the
desktop capture helper unchanged on Pi: it explicitly forces X11 and uses
ImageMagick root-window capture. Read the owner-local UmbraLink discovery from
`test-profile/umbrafox/control.json`; keep it private. Existing protocol calls:

```json
{"id":1,"method":"umbrafox.gfx.snapshot","params":{}}
{"id":2,"method":"umbrafox.diagnostics.snapshot","params":{}}
{"id":3,"method":"umbrafox.performance.profile.dump","params":{"filename":"opacity-trial.json"}}
```

Save replies and the actual profile at the returned path. On the analysis host:

```sh
profiler-cli load /absolute/profile.json --session pi-opacity
profiler-cli profile markers --session pi-opacity --search 'WR RGB promotion' --limit 100000 --json
profiler-cli profile markers --session pi-opacity --search 'WR RGB no-rect-AA' --limit 100000 --json
profiler-cli profile markers --session pi-opacity --search 'WR picture target' --limit 100000 --json
profiler-cli profile markers --session pi-opacity --search 'WR promotion counters' --limit 100000 --json
profiler-cli profile markers --session pi-opacity --search 'WR sampling operands' --limit 100000 --json
profiler-cli stop --session pi-opacity
```

Check installed CLI options and result truncation before analysis. Keep raw
profiles, timestamps and interval bounds; compare equal interior windows, not
cumulative totals. Reference shader selection must be zero. Missing candidates
or truncation is not proof of absence or successful promotion.

### Marker contracts

- `WR RGB promotion`: logging preference AND profiled WR thread. Reports
  update/candidate/frame/slice, image key/generation, `preferred`, `root`, alpha,
  mask, surface limits, rectangle and promotion result. Cap: 64 candidates per
  update with explicit `WR RGB promotion truncated`. Fullscreen desktop ON
  showed `root=true color_alpha=0.25 result=Ok(Overlay)`; OFF had zero promoted.
  Match Pi geometry and the actual image, not the desktop rectangle literally.
- `WR RGB no-rect-AA`: emitted on a profiled Renderer thread when that actual
  shader variant is selected, label `composite:NO_RECT_AA,TEXTURE_2D`. This marker
  does NOT require the logging preference. It counts batch shader selections,
  NOT images, candidates, frames or proof of GPU completion.
- `WR picture target` and `WR promotion counters`: logging-gated target
  geometry/draw/clear and promotion work. These are CPU-side observations, not
  GPU fence timing. Preserve target truncation markers and ordinary frame/draw
  markers alongside them.
- `WR sampling operands`: logging AND profiling; one-shot search per Renderer
  lifetime, up to 128 eligible search frames for ONE unambiguous RGB
  RGBA8/BGRA8 320x180 source. A fresh process with only the fixture is important.
  Ambiguity, limits, unsupported native compositor/blit/clear paths produce
  `incomplete`; they must not be promoted to a successful trace. Inspect ordered
  raw text payloads for a single submission, not CLI-sort order. Parser:
  `tools/umbrafox/tests/opacity/parse-sampling.mjs`, export
  `parseSamplingRecords(lines)`. Required begin/end joins include the emitted
  source chain and final composite attributes. CPU metadata is not proof of
  actual GPU sampler weights, texture allocation, intermediate texels, driver
  execution or completion; unknown fields intentionally remain null.

## Pixel fixtures and oracle

Source paths, also included unchanged in the supplement archive:

- `tools/umbrafox/tests/opacity/canvas.html`: fullscreen 320x180 actual Canvas2D.
- `tools/umbrafox/tests/opacity/matrix.html`: edge/exclusion cases.
- `tools/umbrafox/tests/opacity/sampling/sampling.html?case=even-odd`: 320x180
  backing displayed at 643x367, opacity .25, left16/top24, deterministic content.
- `capture.mjs` and `sampling/capture.mjs`: existing DESKTOP recipes, not Pi
  launch scripts. They wait for the title/readback hash, retain two compositor
  captures and profiler metadata. `sampling/control.mjs` shows ordered raw
  marker extraction and strict gates; it has desktop-specific assumptions.
- `verify.mjs` and `verify-matrix.mjs`: strict full-frame AE0, repeated captures,
  matching Canvas2D readback hash and positive/negative marker assertions.
  Fullscreen desktop geometry was 1280x972/DPR1 in a 1920x1080 framebuffer.

For Pi, root adapts only capture/display geometry and lifecycle as authorized.
Capture the actual compositor output, not `drawSnapshot` software rerendering.
Readback-forced repaints are unsuitable for performance/damage measurements;
keep pixel runs separate. Compare OFF/ON images in the same Pi stack and compare
repeat frames independently. Report every nonzero difference as FAIL, including
counts, coordinates, channels and magnitude. Do not change the oracle to pass
minor errors. The research owner can assess a tradeoff separately from parity.

## Existing evidence and unresolved failures

Desktop evidence root:
`/home/wyatt/.cache/codex/l8ros/opacity-prototype-20260925/`.

- Fullscreen no-rect-AA baseline: ON88/88 selected, OFF0/88, AE0, readback hash
  `6e5e9bdd`. This does not generalize to every geometry or GPU.
- `sampling-operands-validation/continuation-results.json`: four accepted
  feature/logging controls (first OFF/OFF reused after sentinel-only review).
  Same-mode AE0 and repeat AE0; loggingON complete strict operand traces;
  loggingOFF zero operands. Original sentinel STOP remains preserved.
- Normal even-odd OFF versus ON remains **FAIL20**, not repaired by diagnostic
  instrumentation. Earlier odd matrix FAIL28 and no-AOS sampling FAIL83087 are
  distinct captures and remain failures; they are not silently reclassified.
- `sampling-operands-validation/dispatch-lifecycle-v2`: fresh normal and
  no-rast-linear pairs retained the same FAIL20; no executed Mesa branch proof.
- Diagnostic unit verification already recorded before packaging: 14 Rust
  state tests, 37 Node parser/producer tests, vendored cargo check, lint/hygiene.
  Logs are copied as historical evidence, not claimed as ARM execution tests.
- Mixed matrix shader counts cannot prove a nonexperimental draw because shader
  selections and candidate updates count different units. Branch proof remains
  unavailable where not directly instrumented.

No Pi performance result, ARM runtime result, driver workaround or production
parity conclusion is claimed by this handoff. Keep diagnostics off for the
separate benefit run and preserve baseline installation/profile restoration.
