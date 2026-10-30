---
title: Umbrafox documentation
status: current
doc_type: index
audience: [users, developers, maintainers, operators, bots]
last_verified: 2026-10-27
canonical: true
---

# Umbrafox documentation

> **Current documentation.** This is the canonical entry point for Umbrafox-specific behavior. Firefox source and tests outrank prose; unchanged Firefox behavior is documented by the surrounding Firefox source docs.

Umbrafox is a power-user Firefox fork with a strict separation between internal
product identity and web-visible identity. It adds dangerous, explicit owner
controls without adding a default website-visible Umbrafox fingerprint.

## Authority order

1. Executable source and tests.
2. This current Umbrafox documentation.
3. The current conversion guide and recipe set.
4. Active roadmap documents.
5. Archived plans, reports, bug reports, and experimental evidence.

## Start by task

- Understand the fork: [overview](overview.md) and [system architecture](architecture/system.md).
- Review every Firefox divergence: [exception ledger](reference/firefox-exceptions.md) and [exact changed-path inventory](reference/exception-paths.tsv).
- Protect website parity: [web identity and detectability](architecture/web-identity.md).
- Use or maintain UmbraLink: [architecture](architecture/umbralink.md), [protocol reference](reference/umbralink-protocol.md), and [operator runbook](operations/umbralink.md).
- Work on userland scripts: [architecture](architecture/userland-scripts.md) and [API reference](reference/userland-api.md).
- Build or update the fork: [development guide](guides/developing.md), [upstream-sync guide](guides/upstream-sync.md), and [build/package/install runbook](operations/build-package-install.md).
- Test a change: [testing guide](guides/testing.md).
- Diagnose profiles or stale chrome code: [profiles and caches](operations/profiles-and-caches.md).
- Check what is proven today: [current status](maintainers/current-status.md) and [known risks](maintainers/known-risks.md).

## Current documentation by section

- [Architecture](architecture/README.md) — fork boundaries, identity, userland, UmbraLink, graphics and media.
- [Reference](reference/README.md) — exceptions, preferences, protocols, APIs, source map, and verification inventory.
- [Guides](guides/README.md) — developing, testing, and upstream synchronization.
- [Operations](operations/README.md) — builds, packaging, installation, profiles, live diagnostics, and recovery boundaries.
- [Maintainers](maintainers/README.md) — verified state, gaps, and rebase hazards.
- [Roadmap](roadmap/README.md) — active or proposed work linked from preserved plans.
- [Campaign report](reports/documentation-campaign-2026-10-27.md) — documentation scope and verification evidence.
- [Stabilization status](reports/2026-10-28-stabilization-status.md) — what the campaign proved and what remains unproven.
- [T4 compile proof](reports/2026-10-28-t4-compile-proof.md) — V4L2-M2M decode: objects compile, nothing linked or run.

## Supporting bodies

- [Conversion guide](conversion-guide/README.md) — practical recipes for recreating Umbrafox on a new Firefox base. It is current operational guidance but must be checked against source.
- [Archived project records](archive/README.md) — the complete former `bot-docs` corpus, visibly non-canonical and preserved for evidence.
- [Subsystem source docs](../../toolkit/components/umbrafox/docs/index.md) — userland and control-channel docs shipped through Firefox Source Docs.

## Maintenance rules

Update the exception ledger, exact path inventory, affected architecture or
reference page, and conversion recipe in the same work session as an
intentional Firefox divergence. Record any new website-visible identity leak in
the conversion guide's leak log. New project documentation belongs under this
tree, never in a parallel documentation root.
