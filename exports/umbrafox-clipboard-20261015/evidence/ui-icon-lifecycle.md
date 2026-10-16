# Late-frame permission icon lifecycle handoff

Session clipboard-20261015, task/author ui. Source frozen for parent sync and
real browser verification; no browser/build/runtime performed by this worker.

## Exact files changed in this continuation

```text
6a8a35bb44c7973610ad0a99902e20bbfc4a48f60174410d93a3bc31442ca598  browser/modules/UmbrafoxClipboardProtection.sys.mjs
057a1bc70ac4e3eb16e4d5939089f7ddc3773f2359e9624d499f4a963d1acd4e  browser/modules/test/unit/test_UmbrafoxClipboardProtection.mjs
c6edb1119f75c3b7310e32ccc14f144dbcacfc11ecd4f6d9f3f751b44f39a37c  browser/modules/test/browser/browser_UmbrafoxClipboardProtection.js
```

SitePermissions, actors, native files, unit permissions fixture, manifests,
locales, baseline/native tests and repository docs are unchanged in this wave.
Existing parent documentGlobal fixes are retained. No commits/staging/index
modifications; no owner browser/profile/clipboard access.

## Evidence and design

Parent's `browser-integrated-1.log` records the actual cross-origin reload
regression: persisted frame grant is available to SitePermissions, but the real
standard permission-panel click times out. Existing chrome updates the icon
through PermissionStateChange -> refreshIdentityBlock -> refreshPermissionIcons
-> SitePermissions.getAllForBrowser; creating a later frame previously supplied
no such refresh.

Searchfox discovery and local source reconciliation establish:

- WindowGlobalActor::WindowInitializer captures the actual inner principal.
- WindowGlobalParent::CreateDisconnected stores that principal before Init.
- WindowGlobalParent::Init sets the current inner window before sending the
  private window-global-created observer notification.
- nsGlobalWindowOuter::WouldReuseInnerWindow only reuses an uncommitted initial
  document for the same origin/document. WindowGlobalChild::OnNewDocument
  release-asserts an unchanged principal. A cross-origin final document therefore
  gets a new global with its final principal; it is not missed because an initial
  about:blank global arrived first. The pure fixture checks both notifications.
- BrowserTestUtils.isVisible is the existing synchronous browser-test helper.

The module now registers its window-global-created observer only while a valid
clipboard ALLOW permission exists. Initialization and relevant perm-changed
events reconcile registration, including permission clearing and last-grant
removal. Other permission types do not trigger a rescan.

On a new global it requires currentWindowGlobal identity, current ancestors,
a connected embedder browser, a live documentGlobal with that selected browser,
and an exact operation/OA grant for the authoritative principal. Only then does
it dispatch the existing browser PermissionStateChange event. No popup opens,
no replay/grant occurs, no IPC is added, and no principal/browser cache is added.
The existing fresh subtree enumeration remains the source for displayed grants.

Complexity: getAllWithTypePrefix uses PermissionManager::GetPermissionEntries,
which scans all permission entries. This is O(P) at module initialization and
each relevant permission mutation, not O(number of clipboard grants). A batch
of G relevant removals, including private cleanup, can cause O(G * P) rescans.
With no grants there is no window-global observer. With grants, each new current
selected-browser global costs at most two exact permission lookups; an actual
match invokes existing chrome refresh and its O(current frames) listing. No
fixed traversal cap or truncation is claimed.

## Verification

Failing first: existing 21 pure tests passed and all four new lifecycle tests
failed against the prior module. After implementation:

- `timeout 20s node --experimental-vm-modules --test browser/modules/test/unit/test_UmbrafoxClipboardProtection.mjs`: 25/25 PASS, no skipped tests.
- `timeout 30s node_modules/.bin/eslint` on the exact three files: PASS.
- `timeout 30s node_modules/.bin/prettier --write` then `--check` on those three: PASS.
- `git diff --no-index --check /dev/null <each file>`: no whitespace diagnostics;
  status 1 is the expected indication that each new file differs from /dev/null.

Pure coverage includes initialization from persisted allows, no observation
without grants, unrelated/malformed/non-allow permissions, added/changed/deleted/
cleared registration, initial-to-final frame principals, exact OA checks,
current-global and current-ancestor filtering, disconnected/background/closed/
non-browser globals, immediate listing at the refresh event, and no departed
principal retained by the observer.

The real reload browser test now additionally waits for the standard permission
icon's hasPermissions attribute and actual visibility before its unchanged
real panel click and original-principal revocation. It never manually refreshes
chrome, drops the row assertion, or sends another clipboard request.

## Review boundary

The decisive failing regression remains the actual browser reload/icon-click
workflow. Pure tests establish module callback/ownership behavior, not native
observer delivery or real chrome visibility. Parent must sync these files and
rerun that browser test before calling the lifecycle bug fixed. Prior parent
native integration successes are not asserted as verification of this patch.
No native/build/runtime work was attempted here.
