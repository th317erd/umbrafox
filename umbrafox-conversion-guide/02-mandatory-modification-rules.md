# Mandatory modification rules

These rules govern all Umbrafox source changes. They are not preferences or design suggestions. A patch that violates them should not be accepted.

Umbrafox is allowed to give the user more control over their own browsing experience. Umbrafox is not allowed to create a web-visible browser identity distinct from Firefox, and it is not allowed to make site scripts or servers able to distinguish Umbrafox from the matching Firefox build.

The rules are ordered by priority. When rules appear to conflict, preserve web-visible Firefox parity first. User control and feature reduction must be implemented in ways that do not make Umbrafox detectable by default.

## Rule 1: No web-visible Umbrafox fingerprint

We will never deliberately or accidentally make it possible for websites, scripts, stylesheets, workers, frames, network services, or servers to detect that Umbrafox is different from Firefox.

The user agent must remain identical to the corresponding Firefox build. This applies to all UA surfaces:

- `User-Agent` request header.
- `navigator.userAgent`.
- User-Agent Client Hints, if enabled by upstream Firefox.
- App, version, and platform fields exposed to web content.
- HTTP headers that are part of the browser's normal request shape.
- Fetch, XHR, WebSocket, and EventSource behavior.
- Service worker behavior.
- Worker and worklet globals.

Umbrafox must not add, remove, or alter any web-exposed CSS, JavaScript, DOM, WebIDL, network, or storage surface in a way that identifies it as Umbrafox.

Forbidden examples:

- Adding `navigator.umbrafox`, `window.umbrafox`, `document.umbrafox`, or any equivalent marker.
- Adding Umbrafox-specific CSS media features, pseudo-classes, pseudo-elements, CSS properties, or computed style behavior.
- Adding Umbrafox-specific DOM attributes, events, exception messages, stack frame names, console messages visible to page scripts, or permissions names.
- Adding custom request headers such as `X-Umbrafox`, altered `Sec-*` behavior, or distinctive Accept header ordering.
- Changing canvas, WebGL, audio, font, codec, media, timing, storage quota, permissions, or feature-detection results unless the result remains identical to matching Firefox.
- Changing error types, rejection timing, event order, CORS behavior, CSP behavior, or service worker interception behavior in a distinguishable way.
- Exposing different extension IDs, protocol handlers, MIME handlers, plugin lists, PDF viewer markers, or built-in page integration to websites.

Allowed exceptions:

- Userland customization. Users can install extensions, scripts, styles, certificates, proxies, or configuration that make their own browser detectable. That detectability belongs to the user.
- Browser chrome and internal pages such as `about:preferences`, `about:support`, `about:welcome`, and other privileged UI may identify Umbrafox when the content is not exposed to arbitrary websites.
- Build metadata and executable branding may identify Umbrafox when it is not observable by websites or remote page servers.

## Rule 2: Prefer interception and substitution over blocking

Umbrafox should avoid outright blocking whenever a website could observe the absence, failure, timing, or shape of a request.

The default pattern is:

1. Let the browser initiate the request in a way that matches Firefox's normal request shape.
2. Observe and classify the request client-side.
3. Preserve externally visible network semantics as much as practical.
4. Substitute the response content inside the client before web content consumes it.

This applies to:

- Images.
- Video and audio.
- Stylesheets.
- JavaScript.
- Fonts.
- Documents and frames.
- Fetch/XHR payloads.
- Tracking pixels and beacons.
- Any future resource type where page-visible failure is detectable.

The substitution should be boring to page code. Page scripts should see a successful load where Firefox would have produced a successful load, with compatible event timing, dimensions, metadata, MIME type, CORS behavior, cache behavior, and decode behavior.

Examples:

- An unwanted image should become a valid transparent, white, black, or otherwise configured replacement image, not a broken image icon, unless Firefox would also have failed.
- An unwanted video should become a valid media resource or stream shape that satisfies element loading semantics, not a distinctive network error.
- An unwanted stylesheet should become a syntactically valid stylesheet with neutralized rules, not a failed stylesheet request.
- An unwanted script should become syntactically valid JavaScript that preserves load/error semantics while performing no unwanted behavior.

## Rule 3: Dangerous user control is intentional

Umbrafox exists to give the user full control of their own browsing experience. We will strive to let users hijack, rewrite, replace, disable, proxy, inspect, and automate any browser behavior they choose.

This includes dangerous capabilities on purpose:

