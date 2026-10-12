# Producer Fence Matched Package Pair

## Result

Created and verified an otherwise-matched diagnostic pair for measuring the
producer-fence candidate. The prior direct old/new comparison would have mixed
the fence change with the Attachments metadata optimization. Both new arms now
contain the exact same Attachments bytes. The candidate is byte-identical to its
previously tested normal package; the baseline differs only in root omni.ja.

This completes package preparation, not a performance measurement. No browser,
native compiler, profiler, remote process or daily installation was started.
No product source, preference, public API, index or existing evidence changed.
The full engine/layout/CSS/JavaScript goal and intermittent stutter remain open.

Plan: [producer-fence playback](../../plans/producer-fence-playback.md).
Tools and logs: artifacts/umbralink-control/producer-fence-pair/.

## Pair Identity

Owned pair root:
/home/wyatt/.cache/codex/producer-fence-pair-20261007-zqivims1.
Each arm is under a/umbrafox or b/umbrafox, with its own package-input.json.
Do not substitute either original manifest for these derived manifests.
They intentionally have no original-archive claim for a rewritten package.

| Arm | Native/INI BuildID | Files | Bytes |
| --- | --- | ---: | ---: |
| A, descriptor baseline with matched attachment code | 20261006175655 | 46 | 475108995 |
| B, retained producer fence | 20261007133500 | 46 | 475111027 |

Pair proof SHA256:
cb41c937e411ac310df857a224db8e90238fffdf2e6d0a3431c83a57c4f3fd0f.
Arm A manifest SHA256:
09261b9b755eb2295aa92393ddaab215ab8936cb79ebd27699ab8695ca3d1eae.
Arm B manifest SHA256:
ff1060705138f6d519b4473b94410f69c4dad1d9682fef3c6596c8cc513b534b.

Both Attachments payloads have SHA256
ef9453242ede618f224cb5c28495223f88a5b92efbc48b28108b917b63ea4fa2.
Both root archives are 51197639 bytes. A root-archive SHA256 is
25916660a119a745f840467a2c108c38a6bdce9a43b7ecbf9d94184e3d0e2bd5;
B is the unchanged original
88ec5827cf78cf36dce1562970b08a761a9fa398d557aef6a24a1282a37e96af.

## Provenance And Attribution Boundary

The input package manifests and all 92 input files are verified against frozen
hashes, sizes and modes. Each copied native library, launcher alias and INI is
unchanged. Both native toolkit BuildID notes agree with their respective INIs.
No old libxul/new metadata combination was created.

The original package differences are exactly libxul.so, both executable aliases,
both INIs and root omni.ja. Launcher section tables are equal. Whole executable
bytes match after normalizing only the 16-byte GNU build-note digest and two
embedded BuildID fields: application identity and crash-report URL parameter.
The application INI has those same two identity changes; platform.ini has one.
This explicitly retains differing build identities, not a same-build claim.

The frozen tracked patches have 112 and 114 members. Exactly eight patch members
differ: four native fence files, native test registration, Attachments source
and its test, and performance documentation. All 20 earlier supplemental inputs
are unchanged; the only three additions are fence test files. All 94 current
source pins, common HEAD892431809a4caadb5c73b2c03ad9bdb124c3e21e,
index SHA3b78253cf775a4a1e8c69a4b82cc3958b366056129a391f4ae362bdfe8e4e0c4
and frozen build configuration verify. This is source/package provenance, not
a reproducible compiler proof or a claim that only one native machine-code
function changes. Different native build metadata remains explicit.

Both root archives were processed by the existing mozpack rewrite helper with
the same replacement. Archive member order, compression, modes, optimization
and preload endpoint are preserved. These actual root archives are nonoptimized
with no preload endpoint. All 2676 root entries match across arms except the
single AppConstants BuildID payload. All 5368 browser entries are unchanged.
The stdlib zipfile auditor independently recomputes entry hashes, metadata,
CRC-checked decompression, order and all 92 output file hashes. It agrees with
the mozpack-based proof without importing the constructor or its verifier.

## Verification And Preserved Failures

- Real original-package matching assertion fails on unequal Attachments, as
  expected. It is an experiment-design RED, not a production defect.
- Twelve focused constructor/verifier groups pass. Coverage includes both-arm
  rewrite, originals/native preservation, alias/overlap/existing output rejection,
  stale inputs, symlinks, archive inventory/layout/compression/modes, BuildIDs,
  whole-executable unexpected bytes, copy/partial rewrite/write failures,
  exclusive receipt creation and corrupted saved proofs/manifests/packages.
- All nine unchanged archive regression groups pass, including malformed and
  duplicate members, CRC corruption, size caps and partial writer failure.
- Initial real-input audit rejected the second application.ini BuildID field,
  then the second launcher field. Both failures remain in logs. Exact producer
  metadata was inspected and fixtures expanded; no arbitrary additional native
  difference was admitted. The launcher fixture reproduces its rejection before
  correction. An earlier INI test error is explicitly a missing-helper error.
- Constructor, separate read-only verification and independent ZIP/file audit
  pass on the real pair. The constructor publishes pair.json only after checks;
  partial-copy tests never produce a successful final receipt.
- Scoped Ruff checks and formatting pass. Two initial import-order errors were
  fixed mechanically. Report/plan scoped documentation lint is recorded separately.
- Prior P2 native and P3 GPU evidence seals reverify unchanged. No native or
  full browser suite was rerun because this phase changes no product bytes
  beyond the explicitly matched, previously tested frontend payload in A.

Commands and complete logs are retained in the new namespace. Each Python unit
command has a 30-second bound; construction/read-only verification have 180-second
bounds for roughly one GiB of copied and rehashed package data. Commands returned
terminal exit zero except the explicitly preserved negative/audit failures.
No runtime PID cleanup claim is needed because no browser was launched.

## Next Gate And Limits

Use fresh runtime adapters with both new manifest hashes and per-arm BuildIDs.
Do not reuse the old same-BuildID admission checks unchanged. First repeat the
matched baseline import-ON pixel gate. Candidate package correctness remains
the separate prior P3 evidence; this phase adds no browser-runtime acceptance.

The prospective protocol is two fresh baseline noise controls followed by
A1/B1/B2/A2, same import-ON 48-second 1/4/4/1 workload and profiler OFF. Noise
above 3% stops as inconclusive; otherwise each B must beat the better A CPU rate
by at least max(2%, twice noise) and pass all unchanged 29 smoothness/regression
criteria. These are engineering screening rules, not statistical confidence.
No favorable retries, dropped failures, default promotion or owner-browser
restart follows from package verification. Prior stutter/drop failures remain.
