# Tasks: add-basic-ship-step

## Implementation

- [x] Add `skills/spec-driven-ship/SKILL.md` with Agent Skills frontmatter and the lightweight post-archive ship workflow.
- [x] Update workflow and lifecycle specs so ship is optional, explicit, and gated on verification, review, archive, and roadmap reconciliation.
- [x] Update `install.sh` so `spec-driven-ship` is copied into the agent store and linked for supported CLIs.
- [x] Add or update validation coverage so the new ship skill is schema-valid and source skill script symlink expectations are satisfied.
- [x] Add or update installer test coverage so `spec-driven-ship` is included with bundled skills.
- [x] Re-read the updated ship prompt and affected specs to confirm PR, deployment, release, canary, and TypeScript CLI ship behavior are not introduced.

## Testing

- [x] Run `npm run build` to confirm TypeScript validation passes.
- [x] Run `npm run validate-skills` to confirm bundled skill validation passes.
- [x] Run unit tests with `npm test`.
- [x] Run `node dist/scripts/spec-driven.js verify add-basic-ship-step` to confirm proposal artifacts remain valid.

## Verification

- [x] Verify `spec-driven-ship` blocks unless the target change is archived.
- [x] Verify `spec-driven-ship` checks roadmap status before pushing when roadmap assets exist.
- [x] Verify the ship workflow is limited to a simple commit and push.
- [x] Verify no PR, deployment, release, canary, package publication, or new TypeScript ship subcommand is added.
- [x] Verify existing apply, verify, review, archive, and roadmap reconciliation behavior remains unchanged.
