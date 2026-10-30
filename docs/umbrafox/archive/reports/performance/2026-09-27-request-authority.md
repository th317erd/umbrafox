# Request fast-path authority audit

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

Status: source-confirmed constraints, runtime cost unmeasured. Catalog PERF-005.
No request behavior, public API, registry or controller implementation changed.

## Finding

The parent cannot currently prove that a request has no handler before sending
the child query. `null` is not that proof: the child returns it for no controller,
no request handlers, and handlers that ran with side effects but requested no
mutation. Caching the last null response could therefore skip real work.

The active preference and registry are also insufficient. The process-global
HTTP observer remains installed after activation. Publishing an empty registry
does not revoke capabilities held by a live page. Synchronous `on`/`off` calls
can happen later through retained callbacks, and do not publish authoritative
parent state. An asynchronous handler count alone would not establish ordering
against every network request path.

## Producer and consumer map

| Stage | Source behavior | Boundary |
| --- | --- | --- |
| Registry startup | BrowserGlue starts async load/publication without awaiting completion | Absent shared data is not initialized-empty proof |
| Document matching | Parent filters enabled records by document origin and target kind | No retained exact-document negative certificate |
| Capability creation | Nonempty matches create a controller/private API; scripts are awaited | Startup completion does not revoke later registration |
| Parent observer | Selects current WindowGlobal actor, suspends, serializes request fields and queries | May pay IPC/serialization before absence is known |
| Child dispatch | Numeric browsing-context key selects a weak controller | No exact-document comparison in this map lookup |
| Decision | Handler effects run; mutation decision or null is returned | Null conflates several outcomes |
| Completion | Normal path resumes; cancel/synthetic paths resume inside decision application | Preserve this observer's suspension balance and redirects |

This map comes from `UmbrafoxUserlandParent.sys.mjs`,
`UmbrafoxUserlandChild.sys.mjs`, `UmbrafoxUserlandEventController.sys.mjs`,
the registry/runtime/runner modules, BrowserGlue and the DevTools publisher.
The four primary files were clean against `892431809a4c`; dirty renderer and
tested binary identities are separate.

## Risks and next measurement

Browsing-context identity is not document identity. The weak map may select a
retained old controller while a newer WindowGlobal occupies the context. This
is a source-derived race hypothesis, not a reproduced defect. Request inner
window IDs can be zero; different load-info context IDs represent different
roles. Do not share negatives by resource URL, origin or private/container/frame
boundary. Earlier requests and late registration need explicit sequence tests.

First propose a bounded private diagnostic distinguishing no-controller,
controller-without-handlers, handlers-ran-without-mutation, changed decision and
error. Correlate this observer's suspend/query/reply/resume stamps, pending peak,
and request/actor/controller identity classes without URLs, headers, bodies or
script text. No such instrumentation was added. It requires release-exclusion,
bounded-loss, lifecycle and observer-cost gates.

Use the existing request-event browser test and owned loopback fixtures. Include
serial/parallel fetches after matching no-op activation, unrelated documents,
side-effect-only handlers, removal/re-addition, registry disable with live
capabilities, retained old documents, frames/private contexts, redirects,
cancellation and actor loss. Require exact responses and completion accounting.
A fake actor test cannot prove cross-process ordering.

Only then consider an exact-document, never-capable empty-match shortcut. It
requires initialized registry authority, matching live request/document
identity, absence of capability through every runtime entry point, and isolation
from stale controllers. Unknowns retain the current path. Matching-no-handler
and off-after-on are not covered. No one-flag optimization or performance gain
is justified by this audit.

Detailed source hashes, primary-source permalinks and negative-test matrix:
`~/.cache/codex/umbra-perf-20260927/request-fastpath-design.md`, SHA256
`4e9984a8897f330b0a1ad87301933a99c2e9a9d255985df81ca19baab30f1871`.
