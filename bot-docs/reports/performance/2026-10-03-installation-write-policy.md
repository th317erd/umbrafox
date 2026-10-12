# Bounded Disposable Installation Writes

## Purpose And Status

The sustained headless capture's outer driver failed because its disposable
installation gained `.parentlock`. Its original manifest still fails and all
original evidence remains unchanged. This step prepares a prospective policy
for a **fresh, owned Linux test installation**, not a retrospective waiver.

New scratch-only `artifacts/umbralink-control/installation-state.mjs` adds
admission/postcheck helpers. The old `request-pair-files.mjs::verifyTree` is
unchanged and still enforces exact file hashes, sizes, modes and file names.
No browser driver is wired to the new helpers yet. No browser, native build,
remote command, installed application, profile, cache, or update setting was
used or changed in this step. Filesystem tests use disposable tiny fixtures.

## Prospective Contract

Before launch, the caller must exclusively create a new private installation
from verified package inputs. `admitInstallation` requires a canonical Linux
directory owned by the current UID, mode 0700, and the exact expected file and
directory set. It rejects any preexisting `.parentlock`. The file manifest is
copied and frozen; no caller mutation can broaden the later check. Admission
captures stable root, file and directory identities around a full hash check.

The same controller retains an in-memory admission object. After independently
establishing owned browser cleanup, `verifyInstallation` permits only:

- All original code/data file bytes, sizes and permissions unchanged.
- All original root/file/directory device, inode, owner, mode and relevant
  metadata unchanged. Identical bytes in a replacement inode still fail.
- Optionally, one new root-level `.parentlock`: regular file, zero bytes,
  current UID, one hard link, no special mode bits, and permissions exactly
  `0666 & ~controllerUmask` captured before launch. No arbitrary mode override.
- No other file, directory, nested lock, symlink, special node or hard link.

When a lock is present, a new in-memory post-run manifest adds precisely its
empty SHA256, zero size and expected mode before calling the original strict
verifier. The original manifest is neither edited nor replaced. A repeated
inventory brackets hashing. The result contains the observed lock metadata and
the bounded installation inventory. Completed observations that fail validation
are attached to the thrown error with the primary failure retained as `cause`.
Incomplete I/O failures need not have a complete observation.

Each operation has a 20-second bound and a composed abort signal. Directory
enumeration streams through `opendir`; entry/path/count limits prevent accepting
unbounded inventories. No write, unlink, chmod, signal, launch or fallback is
performed by either helper. Already-issued filesystem calls are not claimed
fully cancellable. The prospective driver must save failed observations and
retain its original failure, then stop rather than automatically retry.

The caller's fresh-copy and process-cleanup obligations are separate gates,
not properties the filesystem helper can infer. These point-in-time checks are
not a race-free filesystem sandbox, continuous mutation trace, proof of no
network activity, or attribution of the lock's writer.

## Source Rationale

The existing [sustained report](2026-10-03-sustained-playback.md) contains pinned
producer/consumer references. A fresh Searchfox lookup of
`UpdateMutexImpl::TryLock` confirms that it obtains `XRE_UPDATE_ROOT_DIR` and
passes it to `nsProfileLock`. The previously inspected Linux directory provider
maps that directory to the executable parent. This supports the policy's
plausibility but still does not prove which loaded code wrote the old lock.
Searchfox reports an available CLI update; no installation was performed.

## Verification

`test/installation-state-spec.mjs` has 20 passing cases. The existing strict
tree regression passes alongside it, for **21 passes** total. The initial
missing-module RED is fixture development evidence, not a reproduced engine
defect. The retained old runtime failure is the actual motivating observation.

Positive tests admit a clean tree and the exact optional lock. Negative tests
cover preexisting/nested/nonempty/directory/symlink/hardlinked locks, unexpected
entries including empty directories, changed bytes/modes/special bits, root or
file replacement, manifest mutation, lexical aliases, malformed paths, aborts,
unrecognized admission objects, rejected-inventory retention and non-Error
abort reasons. The positive test also proves that the untouched old manifest
still rejects the resulting tree and that the checker does not delete the lock.

Scoped license, whitespace and Unicode-control checks pass. No native executable
or controller child was launched by these tests. The new helpers remain
scratch-only; there is no product or shared harness change in this step.

```sh
timeout 15 node --test --unhandled-rejections=strict artifacts/umbralink-control/test/installation-state-spec.mjs artifacts/umbralink-control/test/request-pair-files-spec.mjs
```

Evidence is under `artifacts/umbralink-control/installation-state/`. Its freeze
manifest is `artifacts/umbralink-control/installation-state-final.sha256`.

## Remaining Work

Integrate this policy into a new bounded driver using exclusively created
installation state, immutable input hashes, explicit cleanup verification, and
saved failed observations. Do not modify or reuse the contaminated old package
as a newly clean baseline. Retain the old driver's failure status.

The new QuickSuggest candidate still needs native frontend integration and
matched isolated before/after measurements. The prior 256 MiB run-artifact cap
and tight sampled headroom remain; neither is relaxed by this installation
policy. A prospective pilot needs an explicit bounded startup/headroom gate.
Further browser runs are still held until that integration and admission work
is reviewed. Headed GPU testing also still requires the pending window consent.
