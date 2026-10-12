# Controlled Request Latency

Follow-up to the October3 paired request-start observations. Same sealed native
diagnostic copies and module payloads; no browser-source change, build, installation
or owner-browser action. Use the existing isolated headless laptop route only.

## Fixed Protocol

The owned loopback server uses the identical155-byte page and response headers,
but waits until its monotonic receipt timestamp plus20ms before sending each valid
response. Early timer wakes rewait; repeated wakes, invalid clocks, aborts and
disconnects cannot release early or write late. Each accepted record stores receipt,
release and finish timestamps in the server clock, never joined to page timestamps.
Successful runs require every hold>=20ms and<=250ms,32request/4pending/8connection
caps,13finished GETs, zero pending at capture and bounded close. Preserve failures.

Use the unchanged six-request collector, alternating idle/100msbusy, both before
and after explicit observer installation in each fresh process. Two traced routing
controls (baseline, candidate), followed by eight unwrapped processes ABBA/BAAB.
Traced populations remain0/6baseline and0/0candidate; unwrapped counts stay unknown.
Same private-root/native identity,120s envelope,10s startup quiet, resource and
owned cleanup gates. Full46-file artifact proofs and seven module payload hashes
are checked around every run. Never overlap browsers.

## Interpretation

Do not change the previous response-progress predicate: responseStart must exceed
requestStart and precede busyEnd by at least10ms. Every pre-observer busy request
must satisfy it before that process has a complete control. Failure is inconclusive,
not proof for or against the hypothesis. Keep all outcomes, no result-based retries.

Report per-process medians and four reversed-order pairs, including before/after
request-start, response-start and fetch-completion intervals. Keep server hold
distributions separate from page clocks. A candidate overlap result and baseline
loss of overlap can explain only this artificial busy/20ms-response workload.
The test cannot establish packet-level transfer timing, general throughput,
YouTube/uBlock causality, or graphics performance. Do not pool it with the prior
zero-hold wave. Installation and headed-window consent remain separate.

Tests first: deadline/early-wake/clock/abort; exact fixture body/headers; disconnect
and close with pending responses; malformed method/route and request/concurrency
caps. Reuse prior collector/actor and analysis contracts; independently validate
saved timing and hold records and attempt malformed-evidence falsifiers.

## Execution Checkpoint

All ten isolated runs completed on October 3, 22:44-22:51 UTC. All four unwrapped
process-pair controls passed: baseline responses waited for the busy task;
candidate responses began during it. Paired after-phase fetch medians improved
by 22-24 ms in this workload. Final supplied-data audit and 29 focused tests pass;
all 20 browser/controller roots were independently absent. See
`bot-docs/reports/performance/2026-10-03-request-latency-measurement.md` for exact
observations, provenance, limits and the next gate. Older seals and reports remain
unchanged. This checkpoint is not installation or real-video acceptance.
