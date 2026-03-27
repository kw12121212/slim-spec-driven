# relax-auto-complexity-gate

## What

Relax the `spec-driven-auto` skill's complexity gate so it can handle a much broader range of changes. Currently, the auto workflow hard-rejects changes that touch more than 3 modules, modify more than ~10 files, involve database schema migrations, affect auth/authz/payment flows, require multi-service coordination, or have vague scope. This proposal replaces most hard rejections with a tiered assessment: most changes pass through or get a confirmation prompt, and only truly dangerous changes (multi-repo coordination, vague scope) remain hard blocks.

## Why

The current thresholds are far too conservative for everyday use. Many reasonable changes (e.g., adding a feature that touches 5-10 modules, modifying 20+ files, or a schema migration) are rejected and force users into the manual step-by-step workflow, which is slower and more tedious. Users who invoke `/spec-driven-auto` have already opted into automation — they should be given the choice to proceed for all but the most dangerous changes.

## Scope

**In scope:**
- Relaxing the complexity gate in `skills/spec-driven-auto/SKILL.md`
- Updating the `auto-applies-complexity-gate` requirement in `.spec-driven/specs/skills/lifecycle.md`

**Out of scope:**
- Changes to other skills (propose, apply, verify, review, archive)
- Changes to scripts (no script changes needed)
- Changes to the step-by-step workflow behavior

## Unchanged Behavior

- The mandatory proposal confirmation checkpoint in Step 2 remains unchanged
- All stepwise gates (open-question resolution, verification blockers, empty-delta confirmation) remain unchanged
- The `auto-stops-on-unfixable-blockers` behavior remains unchanged
- All other skills' behavior is unchanged
