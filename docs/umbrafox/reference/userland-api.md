---
title: Userland scripts API reference
status: current
doc_type: api-reference
audience: [power-users, developers, security-reviewers]
last_verified: 2026-10-27
canonical: true
---

# Userland scripts API reference

> **Current documentation.** This compact reference complements the detailed shipped user guide and source.

Enabled scripts run sequentially in a strict async wrapper with a context that
provides `window`, `document`, `globalThis`, `location`, `navigator`, `console`,
lexical `alert`, and `userland`. Scripts are selected by exact origin and
currently target documents.

## Event registration

Use `userland.on(type, handler)` for the implemented event families:

| Type | Implemented control |
| --- | --- |
| `alert` | Cancel/suppress an alert. |
| `prompt` | Cancel and provide a prompt result. |
| `confirm` | Cancel and provide a boolean result. |
| `navigation` | Cancel or rewrite covered navigation destinations. |
| `script` | Rewrite covered DOM/eval/Function source before compilation. |
| `request` | Change selected URL/method/headers, cancel, or `respondWith` a bounded synthetic value. |
| `mutation` | Observe or rewrite covered native DOM mutations. |

Event shapes and helper methods are defined by
`UmbrafoxUserlandEventController.sys.mjs`; use the
[shipped user guide](../../../toolkit/components/umbrafox/docs/userland.md) for
examples and exact fields.

## Safety and parity

Scripts are user configuration and can break websites, security assumptions,
privacy, or Firefox parity. Disabled userland must be inert. Do not expose
Umbrafox markers on page globals, and do not describe unsupported workers,
streams, sockets, history, or response control as implemented.
