# Recipe 12: Local control input

## Goal

Add the first native input command to the independent Umbrafox local control
channel without starting Firefox Remote Agent, Marionette, or WebDriver BiDi.

The initial command is:

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

## Files changed

- `toolkit/components/umbrafox/UmbrafoxControlInput.sys.mjs`
- `toolkit/components/umbrafox/UmbrafoxControlService.sys.mjs`
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

The first slice only supports top-level browsing contexts. Frame-relative
coordinates should be handled in a later patch with explicit frame translation
tests.

## Rulebook notes

This command is not web-exposed. It is only reachable through the local
token-gated Umbrafox control channel. It does not add page globals, DOM APIs,
WebIDL, CSS behavior, storage keys, HTTP headers, or new page-visible Umbrafox
markers.

The generated events are normal synthesized browser events. Tests verify that
page JavaScript receives trusted mouse events at the requested coordinates.

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
