#!/usr/bin/env node
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
const [command, ...args] = process.argv.slice(2);
const changesDir = path.join(".spec-driven", "changes");
const INIT_CONFIG_YAML = [
    "schema: spec-driven",
    "context: |",
    "  [Project context — populated by user, injected into skill prompts]",
    "rules:",
    "  specs:",
    "    - Describe observable behavior only — no implementation details, technology",
    "      choices, or internal structure",
    "    - MUST = required with no exceptions; SHOULD = default unless explicitly",
    "      justified; MAY = genuinely optional",
    "    - Each requirement must be independently verifiable from outside the system",
    "  change:",
    "    - Implement only what is in scope in proposal.md — if scope needs to expand,",
    "      use /spec-driven-modify first, never expand silently",
    "    - When a requirement or task is ambiguous, ask the user before proceeding —",
    "      do not assume or guess",
    "    - Delta specs must reflect what was actually built, not the original plan",
    "    - Mark tasks [x] immediately upon completion — never batch at the end",
    "    - Every change must include test tasks (lint + unit tests at minimum)",
    "  code:",
    "    - Read existing code before modifying it",
    "    - Implement only what the current task requires — no speculative features",
    "    - No abstractions for hypothetical future needs (YAGNI)",
    "  test:",
    "    - Tests must verify observable behavior described in specs, not internal",
    "      implementation details",
    "    - Each test must be independent — no shared mutable state between tests",
    "    - Prefer real dependencies over mocks for code the project owns",
    "# fileMatch:              # per-pattern rules applied in addition to global rules above",
    "#   - pattern: \"**/*.test.*\"",
    "#     rules:",
    "#       - Tests must cover happy path, error cases, and edge cases",
    "",
].join("\n");
const INIT_INDEX_MD = `# Specs Index\n\n<!-- One entry per spec file. Updated by /spec-driven-archive after each change. -->\n`;
const INIT_README_MD = `# Specs\n\nSpecs describe the current state of the system — what it does, not how it was built.\n\n## Format\n\n\`\`\`markdown\n### Requirement: <name>\nThe system MUST/SHOULD/MAY <observable behavior>.\n\n#### Scenario: <name>\n- GIVEN <precondition>\n- WHEN <action>\n- THEN <expected outcome>\n\`\`\`\n\n**Keywords**: MUST = required, SHOULD = recommended, MAY = optional (RFC 2119).\n\n## Organization\n\nGroup specs by domain area. Use kebab-case directory names (e.g. \`core/\`, \`api/\`, \`auth/\`).\n\n## Conventions\n\n- Write in present tense ("the system does X")\n- Describe observable behavior, not implementation details\n- Keep each spec focused on one area\n`;
const INIT_ROADMAP_INDEX_MD = `# Roadmap Index\n\n<!-- One entry per milestone file in execution order. -->\n`;
const DEFAULT_MAINTENANCE_CHANGE_PREFIX = "maintenance";
const DEFAULT_MAINTENANCE_BRANCH_PREFIX = "maintenance";
const DEFAULT_MAINTENANCE_COMMIT_PREFIX = "chore: maintenance";
const supportedMigrationTools = [
    {
        name: "claude",
        rootDir: ".claude",
        skillsDir: path.join(".claude", "skills"),
        commandsDir: path.join(".claude", "commands"),
    },
    {
        name: "opencode",
        rootDir: ".opencode",
        skillsDir: path.join(".opencode", "skills"),
        commandsDir: path.join(".opencode", "commands"),
    },
];
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
function findMdFiles(dir, base = "") {
    if (!fs.existsSync(dir))
        return [];
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
        const rel = base ? `${base}/${e.name}` : e.name;
        if (e.isDirectory())
            return findMdFiles(path.join(dir, e.name), rel);
        return e.name.endsWith(".md") ? [rel] : [];
    });
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
    case "verify-roadmap":
        verifyRoadmap();
        break;
    case "roadmap-status":
        roadmapStatus();
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
    case "run-maintenance":
        runMaintenance();
        break;
    case "migrate":
        migrate();
        break;
    case "list":
        list();
        break;
    default:
        console.error("Usage: node spec-driven.js <command> [args]");
        console.error("Commands: propose, modify, apply, verify, verify-roadmap, roadmap-status, archive, cancel, init, run-maintenance, migrate, list");
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
    fs.mkdirSync(path.join(dir, "specs"), { recursive: true });
    fs.writeFileSync(path.join(dir, "proposal.md"), `# ${name}\n\n## What\n\n[Describe what this change does]\n\n## Why\n\n[Describe the motivation and context]\n\n## Scope\n\n[List what is in scope and out of scope]\n\n## Unchanged Behavior\n\nBehaviors that must not change as a result of this change (leave blank if nothing is at risk):\n`);
    fs.writeFileSync(path.join(dir, "design.md"), `# Design: ${name}\n\n## Approach\n\n[Describe the implementation approach]\n\n## Key Decisions\n\n[List significant decisions and their rationale]\n\n## Alternatives Considered\n\n[Describe alternatives that were ruled out]\n`);
    fs.writeFileSync(path.join(dir, "tasks.md"), `# Tasks: ${name}\n\n## Implementation\n\n- [ ] Task 1\n- [ ] Task 2\n- [ ] Task 3\n\n## Testing\n\n- [ ] Lint passes\n- [ ] Unit tests pass\n\n## Verification\n\n- [ ] Verify implementation matches proposal\n`);
    fs.writeFileSync(path.join(dir, "questions.md"), `# Questions: ${name}\n\n## Open\n\n<!-- Add open questions here using the format below -->\n<!-- - [ ] Q: <question text> -->\n<!--   Context: <why this matters / what depends on the answer> -->\n\n## Resolved\n\n<!-- Resolved questions are moved here with their answers -->\n<!-- - [x] Q: <question text> -->\n<!--   Context: <why this matters> -->\n<!--   A: <answer from human> -->\n`);
    console.log(`Created change: ${dir}`);
    console.log(`  ${path.join(dir, "proposal.md")}`);
    console.log(`  ${path.join(dir, "specs")}/ (populate to mirror .spec-driven/specs/ structure)`);
    console.log(`  ${path.join(dir, "design.md")}`);
    console.log(`  ${path.join(dir, "tasks.md")}`);
    console.log(`  ${path.join(dir, "questions.md")}`);
}
function getStatus(name) {
    const dir = changeDir(name);
    // Check questions.md for open (unanswered) questions
    const questionsPath = path.join(dir, "questions.md");
    if (fs.existsSync(questionsPath)) {
        const qc = fs.readFileSync(questionsPath, "utf-8");
        const hasOpenQuestion = qc.split("\n").some((l) => /^\s*-\s*\[ \]\s+Q:/i.test(l));
        if (hasOpenQuestion)
            return "blocked";
    }
    // Check task completion
    const tasksPath = path.join(dir, "tasks.md");
    if (!fs.existsSync(tasksPath))
        return "proposed";
    const content = fs.readFileSync(tasksPath, "utf-8");
    let total = 0, complete = 0;
    for (const line of content.split("\n")) {
        if (/^\s*-\s*\[x\]\s+/i.test(line)) {
            total++;
            complete++;
        }
        else if (/^\s*-\s*\[ \]\s+/i.test(line)) {
            total++;
        }
    }
    if (total === 0)
        return "proposed";
    if (complete === 0)
        return "proposed";
    if (complete === total)
        return "done";
    return `in-progress (${complete}/${total})`;
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
                console.log(`  ${c}    ${getStatus(c)}`);
        }
        process.exit(0);
    }
    const dir = changeDir(name);
    if (!fs.existsSync(dir)) {
        console.error(`Error: change '${name}' not found at ${dir}`);
        process.exit(1);
    }
    console.log(`Artifacts for '${name}':`);
    for (const artifact of ["proposal.md", "design.md", "tasks.md", "questions.md"]) {
        const p = path.join(dir, artifact);
        console.log(`  ${p}${fs.existsSync(p) ? "" : " (missing)"}`);
    }
    const specsDir = path.join(dir, "specs");
    const specFiles = findMdFiles(specsDir);
    if (specFiles.length === 0) {
        console.log(`  ${specsDir}/ (empty)`);
    }
    else {
        for (const f of specFiles) {
            console.log(`  ${path.join(specsDir, f)}`);
        }
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
    const specsDir = path.join(dir, "specs");
    if (!fs.existsSync(specsDir)) {
        errors.push("Missing required directory: specs/");
    }
    else {
        const specFiles = findMdFiles(specsDir);
        if (specFiles.length === 0) {
            warnings.push("specs/ is empty — add delta files mirroring the main .spec-driven/specs/ structure");
        }
        else {
            const skipLines = new Set([
                "Leave a section empty if it does not apply.",
                "Use RFC 2119 keywords: MUST (required), SHOULD (recommended), MAY (optional).",
            ]);
            for (const file of specFiles) {
                const raw = fs.readFileSync(path.join(specsDir, file), "utf-8");
                const stripped = raw.replace(/<!--[\s\S]*?-->/g, "");
                const hasContent = stripped.split("\n").some((l) => {
                    const t = l.trim();
                    return t && !t.startsWith("#") && !skipLines.has(t);
                });
                if (!hasContent) {
                    warnings.push(`specs/${file} has no content`);
                }
                else if (!/^### Requirement:/m.test(stripped)) {
                    errors.push(`specs/${file} has content but no '### Requirement:' headings — use the spec format`);
                }
                else if (!/^## (ADDED|MODIFIED|REMOVED) Requirements$/m.test(stripped)) {
                    errors.push(`specs/${file} is missing section marker — add '## ADDED Requirements', '## MODIFIED Requirements', or '## REMOVED Requirements' before each group of requirements`);
                }
            }
        }
    }
    for (const file of ["proposal.md", "design.md", "tasks.md", "questions.md"]) {
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
        if (file !== "questions.md" && (content.includes("[Describe") || content.includes("[List"))) {
            warnings.push(`${file} contains unfilled placeholders`);
        }
    }
    // Check questions.md for open (unanswered) questions
    const questionsPath = path.join(dir, "questions.md");
    if (fs.existsSync(questionsPath)) {
        const qc = fs.readFileSync(questionsPath, "utf-8");
        const hasOpenQuestion = qc.split("\n").some((l) => /^\s*-\s*\[ \]\s+Q:/i.test(l));
        if (hasOpenQuestion) {
            errors.push("questions.md has open (unanswered) questions — resolve all questions before archiving");
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
        if (!/^## Testing/m.test(tc)) {
            warnings.push("tasks.md has no '## Testing' section — changes should include test tasks");
        }
    }
    console.log(JSON.stringify({ valid: errors.length === 0, warnings, errors }, null, 2));
}
function readLevel2Sections(content) {
    const sections = new Map();
    let current = null;
    for (const line of content.split("\n")) {
        const heading = line.match(/^##\s+(.+?)\s*$/);
        if (heading) {
            current = heading[1].trim();
            sections.set(current, []);
            continue;
        }
        if (current) {
            sections.get(current).push(line);
        }
    }
    return sections;
}
function countBulletItems(lines) {
    if (!lines)
        return 0;
    return lines.filter((line) => /^\s*-\s+/.test(line)).length;
}
function firstNonEmptyLine(lines) {
    if (!lines)
        return "";
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed)
            return trimmed;
    }
    return "";
}
function readBulletItems(lines) {
    if (!lines)
        return [];
    return lines
        .map((line) => line.match(/^\s*-\s+(.+)$/)?.[1].trim() ?? "")
        .filter((line) => line.length > 0);
}
function normalizeRoadmapStatus(status) {
    return status.trim().toLowerCase();
}
function deriveMilestoneStatus(plannedChangeStates) {
    if (plannedChangeStates.length === 0)
        return "proposed";
    if (plannedChangeStates.every((state) => state === "archived"))
        return "complete";
    if (plannedChangeStates.some((state) => state === "active" || state === "archived"))
        return "in-progress";
    return "proposed";
}
function roadmapStatus() {
    const targetDir = args[0] ? path.resolve(args[0]) : process.cwd();
    const specDir = path.join(targetDir, ".spec-driven");
    const targetChangesDir = path.join(specDir, "changes");
    const milestonesDir = path.join(specDir, "roadmap", "milestones");
    const warnings = [];
    const errors = [];
    const milestones = [];
    if (!fs.existsSync(specDir) || !fs.statSync(specDir).isDirectory()) {
        errors.push(`.spec-driven/ not found in ${targetDir}`);
        console.log(JSON.stringify({ valid: false, warnings, errors, milestones }, null, 2));
        process.exit(0);
    }
    if (!fs.existsSync(milestonesDir) || !fs.statSync(milestonesDir).isDirectory()) {
        errors.push(`Missing roadmap milestones directory: ${path.join(".spec-driven", "roadmap", "milestones")}/`);
        console.log(JSON.stringify({ valid: false, warnings, errors, milestones }, null, 2));
        process.exit(0);
    }
    const milestoneFiles = findMdFiles(milestonesDir).sort();
    if (milestoneFiles.length === 0) {
        warnings.push("roadmap/milestones/ is empty");
        console.log(JSON.stringify({ valid: true, warnings, errors, milestones }, null, 2));
        process.exit(0);
    }
    const activeChanges = new Set();
    if (fs.existsSync(targetChangesDir) && fs.statSync(targetChangesDir).isDirectory()) {
        for (const entry of fs.readdirSync(targetChangesDir, { withFileTypes: true })) {
            if (entry.isDirectory() && entry.name !== "archive")
                activeChanges.add(entry.name);
        }
    }
    const archivedChanges = new Set();
    const archiveDir = path.join(targetChangesDir, "archive");
    if (fs.existsSync(archiveDir) && fs.statSync(archiveDir).isDirectory()) {
        for (const entry of fs.readdirSync(archiveDir, { withFileTypes: true })) {
            if (!entry.isDirectory())
                continue;
            const match = entry.name.match(/^\d{4}-\d{2}-\d{2}-(.+)$/);
            archivedChanges.add(match ? match[1] : entry.name);
        }
    }
    const requiredSections = [
        "Goal",
        "Done Criteria",
        "Planned Changes",
        "Dependencies / Risks",
        "Status",
    ];
    for (const file of milestoneFiles) {
        const content = fs.readFileSync(path.join(milestonesDir, file), "utf-8");
        const sections = readLevel2Sections(content);
        const missingSections = requiredSections.filter((section) => !sections.has(section));
        if (missingSections.length > 0) {
            errors.push(`roadmap/milestones/${file} is missing required sections: ${missingSections.join(", ")}`);
            continue;
        }
        const goal = firstNonEmptyLine(sections.get("Goal"));
        const declaredStatus = firstNonEmptyLine(sections.get("Status"));
        const plannedChangeNames = readBulletItems(sections.get("Planned Changes"));
        const plannedChanges = plannedChangeNames.map((name) => {
            if (archivedChanges.has(name))
                return { name, state: "archived" };
            if (activeChanges.has(name))
                return { name, state: "active" };
            return { name, state: "missing" };
        });
        const derivedStatus = deriveMilestoneStatus(plannedChanges.map((change) => change.state));
        const mismatches = [];
        if (normalizeRoadmapStatus(declaredStatus) !== derivedStatus) {
            mismatches.push(`declared status '${declaredStatus}' does not match derived status '${derivedStatus}'`);
        }
        milestones.push({ file, goal, declaredStatus, derivedStatus, plannedChanges, mismatches });
    }
    console.log(JSON.stringify({ valid: errors.length === 0, warnings, errors, milestones }, null, 2));
}
function verifyRoadmap() {
    const targetDir = args[0] ? path.resolve(args[0]) : process.cwd();
    const specDir = path.join(targetDir, ".spec-driven");
    const milestonesDir = path.join(specDir, "roadmap", "milestones");
    const warnings = [];
    const errors = [];
    const milestones = [];
    if (!fs.existsSync(specDir) || !fs.statSync(specDir).isDirectory()) {
        errors.push(`.spec-driven/ not found in ${targetDir}`);
        console.log(JSON.stringify({ valid: false, warnings, errors, milestones }, null, 2));
        process.exit(0);
    }
    if (!fs.existsSync(milestonesDir) || !fs.statSync(milestonesDir).isDirectory()) {
        errors.push(`Missing roadmap milestones directory: ${path.join(".spec-driven", "roadmap", "milestones")}/`);
        console.log(JSON.stringify({ valid: false, warnings, errors, milestones }, null, 2));
        process.exit(0);
    }
    const milestoneFiles = findMdFiles(milestonesDir).sort();
    if (milestoneFiles.length === 0) {
        warnings.push("roadmap/milestones/ is empty");
        console.log(JSON.stringify({ valid: true, warnings, errors, milestones }, null, 2));
        process.exit(0);
    }
    const requiredSections = [
        "Goal",
        "Done Criteria",
        "Planned Changes",
        "Dependencies / Risks",
        "Status",
    ];
    for (const file of milestoneFiles) {
        const content = fs.readFileSync(path.join(milestonesDir, file), "utf-8");
        const sections = readLevel2Sections(content);
        const missingSections = requiredSections.filter((section) => !sections.has(section));
        if (missingSections.length > 0) {
            errors.push(`roadmap/milestones/${file} is missing required sections: ${missingSections.join(", ")}`);
            continue;
        }
        const doneCriteria = countBulletItems(sections.get("Done Criteria"));
        const plannedChanges = countBulletItems(sections.get("Planned Changes"));
        const status = firstNonEmptyLine(sections.get("Status"));
        const goal = firstNonEmptyLine(sections.get("Goal"));
        milestones.push({ file, goal, doneCriteria, plannedChanges, status });
        if (plannedChanges > 5) {
            errors.push(`roadmap/milestones/${file} has ${plannedChanges} planned changes; split it into smaller milestones`);
        }
    }
    console.log(JSON.stringify({ valid: errors.length === 0, warnings, errors, milestones }, null, 2));
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
    const lines = [];
    ensureSpecDrivenScaffold(specDir, lines);
    regenerateIndexMd(path.join(specDir, "specs"), lines);
    console.log(`Initialized: ${specDir}`);
    for (const line of lines)
        console.log(`  ${line}`);
    console.log(`  Edit config.yaml to add project context`);
}
function runMaintenance() {
    const targetDir = args[0] ? path.resolve(args[0]) : process.cwd();
    const specDir = path.join(targetDir, ".spec-driven");
    if (!fs.existsSync(specDir) || !fs.statSync(specDir).isDirectory()) {
        console.error(JSON.stringify({ status: "error", message: `.spec-driven/ not found in ${targetDir}` }, null, 2));
        process.exit(1);
    }
    process.chdir(targetDir);
    const config = loadMaintenanceConfig(targetDir);
    if (config.checks.length === 0) {
        console.log(JSON.stringify({ status: "skipped", reason: "no-configured-checks" }, null, 2));
        process.exit(0);
    }
    const activeChange = findActiveMaintenanceChange(targetDir, config.changePrefix);
    if (activeChange) {
        console.log(JSON.stringify({ status: "skipped", reason: "active-maintenance-change", change: activeChange }, null, 2));
        process.exit(0);
    }
    const repoCheck = runShellCommand("git rev-parse --show-toplevel", targetDir);
    if (repoCheck.status !== 0) {
        console.error(JSON.stringify({ status: "error", message: "target is not a git repository", stderr: repoCheck.stderr.trim() }, null, 2));
        process.exit(1);
    }
    const dirty = runShellCommand("git status --porcelain", targetDir);
    if (dirty.status !== 0) {
        console.error(JSON.stringify({ status: "error", message: "failed to inspect git working tree", stderr: dirty.stderr.trim() }, null, 2));
        process.exit(1);
    }
    if (dirty.stdout.trim()) {
        console.log(JSON.stringify({ status: "skipped", reason: "dirty-working-tree" }, null, 2));
        process.exit(0);
    }
    const initialResults = config.checks.map((check) => ({
        check,
        result: runShellCommand(check.command, targetDir),
    }));
    const failingChecks = initialResults.filter(({ result }) => result.status !== 0);
    if (failingChecks.length === 0) {
        console.log(JSON.stringify({ status: "clean", checks: config.checks.map((check) => check.name) }, null, 2));
        process.exit(0);
    }
    const unfixable = failingChecks.filter(({ check }) => !check.fixCommand);
    if (unfixable.length > 0) {
        console.log(JSON.stringify({
            status: "unfixable",
            failedChecks: failingChecks.map(({ check }) => check.name),
            unfixableChecks: unfixable.map(({ check }) => check.name),
        }, null, 2));
        process.exit(0);
    }
    const originalBranch = runShellCommand("git branch --show-current", targetDir);
    if (originalBranch.status !== 0) {
        console.error(JSON.stringify({ status: "error", message: "failed to resolve current branch", stderr: originalBranch.stderr.trim() }, null, 2));
        process.exit(1);
    }
    const stamp = makeMaintenanceStamp();
    const changeName = `${config.changePrefix}-${stamp}`;
    const branchName = `${config.branchPrefix}-${stamp}`;
    const branchCreate = runShellCommand(`git switch -c ${shellQuote(branchName)}`, targetDir);
    if (branchCreate.status !== 0) {
        console.error(JSON.stringify({ status: "error", message: "failed to create maintenance branch", stderr: branchCreate.stderr.trim() }, null, 2));
        process.exit(1);
    }
    seedMaintenanceChange(targetDir, changeName, branchName, failingChecks.map(({ check }) => check), config);
    const implementationTask = "Apply configured auto-fixes for the failing maintenance checks";
    const testingTask = "Re-run the configured maintenance checks and confirm they pass";
    const verificationTask = "Verify the maintenance change is valid and archive it";
    for (const { check } of failingChecks) {
        const fixResult = runShellCommand(check.fixCommand, targetDir);
        if (fixResult.status !== 0) {
            console.log(JSON.stringify({
                status: "blocked",
                reason: "fix-command-failed",
                branch: branchName,
                change: changeName,
                failedCheck: check.name,
                stderr: fixResult.stderr.trim(),
            }, null, 2));
            process.exit(0);
        }
    }
    markTaskComplete(path.join(changeDir(changeName), "tasks.md"), implementationTask);
    const verificationResults = config.checks.map((check) => ({
        check,
        result: runShellCommand(check.command, targetDir),
    }));
    const stillFailing = verificationResults.filter(({ result }) => result.status !== 0);
    if (stillFailing.length > 0) {
        console.log(JSON.stringify({
            status: "blocked",
            reason: "checks-still-failing",
            branch: branchName,
            change: changeName,
            failedChecks: stillFailing.map(({ check }) => check.name),
        }, null, 2));
        process.exit(0);
    }
    markTaskComplete(path.join(changeDir(changeName), "tasks.md"), testingTask);
    const changeVerify = verifyChangeArtifacts(changeName);
    if (!changeVerify.valid) {
        console.log(JSON.stringify({
            status: "blocked",
            reason: "invalid-maintenance-change",
            branch: branchName,
            change: changeName,
            errors: changeVerify.errors,
            warnings: changeVerify.warnings,
        }, null, 2));
        process.exit(0);
    }
    markTaskComplete(path.join(changeDir(changeName), "tasks.md"), verificationTask);
    const archiveResult = tryArchiveChange(changeName);
    if (!archiveResult.ok) {
        console.log(JSON.stringify({
            status: "blocked",
            reason: "archive-failed",
            branch: branchName,
            change: changeName,
            error: archiveResult.error,
        }, null, 2));
        process.exit(0);
    }
    const archivePath = archiveResult.archivePath;
    const commitMessage = `${config.commitMessagePrefix} ${stamp}`;
    const commitResult = runShellCommand(`git add -A && git commit -m ${shellQuote(commitMessage)}`, targetDir);
    if (commitResult.status !== 0) {
        console.log(JSON.stringify({
            status: "blocked",
            reason: "git-commit-failed",
            branch: branchName,
            archivePath,
            stderr: commitResult.stderr.trim(),
        }, null, 2));
        process.exit(0);
    }
    const branchBefore = originalBranch.stdout.trim();
    if (branchBefore) {
        const switchBack = runShellCommand(`git switch ${shellQuote(branchBefore)}`, targetDir);
        if (switchBack.status !== 0) {
            console.log(JSON.stringify({
                status: "blocked",
                reason: "restore-branch-failed",
                branch: branchName,
                archivePath,
                stderr: switchBack.stderr.trim(),
            }, null, 2));
            process.exit(0);
        }
    }
    console.log(JSON.stringify({
        status: "repaired",
        branch: branchName,
        change: changeName,
        archivePath,
        fixedChecks: failingChecks.map(({ check }) => check.name),
    }, null, 2));
}
function migrate() {
    const targetDir = args[0] ? path.resolve(args[0]) : process.cwd();
    if (!fs.existsSync(targetDir) || !fs.statSync(targetDir).isDirectory()) {
        console.error(`Error: target directory not found: ${targetDir}`);
        process.exit(1);
    }
    const bundledSkillsDir = resolveBundledSkillsDir();
    if (!bundledSkillsDir) {
        console.error("Error: bundled spec-driven skills not found next to this script");
        process.exit(1);
    }
    const bundledScriptPath = resolveBundledScriptPath();
    if (!bundledScriptPath) {
        console.error("Error: bundled spec-driven script not found next to this script");
        process.exit(1);
    }
    const bundledSkills = fs.readdirSync(bundledSkillsDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && entry.name.startsWith("spec-driven-") && fs.existsSync(path.join(bundledSkillsDir, entry.name, "SKILL.md")))
        .map((entry) => entry.name)
        .sort();
    if (bundledSkills.length === 0) {
        console.error(`Error: no spec-driven skills found in ${bundledSkillsDir}`);
        process.exit(1);
    }
    let changed = 0;
    let skipped = 0;
    const lines = [];
    const openspecDir = path.join(targetDir, "openspec");
    const specDir = path.join(targetDir, ".spec-driven");
    if (fs.existsSync(openspecDir)) {
        if (fs.existsSync(specDir)) {
            lines.push(`Skipped openspec/ rename: ${specDir} already exists`);
            skipped++;
        }
        else {
            fs.renameSync(openspecDir, specDir);
            lines.push(`Moved openspec/ -> .spec-driven/`);
            changed++;
        }
    }
    if (fs.existsSync(specDir)) {
        changed += ensureSpecDrivenScaffold(specDir, lines);
    }
    for (const tool of supportedMigrationTools) {
        const rootDir = path.join(targetDir, tool.rootDir);
        const skillsDir = path.join(targetDir, tool.skillsDir);
        const commandsDir = path.join(targetDir, tool.commandsDir);
        const hadOpenSpecSkills = hasMatchingEntries(skillsDir, isOpenSpecSkillName);
        const hadOpenSpecCommands = hasMatchingEntries(commandsDir, isOpenSpecCommandName);
        if (!fs.existsSync(rootDir) || (!hadOpenSpecSkills && !hadOpenSpecCommands))
            continue;
        const removedSkills = removeMatchingEntries(skillsDir, isOpenSpecSkillName);
        const removedCommands = removeMatchingEntries(commandsDir, isOpenSpecCommandName);
        const installed = installBundledSkills(bundledSkillsDir, bundledScriptPath, bundledSkills, skillsDir, targetDir);
        lines.push(`Migrated ${tool.name} tool config:`);
        if (removedSkills > 0)
            lines.push(`  removed ${removedSkills} openspec skill artifact(s)`);
        if (removedCommands > 0)
            lines.push(`  removed ${removedCommands} openspec command artifact(s)`);
        if (installed > 0)
            lines.push(`  installed ${installed} auto-spec-driven skill(s)`);
        if (removedSkills === 0 && removedCommands === 0 && installed === 0) {
            lines.push(`  no changes needed`);
        }
        changed += removedSkills + removedCommands + installed;
    }
    for (const entry of fs.readdirSync(targetDir, { withFileTypes: true })) {
        if (!entry.isDirectory() || !entry.name.startsWith("."))
            continue;
        if ([".spec-driven", ".claude", ".opencode"].includes(entry.name))
            continue;
        if (!hasOpenSpecArtifacts(path.join(targetDir, entry.name), 3))
            continue;
        lines.push(`Skipped unsupported AI tool: ${entry.name}`);
        skipped++;
    }
    if (lines.length === 0) {
        lines.push("No OpenSpec artifacts found.");
    }
    lines.push(`Done. ${changed} change(s), ${skipped} skipped.`);
    console.log(lines.join("\n"));
}
function list() {
    if (!fs.existsSync(changesDir)) {
        console.log("No .spec-driven/changes/ directory found.");
        process.exit(0);
    }
    const entries = fs.readdirSync(changesDir, { withFileTypes: true });
    const active = entries
        .filter((e) => e.isDirectory() && e.name !== "archive")
        .map((e) => e.name);
    if (active.length > 0) {
        console.log("Active:");
        for (const c of active)
            console.log(`  ${c}    ${getStatus(c)}`);
    }
    const archiveDir = path.join(changesDir, "archive");
    if (fs.existsSync(archiveDir)) {
        const archived = fs.readdirSync(archiveDir, { withFileTypes: true })
            .filter((e) => e.isDirectory())
            .map((e) => e.name);
        if (archived.length > 0) {
            console.log("Archived:");
            for (const a of archived)
                console.log(`  ${a}`);
        }
    }
    if (active.length === 0 && (!fs.existsSync(archiveDir) || fs.readdirSync(archiveDir).length === 0)) {
        console.log("No changes.");
    }
}
function loadMaintenanceConfig(targetDir) {
    const configPath = path.join(targetDir, ".spec-driven", "maintenance", "config.json");
    if (!fs.existsSync(configPath)) {
        console.error(JSON.stringify({
            status: "error",
            message: `maintenance config not found: ${configPath}`,
            hint: "Create .spec-driven/maintenance/config.json with explicit checks before running maintenance.",
        }, null, 2));
        process.exit(1);
    }
    let parsed = null;
    try {
        parsed = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    }
    catch {
        parsed = null;
    }
    if (!parsed || typeof parsed !== "object") {
        console.error(JSON.stringify({ status: "error", message: `invalid maintenance config: ${configPath}` }, null, 2));
        process.exit(1);
    }
    return {
        changePrefix: typeof parsed.changePrefix === "string" && parsed.changePrefix.trim() ? parsed.changePrefix : DEFAULT_MAINTENANCE_CHANGE_PREFIX,
        branchPrefix: typeof parsed.branchPrefix === "string" && parsed.branchPrefix.trim() ? parsed.branchPrefix : DEFAULT_MAINTENANCE_BRANCH_PREFIX,
        commitMessagePrefix: typeof parsed.commitMessagePrefix === "string" && parsed.commitMessagePrefix.trim() ? parsed.commitMessagePrefix : DEFAULT_MAINTENANCE_COMMIT_PREFIX,
        checks: Array.isArray(parsed.checks) ? parsed.checks.filter(isMaintenanceCheck) : [],
    };
}
function isMaintenanceCheck(value) {
    if (!value || typeof value !== "object")
        return false;
    const maybe = value;
    return typeof maybe.name === "string"
        && typeof maybe.command === "string"
        && (maybe.fixCommand === undefined || typeof maybe.fixCommand === "string");
}
function runShellCommand(commandText, cwd) {
    const result = spawnSync("/bin/sh", ["-lc", commandText], {
        cwd,
        encoding: "utf-8",
    });
    return {
        status: result.status ?? 1,
        stdout: result.stdout ?? "",
        stderr: result.stderr ?? "",
    };
}
function findActiveMaintenanceChange(targetDir, changePrefix) {
    const targetChangesDir = path.join(targetDir, ".spec-driven", "changes");
    if (!fs.existsSync(targetChangesDir))
        return null;
    for (const entry of fs.readdirSync(targetChangesDir, { withFileTypes: true })) {
        if (!entry.isDirectory() || entry.name === "archive")
            continue;
        if (entry.name.startsWith(changePrefix))
            return entry.name;
    }
    return null;
}
function makeMaintenanceStamp() {
    const iso = new Date().toISOString().replace(/[-:]/g, "");
    return iso.slice(0, 8) + "-" + iso.slice(9, 15);
}
function seedMaintenanceChange(targetDir, name, branchName, failingChecks, config) {
    const dir = path.join(targetDir, ".spec-driven", "changes", name);
    fs.mkdirSync(path.join(dir, "specs"), { recursive: true });
    const checkList = failingChecks.map((check) => `\`${check.name}\``).join(", ");
    fs.writeFileSync(path.join(dir, "proposal.md"), [
        `# ${name}`,
        "",
        "## What",
        "",
        `Apply the configured maintenance auto-fixes for the failing checks ${checkList} on branch \`${branchName}\`.`,
        "",
        "## Why",
        "",
        "The manual maintenance workflow detected checks that are explicitly configured as safe to auto-fix.",
        "",
        "## Scope",
        "",
        "- Apply only the configured maintenance fix commands for the currently failing checks",
        "- Re-run the configured maintenance checks",
        "- Archive the completed maintenance change automatically on success",
        "",
        "## Unchanged Behavior",
        "",
        "- Do not modify unrelated active changes",
        "- Do not guess at failures that are not explicitly configured as safe to auto-fix",
        "",
    ].join("\n"));
    fs.writeFileSync(path.join(dir, "design.md"), [
        `# Design: ${name}`,
        "",
        "## Approach",
        "",
        "Run the configured auto-fix commands for the failing checks, then re-run the configured maintenance checks and archive the change if they pass.",
        "",
        "## Key Decisions",
        "",
        `- Use the configured branch prefix \`${config.branchPrefix}\` and change prefix \`${config.changePrefix}\``,
        `- Limit fixes to the configured failing checks: ${checkList}`,
        "",
        "## Alternatives Considered",
        "",
        "- Skip the failing checks entirely",
        "- Attempt speculative repairs beyond the configured maintenance commands",
        "",
    ].join("\n"));
    fs.writeFileSync(path.join(dir, "tasks.md"), [
        `# Tasks: ${name}`,
        "",
        "## Implementation",
        "",
        "- [ ] Apply configured auto-fixes for the failing maintenance checks",
        "",
        "## Testing",
        "",
        "- [ ] Re-run the configured maintenance checks and confirm they pass",
        "",
        "## Verification",
        "",
        "- [ ] Verify the maintenance change is valid and archive it",
        "",
    ].join("\n"));
    fs.writeFileSync(path.join(dir, "questions.md"), [
        `# Questions: ${name}`,
        "",
        "## Open",
        "",
        "<!-- No open questions -->",
        "",
        "## Resolved",
        "",
        "<!-- Scheduled maintenance change generated without open questions -->",
        "",
    ].join("\n"));
}
function markTaskComplete(tasksPath, taskText) {
    const content = fs.readFileSync(tasksPath, "utf-8");
    const escaped = escapeRegExp(taskText);
    const pattern = new RegExp(`^- \\[ \\] ${escaped}$`, "m");
    if (!pattern.test(content))
        return;
    fs.writeFileSync(tasksPath, content.replace(pattern, `- [x] ${taskText}`));
}
function verifyChangeArtifacts(name) {
    const dir = changeDir(name);
    const warnings = [];
    const errors = [];
    if (!fs.existsSync(dir)) {
        errors.push(`Change directory not found: ${dir}`);
        return { valid: false, warnings, errors };
    }
    const specsDir = path.join(dir, "specs");
    if (!fs.existsSync(specsDir)) {
        errors.push("Missing required directory: specs/");
    }
    else if (findMdFiles(specsDir).length === 0) {
        warnings.push("specs/ is empty — add delta files mirroring the main .spec-driven/specs/ structure");
    }
    for (const file of ["proposal.md", "design.md", "tasks.md", "questions.md"]) {
        const filePath = path.join(dir, file);
        if (!fs.existsSync(filePath))
            errors.push(`Missing required artifact: ${file}`);
    }
    const tasksPath = path.join(dir, "tasks.md");
    if (fs.existsSync(tasksPath) && /^\s*-\s*\[ \]/im.test(fs.readFileSync(tasksPath, "utf-8"))) {
        warnings.push("tasks.md has incomplete tasks");
    }
    return { valid: errors.length === 0, warnings, errors };
}
function archiveChange(name) {
    const src = requireChange(name);
    const date = new Date().toISOString().slice(0, 10);
    const archivePath = path.join(changesDir, "archive", `${date}-${name}`);
    if (fs.existsSync(archivePath)) {
        console.error(`Error: archive target already exists: ${archivePath}`);
        process.exit(1);
    }
    fs.mkdirSync(path.join(changesDir, "archive"), { recursive: true });
    fs.renameSync(src, archivePath);
    return archivePath;
}
function tryArchiveChange(name) {
    const src = changeDir(name);
    if (!fs.existsSync(src)) {
        return { ok: false, error: `Change directory not found: ${src}` };
    }
    const date = new Date().toISOString().slice(0, 10);
    const archivePath = path.join(changesDir, "archive", `${date}-${name}`);
    if (fs.existsSync(archivePath)) {
        return { ok: false, error: `archive target already exists: ${archivePath}` };
    }
    try {
        fs.mkdirSync(path.join(changesDir, "archive"), { recursive: true });
        fs.renameSync(src, archivePath);
        return { ok: true, archivePath };
    }
    catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
}
function shellQuote(value) {
    return `'${value.replace(/'/g, `'\\''`)}'`;
}
function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function ensureSpecDrivenScaffold(specDir, lines) {
    let changed = 0;
    const changesPath = path.join(specDir, "changes");
    const specsPath = path.join(specDir, "specs");
    const roadmapPath = path.join(specDir, "roadmap");
    const roadmapMilestonesPath = path.join(roadmapPath, "milestones");
    if (!fs.existsSync(changesPath)) {
        fs.mkdirSync(changesPath, { recursive: true });
        lines.push(`Created ${path.join(".spec-driven", "changes")}/`);
        changed++;
    }
    if (!fs.existsSync(specsPath)) {
        fs.mkdirSync(specsPath, { recursive: true });
        lines.push(`Created ${path.join(".spec-driven", "specs")}/`);
        changed++;
    }
    if (!fs.existsSync(roadmapPath)) {
        fs.mkdirSync(roadmapPath, { recursive: true });
        lines.push(`Created ${path.join(".spec-driven", "roadmap")}/`);
        changed++;
    }
    if (!fs.existsSync(roadmapMilestonesPath)) {
        fs.mkdirSync(roadmapMilestonesPath, { recursive: true });
        lines.push(`Created ${path.join(".spec-driven", "roadmap", "milestones")}/`);
        changed++;
    }
    if (!fs.existsSync(path.join(specDir, "config.yaml"))) {
        fs.writeFileSync(path.join(specDir, "config.yaml"), INIT_CONFIG_YAML);
        lines.push(`Created ${path.join(".spec-driven", "config.yaml")}`);
        changed++;
    }
    if (!fs.existsSync(path.join(specsPath, "INDEX.md"))) {
        fs.writeFileSync(path.join(specsPath, "INDEX.md"), INIT_INDEX_MD);
        lines.push(`Created ${path.join(".spec-driven", "specs", "INDEX.md")}`);
        changed++;
    }
    if (!fs.existsSync(path.join(specsPath, "README.md"))) {
        fs.writeFileSync(path.join(specsPath, "README.md"), INIT_README_MD);
        lines.push(`Created ${path.join(".spec-driven", "specs", "README.md")}`);
        changed++;
    }
    if (!fs.existsSync(path.join(roadmapPath, "INDEX.md"))) {
        fs.writeFileSync(path.join(roadmapPath, "INDEX.md"), INIT_ROADMAP_INDEX_MD);
        lines.push(`Created ${path.join(".spec-driven", "roadmap", "INDEX.md")}`);
        changed++;
    }
    return changed;
}
function regenerateIndexMd(specsDir, lines) {
    if (!fs.existsSync(specsDir))
        return;
    const excluded = new Set(["INDEX.md", "README.md"]);
    const mdFiles = findMdFiles(specsDir).filter((f) => !excluded.has(f) && !excluded.has(path.basename(f)));
    const indexPath = path.join(specsDir, "INDEX.md");
    let content = "# Specs Index\n\n<!-- One entry per spec file. Updated by /spec-driven-archive after each change. -->\n";
    if (mdFiles.length > 0) {
        content += "\n";
        for (const f of mdFiles.sort()) {
            content += `- [${f}](${f})\n`;
        }
    }
    fs.writeFileSync(indexPath, content);
    lines.push(`Regenerated specs/INDEX.md (${mdFiles.length} file(s) listed)`);
}
function resolveBundledSkillsDir() {
    const scriptPath = path.resolve(process.argv[1]);
    const scriptDir = path.dirname(scriptPath);
    const candidates = [
        path.resolve(scriptDir, "..", "..", ".."),
        path.resolve(scriptDir, "..", "..", "skills"),
        path.resolve(scriptDir, "..", ".."),
    ];
    for (const candidate of candidates) {
        if (!fs.existsSync(candidate) || !fs.statSync(candidate).isDirectory())
            continue;
        const entries = fs.readdirSync(candidate, { withFileTypes: true });
        if (entries.some((entry) => entry.isDirectory() && entry.name.startsWith("spec-driven-") && fs.existsSync(path.join(candidate, entry.name, "SKILL.md")))) {
            return candidate;
        }
    }
    return null;
}
function resolveBundledScriptPath() {
    const scriptPath = path.resolve(process.argv[1]);
    const scriptDir = path.dirname(scriptPath);
    const candidates = [
        scriptPath,
        path.resolve(scriptDir, "spec-driven.js"),
        path.resolve(scriptDir, "..", "..", "dist", "scripts", "spec-driven.js"),
    ];
    for (const candidate of candidates) {
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile() && candidate.endsWith(".js")) {
            return candidate;
        }
    }
    return null;
}
function installBundledSkills(sourceDir, scriptPath, skills, targetDir, projectDir) {
    let installed = 0;
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }
    for (const skill of skills) {
        const src = path.join(sourceDir, skill);
        const dest = path.join(targetDir, skill);
        if (fs.existsSync(dest))
            continue;
        fs.mkdirSync(path.join(dest, "scripts"), { recursive: true });
        const skillDirRef = normalizePath(path.relative(projectDir, dest) || ".");
        const skillContent = fs.readFileSync(path.join(src, "SKILL.md"), "utf-8")
            .replace(/\{\{SKILL_DIR\}\}/g, skillDirRef);
        fs.writeFileSync(path.join(dest, "SKILL.md"), skillContent);
        fs.copyFileSync(scriptPath, path.join(dest, "scripts", "spec-driven.js"));
        installed++;
    }
    return installed;
}
function hasMatchingEntries(dir, matcher) {
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory())
        return false;
    return fs.readdirSync(dir, { withFileTypes: true }).some((entry) => matcher(entry.name));
}
function removeMatchingEntries(dir, matcher) {
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory())
        return 0;
    let removed = 0;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (!matcher(entry.name))
            continue;
        fs.rmSync(path.join(dir, entry.name), { recursive: true, force: true });
        removed++;
    }
    return removed;
}
function hasOpenSpecArtifacts(dir, depth) {
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory())
        return false;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (isOpenSpecSkillName(entry.name) || isOpenSpecCommandName(entry.name)) {
            return true;
        }
        if (depth > 0 && entry.isDirectory() && hasOpenSpecArtifacts(path.join(dir, entry.name), depth - 1)) {
            return true;
        }
    }
    return false;
}
function isOpenSpecSkillName(name) {
    return name.startsWith("openspec-");
}
function isOpenSpecCommandName(name) {
    return name === "opsx" || name === "openspec" || name.startsWith("opsx-") || name.startsWith("openspec-") || name.startsWith("opsx:") || name.startsWith("openspec:");
}
function normalizePath(value) {
    return value.split(path.sep).join("/");
}
