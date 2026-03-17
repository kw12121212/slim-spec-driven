#!/usr/bin/env node
import fs from "fs";
import path from "path";
const name = process.argv[2];
if (!name) {
    console.error("Usage: node dist/scripts/propose.js <kebab-case-name>");
    process.exit(1);
}
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
    console.error("Error: name must be kebab-case (e.g. my-feature)");
    process.exit(1);
}
const changeDir = path.join(".spec-driven", "changes", name);
if (fs.existsSync(changeDir)) {
    console.error(`Error: change '${name}' already exists at ${changeDir}`);
    process.exit(1);
}
fs.mkdirSync(changeDir, { recursive: true });
fs.writeFileSync(path.join(changeDir, "proposal.md"), `# ${name}\n\n## What\n\n[Describe what this change does]\n\n## Why\n\n[Describe the motivation and context]\n\n## Scope\n\n[List what is in scope and out of scope]\n`);
fs.writeFileSync(path.join(changeDir, "design.md"), `# Design: ${name}\n\n## Approach\n\n[Describe the implementation approach]\n\n## Key Decisions\n\n[List significant decisions and their rationale]\n\n## Alternatives Considered\n\n[Describe alternatives that were ruled out]\n`);
fs.writeFileSync(path.join(changeDir, "tasks.md"), `# Tasks: ${name}\n\n## Implementation\n\n- [ ] Task 1\n- [ ] Task 2\n- [ ] Task 3\n\n## Verification\n\n- [ ] Verify implementation matches proposal\n- [ ] Update specs if behavior changed\n`);
console.log(`Created change: ${changeDir}`);
console.log(`  ${path.join(changeDir, "proposal.md")}`);
console.log(`  ${path.join(changeDir, "design.md")}`);
console.log(`  ${path.join(changeDir, "tasks.md")}`);
