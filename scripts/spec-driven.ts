#!/usr/bin/env node
import fs from "fs";
import path from "path";

const [command, ...args] = process.argv.slice(2);

const changesDir = path.join(".spec-driven", "changes");

function changeDir(name: string) {
  return path.join(changesDir, name);
}

function requireName(cmd: string): string {
  if (!args[0]) {
    console.error(`Usage: node spec-driven.js ${cmd} <change-name>`);
    process.exit(1);
  }
  return args[0];
}

function requireChange(name: string): string {
  const dir = changeDir(name);
  if (!fs.existsSync(dir)) {
    console.error(`Error: change '${name}' not found at ${dir}`);
    process.exit(1);
  }
  return dir;
}

function findMdFiles(dir: string, base = ""): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const rel = base ? `${base}/${e.name}` : e.name;
    if (e.isDirectory()) return findMdFiles(path.join(dir, e.name), rel);
    return e.name.endsWith(".md") ? [rel] : [];
  });
}

switch (command) {
  case "propose": propose(); break;
  case "modify":  modify();  break;
  case "apply":   apply();   break;
  case "verify":  verify();  break;
  case "archive": archive(); break;
  case "cancel":  cancel();  break;
  case "init":    init();    break;
  case "list":    list();    break;
  default:
    console.error("Usage: node spec-driven.js <command> [args]");
    console.error("Commands: propose, modify, apply, verify, archive, cancel, init, list");
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
  fs.writeFileSync(
    path.join(dir, "proposal.md"),
    `# ${name}\n\n## What\n\n[Describe what this change does]\n\n## Why\n\n[Describe the motivation and context]\n\n## Scope\n\n[List what is in scope and out of scope]\n\n## Unchanged Behavior\n\nBehaviors that must not change as a result of this change (leave blank if nothing is at risk):\n`
  );
  fs.writeFileSync(
    path.join(dir, "design.md"),
    `# Design: ${name}\n\n## Approach\n\n[Describe the implementation approach]\n\n## Key Decisions\n\n[List significant decisions and their rationale]\n\n## Alternatives Considered\n\n[Describe alternatives that were ruled out]\n`
  );
  fs.writeFileSync(
    path.join(dir, "tasks.md"),
    `# Tasks: ${name}\n\n## Implementation\n\n- [ ] Task 1\n- [ ] Task 2\n- [ ] Task 3\n\n## Testing\n\n- [ ] Lint passes\n- [ ] Unit tests pass\n\n## Verification\n\n- [ ] Verify implementation matches proposal\n`
  );

  console.log(`Created change: ${dir}`);
  console.log(`  ${path.join(dir, "proposal.md")}`);
  console.log(`  ${path.join(dir, "specs")}/ (populate to mirror .spec-driven/specs/ structure)`);
  console.log(`  ${path.join(dir, "design.md")}`);
  console.log(`  ${path.join(dir, "tasks.md")}`);
}

