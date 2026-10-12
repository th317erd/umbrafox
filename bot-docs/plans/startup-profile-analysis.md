# Existing Startup Profile Analysis

Status: offline export verified; saved analysis is partial after a bounded CLI
query timeout. Owned daemon stopped and exact PID/socket absence verified.
No browser work was performed or authorized by this plan. See
`../reports/performance/2026-10-07-startup-profile-analysis.md`.

The preceding capture remains failed at its 24 MiB copy limit. Preserve the
sealed run, reports and original 52,241,866-byte file. This separate offline
export does not change that result or increase its capture limits.

## Export Contract

1. Recheck the exact owned source path, uid 1000, mode 0600, canonical spelling,
   device 64512, inode 37366171, size and saved modification time. Verify the
   recorded browser/controller PIDs are absent; never signal a reused PID.
2. Create a fresh private output directory. Open source read-only with
   O_NOFOLLOW. Stream opaque bytes through gzip and SHA256, with an input limit
   of 64 MiB and the exact expected byte count. Output must remain at or below
   24 MiB. Never parse raw profile JSON or enumerate other profile contents.
3. Use exclusive output creation and a 30-second abort signal. Failed exports
   remain partial and are not accepted or retried. Close every owned descriptor.
4. Stream-decompress the completed gzip into a bounded hash sink, compare input
   size and SHA256, and recheck source/output metadata. Preserve the original.
5. Transfer only the admitted gzip and bounded receipt. Verify the compressed
   hash locally before any profiler-cli load.

## Analysis Contract

Use installed profiler-cli with one unique owned session and explicit symbol
server `http://127.0.0.1:9`. No raw parser, browser, remote service, symbol upload
or daemon belonging to anyone else. Bound load and commands, record exact
daemon identity/socket, and stop in finally with verified absence.

Validate actual thread inventory, the single complete private interval marker,
document/process identity and native-to-CLI clock convention before measuring
spans. This capture reported zero drops, so it is a smooth reference, not a
drop-cause reproduction. Do not claim absent native markers prove no physical
drops or infer CPU/GPU causes from wall time. No new runtime trial under this
plan; use the evidence to choose the next performance experiment.

## Tests

Fail first for the new exporter. Exercise opaque round trip, exact source
identity, symlinks/aliases, existing output, byte caps, abort before/during work,
source changes, malformed/truncated gzip, hash mismatch and descriptor cleanup.
Use owned temporary directories only. Keep small tests under 10 seconds and
the combined suite under 30 seconds. Fixture data need not be profile JSON.
