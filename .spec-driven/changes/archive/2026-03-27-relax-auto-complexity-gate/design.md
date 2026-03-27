# Design: relax-auto-complexity-gate

## Approach

Replace the binary reject/accept complexity gate with a three-tier assessment:

1. **Green (proceed automatically)** — changes that pose low to moderate risk:
   - Touches ≤ 6 modules or packages
   - Modifies ≤ 20 files
   - Clear, well-defined scope
   - Straightforward schema migrations (add column, create table, simple data backfill)
   - Additive auth/authz/payment changes (e.g., adding a new role, a new permission, a new payment method)

2. **Yellow (warn and ask)** — changes that are larger but still automatable:
   - Touches 7-15 modules or packages
   - Modifies 21-50 files
   - Schema migrations involving data transformation or multi-step rollout
   - Auth/authz/payment changes that modify existing logic (not purely additive)
   - Cross-cutting changes touching multiple subsystems
   - The user is shown the assessment and must explicitly confirm before proceeding

3. **Red (hard block)** — truly dangerous changes that the auto workflow cannot safely handle:
   - Requires coordinating across multiple services or repositories
   - Scope is vague or open-ended (e.g. "refactor the codebase", "improve performance")
   - No clear definition of what "done" looks like

The key insight: users invoking `/spec-driven-auto` have already chosen automation. The gate should inform them of risk, not override their choice — except for cases where the auto workflow genuinely cannot produce a good result (multi-repo, vague scope).

## Key Decisions

- **Tiered model over raised thresholds**: Rather than simply bumping the numbers, a tiered model gives the user agency. They see the assessment and decide. This preserves safety while removing friction.
- **Schema migrations into Green**: Most schema changes in practice are straightforward (add column, create table). These are well within auto capability. Only complex data transformations move to Yellow.
- **Additive auth/authz/payment into Green**: Adding a new role or permission is a routine change. Only modifying existing security logic moves to Yellow.
- **Red tier is minimal**: Only multi-repo coordination and vague scope remain as hard blocks. Everything else is automatable with appropriate user confirmation.

## Alternatives Considered

- **Remove the complexity gate entirely**: Too risky for vague/open-ended scope and multi-repo changes. The gate serves an important safety function for cases where the auto workflow genuinely cannot produce a good result.
- **Add a `--force` flag to bypass the gate**: Adds complexity to the skill interface and encourages skipping safety checks. The yellow tier already serves this purpose — the user confirms they want to proceed.
