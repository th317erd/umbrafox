# Allocation-Free Render Pass Markers

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Evidence And Contract

The October6 saved stall has one Renderer sample through format_inner and PHC
stack walking. Exact source unconditionally formats `pass N` before asking the
GPU backend whether markers are supported. It is inside draw_frame, which the
tested binary inlines into render_impl. This is removable work regardless of
whether it explains the full stall. Do not disable PHC, stack walking or markers.

The candidate changes only this pass-label path and its private helper. Preserve
the exact decimal label, marker nesting, push/pop lifetime and non-Android gate.
Unsupported markers must not format or allocate. Supported markers use bounded
stack storage and the existing synchronous backend push, retaining the backend
until the marker drops. Static-label markers and query/timer APIs stay unchanged.
No dependency, default, public interface, pixel arithmetic or GL command order
changes. This complies with the mandatory Firefox parity rulebook.

## Territory And Verification

Producer: Renderer::draw_frame pass enumeration. Consumer: GpuProfiler followed
by GpuQueryBackend and GlQueries KHR/EXT/None. The backend takes a borrowed label
only for the synchronous push; existing temporary Strings already require this
contract. GpuMarker owns an Rc and pops on drop, not a reference to the label.
Other static marker callers remain unchanged. The index is usize, so capacity
5+usize::BITS bytes exceeds prefix plus the maximum decimal digits on every
supported target; standard formatting avoids new integer-conversion logic.

First reproduce the unwanted allocation using the exact current query.rs and
extracted production call in a bounded standalone Rust harness. Its GpuFrameId
and GpuProfileTag dependencies are stand-ins, explicitly not full WebRender or
driver proof. Count allocations only around marker construction/drop using a
nonallocating fake backend; require exact old labels and RAII behavior too.
Preserve RED before changing the product. Then add retained in-tree unit tests
for supported/unsupported modes, zero/powers/max indices, nesting and unwind.

Run the same allocation harness against the changed production call, with10s
compile and10s execution watchdogs and one test thread. Confirm native/compiler
errors are not counted as behavioral RED. Inspect the actual delta and check
unchanged preexisting rendering edits by reverse-delta hashes.

Full native WebRender/browser compilation and a matched unprofiled acceptance
comparison remain required before release or performance claims. No installation
or daily-browser control follows from this source/mechanism phase. Keep all
existing baseline captures immutable and the broader optimization goal active.

## Matched Playback Gate

The normal native build and self-contained package passed. The two46-file
packages differ only in libxul.so; their common BuildID is20261006175655.
Baseline manifest a7d80698828618f3d0c3e9f760e6fe8b63a72f3f93ba8dabcb132581c8784e87;
candidate manifest4c8085f0f675c5b183976807df38bb99474bbd8be2e58651b52e4be9176eee8e.
Use these hashes, never the BuildID alone. No installation into the daily launcher.

One prospective A1/B1/B2/A2 sequence on wyatt-laptop, using the unchanged48s
owned1920x1080 H.264 fixture,320x180canvas and four12s phases with1/4/4/1copies.
Both variants explicitly use the same experimental import ON setting solely in
their disposable profiles. Product default remainsOFF. Profiler staysOFF and
no per-frame readback/diagnostic is added. This isolates the marker change on
the path with the recorded renderer stall; default-OFF and real-site follow-ups
remain separate. No retry, dropped arm, pooled historical run or threshold change.

Reuse the reviewed driver, native-root receipts, strict manifests, fresh private
installation/profile/app-data/local-data/temp roots, monitor and owned cleanup.
All142 prior runtime inputs must remain unchanged; add only private adapters.
Retain120s capture/105s work/15s cleanup,220s driver/240sSSH,256MiB sampled
artifact cap,4GiB memory/disk minimum and no browser/compiler on the laptop.
Wait15s before each preflight. Export only the existing bounded public allowlist.
Admit each completed prefix and exact recorded PID absence before the next arm.

Prospective regression checks: at least200callbacks perphase, accelerated
start/end in every arm, unchanged profile settings, no candidate phase with
more video drops or >50ms callback gaps than the worse baseline phase. Candidate
joined CPU rate must be at most1.05times the worse baseline rate; four-copy
median/P95 at most worse baseline+1ms (one recorded clock quantum). These are
regression screening, not the separate GPU-import optimization's29criteria.
Report every count, CPU rate, tail and failed check. A pass is not a speedup or
proof of rare-stall elimination; four processes are descriptive observations.

Before implementation: test exact package/mode/host/display rejection, literal
driver/export lifecycle equivalence, forged/mixed/order/partial inputs and
synthetic CPU/drop/gap/tail regressions. Pure checks use10s; actual bounded
browser integration supplies the missing runtime evidence. Source/frame-tag
stand-ins or fake cleanup cannot substitute for it. Archive every failure.

First-arm offline admission caught a serialization mismatch: the pinned driver
records the complete two-entry manifests map and selected mode, not a singular
manifestSHA256. Neither capture nor driver is changed between arms. The analyzer
now requires that exact map, mode and preflight hash, and additionally joins all
four captured native/INI hashes and copied INI bytes to the selected full package.
Saved A1 and five map/mode corruption cases test this correction. The failed
analysis log is retained; no recorded result is altered, no gate relaxed and
no browser rerun occurs. This is schema interpretation, not new runtime evidence.
