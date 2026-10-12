# Video Comparison Admission

## Current Boundary

No browser, profiler, remote session, build or installation was started in this
follow-up. Visible laptop testing still needs the owner's answer. The preceding
request-latency result remains sealed and does not establish a playback gain.

The retained Pi `inputs/index.html` fetches the complete `video.mp4`, appends the
whole buffer through MSE, and waits for `updateend` before starting playback.
It is useful for separating plain, cached-raster and live-copy rendering work,
but cannot measure recurring streaming requests during playback. The retained
README identifies a 120-second 1080p30 H.264/AAC input by SHA; the transferred
Pi evidence directory contains no MP4/WebM asset. This is not a claim that the
asset is absent from other hosts or directories. No broader asset search ran.

The existing desktop readback fixture instead uses the in-tree 97,465-byte,
four-second 320x240 VP9 clip, paused at two fixed seek positions. This is suitable
for pixel checks, not a realistic playback or throughput workload.

## Offline Check Added

`artifacts/umbralink-control/readback-context.mjs` now admits recorded context
before delegating to the existing exact-pixel comparator. It checks:

- Successful terminal capture, recorded clean cleanup/root absence and no log loss.
- Profiler inactive and matching recorded browser PID; valid build/document IDs.
- Headed/headless mode consistent with recorded launch environment.
- One recorded browser window, compositor/layer manager, scale and remote flag.
- Adapter identity, driver fields, feature statuses, reported target rate,
  display descriptors, canvas/content backend and color-management information.
- Exact media SHA/size, fixed seek positions and dimensions, decoder name/codec/
  hardware flag stable at both endpoints, and raw reply/document joins.
- Distinct capture paths/PIDs, matching context, then exact hashes for 18 cases.

The loader reads nine named direct JSON files per capture, never a profile or
discovery file. It rejects noncanonical roots and symlink inputs, bounds each
read to 1 MiB, and closes file handles on success or error. Commands have an
external ten-second timeout; this is not an OS-I/O cancellation guarantee.

The comparison deliberately returns `timingAccepted: false`. These recorded
fields do not prove physical refresh cadence, window geometry, continuous
backend state, an exact decoder/provider or cache-hit path, clean source-delta
attribution, actual playback, or overall resource/containment acceptance.
Independent artifact and runtime gates remain necessary. It is an additional
comparison check, not a replacement for the capture driver or its audit.

## Verified Results

The supplied-data tests pass all six groups, including 32 malformed/changed
admission cases and four headed-specific negatives. The saved software baseline
and candidate reproduce the existing exact 18-case pixel match. The actual
headed/software pair is rejected for differing observed contexts. A stronger
falsifier supplies identical pixels but different graphics context: the original
pixel-only function accepts the pixels, while the new context gate rejects.

A copied headed fixture exercises the positive schema path only and is explicitly
synthetic. Reusing the same capture identity rejects. There is still no real
independent same-backend headed A/B result, and no new GPU performance result.

The initial RED is a missing-module TDD failure, not a discovered browser bug.
The mixed-context CLI exits nonzero as intended and preserves its error output.
No production source or existing capture/fixture was edited.

Evidence under `artifacts/umbralink-control/`:

- `readback-context.mjs`, `test/readback-context-spec.mjs`.
- `readback-context-{red,green}.log`.
- `readback-context-software.json` and empty error log.
- `readback-context-mixed-error.log` and empty result file.
- `readback-context-final.sha256` for this checkpoint and its named inputs.

```sh
timeout 10 node --test --unhandled-rejections=strict \
  artifacts/umbralink-control/test/readback-context-spec.mjs
timeout 10 node artifacts/umbralink-control/readback-context.mjs \
  /home/wyatt/.cache/codex/readback-baseline-headless-20261003-1 \
  /home/wyatt/.cache/codex/readback-candidate-headless-20261003-2
```

## Next Test Order

1. After explicit window consent, verify actual headed backend and matched pixel
   context first. Keep the owner's browser and profiles untouched.
2. For playback, use a pinned longer owned clip and compare plain video, cached
   raster updates and one live copy per new frame. Same media interval, dimensions,
   backend, profiler-off state and balanced order; separate startup/seek warmup
   from the measured interval. Record counter deltas and callback counts, not
   callback duration as GPU or presentation time. Preserve every failure.
3. Keep the request-fast-path experiment separate: use the sealed same-native
   request pair and a workload with observed requests during the measured window.
   A fully buffered clip cannot substantiate a streaming-delay improvement.
4. Only then connect the result to YouTube, with explicit playback/tab authority
   and extension state recorded. No assumed uBlock causality or silent disabling.

The broad rendering/layout/CSS/JavaScript objective remains active. Neither this
offline gate nor the synthetic request result authorizes replacing the daily build.
