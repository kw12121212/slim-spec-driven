# Design: add-questions-artifact

## Approach

### questions.md Format

```markdown
# Questions: <change-name>

## Open

- [ ] Q: <question text>
  Context: <why this matters / what depends on the answer>

## Resolved

- [x] Q: <question text>
  Context: <why this matters>
  A: <answer from human>
```

Questions use the same `- [ ]` / `- [x]` checkbox format as tasks.md, making them parseable by the same logic. Each question has a `Q:` prefix, optional `Context:` line, and a resolved question gets an `A:` line with the human's answer.

### Script Changes

1. **`propose`** — add `questions.md` to the created files with seed content
2. **`modify`** — include `questions.md` in the artifact listing
3. **`verify`** — check for open (unanswered) questions; open questions produce errors. Remove `[NEEDS CLARIFICATION]` checking logic.
4. **`getStatus`** — check `questions.md` for open questions to set "blocked" status. Remove `[NEEDS CLARIFICATION]` checking logic.
5. **`apply`** — no script change needed (apply only parses tasks.md)

### Skill Changes

1. **`spec-driven-propose`** — add step to fill questions.md with any open questions
2. **`spec-driven-apply`** — add check: if questions.md has open questions, stop and ask user to resolve
3. **`spec-driven-verify`** — add check for open questions as CRITICAL
4. **`spec-driven-modify`** — add questions.md as a modifiable artifact
5. **`spec-driven-archive`** — mention questions.md is included in archive (no special merge logic)
6. **`spec-driven-auto`** — integrate questions.md check into flow

### Test Changes

Add test cases for:
- `propose` creates `questions.md`
- `modify` lists `questions.md`
- `verify` warns on open questions
- `verify` passes when all questions resolved
- `getStatus` reports blocked when questions.md has open questions

## Key Decisions

1. **Checkbox format for questions** — reuses the same `- [ ]`/`- [x]` pattern as tasks, keeping parsing consistent. Questions are distinguished by the `Q:` prefix.

2. **Open questions are CRITICAL in verify** — open questions block archiving. Both `apply` and `verify` block on open questions to prevent implementing or archiving with unresolved ambiguity.

3. **Replace `[NEEDS CLARIFICATION]` entirely** — questions.md fully replaces the inline marker mechanism. Having two systems for the same purpose causes confusion. One centralized file is clearer.

## Alternatives Considered

1. **Keep both `[NEEDS CLARIFICATION]` and questions.md** — rejected because maintaining two parallel mechanisms for ambiguity tracking is confusing. One centralized file is simpler.

2. **Use a different format (YAML, JSON)** — rejected to stay consistent with the all-markdown approach of the framework.

3. **Make questions.md optional** — rejected because having it always present (even if empty with "No open questions") is simpler than conditional logic to check if it exists.
