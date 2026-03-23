# Questions: add-questions-artifact

## Open

## Resolved

- [x] Q: Should open questions in `verify` be CRITICAL (blocks archive) or WARNING (non-blocking)?
  Context: Design doc says warnings in verify but CRITICAL in the skill. The apply skill already blocks on open questions. If verify also makes them CRITICAL, then archiving a change with unanswered questions is impossible. If WARNING, the human can choose to archive anyway.
  A: CRITICAL — open questions block archiving.

- [x] Q: Should `getStatus()` return "blocked" when questions.md has open questions, even if no `[NEEDS CLARIFICATION]` markers exist?
  Context: Currently "blocked" status only triggers on `[NEEDS CLARIFICATION]` markers. Adding questions.md as another blocked trigger changes the status semantics. This could affect the `list` command output.
  A: Yes — open questions in questions.md trigger "blocked" status.
