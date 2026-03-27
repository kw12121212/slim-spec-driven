# Delta: Skills Lifecycle

## MODIFIED Requirements

### Requirement: auto-applies-complexity-gate
`spec-driven-auto` MUST assess scope, touched modules/files, and risk areas before
starting using a three-tier model:

- **Green** (proceed): touches ≤ 6 modules, modifies ≤ 20 files, clear scope,
  straightforward schema migrations, additive auth/authz/payment changes — proceed
  without additional confirmation beyond the standard proposal checkpoint.
- **Yellow** (warn): touches 7-15 modules, modifies 21-50 files, schema migrations
  with data transformation, auth/authz/payment changes that modify existing logic,
  cross-cutting changes — MUST show the assessment to the user and require explicit
  confirmation before proceeding.
- **Red** (suggest brainstorm): requires multi-service/multi-repo coordination,
  vague/open-ended scope, no clear definition of done — MUST suggest running
  `/spec-driven-brainstorm` first to converge the idea, then entering auto to
  execute the resulting proposal.

If the change falls into the Yellow tier, `spec-driven-auto` MUST list the specific
risk factors and wait for the user to confirm before proceeding.
