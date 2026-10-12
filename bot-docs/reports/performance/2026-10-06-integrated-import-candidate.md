# Integrated Scaled-Fallback GPU Import Candidate

## Result

The existing combined source built and packaged successfully as a new Linux
x86-64 experimental candidate. It includes V2 scaled HTML-video fallback and
the previously tested native GPU import-failure propagation. No production
source was edited in this phase. The experimental DMABuf import preference is
still OFF by default; no daily installation, launcher or profile was changed.

The preceding four-arm comparison passed its fixed performance gates, but its
OFF baseline used full-size diagnostic readback. Its 35.5% CPU-rate improvement
must not be transferred to this scaled-fallback package without new trials.
This package is not yet a YouTube-stutter, GPU-runtime or Firefox-parity result.

## Package

Export: `exports/umbrafox-integrated-import-20261006/`.

- BuildID: `20261006095500`, matching both INIs and the native toolkit ELF note.
- Archive: `umbrafox-integrated-import-20261006095500-linux-x86_64.tar.xz`.
- Compressed size: 107770016 bytes.
- Archive SHA256:
  `2700a1b01cb4cbd84e36e05a7f1e350fd342b1dfc717cdf409e9bd1862aacb68`.
- Package manifest SHA256:
  `e770fd478f4a2e469184b22d340bbe53387cd8f5190f44a5c45a67a3124b2dfb`.
- Inventory: 46 regular files, 57 archive entries, 475122469 uncompressed bytes.

Bounded archive inspection rejects unsafe paths, duplicate entries, links,
special files, special mode bits and inventory/size violations. Extracted bytes,
modes and hashes match the manifest. Independent installation admission checked
the same 46 files and a private 0700 root. These are point-in-time file checks,
not native runtime receipts or a filesystem/network sandbox.

All 2676 main omni entries and 5368 browser omni entries were compared with R2.
Only `modules/AppConstants.sys.mjs` changed, by exactly one BuildID substitution;
the browser frontend archive is unchanged. The exporter and native-ID reader
are guarded against their previously tested versions: only the explicit export
paths and identity constants differ in the exporter; the reader is identical.

## Source Integration

Compared with R2's 24 pinned native inputs, only
`dom/canvas/CanvasRenderingContext2D.cpp` differs. It exactly matches restored V2
SHA256 `50bd508090a87b2dd0d315b98b3894c6a94f1c2e9a6a10f0a9c6418c500981a9`.
The other 23 inputs are unchanged. Twelve untracked build inputs are preserved,
with one overlap, giving 35 unique pinned files. The complete tracked patch,
staged patch, unstaged patch, untracked archive and mozconfig were captured.
This mixed patch is provenance, not a claim that this phase authored it.

The V2 helper applies only to eligible unrotated GPU video, identity transform,
linear full-source sampling and integral smaller destination dimensions. The
HTML-video path tries the remote descriptor first; without one it can use V2
scaled readback, including after provider demotion. The VideoFrame direct path
is unchanged. Translator-side import failure still uses full-size readback:
the descriptor does not carry the destination-sized V2 request. Do not describe
all fallback as scaled or infer per-draw import from a preference alone.

The object directory now corresponds to this integrated source. The earlier
report's warning about an object/source mismatch described the historical R2
build; the R2 export remains preserved and distinct.

## Verification

Evidence: `artifacts/umbralink-control/integrated-import-candidate/`.

| Gate | Result |
| --- | --- |
| Old native library against new BuildID | Expected rejection retained |
| Source contracts and exporter equivalence | 39 passed, 0 skipped |
| Native BuildID-reader tests | 6 passed |
| Existing archive-helper tests | 9 passed |
| Configured two-job idle build | 30 seconds, 0 compiler warnings |
| Two-job idle packaging, two XZ threads | 93 seconds, 0 compiler warnings |
| Archive, extraction, INIs and native identity | Passed |
| Frontend archive inventory/content comparison | Passed |
| Separate installation admission | 46 files passed |
| Source, HEAD, staged/unstaged diff and config guards | Unchanged |
| Default-OFF preference guard | Passed |
| Direct Ruff checks and formatting | Passed for both Python files |
| Explicit Prettier checks | Passed for three new JavaScript files |

Build and packaging had respective 1800/600-second bounds and separate host
admission checks. Existing AeorDB compiler activity initially prevented each
admission; those observations are retained. Later checks found no compiler
activity, at least 43 GiB available memory and 72 GiB free storage. No unrelated
process was interrupted. The archive test's duplicate-ZIP warning is an
intentional negative case. The Node tests include loopback fixture tests and
compiled source-region checks, not a new browser/native GPU execution.

## Remaining Work

Pin this exact package for isolated laptop native recovery and pixel/readback
tests, then run a prospective balanced comparison against its V2 OFF baseline.
Keep the historical full-size results separate. Pixel differences require
explanation, not relaxed thresholds. Valid DMABuf reuse after rejection,
context loss, driver OOM, framebuffer/modifier failures and forced translator
fallback remain named coverage gaps. The earlier native tests apply only to
their recorded build and do not establish these cases for this package.

No browser executable or version probe was run in this phase. No desktop/Pi
runtime, installation, default enablement, staging, commit or push occurred.
The broad performance goal remains active; package readiness is not release
acceptance, and public-interface equivalence must still be verified.
