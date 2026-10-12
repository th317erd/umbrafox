# QuickSuggest Startup And Disposable Profile Footprint

## Result

The packaged browser retains Firefox's regional QuickSuggest activation.
False declarations in `firefox.js` do not mean the feature stays disabled.
This is intentional upstream behavior, not proof that Firefox ignores a user
opt-out. Umbrafox hides the corresponding Settings controls but retains the
regional startup path. This is a concrete product/defaults optimization lead,
not an established cause of video stutter or a measured performance improvement.

No production source, installed browser, personal profile, native binary,
browser preference, or existing measurement artifact changed in this audit.
No browser, server, profiler, or native test was launched. New work consists of
packaged-source extracts, an offline JS replay, tests, and this report.

## Saved Runtime Observation

`artifacts/umbralink-control/sustained-footprint.json` records a metadata-only
walk of the already-terminated disposable laptop run. File contents were not
read and symlinks were not followed. Browser/controller roots were absent.

At the post-exit observation, total size was 250,921,974 bytes:

| Group | Bytes |
| --- | ---: |
| `profile/remote-settings` | 77,962,256 |
| `profile/suggest.sqlite` | 35,618,816 |
| `profile/cache2` | 44,177,741 |
| `profile/security_state` | 23,643,586 |
| `profile/storage` | 23,141,528 |
| `profile/startupCache` | 19,792,247 |

Large files include QuickSuggest AMP and other-collection SQLite databases and
WALs. Their names, sizes and timestamps are observations, not payload, network,
CPU, or write-stack attribution. Several Suggest timestamps precede playback
sampling. The earlier live peak remains 265,713,225 bytes; the later smaller
total does not clear its tight 2,722,231-byte headroom under the 256 MiB cap.

The original sustained test remains an outer-driver failure because an extra
installation `.parentlock` appeared. Its inner playback completed with zero
reported dropped frames. Neither fact is revised by this audit.

## Packaged Source Chain

The inspected package is
`exports/umbrafox-mutation-inline-candidate-20261003/umbrafox`.
Its two jars match the recorded native comparison pair. Exact extracts and
hashes are retained under `artifacts/umbralink-control/quicksuggest-startup/`.

1. Packaged `components/components.manifest` registers
   `QuickSuggest.init` in `browser-idle-startup`. `BrowserGlue` calls
   `BrowserUtils.callModulesFromCategory` with `idleDispatch: true`, which
   schedules registered listeners. No address-bar interaction is required by
   this registration. The older comment saying BrowserGlue calls `init`
   directly is imprecise; the category dispatcher is the actual route.
2. `QuickSuggest.init` waits for region, Nimbus and telemetry initialization,
   then calls `#initPrefs`. `intendedDefaultPrefs` overlays the packaged defaults
   with regional values. US/en-US and DE/de enable Suggest, all branded
   suggestions, sponsored suggestions, and their regional feature gates.
3. `#initPrefs` writes the default branch, not the user branch. Pref migrations
   are separate. `#syncNimbusVariablesToUiPrefs` is another default-branch
   producer. An active experiment is not covered by the no-experiment replay.
4. `SuggestFeature.update` gates each feature on `quickSuggestEnabled` plus
   feature-specific preferences. `SuggestBackendRust` additionally requires
   `quicksuggest.rustEnabled`; AMP requires its feature gate, `suggest.amp`,
   the all-suggestions switch, and the sponsored switch.
5. Enabling the Rust backend creates `suggest.sqlite`, adds a shutdown blocker,
   registers the ingest timer, and requests initial ingestion for enabled
   providers. Rust/native I/O is a separate layer, not executed by this replay.
6. Even a disabled Rust backend's constructor obtains
   `SharedRemoteSettingsService.rustService()` unless remote activity is skipped.
   Avoiding store creation is therefore not proof of zero initialization work.

Upstream discovery anchors (the local packaged extracts remain authoritative):

