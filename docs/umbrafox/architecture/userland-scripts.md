---
title: Userland scripts architecture
status: current
doc_type: architecture
audience: [developers, security-reviewers, power-users]
last_verified: 2026-10-27
canonical: true
---

# Userland scripts architecture

> **Current documentation.** Userland is powerful and partial. The current implementation is document-focused; planned seams are not shipped capabilities.

Userland scripts are profile-local, explicitly enabled scripts that run at
document start and can intercept selected browser/page behavior. The subsystem
is intentionally dangerous, but remains inactive when no enabled scripts exist.

```text
Debugger/about page
  → profile-local script store
  → registry publication + active pref
  → JSWindowActor lookup by exact origin
  → document parser blocking
  → strict async wrapper and userland API
  → native/JS hooks for selected event families
```

## Storage and selection

`UmbrafoxUserlandScriptStore.sys.mjs` persists records in the active profile.
Scopes derive from exact origins and currently target documents. Registry
publication updates process shared data and the internal
`umbrafox.userlandScripts.active` pref so content and native hooks can remain
inert when nothing is enabled.

## Runtime

The child actor listens for document creation, requests matching enabled
scripts from the parent, and invokes the runtime. The runtime blocks parser
progress on the sequential async script run. The strict wrapper provides
lexical `window`, `document`, `globalThis`, `location`, `navigator`, `console`,
`alert`, and `userland` references without installing an Umbrafox marker on the
page global.

## Interception families

- `alert`, `prompt`, and `confirm`: cancellable, with controlled return values.
- `navigation`: cancel or rewrite selected document navigation paths.
- `script`: inspect/rewrite classic/module/eval/Function source before compilation.
- `request`: mutate selected document HTTP(S) requests, cancel explicitly, or synthesize a bounded response.
- `mutation`: observe/rewrite covered native DOM mutation paths.

Native bridges live in docshell, DOM, script loader, SpiderMonkey, security
manager, and HTTP observer paths. They must stay preference- and
observer-gated; the disabled state must behave like Firefox.

## Deliberate limitations

The implementation does not yet provide complete worker/worklet coverage,
initial top-level request interception, WebSocket/socket control, arbitrary
response streams/status/headers, request-body mutation, all module types,
history API hooks, media-stream replacement, global/startup rules, or a fully
hardened isolated world. Synthetic request responses currently use generated
`data:` redirects. These are partial contracts, not hidden finished features.

See the [userland API reference](../reference/userland-api.md) and the shipped
[user guide](../../../toolkit/components/umbrafox/docs/userland.md).
