# RGB Readback Diagnostic Candidate

BuildID: `20261006111504`. This is a separate test package, not installed as the
daily browser. Do not replace the owner's profile, launcher or current install.

The package includes the scaled readback correction: full-size GPU RGB
conversion followed by linear GPU scaling and destination-sized CPU readback.
The preceding native gate passed 32 tests, including eight exact pixel cases;
this integrated package has not yet run the strict real-video gate. The
separate blur-repeat discrepancy remains unresolved. GPU import defaults OFF.

Archive: `umbrafox-rgb-readback-20261006111504-linux-x86_64.tar.xz`.
SHA256: `71f6addde29258baff9e0f8cad10a6ef2ae3dd64a0d220649c9f4bf49ea57587`.
The native toolkit ID and both INIs agree; all 46 extracted files match
`package-input.json`. Source patches, untracked inputs and build configuration
are included. HEAD alone is not the deployed source provenance.

Full evidence and remaining gates:
`bot-docs/reports/performance/2026-10-06-rgb-readback-candidate.md` in the checkout.
No playback performance or universal Firefox-equivalence claim is made.