- [Startup registration](https://searchfox.org/firefox-main/rev/d0f18859d99ecb16f4c5d641b35a5f3bdb7b4f36/browser/components/BrowserComponents.manifest#205)
- [Regional defaults](https://searchfox.org/firefox-main/rev/d0f18859d99ecb16f4c5d641b35a5f3bdb7b4f36/browser/components/urlbar/QuickSuggest.sys.mjs#728)
- [Common feature gate](https://searchfox.org/firefox-main/rev/d0f18859d99ecb16f4c5d641b35a5f3bdb7b4f36/browser/components/urlbar/private/SuggestFeature.sys.mjs#127)
- [Rust store initialization](https://searchfox.org/firefox-main/rev/d0f18859d99ecb16f4c5d641b35a5f3bdb7b4f36/browser/components/urlbar/private/SuggestBackendRust.sys.mjs#563)

## Offline Verification

New scratch files:

- `artifacts/umbralink-control/quicksuggest-startup-replay.mjs`
- `artifacts/umbralink-control/quicksuggest-startup-audit.mjs`
- `artifacts/umbralink-control/test/quicksuggest-startup-spec.mjs`

Acorn parses packaged preference declarations as data. Module import/export
wrappers are removed with AST positions; class and method bodies are unchanged.
Source hashes are checked before execution. Actual `#initPrefs` is reached via
`_test_reset`, followed by the actual AMP and Rust feature updates in startup
order. Native storage, timers, service acquisition, telemetry and queues are
recording stubs. Other suggestion providers and the complete browser lifecycle
are not executed. Three Nimbus fallback mappings are simulated with no active
experiment; this is not an integration test of Nimbus or the pref service.

| Replay case | Rust store created | AMP ingest requested |
| --- | --- | --- |
| Fresh US/en-US | Yes | Yes |
| Fresh DE/de | Yes | Yes |
| Unsupported region or locale | No | No |
| Explicit main switch false | No | No |
| Explicit all-suggestions false | Yes | No |
| Explicit sponsored false | Yes | No |
| Explicit Rust switch false | No | No |

The category rows only establish AMP suppression. Other providers may still
ingest. All cases obtain the stubbed shared Remote Settings service.

Thirteen tests pass, covering source identity, safe pref parsing, supported and
unsupported regions, explicit opt-out/opt-in, migration, repeated updates,
region changes, ToU changes, and teardown. The initial missing-module failure
and two fixture-implementation failures are retained as development evidence,
not browser bug reproductions. The final cases characterize the existing code;
no production correction is claimed.

```sh
timeout 15 node --test --unhandled-rejections=strict artifacts/umbralink-control/test/quicksuggest-startup-spec.mjs
timeout 15 node --unhandled-rejections=strict artifacts/umbralink-control/quicksuggest-startup-audit.mjs
```

`final-tests.log` has 13 passes; `results.json` has eight replay cases and source
hashes. Scoped whitespace and Unicode-control lint passes. No native/browser
test, real network ingestion, GPU test, or performance A/B ran in this audit.

## Next Correction And Gates

Do not treat the main packaged false default as an unconditional opt-out:
upstream tests and feature setup deliberately depend on regional activation.
A product correction must explicitly separate automatic regional activation
from user-selected activation, preserve user values and migrations, and handle
Nimbus updates without unexpectedly restoring sponsored defaults. It must keep
the feature available for deliberate user customization. A simple early return
from `QuickSuggest.init` is insufficient because callers await `initPromise`
and the existing lifecycle supports later changes.

The promising narrow policy is to retain Umbrafox's shipped disabled defaults
unless regional activation is explicitly enabled, without disabling global
Remote Settings, Safe Browsing, certificates, codec updates, or page features.
Its implementation still needs source and test review. A separate possible
optimization is lazy shared-service acquisition for a disabled Rust backend;
its cost and configuration-lifecycle correctness remain unmeasured.

Before claiming benefit, use fresh isolated profiles with identical builds and
bounded cold/warm observations. Record effective main/category/backend prefs,
disk growth and parent-process CPU before correlating with playback. Distinguish
this internal-chrome policy change from any rendering engine optimization.
Public JavaScript, DOM, media and request semantics must remain unchanged.

Browser launches remain held until installation-write handling and disk
headroom are resolved. Visible laptop GPU-window permission is still pending.
The owner's desktop browser, profile, extensions and installation stay untouched.
