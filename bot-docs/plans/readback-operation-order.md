# Readback Operation-Order Isolation

## Scope And Evidence

The residual native run executed40 tests,33pass/7fail, with all prior32 passing.
Keep that sealed failure evidence and its exact equality predicates. Only the
existing TestDMABufReadback fixture may change in this step; no production,
default, IPC, public API, installed browser, desktop profile or Pi changes.

The two producers differ in operation order. ReadIntoBuffer(true) converts YUV
to full-size RGB8, samples it linearly into another RGB8 buffer, then returns
CPU bytes. DrawTargetWebgl samples its uploaded full-size RGB8 surface and
applies global alpha before writing the final target. DrawTargetSkia is another
consumer with its own sampling. The sized-image cache and remote size-only API
do not carry backend/alpha/composition state. They cannot be assumed to make
these operations interchangeable.

## Counterfactuals

For each of the eight retained new cases, preserve the original candidate and
reference comparison. Additionally draw the full-size reference opaquely, then
apply alpha in a second identity-sized draw. Compare this staged reference both
to the original reference and to the candidate. This tests whether an additional
8-bit intermediate alone reproduces the alpha difference.

Also draw the full-size reference using OP_SOURCE at alpha1 and compare its
bytes to the raw sized readback. DrawTargetWebgl's source operation disables
the antialiasing extrusion in its image shader; ordinary over uses it. This
control can distinguish geometry/shader differences from alpha without changing
the production draw. The blend and antialiasing change are coupled in this
control, so a positive result does not alone identify one shader instruction.

Record exact differing component counts and maximum deltas. Do not introduce a
tolerance, assert that unexplained failures are acceptable, or discard a case.
Existing40-test inventory stays unchanged. Source search, not test resemblance,
must establish any proposed production correction. Backend/driver breadth,
actual video decode/import and separate filter-repeat behavior remain outside
this native test's proof.

## Execution

Preserve source54/HEAD/index/working/config inputs in new
artifacts/umbralink-control/readback-order-isolation/. Add only counterfactual
observations to the native fixture and build recurse_gtest, idle/two jobs,
timeout900s. Strip a separate copy with configured --strip-debug. Fresh laptop
cache roots and the frozen native runner preserve30swork/45stotal, private
application data, exact48-file package admission and bounded owned cleanup.
Reuse the older pinned native loader explicitly, not as an integrated browser.
One native run is planned after manifest/dependency/inventory checks and memory,
disk and no-browser/compiler admission. Retain all failures and explicit PID
absence checks; no blind rerun. Offline checks30s, formatting/lint60s.

The most important test is whether the staged full-size reference exactly
reproduces the candidate's half-alpha result while the one-stage reference
differs. False confidence is prevented by retaining opaque, odd-size, software,
small-size, failure/state and importer controls. A passing mechanism comparison
does not make the original failing correctness test pass. Finish with a source
map and result report that selects the next correction from observed evidence;
do not replace the broad performance goal with merely getting this suite green.
