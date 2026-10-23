# WebRender Video P1 Diagnostic Build

The authorized ARM64 diagnostic is built and exported, not installed or run.
See [the artifact handoff](../../exports/umbrafox-wr-video-p1/diagnostic/README.md)
and its `package-input.json` for exact provenance and runtime constraints.

BuildID: `20261016031646`. Archive110608216 bytes, SHA256
`70d5a7470fed931cfaa5ec261cc66c231204443066756626a00db0fdc3370f16`.
Source base `c0e7f8a2be0460695c1f65ae8796b09c1082480c`, separate P1 patch
`731d9ec249e4de7d7f1aa58179504cbb9ae5f12f2cfe1b2cadbb616a3228874e`.
No optimization or production-default change is included in the patch.

Core/route/renderer/record tests, sanitizer checks, registered lint, native ARM
build and package verification passed. The original two-job build was stopped
only after Wyatt authorized eight jobs/normal priority; its log and exit were
preserved, and its process group was proven absent before same-object resume.
The resumed build passed in five minutes; native, object and both INI IDs match.
All28 ELF files are AArch64; beta overlay is the unchanged approved4278e82f file.

l8ros owns deployment and the R/D0/D1/R runtime comparison. Marker inclusion is
not runtime success, rendering parity, a bottleneck diagnosis or an optimization
result. Existing historical R cannot certify this new patch compiled out.
Custom-record limits do not bound the entire profiler ring or JSON export.
No Pi action, desktop browser action, raw profile parsing or upload occurred.
