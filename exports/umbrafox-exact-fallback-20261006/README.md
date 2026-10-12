# Exact Fallback Diagnostic Build

BuildID20261006153147. Diagnostic only; not installed for daily use.
The package includes the frozen dirty-tree source in source.patch and
new-source-files.tar.gz, with59 explicit source pins in source.json.

The native ELF note, both INIs,46 extracted files and frontend archive deltas
passed verification. See package-verification.json and package-input.json for
exact identities and hashes. The only frontend entry change from the prior RGB
package is its AppConstants BuildID. The experimental DMABuf import stays OFF
by default.

Two isolated laptop pixel captures passed:48 OFF hashes match the preserved
full-size reference and48 ON hashes match OFF, with stable repeats and exact
raw linear buffers. This is not general Firefox parity or performance proof.
No installation, desktop restart or default enablement is authorized by this
artifact. Decoder loss/import failure, cache-validation cost and integrated
performance remain open.

Report: ../../bot-docs/reports/performance/2026-10-06-exact-canvas-fallback.md.
