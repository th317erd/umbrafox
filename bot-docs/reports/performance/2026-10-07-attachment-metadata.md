# Attachment Metadata Conversion

## Decision

A narrow source candidate removes the metadata Blob/text round trip from
`Downloader.cacheAll()` while preserving a normal-priority task yield before
parsing. Native byte/error equivalence, the full native downloader suite and
actual ZIP/IndexedDB synthetic integration pass. The isolated conversion cost
falls substantially. Full-operation wall time is modestly lower in the quiet
comparison, but the observer-loaded comparison is mixed.

This is not a browser-startup, CPU, playback or YouTube-stutter acceptance.
No package, daily installation, browser window, owner profile, launcher, Pi or
remote runtime changed. The wider rendering/layout/CSS/JavaScript goal remains
open. The original compositor drops and approximately 154 ms Renderer stall are
not explained or fixed by this work.

## Source And Behavior

The [startup attribution](2026-10-07-current-startup.md) found parent work in
certificate attachment extraction and caching, separately from the short video
callback gaps. The inspected route is:

`IntermediatePreloads.updatePreloadedIntermediates` -> `Downloader.cacheAll`
-> ZIP metadata/attachment reads -> existing 50-record database batches.

The metadata producer is `nsScriptableInputStream::ReadBytes`, an `nsACString`
byte string. The old code constructed a Blob from that string, read it back as
text asynchronously, then parsed JSON. The candidate parses the same string
after `Services.tm.dispatchToMainThread` resolves a Promise. It does not change
the byte interpretation to UTF-8. Existing high-byte behavior is preserved,
including where that behavior is not a human reader's expected decoding.

Simply removing the asynchronous operation would be cheaper but fails the
queued-task control: an already queued normal task does not run before the
direct parser finishes. The selected candidate preserves this opportunity; it
does not claim identical scheduling timestamps, task counts or browser latency.
Security updates are not disabled, skipped or deferred to idle time.

Only the metadata conversion block changes relative to the saved prior module.
Request construction, downloaded bytes, attachment Blobs, cache batch size,
partial-failure behavior, certificate consumers and earlier stream/archive/temp
cleanup remain unchanged. No new public interface, preference, request header,
page diagnostic, canvas result or web-visible feature is introduced. Private
test clocks, resource aliases and Blob instrumentation exist only in isolated
xpcshell tests; they are not product code.

Original module SHA256:
`dbb945734369469677c29c8f4f3ba0bb1400d679401fb7b2adf41c72d9392a27`.
Candidate module SHA256:
`ef9453242ede618f224cb5c28495223f88a5b92efbc48b28108b917b63ea4fa2`.
The permanent regression is `test_cacheAll_avoids_metadata_blob` in the existing
downloader test. Its isolated test delta is checked against the saved original.

## Measurements

All values below are synthetic native wall times, not page-clock estimates or
whole-browser CPU. Each comparison is within one process, without controlled
CPU affinity, host load, frequency or statistical confidence. Cells within a
process are not independent browser-session replicates.

The conversion probe uses 1024 records per cell, payloads of 256 and 4096 bytes,
128 warmups per mode and two fixed A/B/C/C/B/A rounds per size. Four cells per
mode/size are retained. B is the intentionally non-yielding negative control;
the product candidate uses C, the yielding parser.

| Payload bytes | Blob median ms | Yielding median ms | Reduction |
| --- | ---: | ---: | ---: |
| 256 | 65.962 | 26.013 | 60.56% |
| 4096 | 89.723 | 28.792 | 67.91% |

The integration comparison runs the actual original and candidate downloader
modules with real ZIP compression/extraction and real IndexedDB writes/reads.
It supplies a fixed response instead of performing a network request. Each cell
has 512 records and 1024-byte attachment payloads. Both implementations receive
16-record warmups, then fixed A/B/B/A at each metadata size. Every stored record
and attachment is checked outside timing; generated archive cleanup is checked.

| Observation | Payload bytes | Before median ms | Candidate median ms | Reduction |
| --- | ---: | ---: | ---: | ---: |
| Recurring task | 256 | 700.286 | 718.164 | -2.55% |
| Recurring task | 4096 | 744.790 | 687.081 | 7.75% |
| No recurring task | 256 | 745.624 | 699.777 | 6.15% |
| No recurring task | 4096 | 733.693 | 711.279 | 3.06% |

The unfavorable small-record result is retained. The recurring task ran
60,864-77,194 times per measured operation; it is an artificial main-thread load,
not passive observation. Its maximum recorded gap is 4.834 ms for the candidate
versus 3.583 ms for the baseline across sizes. These extrema are not tail-safety
or browser-jank guarantees. The quiet companion was specified before execution,
contains eight cells in a separate process, and is not pooled with the loaded
comparison. Neither completed measured sequence was retried or discarded.

