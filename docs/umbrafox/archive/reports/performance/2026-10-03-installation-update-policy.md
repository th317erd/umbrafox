# Prospective Empty Updater Directory Policy

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Outcome

A new scratch-only verifier accepts a narrowly defined post-exit installation
state for future isolated startup tests. It is not wired into a browser-launch
entry point. No browser, remote command, native build, installed application,
personal profile or shared crash directory was used in this step.

The [original candidate pilot](2026-10-03-quicksuggest-startup-pilot.md) remains
failed. Its sealed driver, evidence and installation verifier are unchanged.
This is a prerequisite for another controlled performance measurement, not a
performance improvement or an accepted replacement for that failed run.

## Contract

The new module is `artifacts/umbralink-control/installation-updates.mjs`.
`admitStartupUpdates` enrolls an existing authentic, immutable in-memory
`admitInstallation` receipt while the installation is still pristine. It calls
the original strict verifier again and refuses any preexisting lock or update
subtree, including a subtree declared by the original manifest. It captures
`0755 & ~controllerUmask` without changing the umask. The root must have the
expected Linux directory link count for its original direct children.

After the caller independently establishes owned process cleanup,
`verifyStartupUpdates` permits either the unchanged old policy or precisely:

- All three new directories: `updates`, `updates/0`, `updates/downloading`.
- Both child directories empty, with no additional files or directories.
- Original owner and device, unique positive integer inodes, captured exact
  directory mode, and link counts 4 for `updates` and 2 for each child.
- Original root identity except for exactly one additional directory link.
- The existing optional empty `.parentlock` contract, with original owner and
  device, exact captured mode, one link and no inode alias.
- Every original file and directory identity unchanged, plus original file
  bytes, sizes and permissions verified by the unchanged `verifyTree`.

Partial trees, extra empty files, downloaded files, symbolic links, special
modes, foreign ownership/devices, replaced originals and forged receipts fail.
No file is deleted, repaired or ignored to obtain acceptance.

The adapter first calls the original verifier. When that verifier rejects a
completed inventory, the adapter validates the exact new-directory contract,
hashes all original files and obtains another complete inventory through the
original verifier. Both inventories must agree. If the original verifier passes
without the new tree, its full verification is retained unchanged.

One composed abort signal and a 20-second deadline cover the entire postcheck,
not a fresh budget per phase. Completed failure observations are preserved with
the underlying error as `cause`. A race found during review showed that the
first implementation retained the earlier inventory when the second changed.
A failing regression reproduced this; the corrected adapter retains the latest
completed inventory instead. Already-issued filesystem I/O is not claimed fully
cancellable, and inventories are not a continuous or race-free mutation trace.

The result names `startup-empty-update-directories-v1`, uses result version 2,
and records `updateDirectories`, lock metadata, hash counts and the observation.
`validateUpdateObservation` is a pure metadata validator for tests; it is not a
substitute for `verifyStartupUpdates` and does not certify file contents.

## Source Rationale And Limits

The prior pilot report records both the observed empty directories and the
pinned packaged `UpdateService.sys.mjs` producer. Its `getUpdateDirCreate`,
`getReadyUpdateDir` and `getDownloadingUpdateDir` explain why this state is
plausible. They do not identify the writer in the old run or prove a download.

This change affects controller-side test acceptance only. No browser defaults,
updater settings, public JavaScript, network behavior, cache handling, native
code or artifact/resource caps are changed. The mandatory Firefox-parity rules
therefore require no exception. Source correspondence and a post-exit inventory
are not evidence of no network activity or no transient writes.

## Verification

The new suite has 27 passing tests. Together with the existing installation,
strict-tree and pilot suites, the final gate has **65 passes, zero failures**.
Each new test has a three-second watchdog; the combined command has a 20-second
outer bound. Tests use disposable filesystem fixtures and fake controller
inputs, not a browser or native executable.

The first behavioral RED was 18 passes and 3 expected failures. The later
observation-retention RED was 26 passes and 1 expected failure. Both are saved.

Coverage includes the exact tree with/without a lock, the old strict checker
still rejecting that tree, no-tree compatibility, enrollment after mutation,
forged receipts, reserved original paths, malformed numeric metadata, owner and
device mismatches, inode aliases, unchanged-size content corruption, directory
and original-file replacement, caller cancellation, and fake-clock deadline
expiry. A temporary filesystem-call hook changes only a disposable fixture
between hashing and the second inventory; addition, removal and replacement
all fail and preserve the newer observation. The hook is restored in `finally`.

Integration with the existing `finishInstallationCheck` confirms that cleanup
and independent root absence precede verification, and an earlier capture
failure remains primary even when the package postcheck passes.

```sh
timeout 20 node --test --unhandled-rejections=strict artifacts/umbralink-control/test/installation-updates-spec.mjs artifacts/umbralink-control/test/installation-state-spec.mjs artifacts/umbralink-control/test/request-pair-files-spec.mjs artifacts/umbralink-control/test/quicksuggest-pilot-spec.mjs
```

Exact two-file ESLint, license, whitespace and trojan-source lint passes with
zero warnings; Prettier check passes. Six previous evidence seals still verify.
The staged diff remains 231628 bytes with SHA256
`3b78253cf775a4a1e8c69a4b82cc3958b366056129a391f4ae362bdfe8e4e0c4`.
No source was staged or committed.

Logs are in `artifacts/umbralink-control/installation-updates/`; the new seal is
`artifacts/umbralink-control/installation-updates-final.sha256`. This repository
report is not part of the published Sphinx documentation; no documentation or
browser build was run.

## Next Gate

Use a new driver entry point that preserves the frozen original pilot. Enroll
the fresh installation before launch within the existing preparation deadline.
Pass `verifyStartupUpdates` to the existing cleanup-gated
`finishInstallationCheck`; do not broaden its process-absence requirement.
Persist the policy name and failure observation in new terminal evidence.
Exercise that composed path before transferring or launching it.

Further browser execution remains held pending that integration and review.
Then use fresh candidate and matched region/locale baseline startup captures
on the same native build. An inactive or unknown baseline cannot demonstrate
the cost of regional activation. Headed GPU playback permission remains pending;
these headless startup measurements cannot establish the cause of video stutter.
