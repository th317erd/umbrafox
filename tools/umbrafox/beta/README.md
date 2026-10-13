# Opt-in Performance Beta

Wyatt explicitly requested this experimental package on October 12, 2026,
including the GPU video-to-canvas path despite its two failed smoothness gates.
This is a package-specific user opt-in, not a change to normal browser defaults
or a claim of release acceptance, universal pixel parity, or a YouTube fix.

After the normal native build and `mach package`, place `umbrafox-beta.js` in
the self-contained package's root `defaults/pref/` directory. Firefox loads this
directory in addition to the packaged preferences. Repack and hash the modified
package; retain the source revision, build configuration and preference-file hash.
Do not copy a symlinked `dist/bin` tree as an installation.

The overlay enables exactly:

- `gfx.canvas.remote.use-draw-image-fast-path-dmabuf`
- `gfx.webrender.single-image-opacity.enabled`

The request eligibility, request-header handling, userland lifecycle cleanup,
DOM mutation gates, readback/cache work and producer-fence changes are already
part of the source and do not need extra user preferences. Hardware eligibility,
fallbacks and security boundaries remain intact. This overlay does not force
unsupported hardware, disable a sandbox, change the user agent, start profiling,
enable diagnostic logging, activate user scripts, or alter an update channel.
Build with `--disable-umbra-perf-probes` for this dogfood package.

These defaults remain user-overridable. Setting either preference to `false`
disables that experiment; restarting ensures a consistent comparison. Do not
rewrite an active profile or restart the owner's working browser to apply them.
Installation/default-profile selection needs explicit verification before switching
the daily launcher, because Firefox has per-installation profile mappings.

Run `node --test tools/umbrafox/beta/test/preferences-spec.mjs` to verify the exact
overlay and that normal builds still default both experiments to off. Native
compilation, isolated startup/preference verification and relevant graphics tests
are separate acceptance gates; these two source tests do not replace them.
