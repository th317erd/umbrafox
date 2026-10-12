# Corrected GPU Import Diagnostic Package

## Result

A fresh self-contained Linux x86-64 diagnostic package now combines the tested
GPU import-failure correction with the historical full-size HTML video fallback.
The experimental DMABuf import preference remains OFF by default. Package
integrity, frontend contents, native build identity and source restoration pass.
No browser was launched and no daily installation, launcher or profile changed
during this build phase.

This is preparation for prospective laptop pixel and sustained-playback tests,
not evidence that intermittent YouTube stutter is fixed. The earlier 17 native
tests and 48-case pixel comparison remain bounded to their original inputs.

## Accepted Package

Export: `exports/umbrafox-import-recovery-20261006-r2/`.

- BuildID: `20261006070020`, matching both INIs and the embedded toolkit ELF note.
- Archive: `umbrafox-import-recovery-r2-20261006070020-linux-x86_64.tar.xz`.
- Archive bytes: 107785736.
- Archive SHA256:
  `7f6c660bace67c486c4817f87811ee7cadef95f2fbce1bb472b573e7334f0dd3`.
- Package manifest SHA256:
  `21178496e1612b579e18b6234bff4a052bbe229cb7c861872c713e11cb89c99f`.
- Inventory: 46 regular files, 57 archive entries, 475120013 uncompressed bytes.
- Native library SHA256:
  `d66f112c398106f1fd0248b6c6dea0f3daff7c7844b585859c0ed8b98a5b7d28`.
- Executable SHA256:
  `768860a2ba92f448a22639bda08d5f2da6f2268c07cde8b10d9b4d6465bc6073`.

Archive inspection rejects duplicate or unsafe paths, links, special files,
unexpected inventory, special mode bits and size-cap violations. Extracted file
bytes, modes and hashes equal the inspected manifest. The existing installation
admission helper separately passed all 46 files with a private 0700 package root.
These are point-in-time checks, not native runtime receipts or sandbox proof.

All 2676 `omni.ja` and 5368 `browser/omni.ja` entries were compared with the frozen
full-size reference. Only `AppConstants.sys.mjs` changed, by exactly one BuildID
substitution. The browser frontend archive is unchanged. The export also retains
the source manifest, complete tracked patch, untracked-source manifest/archive
and configured `mozconfig`; the entire tracked patch is provenance, not a claim
that this phase authored every change.

## Rejected First Package

The first package under `exports/umbrafox-import-recovery-20261006/` passed archive
and INI checks but retained toolkit BuildID `20261006052600` inside `libxul.so`.
Both INIs reported the requested new date. It was rejected before any execution;
its archive, earlier integrity verdict and `HOLD.md` remain preserved.

The toolkit generator reads `MOZ_BUILD_DATE`, but its generated C++ still held
the old value after the first build. Saved timestamps show the generator stub
predated the newly compiled canvas object. The exact incremental scheduling
cause is not established; this is not proof of an sccache defect.

One ordinary `mach build binaries` pass at the same date regenerated the toolkit
identity and relinked the library. No stamp deletion, forced generator rewrite,
toolchain change or build-system source patch was used. The second package then
passed the new native identity gate. Of its 46 files, only `libxul.so` differs
from the rejected package.

The new reader uses bounded GNU `readelf` with a fixed locale and strictly
validates the expected x86-64 toolkit-note layout. It is deliberately not a
portable ELF parser. Six tests cover real preserved stale evidence, accepted
identity, malformed/duplicate notes, invalid expectations, invocation bounds,
tool failure and timeout propagation. The real old package rejects; the real
corrected library accepts.

## Build And Verification

Evidence root: `artifacts/umbralink-control/import-playback-candidate/`.

| Gate | Result |
| --- | --- |
| Preflight | 48.2 GB available memory, 79.3 GB free storage |
| Live-reference failing-first test | 1 passed, 3 expected failures on V2 |
| Temporary reference and native source contracts | 10 passed |
| First full build | 57 seconds, 0 compiler warnings |
| First package | 97 seconds, 0 compiler warnings; native identity rejected |
| Ordinary binaries repair | 12 seconds, 0 compiler warnings |
| Corrected package | 97 seconds, 0 compiler warnings |
| Restored-source and preserved-reference contracts | 10 passed |
| BuildID reader tests | 6 passed |
| Existing archive helper tests | 9 passed |
| Scoped native lint | 0 errors |
| Four Python artifact files | Direct Ruff checks and formatting verified |

Builds used two jobs, idle priority and explicit time limits. Packaging also
limited XZ threads to two. No runtime capture or profiler overlapped this phase.
The warning in archive-helper tests is the intentional duplicate-ZIP negative.

## Source Restoration

Only the previously reviewed `CanvasRenderingContext2D.cpp` reference delta was
temporarily applied. The compiled reference file has SHA256
`3f2a75fab4d78e0d1c406d999ae81beead9af67af09e2b9fc41a8323fc583a14`.
All 24 captured source hashes matched before export and reversal.

Guarded reversal restored the original canvas file to SHA256
`50bd508090a87b2dd0d315b98b3894c6a94f1c2e9a6a10f0a9c6418c500981a9`.
All 16 starting native source hashes, the complete tracked diff and the staged
diff matched their preserved bytes. The nine native import-failure changes and
all unrelated work remain intact. `restoration-r2.json` records this separately
from the first successful restoration.

IMPORTANT: the object directory contains the corrected full-size diagnostic
build, while the working source again contains V2 scaled readback. Do not
install or repackage that object directory as an ordinary working-tree build.
Use the named, hashed export for subsequent diagnostics.

## Remaining Gates

First run a prospective same-package OFF/ON pixel comparison, then alternating
sustained moving-video trials on the authorized quiet laptop. Keep admission,
private data roots, observer cost, resource limits and owned cleanup identical.
Report dropped frames, callback stalls and joined process CPU, not inferred
GPU duration or per-draw import use from a preference alone.

Valid DMABuf reuse after failure, context-loss injection, driver OOM/framebuffer/
modifier failures and end-to-end translator fallback remain coverage gaps.
No public API, default preference, network behavior or shader change was added
in this phase. Full Firefox equivalence and sustained performance remain
unproven. No daily deployment or default enablement is approved by this report.
