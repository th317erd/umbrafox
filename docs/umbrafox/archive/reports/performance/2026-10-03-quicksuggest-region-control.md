# QuickSuggest Regional Default Control

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Status

Implemented an uninstalled frontend candidate. No native build, browser,
xpcshell process, profiler, server, remote-host command, or personal-profile
inspection ran in this step. The owner's installed browser remains unchanged.
The broad performance objective remains active. No playback improvement or
stutter attribution is established by this change.

This follows [the packaged startup audit](2026-10-03-quicksuggest-startup.md).
That audit showed that regional initialization can enable internal Suggest
features despite Umbrafox's shipped false defaults. This is deliberate Firefox
behavior, not evidence of an ignored explicit user opt-out.

## Change

The private preference `browser.urlbar.quicksuggest.regionDefaults.enabled`
defaults to false in `browser/app/profile/firefox.js`, with the same fallback
registered in `UrlbarPrefs.sys.mjs` for caching and change notifications.

`QuickSuggest.intendedDefaultPrefs` now returns a copy of the original shipped
defaults while that control is false. Setting it true retains the complete
existing regional algorithm. `QuickSuggest.onPrefChanged` recalculates default
preferences and updates all features when the control changes.

The normal `init` path, dependency waits, initialization promise, preference
migrations, feature construction, and Nimbus handling remain in place. There
is no early return from initialization. Restoring the disabled defaults uses
the existing backend teardown path, including timer and shutdown-blocker
removal. Explicit user-branch preferences are not replaced by this patch;
existing migration rules still apply.

This is a regional-default control, not a mandatory feature or experiment lock:

- Explicit main enablement still works. With regional defaults off, individual
  suggestion categories and feature gates may also need explicit enabling.
- Setting the new control true restores the prior regional bundle of defaults.
- Explicit main disablement and category opt-outs retain their existing role.
- An explicitly active Nimbus experiment can still override its existing
  variables. The new preference is not added to a Nimbus feature definition.
- The Rust backend constructor still obtains the shared Remote Settings service.
  No store/ingest in the replay does not imply zero startup work or network I/O.
- Already-existing Suggest data is not deleted, vacuumed, or migrated away.

Test-only profiles `unittest-features` and `xpcshell` opt into the old regional
behavior, preserving feature coverage across its many callers. The dedicated
new regression test overrides this to false in its manifest. `profiles.json`
shows that the former is also inherited by several other test harnesses and
PGO training; it is not a product profile. Talos and Raptor do not inherit
either override and keep product behavior. No performance profile was changed.

## Verification

New source-based test fixture:

- `artifacts/umbralink-control/quicksuggest-region-replay.mjs`
- `artifacts/umbralink-control/test/quicksuggest-region-spec.mjs`
- `artifacts/umbralink-control/quicksuggest-region/audit.mjs`

The separate fixture derives from the sealed prior audit without modifying it.
It executes the current full QuickSuggest JS initialization and the original
AMP/Rust JS classes. Native storage, preference notifications, Nimbus, timers,
and telemetry use test doubles; other Suggest feature classes are inert. The
actual UrlbarPrefs registration is parsed, not executed as a real pref service.
This is not browser or native integration evidence.

The pre-change gate had 11 passes and 10 expected failures, including supported
regional activation, ineffective live control, and absent pref registration.
After the patch, all 21 initial tests passed. Two additional queue/idempotence
tests plus the original 13-test audit give **36 passes** in the final combined
run. Coverage includes:

- Fresh supported and unsupported regions/locales, without store or ingest.
- Concurrent/repeated `init` and resolution of `initPromise` while disabled.
- Explicit regional opt-in matching the previous algorithm's defaults and
  AMP/backend activation for the six tested region/locale combinations.
- Live on/off/re-enable, timer/blocker teardown, and independent return objects.
- Clearing the opt-in before queued ingestion starts, and repeated recalculation.
- Main/category/backend opt-outs, explicit feature opt-in, migration, and
  test-supplied default overrides.
- Region and ToU changes; existing Nimbus override/removal behavior and a
  sponsored user opt-out under an experiment.
- Test-profile opt-ins and absence of these overrides in Talos/Raptor chains.

Six saved replay rows in `quicksuggest-region/results.json` retain source hashes,
effective/default preferences and recorded service events. US and DE defaults
do not create the mocked store; explicit regional opt-in does. This is not a
CPU, disk, download, or rendering benchmark. The audit also verifies that the
three unchanged private modules match the actual checkout, and that the product
pref file differs from its captured baseline only by the new declaration and
its comment.

The new native regression is
`browser/components/urlbar/tests/quicksuggest/unit/test_quicksuggest_regionDefaults.js`.
It covers real preference registration, initialization, live changes, explicit
choices, and region/locale changes using the existing local-server test helper.
It is registered and linted but **has not been executed** under the runtime hold.
The wider Suggest test suite likewise remains a required integration gate.

Scoped ESLint has zero errors and one unchanged deprecation warning on the
existing `Preferences.sys.mjs` import. Running ESLint against the untouched
baseline reproduces that warning. Initial manifest ordering and scratch license
issues were corrected; their logs remain. The product pref file is ignored by
ESLint's existing config, so its declaration is separately parsed and checked
by the source tests. Other scoped license, whitespace, Unicode-control and
manifest checks pass. The pre-existing staged index is unchanged; no files were
staged or committed. Prior 26-file startup and 152-file sustained seals verify.

Reproduction, from the repository root:

```sh
timeout 15 node --test --unhandled-rejections=strict artifacts/umbralink-control/test/quicksuggest-region-spec.mjs artifacts/umbralink-control/test/quicksuggest-startup-spec.mjs
timeout 15 node --unhandled-rejections=strict artifacts/umbralink-control/quicksuggest-region/audit.mjs
```

Logs and results live in `artifacts/umbralink-control/quicksuggest-region/`.
The candidate freeze manifest is
`artifacts/umbralink-control/quicksuggest-region-final.sha256`.

## Detectability And Remaining Gates

This changes internal address-bar feature defaults, which the rulebook permits
under its internal-request exception. It does not change page requests, response
substitution, public JS/CSS/DOM/WebIDL, UA, codecs, canvas behavior, security
updates, or shared Remote Settings configuration. No name or marker is exposed
to page content. No new private-browsing, container, or origin-specific branch
is introduced. This source review is not a universal runtime parity claim.

Before installation or a claimed performance benefit:

1. Run the new native test and relevant existing Suggest/default/migration/
   Nimbus tests against the integrated frontend, plus browser feature coverage.
2. Resolve the preserved unexpected installation `.parentlock` and the prior
   sustained test's tight disk allowance without deleting evidence, broad cache
   suppression, or silently weakening its admission contract.
3. Use fresh isolated, provenance-matched before/after packages/profiles for
   bounded cold/warm observations. Record effective preferences, parent CPU,
   disk growth, and playback separately. Do not treat a test-profile opt-in as
   a measurement of the disabled product default.
4. Perform visible hardware-accelerated playback only after the still-pending
   laptop window consent. Headless playback does not establish GPU/scanout
   smoothness, and the owner's desktop browser remains protected.
