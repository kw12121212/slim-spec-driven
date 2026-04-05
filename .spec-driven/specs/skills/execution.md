# Skills Execution

### Requirement: apply-rebuilds-context-from-artifacts-and-specs
`spec-driven-apply` MUST treat the current change artifacts, relevant main specs, and
repository state as authoritative. Before implementation, it MUST load all five
artifacts for the change plus `.spec-driven/config.yaml`, `.spec-driven/specs/INDEX.md`,
and each relevant main spec file.

### Requirement: apply-blocks-on-open-questions
`spec-driven-apply` MUST check `questions.md` for open questions before
implementing. If any open `- [ ] Q:` entries exist, it MUST:

- list each unresolved question to the user
- ask the user to resolve those questions before implementation continues
- stop and wait for explicit user answers before making implementation changes

`spec-driven-apply` MAY recommend an answer or preferred option for each open
question, but it MUST present those recommendations as suggestions only. It
MUST NOT treat its own recommendation as a resolved answer, and it MUST NOT
mark the question resolved or continue implementation until the user has
explicitly confirmed the answer.

#### Scenario: apply-recommends-but-does-not-decide-open-question
- GIVEN `questions.md` contains an open implementation question
- WHEN `spec-driven-apply` inspects the change before coding
- THEN it may suggest a recommended answer
- AND it asks the user to confirm or replace that answer
- AND it does not edit implementation files or continue to the next task until
  the user explicitly resolves the question

### Requirement: apply-implements-tasks-in-order
`spec-driven-apply` MUST work through incomplete tasks in order, read relevant code
before changing it, verify unchanged behavior constraints, and mark each task complete
immediately after the corresponding work is done.

### Requirement: apply-runs-testing-tasks
When `spec-driven-apply` reaches tasks under `## Testing`, it MUST actually run the
relevant tests and confirm they pass before marking those tasks complete.

### Requirement: apply-syncs-delta-specs-with-implementation
After implementation, `spec-driven-apply` MUST re-read the change delta specs and
update them so they describe what was actually built rather than the original plan.

### Requirement: verify-produces-tiered-findings
`spec-driven-verify` MUST output a tiered report using CRITICAL, WARNING, and
SUGGESTION findings. CRITICAL findings block archive.

### Requirement: verify-checks-artifact-and-testing-readiness
`spec-driven-verify` MUST run the CLI `verify` check, report artifact format problems,
and promote the absence of a `## Testing` section in `tasks.md` to a CRITICAL issue.

### Requirement: verify-checks-task-completion-and-open-questions
`spec-driven-verify` MUST run the CLI `apply` summary to identify incomplete tasks and
MUST inspect `questions.md` for open questions. Incomplete tasks and open questions are
CRITICAL issues.

### Requirement: verify-checks-implementation-and-spec-alignment
`spec-driven-verify` MUST compare completed tasks, implementation evidence, proposal
scope, unchanged behavior, and delta specs. Empty delta specs alongside real behavior
changes, mismatched spec paths, and non-conforming delta format are CRITICAL issues.

### Requirement: review-loads-code-and-spec-context
`spec-driven-review` MUST read the change proposal, delta specs, design, tasks,
questions, config, and every changed file before issuing review findings.

### Requirement: review-focuses-on-code-and-test-quality
`spec-driven-review` MUST evaluate readability, security, error handling, performance,
best practices, and whether tests cover the key scenarios described by the delta specs.

### Requirement: review-uses-mustfix-shouldfix-nits
`spec-driven-review` MUST report findings using MUST FIX, SHOULD FIX, and NITS, and it
MUST treat MUST FIX issues as blockers to archive.
