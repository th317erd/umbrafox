/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/ */

"use strict";

do_get_profile();

const { UmbrafoxClipboardProtection: ClipboardProtection } =
  ChromeUtils.importESModule(
    "resource:///modules/UmbrafoxClipboardProtection.sys.mjs"
  );
const { SitePermissions } = ChromeUtils.importESModule(
  "resource:///modules/SitePermissions.sys.mjs"
);

const principals = [
  "https://clipboard-ui.example.com",
  "https://clipboard-ui.example.com^userContextId=1",
  "https://clipboard-ui.example.com^privateBrowsingId=1",
  "https://clipboard-frame.example.com",
].map(origin =>
  Services.scriptSecurityManager.createContentPrincipalFromOrigin(origin)
);

registerCleanupFunction(() => {
  for (const principal of principals) {
    for (const operation of ["copy", "paste"]) {
      ClipboardProtection.revoke(principal, operation);
    }
  }
});

add_task(function test_exact_attributes_and_standard_permission_listing() {
  const [normal, container, privatePrincipal] = principals;
  const id = ClipboardProtection.getPermissionID(container, "copy");
  SitePermissions.setForPrincipal(container, id, SitePermissions.ALLOW);
  Assert.ok(ClipboardProtection.hasGrant(container, "copy"));
  Assert.ok(!ClipboardProtection.hasGrant(container, "paste"));
  Assert.ok(!ClipboardProtection.hasGrant(normal, "copy"));
  Assert.ok(!ClipboardProtection.hasGrant(privatePrincipal, "copy"));
  Assert.equal(SitePermissions.getDefault(id), SitePermissions.UNKNOWN);
  Assert.equal(SitePermissions.getAllByPrincipal(normal).length, 0);
  Assert.equal(SitePermissions.getAllByPrincipal(privatePrincipal).length, 0);
  Assert.deepEqual(SitePermissions.getAllByPrincipal(container), [
    {
      id,
      state: SitePermissions.ALLOW,
      scope: SitePermissions.SCOPE_PERSISTENT,
    },
  ]);
  Assert.ok(SitePermissions.getPermissionLabel(id));
  Assert.equal(
    SitePermissions.getForPrincipal(normal, id).state,
    SitePermissions.UNKNOWN,
    "Even an explicit foreign-container key does not apply to this principal"
  );
  SitePermissions.removeFromPrincipal(container, id);
  Assert.ok(!ClipboardProtection.hasGrant(container, "copy"));
});

add_task(function test_authoritative_frame_grant_revocation() {
  const [top, , , frame] = principals;
  const id = ClipboardProtection.getPermissionID(frame, "paste");
  SitePermissions.setForPrincipal(frame, id, SitePermissions.ALLOW);
  const browser = {
    contentPrincipal: top,
    browsingContext: { currentWindowGlobal: {} },
    documentGlobal: { CustomEvent: class {} },
    dispatchEvent() {},
  };
  Assert.ok(ClipboardProtection.hasGrant(frame, "paste", browser));
  const details = SitePermissions.getAllPermissionDetailsForBrowser(browser);
  Assert.equal(details.length, 1);
  Assert.equal(details[0].id, id);
  Assert.ok(details[0].label.includes(frame.originNoSuffix));
  SitePermissions.removeFromPrincipal(top, id, browser);
  Assert.ok(!ClipboardProtection.hasGrant(frame, "paste"));
  Assert.equal(SitePermissions.getAllForBrowser(browser).length, 0);
});

add_task(function test_no_frame_grants_carried_to_new_document() {
  const [top, , , frame] = principals;
  const id = ClipboardProtection.getPermissionID(frame, "copy");
  SitePermissions.setForPrincipal(frame, id, SitePermissions.ALLOW);
  const browser = {
    contentPrincipal: top,
    browsingContext: { currentWindowGlobal: {} },
    documentGlobal: { CustomEvent: class {} },
    dispatchEvent() {},
  };
  Assert.ok(ClipboardProtection.hasGrant(frame, "copy", browser));
  browser.browsingContext.currentWindowGlobal = {};
  Assert.equal(SitePermissions.getAllForBrowser(browser).length, 0);
  ClipboardProtection.revoke(frame, "copy");
});

add_task(function test_malformed_keys_and_browser_only_types() {
  for (const type of [
    "umbrafox-clipboard-copy",
    "umbrafox-clipboard-copy^%broken",
    "umbrafox-clipboard-copy^https%3A%2F%2Fexample.com^extra",
    "umbrafox-clipboard-cut^https%3A%2F%2Fexample.com",
  ]) {
    Assert.equal(ClipboardProtection.getGrantPrincipal(type), null);
  }
  Assert.ok(
    !SitePermissions.listPermissions().includes("umbrafox-clipboard-copy")
  );
  Assert.ok(
    !SitePermissions.listPermissions().includes("umbrafox-clipboard-paste")
  );
});

add_task(function test_private_grants_clear_when_private_contexts_close() {
  const [normal, , privatePrincipal] = principals;
  const normalID = ClipboardProtection.getPermissionID(normal, "copy");
  const privateID = ClipboardProtection.getPermissionID(
    privatePrincipal,
    "copy"
  );
  SitePermissions.setForPrincipal(normal, normalID, SitePermissions.ALLOW);
  SitePermissions.setForPrincipal(
    privatePrincipal,
    privateID,
    SitePermissions.ALLOW,
    SitePermissions.SCOPE_SESSION
  );
  Assert.equal(
    Services.perms.getPermissionObject(privatePrincipal, privateID, true)
      .expireType,
    Services.perms.EXPIRE_SESSION
  );
  Services.obs.notifyObservers(null, "last-pb-context-exited");
  Assert.ok(!ClipboardProtection.hasGrant(privatePrincipal, "copy"));
  Assert.ok(ClipboardProtection.hasGrant(normal, "copy"));
  ClipboardProtection.revoke(normal, "copy");
});
