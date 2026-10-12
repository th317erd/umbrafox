# QuickSuggest Candidate Startup Pilot

## Outcome

One isolated headless candidate startup ran on `wyatt-laptop`. Its browser
capture passed the bounded functional and sampled-resource checks, but the
**outer driver failed its installation postcheck**. There was no retry,
baseline launch, native build, installation into the daily browser, or change
to the owner's desktop browser/profile/launcher. This is not an accepted full
run or a performance-win claim.

The useful new evidence is actual parent-process behavior in US/en-US: Suggest
initialization completed and the candidate's regional, main, effective-main,
Rust-backend and AMP states were false at both observations. Neither the main
nor regional setting had a user value. These were browser-realm UmbraLink
receipts, not source-replay mocks. They establish this candidate's observed
behavior; they do not establish all preference/migration/experiment cases.

## Inputs And Execution

The earlier [paired preparation](2026-10-03-quicksuggest-paired-startup.md)
identifies the exact pair. Only its candidate, receipt and required harness
files were transferred, into fresh private laptop scratch:

`/home/wyatt/.cache/codex/quicksuggest-startup-harness-20261003-O21Ohh/`

All 17 transferred harness/fixture/test hashes matched. The laptop repeated
38 driver, installation and strict-tree tests successfully. Its pristine
candidate package then passed admission and postcheck: 46 files,
475119407 bytes, no lock. The actual run used another exclusively created
private installation, not the pristine source package.

Prelaunch at `2026-10-04T03:29:20.071Z` found no recognized compiler processes,
load averages 0.38/0.29/0.25, 11749556224 available memory bytes and
175831535616 available disk bytes. This is a point-in-time admission, not
continuous host exclusivity. The date is October 3 in America/Phoenix.

The actual run root is:

`/home/wyatt/.cache/codex/quicksuggest-startup-20261003-ejIYH6/`

Controller PID was 647843; browser PID was 647857. The browser capture lasted
41384 ms, from `03:29:21.315Z` to `03:30:02.699Z`. Both native and adjacent
metadata reported BuildID `20261003071500`. As in preparation, this is common
inline-candidate native B, not the native A from the older sustained capture.

No Suggest, region, cache, updater or resource-cap preference was overridden by
the new pilot. The existing isolated harness preferences/application-data
containment and authenticated control service were retained. No profiler or
page script workload was started. The fixture was a passive owned loopback page.

## Observations

The before/after performance snapshots span 30015.892133 ms. Both name the
expected parent and report profiling off. The two Suggest receipts agree on
region `US`, locale `en-US`, completed initialization and every checked state.

There were 11 resource samples and 11 distinct sampled browser PIDs. All saved
samples pass the original host/artifact/aggregate caps; applicable post-baseline
samples also pass the baseline-relative caps. Startup baseline artifact size was
63687133 bytes, leaving 204748323 bytes below the unchanged 256 MiB cap.
Maximum sampled artifact size was 139194736 bytes, leaving 129240720 bytes.
Peak sampled summed VmRSS was 1575854080 bytes; this can double-count shared
pages and is a safety measure, not private memory ownership.

Do not compare these sizes directly with the older video capture: duration,
workload, native variant and startup/background activity differ. There is no
matched baseline here, no CPU-cost attribution, and no video, GPU, scanout or
YouTube measurement.

The 182-byte browser log contains the known user-namespace EPERM, headless notice
and SWGL framebuffer warning. Zero log bytes were dropped. No new crash is
established by those lines, and this is not a no-network/no-upload guarantee.

## Preserved Installation Failure

The strict postcheck observed three new directories:

- `updates`, mode 0755, owner UID 1000, containing only `0` and `downloading`.
- `updates/0`, mode 0755, owner UID 1000, empty at the post-exit check.
- `updates/downloading`, mode 0755, owner UID 1000, empty at that check.

The root's link count changed from 7 to 8. A new `.parentlock` was also observed,
regular, empty, owner UID 1000, mode 0664 and one link. The policy permits the
lock's exact metadata but **does not permit new directories or a changed root
identity**, so rejecting this installation was correct under its frozen
contract. The terminal driver report is `failed`, and all observations remain.
Nothing was deleted or relabeled to make the check pass.

A separate post-exit audit at `03:33:48.717Z` streamed and verified all 46
original package files against the pinned candidate manifest: all original
bytes, sizes and modes match. It also checked the exact empty directory state
above. This is narrower than successful immutable-identity admission; it does
not override the failed policy or prove that no transient writes occurred.

Source discovery found the corresponding mechanism in
[`getUpdateDirCreate`](https://searchfox.org/firefox-main/rev/d0f18859d99ecb16f4c5d641b35a5f3bdb7b4f36/toolkit/mozapps/update/UpdateService.sys.mjs#904).
The actual candidate archive's `modules/UpdateService.sys.mjs` was also
extracted and inspected: `getReadyUpdateDir` and `getDownloadingUpdateDir`
call that helper under `UpdRootD`; it creates the directory using
`FileUtils.PERMS_DIRECTORY`. `UpdateService.#asyncInit` obtains the ready
directory before reading update status. These paths can create directory state
without proving a completed update download. Source correspondence is not a
captured writer stack; no download or causal performance assertion follows.

The test-only alternate update path is gated by `Cu.isInAutomation`. It is not
a suitable silent relocation mechanism for this non-automation harness. No
automation flag, global update preference or native directory-provider change
was added. Searchfox advertised a CLI update; no tool installation occurred.

## Cleanup And Evidence

The capture records clean owned SIGTERM cleanup and exact browser-root absence.
At `03:30:39.697Z`, a separate read-only check verified absence of both browser
and controller. A later independent check verified all 11 sampled browser PIDs
plus the controller absent and rechecked all 17 harness hashes. This does not
exclude unsampled transient helpers.

Only 35 top-level controller/run exports, 114276 bytes, were copied locally:

`/home/wyatt/.cache/codex/quicksuggest-startup-evidence-20261003-NUsAON/`

Every copied export matches the remote per-file SHA256 and size manifest.
Profile/application-data directories, discovery credentials and crash queues
were not copied or inspected. Original remote data remains preserved.
Local summaries, transfer logs, manifests and source evidence are under
`artifacts/umbralink-control/quicksuggest-startup-runtime/`.

The existing preparation, sustained, startup-source, regional-candidate and
installation-policy seals still verify. No source or staged-index changes were
needed for this pilot. All runtime, transfer and audit commands have exited.

## Next Decision

Hold further browser runs while reviewing a prospective policy for these exact
empty update directories. Any revision must preserve original code bytes and
identities, reject arbitrary files/directories/downloads, retain this failure,
and be tested before another launch. Disabling the updater, deleting evidence,
relaxing the general manifest or increasing resource caps is not the next step.

After that gate, a matched baseline/candidate startup comparison remains
necessary. Visible hardware-accelerated playback still needs the pending headed
window permission and cannot be inferred from this headless startup result.
