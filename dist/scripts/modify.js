#!/usr/bin/env node
import fs from "fs";
import path from "path";
const name = process.argv[2];
const changesDir = path.join(".spec-driven", "changes");
if (!name) {
    // List all active changes (exclude archive/)
    if (!fs.existsSync(changesDir)) {
        console.log("No .spec-driven/changes/ directory found.");
        process.exit(0);
    }
    const entries = fs.readdirSync(changesDir, { withFileTypes: true });
    const changes = entries
        .filter((e) => e.isDirectory() && e.name !== "archive")
        .map((e) => e.name);
    if (changes.length === 0) {
        console.log("No active changes.");
    }
    else {
        console.log("Active changes:");
        for (const c of changes) {
            console.log(`  ${c}`);
        }
    }
    process.exit(0);
}
const changeDir = path.join(changesDir, name);
if (!fs.existsSync(changeDir)) {
    console.error(`Error: change '${name}' not found at ${changeDir}`);
    process.exit(1);
}
const artifacts = ["proposal.md", "design.md", "tasks.md"];
console.log(`Artifacts for '${name}':`);
for (const artifact of artifacts) {
    const p = path.join(changeDir, artifact);
    const exists = fs.existsSync(p);
    console.log(`  ${p}${exists ? "" : " (missing)"}`);
}
