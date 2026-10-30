---
title: Build, package, and install Umbrafox
status: current
doc_type: runbook
audience: [developers, release-engineers, operators]
last_verified: 2026-10-27
canonical: true
---

# Build, package, and install Umbrafox

> **Current documentation.** A successful compile is not an installed or runtime-verified browser.

## Build

Use the repository `mozconfig` for native x86_64 and `mozconfig.aarch64` for the
ARM target. Significant Rust/Cargo builds use at most two jobs unless an
explicit exception applies. Preserve full logs under project artifacts; do not
filter slow-command output through `head`, `tail`, or `grep` while it runs.

```bash
./mach configure
./mach build
./mach package
```

Use `./mach build faster` only for Android/desktop front-end-only changes and
`./mach build binaries` for C/C++/Obj-C/Rust-only changes. After upstream IPDL
changes, run `./mach build export` before binaries if generated headers are stale.

## Package verification

Record source revision/base, configuration, BuildID, package hash, ELF
identities, archive inventory, and any supplemental untracked source required
to reproduce the artifact. Verify the extracted package, not just the staging
tree. Experimental exports remain evidence and are not automatically release candidates.

## Install

After a successful runtime build, install the self-contained package under
`/home/public/wyatt-desktop/Programs/umbrafox-nightly/`, touch its
`.purgecaches` marker, and retain
`/home/public/wyatt-desktop/Programs/umbrafox` as the small launcher. Verify the
extracted tree, marker, launcher, and `umbrafox --version`.

Do not replace or restart the owner's daily browser merely because a package
exists. Installation, activation, profile migration, restart, and deployment
are separate authorized operations.
