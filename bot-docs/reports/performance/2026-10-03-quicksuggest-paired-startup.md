# QuickSuggest Paired Startup Preparation

## Status

Two diagnostic packages and a bounded startup driver are prepared. Artifact
verification, fake-controller checks and tiny filesystem tests pass. **No
browser was launched, installed or changed in this step.** The owner desktop
browser, profile, extensions and launcher remain protected. The prior sustained
capture's outer-driver failure remains a failure.

This tests a specific background-work hypothesis: automatic regional Suggest
activation can open its store and schedule ingestion despite initially false
packaged defaults. It does not establish that Suggest causes video stuttering,
nor does this preparation establish a performance improvement.

## Matched Packages

The pair is at
`/home/wyatt/.cache/codex/quicksuggest-pair-20261003-irw3ksmr/`.
Its `pair.json` SHA256 is
`ecbde46a0a2704883bd7cea626ba23d2cbf54a7013c809d5cf574ef17ee79aff`.
The driver pins this exact receipt, BuildID `20261003071500`, and libxul SHA256
`1e2e164e54d826958361ccff1e4a75bb1c92814f9b87877ab340c3bc56f7f2fb`.

Both packages use the existing **inline candidate native binary B**, not the
native A used by the earlier sustained playback capture. Do not pool those runs.
The original export is `exports/umbrafox-mutation-inline-candidate-20261003/`.
Its native archive was hash-checked and compared with its extracted tree during
preparation. No native compilation or new release package was performed.

Both root and browser `omni.ja` archives were repacked using the same existing
Gecko JarReader/JarWriter path on both sides. Each variant has 46 files. The
baseline is 475118954 bytes; the candidate is 475119407 bytes. The executable,
libxul and all other non-archive files are byte/mode/size-identical. The only
candidate archive-entry changes are:

- `moz-src/browser/components/urlbar/QuickSuggest.sys.mjs`
- `moz-src/browser/components/urlbar/UrlbarPrefs.sys.mjs`
- `defaults/preferences/firefox.js`

The preference change is appended to the original packaged defaults; the two
module replacements match the frozen source candidate. This is a diagnostic
frontend overlay, not a release build. Both variants preserve archive member
order, modes, compression and preload metadata. The independent readback audit
checked all 2676 root-archive and 5368 browser-archive entries per variant,
not only the three changed entries. Actual loading remains a runtime gate.

Both pristine package directories passed the installation helper's owner,
0700 mode, regular-file, exact-membership, identity and full-byte checks. Neither
contains a preexisting `.parentlock`.

## Driver Contract

Scratch `artifacts/umbralink-control/quicksuggest-pilot.mjs` accepts only
`wyatt-laptop` and an explicit headless-startup command. For each future run it
creates a fresh private installation from one verified pristine variant,
preserving the immutable admission object. It does not execute the source pair
directly or reuse the previously contaminated installation.

Preparation has a 60-second signal, a 45-second copy bound with its own abort
signal, and bounded metadata/evidence operations. Expired preparation prevents
launch. A completed copy operation checks cancellation before starting another
operation. Already-issued filesystem I/O is not claimed fully cancellable.

The driver reuses `captureLocalWorkload`, its existing 120-second browser
envelope, 105-second work deadline, owned cleanup, native directory/build
receipts, isolated profile/application-data roots and resource monitor. Shared
harness and product source are unchanged in this step.

After the harness's initial quiet period and completed resource baseline, the
pilot requires at least **32 MiB sampled headroom under the unchanged 256 MiB
run-artifact cap**. It does not delete caches, change cache limits, suppress
global Remote Settings, force a region or raise caps. The installation and the
bounded outer driver report live outside the monitored `run/` subtree; the
256 MiB cap is not a bound on the entire package preparation directory.

The pilot makes two read-only privileged Suggest observations separated by at
least 30 seconds of monotonic waiting, plus two performance snapshots. It saves
each raw reply before validating it. Replies must identify the owned parent,
the same browsing context, completed Suggest initialization, and unchanged
region/locale. Performance replies must name the same parent and have profiling
off. Candidate regional/main/effective/backend/AMP state must all be false, with
no explicit user values for the main or regional pref.

Baseline activation is observed, not fabricated: an unsupported or unknown
region may leave baseline Suggest inactive. That would be a valid startup
observation but insufficient to measure an activation difference. Nimbus and
shared Remote Settings remain possible influences. Importing/reading internal
modules and the RPCs are observations with potential cost, not zero-overhead
instrumentation.

After capture, the outer controller requires clean cleanup and a second bounded
exact-root absence check before hashing the installation. The sealed prospective
installation policy permits only an optional newly created empty root lock with
the exact approved metadata. No retrospective relaxation of the old manifest is
made. Uncertain cleanup skips the installation check and fails acceptance.

Capture failures trigger a bounded read of terminal `run.json`; postcheck
failures retain their available observations. The first failure is preserved
when terminal evidence writing also fails; that secondary write failure is
reported on stderr and in the controller's in-memory state. A failed write is
not a guarantee that a final JSON report reached disk. There is no retry loop,
SIGKILL or recovery mutation.

## Verification

Evidence is in `artifacts/umbralink-control/quicksuggest-pair/`:

- `pilot-behavior-red.log`: 11 passes and three expected behavioral failures
  for truthy non-boolean cleanup acceptance, masked primary failure and foreign
  performance identity acceptance. Earlier missing-export development failures
  are retained separately, not presented as browser defects.
- `node-reviewed-tests.log`: **74 passes**, comprising 17 pilot tests plus
  installation/strict-tree and existing Suggest source-replay regressions.
  Tests cover failure ordering, raw-reply retention, context/region/locale
  mismatch, headroom, abort/deadline, early timer wake, copy partial failure,
  late completion after abort, independent inodes, aliases and contamination.
- `pair-final-tests.log`: four two-archive preparation tests pass.
- `archive-regression-final.log`: nine existing archive regression tests pass.
  Its duplicate-entry warning is from the intentional malformed ZIP case.
- `artifact-audit.json`: actual pair files and all archive entries verified.
- `installation-admission.json`: actual pristine pair admission/postchecks pass.
- `scoped-lint-final.log` and `python-lint-final.log`: clean scoped ESLint,
  license/whitespace/control-character checks and Ruff; formatting also checked.

A Python unittest discovery attempt found zero tests because the hyphenated
filenames were not discovered; that nonzero exit is retained in
`archive-final-tests.log`. The successful gates explicitly execute both files.
No browser executable, server or client was launched by these tests. Node tests
use fakes and tiny owned filesystem fixtures; Python tests use small archives.
The original source replay still mocks native/pref/Nimbus dependencies and is
not Gecko integration proof. The authored native QuickSuggest regression has
not been run under the runtime hold.

## Next Gates

Before any browser launch, review the frozen driver, transfer only verified
owned inputs to the quiet laptop, and verify dependency hashes plus host/disk
admission. The diagnostic has not yet been transferred or launched. Runtime
hold is retained at this preparation checkpoint; no future launch follows just
from these test results.

A separately admitted single startup pilot should establish real loaded
candidate behavior, native cleanup, installation mutation policy and sampled
headroom. Only then consider matched baseline/candidate repetitions with the
same observed region, locale and profiler state. A cap failure is a censored
run, not permission to raise the cap or discard caches.

Actual playback, visible GPU rendering and YouTube stuttering remain separate
measurements. Headed laptop window permission is still pending; these headless
startup results cannot substitute for that rendering test. No optimization
speedup, network-isolation, continuous resource bound or stutter causality is
claimed by this report.
