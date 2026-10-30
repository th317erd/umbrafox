# QuickSuggest Startup Footprint and Attachment Cleanup

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Outcome

The saved matched startup pair has a reproducible disk-footprint difference:
the baseline retained 124108070 more logical file bytes after exit. Of that,
113515464 bytes are in the Suggest SQLite store, its sidecars and its Rust
Remote Settings databases. Those paths are absent from the candidate inventory.
This identifies byte locations, not total allocation, writers, network volume,
CPU ownership or a causal playback improvement.

Both runs also show a later temporary growth burst. The packaged security
initialization code provides a plausible mechanism for temporary attachment
files followed by deletion, but no trace joins that mechanism to these samples.
Do not disable certificate updates, Remote Settings generally or browser cache
behavior to make the benchmark fit its resource cap.

A separate concrete source defect was reproduced: the packaged Remote Settings
attachment-bundle downloader has no deterministic ZIP-reader close or temporary
ZIP removal. Four desired-cleanup assertions fail against the exact packaged
module with mocked I/O. This is not a native leak measurement or proof of the
owner's stutter. No product source was changed in this investigation.

## Evidence and Scope

This follows the [matched startup pilot](2026-10-03-quicksuggest-matched-startup.md),
using its same native B package, BuildID `20261003071500`, and its separate
candidate and baseline runs. The package proof remains SHA256
`ecbde46a0a2704883bd7cea626ba23d2cbf54a7013c809d5cf574ef17ee79aff`.

Only saved resource exports and an already completed metadata-only walk of the
two stopped disposable run trees were used. The inventory is timestamped
`2026-10-04T04:35:09.759Z`, still October 3 in Phoenix. It reports no skipped
symlinks. No profile-file bodies, crash queues or personal data were opened.
No new browser, profiler, native build, installation or remote process started.

New work is under `artifacts/umbralink-control/quicksuggest-footprint/`.
`postexit-metadata.json` contains the inventory; `results-final.json` contains
recomputed totals, all 22 sample projections and input hashes. The analyzer
checks unique canonical relative file paths, finite metadata, exact file/group
totals and ordered sample intervals. It does not join filesystem modification
times or controller-relative sample times to the browser's CPU clock.

## Reconciled Bytes

These are regular-file logical sizes at the metadata walk, not allocated disk
blocks, network bytes or peak resident memory. SQLite sidecars are included
where named; databases were not opened.

| Post-exit group | Candidate bytes | Baseline bytes |
| --- | ---: | ---: |
| Entire owned run tree | 125845143 | 249953213 |
| `profile/suggest.sqlite` and sidecars | 0 | 35651584 |
| `profile/remote-settings` | 0 | 77863880 |
| `profile/cache2` | 33744381 | 44401160 |
| `profile/security_state` | 23854084 | 23854084 |
| `profile/storage` | 23116952 | 23002264 |
| `profile/startupCache` | 19738989 | 19789453 |
| Regular file count | 365 | 659 |

The Suggest store includes its 35618816-byte main file and a 32768-byte sidecar.
Rust Remote Settings contains six `quicksuggest-amp` / `quicksuggest-other`
database and sidecar files. The rest of the baseline-candidate difference is
10592606 bytes, mostly the larger HTTP cache. File names and sizes do not prove
which requests populated that cache. Both profiles also contain the separate
JavaScript Remote Settings IndexedDB; absence of the Rust directory does not
mean Remote Settings as a whole is disabled.

Equal security-directory byte totals do not establish equal contents or equal
CPU cost. Both have 66 regular files under that prefix in this inventory.

## Sampled Growth

All times below are controller-relative seconds. Post-exit inventory totals are
later observations and must not replace the retained high-water samples.

| Sample start | Candidate bytes | Baseline bytes |
| --- | ---: | ---: |
| Approximately 12 s | 63631163 | 187912429 |
| Approximately 22 s | 63659919 | 187941187 |
| Approximately 27 s | 139072872 | 267383189 |
| Approximately 32 s | 129583842 | 253720612 |
| Approximately 37 s | 126100442 | 250237201 |

The 22-to-27-second increases are 75412953 and 79442002 bytes. At approximately
32 seconds, the walkers saw 4269 and 4564 entries, respectively; at approximately
37 seconds those counts were 409 and 704. This is a temporary-entry pattern,
not evidence of a persistent leak or of any particular producer.

The baseline sampled peak still leaves only 1052267 bytes under the existing
268435456-byte cap. Later shrinkage does not clear the headroom gate. The walk
does not provide continuous coverage or count files outside the owned tree.
The previous approximately 7.5 CPU-seconds in each later 30-second interval
remain unattributed. No memory, throughput or frame-pacing claim follows.

## Packaged Producer Map

`extract-sources.py` verifies the pinned pair proof, both complete `omni.ja`
hashes and each requested entry hash. It extracts ten selected modules, which
are byte-identical across the baseline and candidate. Their provenance is in
`source-provenance-full.json`. This is packaged-source correspondence, not an
independent loaded-module receipt.

- `SuggestBackendRust` names `suggest.sqlite`, builds the store when enabled
  and schedules initial ingest. `SharedRemoteSettingsService` passes the
  profile-local `remote-settings` directory to the Rust service. This maps the
  retained Suggest filenames to their intended producers without parsing data.
