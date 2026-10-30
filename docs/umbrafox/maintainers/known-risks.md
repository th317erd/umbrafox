---
title: Umbrafox known risks and rebase hazards
status: current
doc_type: maintainer-reference
audience: [maintainers, reviewers]
last_verified: 2026-10-27
canonical: true
---

# Umbrafox known risks and rebase hazards

> **Current documentation.** These are active review hazards, not a complete bug list.

- **Identity regression:** local branding can leak into HTTP/JS UA if
  `MOZ_APP_UA_NAME=Firefox` is lost.
- **Automation contamination:** Firefox remote-control flags independently set
  `navigator.webdriver`; do not attribute that to UmbraLink.
- **Inactive userland leakage:** every native/content hook must check active
  state and observers before marking or dispatching work.
- **Partial userland coverage:** unsupported workers, request/response shapes,
  history, sockets, streams, and module types must not be implied complete.
- **Actor packaging:** toolkit actors use `moz-src:///` registrations matching
  `MOZ_SRC_FILES`; a wrong resource URI can build but fail packaged startup.
- **Default-pref masking:** existing profiles retain user values and can hide
  changed defaults.
- **Startup bytecode:** unchanged BuildIDs can reuse stale chrome modules.
- **Search reintroduction:** packaged dump removal alone is insufficient;
  runtime Remote Settings filtering must remain.
- **Localization scope:** en-US branding sweep does not prove all locales.
- **Untracked upstream-deleted files:** the working checkout contains hundreds;
  do not delete or let them enter builds without an explicit reconciliation.
- **Graphics proof gaps:** compile/unit/marker evidence does not prove pixels,
  scanout, device acceptance, color/modifier support, fences, or lifecycle.
- **V4L2 proof gap:** vendored code and symbols do not prove device selection or
  acceptance on Pi hardware; fallback must remain intact.
- **Clipboard scope:** current integrated evidence is Linux-specific; do not
  claim cross-platform release acceptance.
- **UmbraLink privilege:** browser-realm execution is system-principal code;
  protect loopback/token/file permissions and never expose it publicly.

The conversion guide's [known gotchas](../conversion-guide/reference/known-gotchas.md)
and [identity leak log](../conversion-guide/reference/web-identity-leak-log.md)
contain the detailed rebase checks.
