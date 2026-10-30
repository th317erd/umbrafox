# Balanced Import First Attempt

> **Archived project record.** This page preserves dated project evidence and its original status. Source, tests, and current Umbrafox documentation outrank it.

The planned OFF/ON/ON/OFF sequence stopped at its first OFF capture. The page
collector raised `Invalid sustained callback metadata`. The before provider
snapshot was accelerated, but no final provider or completed page result exists.
Decoder-after reported paused position35.938392. The failing metadata values
were not retained, so the exact failed predicate is unknown. There is no new
balanced speed result; no failed run has been relabeled.

Root: `/home/wyatt/.cache/codex/laptop-balanced-import-off-20261006-bVSxIz`.
Controller1384726/browser1384739; 12 recorded PIDs independently absent, clean
SIGTERM,271-byte browser log/0 drops. Both run and driver status are failed.
Package postcheck passed47 files including empty lock,475120013 bytes. All39
exported files/133092 bytes hash-verified in the balanced-import namespace.
The failed run lasted47.706 seconds including setup and cleanup.

New boundary-only harness53 tests passed before runtime. It imports the exact
sealed collector, retains two native queries and records natural final software
state instead of requiring retained acceleration. No native source, public API,
daily desktop installation or default preferences changed. Input89-file bundle
SHA27519bbf585d9cfa3bedc52732a0a0b114bfac2013327d105dc778b0ee9e6d4d,
same corrected R2 BuildID20261006070020. No ON or second OFF was launched.

The reviewed producer `HTMLVideoElement::WillFireVideoFrameCallbacks` selects an
image for current/next composition, obtains mediaTime from that image, and
separately advances presentedFrames. Source does not establish which predicate
failed in this capture. The callback proposal specifies a monotonic presented
count but does not make this lost receipt recoverable. See the
[callback metadata proposal](https://wicg.github.io/video-rvfc/#dictdef-videoframecallbackmetadata)
and saved Searchfox producer logs. No source or validation relaxation follows
from this inference.

Next diagnostic adds bounded failure-only metadata to the existing throw,
unchanged predicates/success path, with failing-first tests and an AST equivalence
gate. The first failure and frozen runtime bundle remain immutable.
