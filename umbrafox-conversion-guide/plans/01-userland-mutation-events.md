# Userland mutation events plan

Status: first native slice implemented.

See `../recipes/10-userland-mutation-events.md` for the rebase recipe. The
first implementation covers selected child-list, attribute, and character-data
mutations after a document reaches `interactive` or `complete`. Loading-state
parser mutations, bulk HTML parsing operations, full replacement semantics, and
nested mutation dispatch remain future work.

## Goal

Add a private userland mutation-control event that lets explicit enabled
userland scripts observe, modify, substitute, or silently veto DOM mutations
before Gecko commits them.

This must not alter the standard page-visible `MutationObserver` API. Standard
web APIs must remain Firefox-equivalent by default. Mutation control belongs
only to the private `userland` object passed into Umbrafox userland script
wrappers.

## Rulebook constraints

- No new page-visible globals, DOM APIs, CSS behavior, WebIDL surface, exception
  messages, or request markers.
- No behavior change when no matching userland script is enabled.
- Userland customizations may be detectable because the user explicitly chose
  them.
- Prefer successful-looking substitution over hard breakage when practical.
- Preserve native Firefox exceptions for invalid DOM operations unless a future
  explicit userland mode deliberately swallows them.

## Proposed API

```js
userland.on("mutation", event => {
  if (event.kind == "childList") {
    for (const node of event.addedNodes) {
      if (node.matches?.(".ad")) {
        node.style.display = "none";
      }
    }
  }

  if (event.kind == "attribute" && event.attributeName == "style") {
    event.newValue = sanitizeStyle(event.newValue);
  }

  if (event.kind == "childList" && event.addedNodes.some(isHostileScript)) {
    event.preventDefault();
  }
});
```

Shared event methods:

```js
{
  type: "mutation",
  kind,
  cancelable: true,
  defaultPrevented: false,
  preventDefault(),
  cancel(),
  block(),
  replaceWith(...nodes),
}
```

`preventDefault()`, `cancel()`, and `block()` are aliases for a silent veto:
the requested mutation is not committed, but Umbrafox should avoid throwing a
new userland-caused exception.

`replaceWith(...nodes)` substitutes the pending mutation payload. For child-list
insertions, the provided nodes are inserted instead of the original added nodes.
For attribute and character-data mutations, use `event.newValue` or
`event.newData` instead.

## Event shapes

### Child-list mutations

```js
{
  type: "mutation",
  kind: "childList",
  target,
  addedNodes,
  removedNodes,
  previousSibling,
  nextSibling,
  parserInserted,
  native,
}
```

`addedNodes` and `removedNodes` should be normal array-like snapshots for
userland ergonomics. We should not expose internal mutable Gecko arrays
directly.

### Attribute mutations

```js
{
  type: "mutation",
  kind: "attribute",
  target,
  attributeName,
  attributeNamespace,
  oldValue,
  newValue,
  native,
}
```

Changing `event.newValue` changes the value Gecko commits. Calling
`preventDefault()` leaves the attribute unchanged.

### Character-data mutations

```js
{
  type: "mutation",
  kind: "characterData",
  target,
  oldData,
  newData,
  native,
}
```

Changing `event.newData` changes the text Gecko commits. Calling
`preventDefault()` leaves the character data unchanged.

## Silent veto semantics

Silent veto means:

1. Do not commit the requested mutation.
2. Do not throw a new exception merely because userland vetoed the operation.
3. Return the same broad value shape the native API would have returned after a
   successful operation.
4. Leave pre-existing DOM state unchanged.

Silent veto does not mean undetectable. Page code can still detect that the DOM
state did not change if it checks after the call. That detectability belongs to
the explicit enabled user script.

## Per-operation rejection behavior

