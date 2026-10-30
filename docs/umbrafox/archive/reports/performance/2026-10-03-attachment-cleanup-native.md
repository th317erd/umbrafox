# Attachment Cleanup Native Verification

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

The [attachment cleanup candidate](2026-10-03-attachment-bundle-cleanup.md)
now passes its existing Gecko downloader test file on the local Linux xpcshell
build. The final verbose run passed **156 assertions**, including real ZIP
extraction, IndexedDB storage, temporary-file removal, partial-write failure and
explicit removal-failure reporting. The 42 actual-source Node tests also pass.
This is correctness evidence, not a measured startup or playback improvement.

No browser window, personal profile, installed package, launcher, extension,
native build or staged change was modified. These were standalone xpcshell
unit-test processes, not browser performance runs. Existing browser-runtime
and headed-window permission boundaries remain in effect.

## Native Test Correction

The first run failed when the cleanup helper observed zero archive writes.
The test patched its own `IOUtils` object, while the module used the object in
its separate system-module global. The final native diagnostic explicitly
reports `sharedIOUtils: false` and `cleanupPresent: true`.

Only the existing test file changed in this follow-up. It obtains
`Cu.getGlobalForObject(Downloader).IOUtils` and applies the write/remove hooks
there, retaining the existing `finally` restoration. No production helper,
API or preference was added. Reversing that precise test-only delta reproduces
the previous frozen test hash; `test-before.js.snapshot` preserves those bytes.

The production module is unchanged from the source-candidate milestone:

- `Attachments.sys.mjs`: `dbb945734369469677c29c8f4f3ba0bb1400d679401fb7b2adf41c72d9392a27`.
- Final native test: `50617a38d7d53cbb9017412f245e4926984b8dc5d915bb05040dd994117b7b07`.
- Previous native test: `c9bd26ccc96e285c34d5658f0b32ae532d0b5180ae03ca4901b9475f4cc2e80e`.

The original source milestone and its seal remain historical evidence. Its
test-file hash is intentionally superseded, not silently backfilled.

## Isolated Harness

The standard `mach xpcshell-test` adapter replaces the supplied temporary root
with the object-tree temp directory. Instead, the existing direct Python
harness was run through `mach python --`. A scratch manifest selects only the
existing test file and its normal heads, plus a directory-assertion head. The
manifest names both Firefox and Umbrafox application-directory keys because
this build's `mozinfo.appname` is `umbrafox`.

Each invocation creates a fresh private run directory, with private `tmp`,
`harness`, `app-data` and `local-app-data` children. The child environment is
explicitly constructed; `HOME` is not changed. `TMPDIR`, `TMP` and `TEMP` point
inside the run. The normal xpcshell `do_get_profile()` provider registers both
profile and `TmpD` keys. The final native receipt verifies that
`PathUtils.profileDir`, `PathUtils.tempDir` and the directory-service `TmpD`
resolve to the expected owned test profile before executing the test body.

The run forces `MOZ_DISABLE_NONLOCAL_CONNECTIONS=1`, clears the xpcshell
`MOZ_CRASHREPORTER` launch guard, sets profiler startup to zero and uses
`telemetry.fog.test.localhost_port=-1`. This is FOG's documented test mode that
records metrics but discards outgoing pings. These are test-process controls,
not product defaults or claims about the working browser. No shared crash
queue or personal profile was inspected.

An outer 120-second SIGTERM timeout precedes the harness's configured
300-second internal timeout. All three native executions ended normally in
less than half a second of reported test time; neither timeout fired and no
SIGKILL was issued. HTTP/2 and HTTP/3 helper servers were not started; the
harness preserves warnings about those unused helpers. The test's own
loopback HTTP fixture is used. The environment and directory assertions are
not a general filesystem or network sandbox proof.

## Retained Results

Evidence root: `artifacts/umbralink-control/attachment-cleanup-native/`.

- `run-4R4nWR`: retained failing test-hook run; native directories passed,
  cleanup helper failed with zero observed writes. Controller/xpcshell PIDs
  2354264 and 2354295 were subsequently absent.
- `run-jUJT8h`: first corrected run passed. Passing child logs were buffered,
  so this run does not retain an assertion inventory or child PID. Recorded
  controller PID 2357210 was subsequently absent.
- `run-hAgiWL`: final verbose run passed, 156 assertions and zero failures,
  426 ms between test-start and test-end records. Native receipt and module
  global distinction retained. Controller/xpcshell PIDs 2358965 and 2358989
  were subsequently absent.

The final suite checks successful and failed archive/cache operations, exact
fixture content, skipped/forced download behavior, the actual creation and
removal of a staging file, and a deliberately retained archive when removal
fails. Test teardown removes that injected-failure artifact. Linux unlink
success alone does not prove native handle counts or memory reclamation; no
such claim is made.

`verification.json` records the structured results, exact observed-PID absence
checks and source/index hashes. `run-native.sh` records the final invocation;
`head_roots.js` and `xpcshell.toml` record the added admission assertions.
The first run predates the manifest's Umbrafox app-directory key and the
module-global diagnostic. The final two runs use the corrected app directory.

`native-inputs.sha256` pins xpcshell, libxul and adjacent INIs. These were
rechecked after execution. This is the existing object-tree runtime with
current source symlinks, not a new packaged or release build. The recorded
xpcshell SHA is `972c9a8a8ffaa5a4b525192428fccea7bdd0d477b61c294159412ca51da9c12a`;
libxul is `edb44d04361e57a49b4fe867279ad318f946385d961c004c75f32f157714050f`.

Scoped ESLint, license, whitespace and trojan-source checks passed. The first
scratch-head lint failure concerned undeclared harness globals and is retained;
the corrected head declares only those globals. Formatting and diff checks
passed. The staged index remains unchanged at SHA256
`3b78253cf775a4a1e8c69a4b82cc3958b366056129a391f4ae362bdfe8e4e0c4`.

## Remaining Performance Work

Native Linux correctness is now supported; other-platform behavior, a fresh
packaged build and real playback impact remain unverified. The broader goal
still requires measured reductions in rendering/startup contention, not merely
successful cleanup tests.

Before another startup measurement, give the browser capture harness its own
private temporary directory and obtain a native receipt for that browser's
provider. The xpcshell receipt cannot stand in for a browser receipt. Preserve
the existing artifact cap and shorter-run/headroom review; do not increase the
cap, delete caches or disable security updates to make a repeat pass. Then
compare startup CPU/disk behavior separately from the Suggest change, followed
by controlled smooth-versus-stuttering playback measurements on the quieter
laptop under the owner's visible-window permissions.
