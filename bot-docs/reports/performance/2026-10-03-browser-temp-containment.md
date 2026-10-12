# Private Browser Temporary Directories

The performance tooling now creates a fresh private temporary directory under
each owned output root and forces the child browser's `TMPDIR`, `TMP` and `TEMP`
to that directory. Readback and composed workload captures additionally require
both `PathUtils.tempDir` and directory-service `TmpD` to match it before starting
measurements. This closes a tooling gap found during the attachment ZIP audit;
it is not an engine optimization or a measured video improvement.

The final Node regression suite passed 443 tests. Scoped lint and formatting
checks pass. No browser, native binary, profiler, remote host, build or installer
was run for this change. The working browser, profile, launcher, preferences,
extensions and staged index were not changed. Browser-runtime and headed-window
holds remain in effect until the separate native receipt and headroom gates.

## Implementation

`applicationDataPaths()` in `tools/umbrafox/performance/helpers.mjs` adds the fixed
`temp` child beside `app-data` and `local-app-data`. `browserEnvironment()`
requires all three exact canonical paths, strips ambient temporary-directory
overrides and forces all three temp environment variables. The parent environment
is not modified; `HOME` and the existing environment allowlist are unchanged.

`createApplicationData()` and `verifyApplicationData()` in `run.mjs` apply their
existing checks to the new child: exclusive creation, mode 0700, current owner,
non-symlink directory, canonical path, emptiness and distinct device/inode.
The original output-root and child identities are retained, recorded in
provenance and compared before browser launch. A missing, replaced, populated,
aliased or unreadable temp directory fails admission. There is no fallback,
repair, deletion or recreation of existing directories. The output root itself
may contain evidence; only the three private child directories must be empty.

The existing private-directory RPC in `tests/readback/capture.mjs` is extracted
into `readNativeDirectories()`. It first checks the expected path configuration,
then reads app-data, local-app-data, both temp values, parent PID and build ID
through the existing privileged UmbraLink command. The raw reply is saved before
validation. Missing or mismatched values reject. Existing PID, adjacent build-ID,
deadline and cleanup checks remain; no extra browser RPC is added. Its callers
include the readback, mutation and startup-comparison capture workflows.

The generic performance runner and control parity launcher also inherit private
temp creation and environment construction. They do not gain a native temp RPC
from this change. Only the readback/composed-capture path has the new native
temp receipt gate. No claim of native verification for every suite is made.

The resource monitor already traverses output descendants. A new supplied-data
test proves that a temporary ZIP and its staging file are summed with profile
bytes and directory metadata: the exact 256 MiB boundary passes, one byte above
fails. No artifact cap, traversal limit, sampling cadence or deadline changed.
The pre-existing explicit profiling allowance is unchanged too.

## Verification

Evidence is under `artifacts/umbralink-control/browser-temp-containment/`.
The six edited files have before snapshots and an implementation-only diff;
this matters because the surrounding checkout contains substantial older work.

- `baseline.log`: 65 tests passed before the new assertions.
- `red.log`: 56 passed, 10 failed before implementation. This includes concrete
  missing-temp environment, creation, identity and provenance failures, and a
  missing helper export; the latter is scaffolding, not a browser defect proof.
- `green-1.log`: initial implementation passed 66 tests.
- `negative-red.log`: 67 passed, one failed. Malformed expected directories could
  start an RPC before rejection; the final helper validates them first.
- `green-2.log`: 131 focused tests passed, including artifact accounting.
- `full-tests.log`: 443 passed before lint-driven test-name corrections.
- `full-final.log`: 443 passed, zero failures, about 16.1 seconds on final code.
- `lint.log`: five test-variable shadowing errors, retained; `lint-final.log`
  reports zero errors, warnings or fixes after correction.
- `format-final.log`: exact six-file Prettier check passed.

Tests cover every supported suite/profile environment combination, hostile
ambient values, invalid or missing paths, exclusive creation and partial failure,
owner/mode/type/alias errors, immutable identity checks, post-creation mutation,
read failure and cancellation, provenance write failure, native receipt shape and
value errors, raw rejection preservation, RPC/write/budget failures and cap edges.
A harmless owned Node child confirms `os.tmpdir()`, `TMP` and `TEMP` receive the
expected values. The receipt body is executed against supplied VM services;
that is not a browser-provider test. The broader suite uses owned filesystem
fixtures, harmless Node children and loopback servers, not Firefox processes.

The final regression command, bounded to 60 seconds, was:

```sh
timeout 60 node --test --unhandled-rejections=strict \
  tools/umbrafox/performance/test/*-spec.mjs \
  tools/umbrafox/tests/control/*-spec.mjs \
  tools/umbrafox/tests/userland/*-spec.mjs \
  tools/umbrafox/tests/readback/test/*-spec.mjs \
  tools/umbrafox/tests/mutations/test/*-spec.mjs
```

The previous 63-file native-cleanup seal and 64-file footprint seal still pass.
The 141-file startup-pair seal has exactly three intentional current-source
mismatches: `helpers.mjs`, `run.mjs` and readback `capture.mjs`. Their matching
historical bytes are retained in this change's before snapshots. All remaining
startup-pair entries are unchanged; old reports, captures and manifests were not
rewritten. The staged index remains SHA256
`3b78253cf775a4a1e8c69a4b82cc3958b366056129a391f4ae362bdfe8e4e0c4`.

## Limits And Next Measurement

These are point-in-time filesystem checks, not a race-free sandbox. Environment
variables do not establish that every native dependency honors them or that no
hard-coded external path is used. Resource monitoring remains sampled; short-lived
files and processes can fall between samples. No global temp directory, shared
crash queue or personal data was inspected or cleaned.

The browser's native temp receipt has not yet been obtained. The earlier
xpcshell unit-test receipt uses a different provider and cannot substitute for
it. Missing `PathUtils` or a different native temp path will fail the new gate,
not silently continue. This is post-startup admission, not proof that no earlier
consumer accessed another path or made a network request.

The mandatory modification rules remain satisfied at this tooling boundary:
no product defaults, web APIs, page-visible markers, request substitution,
network policy or rendering algorithms are changed. The existing owner-local
privileged command is used without changing its interface.

Next, separately admit a short disposable-browser native-path check and review
the startup measurement's headroom before any repeat. The prior baseline had
only 1.0035 MiB sampled headroom under its cap. Counting temp files may expose
more usage, not less. Do not raise the cap, erase caches or disable security
updates to make it pass. Compare the attachment-cleanup candidate separately
from the Suggest change, with identical native/runtime inputs and a fixed early
startup window. Playback/GPU comparisons remain separate and require the
appropriate visible-window permission and matching backend evidence.
