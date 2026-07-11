# Recipe 12: Local control input

## Goal

Add the first native input command to the independent Umbrafox local control
channel without starting Firefox Remote Agent, Marionette, or WebDriver BiDi.

The initial pointer command is:

```json
{
  "id": 2,
  "method": "umbrafox.input.pointerMove",
  "params": {
    "context": 123,
    "fromX": 5,
    "fromY": 5,
    "x": 85,
    "y": 45,
    "durationMs": 0,
    "steps": 4,
    "profile": "linear",
    "seed": 7
  }
}
```

It generates deterministic intermediate pointer positions and dispatches native
trusted `mousemove` events through Firefox's existing event synthesis helpers.

This slice also adds:

```json
{ "id": 3, "method": "umbrafox.input.pointerDown", "params": { "context": 123, "x": 20, "y": 30, "button": 0 } }
{ "id": 4, "method": "umbrafox.input.pointerUp", "params": { "context": 123, "button": 0 } }
{ "id": 5, "method": "umbrafox.input.click", "params": { "context": 123, "x": 40, "y": 50 } }
{ "id": 6, "method": "umbrafox.input.wheel", "params": { "context": 123, "x": 60, "y": 70, "deltaY": 25 } }
{ "id": 7, "method": "umbrafox.input.type", "params": { "context": 123, "text": "abc" } }
{ "id": 8, "method": "umbrafox.input.keyDown", "params": { "context": 123, "key": "\uE006" } }
{ "id": 9, "method": "umbrafox.input.keyUp", "params": { "context": 123, "key": "\uE006" } }
```

## Files changed

- `toolkit/components/umbrafox/UmbrafoxControlInput.sys.mjs`
- `toolkit/components/umbrafox/UmbrafoxControlService.sys.mjs`
- `toolkit/actors/UmbrafoxControlInputChild.sys.mjs`
- `toolkit/actors/UmbrafoxControlInputParent.sys.mjs`
- `toolkit/actors/moz.build`
- `toolkit/modules/ActorManagerParent.sys.mjs`
- `toolkit/components/umbrafox/moz.build`
- `toolkit/components/umbrafox/tests/browser/browser_control_input.js`
- `toolkit/components/umbrafox/tests/browser/browser.toml`
- `umbrafox-conversion-guide/plans/03-local-control-channel.md`

## Data flow

`UmbrafoxControlService.execute(...)` routes
`umbrafox.input.pointerMove` to `UmbrafoxControlInput.pointerMove(...)`.

The input module:

- resolves the top-level content `BrowsingContext`;
- chooses a start point from `fromX`/`fromY`, or the last tracked point for the
  context, or `(0, 0)`;
- creates a deterministic path using `linear`, `easeInOut`, or seeded `bezier`;
- dispatches each point through
  `remote/shared/webdriver/Event.sys.mjs`'s `synthesizeMouseAtPoint`;
- returns the generated path as an audit trace.

Pointer button, click, and wheel commands reuse the last tracked pointer point
when `x` and `y` are omitted. Keyboard commands dispatch to the active
`WindowGlobalParent` for the target browsing context. `type` sends a string as a
sequence of key events; `keyDown` and `keyUp` accept the same key values as
Firefox's WebDriver key data table, including WebDriver private-use key codes
such as `\uE006` for Enter.

The first slice only supports top-level browsing contexts. Frame-relative
coordinates should be handled in a later patch with explicit frame translation
tests.

## Rulebook notes

This command is not web-exposed. It is only reachable through the local
token-gated Umbrafox control channel. It does not add page globals, DOM APIs,
WebIDL, CSS behavior, storage keys, HTTP headers, or new page-visible Umbrafox
markers.

The generated events are normal synthesized browser events. Tests verify that
page JavaScript receives trusted mouse, wheel, keyboard, and input events at the
requested coordinates or focused target.

Profiles must remain deterministic and auditable. Do not add adaptive behavior
or site-specific tuning to target a particular bot classifier.

## Verification

```bash
./mach lint toolkit/components/umbrafox/UmbrafoxControlInput.sys.mjs toolkit/components/umbrafox/UmbrafoxControlService.sys.mjs toolkit/components/umbrafox/tests/browser/browser_control_input.js toolkit/components/umbrafox/tests/browser/browser.toml toolkit/components/umbrafox/moz.build
./mach build faster
./mach test --headless toolkit/components/umbrafox/tests/browser/browser_control_input.js
./mach test --headless toolkit/components/umbrafox/tests/browser
```

## Rebase notes

Expected conflict hotspots:

- `toolkit/components/umbrafox/UmbrafoxControlService.sys.mjs` when new command
  routing is added.
- `remote/shared/webdriver/Event.sys.mjs` if upstream changes event synthesis
  helper signatures.
- `toolkit/components/umbrafox/tests/browser/browser.toml` when adding new
  control-channel tests.
