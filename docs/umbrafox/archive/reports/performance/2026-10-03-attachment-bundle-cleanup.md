# Attachment Bundle Cleanup Candidate

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Status

Implemented a narrow source correction to
`services/settings/Attachments.sys.mjs::Downloader.cacheAll()`, following the
[startup footprint investigation](2026-10-03-quicksuggest-footprint.md).
It deterministically attempts entry-stream and ZIP-reader closure, then removes
the downloaded ZIP and any partial-write file. No browser, native build,
package, installation or personal profile was started or changed.

The actual-source Node replay passes 42 cases. Real Gecko assertions were added
to the existing downloader xpcshell test, but that test has **not run**. This is
a source/test candidate, not packaged acceptance, a native file-lifetime proof,
measured speedup or a video-stutter fix. The sealed original packages still
contain the original behavior and are unchanged.

## Change Contract

The source matched the previously inspected packaged module before editing:
SHA256 `9fc987bab2abce441f033673fe9f03ab9babc9c208e43d34e26336ff3d0366bb`.
The source and its existing xpcshell test were clean before this work.

`readZipEntry()` consolidates the duplicated entry-reading operations. It
attempts to close both the scriptable wrapper and underlying ZIP stream on
read, initialization, availability or close failure. The first failure is
retained even if it is `null` or `undefined`; a secondary close failure cannot
replace it. Successful metadata streams are closed before the asynchronous
Blob text conversion. Existing byte-to-Blob conversion is unchanged.

The archive cleanup is in `finally`. It closes an acquired reader before
attempting removal, attempts both the final ZIP and `.tmp` path independently,
and uses `ignoreAbsent` for files that were never completed or already renamed.
Removal is only attempted after the write was entered, so offline/cache skips,
network errors and body-read failures do not create cleanup filesystem work.
There is no recursive deletion or inspection of unrelated temporary files.

Cleanup errors are logged and make the operation return `false`; they are not
presented as successful cleanup. A failed close may leave a native handle live,
and a failed removal may leave a file. The fix guarantees cleanup attempts and
error reporting, not that every operating-system operation succeeds.

The original result shape remains `true`, `false` or `null`; existing failures
before download admission still reject. Initial fetch, URL construction, force
semantics, cache detection, record conversion, 50-record batch size and normal
cache contents are preserved. An entry-stream close failure is now detected
before queuing that entry into the batch, so a failed entry may be omitted from
the partial cache. No successful-result equivalence is claimed for injected
close failures.

Only two product-tree files changed:

- `services/settings/Attachments.sys.mjs`
- `services/settings/test/unit/test_attachments_downloader.js`

The scratch source replay, logs and diff live under
`artifacts/umbralink-control/attachment-cleanup/`. No manifest, preferences,
certificate verification, request-interception code or native code changed.

## Producer and Consumer Review

The upstream system-module search found the production `cacheAll()` call in
`RemoteSecuritySettings.sys.mjs::IntermediatePreloads.updatePreloadedIntermediates()`.
It populates attachment cache before certificate import. That path continues
to use the existing certificate validation/import and cache-deletion behavior.
The fix neither disables security updates nor changes their scheduling.

Source inspection of `nsScriptableInputStream::Close()` shows that it delegates
to the underlying input stream. `nsJARInputStream::Close()` ends an active
inflater, switches to closed mode, clears the file reference and returns
success; repeated closure is supported in that implementation. Both streams
were already explicitly closed by the old healthy path, though not on all
errors. These source checks are not a native test of the edited module.

The prior capture's temporary-directory coverage gap remains separate. No
native `PathUtils.tempDir` receipt or private-temp harness correction was added
here. Do not treat this fix as an all-browser-write containment mechanism.

## Verification

The replay evaluates the full current source with Node VM modules and fake
XPCOM, network, ZIP, filesystem and cache operations. It does not implement a
second copy of `cacheAll()`, open a real ZIP, contact a server or create a native
Gecko process. Fake handle flags record close attempts, not OS cancellation.

After correcting an initial test-source relative path error, the unchanged
source produced **8 passes and 28 assertion failures**. That behavioral RED is
retained in `behavioral-red.log`; the earlier path-error log is not behavioral
proof. The first implementation passed the original 36 cases, followed by
additional coverage reaching **42 passes**:

- Empty, one-entry and 51-entry bundles; exact fixture contents and batching.
- Offline/cached skips and forced downloads.
- Fetch, response-body, 429/503, partial-write and completed-write failures.
- File lookup, ZIP creation/open/enumeration and entry-open failures.
- Stream availability/creation/initialization/read/close failures.
- Invalid JSON, Blob creation, asynchronous text conversion and cache failures.
- Archive-close and both removal failures, with remaining cleanup attempted.
- Primary failures surviving secondary failures, including falsy thrown values.
- Concurrent calls on different downloaders and on the same downloader, with
  independently generated temporary paths.
- Unchanged early configuration/cache-check rejection behavior.

Command used, with a 10-second process bound and two-second individual bounds:

```sh
timeout 10 node --experimental-vm-modules --test --unhandled-rejections=strict \
  artifacts/umbralink-control/attachment-cleanup/test/cleanup-spec.mjs
```

Existing Gecko tests now assert that ZIP and staging paths are absent after
success, real IndexedDB use, forced download, bad ZIP and failed cache save.
Two additional native tests cover actual staging-file creation followed by
write failure and visible removal failure with the other cleanup still
attempted. Global IO mocks are restored and observed temporary paths are
cleaned by test teardown. These native assertions are authored, not passing
runtime evidence.

Scoped ESLint, license, whitespace and trojan-source checks and formatting passed
against the three edited code/test files. Logs, the final
implementation diff, file hashes and preservation guards accompany this report.
The previous 141-file matched-pair seal, 64-file footprint seal and staged
index were independently checked; the expected index is still 231628 bytes,
SHA256 `3b78253cf775a4a1e8c69a4b82cc3958b366056129a391f4ae362bdfe8e4e0c4`.

## Parity and Remaining Gates

The new helper is module-private. No page globals, WebIDL, DOM, CSS, headers,
network methods, credentials, cache preferences, certificate rules or download
URLs are added or changed. New warnings use the existing privileged Remote
Settings logger. Website behavior is not customized. The patch has no
content/private-browsing/container-specific branch.

This source review does not establish universal Firefox timing equivalence.
Native behavior, particularly real ZIP-reader teardown and platform removal
semantics, still needs the isolated xpcshell test. That run must use reviewed
owned profile/application-data/temp roots and normal nonlocal-network test
restrictions; do not launch it against personal state or use it to bypass the
current browser-runtime hold.

Before packaging or performance claims: run that native suite, inspect its
cleanup and unchanged data assertions, then test the resulting package under
the separately reviewed capture protocol. Keep this correction separate from
the sealed Suggest A/B packages to avoid attributing a combined change to
Suggest alone. No headed window, owner-browser restart or installation is
authorized by completion of this source gate.
