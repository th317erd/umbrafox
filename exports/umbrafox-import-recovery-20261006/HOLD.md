# Runtime Admission Rejected

Do not launch or install this diagnostic package.

Its archive contents and INIs passed verification, but the embedded toolkit ELF
BuildID is `20261006052600` while both INIs report `20261006070020`. The native
identity requirement failed before any browser launch. Original archive,
manifests and source provenance are preserved; their integrity checks do not
mean runtime admission passed.

Evidence: `artifacts/umbralink-control/import-playback-candidate/elf-notes.log`,
`toolkit-note-strings.log` and `buildid-timestamps.json` in the project.
The separately named `-r2` export, if produced and verified, supersedes this
package for prospective diagnostics without changing this rejected result.