| Operation | Veto behavior | Return shape |
| --- | --- | --- |
| `parent.appendChild(node)` | Do not insert `node`. If already attached elsewhere, leave it there. | Return `node`. |
| `parent.insertBefore(node, ref)` | Do not insert or move `node`. | Return `node`. |
| `parent.replaceChild(newNode, oldNode)` | Do not replace either node. | Return `oldNode`. |
| `parent.removeChild(node)` | Do not remove `node`. | Return `node`. |
| `element.append(...)` | Do not insert provided nodes or text. | Return `undefined`. |
| `element.prepend(...)` | Do not insert provided nodes or text. | Return `undefined`. |
| `element.before(...)` | Do not insert provided nodes or text. | Return `undefined`. |
| `element.after(...)` | Do not insert provided nodes or text. | Return `undefined`. |
| `element.replaceWith(...)` | Do not replace the element. | Return `undefined`. |
| `element.remove()` | Leave the element attached. | Return `undefined`. |
| `element.replaceChildren(...)` | Leave children unchanged. | Return `undefined`. |
| `element.setAttribute(name, value)` | Leave attribute unchanged. | Return `undefined`. |
| `element.removeAttribute(name)` | Leave attribute unchanged. | Return `undefined`. |
| `attribute.value = value` | Leave attribute value unchanged. | Setter returns normally. |
| `text.data = value` | Leave text unchanged. | Setter returns normally. |
| `text.appendData(...)` | Leave text unchanged. | Return `undefined`. |
| `text.insertData(...)` | Leave text unchanged. | Return `undefined`. |
| `text.deleteData(...)` | Leave text unchanged. | Return `undefined`. |
| `text.replaceData(...)` | Leave text unchanged. | Return `undefined`. |
| `element.innerHTML = html` | Leave subtree unchanged. | Setter returns normally. |
| `element.outerHTML = html` | Leave element and surrounding tree unchanged. | Setter returns normally. |
| `node.textContent = value` | Leave subtree/text unchanged. | Setter returns normally. |
| `Range.insertNode(node)` | Do not insert or move `node`. | Return `undefined`. |
| `Range.deleteContents()` | Do not delete content. | Return `undefined`. |
| `Range.extractContents()` | Do not remove content. | Return an empty `DocumentFragment` if vetoed before extraction. |
| `Range.surroundContents(node)` | Do not move or wrap content. | Return `undefined`. |

The exact return behavior must be verified against Firefox before landing.
Where the table is wrong, Firefox parity wins.

## Normal DOM errors

Run the userland mutation hook after normal DOM validity checks, but before
commit.

Examples:

- Invalid hierarchy errors should still throw as Firefox would.
- Not-found errors for removing a non-child should still throw as Firefox would.
- Userland veto should not hide those native errors unless a future explicit API
  requests error swallowing.

This keeps no-userland behavior Firefox-equivalent and avoids silently changing
programming errors that happened before userland had a valid mutation to veto.

## Mutation modification semantics

Userland should be able to alter the pending operation without vetoing it.

Examples:

```js
userland.on("mutation", event => {
  if (event.kind == "attribute" && event.attributeName == "class") {
    event.newValue = event.newValue.replace(/\btracking\b/g, "");
  }
});
```

```js
userland.on("mutation", event => {
  if (event.kind == "childList") {
    const replacement = document.createTextNode("");
    event.replaceWith(replacement);
  }
});
```

```js
userland.on("mutation", event => {
  for (const node of event.addedNodes ?? []) {
    if (node.nodeType == Node.ELEMENT_NODE) {
      node.style.display = "none";
    }
  }
});
```

If userland mutates a node object directly before commit, the mutation continues
with that modified node.

## Critical review additions

This section captures design risks found during a second pass over the plan.

### Detached and in-memory mutations

Not all useful DOM mutations happen in a connected document. Scripts can mutate:

- Detached elements created by `document.createElement(...)`.
- `DocumentFragment` instances.
- `template.content`.
- Nodes parsed by `Range.createContextualFragment(...)`.
- Nodes created by `DOMParser` or `Document.parseHTMLUnsafe(...)`.
- Nodes in a secondary document created by `document.implementation`.

The first implementation needs an explicit dispatch policy:

- If a detached node has an owner document with an active matching userland
  controller, dispatch the mutation event to that document's controller.
- If the owner document has no browsing context or no active userland
  controller, do not dispatch.
- If a node is adopted into another document, later mutations should use the new
  owner document.

This matters because "silent veto" can leave nodes as ordinary detached
in-memory objects. That is acceptable, but it must be consistent for future
operations on those detached objects.

### Commit timing requirements

The hook must run after native validity checks but before any page-visible commit
side effect. That means before:

- `MutationObserver` records are queued.
- Live collections and tree indexes observe the new state.
- `isConnected`, `parentNode`, `children`, or query APIs can see the new state.
- Custom element `connectedCallback`, `disconnectedCallback`,
  `adoptedCallback`, or attribute callbacks are enqueued or invoked for the
  mutation.
