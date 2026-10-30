---
title: UmbraLink protocol reference
status: current
doc_type: protocol-reference
audience: [developers, operators, bots]
last_verified: 2026-10-27
canonical: true
---

# UmbraLink protocol reference

> **Current documentation.** Verified against `UmbrafoxControlService`, browser/script/input modules, diagnostics, and the UmbraLink skill on 2026-10-27.

## Discovery and transport

Read `<active-profile>/umbrafox/control.json` and connect to `websocketUrl`.
The discovery file contains `host`, `port`, `path`, `token`, and
`websocketUrl`; it is mode `0600`. The service binds to `localhost`, uses path
`/umbrafox-control`, and authenticates the WebSocket upgrade with the per-run
query token.

Commands and responses are JSON:

```json
{"id":1,"method":"umbrafox.status","params":{}}
{"id":1,"result":{"channel":"umbrafox-control"}}
{"id":1,"error":{"code":"invalid argument","message":"..."}}
```

## Commands

| Method | Purpose and main parameters |
| --- | --- |
| `umbrafox.status` | Service/app/build metadata. |
| `umbrafox.diagnostics.snapshot` | Process, profile, memory, diagnostics, windows, tabs, contexts. |
| `umbrafox.diagnostics.dumpMemoryReport` | Bounded filename, anonymize/minimize options; writes under profile diagnostics. |
| `umbrafox.gfx.snapshot` | Graphics adapter, feature, failure, compositor, frame-rate and codec state. |
| `umbrafox.media.snapshot` | Optional context/empty-frame filter; media elements, devices, codecs, decoder processes. |
| `umbrafox.performance.snapshot` | Optional thread/window detail; process tree, CPU/memory, profiler state. |
| `umbrafox.performance.profile.dump` | Dump an already-active profiler capture with optional filename/sinceTime. |
| `umbrafox.browsingContext.create` | Parent tab `context`; optional `background` (default true). |
| `umbrafox.browsingContext.close` | Tab context; refuses the final tab. |
| `umbrafox.browsingContext.navigate` | Context, absolute URL, `wait`, timeout; allows http/https/about/file/data. |
| `umbrafox.script.execute` | Context, async-function body, page/browser realm, bounded args/result, document identity, timeout. |
| `umbrafox.input.click` | Context and viewport coordinates/button/modifiers. |
| `umbrafox.input.pointerMove` | Context, coordinates, optional origin/steps/duration/profile/seed. |
| `umbrafox.input.pointerDown` | Context, coordinates/button/modifiers. |
| `umbrafox.input.pointerUp` | Context, coordinates/button/modifiers. |
| `umbrafox.input.wheel` | Context, coordinates, deltas, delta mode/modifiers. |
| `umbrafox.input.keyDown` | Context, key, modifiers. |
| `umbrafox.input.keyUp` | Context, key, modifiers. |
| `umbrafox.input.type` | Context and text. |

## Bounds and errors

Script bodies are at most 65,536 characters; timeouts are 1–60,000 ms. Results
are JSON-like, at most 10,000 nodes, depth 32, and 1 MiB encoded, with no cycles,
accessors, class instances, or unsupported values. One operation may be pending
per context and 16 globally. Errors include `invalid argument`, `no such frame`,
`stale document`, `busy`, `aborted`, `timeout`, `serialization error`,
`javascript error`, `navigation error`, `unknown command`, and surfaced Gecko
exceptions.

## Operational cautions

Acquire context/document identities from a fresh snapshot after navigation.
Page sandboxes die when a command returns; create durable objects in the page
realm. Select and visibly expose a tab before measuring rAF/paint/input timing.
Restore the owner's selected tab and close temporary tabs when finished.
