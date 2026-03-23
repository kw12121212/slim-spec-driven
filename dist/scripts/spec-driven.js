#!/usr/bin/env node
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
    case "archive":
        archive();
        break;
    case "cancel":
        cancel();
        break;
    case "init":
        init();
        break;
    case "migrate":
        migrate();
        break;
    case "list":
        list();
        break;
    default:
        console.error("Usage: node spec-driven.js <command> [args]");
        console.error("Commands: propose, modify, apply, verify, archive, cancel, init, migrate, list");
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
            lines.push(`  installed ${installed} slim-spec-driven skill(s)`);
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
function ensureSpecDrivenScaffold(specDir, lines) {
    let changed = 0;
    const changesPath = path.join(specDir, "changes");
    const specsPath = path.join(specDir, "specs");
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
