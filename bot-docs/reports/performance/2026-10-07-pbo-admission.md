# PBO Upload Comparison Admission

## Status

The private upload-mode capture adapters and exact-package source checks pass.
This advances the [PBO comparison plan](../../plans/pbo-upload-control.md), but
does not add a performance measurement or authorize a default change. No browser,
remote process, profiler, native build or daily installation was started here.

The next gate is actual composited-frame and retained-decoder-loss correctness
on the quiet laptop. Its orchestration and final runtime preflight/export are
not yet implemented. No timing comparison should run before that gate.

## Implemented Boundary

The existing bounded readback capture is copied into a private namespace through
exact, hash-checked transformations. Its profile writer adds only the existing
`gfx.webrender.pbo-uploads` boolean before launch. Missing or nonboolean values
reject before admission or I/O. There is no arbitrary preference override API.
The original capture file and existing sealed adapters are unchanged.

Both comparison modes use the same normal descriptor-borrow package, import ON
and profiler OFF. The private playback and pixel adapters force import ON.
Playback retains its existing nine serialized requests. Only the two existing
browser-state responses gain actual/default/user/locked preference fields.
Raw responses are saved before admission; unexpected configuration rejects.
The report explicitly says `observedDeviceMode:false`: an accepted preference
does not prove an acknowledged renderer-internal method.

The capture budget, launch handle ownership, private directories, resource
monitor, error handling and cleanup remain unchanged. AST/declaration checks
and exact inverse transformation verify the envelope delta. Same-input replay
through original and new playback functions produces identical workload summaries
and request parameters, except the two intended receipt bodies.

Firefox initialization retains explicit user values even when they equal the
default; ordinary later setters may clear them. The recorded `Pref::SetUserValue`
source distinguishes `aFromInit`. Both new profiles therefore write the boolean
explicitly and require an unlocked user value with default true. A missing,
locked or changed value stops the experiment rather than silently changing the
meaning of an arm. This remains a source-backed expectation awaiting runtime.

## Package And Source

Normal package: `exports/umbrafox-descriptor-borrow-20261006/`.
BuildID: `20261006175655`. Package manifest SHA256:
`1de58db614be934fb7fe71fc46ea168ce9777a8b46e340d3f429090b4e3e6773`.
All 46 expected package files match bytes, modes and hashes.

Fifteen source files were reconstructed from HEAD
`892431809a4caadb5c73b2c03ad9bdb124c3e21e` and the exact exported patch
`d1bf3bdfe9f7d36c82181db0b4487592d5b8857b070e43c1b2ee6aaea9cd1677`.
Git's patch parser ran only in a newly created artifact directory verified not
to be a worktree. The source manifest matches all 67 current milestone pins;
HEAD, index and configuration guards pass. No product source or index was edited.

Of the thirteen upload-chain files previously inspected from the older capture,
only the renderer differs. Its complete parameter-dispatch arm is unchanged,
including both the device and profiler receivers. Hardware WebRender still
selects pixel-buffer versus immediate upload; the software exclusion is intact.

An AST inspection of the exact packaged `greprefs.js` confirms PBO true,
batched texture uploads false and draw-call texture copies false. The Windows
source defaults differ; they are not substituted for this Linux artifact.
`preference-proof.json` retains this package-level evidence separately from the
still-pending actual preference receipts.

The actual packaged `chrome/remote/content/shared/Capture.sys.mjs` matches the
reconstructed module, SHA256:
`c64da2a7059c2ce8aed16e962d5fe17d9811ed778cc2bc79d401b326732f4e7c`.
Direct execution of its extracted function with fake objects confirms that
explicit `readback:true` takes the widget-layer `drawWindow` branch, not
`drawSnapshot`. Size and readback errors still reject. This proves the helper's
selection logic, not actual hardware capture, pixel parity or physical scanout.
The next browser gate must supply and validate the owned content rectangle.

## Verification

- Fourteen focused groups pass, including actual saved nine-request replay for
  both modes, exact generated-source checks and the packaged capture branch.
- Twenty bad before/after preference cases preserve raw evidence then reject.
- Fifty-four RPC/deadline/abort injections stop later requests. Every evidence
  write can fail without an accepted observation. Context/document changes,
  active hooks/profiling and nonhardware decoding still reject.
- The relevant combined tooling gate passes 361 tests, zero failures/skips,
  in 10.66 seconds under a 60-second watchdog. It includes existing performance,
  local capture, readback fixture, callback collector and server tests. Some
  established tests use owned Node children and loopback HTTP servers; it is not
  a pure-data-only run. No browser or native compiler tests were included.
- Initial missing-module failure is scaffolding, not a product defect. An
  ambiguous transformation anchor was tightened. Two mistaken test expectations
  were corrected against actual behavior/source: first-document identity is
  established by the first valid reply, and the renderer also forwards parameters
  to its profiler. All earlier failed logs are retained.

Evidence: `artifacts/umbralink-control/pbo-upload/`. `generate.mjs` produces five
write-once adapters; `adapter-provenance.json` records their exact parents and
hashes. `source-proof.json` records the package/source join. The initial runtime
manifest has 152 files, including 146 unchanged preceding inputs and 29 reachable
static imports, SHA256:
`0e6df780f139020d1c2a5b55fdf47acdc5c833ba6ae1b49d05041df037630400`.
It is not the final P1/P2 runtime bundle; additions require a new manifest.

`full-tests.log` retains the complete command output. Generators use exclusive
outputs and must not be rerun over their existing files. This phase leaves the
general performance goal active. Daily browser/profile/launcher, defaults, Pi
and earlier failed smoothness results remain unchanged.
