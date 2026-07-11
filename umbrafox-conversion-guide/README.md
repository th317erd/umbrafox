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
- Current Umbrafox conversion state: committed as `5d89f338f5e9 Convert Firefox to Umbrafox`
- Scope observed before the mandatory rules guide: 139 tracked files changed plus one new xpcshell test file at `browser/components/newtab/test/xpcshell/test_UmbrafoxHomeDefaults.js`

## How to use this folder

When new Firefox source arrives:

1. Read `00-current-state.md` to understand what the current patch does.
2. Read `02-mandatory-modification-rules.md`; these rules govern every Umbrafox patch.
3. Read feature architecture notes for any subsystem you are touching:
   - `03-userland-scripts-architecture.md`
4. Read design plans for future features you are about to implement:
   - `plans/01-userland-mutation-events.md`
   - `plans/02-bot-control-channel.md`
   - `plans/03-local-control-channel.md`
5. Follow `01-rebase-workflow.md` to prepare a clean update branch.
6. Apply recipes in order:
   - `recipes/01-application-identity-and-branding.md`
   - `recipes/02-brand-assets.md`
   - `recipes/03-profile-defaults-and-homepage.md`
   - `recipes/04-search-engine-policy.md`
   - `recipes/05-preferences-ui-stripping.md`
   - `recipes/06-data-collection-and-remote-features.md`
   - `recipes/07-localization-and-copy-sweep.md`
   - `recipes/08-tests-and-verification.md`
   - `recipes/09-userland-scripts.md`
   - `recipes/10-userland-mutation-events.md`
   - `recipes/11-bot-control-channel.md`
   - `recipes/12-local-control-input.md`
7. Use `reference/changed-files.md` as the file-level checklist.
8. Use `reference/known-gotchas.md` before deciding a rebase is done.

## Mandatory rules

All future work must obey `02-mandatory-modification-rules.md`. The central rule is that Umbrafox may identify itself in browser chrome and internal project materials, but websites and servers must not be able to distinguish it from the corresponding Firefox build unless the user explicitly chooses detectable userland customization.

The rulebook also establishes that Umbrafox is intentionally a sharp power-user tool: users may be given dangerous controls, including interception, rewriting, injection, and blocking controls, but defaults must stay unobtrusive and Firefox-equivalent. Agents and contributors must push back when a request conflicts with the rulebook.

## Maintenance rule

Every intentional Umbrafox behavior change should get a recipe update in the same patch or work session that introduces the change. Add a new recipe if the behavior is its own subsystem. Extend an existing recipe if the change is a refinement of that subsystem.

Keep recipes practical:

- State the user-visible goal.
- List the exact files.
- Explain the data flow or code path.
- Include conflict markers to look for during rebases.
- Include verification commands.
- Note profile-reset requirements when defaults are involved.
