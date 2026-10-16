# Candidate Launcher Source Review

Session clipboard-20261015; task launcher-review; reviewer review.
Source-only, bounded follow-up. Parent owns fixes, tests and installation.

## Findings

### P1: dated staging directories are eligible

The `find` expression in `tools/umbrafox/beta/launch-umbrafox` accepts
`umbrafox-[0-9]*`. The star matches arbitrary suffix characters, not just digits.
A directory `umbrafox-20261016.next-staging` with matching newer BuildIDs and
an executable therefore wins selection and is launched, contrary to the stated
unpublished-staging exclusion. Likewise `umbrafox-2garbage` is eligible.

The current staging test covers only `umbrafox-nightly.next-staging`, which is
excluded by the exact nightly branch and does not exercise the dated branch.
Use the exact supported published-name grammar for dated installations and add
these two counterexamples. Confirm the actual published naming contract before
restricting it to eight-digit dates; do not infer it from the five test fixtures.

### P2: executable-directory candidate is treated as complete

The candidate gate tests `-x "$candidate/umbrafox"` without checking `-f`.
A searchable directory named umbrafox passes, and newer matching INIs make it
win over a valid installation. `exec` then fails instead of ignoring the malformed
candidate. Require both regular-file and executable tests, allowing symlinks to
regular executable files if that remains the intended installation policy.
Add a newer candidate with a directory in place of the binary and retain a
valid fallback installation in the test.

### Test gap: argv output is not lossless

`test/launcher-spec.mjs` uses newline-delimited printf output followed by
`trimEnd().split("\n")`. This cannot establish exact preservation of an empty
final argument, trailing whitespace, or embedded newlines. Use NUL-delimited
or JSON output from the fake executable and assert an argument vector containing
empty strings, whitespace, newline, quotes, backslashes, shell metacharacters,
and explicit profile arguments. This is a verification gap, not an observed
launcher quoting defect: the actual final `exec ... "$@"` is correct.

## Source-Confirmed Behavior

- The AWK parser restricts BuildID to the selected App/Build section, strips CRLF
  line endings, and requires exactly one 14-digit value per selected section.
  Missing, duplicate, nondigit, wrong-length and mismatched IDs are rejected.
- Selection compares the matching fixed-width BuildIDs rather than directory
  dates; the exact nightly directory wins equal IDs. Equal dated candidates
  without nightly have unspecified discovery-order precedence, which is not a
  violation of choosing a newest matching ID.
- `find -print0`, `read -r -d ''`, and quoted path expansions preserve spaces,
  backslashes and embedded newlines. No eval or shell command construction is
  used. The fixture already has spaces in its temporary HOME path.
- The final exec preserves the caller argument vector and adds no profile
  option, profile mapping, preference, or other browser argument. Installation
  directories which are symlinks are not discovered by this find expression;
  this was not established as a supported layout in the supplied contract.
- Failure to find any qualifying installation exits nonzero with a diagnostic.
  Binary plus INI presence does not verify an entire package or correspondence
  of INIs to binary contents; publication/integrity remain installer duties.

## Verification And Handoff

The old selector's five failures and candidate's five passes are parent-reported,
not independently executed by this reviewer. No launcher/test/native/browser
process was run; no installation, HOME installation tree, profile, or owner
runtime was accessed. No source files were changed. Only this report and the
shared development coordination SQLite DB were written.

Minimum additional cases: dated staging and malformed names, executable-directory
candidate, lossless special argv, missing each INI independently, wrong INI
section, CRLF input, and malformed/duplicate BuildIDs in platform.ini as well as
application.ini. Installation remains blocked on parent verification of profile
mapping and the explicitly held browser-close switch; this report authorizes
neither installation nor profile changes.

Reviewed fingerprints (SHA-256):

```text
edfaae19e258de7d5df0db7710a78831233d6a977234e6a44b3bac48686ef58f  tools/umbrafox/beta/launch-umbrafox
ae62640cf36c7d9b3a66c3f6a50e6496e2865ccd0108465a4d520f4707e0932c  tools/umbrafox/beta/test/launcher-spec.mjs
```

