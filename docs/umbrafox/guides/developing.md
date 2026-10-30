---
title: Developing Umbrafox
status: current
doc_type: guide
audience: [developers, maintainers, bots]
last_verified: 2026-10-27
canonical: true
---

# Developing Umbrafox

> **Current documentation.** Read the repository instructions and mandatory modification rules before changing source.

## Before coding

1. Read `AGENTS.md` and any nested instructions for the directories involved.
2. Read the [mandatory rulebook](../conversion-guide/02-mandatory-modification-rules.md).
3. Read the affected [exception-ledger](../reference/firefox-exceptions.md) category and conversion recipe.
4. Trace producers, consumers, prefs, process boundaries, startup/shutdown, fallback, and tests.
5. For upstream Firefox discovery, use `searchfox-cli`; use local `rg` only for known local changes.
6. Write a detectability review before changing a web-facing path.

## Design rules

- Preserve Firefox-equivalent defaults. Put detectable power behind explicit user control.
- Keep Umbrafox-only names inside privileged/internal boundaries.
- Prefer substitution over observable blocking and preserve request shape.
- Keep disabled paths actually inert, not merely visually hidden.
- Make failure fall back safely and visibly to maintainers without adding page-visible errors.
- Preserve current consumers during upstream reconciliation; do not blindly rename `firefox` identifiers.

## Documentation obligations

Update the human exception ledger, exact path inventory, relevant architecture
or reference page, conversion recipe, tests, and web-identity leak log as
applicable. Record limitations as partial behavior rather than future promises.

## Formatting and focused checks

Use `./mach format <paths>` and `./mach lint <paths>`. Select focused tests from
the [testing guide](testing.md) before broad build work. Do not run a full build
for a documentation-only change.