- Disable native browser alerts, prompts, dialogs, and notification flows.
- Disable opening external links, globally or for specific sites.
- Intercept, rewrite, substitute, proxy, or block any network request, including sockets and long-lived connections.
- Control page styles and browser-applied styles.
- Inject scripts into documents, workers, frames, and other execution contexts where technically possible.
- Proxy or rewrite any resource type.
- Embed user scripts inside, before, after, or around other scripts where technically possible.
- Override browser defaults, site defaults, and resource behavior at fine granularity.

This tool is a sharp knife. We will act accordingly.

That means:

- Dangerous controls must be explicit user controls, not accidental defaults.
- Dangerous controls should be inspectable, reversible, and attributable to user configuration where practical.
- If a feature can break sites, weaken security, expose private data, or make the user detectable, that risk must be clearly represented to the user.
- We will eventually show a startup warning explaining that Umbrafox permits dangerous browser modifications, that users can damage their own browsing/security/privacy, and that they must accept responsibility before using those capabilities.

Userland is allowed to be detectable. If the user intentionally configures detectable behavior, installs detectable scripts, or chooses detectable block/substitution rules, that detectability belongs to the user. Umbrafox defaults must still remain Firefox-equivalent.

## Rule 4: Stay unobtrusive and out of the user's way

Umbrafox should be as unobtrusive, unannoying, and out of the user's face as possible.

Umbrafox is opinionated about:

- Privacy.
- User control.
- User ownership of the browsing experience.
- The user's right to dissect, intercept, customize, and rewrite websites on their own machine.

Umbrafox should otherwise avoid imposing on users.

Default product behavior should prefer:

- Quiet UI.
- Minimal prompts.
- No marketing surfaces.
- No sponsored surfaces.
- No unnecessary onboarding.
- No nagging.
- No remote experiments or surprise feature changes.
- Clear power-user controls when controls are needed.

Exceptions are allowed for security-critical warnings, the planned dangerous-capabilities startup acknowledgement, and cases where the user explicitly asks for a more visible workflow.

## Rule 5: Rule compliance is mandatory

All rules in this file must be strictly followed.

Agents, contributors, and maintainers must check this rulebook before implementing any Umbrafox change. Before coding, they must be able to explain why the requested change does not violate these rules.

If a user asks for a change that violates or appears to violate these rules:

1. Push back clearly.
2. Do not implement the change as requested.
3. Explain which rule is at issue.
4. Discuss alternatives that satisfy the user's goal without violating the rulebook.
5. Only proceed with an exception after explicit discussion, mutual agreement, and documentation of the exception.

No agent should silently bypass this rulebook because a request is urgent, interesting, technically easy, or requested by the project owner. Rule exceptions require deliberate conversation.

## Rule 6: Minimize features and complexity without becoming detectable

Umbrafox should be streamlined, small, efficient, and aimed at power users.

We should remove, disable, or hide features when doing so reduces complexity, noise, maintenance burden, attack surface, sponsored surfaces, remote control, or user annoyance.

However, minimization must never violate the detectability rule.

If removing or disabling a feature would make websites or servers detect Umbrafox, then choose one of these instead:

- Preserve the feature's web-visible interface while making it inert internally.
- Lie through JavaScript, DOM, CSS, WebIDL, or other web-facing interfaces so the result matches Firefox.
- Substitute compatible behavior client-side.
- Leave the feature alone until an undetectable design exists.

Never remove a web-exposed feature merely because we dislike it if its absence creates a fingerprint.

Examples:

- If Firefox exposes an API to websites, Umbrafox should expose the same API shape unless there is a Firefox-matching reason not to.
- If a feature is disabled internally, feature detection should still match Firefox when a website checks it.
- If a browser surface is removed from chrome UI, page-visible behavior must still match Firefox.

## Rule 7: Request-shape equivalence is mandatory

Substitution must not create a new network fingerprint.

A HEAD request is not automatically equivalent to a GET request. Servers can observe method, headers, range behavior, cookies, cache validators, redirects, request timing, connection reuse, TLS behavior, HTTP version, priority, and whether the body is downloaded.

Therefore:

- Use HEAD only when the matching Firefox/page behavior would also use HEAD, or when we have proven the target cannot distinguish it.
- If the page would perform GET, the safest default is to preserve GET semantics and substitute downstream in the client.
- If bandwidth reduction is required, prefer techniques that preserve request semantics from the server's perspective, such as normal cache validation, range behavior that Firefox already uses, or stream truncation only after enough metadata has been obtained and only when truncation is not externally observable.
- Never replace a request with a different method, header set, redirect path, credential mode, cache mode, priority, TLS profile, HTTP protocol, or DNS behavior unless the result remains indistinguishable from Firefox.