- Resource loading starts for inserted subtrees, such as `<script>`, `<img>`,
  `<link>`, `<iframe>`, media, SVG external references, and CSS imports.
- Shadow DOM slot assignment or flattened-tree recalculation becomes observable.
- Accessibility tree, layout, style, paint, event target, focus, selection, or
  scroll anchoring state is updated.

If any of those effects happen before the userland decision, the hook is not a
true pre-commit mutation hook.

### MutationObserver record consistency

If userland vetoes a mutation, standard page `MutationObserver` instances should
not receive a record for that vetoed mutation.

If userland modifies or substitutes a mutation, page `MutationObserver` records
should describe the committed result, not the original attempted operation.

Examples:

- Rewriting `event.newValue` for an attribute mutation should queue a normal
  attribute record for the final value.
- `event.replaceWith(replacement)` for insertion should queue records for the
  replacement nodes, not for the original rejected nodes.
- Directly mutating a pending inserted node before insertion may itself produce
  nested mutation events if it changes attributes or text. This needs explicit
  recursion behavior and tests.

### API naming risk

`event.replaceWith(...nodes)` is convenient, but it is ambiguous for removals and
attribute/text mutations. Before implementation, consider a more explicit API:

```js
event.replaceAddedNodes(...nodes);
event.newValue = "...";
event.newData = "...";
```

The first implementation can still expose `replaceWith(...)` as a convenience,
but native code should have unambiguous internal decision fields.

### Hot-path performance

DOM mutation paths are extremely hot. The implementation must have a fast path
when no mutation handlers are active:

- Per-document or per-content-process boolean for "has active mutation userland".
- No allocation of event objects when there are no handlers.
- No conversion of node lists to JS arrays until dispatch is definitely needed.
- No old-value snapshots unless needed for a dispatched event.

The no-enabled-userland case must remain Firefox-equivalent and low overhead.

## Parser and bulk mutation behavior

Parser insertion, `innerHTML`, `outerHTML`, template parsing, and range
operations can create many nodes as part of one high-level operation.

Initial implementation should prefer one event per high-level operation where
practical, with `addedNodes` containing the pending nodes. If native Gecko code
only exposes lower-level insertions safely, one event per commit is acceptable
for the first slice, but documentation must state that bulk operations can emit
multiple events.

For `innerHTML` and similar APIs, if userland vetoes the operation, the existing
subtree should remain unchanged and the parsed but uncommitted nodes should be
discarded or left only as ordinary detached in-memory nodes if an API return
requires a value.

## Reentrancy and recursion

Userland handlers may perform DOM mutations themselves. We need a clear policy:

- Default: mutations caused inside a mutation handler should also be observable
  unless this causes unsafe recursion.
- Add internal recursion depth protection to avoid infinite native re-entry.
- Consider an event field such as `causedByUserland: true` later if it can be
  provided only to userland without becoming page-visible.

Do not add page-visible markers for userland-caused mutations.

## Native hook areas to investigate

Use `searchfox-cli` before implementation. Likely areas:

- `dom/base/MutationObservers.*`
- `dom/base/MutationObservers.cpp`
- `dom/base/nsINode.*`
- `dom/base/Element.*`
- `dom/base/CharacterData.*`
- `dom/base/Attr.*`
- `dom/base/FragmentOrElement.*`
- `dom/base/DocumentFragment.*`
- `dom/base/RangeBoundary.*`
- `dom/base/nsRange.*`
- `dom/base/ShadowRoot.*`
- parser insertion paths under `parser/html/`

Additional WebIDL/API surfaces to explicitly account for:

- `Element.insertAdjacentElement(...)`
- `Element.insertAdjacentText(...)`
- `Element.insertAdjacentHTML(...)`
- `Element.setHTML(...)`
- `Element.setHTMLUnsafe(...)`
- `ShadowRoot.setHTML(...)`
- `ShadowRoot.setHTMLUnsafe(...)`
- `Document.write(...)`
- `Document.writeln(...)`
- `Document.adoptNode(...)`
- `Document.importNode(...)`
- `Node.cloneNode(...)`
- `Range.createContextualFragment(...)`
- `DOMTokenList.add/remove/replace/toggle(...)` through `classList`
- `DOMStringMap` writes through `dataset`
- `CSSStyleDeclaration.setProperty/removeProperty` and direct style properties
- `HTMLSelectElement.add(...)`
- `HTMLOptionsCollection.add(...)`
- table helpers such as `insertRow`, `deleteRow`, `insertCell`, `deleteCell`,
  `createTHead`, `createTFoot`, `createTBody`, `deleteTHead`, `deleteTFoot`,
  and `deleteCaption`

