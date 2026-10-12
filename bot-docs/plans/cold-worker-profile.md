# Cold Readback Worker Coverage

Prospective continuation of cold-copy-profile, under standing disposable headed
wyatt-laptop permission. Previous turn made evidence progress: same-clock IPC
localization but missing MediaSupervisor and an invalid cross-clock validator.
Do not edit or relabel its sealed code/captures. No engine/build/install/desktop
action. Firefox public behavior and timer protection remain unchanged.

Reuse the exact serialized cold collector. New validator calls V3 moving-data
validation; requires six exact trace names, finite nonnegative Performance start
and duration, ordered nonoverlapping traces with equal coarse endpoints allowed,
and draw duration contained in the same-clock mark duration. Never order the
reduced Performance clock against the differently reduced callback clock.
New controller/driver siblings add MediaSupervisor to existing thread filters;
RPC ordering, raw-before-validation, private roots and cleanup stay unchanged.

Tests first: real prior candidate clock counterexample, equal adjacent endpoints,
negative/NaN/missing/extra/reordered/overlapping traces, same exact collector source,
all controller RPC/save/preserve/abort failures and missing worker filter. Format
scoped files. No changes to previous seals/index or any native source.

Runtime gate: one fresh baseline, preserve/export/hash and clean owned processes.
Analyze only via named profiler-cli with explicit loopback offline symbol server;
require the actual IPC receiver threadId in sampled MediaSupervisor inventory and
samples within the first same-document UserTiming interval. Only then permit one
candidate. Stop on failure, no retries. Missing symbols remain unknown; named
task queues are not physical-thread evidence. No raw profile JSON parser.

Same120s total/105s work/15s cleanup/final2s,10s quiet,256MiB sampled artifacts,
64MiB prospective headroom,24MiB each native dump/retained copy, no cap relaxation.
No cache deletion or browser-default changes. Only owned SIGTERM and exact
PID/socket absence. Review actual profile growth before proceeding. Preserve
failed attempts rather than normalizing them away.

Use frozen package/base+patch, not dirty tree. Analyze worker stacks to distinguish
initialization/conversion/driver wait only to the extent symbols and sampled
stacks support. These profiler-on whole-package pairs do not prove general CPU,
YouTube, scanout or first-copy speedups. Results should choose the smallest useful
next optimization or private observation, not endlessly repeat cache confirmation.

Outcome: both captures PASS, actual receiver MediaSupervisor #2 sampled36/22
times in first-copy window.54focused testsPASS; bounded cleanup and posthashes
PASS. Native symbols remain incomplete; next step is matching local symbols on
these saved profiles, not additional runtime. Full result is in
bot-docs/reports/performance/2026-10-05-cold-worker-profile.md.
