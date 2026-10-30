---
title: Umbrafox configuration and preferences
status: current
doc_type: reference
audience: [users, developers, operators]
last_verified: 2026-10-27
canonical: true
---

# Umbrafox configuration and preferences

> **Current documentation.** Defaults apply to new profiles; existing user values may override them.

## UmbraLink

| Preference | Default | Meaning |
| --- | --- | --- |
| `umbrafox.control.enabled` | `false` | Start the owner-local control service. |
| `umbrafox.control.port` | `0` | Listening port; zero selects an ephemeral port. |

The app-menu toggle controls the enabled preference. Discovery comes from the
active profile's `umbrafox/control.json`; do not guess a fixed port or profile.

## Userland

| Preference | Ownership | Meaning |
| --- | --- | --- |
| `umbrafox.userlandScripts.active` | internal/mirrored | True while enabled document scripts are published. Native/content fast paths use it to remain inert otherwise. |

Do not set the active pref as a substitute for creating valid script records.
The registry/store own publication and lifecycle.

## Product defaults

Important fork defaults include `browser.shell.checkDefaultBrowser=false`,
`browser.startup.page=3`, search-suggestion and QuickSuggest reductions, and a
search-focused Activity Stream configuration. The exact current values live in
`browser/app/profile/firefox.js`; the conversion recipes describe why each
cluster exists.

## Opt-in and experimental configuration

- Chrome-style shortcuts are selected through the existing CustomKeys UI/store,
  not installed as the universal default.
- The performance beta launcher applies an isolated preference set and profile;
  it does not define ordinary Umbrafox behavior.
- Graphics/media candidate prefs and hardware capabilities must be inspected in
  the source/relevant recipe and never enabled from an old report by assumption.

## Precedence and profile behavior

Application defaults are the lowest layer. Existing `prefs.js`, policies,
command-line choices, test profiles, and launcher-applied preferences can win.
Always use a fresh or explicit profile when validating defaults. See
[profiles and caches](../operations/profiles-and-caches.md).
