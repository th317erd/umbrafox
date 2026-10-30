---
title: Synchronizing Umbrafox with upstream Firefox
status: current
doc_type: guide
audience: [maintainers, release-engineers]
last_verified: 2026-10-27
canonical: true
---

# Synchronizing Umbrafox with upstream Firefox

> **Current documentation.** The detailed conversion workflow and recipes are the operational checklist; this page defines the acceptance boundary.

1. Preserve the owner's checkout and create an isolated integration branch/worktree.
2. Record the old Umbrafox head, old upstream base, proposed new base, dirty state, and exact exception inventory.
3. Integrate upstream without dropping either side of conflicts by convenience.
4. Reapply/reconcile every conversion recipe and exact exception category.
5. Regenerate the source/test/tool path inventory against the new recorded base.
6. Run the leak-log checklist, default-inert tests, focused subsystem suites,
   full build/package, clean-profile startup, and hardware gates required by changed code.
7. Compare live HTTP UA, `navigator.userAgent`, `navigator.webdriver`, feature
   surfaces, request shape, and affected page behavior with matching Firefox.
8. Update current status, known risks, recipes, source map, and completion evidence.

Never treat a clean textual merge as semantic acceptance. Upstream may move
actor packaging, prefs, search data, script loaders, docshell navigation,
graphics lifecycles, or build configuration while leaving the patch applicable.

Use the [conversion guide](../conversion-guide/README.md), especially its
changed-file checklist, gotchas, web-identity leak log, and ordered recipes.
