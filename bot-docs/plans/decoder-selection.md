# Decoder Selection Diagnostic

## Question

The isolated laptop's saved graphics capability snapshot supports AV1 hardware
decoding, but the recent YouTube playback snapshots report software AV1 decoding.
The successful iHD driver-open log is not a successful stream initialization
receipt. Determine which existing decoder-selection or initialization message
explains the actual path. This is not yet an explanation of the owner's seeking
stutter or brief black flash.

## Fixed Scope

- One fresh owned laptop process on the matched baseline Build20261006175655.
- Existing signed-out public YouTube fixture and ordinary 1080p quality UI.
- Existing 20-second admission capture, not a seek or performance comparison.
- Only added process environment: MOZ_LOG set to
  timestamp,FFmpegVideo:4,PlatformDecoderModule:4. No log-file override.
- Existing one MiB browser-log cap, 120-second total/15-second cleanup budget,
  private profile/application/local/temp roots, resource caps and package gates.
- No codec/GPU/default changes, extensions, login, ad skipping, hidden player API,
  profiler, desktop browser, install, native build or source change.
- Source-pinned scratch adapters retain the original capture/driver/quality code
  and import closure. Reject drift; record the explicit logging distinction in
  the terminal report and effective environment provenance.

## Verification

Test the missing logging injection first. Verify exact transformations, preserved
quotas/cleanup, import targets, rejected source drift and rejected preexisting
generated output. Validate the copied runtime closure and host resources before
launch. Preserve the complete bounded stderr log, including failure/cap stops.
No automatic retry or logging-cap increase if the diagnostic fails.

After the run, verify terminal cleanup, exact recorded PID absence, unchanged
package and exported evidence hashes. Correlate messages with process identity,
codec and native receipts. A log line without document identity cannot establish
which stream emitted it. A missing error is not proof of a successful hardware
path. Do not compare instrumented timing/drop counts to the unlogged controls.

Use the frozen package's HEAD plus source patch for local producer interpretation;
current Searchfox is discovery/context, not proof of the deployed implementation.
If this reveals no concrete path, retain the gap rather than changing preferences
or claiming a performance fix. Previous captures remain immutable.
