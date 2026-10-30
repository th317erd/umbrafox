# Isolated Intel Decoder Driver Comparison

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

## Scope

One isolated laptop diagnostic using the frozen Build20261006175655 and the
existing 20-second ordinary YouTube 1080p admission. No daily desktop, system
installation, browser source, preference, sandbox, profile, or shared queue
changes. Existing evidence remains immutable. No agents or profiler required.

The preceding capture observed AV1 VAAPI vaEndPicture status 23, then software
decoding. Intel's free-kernel AV1 limitation is a strong candidate, not yet a
demonstrated cause of the owner's seeking/recovery symptom.

## Input And Loader Contract

- Ubuntu noble multiverse package intel-media-va-driver-non-free:amd64
  24.1.0+ds1-1; official HTTPS archive, expected 8783954 bytes and SHA256
  69b244049ff76f24738c8b00d09d9eda84582fe654f78a7c232191088ba6da6d.
- This shares upstream 24.1.0 with installed free 24.1.0+dfsg1-1ubuntu0.2,
  but not its distro revision. It is a package-variant comparison, not an
  isolated source-change experiment.
- Inspect package/control/archive and ELF metadata without executing package
  scripts or loading the library. Verify installed dependency versions.
- Extract only the regular iHD_drv_video.so, with a pinned byte count/hash.
  Add it exclusively to the disposable browser installation root and admit
  the extended manifest. Original browser identities and bytes must remain
  unchanged. Existing postflight must verify the added file too.
- Set LIBVA_DRIVERS_PATH only in the owned browser child environment, to that
  installation directory. Keep existing FFmpegLib:2 logging and all limits.
  No LD_LIBRARY_PATH, sandbox disable, forced codec, or product defaults.
- Frozen GetRDDPolicy already permits reading NS_GRE_DIR. Pin that source
  against the deployed export before launch; libva 2.20 consumes this override.

## Runtime Receipt

Use the already collected performance-after reply to identify the single owned
RDD process. Bound a single /proc/PID/maps read, bracket it with parent/RDD
identity checks, and retain only driver mapping rows. Join mapped device/inode
and exact path to the admitted library. Reject absent, changed, ambiguous,
foreign, deleted, or wrong-driver mappings. This is a point-in-time receipt,
not a continuous or hostile-same-user isolation guarantee.

Native media diagnostics must retain the exact document, AV1 dimensions,
decoder description, and hardware flag. A mapped full-feature driver alone
does not prove this video's hardware decoding succeeded. Preserve failures.

## Verification And Stops

Tests first: generated-source drift, exact environment delta, exclusive
package addition, old-file/root identity drift, wrong hash/type/size, abort,
partial write, mapped inode/device/path, PID reuse/ownership, malformed maps,
missing/duplicate RDD and no late evidence after cancellation. Reuse package,
resource, native directory, logging and cleanup tests rather than replacing
their contracts. Pure tests <=30 seconds; package fetch <=60 seconds.

Runtime retains 120-second capture, 15-second cleanup reserve, 1 MiB log cap,
existing resource caps and 360-second outer driver bound. No SIGKILL, cap
relaxation, hidden retry, ad skipping, or personal browser access. Failures
stop this attempt and are exported only after owned-process cleanup proof.

Compare decoder selection and error behavior, not a performance win: single
run, startup/cache/stream differences and logging remain confounders. System
installation requires separate owner consent. Owner desktop VP9/seek/black
flash causality remains open regardless of this result.
