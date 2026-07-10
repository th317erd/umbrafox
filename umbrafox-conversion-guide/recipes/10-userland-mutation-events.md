# Userland Mutation Events

## Goal

Add a private `userland.on("mutation", handler)` event that lets enabled
userland scripts synchronously observe, rewrite, or silently veto selected DOM
mutations before Gecko commits them.

This is not a change to the standard page-visible `MutationObserver` API. The
feature is only reachable through the private `userland` object passed into
Umbrafox userland script wrappers.

## Rulebook review

- No `window.userland`, `navigator.umbrafox`, DOM marker, CSS marker, WebIDL
  surface, or standard `MutationObserver` behavior is added.
- No behavior changes occur when no enabled userland mutation handler exists.
- Any DOM difference after a handler runs is caused by an explicit enabled user
  script, so detectability belongs to that user choice.
- Vetoes are silent: native DOM methods return their normal broad value shape
  where this first slice hooks them, and no new userland-specific exception is
  thrown.
- Loading-state documents are deliberately skipped in this first slice because
  synchronous JS dispatch during parser/native startup paths needs a safer
  design.

## Files

- `dom/base/UmbrafoxUserlandMutation.h`
- `dom/base/UmbrafoxUserlandMutation.cpp`
- `dom/base/moz.build`
- `dom/base/nsINode.cpp`
- `dom/base/Element.cpp`
- `dom/base/CharacterData.cpp`
- `toolkit/components/umbrafox/UmbrafoxUserlandEventController.sys.mjs`
- `toolkit/components/umbrafox/UmbrafoxUserlandScriptRuntime.sys.mjs`
- `toolkit/components/umbrafox/tests/browser/browser_userland_events.js`

## Native path

The native helper lives in `dom/base/UmbrafoxUserlandMutation.*`.

Fast-path checks happen before allocating property bags:

- `umbrafox.userlandScripts.active` must be true.
- The target must have an owner document and browsing context.
- The document must be `interactive` or `complete`.
- Gecko must report that it is safe to run script.
- A native observer for `umbrafox-userland-mutation-attempt` must be installed.
- Nested mutation dispatch from inside a mutation handler is suppressed for the
  first slice.

Hooked native commit points:

- `nsINode::ReplaceOrInsertBefore(...)` for insert/append/replace style
  child-list mutations that flow through this shared path.
- `nsINode::RemoveChildInternal(...)` for `removeChild(...)`.
- `Element::SetAttrInternal(...)` and `Element::SetParsedAttr(...)` for
  attribute writes.
- `Element::UnsetAttr(...)` for attribute-removal veto.
- `CharacterData::SetTextInternal(...)` for text/comment/character-data writes.

## Userland event shapes

Child-list event:

```js
userland.on("mutation", event => {
  if (event.kind == "childList") {
    for (const node of event.addedNodes) {
      node.style.display = "none";
    }
  }
});
```

Important fields:

- `type: "mutation"`
- `kind: "childList"`
- `operation: "insert" | "replace" | "remove"`
- `target`
- `addedNodes`
- `removedNodes`
- `previousSibling`
- `nextSibling`
- `native: true`

Attribute event:

```js
userland.on("mutation", event => {
  if (event.kind == "attribute" && event.attributeName == "class") {
    event.newValue = event.newValue.replace(/\btracking\b/g, "");
  }
});
```

Important fields:

- `kind: "attribute"`
- `target`
- `attributeName`
- `attributeNamespace`
- `oldValue`
- `newValue`

Character-data event:

```js
userland.on("mutation", event => {
  if (event.kind == "characterData") {
    event.newData = event.newData.replace("old", "new");
  }
});
```

Important fields:

- `kind: "characterData"`
- `target`
- `oldData`
- `newData`

Shared methods:

- `preventDefault()`
- `cancel()`
- `block()`
- `respondWith(value)`
- `replaceAddedNodes(...nodes)`
- `replaceWith(...nodes)` as a child-list convenience alias.

## Rebase checklist

1. Reapply `UmbrafoxUserlandMutation.h/.cpp` and keep the file in
   `dom/base/moz.build`.
2. Reapply native call sites after upstream changes to:
   - `nsINode::ReplaceOrInsertBefore`
   - `nsINode::RemoveChildInternal`
   - `Element::SetAttrInternal`
   - `Element::SetParsedAttr`
   - `Element::UnsetAttr`
   - `CharacterData::SetTextInternal`
3. Reapply `MUTATION_EVENT_TYPE`, `NATIVE_MUTATION_TOPIC`,
   `nativeMutationObserver`, and `UserlandMutationEvent` in
   `UmbrafoxUserlandEventController.sys.mjs`.
4. Preserve the parser-blocking rejection guard in
   `UmbrafoxUserlandScriptRuntime.sys.mjs`; rejected userland startup scripts
   must not leave page parsing blocked forever.
5. Reapply browser coverage in `browser_userland_events.js`.

## Known limitations

- Mutation events do not fire while the document is still `loading`.
- Parser insertions, `innerHTML`, `outerHTML`, `Document.write(...)`, Range
  operations, table helpers, select/options helpers, and bulk operations are
  not fully covered yet.
- Attribute removal can be vetoed, but changing `event.newValue` during a
  removal does not convert the removal into a set operation in this slice.
- Nested DOM mutations caused from inside a mutation handler are allowed to
  happen but do not dispatch nested `mutation` events yet.
- Replacement-node support is first-pass only and should be broadened with more
  tests before relying on complex fragment replacement behavior.

## Verification

```bash
./mach build binaries
./mach build faster
./mach lint toolkit/components/umbrafox/UmbrafoxUserlandEventController.sys.mjs toolkit/components/umbrafox/UmbrafoxUserlandScriptRuntime.sys.mjs toolkit/components/umbrafox/tests/browser/browser_userland_events.js dom/base/UmbrafoxUserlandMutation.cpp dom/base/UmbrafoxUserlandMutation.h dom/base/nsINode.cpp dom/base/Element.cpp dom/base/CharacterData.cpp
./mach test --headless toolkit/components/umbrafox/tests/browser/browser_userland_events.js
```