- `RemoteSecuritySettings.init()` registers OneCRL, intermediate-certificate
  and CRLite clients. Intermediate and CRLite consumers observe
  `remote-settings:changes-poll-end`. The upstream browser idle-startup category
  registers this initializer; category discovery is source evidence only.
- `IntermediatePreloads.updatePreloadedIntermediates()` calls attachment
  `cacheAll()` when certificate data or records are absent, imports certificates
  in bounded download chunks, marks completed records, then deletes cached
  attachments. `RemoteSettingsClient` maps that cache to IndexedDB operations.
- `CRLiteFilters.onObservePollEnd()` checks disk and loaded hashes, downloads or
  rereads needed filters, and passes full/delta data to certificate storage.
  It is a separate route from intermediate-certificate attachment bundles.
- The generic startup changeset bundle uses LZ4 through `IOUtils`, followed by
  synchronous `JSON.parse`, with temporary-file removal in `finally`.
  The attachment bundle instead uses synchronous ZIP-reader calls and stream
  reads between awaits, saving cache records in batches of 50. Existing worker
  support for other Remote Settings operations does not prove these ZIP calls
  run off the caller thread.

The certificate import/cache lifecycle is consistent with the entry-count
burst. It does not establish that it occurred in these captures, nor its share
of parent CPU. A later profile should look for these exact operations rather
than assigning the entire burst to certificates by filename coincidence.

## Reproduced Cleanup Gap

`modules/services-settings/Attachments.sys.mjs` is SHA256
`9fc987bab2abce441f033673fe9f03ab9babc9c208e43d34e26336ff3d0366bb`
in both packages. `Downloader.cacheAll()` writes a generated `.zip` under
`PathUtils.tempDir`, opens an `nsIZipReader`, processes records, then returns.
There is no explicit reader close or temporary-file removal in the method.
Failure paths have the same omission. Entry-stream cleanup also depends on
reaching each explicit close statement, so per-entry exceptions deserve
separate coverage in a fix.

The exact module was evaluated in a Node VM with fake network, files, ZIP
reader and cache. No actual fetch, temporary file or native ZIP operation was
performed. Desired cleanup assertions produced:

- Three passing controls: offline, already cached and HTTP failure before write.
- Four expected failures: success, archive-open error, entry-read error and
  cache-write error all left the fake temporary file. The three cases with a
  successfully opened archive also had no close call.

The behavior is reproduced at the JavaScript call boundary, not native file
lifetime or garbage-collection timing. Upstream source currently has the same
method shape. `nsJAR::Close()` releases its archive reference; it is not a
temporary-file deletion API. No old run is relabeled and no system temporary
directory was inspected to look for leftovers.

The native Linux temporary-directory producer checks `TMPDIR`, then `TMP`,
then `TEMP`, falling back to `/tmp/`. The two saved child environments have none
of those overrides. Actual `PathUtils.tempDir` was not queried in these runs.
Thus the owned-tree artifact counter is not an all-browser-write ceiling, and
existing application-data containment does not prove temporary-file containment.

Source references, pinned to the discovered Searchfox revision:

- [Attachment bundle method](https://searchfox.org/firefox-main/rev/d0f18859d99ecb16f4c5d641b35a5f3bdb7b4f36/services/settings/Attachments.sys.mjs#183)
- [Intermediate import consumer](https://searchfox.org/firefox-main/rev/d0f18859d99ecb16f4c5d641b35a5f3bdb7b4f36/security/manager/ssl/RemoteSecuritySettings.sys.mjs#288)
- [Attachment cache deletion](https://searchfox.org/firefox-main/rev/d0f18859d99ecb16f4c5d641b35a5f3bdb7b4f36/services/settings/RemoteSettingsClient.sys.mjs#250)
- [ZIP reader close](https://searchfox.org/firefox-main/rev/d0f18859d99ecb16f4c5d641b35a5f3bdb7b4f36/modules/libjar/nsJAR.cpp#173)
- [Linux temporary-directory selection](https://searchfox.org/firefox-main/rev/d0f18859d99ecb16f4c5d641b35a5f3bdb7b4f36/xpcom/io/SpecialSystemDirectory.cpp#481)

## Verification and Next Action

The six analyzer tests pass, including total mismatches, duplicate/aliased paths,
skipped symlinks, invalid numbers, timeline corruption and cap exceedance.
The initial analyzer RED was missing-module scaffolding, not a behavioral bug.
All saved file/group sums reconcile; repeated computation is byte-identical.
The cleanup reproducer intentionally remains RED against the unchanged package;
do not include it in a passing-test claim. Exact-file lint/format results and
the extraction manifest are retained with the evidence.

No performance fix was installed or measured this turn. Further browser runs
remain held, and the owner desktop browser remains untouched.

The next useful engineering step is a narrow deterministic attachment cleanup
fix, retaining download, validation, cache and error semantics. It needs
success/error/partial-write/close-failure/removal-failure tests and real isolated
Gecko verification before packaging; the mocked repro alone is not acceptance.
Do not combine that fix with the existing Suggest comparison packages.

Separately, future startup captures need explicit private temporary-directory
ownership/accounting and a native directory receipt before claiming that scope.
For repeating the early Suggest CPU result, a shorter predeclared startup-only
observation can target the first receipt and retain all caps and aborts; it
must not silently omit cap failures or be presented as a sustained workload.
No long baseline repeat, cap increase, cache deletion or security opt-out is
justified by this audit. Headed GPU/video testing still needs the pending window
permission and remains separate from these headless startup findings.
