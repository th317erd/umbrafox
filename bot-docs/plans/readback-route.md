# Readback Route Diagnostic

Use existing profiler IPC flow markers in disposable headed laptop browsers.
No browser/native code change, profiler upload, performance timing claim or
daily-browser action. Old pixel captures remain immutable.

Two fixed frames (0.5s, 2s) from the existing VP9 fixture. Per frame, record
four named UserTiming measures: first110x75 (1 draw), repeat110x75 (8),
different111x77 (8), return110x75 (8). CPU canvas uses willReadFrequently;
clear, draw, read pixels and hash each copy. Require stable repeated hashes,
equal first/repeat/return pixels, distinct frame pixels, unchanged paused video
state and exact document joins. No earlier canvas copy may warm the image.

Source predicts baseline readback requests [1,8,8,8] per frame and a candidate
first-size cache [1,0,8,0]. This is a hypothesis to falsify, not an acceptance
condition that may be relaxed. Different-size and new-frame phases are positive
controls for recording coverage and cache invalidation. Count only outgoing
request message types on the fixture content PID, not receiver or reply copies.

Enable existing nostacksampling/ipcmessages/flows/nomarkerstacks features after
startup, filters GeckoMain and RemVid. Prefer send-only IPCFlow instant markers
to synthesized paired IPC durations. Stop profiler in finally. Capture the
configuration, document identity, decoder replies, phases, dump and stop result.
Reuse bounded profile preservation (legacy dom-profile.json name, profile.json
copy) at24MiB, unchanged256MiB sampled run cap and120s total capture deadline.
No generic profile-cap exception, remote symbols or raw-profile parsing.

One baseline pilot first, then inspect with profiler-cli using a unique named
session and explicit http://127.0.0.1:9 symbol server. Stop owned daemon in finally.
Only if existing exports expose adequate message identities and phase coverage,
run one candidate. Missing coverage means inconclusive, not zero readbacks.
Both packages remain the prior sealed readback pair, not a cache-only timing pair.

Tests first: collector ordering and state failures, typed receipt validation,
RPC/save/stop/preservation failure matrix, exact document binding and profiler
cleanup. Fresh package and private-root checks, sample caps, graceful owned
SIGTERM and exact known-PID absence remain mandatory. No automatic retry.
