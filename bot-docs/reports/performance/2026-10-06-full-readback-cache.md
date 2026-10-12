# Exact Full-Size Readback Cache

## Status

The cache mechanism gate passes: actual isolated Gecko gtests changed from
10 pass/9 expected failures to 19 pass/0 failures, with no skipped tests.
This is not release acceptance. The broader performance goal, decoder-loss
coverage and all integrated pixel/performance gates remain open.

## Change

`GPUVideoImage::GetAsSourceSurface()` previously requested a new full-size
readback on every call. DMABuf images now retain one successful, exact-sized DATA
surface and reuse it. Other remote video types retain the old uncached path.
The existing one-MiB sized cache and its API are unchanged and independent.

Each image owns its own entry; equal descriptor handles on different image
objects cannot share data. A process-wide atomic budget limits retained pixel
storage to 16 MiB, charged by actual stride times height. This fits two tightly
packed 1080p BGRA frames; ordinary 4K BGRA exceeds the limit and remains uncached.
This is not a total process-memory bound: caller-held surfaces, simultaneous
in-flight readbacks, per-object metadata and the old sized cache are separate.

No cache lock spans readback IPC. Concurrent misses may perform duplicate reads,
but only the first valid entry publishes for an image. Failure, wrong dimensions,
non-DATA surfaces and exhausted budget keep the existing result/failure path.
The cache-owned surface reference is released on the main thread before its
budget reservation is returned, including destruction from another thread.
There is no global list of images or manager-owned cache. The latter would be
unsafe because readback surface user data already strongly retains the manager.

The basis is the existing
[immutable Image contract](https://searchfox.org/firefox-main/rev/9de2c06fb839d60a8af0319f63c46e34a28e1fc9/gfx/layers/ImageContainer.h#103)
and the inspected local full readback producer and
[surface allocator lifetime](https://searchfox.org/firefox-main/rev/9de2c06fb839d60a8af0319f63c46e34a28e1fc9/dom/media/ipc/RemoteMediaManagerChild.cpp#1076).
No pixel transformation, public JS/CSS/DOM/WebIDL API, network request shape,
timer API, preference default or site-specific rule is introduced. The change
removes redundant internal work; real integrated parity remains a required gate.

## Tests

The first native run against the unchanged production header executed 19 tests:
10 pass, 9 fail, 0 skipped, 0 errors. All nine original sized-cache regressions passed;
their bodies remain byte-for-byte unchanged. The extra passing control confirms
the non-DMABuf full-read behavior. Nine new full-cache assertions failed for the
intended missing-reuse/lifetime/budget behavior, not a harness/compile failure.

New tests cover exact 1080p bytes and one full read across nine calls; isolation
between images, repeated handles and the sized cache; failed and invalid
surfaces; shared byte-budget exhaustion and recovery; padded stride; reentry;
same-image concurrency; destruction; and queued main-thread budget retention.
The concurrency case was strengthened after RED to add eight 4 MiB images
competing for a four-image budget, without changing the 19-test inventory.
The final native suite executes all 19 cases successfully, including that
additional race and all nine unchanged original regression bodies.

An independent six-minute source review found no concrete ownership, quota or
concurrency defect. It identified an untested loss-state boundary: populated
cache hits bypass the manager's Readback/CanSend check after IPC loss. That is a
method-level behavior difference, not established evidence of a stale mapping
or web-visible regression. Actual channel teardown, retained pixel validity and
downstream browser parity remain release gates. The miss/failure tests do not
cover that boundary. The review also notes that failed main-thread proxy dispatch
follows Gecko's intentional-leak behavior and keeps the budget charged.

The follow-up source trace finds that Shmem descriptors retain a reference-counted
mapping and protocol teardown clears the protocol's own mapping references.
The readback surface user data retains both its descriptor and allocator. This
supports the lifetime design but does not prove all decoder-loss paths or their
downstream page behavior. No fault-injection or real channel teardown was run.

These are actual Gecko gtests using a fake readback manager. They do not measure
real IPC/decoder cost, prove browser pixel parity, or demonstrate a speedup.
The separate native prescale suite remains 33 pass/7 fail; this phase neither
removes that route nor relaxes those failures. Direct-GPU import stays default
OFF, and the existing filter-repeat problem remains open.

## Execution

Evidence is under `artifacts/umbralink-control/full-readback-cache/`.
The initial RED test-only build took 25.45s with zero compiler warnings. Its
library SHA256 is `160b29b5a418534187ef4fde8f8c97c24b720e9dac43c213d31f12736f3c2e3c`;
manifest SHA256 is `f9de591ab5d4a209208a3b0c9960cdf18121b1c2ae2296aaaa657acccea31b17`.
Native BuildID 20261006111504 and old loader 20261006052600 are explicitly
different; this is a diagnostic overlay, not an integrated browser package.

RED root is `full-readback-cache-red-8cb3717a-5544-4a33-9458-041b58b9f366`.
Controller 1493562, native 1493574 and log-observed helper 1493576 were independently
absent afterward. The 48-file package postcheck and four exported file hashes
pass. Exit 1 represents the nine intended test failures; owned cleanup is clean.

Changing the image header caused broad dependency recompilation. The initial
two-job idle 900s build expired while compiling dependencies; process group 1809445
was confirmed absent before a bounded 2400s incremental continuation. Preserve
that timeout and emitted dependency warnings; do not call it a one-shot clean
build. The continuation completed successfully in 1290.88 seconds and reported
zero compiler warnings for that invocation. No incomplete library was launched.
The completed exec handle was no longer available after context recovery; the
terminal build log reports success, compiler processes were absent, and the
resulting library passed the ELF BuildID check and actual native execution.

GREEN uses a separate stripped library, 358460616 bytes, SHA256
`2c0f59813ff36ddda3b529d1947e0a73f0ed944ae62e2c48a85a0f3fca837f17`.
Its manifest SHA256 is
`1932fe6feb542bcf8079ad3c3c37177024a488927670959b5516078b33ac4788`.
The same native/loader BuildID distinction applies. The other 47 package files
are identical to RED. All 54 recorded source inputs match the green manifest;
only the two owned source files differ from the preceding phase.

GREEN root is `full-readback-cache-green-a8cd6ea2-f8b8-4b3f-a617-801a1a01f180`.
Its test result reports 19 pass, zero failures/errors/disabled/skipped, 0.089s
test-suite time, and native exit 0. That test duration is not a performance
measurement. Controller 1509630, native 1509642 and log-observed helper 1509644
were independently absent afterward. The 48-file package postcheck passes;
four exported evidence files match independently calculated remote hashes.
The 4056-byte log retains the user-namespace EPERM warning and headless test
mode announcement; this is not an accelerated browser presentation test.

Five offline evidence checks pass: complete RED/GREEN inventories and cleanup,
package identity joins, unchanged controls, corrupt-result rejection and exact
runner transformation preserving the original ownership/deadline implementation.
Scoped final native lint reports zero errors/warnings/fixes. Prior sealed
operation-order evidence remains unchanged.

Operational errors retained: retired `mach clang-format` was replaced with the
supported `mach format`; an SSH inline-JS quoting error was corrected by an
explicit stdin script, without rerunning native tests. An evidence equivalence
check found one extra terminal newline in the copied runner; its exact approved
transformation now includes that newline, with lifecycle logic unchanged.

No desktop browser, profile, launcher, installation, Pi, default, Git index,
commit or push changed. The next dependency is a verified exact full-size canvas
fallback combined with direct-GPU import, followed by the retained native and
real-video pixel gates and paired performance against the actual daily build.
