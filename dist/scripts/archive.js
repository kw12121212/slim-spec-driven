#!/usr/bin/env node
import fs from "fs";
import path from "path";
const name = process.argv[2];
if (!name) {
    console.error("Usage: node dist/scripts/archive.js <change-name>");
    process.exit(1);
}
const changesDir = path.join(".spec-driven", "changes");
const changeDir = path.join(changesDir, name);
const archiveDir = path.join(changesDir, "archive");
if (!fs.existsSync(changeDir)) {
    console.error(`Error: change '${name}' not found at ${changeDir}`);
    process.exit(1);
}
const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
const archiveName = `${date}-${name}`;
const archivePath = path.join(archiveDir, archiveName);
if (fs.existsSync(archivePath)) {
    console.error(`Error: archive target already exists: ${archivePath}`);
    process.exit(1);
}
fs.mkdirSync(archiveDir, { recursive: true });
fs.renameSync(changeDir, archivePath);
console.log(`Archived: ${changeDir} → ${archivePath}`);
