# add-questions-artifact

## What

Add a `questions.md` artifact to each spec-driven change. When the AI proposes a change, it documents questions and uncertainties in `questions.md`. Humans review and answer these questions to ensure the proposal, design, and specs are correct before implementation begins.

## Why

Currently, the AI marks ambiguities with `[NEEDS CLARIFICATION]` inline markers scattered across proposal.md, design.md, and spec delta files. This has two problems:

1. **Discoverability** — the human must scan all artifacts to find what needs answering
2. **Conversation flow** — there is no dedicated place for the Q&A exchange; answers get mixed into artifact edits

A dedicated `questions.md` centralizes all open questions in one place, making it easy for the human to see what needs answering and for the AI to check whether all questions are resolved before proceeding.

## Scope

**In scope:**
- Add `questions.md` as a fifth artifact in each change directory
- Script: `propose` creates a seed `questions.md`
- Script: `modify` lists `questions.md` in artifact paths
- Script: `verify` checks for unanswered questions
- Script: `getStatus` checks `questions.md` for blocked state
- Skills: `propose` fills questions.md with open questions; `apply` checks it before implementing; `verify` checks it; `modify` supports editing it; `archive` includes it; `auto` integrates it
- Tests: cover the new artifact

**Out of scope:**
- Any UI or interactive features beyond the markdown file

**Also in scope (replacement):**
- Remove all `[NEEDS CLARIFICATION]` inline marker logic from scripts and skills — questions.md fully replaces this mechanism

## Unchanged Behavior

- Existing four artifacts (proposal.md, specs/, design.md, tasks.md) retain their current format and behavior
- archive, cancel, init, migrate, list subcommands retain their current behavior (archive/cancel just include the file as-is)
