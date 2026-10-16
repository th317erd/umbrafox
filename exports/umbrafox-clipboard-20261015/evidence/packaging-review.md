# Clipboard Prototype Packaging Review

Reviewer: bridge. Bounded source-only sidecar. No packager/test execution, archive
inspection, build/config output, runtime, Programs, profile, or clipboard reads.
Only this scratch report and teamwork DB were changed.

## Findings

### P1: Required Tracked Source Edits Can Be Missing Without Rejection

Status: addressed by the narrow source follow-up described below. Original
finding retained for the audit trail.

`package_prototype.py`, `source_inputs` (reviewed lines 49-63), derives `changed`
solely from `git diff HEAD` in SOURCE. It checks those discovered paths against
REPO, but does not require an expected tracked-change set. In contrast, untracked
files must exactly equal `NEW_FILES`.

Consequently, a required tracked integration edit that was never copied into
SOURCE is absent from `changed` and never compared. For example, all new actor
files can be present while their tracked ActorManager registration or moz.build
integration edit is missing. The source check can still return successfully.
This is a gate gap, not evidence that the actual build checkout has such an
omission; that checkout was not inspected.

The five source tests do not cover this: `test_exact_tracked_and_new_inputs`
supplies its single changed path through a mocked git response. Its logic has no
assertion requiring that path when the response omits it. The reused old beta
packager did explicitly require its expected tracked-change list.

Narrow correction: freeze the prototype's approved tracked path set (or a sealed
input manifest), require exact membership, and retain the existing byte-digest
comparisons. Add an omitted-required-tracked-path test, as well as unexpected
tracked-path rejection. Do not compare against every unrelated dirty main file.

### P2: Exported Provenance Bytes Are Not Sealed By The Final Source Check

`package_prototype.py`, `package` (reviewed lines 118-136), checks source stability
before creating `source-supplement.tar`. The later `supplement.add(SOURCE/name)`
reads live source bytes, with no verification that each archived member matches
the corresponding recorded `sourceInputs.fileSHA256`. A source edit between that
check and the archive read can therefore leave the supplement inconsistent with
the asserted source hashes while packaging still succeeds.

Related copied-input mismatches are possible because `mozconfigSHA256` hashes
live OBJ/.mozconfig after copying it, rather than the exported `output/mozconfig`,
and `overlaySHA256` hashes the live REPO overlay rather than the bytes already
copied into the payload. The archive/file manifests can remain internally valid
while these provenance fields describe different bytes.

Narrow correction: verify supplement membership/content against captured source
digests after writing; hash the exported mozconfig and the packaged overlay bytes
and compare them to captured inputs. Add a synthetic mutation-at-copy regression.
No need for a general packaging refactor. This is a source-supported race window,
not a claim that an input actually changed during a package run.

## Source Gates That Look Consistent

- `archive_files` validates canonical member names under `umbrafox`, rejects
  duplicate names, links and special files, rejects special permission bits,
  caps compressed size/member count/per-file size/expanded total, and hashes each
  regular file. Extraction uses the data filter and is compared to that snapshot.
- The overlay is created exclusively, exactly one new regular-file path is
  allowed, and every original regular-file digest/size/mode must remain unchanged.
  The final archive is rescanned against the post-overlay snapshot. These gates
  concern regular files; directory metadata is not represented in the snapshot,
  and root chmod is an explicit additional metadata change.
- The prototype checks Firefox UA name, optimization enabled, debug/probes false,
  and x86_64. Version, optimize flags, and channel are recorded but not separately
  constrained. No contrary expected values were supplied in this review.
- Both INI BuildIDs must equal the pinned prototype BuildID. The imported native
  note checker requires the expected note owner/offset/string structure and the
  exact same 14-digit BuildID, using bounded `readelf` invocation when executed.

## Verification Limits

The reported five source and five archive tests passing are parent-provided
evidence, not rerun here. Their source covers basic source mismatch/supplement and
archive membership/type cases, not the two findings above or the end-to-end
configuration/BuildID/overlay package flow. No real archive or native build was
inspected. Current source hashes plus matching BuildID do not independently prove
that the binary was compiled from those hashes; the parent's sealed build/export
handoff remains necessary.

Source helpers read only to reconcile the validator: `safe_member`,
`file_digest`, `tree_snapshot` in request-artifact.py, and package_buildid.py.

## Reviewed Source Hashes

- package_prototype.py: `ad7c7ad69394a3ceb28636b59ab545a79b93f283c33c7b9328e547826c11df4d`
- prototype package_spec.py: `39c136a6e680da87fc33b56989c9223096a199766c4c463b26a448cb35b1b48d`
- package_beta.py: `21ff7dc4849e74f7956c45d048d4f2ca6cd8d9b5289b1328b5f194e5ae546865`
- beta package_spec.py: `c9572762ce9519c46c455d8e7f8066b2c505d8e0bc8d0d6cae53a14476c509f0`

## Narrow P1 Follow-Up Confirmation

The amended `package_prototype.py` declares the parent's frozen 36-path
`TRACKED_FILES` set, including native interception/build integration, actor
registration, UI localization/permissions, and test manifests. `source_inputs`
requires `set(changed) == TRACKED_FILES` before entering the existing per-path
symlink and SOURCE/REPO hash checks. Both a missing required tracked path and an
unexpected tracked path now fail this gate. The separate 13-path `NEW_FILES`
exact-membership requirement remains intact.

`package_spec.py` patches the expected tracked set to `{'existing.cpp'}` and adds
`test_missing_required_tracked_change`, returning an empty tracked diff while
retaining the expected new file. This directly targets the original omission
case, rather than merely a digest mismatch.

Conclusion: the identified P1 gate defect is addressed in the reviewed source.
Parent-reported evidence is RED 5 pass / 1 fail before the gate and GREEN 6 pass
after it; tests were not rerun here. This does not certify the actual build-source
sync, the completeness of external build provenance, or a real package. The P2
exported-byte consistency finding remains open. Installer adapter was not read
or audited; no scope expansion or source edits were made by bridge.

Follow-up source hashes:
- package_prototype.py: `39def8782aded6611d5b932318d8f103dd34045514e9f172d68ff4445b720283`
- package_spec.py: `a9bdf14bb3c1b87e60cd100765dbe1e803e1d59f8b07e42ba64b478223e6d99d`