function getStatus(name: string): string {
  const dir = changeDir(name);

  // Check for [NEEDS CLARIFICATION] markers
  for (const file of ["proposal.md", "design.md"]) {
    const p = path.join(dir, file);
    if (fs.existsSync(p) && fs.readFileSync(p, "utf-8").includes("[NEEDS CLARIFICATION")) {
      return "blocked";
    }
  }
  const specsDir = path.join(dir, "specs");
  for (const f of findMdFiles(specsDir)) {
    if (fs.readFileSync(path.join(specsDir, f), "utf-8").includes("[NEEDS CLARIFICATION")) {
      return "blocked";
    }
  }

  // Check task completion
  const tasksPath = path.join(dir, "tasks.md");
  if (!fs.existsSync(tasksPath)) return "proposed";
  const content = fs.readFileSync(tasksPath, "utf-8");
  let total = 0, complete = 0;
  for (const line of content.split("\n")) {
    if (/^\s*-\s*\[x\]\s+/i.test(line)) { total++; complete++; }
    else if (/^\s*-\s*\[ \]\s+/i.test(line)) { total++; }
  }
  if (total === 0) return "proposed";
  if (complete === 0) return "proposed";
  if (complete === total) return "done";
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
    } else {
      console.log("Active changes:");
      for (const c of changes) console.log(`  ${c}    ${getStatus(c)}`);
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

  const specsDir = path.join(dir, "specs");
  const specFiles = findMdFiles(specsDir);
  if (specFiles.length === 0) {
    console.log(`  ${specsDir}/ (empty)`);
  } else {
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

  type Task = { text: string; complete: boolean };
  const tasks: Task[] = [];

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
  const warnings: string[] = [];
  const errors: string[] = [];

  if (!fs.existsSync(dir)) {
    errors.push(`Change directory not found: ${dir}`);
    console.log(JSON.stringify({ valid: false, warnings, errors }, null, 2));
    process.exit(0);
  }

  const specsDir = path.join(dir, "specs");
  if (!fs.existsSync(specsDir)) {
    errors.push("Missing required directory: specs/");
  } else {
    const specFiles = findMdFiles(specsDir);
    if (specFiles.length === 0) {
      warnings.push("specs/ is empty — add delta files mirroring the main .spec-driven/specs/ structure");
    } else {
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
        } else if (!/^### Requirement:/m.test(stripped)) {
          errors.push(`specs/${file} has content but no '### Requirement:' headings — use the spec format`);
        } else if (!/^## (ADDED|MODIFIED|REMOVED) Requirements$/m.test(stripped)) {
          errors.push(`specs/${file} is missing section marker — add '## ADDED Requirements', '## MODIFIED Requirements', or '## REMOVED Requirements' before each group of requirements`);
        }
        if (raw.includes("[NEEDS CLARIFICATION")) {
          warnings.push(`specs/${file} has unresolved [NEEDS CLARIFICATION] markers`);
        }
      }
    }
  }

  for (const file of ["proposal.md", "design.md", "tasks.md"]) {
    const p = path.join(dir, file);
    if (!fs.existsSync(p)) { errors.push(`Missing required artifact: ${file}`); continue; }
    const content = fs.readFileSync(p, "utf-8").trim();
    if (!content) { errors.push(`Empty artifact: ${file}`); continue; }
    if (content.includes("[Describe") || content.includes("[List")) {
      warnings.push(`${file} contains unfilled placeholders`);
    }
    if (content.includes("[NEEDS CLARIFICATION")) {
      warnings.push(`${file} has unresolved [NEEDS CLARIFICATION] markers`);
    }
  }

  const tasksPath = path.join(dir, "tasks.md");
  if (fs.existsSync(tasksPath)) {
    const tc = fs.readFileSync(tasksPath, "utf-8");
    const hasTask = /^\s*-\s*\[[x ]\]/im.test(tc);
    if (!hasTask) {
      warnings.push("tasks.md has no checkboxes");
    } else if (/^\s*-\s*\[ \]/im.test(tc)) {
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

  if (fs.existsSync(specDir)) {
    console.error(`Error: .spec-driven/ already exists at ${specDir}`);
    process.exit(1);
  }

  fs.mkdirSync(path.join(specDir, "changes"), { recursive: true });
  fs.mkdirSync(path.join(specDir, "specs"), { recursive: true });

  fs.writeFileSync(
    path.join(specDir, "config.yaml"),
    [
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
    ].join("\n")
  );
  fs.writeFileSync(
    path.join(specDir, "specs", "INDEX.md"),
    `# Specs Index\n\n<!-- One entry per spec file. Updated by /spec-driven-archive after each change. -->\n`
  );
  fs.writeFileSync(
    path.join(specDir, "specs", "README.md"),
    `# Specs\n\nSpecs describe the current state of the system — what it does, not how it was built.\n\n## Format\n\n\`\`\`markdown\n### Requirement: <name>\nThe system MUST/SHOULD/MAY <observable behavior>.\n\n#### Scenario: <name>\n- GIVEN <precondition>\n- WHEN <action>\n- THEN <expected outcome>\n\`\`\`\n\n**Keywords**: MUST = required, SHOULD = recommended, MAY = optional (RFC 2119).\n\n## Organization\n\nGroup specs by domain area. Use kebab-case directory names (e.g. \`core/\`, \`api/\`, \`auth/\`).\n\n## Conventions\n\n- Write in present tense ("the system does X")\n- Describe observable behavior, not implementation details\n- Keep each spec focused on one area\n`
  );

  console.log(`Initialized: ${specDir}`);
  console.log(`  ${path.join(specDir, "config.yaml")}`);
  console.log(`  ${path.join(specDir, "specs", "INDEX.md")}`);
  console.log(`  ${path.join(specDir, "specs", "README.md")}`);
  console.log(`  Edit config.yaml to add project context`);
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
    for (const c of active) console.log(`  ${c}    ${getStatus(c)}`);
  }

  const archiveDir = path.join(changesDir, "archive");
  if (fs.existsSync(archiveDir)) {
    const archived = fs.readdirSync(archiveDir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
    if (archived.length > 0) {
      console.log("Archived:");
      for (const a of archived) console.log(`  ${a}`);
    }
  }

  if (active.length === 0 && (!fs.existsSync(archiveDir) || fs.readdirSync(archiveDir).length === 0)) {
    console.log("No changes.");
  }
}