## Rule 8: No distinguishable JavaScript, CSS, or DOM side effects

Any interception or customization that affects page-observable behavior must preserve Firefox-compatible semantics.

Patch authors must consider:

- Load/error event order.
- Promise resolution and rejection timing.
- Resource Timing entries.
- PerformanceObserver output.
- Console-visible errors and warnings.
- CSP and SRI outcomes.
- CORS outcomes.
- Referrer policy behavior.
- Service worker visibility.
- Cache API behavior.
- HTTP cache state.
- Element natural dimensions and media metadata.
- MIME sniffing behavior.
- Stack traces and exception messages.

If a substitution would create a detectable mismatch, the patch must either redesign the substitution or mark the feature as userland-only/off-by-default with explicit user control.

## Rule 9: No site-specific identity deals

Umbrafox must not make special web-visible identity exceptions for individual sites, advertisers, search engines, CDNs, analytics providers, anti-bot vendors, or payment processors.

Allowed:

- Site-specific compatibility fixes that make Umbrafox more like Firefox.
- User-configured per-site behavior.
- Internal compatibility shims that are not remotely detectable.

Forbidden:

- Sending different headers to one site because it is Umbrafox.
- Exposing Umbrafox-specific APIs to trusted sites.
- Maintaining an allowlist of sites that can detect Umbrafox.
- Breaking Firefox parity to satisfy a partner, advertiser, or service.

## Rule 10: User control belongs above stealth machinery

Umbrafox can give users explicit controls for what they want to see, hide, replace, intercept, log, inspect, or rewrite.

Those controls must not leak into the web platform by default.

Acceptable:

- Browser chrome controls.
- DevTools-style inspection panels.
- Internal logs.
- User-authored rules.
- Explicit user opt-ins that may be detectable, with clear labeling.

Not acceptable:

- Default behavior that marks requests or DOM with Umbrafox rule IDs.
- Page-visible comments, attributes, generated class names, global variables, or source URLs that reveal Umbrafox.
- Default replacement assets with stable, unique fingerprints across Umbrafox users if websites can inspect them.

## Rule 11: Detectability review is required

Every patch touching web-exposed behavior must include a detectability review before it is considered complete.

The review should answer:

- Does this change alter any HTTP request, response, timing, TLS, DNS, or cache behavior visible to a server?
- Does this change alter any JavaScript, CSS, DOM, WebIDL, storage, permission, media, canvas, WebGL, font, worker, service worker, or performance API result visible to a page?
- Does this change alter load/error behavior for any resource?
- Does this change add any Umbrafox-specific name, string, ID, URL, class, marker, or diagnostic to web content?
- Does this change behave differently in private browsing, containers, first-party isolation, resist-fingerprinting modes, or extension contexts?
- Does this change preserve Firefox behavior when the user has not enabled a custom rule?

If the answer is uncertain, the patch is not ready.

## Rule 12: Tests must target Firefox parity

Tests for interception and customization features must include parity checks against Firefox behavior wherever practical.

Good tests:

- Compare request method, headers, credentials mode, cache mode, redirects, and timing-sensitive event order.
- Verify no Umbrafox-specific web globals exist.
- Verify replacement resources load successfully and produce Firefox-compatible element events.
- Verify blocked/replaced resources do not produce distinctive errors.
- Verify Resource Timing, PerformanceObserver, CSP, CORS, and service worker behavior when relevant.

Bad tests:

- Only checking that unwanted content disappears visually.
- Only checking that a request was canceled.
- Only checking browser chrome behavior while ignoring page-observable behavior.

## Rule 13: Blocking is a last resort

Outright blocking is acceptable only when one of these is true:

- The user explicitly requested a detectable block.
- Firefox itself would block the request under the same conditions.
- The target is a browser-internal request not visible to websites or remote page servers.
- A security requirement makes substitution unsafe.
- We have no technically viable substitution path, and the feature is clearly labeled as detectable.

When blocking is used, document why substitution was not used.

## Rule 14: Internal branding must stay separated from web identity

Umbrafox can be Umbrafox in:

- Application name.
- Icons.
- Installers.
- Browser chrome.
- Internal pages.
- Documentation.
- Repository metadata.

Umbrafox must remain Firefox-equivalent in:

- Web request identity.
- Web-exposed JavaScript.
- Web-exposed CSS.
- DOM and WebIDL surfaces.
- Server-observable protocol behavior.
- Page-observable timing and resource behavior.

This separation is a core architectural rule.
