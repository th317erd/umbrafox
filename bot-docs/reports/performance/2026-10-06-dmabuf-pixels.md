# DMABuf Pixel Gate Status

## Outcome

The candidate build `20261006023500` is packaged, default OFF and uninstalled.
No ON browser run has occurred. Strict paused-pixel acceptance is held because
two fresh blur-filter canvases produce different pixels with the candidate
path OFF. This is not evidence that the new path causes the difference, nor
that the difference causes YouTube stuttering.

The desktop daily browser, profile, installation and launcher were untouched.
Tests used isolated owned laptop installations and fresh private data roots.

## Test Coverage

The plan is `bot-docs/plans/dmabuf-pixels.md`. Twelve cases draw twice on fresh
canvases above the unchanged acceleration size threshold: linear, odd size,
crop, fractional size, nearest, transform, alpha, blur filter, shadow,
VideoFrame, synthetic RGBA VideoFrame and explicit readback. Native provider
observations occur immediately after drawing, before pixel reads. The page
does not receive the privileged debug API.

The combined focused suite passed 50 checks. Its log is
`artifacts/umbralink-control/dmabuf-pixels/final-v3-tests.log`. This covers
collector, observer, serialized control requests, capture integration,
malformed data, cleanup and existing regression contracts. It does not turn
the real browser pixel failures into passes.

## Browser Evidence

Three OFF attempts are preserved under
`artifacts/umbralink-control/dmabuf-pixels/`:

- `off-1`: failed before drawing because the harness expected a user-value
  flag after setting a preference to its existing default false. A focused
  failing test preceded the expectation correction.
- `off-2`: all 24 draws at paused time 0.5 seconds completed; strict validation
  rejected the two blur-filter hashes. No second-frame or ON test followed.
- `off-3`: one diagnostic repeat retained both blur RGBA buffers. All 24
  case hashes match their corresponding `off-2` hashes. The same filter pair
  differs, and the other eleven case pairs match within each run.

Both blur observations report acceleration. This identifies the observed
provider state, not an individual GPU import, shader, or exact failure cause.

The two filter hashes are:

```text
6f8c890491df559fdbc5b6797bd1f49126756b2a37edfa14d3a4eb4c06a4c1fa
122ac539666b7c92f4dbf5401aec51a04eea1645c456a59294a4737b63324102
```

Canonical base64, byte lengths and SHA256 joins validate the retained buffers.
Of 57,600 pixels, 11 differ in one component each: four red, four green,
three blue, zero alpha. Maximum absolute component difference is 1 on the
0-255 scale. The bounding box is x=204..251, y=112..154. Scalar count and
absolute-sum crosschecks agree. Equal-input, known-delta and invalid-size
checks preceded the saved-data calculation. Results are in
`filter-difference.json`; source bytes remain in `off-3/run/import-frame-0.json`.

The small magnitude is not a pixel-tolerance waiver. Rounding, shader warmup,
provider behaviour and fixture timing remain hypotheses, not established causes.

## Cleanup And Limits

All three runs report clean owned SIGTERM cleanup, root absence and 271-byte
browser logs with zero dropped bytes. Installation postchecks were retained.
The final remote export independently found all twelve recorded OFF3 process
IDs absent and transferred 30 evidence files totalling 732,073 bytes. Each
transferred file's length and hash were verified before local decoding.

The last controller tool session was unavailable after context recovery;
terminal driver/run records and exact PID absence establish completion, but
do not recover that tool session's exit code. The evidence exporter exited 0.
Sampled process absence does not prove that no transient helper ever existed.

No profiler or performance comparison ran. The second requested frame was
not reached. Stock Firefox equivalence, context loss, GPU import failure
propagation, actual import execution and moving-workload performance remain
unverified. Original build and prior experiment seals were not modified.

Next: isolate the baseline blur variation without loosening the validator,
then resume OFF/OFF/ON correctness comparisons before measuring speed.
