---
title: Umbrafox repository source map
status: current
doc_type: reference
audience: [developers, maintainers, bots]
last_verified: 2026-10-27
canonical: true
---

# Umbrafox repository source map

> **Current documentation.** Routes fork concepts to their producers, consumers, tests, and supporting docs.

| Area | Primary implementation | Consumers/tests | Current documentation |
| --- | --- | --- | --- |
| Branding/identity | `browser/moz.configure`, `browser/branding/`, locales | build/package, chrome, updater | conversion recipes 01, 02, 07; identity leak log |
| Defaults/home | `browser/app/profile/firefox.js`, Activity Stream, preferences | newtab/preferences tests | recipes 03, 05, 06, 08 |
| Search policy | search dumps, `SearchEngineSelector.sys.mjs`, URL bar | selector/default tests | recipe 04 |
| Userland store/runtime | `toolkit/components/umbrafox/UmbrafoxUserland*.sys.mjs` | toolkit actors, Debugger, browser/xpcshell tests | architecture and API reference; recipes 09, 10 |
| Userland native hooks | docshell, DOM, script loader, SpiderMonkey, security manager, HTTP actors | userland browser tests | architecture; conversion architecture note |
| UmbraLink service | `UmbrafoxControlService.sys.mjs` and control modules | BrowserGlue, app menu, actors, control tests | UmbraLink architecture/protocol/operations; recipes 11, 12, 15 |
| BiDi experiment | `remote/webdriver-bidi/modules/root/umbrafox.sys.mjs` | xpcshell module test | recipe 11; not normal UmbraLink |
| Panel/tab UI | XUL popup manager, GTK window, customizable UI, tabbrowser | chrome/browser tests | recipes 13, 14 |
| Shortcut preset | CustomKeys modules/UI/locales | `browser_ChromePreset.js`, standalone spec | recipe 18 |
| Clipboard override | DOM/widget clipboard, actors, protection module, permissions/UI | GTest, browser, xpcshell, pure actor tests | recipe 19 |
| Canvas/DMABUF | canvas/WebGL, media IPC, layers, GL, GTK DMABUF | GTests and `tools/umbrafox/tests/readback/` | recipe 16; graphics architecture |
| WebRender/hybrid | WebRender Rust, bindings, EGL, NativeLayer/Wayland | Rust tests, hybrid contracts, archived evidence | recipe 17; graphics architecture |
| Media seek | audio stream/sink code | media GTests and archived reports | graphics architecture and archive |
| V4L2 H.264 | `media/ffvpx/` and decoder selection/build config | build/symbol/device gates | current status and roadmap |
| Performance tools | `tools/umbrafox/performance/`, beta launcher, live diagnose script | Node/Python tests and UmbraLink | testing/operations docs; archive performance index |

The [exact exception path inventory](exception-paths.tsv) is the authoritative
file-level checklist for the recorded upstream base.
