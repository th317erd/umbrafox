# Clipboard prototype, October 15, 2026

Installed inactive at `/home/wyatt/Programs/umbrafox-nightly`.
The existing installation is retained at
`/home/wyatt/Programs/umbrafox-nightly.before-clipboard-20261015`.
Installation receipt: `evidence/install-receipt.json`.

**Activation is pending.** The installed launcher is unchanged and the current
dated browser was not closed/restarted. The nightly and dated installation
profile mappings differ. Do not switch the launcher, launch this package into a
different personal profile, or change those mappings until the owner has closed
the daily browser and approved the final mapping correction. Do not copy profiles.

## Artifact

| Field | Value |
| --- | --- |
| Archive | `package/umbrafox-clipboard-20261015235226-linux-x86_64.tar.xz` |
| Size | 119460288 bytes |
| SHA256 | `b4db996ef95a01d5e967126f874ced3a21e429dc4983c013b52dd7f5579ace9a` |
| Native/application.ini/platform.ini BuildID | `20261015235226` |
| Version | `Umbrafox 160.0a1` |
| Layout | One `umbrafox/` top-level directory; 47 regular payload files, no symlinks |
| Install marker | `.purgecaches`, empty, mode0600; 48 installed files including marker |
| Source base | `d43214d6704182dabefff44b772764db04e386f1` PLUS patch/supplement below |
| Source patch SHA256 | `bc532424c6807f569613ebcc68fe9e1b2c79d729be3c2f48ee06f9edf207bf83` |
| Source supplement SHA256 | `8370b764fd9817aab07d3e64caddcaf2228b5d9f80a659b20085c86b1651f252` |
| Beta overlay SHA256 | `4278e82f4538bf4058aefd3b488e77069be9c7edd1e36791456c194e79967eb2` |

The full archive and extracted tree remain local and are deliberately excluded
from Git. `package/package-input.json` records the complete payload inventory,
source/configuration hashes and original archive hash. `source.patch`,
`source-supplement.tar`, `source-inputs.json`, `mozconfig` and
`original-files.json` retain reproducible provenance. The source supplement's
13 files and the 36 tracked modifications were individually compared with the
main checkout, including exact membership, before and after packaging.

Configuration: optimized `-O2`, non-debug x86_64, probes OFF,
`MOZ_APP_UA_NAME=Firefox`, version160.0a1, update channel unchanged (`default`).
The owner's existing opt-in overlay enables only the DMABuf draw-image fast
path and single-image opacity experiment. Both remain user-overridable; this
does not turn prior failed graphics smoothness gates into passes.

## Verification

See [implementation report](../../bot-docs/reports/2026-10-15-clipboard-protection.md)
and [reapply recipe19](../../umbrafox-conversion-guide/recipes/19-site-clipboard-override.md).
Implementation commit: `47e6fdeb78fee3bde3447b348f49244025b0b738`.

- Full native compilation and final incremental build passed; C++/Rust2jobs,
  nice10, fixed BuildID. Standard `mach package` completed in32seconds.
- Seven actual browser test files: 808 passing assertions, zero unexpected
  failures, two expected harness preference-migration TODOs.
- Existing sync/async snapshot tests: 668 passing assertions.
- New and existing real permission-store tests: 148 passing assertions.
- UI/actor pure suite: 51 tests; package/install adapter suite: 12 tests;
  launcher/beta suite: 16 tests. Source lint clean.
- Complete original extraction and final archive file hashes verified; only
  the existing beta preference file was added to the standard package.
- Installer checked target inactivity twice, preserved original directory,
  verified every installed file and marker, and retained the exact launcher
  hash `36b8df60cd05fea0f50fbb92ea0fe9433ddf0c9910c0df89d15cd3e07854c0cd`.
- Installed `--version` returned exit0 and `Umbrafox 160.0a1`. Its own PID1143453
  was confirmed absent after cleanup. No owner browser was restarted.

`evidence/logs/` retains successful gates and original failures. In particular,
do not erase the read-only retry, late-frame permission icon, obsolete chrome
global, script-paste fixture prompt or xpcshell application-directory failures.
The last required `umbrafox-appdir=browser` manifest entry follows the harness's
actual appname selection; an app-path CLI option is overwritten per test.
Combined Python unittest discovery also exposed temporary import-path pollution
in the packaging helper; the prior-helper import now restores sys.path in
`finally`, and all12 tests run together.

## Reproduce Package And Install

These commands are receipts, not permission to overwrite a live installation.
The adapter refuses an existing export directory/backup/receipt, changed source,
unexpected configuration, unsafe archive layout or active target installation.

```sh
# Isolated source, existing obj/.mozconfig, fixed BuildID and at most two jobs:
timeout 1200s nice -n 10 ./mach package
# Main checkout, after source/native/integration gates:
timeout 300s nice -n 10 python -B exports/umbrafox-clipboard-20261015/evidence/package_prototype.py \
  /home/wyatt/.cache/codex/umbrafox-beta-20261012-nYSBPOWS/obj/dist/umbrafox-160.0a1.en-US.linux-x86_64.tar.xz \
  /home/wyatt/Projects/umbrafox-workspace/umbrafox/exports/umbrafox-clipboard-20261015/package
timeout 300s nice -n 10 python -B exports/umbrafox-clipboard-20261015/evidence/install_prototype.py \
  /home/wyatt/Projects/umbrafox-workspace/umbrafox/exports/umbrafox-clipboard-20261015/package
timeout 70s node exports/umbrafox-clipboard-20261015/evidence/version.mjs
```

The version helper uses fresh private app-data roots and retained owned-process
cleanup. Installer path checks are point-in-time admission checks, not a
race-proof sandbox. Do not replace the preserved old installation without
separate review; it is the rollback source.
