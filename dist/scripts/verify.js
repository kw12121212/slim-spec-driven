#!/usr/bin/env node
import fs from "fs";
import path from "path";
const name = process.argv[2];
if (!name) {
    console.error("Usage: node dist/scripts/verify.js <change-name>");
    process.exit(1);
}
const changeDir = path.join(".spec-driven", "changes", name);
const warnings = [];
const errors = [];
if (!fs.existsSync(changeDir)) {
    errors.push(`Change directory not found: ${changeDir}`);
    console.log(JSON.stringify({ valid: false, warnings, errors }, null, 2));
    process.exit(0);
}
const required = ["proposal.md", "design.md", "tasks.md"];
for (const file of required) {
    const p = path.join(changeDir, file);
    if (!fs.existsSync(p)) {
        errors.push(`Missing required artifact: ${file}`);
        continue;
    }
    const content = fs.readFileSync(p, "utf-8").trim();
    if (content.length === 0) {
        errors.push(`Empty artifact: ${file}`);
        continue;
    }
    // Check for unfilled placeholders
    if (content.includes("[Describe") || content.includes("[List")) {
        warnings.push(`${file} contains unfilled placeholders`);
    }
}
// Check tasks.md for at least one task
const tasksPath = path.join(changeDir, "tasks.md");
if (fs.existsSync(tasksPath)) {
    const tasksContent = fs.readFileSync(tasksPath, "utf-8");
    const hasTask = /^\s*-\s*\[[x ]\]/im.test(tasksContent);
    if (!hasTask) {
        warnings.push("tasks.md has no checkboxes");
    }
    const allComplete = !/^\s*-\s*\[ \]/im.test(tasksContent);
    const anyTask = hasTask;
    if (anyTask && !allComplete) {
        warnings.push("tasks.md has incomplete tasks");
    }
}
const valid = errors.length === 0;
console.log(JSON.stringify({ valid, warnings, errors }, null, 2));
