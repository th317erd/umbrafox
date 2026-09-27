# Owner-shared Raspberry Pi performance research

The owner supplied a research export through Miri. Receipt/readability and
SHA256 `e17700d3f894a1cee2ada0d794d26942031bcd8dea69090da98f65a5077c5760`
were verified. The attachment is a lead list, not evidence of the current
browser's decoder, renderer or root cause. Primary sources checked below on
2026-09-27 UTC; no browser preferences or Pi state were changed.

## Verified leads and limits

- Mozilla [bug 1833354](https://bugzilla.mozilla.org/show_bug.cgi?id=1833354)
  records V4L2-M2M decode support as fixed on the Firefox 116 branch. Its decoder
  work includes fallback when hardware initialization is unavailable. Merely
  running a newer browser is not proof that a particular stream uses hardware.
- Raspberry Pi's [Bookworm announcement](https://www.raspberrypi.com/news/bookworm-the-new-version-of-raspberry-pi-os/)
  confirms its Firefox integration enabled V4L2 H.264 decoding. This is a
  distribution/integration statement, not proof of the selected decoder in our
  separately packaged browser. Record codec, decoder/backend, dimensions, source
  frame rate and actual process state for each playback comparison.
- Raspberry Pi [Bookworm issue 302](https://github.com/raspberrypi/bookworm-feedback/issues/302)
  is a user report of intermittent page/network hangs after Firefox 130 versus
  128. The report includes missing outgoing requests and uncertain explanations.
  It is not a confirmed diagnosis or a demonstrated regression in our 158 build.
  Similar symptoms alone do not justify a networking or graphics patch.
- The export's Snap startup reference concerns different packaging. Our current
  experiment uses an unpacked self-contained runtime; Snap-specific explanations
  require evidence that the actual failing deployment has that packaging.

## Consequences for this program

Continue the matched local-video/cached-canvas/live-copy controls and the
OS-owned presentation audit. Decoder selection is a measured input, not an
inference from capability lists or version numbers. Compare decode, canvas copy,
rendering and presentation separately; a codec change cannot explain an already
isolated cached-raster presentation cost by itself.

The article's codec-forcing, acceleration-toggle and older-browser suggestions
are not adopted as product defaults. Such changes can alter exposed capability,
rendering path and benchmark workload simultaneously. Any diagnostic comparison
needs explicit recorded settings, a matching baseline/reversal, verified backend
and restoration. Thermal/power/governor controls remain in l8ros's physical test
protocol; previous confounded tuning observations are retained, not overwritten.

This evidence strengthens existing PERF-003, PERF-011 and decoder coverage in
PERF-016; it does not establish a new performance fix. l8ros received the primary
source distinctions and browser presentation-boundary report directly. Device
lifecycle and deployment remain with that coordinator.
