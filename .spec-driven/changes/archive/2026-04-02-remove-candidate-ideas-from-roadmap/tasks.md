# Tasks: remove-candidate-ideas-from-roadmap

## Implementation

- [x] Update roadmap and script delta specs to remove `Candidate Ideas` from the
  milestone format and preserve `Planned Changes` as the only committed roadmap
  work list
- [x] Update roadmap-related prompts, docs, templates, and examples to use the
  simplified milestone structure and revised wording
- [x] Update roadmap CLI behavior and automated tests so roadmap validation and
  status flows no longer depend on candidate-ideas sections or counts

## Testing

- [x] Run `npm run build`
- [x] Run `bash test/run.sh`

## Verification

- [x] Run `node dist/scripts/spec-driven.js verify remove-candidate-ideas-from-roadmap`
