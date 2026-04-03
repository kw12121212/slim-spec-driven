# Delta: Scripts Behavior

## MODIFIED Requirements

### Requirement: verify-roadmap-validates-planned-change-entry-format
Previously: For each bullet under `## Planned Changes`, `verify-roadmap` MUST require the
canonical entry format `- \`<change-name>\` - <summary>`.

`<change-name>` MUST match the change naming rule
`^[a-z0-9]+(-[a-z0-9]+)*$`. `<summary>` MUST be present and non-empty.

If a planned change bullet omits the summary, uses a malformed change name, or
does not follow the canonical format, the command MUST report the milestone as
invalid.

Indented continuation lines MAY appear below a valid top-level planned change
entry. They MUST belong to the immediately preceding planned change entry.
Non-empty detail lines under `## Planned Changes` that are not indented and are
not valid top-level planned change bullets MUST be reported as invalid.

#### Scenario: described-planned-change-is-valid
- GIVEN a milestone lists a planned change entry in the form
  `- \`define-generated-artifact-schemas\` - define the YAML schema shape for generated planning artifacts`
- WHEN `verify-roadmap` validates the file
- THEN the planned change entry is accepted
- AND `roadmap-status` can still resolve the change by the name
  `define-generated-artifact-schemas`

#### Scenario: multiline-planned-change-detail-is-valid
- GIVEN a milestone lists a valid planned change first line
- AND one or more indented continuation lines immediately below it
- WHEN `verify-roadmap` validates the file
- THEN the milestone remains valid
- AND `roadmap-status` resolves the planned change by the top-level first line

For each bullet under `## Planned Changes`, `verify-roadmap` MUST require the
canonical entry format `- \`<change-name>\` - <summary>`.

`<change-name>` MUST match the change naming rule
`^[a-z0-9]+(-[a-z0-9]+)*$`. `<summary>` MUST be present, non-empty, and fully
contained on the same line as the planned change bullet.

If a planned change bullet omits the summary, uses a malformed change name,
does not follow the canonical format, or is followed by attached indented
continuation lines, the command MUST report the milestone as invalid.

Any non-empty line under `## Planned Changes` that is not itself a valid
top-level planned change bullet MUST be reported as invalid.

#### Scenario: described-planned-change-is-valid
- GIVEN a milestone lists a planned change entry in the form
  `- \`define-generated-artifact-schemas\` - define the YAML schema shape for generated planning artifacts`
- WHEN `verify-roadmap` validates the file
- THEN the planned change entry is accepted
- AND `roadmap-status` can still resolve the change by the name
  `define-generated-artifact-schemas`

#### Scenario: multiline-planned-change-detail-is-invalid
- GIVEN a milestone lists a valid planned change first line
- AND one or more indented continuation lines immediately below it
- WHEN `verify-roadmap` validates the file
- THEN the milestone is reported as invalid
- AND the result explains that planned change descriptions must remain single-line

### Requirement: roadmap-status-reports-milestone-and-change-state
Previously: `spec-driven.js roadmap-status [path]` MUST inspect roadmap milestone files in
the target repository (or CWD), compare each listed planned change against
`.spec-driven/changes/` and `.spec-driven/changes/archive/`, and output JSON.

When milestone files use planned change bullets in the canonical format
`- \`<change-name>\` - <summary>`, the command MUST resolve roadmap state from
the `<change-name>` portion and MUST ignore the trailing summary when matching
active or archived changes.

If a planned change entry includes additional indented continuation lines below
that canonical first line, `roadmap-status` and archive reconciliation MUST
continue to resolve roadmap state from the top-level first line only.

`spec-driven.js roadmap-status [path]` MUST inspect roadmap milestone files in
the target repository (or CWD), compare each listed planned change against
`.spec-driven/changes/` and `.spec-driven/changes/archive/`, and output JSON.

When milestone files use planned change bullets in the canonical format
`- \`<change-name>\` - <summary>`, the command MUST resolve roadmap state from
the `<change-name>` portion and MUST ignore the trailing summary when matching
active or archived changes.

`roadmap-status` and archive reconciliation MUST treat multiline planned change
detail as invalid roadmap input rather than as attached metadata belonging to a
valid planned change entry.
