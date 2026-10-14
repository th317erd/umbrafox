# Seek Audio Fix: Build 20261014043800

Fix/report commit: `d74c12c71fdf`. The package was built from the recorded base
plus frozen patch; its manifest remains the precise build authority.

This package adds the paused-audio-stream seek correction to the October 12
opt-in graphics beta. A backend already stopped before a seek is recreated,
instead of being reused with an invalid assumption about its queued audio.
Continuously running audio streams retain the reuse optimization.

Verified on the isolated laptop with the same YouTube 1080p60 AV1 video, audible
playback, progress-bar seek and 130-second recovery. Baseline recovery windows
dropped 15.03%, 21.60%, and 17.07% of frames. The fixed build dropped 0.37%,
0.33%, and 0.20% with audio logging, then 0.30%, 0.19%, and 0.20% without it.
All six fixed recovery windows passed the predeclared below-1% gate. This is a
bounded reproduction, not a guarantee for all sites, hardware or stutter causes.

Native regression tests: 38 passed, zero skipped; three new expectations failed
against the old implementation first. Same-build UmbraLink OFF/ON public-surface
smoke passed. Existing experimental graphics limitations are unchanged.

Installed separately in `/home/wyatt/Programs/umbrafox-nightly`, with the prior
package preserved as `umbrafox-nightly.before-seek-audio-20261014-043800`.
Exact package files, `.purgecaches`, native BuildID and isolated `--version` check
passed. No personal profile, running browser or launcher was changed.

IMPORTANT: the current launcher prioritizes dated installations over nightly.
Restarting normally does not automatically select this build. Verify the usual
profile mapping before switching daily use; do not start a guessed empty profile.

Package archive SHA256:
`398f90eebc88dbc9fc92161ded4abb05c7e2c8e03f8b7c29cd75747e2b874b8d`.
The exact source patch, native base, build configuration, beta overlay and file
inventory are retained alongside this note in `package-input.json` and its
referenced files.

Full evidence and limitations:
`bot-docs/reports/performance/2026-10-14-seek-audio-reuse.md` in the repository.
