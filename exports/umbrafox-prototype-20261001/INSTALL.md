# Installation Receipt

Installed October 1, 2026, with Wyatt's explicit approval. This supersedes the
installation-pending statement in the original sealed README, which is retained
unchanged with its original checksums.

- Destination: `/home/wyatt/Programs/umbrafox-20261001-103920-158.0a1`.
- Version: 158.0a1. Runtime-tested build: `20261001103920`.
- Source archive SHA256:
  `4a3b9608c856bf6b9cf0d28e10a4183a553c2313b8db404c8cab39db6c3e5fe5`.
- Full extracted tree matched the previously tested extraction. Added
  `.purgecaches`, then renamed staging into the final dated directory.
- Installed executable SHA256:
  `5a8bf8288cfcb659c68a415a364e34eb37b6712bb55038f4abd4c5d3f083a6c8`.
- Installed libxul SHA256:
  `2a8eb56ca3d71650124a76112154c6517056207292cceecf6a7fd551c5c8e8fc`.
- Both installed INIs report BuildID `20261001103920`.
- Unchanged launcher SHA256:
  `36b8df60cd05fea0f50fbb92ea0fe9433ddf0c9910c0df89d15cd3e07854c0cd`.
- Invoking the actual launcher with `--version` under tracing selected this exact
  new install and printed `Umbrafox 158.0a1`, exit0. Fresh owned application-data
  directories were supplied for that version check.

No existing installation, launcher, personal profile or running browser was
modified or stopped. To activate the new build, fully quit Umbrafox and reopen
via `~/Programs/umbrafox`. An in-browser restart can reuse the old executable.

Verification log: `artifacts/umbralink-control/install-launcher-verification.log`.
