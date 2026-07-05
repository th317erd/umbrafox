# Umbrafox conversion guide

This folder is the living conversion playbook for turning a fresh Firefox source tree into Umbrafox.

It is intentionally outside Firefox's Sphinx documentation tree. These files are project operational notes, not upstream Firefox source docs, so keeping them at the repository root avoids extra `SPHINX_TREES`, `docs/config.yml`, and toctree maintenance.

## Current snapshot

The current conversion was documented from this working tree:

- Repository: `/home/wyatt/Projects/umbrafox-workspace/umbrafox`
- Branch: `main`
- Fork remote: `origin git@github.com:th317erd/umbrafox.git`
- Upstream remote: `upstream git@github.com:mozilla-firefox/firefox.git`
- Base commit at time of documentation: `24cab6a0399d Bug 2048371 - Use browser theme for all in-app themes`
- Current Umbrafox conversion state: uncommitted working-tree changes, not a commit series yet
- Scope observed: 139 tracked files changed plus one new xpcshell test file at `browser/components/newtab/test/xpcshell/test_UmbrafoxHomeDefaults.js`

## How to use this folder

When new Firefox source arrives:

1. Read `00-current-state.md` to understand what the current patch does.
2. Follow `01-rebase-workflow.md` to prepare a clean update branch.
3. Apply recipes in order:
   - `recipes/01-application-identity-and-branding.md`
   - `recipes/02-brand-assets.md`
   - `recipes/03-profile-defaults-and-homepage.md`
   - `recipes/04-search-engine-policy.md`
   - `recipes/05-preferences-ui-stripping.md`
   - `recipes/06-data-collection-and-remote-features.md`
   - `recipes/07-localization-and-copy-sweep.md`
   - `recipes/08-tests-and-verification.md`
4. Use `reference/changed-files.md` as the file-level checklist.
5. Use `reference/known-gotchas.md` before deciding a rebase is done.

## Maintenance rule

Every intentional Umbrafox behavior change should get a recipe update in the same patch or work session that introduces the change. Add a new recipe if the behavior is its own subsystem. Extend an existing recipe if the change is a refinement of that subsystem.

Keep recipes practical:

- State the user-visible goal.
- List the exact files.
- Explain the data flow or code path.
- Include conflict markers to look for during rebases.
- Include verification commands.
- Note profile-reset requirements when defaults are involved.
