# Experimental EGL external-video candidate

## Status

Implementation, ARM build/package and independent package validation succeeded.
This is a default-off experimental candidate, not production
acceptance and not a claim that the prototype's Pi performance transfers.
No desktop installation, Pi deployment or owner-browser execution was performed.

- [ARM archive](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/exports/umbrafox-hybrid-20261019063025/umbrafox-hybrid-20261019063025-linux-aarch64.tar.xz), 100325400 bytes.
- SHA256: `fac5017606879b8ed8b9dd4f7490df95a85a2bec8c3a1892cb283352e459a515`.
- [Machine-readable package receipt](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/exports/umbrafox-hybrid-20261019063025/package-input.json).
- [Exact source patch](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/exports/umbrafox-hybrid-20261019063025/hybrid-source.patch).

This is the normal `mach package` archive, copied byte-identically, without a
beta overlay. Verification checked 28 AArch64 ELF payloads, dependency files,
application/platform/native BuildID agreement, extracted/staged/archive equality,
frontend ZIP CRC/inventories, 25 owned input pins and 485132 unchanged base files
before and after verification. No signing or native execution is implied.

## Behavior

`gfx.webrender.compositor.external-surfaces-in-draw` is a restart-scoped boolean,
default **false**. It replaces the prototype's marker-file switch. A separate
Draw-external interface admits only the frontmost opaque fullscreen YUV surface:
identity transform, no cropping/rounded clip, eight-bit BT709 limited NV12/I420.
The renderer uses the resolved image index, not an unrelated descriptor index.
The existing promotion rules and Native/Layer compositor queues are unchanged.

One reusable external Wayland child is synchronized with the EGL parent swap.
No native-ID accumulation, per-frame main-thread task or parent callback takeover
is introduced. Fences remain. Rejection, failed frame setup, cancellation and
unmapping clear the child; screenshots/readback and unsupported scenes draw
normally. The optional interface disables partial present to repaint fallback.
Local attach success authorizes omission, but is not server import acknowledgment.

Import admission checks the exact wire FOURCC and all plane modifiers against a
copied, mutex-protected completed-feedback snapshot. Unknown, mixed or INVALID
modifiers reject. The raw legacy feedback getters are not generally thread-safe;
the new render caller uses the snapshot. YUV params are destroyed after
`create_immed`, correcting a leak per new import, not necessarily per frame.

## Critical Compatibility Limit

The new backend requires the color-representation protocol and advertised BT709
limited-range support. Upstream Cage 0.2.1/wlroots 0.19 lacks this capability, so
the optimization falls back there. The exact custom Pi registry is unverified.
A newer library alone is insufficient: the compositor must expose the manager.
See the [plan's protocol evidence](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/bot-docs/plans/egl-external-video.md).
No silent relaxation to implementation-defined YUV color conversion is included.

Explicit format/modifier advertisement also does not guarantee import success.
The existing `create_immed` path can still encounter a fatal asynchronous protocol
error. Nonfatal `create`/`created`/`failed` handling is future work. Validate only
in a disposable test profile; keep the default off pending real acceptance.

## Build Identity

- Base revision: `9a9057291b5b5dd1c1362a2cc58551990532a6f6`.
- BuildID: `20261019063025`; AArch64, Wayland, V4L2, optimized, no DEBUG/probes.
- Toolchain: retained Clang 22.1.8 and Rust 1.94; make/Cargo two jobs.
- Source: exact Git archive plus 25 explicitly owned files, not a dirty-tree copy.
- Freeze: `0961885084d21c511294e4576dcb1facc38e376b8e6738651399654a0172a441`.
- [Build evidence directory](/home/public/wyatt-desktop/.cache/codex/umbrafox-hybrid-arm-20261019-candidate1/evidence).
  `source-freeze-3.json`, `hybrid-source-3.patch` and matching configure/build/
  package attempt/exit receipts bind the final inputs. Earlier revisions remain.

## Verification

| Check | Result and scope |
| --- | --- |
| WR library | 176 pass, including 11 selector/configuration tests; two original assertion failures retained |
| SWGL compositor surfaces | 16 pass, zero fail; software fallback, not native Wayland |
| SWGL invalidation | Exit 0, 11 PASS comparisons; no native Wayland claim |
| Native admission/snapshot fixtures | AArch64 object compiles; behavioral execution not performed |
| ARM build | Initial full build 8839s; final correction rebuild 342s, both exit 0 |
| Normal `mach package` | 48s, exit 0, no remaining owned process group |
| Package verifier | Seven pure regression tests pass; actual package validation exit 0 under 900s/2GiB bound |
| Formatting | Edited C++ passes; whole-file check retains one identical HEAD namespace warning |
| Whitespace | Scoped `git diff --check` passes |

Full logs are under
[/artifacts](/home/public/wyatt-desktop/Projects/umbrafox-workspace/umbrafox/artifacts),
named `hybrid-*`; long commands were bounded and their output retained.
The first native test compile failed because a fixture retained `already_AddRefed`
instead of `RefPtr`; corrected fixture compiled. Source revision 2 first timed
out after copying, then explicit resume verified every unchanged base file.
The first package verifier rejected the share-root alias before extraction;
the new root-resolution regression retains strict interior-symlink rejection.

A separate untracked local compositor example was not in the archived base.
Its missing Draw field reproduced compiler E0063 in a constructor-only metadata
check, then compiled with `external_compositor: None`. The one-line local fix is
retained in `hybrid-local-example-compatibility.patch`, not silently added to the
browser source export. This is not a full standalone-example build claim.

## Review And Remaining Acceptance

Source review covered ordering/index domains, fallback damage, capture,
parent/child lock ownership, teardown, same-buffer fences, format/metadata
admission and feedback publication. The new pref adds no web API, request header,
DOM field, diagnostic marker or site-specific behavior. Default-off keeps the
existing presentation route; no default-on Firefox-parity claim is made.

l8ros owns the remaining runtime checks on the exact exported package: actual
color/format protocol capabilities; fullscreen and foreground-UI fallback; seek,
navigation, hide/remap, teardown and resource retirement; capture correctness;
failed import; 1080p60 >=57fps/<5% drops, page >=470/480 intervals <=18ms,
1080p30 and 720p60. Counter totals or DOM screenshots alone do not prove the
external layer's visual correctness or DRM plane assignment. Native gtests,
Wayland fault/lifecycle execution, full CI and hardware acceptance are unrun.

Frozen earlier diagnostics remain held. This artifact does not assert historical
argv recovery, whole-link diagnostic certification, signing or release approval.
The l8ros websocket recipient was not loaded at handoff time; no message delivery
is claimed. This report and the exported receipt are the durable handoff.
