#!/usr/bin/env node
import fs from "fs";
import path from "path";
const name = process.argv[2];
if (!name) {
    console.error("Usage: node dist/scripts/apply.js <change-name>");
    process.exit(1);
}
const tasksPath = path.join(".spec-driven", "changes", name, "tasks.md");
if (!fs.existsSync(tasksPath)) {
    console.error(`Error: tasks.md not found at ${tasksPath}`);
    process.exit(1);
}
const content = fs.readFileSync(tasksPath, "utf-8");
const lines = content.split("\n");
const tasks = [];
for (const line of lines) {
    const complete = /^\s*-\s*\[x\]\s+/i.test(line);
    const incomplete = /^\s*-\s*\[ \]\s+/i.test(line);
    if (complete || incomplete) {
        const text = line.replace(/^\s*-\s*\[[x ]\]\s+/i, "").trim();
        tasks.push({ text, complete });
    }
}
const total = tasks.length;
const complete = tasks.filter((t) => t.complete).length;
const remaining = total - complete;
console.log(JSON.stringify({ total, complete, remaining, tasks }, null, 2));
