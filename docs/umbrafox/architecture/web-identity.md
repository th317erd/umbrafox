---
title: Web identity and detectability
status: current
doc_type: architecture
audience: [developers, security-reviewers, maintainers]
last_verified: 2026-10-27
canonical: true
---

# Web identity and detectability

> **Current documentation.** The mandatory modification rules override every lower-priority feature goal.

Umbrafox separates internal product branding from the identity observed by
websites and servers. `MOZ_APP_NAME`, display name, vendor, assets, executable,
chrome copy, and internal pages may identify Umbrafox. `MOZ_APP_UA_NAME` is
forced to `Firefox`, and default web-platform behavior must match the
corresponding Firefox build.

## Required parity surfaces

Review request methods and headers, TLS/DNS/cache behavior, redirects, timing,
workers, service workers, DOM/WebIDL, JS/CSS, storage, permissions, media,
canvas/WebGL, fonts, events, errors, CSP/CORS/SRI, and performance APIs. A quiet
UI change is not automatically web-invisible.

## Explicit exceptions

- A user may enable scripts, rules, extensions, proxies, certificates, or
  controls that are themselves detectable.
- Privileged/internal UI may identify Umbrafox.
- Build and package metadata may identify Umbrafox when it is not remotely
  observable by page content or servers.

## Automation distinction

UmbraLink does not start Marionette, Remote Agent, WebDriver BiDi, or DevTools
remote debugging, and it is not wired into `Navigator::Webdriver()`. Firefox's
automation flags can independently make `navigator.webdriver` true; ordinary
Umbrafox launchers must not add those flags. UmbraLink must not be extended to
evade third-party bot detection.

## Review gate

Every web-affecting patch must answer the detectability checklist in the
[mandatory rules](../conversion-guide/02-mandatory-modification-rules.md), add
Firefox-parity tests where practical, and update the
[web-identity leak log](../conversion-guide/reference/web-identity-leak-log.md)
when a leak is discovered. Blocking is a last resort; compatible client-side
substitution is preferred when failure itself would be observable.
