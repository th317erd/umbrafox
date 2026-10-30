---
title: Umbrafox system and fork model
status: current
doc_type: architecture
audience: [developers, maintainers, reviewers]
last_verified: 2026-10-27
canonical: true
---

# Umbrafox system and fork model

> **Current documentation.** Verified against the current fork history and exception inventory on 2026-10-27.

Umbrafox follows a patch-stack fork model. An upstream Firefox base supplies the
browser engine and product; fork commits then add branding, defaults, privileged
features, tests, tooling, and experiments. The recorded comparison base for the
current exception inventory is `1a097ed8d31f6b307a5d0ebc34a82ceaf7f3727b`.

```text
Firefox upstream
  └─ Umbrafox product/default exceptions
       ├─ privileged userland subsystem
       ├─ owner-local UmbraLink service
       ├─ chrome/UI and clipboard controls
       ├─ Linux media/graphics paths
       └─ tests, tools, recipes, and evidence
```

## Boundary rules

- Ordinary sites receive Firefox-compatible HTTP, JavaScript, DOM, CSS,
  storage, media, timing, and automation surfaces by default.
- Umbrafox-only APIs live in browser chrome, privileged modules, actors,
  internal pages, or authenticated loopback control.
- User-enabled userland scripts may deliberately change site-visible behavior;
  that detectability belongs to the user's explicit configuration.
- Experimental graphics/media paths must be default-inert or preserve the same
  observable result before release admission.

## Composition roots

- `browser/moz.configure` and branding trees establish internal product identity while preserving the Firefox UA token.
- `browser/app/profile/firefox.js` supplies many fork defaults and UmbraLink prefs.
- `toolkit/components/umbrafox/` owns userland and UmbraLink services.
- `toolkit/modules/ActorManagerParent.sys.mjs` and `toolkit/actors/Umbrafox*.sys.mjs` connect parent/content processes.
- Gecko/SpiderMonkey/docshell hooks expose explicit userland interception points while the active pref gates inert behavior.
- `gfx/`, `widget/gtk/`, `dom/canvas/`, `dom/media/`, and `media/ffvpx/` contain Linux performance/media exceptions.

## Persistence and transient state

Userland script records are profile-local and persistent. UmbraLink tokens,
connections, and context IDs are per-run/transient. Diagnostics and profiler
dumps are explicit files under the active profile. Default prefs affect new
profiles but may be overridden by existing `prefs.js` values.

The [source map](../reference/repository-map.md) routes each subsystem to its
producers, consumers, and tests.
