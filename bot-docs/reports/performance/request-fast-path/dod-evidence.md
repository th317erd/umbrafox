# Request Fast-Path Evidence

This is an incremental evidence ledger, not completion of the performance goal.

| Requirement | Status | Evidence |
| --- | --- | --- |
| Reproduce unnecessary busy-thread coupling | Observed pilot only | ../2026-10-03-request-busy-pilot.md; fixed-order instrumented laptop run |
| Exact-document controller lookup | Verified scoped prerequisite | ../2026-10-03-request-document-identity.md; historical396Node/71Gecko gate |
| Parent acknowledgement before native controller/API | Verified scoped prerequisite | ../2026-10-03-request-capability.md; retained in432Node/218Gecko gate |
| Late navigation and acknowledgement identity | Pure integrated + native constructor verified | capability-spec.mjs and browser_userland_events.js; old already-admitted document race RED retained |
| Failed observer-registration retry | Pure verified | request-capability-observer-red.log then current green suite |
| Authority survives relevant native lifecycle | Native scoped verification | Actor unregister/re-register, same-WGP BFCache restoration with persisted pageshow, cross-origin navigation/frame and late registration pass; not all process-crash/recovery paths |
| Registry-backed synchronous negative check | Implemented and verified | Indexed at publication; failure, malformed scope and nested flush mismatch RED/green tests; exact native identities required |
| Real negative requests avoid suspension/query | Functional verification, no timing claim | Actual native classifier and zero-query HTTP checks; supplied-channel tests prove no suspend/header operations; unchanged dispatch source regions |
| Preserved real matching handlers | Native scoped verification | Same-document publication/late on/off, restored documents, iframe/private/container cases and existing header/redirect/cancel/synthetic-response tests pass |
| Controlled request-start effect | Observed scoped effect | ../2026-10-03-request-paired-measurement.md; eight unwrapped processes, ABBA/BAAB; busy request-start medians101-102ms baseline versus1-2ms candidate; response-progress control incomplete, not generalized/end-to-end speedup |
| Owner browser remains protected | Preserved | No owner-browser action, build/package/install in these phases |
| Rendering/layout/CSS/JS/hardware ambition | Active, not complete | Performance program and separate hardware/readback branches remain |

Final phase2 source/log seal:
`artifacts/umbralink-control/request-fastpath-final.sha256`.
Report: ../2026-10-03-request-fast-path.md. Previous capability seal/archive remain
historical. Current combined gate432Node/218Gecko, six-file lint0. No package/install
or performance acceptance follows from this functional checkpoint.

Phase3 diagnostic pair and270direct evidence files are now sealed separately by
`request-paired-final.sha256`. Native bytes are identical; exactly3module payloads
differ. Two traced controls prove0/6baseline versus0/0candidate query populations.
All10runs have clean owned cleanup and exact native-root receipts. Response timing
quantization leaves the strict overlap control inconclusive; a common bounded
server delay is the next falsifier. No install or owner-browser action occurred.
