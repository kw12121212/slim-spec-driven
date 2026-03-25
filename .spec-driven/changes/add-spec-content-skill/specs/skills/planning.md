## ADDED Requirements

### Requirement: spec-content-classifies-spec-targets-from-index
`spec-driven-spec-content` MUST read `.spec-driven/specs/INDEX.md` before deciding
where requested spec content belongs. It MUST classify the request into one of:
editing an existing spec file, adding a new file under an existing category,
adding a new category with a new file, modifying existing requirements, or
removing existing requirements.

### Requirement: spec-content-loads-relevant-main-specs-before-editing
After reading `INDEX.md`, `spec-driven-spec-content` MUST read the relevant main
spec file or files before editing any delta spec content. If a matching delta spec
file already exists under `changes/<name>/specs/`, it MUST read that file too
before appending or revising content.

### Requirement: spec-content-validates-and-names-removals
After editing delta specs, `spec-driven-spec-content` MUST run the workflow
verification step and fix any safe-to-repair format issues before finishing. If a
verify result contains only non-format workflow blockers such as open questions,
the skill MUST surface them separately and MUST NOT misreport them as spec-format
failures. If a
request removes behavior, the skill MUST name the exact `### Requirement:`
heading or headings being removed and place them under `## REMOVED Requirements`
with a reason; it MUST NOT describe removals vaguely.
