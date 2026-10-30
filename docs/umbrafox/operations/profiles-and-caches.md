---
title: Umbrafox profiles and startup caches
status: current
doc_type: runbook
audience: [users, developers, operators]
last_verified: 2026-10-27
canonical: true
---

# Umbrafox profiles and startup caches

> **Current documentation.** Never infer the active profile from product branding alone.

Firefox-family profile placement is controlled by application metadata and the
profile service. On Linux, profiles commonly live under `.mozilla`, not under
`.config/umbrafox`. Confirm the path in `about:profiles`, from the live process,
or from UmbraLink's diagnostics/discovery file.

Use a temporary or explicit profile for defaults and destructive tests:

```bash
./mach run --temp-profile
./mach run --profile /absolute/disposable/profile
```

Existing `prefs.js` values override application defaults. Never erase a real
profile to make a test pass.

After a front-end/module rebuild whose BuildID did not change, stale startup
bytecode can hide source changes. Set `MOZ_PURGE_CACHES=1` for an explicit test
launch or remove only the verified disposable profile's startup cache. The
installed nightly uses `.purgecaches` as the launcher/package cache signal.
