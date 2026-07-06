# Userland scripts recipe

Status: incremental feature recipe. The profile-local storage, scope derivation, Debugger context-menu creation, Debugger footer creation, source-list visibility, and source-list enable checkbox slices exist; see `../03-userland-scripts-architecture.md` before implementing additional slices.

## Goal

Add browser-owned userland scripts that users create from DevTools, save in the active profile, and run in isolated named contexts before matching site JavaScript executes.

## Rulebook requirements

- No behavior change when no userland script is enabled.
- No Umbrafox marker in page-visible JavaScript, CSS, DOM, WebIDL, network, storage, worker, or timing surfaces.
- Userland private APIs must be available only inside isolated userland worlds.
- Page-visible mutations are allowed only as explicit enabled user scripts.
- Request blocking is not the default network model. Prefer browser-owned interception and client-side substitution.

## Source areas

Expected implementation areas:

- `devtools/client/debugger/src/actions/context-menus/source-tree-item.js`
- `devtools/client/debugger/src/utils/umbrafox-userland-scripts.js`
- `devtools/client/debugger/src/components/PrimaryPanes/SourcesTreeItem.js`
- `devtools/client/debugger/src/components/PrimaryPanes/SourcesTree.js`
- `devtools/client/debugger/src/reducers/sources-tree.js`
- `devtools/client/debugger/src/selectors/sources-tree.js`
- `devtools/client/debugger/src/client/firefox.js`
- `devtools/client/debugger/src/client/firefox/create.js`
- `devtools/server/connectors/js-process-actor/target-watchers/content_script.sys.mjs`
- `devtools/server/actors/targets/content-script.js`
- `toolkit/components/extensions/ExtensionContent.sys.mjs`
- `toolkit/components/extensions/ExtensionPolicyService.cpp`
- `toolkit/components/extensions/ExtensionUserScripts.sys.mjs`
- `toolkit/components/extensions/ExtensionUserScriptsContent.sys.mjs`
- new `toolkit/components/umbrafox/` modules for storage, parent service, and child service

## Implementation order

1. Keep the profile-local store and schema migration tests passing.
2. Keep source-tree scope derivation and disabled-script creation working.
3. Keep the footer `New Script` path local-tab-only and disabled when no HTTP(S) scope can be derived.
4. Keep created scripts visible in the source-list `Userland Scripts` section for matching target origins.
5. Keep the source-list enable checkbox updating profile storage only; it must not execute scripts until runtime injection is implemented.
6. Add editor UI for name, enabled state, scope, and code.
7. Add document-only isolated-world execution for future navigations.
8. Add tests that enabled scripts run before the first inline page script.
9. Add tests that disabled scripts do not create runtime worlds.
10. Add tests that no Umbrafox globals or source markers appear in page-visible state.
11. Add worker support only after document support is stable.
12. Add network interception APIs only after isolated script timing is proven.

## Verification commands

Use targeted tests once implementation files exist:

```bash
./mach lint devtools/client/debugger toolkit/components/umbrafox
./mach test --auto devtools/client/debugger toolkit/components/umbrafox
```

For front-end-only slices after a full build exists:

```bash
./mach build faster
```

For C++ or platform hook changes:

```bash
./mach build binaries
```

## Rebase notes

During upstream updates, inspect conflicts in:

- DevTools source tree item shape and context-menu action signatures.
- target watcher behavior for `CONTENT_SCRIPT` or any new target type.
- `ExtensionPolicyService::CheckRequest`.
- `ExtensionPolicyService::CheckDocument`.
- `ExtensionContent.sys.mjs` document_start and sandbox creation logic.
- any new tests that assert user-script ordering.

If upstream changes document_start semantics, stop and redo the timing proof before carrying the patch forward.
