# Inline Inactive Mutation Gate

## Change

The previous preference-mirror change removed the named preference lookup.
Its remaining inactive path still called an out-of-line native function.
The new candidate makes `ShouldDispatchMutation` an inline mirror check and
calls private `ShouldDispatchActiveMutation` only when the mirror is true.

Production changes are limited to `dom/base/UmbrafoxUserlandMutation.h` and
`.cpp`. The existing native test adds repeated active/inactive null-target and
detached-document rejection checks. No DOM caller or mutation algorithm changes.
The saved-source comparison verifies that all remaining native checks and
dispatch bodies are exactly unchanged. The atomic mirror is still read on each
call; this is not an independently cached enablement value.

The only evaluation-order difference is that the atomic preference read now
precedes the recursion-depth check. Neither read runs script. The enabled path
still applies recursion protection, null rejection, `IsSafeToRunScript`, document
readiness, browsing-context and observer admission before allocating a bag.
Cross-process preference delivery remains asynchronous and unchanged.

## Compiler Evidence

A minimal caller compiled with `mach compileflags` fails the predeclared inline
check before the edit and passes afterward. This RED is a compiler-shape test,
not a newly discovered correctness bug. The emitted false path reads the live
mirror and returns without calling the out-of-line gate.

Actual old/new `CharacterData::SetTextInternal` disassembly confirms the same
mechanism in a real DOM caller. The old code unconditionally calls the gate at
`0x608fa52`; the new code loads the mirror at `0x608fa39` and branches over the
active call at `0x608fa5e` when false. These addresses describe only the saved
binaries. Its stack allocation also changes from `0x228` to `0x208` bytes.
Compiler reshaping beyond the call itself prevents assigning all measured text
update savings to the standalone gate's nanosecond difference.

Initial disassembly attempts with a comma-containing demangled signature and
then a mangled name plus `--demangle` returned warnings and no function body.
Those outputs are retained and unused. The accepted `*-character-*-raw.txt`
files use the exact mangled symbol without `--demangle`.

## Measurements

The unchanged disabled gtest survey runs eight rotated rounds of four modes,
one million iterations each, in three fresh native processes per build. An
exact saved-source comparison proves the complete timed survey body unchanged.
Both waves use private profile/application-data roots and await sampled absence
of compiler processes before timing. No browser-wide or video gain follows.

Values below are medians of the three process medians, in nanoseconds:

| Preference action | Operation | Before | Candidate |
| --- | --- | ---: | ---: |
| No user value | Gate | 1.674 | 0.326 |
| Explicit false | Gate | 1.769 | 0.323 |
| No user value | Native one-character text update | 45.354 | 37.470 |
| Explicit false | Native one-character text update | 45.928 | 37.045 |
| Explicit false | Direct preference read control | 34.392 | 35.129 |
| Explicit false | Volatile atomic control | 0.163 | 0.164 |

The explicit-false observations are an 81.7% lower gate cost and 19.3% lower
minimal native text-update cost. These percentages apply only to these tiny
synthetic operations. Fixed before/after build order, three processes, correlated
rounds and uncontrolled host activity preclude a general effect estimate.
The no-user-value control timings also vary by about 5%; all samples are retained.
Saving 1.45 ns per gate call alone amounts to about 0.00145 ms per thousand calls.
No page call rate, attached layout, paint, video, cold startup or GPU gain was
measured in this follow-up. The candidate's enabled-path performance is unmeasured.

## Verification And Cleanup

- Native two-job binaries build: PASS, 78 seconds, zero compiler warnings.
- Native two-job gtest relink: PASS. All three candidate processes pass three
  native tests, including live mirror transitions and the disabled cost survey.
- Three adjacent browser suites: 218 assertions PASS, zero failures, 8.393 seconds.
- Extracted package runs those same suites: 218 PASS, zero failures, 7.933 seconds.
- Exact three-file registered clang-format/license/whitespace/trojan-source lint:
  zero errors, warnings or fixes. Scoped Git diff check passes.
- `mach package`: PASS, 176 seconds. Its default driver chose 16 jobs despite
  the attempted `MOZ_MAKE_FLAGS=-j2`; only the native builds are claimed two-job.
- Export: all 46 regular files equal the packaging staging tree. No symlinks.
  Isolated version command passes with its exact root absent afterward.
- Six native survey roots, both browser controllers and their eight recorded
  browser/server helper roots were observed absent after completion. This is not
  continuous process isolation or an OS-level network containment claim.
- The source index is byte-identical before/after. No staging or commit. The
  preceding 356-file request-latency evidence seal still passes unchanged.

The baseline gtest hash command initially used a nonexistent intermediate
library path and failed; the corrected `dist/bin/gtest/libxul.so` hash was saved
before rebuilding it. No missing-path result is treated as a hash receipt.
The browser/version logs retain the known sandbox namespace EPERM warning.
No personal profile, shared crash queue, discovery credential or owner tab was
read or changed. Native/browser tests use the existing headless drivers; visible
laptop testing remains separately consent-gated.

## Parity Review

No new JavaScript/CSS/DOM/WebIDL surface, marker, header, resource substitution,
error or default preference is introduced. The normal disabled route reaches
the same Firefox mutation code with less internal overhead. Explicit userland
handlers retain their existing veto/rewrite behavior and return values, verified
by the adjacent browser suites and repeated activation test. These tests do not
establish universal Firefox parity across all documents and privacy modes.
No private/container/extension policy was added or changed in this delta.

## Artifacts And Next Gate

- New uninstalled export: `exports/umbrafox-mutation-inline-candidate-20261003/`.
  Native BuildID remains `20261003071500`; use archive/libxul hashes to distinguish
  it from earlier packages. It includes other existing uninstalled changes.
- Baseline survey: `~/.cache/codex/mutation-gate-survey-corrected-20261003-98uLWO`.
- Candidate survey: `~/.cache/codex/mutation-gate-survey-corrected-20261003-IGjoGK`.
- Adjacent browser run: `~/.cache/codex/mutation-mirror-browser-final-20261003-5s5rm1`.
- Packaged browser run: `~/.cache/codex/mutation-mirror-browser-final-20261003-vV73R9`.
- Proof, source snapshots, comparison JSON, commands and logs:
  `artifacts/umbralink-control/mutation-inline-*`, `check-mutation-inline.mjs`,
  `analyze-mutation-inline.mjs`, `export-mutation-inline.mjs`.

The next performance gate for this candidate is a matched page-owned DOM test
using controlled package contents, not a claim from native microbenchmarks.
The higher-priority video branch still needs consent for temporary visible
laptop windows and a matched GPU/backend pixel comparison before playback work.
Neither candidate is installed, and the broad performance objective remains open.