## Authorized Narrow Fix And Verification

Coordinator subsequently authorized edits only to the candidate launcher and its
test, plus this report and the coordination DB. The original source-only findings
above are retained as history; P1/P2 and the lossless-argv test gap are now fixed
and verified by this worker using fake installations only.

### Published Names And Changes

Repository documentation in
`bot-docs/reports/2026-10-14-desktop-crash-triage.md` and
`bot-docs/bug-reports/2026-10-15-chrome-parity-hotkeys.md` records the published
dated name `umbrafox-20261001-103920-158.0a1`. The targeted search of bot-docs,
tools/umbrafox and the conversion guide found no supported date-only installation
name beyond the candidate's old test fixtures. Archive filenames and backup
directories are not published installation aliases.

The launcher now accepts only exact `umbrafox-nightly` or the anchored grammar
`^umbrafox-[0-9]{8}-[0-9]{6}-[0-9]+[.]0a1$`. This preserves the documented layout
and permits subsequent nightly major versions without accepting staging/backup
suffixes. A candidate executable must satisfy both `-f` and `-x`. Matching INI
BuildID ranking, nightly tie preference, and quoted argument forwarding remain
unchanged. No web behavior, preferences, or profile arguments were added.

The test fixture now emits NUL-delimited path/arguments and removes exactly the
final delimiter, preserving empty arguments, trailing whitespace and embedded
newlines. Temporary HOME names contain spaces and a newline. Cases cover all
six rejected naming examples, an executable directory, the documented dated-only
installation, and explicit profile arguments as inert strings passed to a fake
executable. Existing fixtures use the complete published naming layout.

### Executed Evidence

1. Before changing the launcher, `timeout 30s node --test
   tools/umbrafox/beta/test/launcher-spec.mjs` produced 6 PASS / 7 expected FAIL.
   The six invalid directory cases selected the wrong candidate; the executable
   directory case failed at exec with status 126. The lossless argument case
   already passed, confirming no quoting change was needed.
2. After the fix and final formatting, the same command produced 14 PASS / 0 FAIL
   in approximately 0.32 seconds. The extra test verifies dated-only fallback.
3. `timeout 30s bash -n tools/umbrafox/beta/launch-umbrafox`: PASS.
4. `timeout 30s shellcheck --shell=bash
   tools/umbrafox/beta/launch-umbrafox`: PASS, including the extensionless script.
5. `timeout 60s ./mach lint --linter eslint --linter shellcheck
   tools/umbrafox/beta/launch-umbrafox
   tools/umbrafox/beta/test/launcher-spec.mjs`: final PASS, zero errors/warnings.

An optional `mach lint --linter prettier` attempt was unsupported because there
is no separately registered Prettier linter. A later scoped ESLint run correctly
reported one Prettier formatting error in the added dated-only testcase; scoped
`mach lint --linter eslint --fix` fixed it. Tests and lint were rerun afterward.
A prematurely recorded DB lint-PASS progress entry was immediately corrected;
the final PASS above is the observed completed result, not that earlier claim.

### Final Files And Limits

Repository files changed:

- `tools/umbrafox/beta/launch-umbrafox`
- `tools/umbrafox/beta/test/launcher-spec.mjs`

Final SHA-256:

```text
bf0e2dddce283f2d5e2ec7ba4d097c50e8af373b6f36f48fcd751bd8cffc4372  tools/umbrafox/beta/launch-umbrafox
135c26c883c0c2a0b4997583639e76bf0a1fef85cfdca86d8e02d1f0b5bfe10e  tools/umbrafox/beta/test/launcher-spec.mjs
```

This report and `/tmp/codex/clipboard-20261015/teamwork.sqlite` were also updated.
No staging/commits, installed-launcher changes, actual Programs-directory reads,
browser/native runtime, owner profile access, or native builds were performed.
All launcher execution used fake shell executables and disposable temporary HOME
directories. Native integration, package verification, profile mapping, and the
held installation switch remain parent responsibilities.
