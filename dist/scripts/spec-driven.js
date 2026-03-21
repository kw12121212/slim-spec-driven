#!/usr/bin/env node
import fs from "fs";
import path from "path";
const [command, ...args] = process.argv.slice(2);
const changesDir = path.join(".spec-driven", "changes");
function changeDir(name) {
    return path.join(changesDir, name);
}
function requireName(cmd) {
    if (!args[0]) {
        console.error(`Usage: node spec-driven.js ${cmd} <change-name>`);
        process.exit(1);
    }
    return args[0];
}
function requireChange(name) {
    const dir = changeDir(name);
    if (!fs.existsSync(dir)) {
        console.error(`Error: change '${name}' not found at ${dir}`);
        process.exit(1);
    }
    return dir;
}
switch (command) {
    case "propose":
        propose();
        break;
    case "modify":
        modify();
        break;
    case "apply":
        apply();
        break;
    case "verify":
        verify();
        break;
    case "archive":
        archive();
        break;
    case "cancel":
        cancel();
        break;
    case "init":
        init();
        break;
    default:
        console.error("Usage: node spec-driven.js <command> [args]");
        console.error("Commands: propose, modify, apply, verify, archive, cancel, init");
        process.exit(1);
}
function propose() {
    const name = requireName("propose");
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
        console.error("Error: name must be kebab-case (e.g. my-feature)");
        process.exit(1);
    }
    const dir = changeDir(name);
    if (fs.existsSync(dir)) {
        console.error(`Error: change '${name}' already exists at ${dir}`);
        process.exit(1);
    }
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "proposal.md"), `# ${name}\n\n## What\n\n[Describe what this change does]\n\n## Why\n\n[Describe the motivation and context]\n\n## Scope\n\n[List what is in scope and out of scope]\n`);
    fs.writeFileSync(path.join(dir, "design.md"), `# Design: ${name}\n\n## Approach\n\n[Describe the implementation approach]\n\n## Key Decisions\n\n[List significant decisions and their rationale]\n\n## Alternatives Considered\n\n[Describe alternatives that were ruled out]\n`);
    fs.writeFileSync(path.join(dir, "tasks.md"), `# Tasks: ${name}\n\n## Implementation\n\n- [ ] Task 1\n- [ ] Task 2\n- [ ] Task 3\n\n## Verification\n\n- [ ] Verify implementation matches proposal\n- [ ] Update specs if behavior changed\n`);
    console.log(`Created change: ${dir}`);
    console.log(`  ${path.join(dir, "proposal.md")}`);
    console.log(`  ${path.join(dir, "design.md")}`);
    console.log(`  ${path.join(dir, "tasks.md")}`);
}
function modify() {
    const name = args[0];
    if (!name) {
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
            for (const c of changes)
                console.log(`  ${c}`);
        }
        process.exit(0);
    }
    const dir = changeDir(name);
    if (!fs.existsSync(dir)) {
        console.error(`Error: change '${name}' not found at ${dir}`);
        process.exit(1);
    }
    console.log(`Artifacts for '${name}':`);
    for (const artifact of ["proposal.md", "design.md", "tasks.md"]) {
        const p = path.join(dir, artifact);
        console.log(`  ${p}${fs.existsSync(p) ? "" : " (missing)"}`);
    }
}
function apply() {
    const name = requireName("apply");
    const tasksPath = path.join(changeDir(name), "tasks.md");
    if (!fs.existsSync(tasksPath)) {
        console.error(`Error: tasks.md not found at ${tasksPath}`);
        process.exit(1);
    }
    const tasks = [];
    for (const line of fs.readFileSync(tasksPath, "utf-8").split("\n")) {
        const complete = /^\s*-\s*\[x\]\s+/i.test(line);
        const incomplete = /^\s*-\s*\[ \]\s+/i.test(line);
        if (complete || incomplete) {
            tasks.push({ text: line.replace(/^\s*-\s*\[[x ]\]\s+/i, "").trim(), complete });
        }
    }
    const total = tasks.length;
    const complete = tasks.filter((t) => t.complete).length;
    console.log(JSON.stringify({ total, complete, remaining: total - complete, tasks }, null, 2));
}
function verify() {
    const name = requireName("verify");
    const dir = changeDir(name);
    const warnings = [];
    const errors = [];
    if (!fs.existsSync(dir)) {
        errors.push(`Change directory not found: ${dir}`);
        console.log(JSON.stringify({ valid: false, warnings, errors }, null, 2));
        process.exit(0);
    }
    for (const file of ["proposal.md", "design.md", "tasks.md"]) {
        const p = path.join(dir, file);
        if (!fs.existsSync(p)) {
            errors.push(`Missing required artifact: ${file}`);
            continue;
        }
        const content = fs.readFileSync(p, "utf-8").trim();
        if (!content) {
            errors.push(`Empty artifact: ${file}`);
            continue;
        }
        if (content.includes("[Describe") || content.includes("[List")) {
            warnings.push(`${file} contains unfilled placeholders`);
        }
    }
    const tasksPath = path.join(dir, "tasks.md");
    if (fs.existsSync(tasksPath)) {
        const tc = fs.readFileSync(tasksPath, "utf-8");
        const hasTask = /^\s*-\s*\[[x ]\]/im.test(tc);
        if (!hasTask) {
            warnings.push("tasks.md has no checkboxes");
        }
        else if (/^\s*-\s*\[ \]/im.test(tc)) {
            warnings.push("tasks.md has incomplete tasks");
        }
    }
    console.log(JSON.stringify({ valid: errors.length === 0, warnings, errors }, null, 2));
}
function archive() {
    const name = requireName("archive");
    const src = requireChange(name);
    const date = new Date().toISOString().slice(0, 10);
    const archivePath = path.join(changesDir, "archive", `${date}-${name}`);
    if (fs.existsSync(archivePath)) {
        console.error(`Error: archive target already exists: ${archivePath}`);
        process.exit(1);
    }
    fs.mkdirSync(path.join(changesDir, "archive"), { recursive: true });
    fs.renameSync(src, archivePath);
    console.log(`Archived: ${src} → ${archivePath}`);
}
function cancel() {
    const name = requireName("cancel");
    const dir = requireChange(name);
    fs.rmSync(dir, { recursive: true, force: true });
    console.log(`Cancelled: ${dir}`);
}
function init() {
    const targetDir = args[0] ? path.resolve(args[0]) : process.cwd();
    const specDir = path.join(targetDir, ".spec-driven");
    if (fs.existsSync(specDir)) {
        console.error(`Error: .spec-driven/ already exists at ${specDir}`);
        process.exit(1);
    }
    fs.mkdirSync(path.join(specDir, "changes"), { recursive: true });
    fs.mkdirSync(path.join(specDir, "specs", "core"), { recursive: true });
    fs.writeFileSync(path.join(specDir, "config.yaml"), `schema: spec-driven\ncontext: |\n  [Project context — populated by user, injected into skill prompts]\nrules:\n  specs:\n    - Requirements specify observable behavior, not implementation details\n  tasks:\n    - Tasks should be independently completable\n`);
    fs.writeFileSync(path.join(specDir, "specs", "README.md"), `# Specs\n\nSpecs describe the current state of the system — what it does, not how it was built.\n\n## Organization\n\nGroup specs by domain area. Use kebab-case directory names (e.g. \`core/\`, \`api/\`, \`auth/\`).\n\n## Conventions\n\n- Write in present tense ("the system does X")\n- Describe observable behavior, not implementation details\n- Keep each spec focused on one area\n`);
    console.log(`Initialized: ${specDir}`);
    console.log(`  ${path.join(specDir, "config.yaml")}`);
    console.log(`  ${path.join(specDir, "specs", "README.md")}`);
    console.log(`  Edit config.yaml to add project context`);
}
