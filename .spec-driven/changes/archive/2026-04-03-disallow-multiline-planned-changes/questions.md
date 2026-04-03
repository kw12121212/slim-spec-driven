# Questions: disallow-multiline-planned-changes

## Open

<!-- No open questions -->

## Resolved

- [x] Q: Should the change include migration of existing milestone files that
  currently use multiline planned change descriptions?
  Context: Tightening the validation rule would otherwise leave the repository's
  current roadmap files non-compliant as soon as the implementation lands.
  A: Yes. The change should include migrating the existing milestone files to
  compliant single-line descriptions.
