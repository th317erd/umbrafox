---
title: Testing Umbrafox
status: current
doc_type: guide
audience: [developers, QA, maintainers]
last_verified: 2026-10-27
canonical: true
---

# Testing Umbrafox

> **Current documentation.** Match test depth to the changed boundary; historical pass counts do not prove current HEAD.

## Documentation-only gate

```bash
python3 tools/umbrafox/docs/verify.py
git diff --check
```

## Userland

```bash
./mach lint toolkit/components/umbrafox toolkit/actors/UmbrafoxUserlandChild.sys.mjs toolkit/actors/UmbrafoxUserlandParent.sys.mjs
./mach xpcshell-test --force toolkit/components/umbrafox/tests/xpcshell
./mach test --headless toolkit/components/umbrafox/tests/browser/browser_userland_document_start.js
./mach test --headless toolkit/components/umbrafox/tests/browser/browser_userland_events.js
./mach test --headless toolkit/components/umbrafox/tests/browser/browser_userland_mutation_gate.js
```

Test the active behavior and the disabled/inert state. Include exact origin,
navigation/reload, parser order, error paths, cancellation, and process reuse.

## UmbraLink

```bash
./mach format toolkit/components/umbrafox tools/umbrafox
./mach lint toolkit/components/umbrafox
./mach test --headless toolkit/components/umbrafox/tests/browser/browser_control_service.js
./mach test --headless toolkit/components/umbrafox/tests/browser/browser_control_browser.js
./mach test --headless toolkit/components/umbrafox/tests/browser/browser_control_input.js
node --test tools/umbrafox/tests/control/control-spec.mjs
```

Exercise auth failure, malformed packets, unknown methods, stale contexts,
timeouts, disconnect cancellation, last-tab protection, file-name traversal
rejection, bounds, visibility, and no-WebDriver parity.

## Product defaults and chrome

Run the Umbrafox home/search tests, affected preferences/newtab browser tests,
panel chrome tests, CustomKeys tests, tab-media tests, and clipboard suites named
in the [verification inventory](../reference/verification-inventory.md). Use a
fresh profile for default-pref assertions.

## Graphics and media

Run the narrow Rust/GTest/Node/Python suites first. A source contract or unit
test does not replace a full link, package inspection, matching-artifact runtime
test, pixel/lifetime/fallback proof, or target-hardware gate.

## Full integration

For source changes that ship, finish with the build/package/install workflow,
clean-profile startup, Firefox-parity probes, and the relevant x86/ARM hardware
matrix. Do not use Marionette/Remote Agent flags for UmbraLink parity runs.
