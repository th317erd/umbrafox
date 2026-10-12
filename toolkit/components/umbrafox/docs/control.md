# UmbraLink remote control

UmbraLink is a privileged owner-local loopback service. Its token authorizes
control of the browser, including arbitrary privileged code execution. Protect
`<profile>/umbrafox/control.json` as a credential. Never expose the endpoint to
untrusted clients. These commands do not start Marionette, the Remote Agent or
WebDriver, change `navigator.webdriver`, or install page globals. Explicitly
requested scripts and navigation can of course change the page being controlled.

Commands use the existing authenticated JSON WebSocket envelope:

```json
{"id":1,"method":"umbrafox.script.execute","params":{"context":42,"body":"return document.title;"}}
```

## Tab control

Obtain context IDs from `umbrafox.diagnostics.snapshot`. Context IDs must be
positive integers and refer to live browser tabs. No command implicitly targets
the selected tab.

- `umbrafox.browsingContext.create`: `context` identifies the existing tab whose
  browser window should contain the new blank tab. `background` defaults to true.
  The new tab uses the window's normal default tab settings; it does not implicitly
  copy the reference tab's container. The result identifies the new context.
- `umbrafox.browsingContext.navigate`: `context`, absolute `url`, optional `wait`
  (`complete`, the default, or `none`) and `timeoutMs`. `none` acknowledges
  navigation start, not loading completion. Redirects and same-document loads
  use Gecko's existing progress listener. Completion is a load boundary, not
  network idle, successful HTTP status or application readiness.
- `umbrafox.browsingContext.close`: closes only the specified tab. It refuses the
  last tab in a window. `closed:false` means closure did not complete immediately
  (for example, a beforeunload prompt); clients must not assume it was forced.

Navigation accepts HTTP, HTTPS, about, file and data URLs, using a privileged
browser-initiated load. External-protocol launches and `javascript:` URLs are
not accepted by this command. Use explicit script execution for JavaScript.
Timeout/disconnect removes the command's wait/listeners; it does not stop a
navigation already issued or reverse page side effects. A concurrent user/page
navigation can supersede a load: inspect the returned final URL and document.

Results contain `context`, `document` (inner-window ID, when available), and
`url`. Use the returned context after navigation, since Gecko can replace it.

## JavaScript execution

`umbrafox.script.execute` accepts:

- `context`: target tab or, for the page realm, a content frame context.
- `realm`: `page` (default) or the explicitly privileged `browser` realm.
- `body`: an async function body, at most 65536 UTF-16 code units. Use `return` to
  return a value; top-level `await` is supported inside that function.
- `args`: optional JSON array available as the function's `arguments`.
- `document`: optional expected inner-window ID. A mismatch rejects before
  execution; a replacement during execution rejects the result.
- `timeoutMs`: integer1..60000, default10000.

The page realm executes in a fresh page-principal sandbox with the target window
as prototype, not a system-principal content script. It can read page properties
and manipulate the DOM through `window` and `document`. Local declarations and
argument plumbing remain in the disposable sandbox, not the page global. Use
explicit `window.property` for deliberate persistent page mutations. No
privileged `Services` binding is provided in this realm.

The browser realm requires a top-level tab context and executes with system
privileges against that tab's containing chrome window. It has `Services` and
privileged Components access and can read private data, change preferences,
access files, or close the browser. This is full owner control, NOT isolation
from the authenticated client. Do not execute untrusted page-supplied strings
in this realm. Its bookkeeping is never injected into a content global.

Example page command:

```json
{"id":2,"method":"umbrafox.script.execute","params":{"context":42,"realm":"page","body":"return {title: document.title, readyState: document.readyState};"}}
```

Example explicit parent command:

```json
{"id":3,"method":"umbrafox.script.execute","params":{"context":42,"realm":"browser","body":"return {pid: Services.appinfo.processID, version: Services.appinfo.version};"}}
```

Replies include context/document/URL/realm and a `result` envelope. Undefined
returns `{"type":"undefined"}`. JSON data returns
`{"type":"json","value":...}`. Only finite numbers, strings, booleans, null,
dense arrays and plain data objects are supported. Functions, DOM objects,
accessors, cycles, symbols, bigint and unsupported objects cause `serialization
error`, not silent conversion to null/empty objects. Results/arguments have a
1MiB serialized limit,10000 visited values and depth32. Serialization can execute
proxy traps; it is not safe processing of arbitrary hostile objects.

Execution is limited to one outstanding operation per context and16 overall
in the parent controller. Conflicts return `busy`, never queue execution against
a later document. Page actor destruction, pagehide, connection closure or timeout
ends the wait and disposes the evaluation sandbox. No persistent object handles
or supported long-lived sandbox callbacks are retained. Browser-window scripts
can still deliberately create effects outside the sandbox; they are not rolled
back. Promise continuations or page-owned effects must not be treated as canceled
merely because a reply timed out.

**Timeout is not a CPU watchdog.** Infinite synchronous JavaScript, getters or
proxy traps can block the content process, or the parent in browser realm, before
the timer can run. Disposing a sandbox is not an OS/process sandbox or guaranteed
preemption. Scripts must cooperate and stay bounded. Never automatically kill or
restart a user's browser to recover a timed-out command.

## Verification

Pure supplied-data/fake browser tests (no browser launch):

```sh
timeout 30 node --unhandled-rejections=strict --test tools/umbrafox/tests/control/control-spec.mjs
```

The browser integration test exercises the authenticated transport, page and
parent execution, serialization, asynchronous timeout, stale documents, cross-
origin/same-document navigation and explicit tab lifecycle. It compares actual
page-global names, selected prototypes and webdriver before/after execution,
including private and container tabs. Run it only in an
approved isolated test browser, never by attaching to the owner's work browser:

```sh
./mach test --headless toolkit/components/umbrafox/tests/browser/browser_control_browser.js
```

Run the existing control-service/input suites as adjacent regressions. Pure tests
do not prove Gecko actor routing, principals, CSP/private/container behavior or
public-interface parity; those remain browser integration/review gates before
packaging and installation.

Mochitest itself enables automation. A separate OFF/ON test launches two fresh,
headless processes without automation flags and uses an ordinary local page to
report its own globals, prototype descriptors, native function strings and DOM.
It requires webdriver to remain false, exercises read-only page/browser commands,
checks native application-data paths, and stops only its owned process groups:

```sh
timeout 120 node tools/umbrafox/tests/control/parity-smoke.mjs ABS_BINARY NEW_ABS_OUTPUT
```

The output parent must already exist. This test compares the same build with
UmbraLink OFF and ON; it is not a comprehensive comparison against an independent
stock Firefox build, a performance benchmark, or proof of network isolation.
