# Startup Drop Profile Pair

Status: control completed; profiled playback completed but profile preservation
failed its fixed size limit. Both browsers and profiler stopped. No retry or cap
increase. See the October 7 startup-profile report for evidence and next steps.

## Scope

One unprofiled control, then one profiled 20-second playback on the isolated
laptop. Use the frozen descriptor-borrow package and previously verified private
iHD copy. No installation, desktop access, browser source/default changes, or
public page markers. Existing quality controls select 1080p. This is a startup
drop investigation, not a reproduction of the owner's seek/recovery symptom.

## Contract

- Reuse the last frozen capture lifecycle, resource failure wrapper, native
  root admission, installation verifier, media diagnostics and opaque profile
  preservation. Keep its 120-second total and 256 MiB sampled artifact limit.
- Start profiling only after quality readiness and an inactive receipt. Request
  the already observed 16M-entry capacity, 5 ms interval, JS/native stacks and
  process CPU; include GeckoMain, Compositor, Renderer, ImageBridge, Media,
  Video and IPC I/O filters. Reject any effective configuration mismatch.
- One privileged frame closure brackets playback with native process-clock
  readings and emits one complete interval marker with the exact document ID.
  No public UserTiming entry or page-global property. Parent listener and child
  observation each have their own finite timeout and cleanup.
- No controller requests during the 20-second observation. Pause video before
  diagnostics, pause profiler before dump, and stop it in finally. Failed stop
  remains a failure; enclosing owned browser termination remains mandatory.
- Retain only the explicit profile file, capped at the existing 24 MiB copy
  limit. Dump itself is not hard-byte-bounded; sampled artifact overshoot fails.
  Require 80 MiB pre-capture artifact headroom. No cap relaxation or retry loop.
- Keep profiler-on results separate. CLI analysis must use a uniquely named
  session and explicit loopback-only symbol server, with exact daemon cleanup.
  No raw-profile parsing. Buffer metadata alone does not prove retention.

## Verification

First run bounded fake tests for identity, clocks, marker privacy, timeout,
abort, player replacement, profiler refusal/configuration drift, dump failure,
stop failure and retained first failure. Exercise the actual generated frame
bridge and callback with fake inputs. Recheck existing collector/driver/capture
tests and the immutable source closure. Preserve failures without overwriting.

Before each runtime: quiet-host/resource admission, complete closure hashes,
fresh owned roots and package proof. After each: terminal report, zero log drops,
all recorded PIDs absent, installation hashes unchanged and private driver
mapping. Stop the pair on failed admission, observation or cleanup.

Analyze native drop markers across the whole interval, especially its first
eight seconds; public counter changes are asynchronous observations, not exact
drop timestamps. Establish thread/document/clock coverage before attributing
work to a process or interpreting absent markers. No physical-scanout or causal
GPU claim from wall-time markers alone.