The hook must run before mutation observer records are queued and before the DOM
commit is visible to page script.

## Userland dispatch architecture

Reuse the established userland event-controller pattern:

- Add `"mutation"` to `UmbrafoxUserlandEventController.sys.mjs`.
- Register active per-document controllers by browsing-context id.
- Dispatch synchronously in the content process for DOM mutations that happen in
  that process.
- Keep `userland` private to the wrapper context.
- Do not patch or replace the page-visible `MutationObserver` constructor.

If a mutation can originate in the parent process or another process, design a
bridge similar to the request-event parent/content bridge, but do not add that
complexity until a real mutation path requires it.

## Testing plan

Browser tests should cover:

- No enabled userland script: normal Firefox DOM mutation behavior.
- `appendChild` veto returns the node and leaves it detached or in its previous
  parent.
- `insertBefore` move veto leaves the node in its original parent.
- `removeChild` veto returns the child and leaves it attached.
- `replaceChild` veto returns the old child and leaves both nodes unchanged.
- Attribute veto leaves the previous value unchanged and does not throw.
- Attribute mutation rewrites `newValue`.
- Character-data veto leaves old text unchanged.
- Character-data mutation rewrites `newData`.
- `innerHTML` veto leaves the previous subtree unchanged.
- `outerHTML` veto leaves the previous tree unchanged.
- `insertAdjacentHTML`, `setHTML`, and `setHTMLUnsafe` vetoes leave the previous
  tree unchanged.
- `Document.write`/`writeln` behavior is defined and tested separately from
  normal parser insertion.
- `adoptNode` veto leaves the node in its previous document and parent state.
- `importNode` and `cloneNode` are either explicitly out of scope because they
  create detached copies, or they have documented userland behavior.
- `classList`, `dataset`, and `style` changes dispatch as attribute mutations.
- Select/options and table helper APIs preserve native return shapes under veto.
- `replaceWith(...nodes)` substitutes child-list insertions.
- Vetoed insertion of scripts, images, iframes, links, and media starts no
  resource load and queues no misleading page-visible load/error event.
- Custom element lifecycle callbacks are not invoked for vetoed commits.
- Page `MutationObserver` records match the committed result after userland
  modification/substitution.
- Mutations made inside a userland handler have defined recursion behavior.
- No `window.userland`, `navigator.umbrafox`, custom DOM marker, or altered
  standard `MutationObserver` shape is visible to page scripts.

Focused verification commands once implemented:

```bash
./mach lint toolkit/components/umbrafox dom/base
./mach test --headless toolkit/components/umbrafox/tests/browser/browser_userland_events.js
```

Adjust paths once implementation files are known.

## Open questions

- Should parser-created mutations be coalesced into one event for a full parsed
  fragment, or should first implementation accept one event per native insert?
- Should `replaceWith(...nodes)` be allowed for removal operations, or only
  insertion/replacement operations?
- What is the safest recursion depth limit for userland-caused mutations?
- Do we need a future explicit `event.throw(error)` for users who intentionally
  want hard failures?
- How should Shadow DOM slot assignment and flattened-tree effects be exposed to
  userland without creating confusing event timing?
- Should detached mutations be observable for every owner document with active
  userland, or only once a node has been connected at least once?
- Is `replaceWith(...)` too ambiguous for the first API, and should we expose
  only `replaceAddedNodes(...)` initially?
- Should `Document.write(...)` be considered parser mutation, script-source
  mutation, or its own event source for documentation and tests?
- Do cloned/imported detached nodes need mutation events, or is controlling their
  later insertion sufficient?

## Non-goals for first implementation

- Do not implement phantom DOM nodes.
- Do not alter standard `MutationObserver`.
- Do not guarantee stealth for userland-chosen DOM changes.
- Do not swallow native Firefox DOM exceptions that happen before a valid
  mutation exists.
- Do not support async mutation decisions.