## Correctness And Failures

- Real native streams and Blob conversions agree on all 256 raw byte values.
  The 277 JSON cases include controls, escapes, high bytes, BOM-shaped sequences,
  invalid input, duplicate keys, escaped surrogates and a larger field. All three
  parsers match values or exact error name/message; 38 inputs are invalid JSON.
- The queued normal task runs before completion for both original Blob and
  yielding parsers, but not the direct-only control.
- Actual-source failure tests retain empty/51-record batches, network/status/body
  failures, partial writes, stream/ZIP/JSON/cache errors, dispatch failure,
  falsy exceptions, offline/cached bypass, force, concurrent calls and cleanup.
  Behavioral RED was 38 pass / 6 fail; the corrected source passes all 44 cases.
- The new native regression first fails on the original module: two metadata
  Blobs instead of zero. The corrected full downloader file passes 166 assertions,
  including its real loopback ZIP and database paths. This is the full selected
  downloader suite, not every Remote Settings or certificate-import test.
- Native conversion, loaded bundle and quiet bundle runs respectively pass
  1728, 63 and 53 harness assertions. Stored-data equality also occurs through
  explicit checks inside the bundle loops, not one assertion per field.
- Final Node verification passes 54 groups: 44 source cases, eight analyzer/log
  contracts and two saved-result/source-delta checks. Exact product-file ESLint,
  license, whitespace and trojan-source checks report zero problems.

All failures remain saved. The first conversion probe used obsolete `Cu.now`
and stopped before timing. The bundle prototype first rejected a file-scheme
system module, then encountered an empty unsynced collection through
`attachments.deleteAll()`; the corrected isolated cache uses `prune([])` and a
temporary resource alias. Both failed attempts ended before measurement.

The audit initially rejected the deliberately absent unused HTTP3 helper and
then missed xpcshell's quoted diagnostic messages. The corrected audit admits
only that exact owned-path notice and compares every parsed cell with the saved
result. An initial final Node invocation omitted `--experimental-vm-modules`;
its 44 harness failures are retained, followed by the corrected passing run.
None of these harness repairs changes a timing result or product threshold.

## Runtime Provenance And Cleanup

Existing development xpcshell and libxul were reused; no native compilation or
packaging occurred. Their hashes were taken before the work and independently
matched by the final audit:

- xpcshell: `972c9a8a8ffaa5a4b525192428fccea7bdd0d477b61c294159412ca51da9c12a`.
- libxul: `2e0686759ee04ec855262161533275875e579b6a937eeeb76dbd1156a8b497b3`.

Modules load through the development resource mapping; the bundle test verifies
the old and new function bodies before using them. The metadata receipt's
`buildID=20160315` comes from mocked test AppInfo and is NOT native build identity.
It does not record a process ID; actual xpcshell identity comes from harness logs.

Eight native attempts use distinct private profile/temp/application-data roots,
the earlier reviewed native-root test head, nonlocal-connection blocking, FOG
test mode, profiler disabled and an explicit empty crashreporter environment.
Each is externally bounded by 120-second SIGTERM. None reaches the timeout;
test intervals range from 91 ms to 8.629 seconds. The downloader suite uses an
owned loopback HTTP server; the micro/bundle comparisons do not create one.

The final audit independently confirms all 24 recorded controller, harness and
xpcshell PIDs absent. It preserves every terminal PASS/FAIL and expected helper
notice. This is exact-root cleanup evidence, not continuous descendant coverage,
browser directory-provider proof, an OS sandbox or universal no-network proof.
No personal profile, token, crash queue or application-data payload was inspected.

## Evidence And Follow-Up

Namespace: `artifacts/umbralink-control/attachment-metadata-cost/`.
`analysis.json` pins the measured outputs and native log hashes; `audit.mjs`
verifies terminal populations, source delta, unchanged native binaries, exact
cell equality and process absence before writing that result exclusively.
Do not rerun its write-once output. `verification.md` records replay commands.

The separate rendering source guard still matches all 67 pins, HEAD, index and
mozconfig. Those pins do NOT include this attachment module and must not be
presented as package equivalence for this new candidate. Historical packages,
profile results and seals remain immutable. A later integrated package needs a
new source manifest that includes this change.

Keep this as a locally verified source optimization with limited timing evidence,
not a release or live-startup claim. Future startup measurement must use a new
exact package, fixed before/after protocol and unchanged security-update work.
Meanwhile, the distinct unresolved compositor/presentation investigation remains
the next route toward the reported video stalls; do not attribute those stalls
to the metadata work simply because both appeared in one recording.
