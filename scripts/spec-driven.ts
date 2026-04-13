#!/usr/bin/env node
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";

const [command, ...args] = process.argv.slice(2);

const changesDir = path.join(".spec-driven", "changes");
const DECLARED_ROADMAP_STATUSES = ["proposed", "active", "blocked", "complete"] as const;
const DECLARED_PLANNED_CHANGE_STATUSES = ["planned", "complete"] as const;
const MAX_MILESTONE_PLANNED_CHANGES = 10;
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
const INIT_INDEX_MD = "# Specs Index\n";
const INIT_README_MD = `# Specs\n\nSpecs describe the current state of the system — what it does, not how it was built.\n\n## Format\n\n\`\`\`markdown\n---\nmapping:\n  implementation:\n    - src/example.ts\n  tests:\n    - test/example.test.ts\n---\n\n### Requirement: <name>\nThe system MUST/SHOULD/MAY <observable behavior>.\n\n#### Scenario: <name>\n- GIVEN <precondition>\n- WHEN <action>\n- THEN <expected outcome>\n\`\`\`\n\n**Keywords**: MUST = required, SHOULD = recommended, MAY = optional (RFC 2119).\n\n## Organization\n\nGroup specs by domain area. Use kebab-case directory names (e.g. \`core/\`, \`api/\`, \`auth/\`).\n\n## Conventions\n\n- Write in present tense ("the system does X")\n- Describe observable behavior, not implementation details\n- Keep each spec focused on one area\n- Put related implementation and test file paths in frontmatter mappings, not in requirement prose\n- Use repo-relative paths under \`mapping.implementation\` and \`mapping.tests\`\n- Keep mappings at file granularity; do not use line numbers or symbol ranges\n`;
const INIT_ROADMAP_INDEX_MD = "# Roadmap Index\n\n## Milestones\n";

type DeclaredRoadmapStatus = (typeof DECLARED_ROADMAP_STATUSES)[number];
type DeclaredPlannedChangeStatus = (typeof DECLARED_PLANNED_CHANGE_STATUSES)[number];
type PlannedChangeState = "archived" | "active" | "missing";

type MigrationTool = {
  name: string;
  rootDir: string;
  skillsDir: string;
  commandsDir: string;
};

type MaintenanceCheck = {
  name: string;
  command: string;
  fixCommand?: string;
};

type MaintenanceConfig = {
  changePrefix: string;
  branchPrefix: string;
  commitMessagePrefix: string;
  checks: MaintenanceCheck[];
};

type ShellResult = {
  status: number;
  stdout: string;
  stderr: string;
};

type PlannedChangeEntry = {
  name: string;
  declaredStatus: DeclaredPlannedChangeStatus;
  summary: string;
};

type SpecMappingField = "implementation" | "tests";

type RawPlannedChangeEntry = {
  name: string;
  declaredStatus: string;
  summary: string;
};

const DEFAULT_MAINTENANCE_CHANGE_PREFIX = "maintenance";
const DEFAULT_MAINTENANCE_BRANCH_PREFIX = "maintenance";
const DEFAULT_MAINTENANCE_COMMIT_PREFIX = "chore: maintenance";

const supportedMigrationTools: MigrationTool[] = [
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

function extractMarkdownTitle(content: string, fallback: string): string {
  const title = content.match(/^#\s+(.+?)\s*$/m)?.[1]?.trim();
  return title && title.length > 0 ? title : fallback;
}

function normalizePathForMarkdown(value: string): string {
  return value.split(path.sep).join("/");
}

function formatLocalDate(date = new Date()): string {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function readSpecSummary(specsDir: string, relativePath: string): string {
  const filePath = path.join(specsDir, relativePath);
  const fallback = path.basename(relativePath, ".md");
  return extractMarkdownTitle(fs.readFileSync(filePath, "utf-8"), fallback);
}

function buildSpecsIndexContent(specsDir: string): string {
  const excluded = new Set(["INDEX.md", "README.md"]);
  const mdFiles = findMdFiles(specsDir)
    .filter((file) => !excluded.has(file) && !excluded.has(path.basename(file)))
    .sort();

  if (mdFiles.length === 0) {
    return `${INIT_INDEX_MD}`;
  }

  const grouped = new Map<string, string[]>();
  for (const file of mdFiles) {
    const category = normalizePathForMarkdown(path.dirname(file));
    const key = category === "." ? "root" : category;
    const files = grouped.get(key) ?? [];
    files.push(file);
    grouped.set(key, files);
  }

  const lines = ["# Specs Index", ""];
  const categories = Array.from(grouped.keys()).sort();
  for (const category of categories) {
    lines.push(`## ${category}`);
    for (const file of grouped.get(category)!.sort()) {
      const relativePath = normalizePathForMarkdown(file);
      const summary = readSpecSummary(specsDir, file);
      lines.push(`- [${path.basename(file)}](${relativePath}) - ${summary}`);
    }
    lines.push("");
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

function parseDeclaredRoadmapStatus(lines: string[] | undefined): {
  declaredStatus: DeclaredRoadmapStatus | null;
  error: string | null;
} {
  if (!lines) {
    return { declaredStatus: null, error: "missing status section" };
  }

  const nonEmpty = lines.map((line) => line.trim()).filter((line) => line.length > 0);
  if (nonEmpty.length !== 1) {
    return {
      declaredStatus: null,
      error: "Status section must contain exactly one bullet in the form '- Declared: <status>'",
    };
  }

  const match = nonEmpty[0].match(/^-\s+Declared:\s+([a-z-]+)$/);
  if (!match) {
    return {
      declaredStatus: null,
      error: "Status section must contain exactly one bullet in the form '- Declared: <status>'",
    };
  }

  const status = match[1] as DeclaredRoadmapStatus;
  if (!DECLARED_ROADMAP_STATUSES.includes(status)) {
    return {
      declaredStatus: null,
      error: `unsupported declared roadmap status '${match[1]}' (allowed: ${DECLARED_ROADMAP_STATUSES.join(", ")})`,
    };
  }

  return { declaredStatus: status, error: null };
}

function isDeclaredPlannedChangeStatus(value: string): value is DeclaredPlannedChangeStatus {
  return DECLARED_PLANNED_CHANGE_STATUSES.includes(value as DeclaredPlannedChangeStatus);
}

function readPlannedChangeStates(specDir: string, plannedChangeNames: string[]): PlannedChangeState[] {
  const activeChanges = new Set<string>();
  const archivedChanges = new Set<string>();
  const targetChangesDir = path.join(specDir, "changes");

  if (fs.existsSync(targetChangesDir) && fs.statSync(targetChangesDir).isDirectory()) {
    for (const entry of fs.readdirSync(targetChangesDir, { withFileTypes: true })) {
      if (entry.isDirectory() && entry.name !== "archive") {
        activeChanges.add(entry.name);
      }
    }
  }

  const archiveDir = path.join(targetChangesDir, "archive");
  if (fs.existsSync(archiveDir) && fs.statSync(archiveDir).isDirectory()) {
    for (const entry of fs.readdirSync(archiveDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const match = entry.name.match(/^\d{4}-\d{2}-\d{2}-(.+)$/);
      archivedChanges.add(match ? match[1] : entry.name);
    }
  }

  return plannedChangeNames.map((name) => {
    if (archivedChanges.has(name)) return "archived";
    if (activeChanges.has(name)) return "active";
    return "missing";
  });
}

function deriveMilestoneStatus(plannedChangeStates: PlannedChangeState[]): Exclude<DeclaredRoadmapStatus, "blocked"> {
  if (plannedChangeStates.length === 0) return "proposed";
  if (plannedChangeStates.every((state) => state === "archived")) return "complete";
  if (plannedChangeStates.some((state) => state === "active")) return "active";
  return "proposed";
}

function derivePlannedChangeDeclaredStatus(state: PlannedChangeState): DeclaredPlannedChangeStatus {
  return state === "archived" ? "complete" : "planned";
}

function readDeclaredRoadmapStatusLabel(lines: string[] | undefined): string {
  const parsedStatus = parseDeclaredRoadmapStatus(lines);
  if (parsedStatus.declaredStatus) return parsedStatus.declaredStatus;

  if (!lines) return "invalid";
  const nonEmpty = lines.map((line) => line.trim()).filter((line) => line.length > 0);
  if (nonEmpty.length === 1) {
    const rawMatch = nonEmpty[0].match(/^-\s+Declared:\s+(.+)$/);
    if (rawMatch) return rawMatch[1].trim();
  }
  return "invalid";
}

function readMilestoneIndexMetadata(filePath: string): { title: string; declaredStatus: string } {
  const content = fs.readFileSync(filePath, "utf-8");
  const sections = readLevel2Sections(content);
  return {
    title: extractMarkdownTitle(content, path.basename(filePath, ".md")),
    declaredStatus: readDeclaredRoadmapStatusLabel(sections.get("Status")),
  };
}

function buildRoadmapIndexContent(roadmapDir: string): string {
  const milestonesDir = path.join(roadmapDir, "milestones");
  const milestoneFiles = findMdFiles(milestonesDir).sort();
  const lines = ["# Roadmap Index", "", "## Milestones"];

  for (const file of milestoneFiles) {
    const relativePath = normalizePathForMarkdown(path.join("milestones", file));
    const { title, declaredStatus } = readMilestoneIndexMetadata(path.join(milestonesDir, file));
    lines.push(`- [${path.basename(file)}](${relativePath}) - ${title} - ${declaredStatus}`);
  }

  return `${lines.join("\n")}\n`;
}

function regenerateRoadmapIndex(roadmapDir: string, lines: string[]): void {
  if (!fs.existsSync(roadmapDir)) return;
  const content = buildRoadmapIndexContent(roadmapDir);
  fs.writeFileSync(path.join(roadmapDir, "INDEX.md"), content);
  lines.push("Regenerated roadmap/INDEX.md");
}

function rewriteLevel2Section(content: string, heading: string, bodyLines: string[]): string {
  const normalized = content.replace(/\r\n?/g, "\n");
  const lines = normalized.split("\n");
  const rewritten: string[] = [];
  let seen = false;

  for (let index = 0; index < lines.length;) {
    const match = lines[index].match(/^##\s+(.+?)\s*$/);
    if (!match || match[1].trim() !== heading) {
      rewritten.push(lines[index]);
      index += 1;
      continue;
    }

    let nextIndex = index + 1;
    while (nextIndex < lines.length && !/^##\s+/.test(lines[nextIndex])) {
      nextIndex += 1;
    }

    if (!seen) {
      rewritten.push(`## ${heading}`, ...bodyLines);
      seen = true;
    }

    index = nextIndex;
  }

  const nextContent = rewritten.join("\n");
  return normalized.endsWith("\n") ? `${nextContent}\n` : nextContent;
}

function validateRoadmapIndex(roadmapDir: string, errors: string[]): void {
  const indexPath = path.join(roadmapDir, "INDEX.md");
  if (!fs.existsSync(indexPath)) {
    errors.push(`Missing roadmap index: ${path.join(".spec-driven", "roadmap", "INDEX.md")}`);
    return;
  }

  const lines = fs.readFileSync(indexPath, "utf-8").replace(/\r\n?/g, "\n").split("\n");
  if (lines[0] !== "# Roadmap Index") {
    errors.push("roadmap/INDEX.md must start with '# Roadmap Index'");
  }

  const milestoneHeadings = lines.filter((line) => /^##\s+/.test(line));
  if (milestoneHeadings.length !== 1 || milestoneHeadings[0] !== "## Milestones") {
    errors.push("roadmap/INDEX.md must contain exactly one '## Milestones' section");
    return;
  }

  const milestoneHeadingIndex = lines.indexOf("## Milestones");
  const seenEntries = new Set<string>();
  for (const line of lines.slice(1, milestoneHeadingIndex)) {
    if (line.trim().length > 0) {
      errors.push("roadmap/INDEX.md may only contain blank lines before '## Milestones'");
      break;
    }
  }

  for (const line of lines.slice(milestoneHeadingIndex + 1)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const match = trimmed.match(/^- \[([^\]]+)\]\(milestones\/([^)]+)\) - (.+) - (proposed|active|blocked|complete)$/);
    if (!match) {
      errors.push(
        `roadmap/INDEX.md entries must match '- [<file>](milestones/<file>) - <title> - <declared-status>' where <declared-status> is one of: ${DECLARED_ROADMAP_STATUSES.join(", ")}`,
      );
      continue;
    }

    const [, label, relativePath] = match;
    if (label !== path.basename(relativePath)) {
      errors.push(`roadmap/INDEX.md entry label '${label}' must match '${path.basename(relativePath)}'`);
    }

    const milestonePath = path.join(roadmapDir, "milestones", relativePath);
    if (!fs.existsSync(milestonePath)) {
      errors.push(`roadmap/INDEX.md entry references missing milestone '${relativePath}'`);
      continue;
    }

    const milestoneDeclaredStatus = readMilestoneIndexMetadata(milestonePath).declaredStatus;
    const indexDeclaredStatus = match[4];
    if (indexDeclaredStatus !== milestoneDeclaredStatus) {
      errors.push(`roadmap/INDEX.md entry status '${indexDeclaredStatus}' must match milestone declared status '${milestoneDeclaredStatus}' for '${relativePath}'`);
    }

    if (seenEntries.has(relativePath)) {
      errors.push(`roadmap/INDEX.md contains duplicate entry for '${relativePath}'`);
    }
    seenEntries.add(relativePath);
  }
}

function replaceMilestoneDeclaredStatus(content: string, declaredStatus: Exclude<DeclaredRoadmapStatus, "blocked">): string {
  return rewriteLevel2Section(content, "Status", [`- Declared: ${declaredStatus}`, ""]);
}

function formatPlannedChangeEntry(entry: PlannedChangeEntry): string {
  return `- \`${entry.name}\` - Declared: ${entry.declaredStatus} - ${entry.summary}`;
}

function replacePlannedChangesSection(content: string, entries: PlannedChangeEntry[]): string {
  const bodyLines = entries.map((entry) => formatPlannedChangeEntry(entry));
  bodyLines.push("");
  return rewriteLevel2Section(content, "Planned Changes", bodyLines);
}

function reconcileRoadmapAfterArchive(targetDir: string, name: string): void {
  const specDir = path.join(targetDir, ".spec-driven");
  const roadmapDir = path.join(specDir, "roadmap");
  const milestonesDir = path.join(roadmapDir, "milestones");
  if (!fs.existsSync(roadmapDir) || !fs.existsSync(milestonesDir)) {
    return;
  }

  const milestoneFiles = findMdFiles(milestonesDir).sort();
  for (const file of milestoneFiles) {
    const filePath = path.join(milestonesDir, file);
    const content = fs.readFileSync(filePath, "utf-8");
    const sections = readLevel2Sections(content);
    const plannedChangeError = validatePlannedChangeLines(sections.get("Planned Changes"));
    if (plannedChangeError) continue;
    const plannedChangeEntries = readPlannedChangeEntries(sections.get("Planned Changes"));
    const plannedChangeNames = plannedChangeEntries.map((entry) => entry.name);
    if (!plannedChangeNames.includes(name) || !sections.has("Status")) continue;

    const plannedChangeStates = readPlannedChangeStates(specDir, plannedChangeNames);
    const derivedStatus = deriveMilestoneStatus(plannedChangeStates);
    const reconciledEntries = plannedChangeEntries.map((entry, index) => ({
      ...entry,
      declaredStatus: derivePlannedChangeDeclaredStatus(plannedChangeStates[index]),
    }));
    const parsedStatus = parseDeclaredRoadmapStatus(sections.get("Status"));

    let nextContent = content;
    if (plannedChangeEntries.some((entry, index) => entry.declaredStatus !== reconciledEntries[index].declaredStatus)) {
      nextContent = replacePlannedChangesSection(nextContent, reconciledEntries);
    }

    if (!parsedStatus.declaredStatus || parsedStatus.declaredStatus !== derivedStatus) {
      nextContent = replaceMilestoneDeclaredStatus(nextContent, derivedStatus);
    }

    if (nextContent !== content) {
      fs.writeFileSync(filePath, nextContent);
    }
  }

  fs.writeFileSync(path.join(roadmapDir, "INDEX.md"), buildRoadmapIndexContent(roadmapDir));
}

switch (command) {
  case "propose": propose(); break;
  case "modify":  modify();  break;
  case "apply":   apply();   break;
  case "verify":  verify();  break;
  case "verify-spec-mappings": verifySpecMappings(); break;
  case "audit-spec-mapping-coverage": auditSpecMappingCoverage(); break;
  case "audit-unmapped-spec-evidence": auditUnmappedSpecEvidence(); break;
  case "verify-roadmap": verifyRoadmap(); break;
  case "roadmap-status": roadmapStatus(); break;
  case "archive": archive(); break;
  case "cancel":  cancel();  break;
  case "init":    init();    break;
  case "run-maintenance": runMaintenance(); break;
  case "migrate": migrate(); break;
  case "list":    list();    break;
  default:
    console.error("Usage: node spec-driven.js <command> [args]");
    console.error("Commands: propose, modify, apply, verify, verify-spec-mappings, audit-spec-mapping-coverage, audit-unmapped-spec-evidence, verify-roadmap, roadmap-status, archive, cancel, init, run-maintenance, migrate, list");
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
    `# Tasks: ${name}\n\n## Implementation\n\n- [ ] Task 1\n- [ ] Task 2\n- [ ] Task 3\n\n## Testing\n\n- [ ] Replace with the repo's lint or validation command\n- [ ] Replace with the repo's unit test command\n\n## Verification\n\n- [ ] Verify implementation matches proposal\n`
  );
  fs.writeFileSync(
    path.join(dir, "questions.md"),
    `# Questions: ${name}\n\n## Open\n\n<!-- Add open questions here using the format below -->\n<!-- - [ ] Q: <question text> -->\n<!--   Context: <why this matters / what depends on the answer> -->\n\n## Resolved\n\n<!-- Resolved questions are moved here with their answers -->\n<!-- - [x] Q: <question text> -->\n<!--   Context: <why this matters> -->\n<!--   A: <answer from human> -->\n`
  );

  console.log(`Created change: ${dir}`);
  console.log(`  ${path.join(dir, "proposal.md")}`);
  console.log(`  ${path.join(dir, "specs")}/ (populate to mirror .spec-driven/specs/ structure)`);
  console.log(`  ${path.join(dir, "design.md")}`);
  console.log(`  ${path.join(dir, "tasks.md")}`);
  console.log(`  ${path.join(dir, "questions.md")}`);
}

function getStatus(name: string): string {
  const dir = changeDir(name);

  // Check questions.md for open (unanswered) questions
  const questionsPath = path.join(dir, "questions.md");
  if (fs.existsSync(questionsPath)) {
    const qc = fs.readFileSync(questionsPath, "utf-8");
    const hasOpenQuestion = qc.split("\n").some((l) => /^\s*-\s*\[ \]\s+Q:/i.test(l));
    if (hasOpenQuestion) return "blocked";
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
  for (const artifact of ["proposal.md", "design.md", "tasks.md", "questions.md"]) {
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
      }
    }
  }

  for (const file of ["proposal.md", "design.md", "tasks.md", "questions.md"]) {
    const p = path.join(dir, file);
    if (!fs.existsSync(p)) { errors.push(`Missing required artifact: ${file}`); continue; }
    const content = fs.readFileSync(p, "utf-8").trim();
    if (!content) { errors.push(`Empty artifact: ${file}`); continue; }
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
    } else if (/^\s*-\s*\[ \]/im.test(tc)) {
      warnings.push("tasks.md has incomplete tasks");
    }
    const testingErrors = validateTestingTasks(tc);
    errors.push(...testingErrors);
    if (!/^## Testing/m.test(tc) && !testingErrors.some((error) => error.includes("## Testing"))) {
      errors.push("tasks.md has no '## Testing' section — changes must include concrete test tasks");
    }
  }

  console.log(JSON.stringify({ valid: errors.length === 0, warnings, errors }, null, 2));
}

function validateTestingTasks(tasksContent: string): string[] {
  const errors: string[] = [];
  const sections = readLevel2Sections(tasksContent);
  const testingLines = sections.get("Testing");
  if (!testingLines) {
    errors.push("tasks.md has no '## Testing' section — changes must include concrete test tasks");
    return errors;
  }

  const testingTasks = testingLines
    .map((line) => line.match(/^\s*-\s*\[[x ]\]\s+(.+)$/i)?.[1].trim() ?? "")
    .filter((line) => line.length > 0);

  if (testingTasks.length === 0) {
    errors.push("tasks.md '## Testing' section has no checkbox tasks");
    return errors;
  }

  const lintTask = testingTasks.find((task) => isLintOrValidationTask(task));
  if (!lintTask) {
    errors.push("tasks.md '## Testing' section must include at least one lint or validation task");
  } else if (!hasExplicitRunnableCommand(lintTask)) {
    errors.push("tasks.md lint or validation task must name an explicit runnable command");
  }

  const unitTask = testingTasks.find((task) => isUnitTestTask(task));
  if (!unitTask) {
    errors.push("tasks.md '## Testing' section must include at least one unit test task");
  } else if (!hasExplicitRunnableCommand(unitTask)) {
    errors.push("tasks.md unit test task must name an explicit runnable command");
  }

  return errors;
}

function isLintOrValidationTask(task: string): boolean {
  return /\b(lint|validate|validation|typecheck|type-check|build)\b/i.test(task);
}

function isUnitTestTask(task: string): boolean {
  return /\b(unit test|unit tests)\b/i.test(task);
}

function hasExplicitRunnableCommand(task: string): boolean {
  if (/`[^`]+`/.test(task)) return true;
  if (/\b(?:npm|pnpm|yarn|bun|node|bash|sh|pytest|jest|vitest|go|cargo|make|uv|poetry)\b/i.test(task)) {
    return true;
  }
  return false;
}

function readLevel2Sections(content: string): Map<string, string[]> {
  const sections = new Map<string, string[]>();
  let current: string | null = null;

  for (const line of content.split("\n")) {
    const heading = line.match(/^##\s+(.+?)\s*$/);
    if (heading) {
      current = heading[1].trim();
      sections.set(current, []);
      continue;
    }

    if (current) {
      sections.get(current)!.push(line);
    }
  }

  return sections;
}

function countBulletItems(lines: string[] | undefined): number {
  if (!lines) return 0;
  return lines.filter((line) => /^\s*-\s+/.test(line)).length;
}

function firstNonEmptyLine(lines: string[] | undefined): string {
  if (!lines) return "";
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed) return trimmed;
  }
  return "";
}

function readBulletItems(lines: string[] | undefined): string[] {
  if (!lines) return [];
  return lines
    .map((line) => line.match(/^\s*-\s+(.+)$/)?.[1].trim() ?? "")
    .filter((line) => line.length > 0);
}

function readTopLevelBulletItems(lines: string[] | undefined): string[] {
  if (!lines) return [];
  return lines
    .map((line) => line.match(/^\s{0,3}-\s+(.+)$/)?.[1].trim() ?? "")
    .filter((line) => line.length > 0);
}

function verifySpecMappings() {
  const targetDir = args[0] ? path.resolve(args[0]) : process.cwd();
  const specsDir = path.join(targetDir, ".spec-driven", "specs");
  const warnings: string[] = [];
  const errors: string[] = [];

  if (!fs.existsSync(specsDir) || !fs.statSync(specsDir).isDirectory()) {
    errors.push(`Missing specs directory: ${path.join(".spec-driven", "specs")}/`);
    console.log(JSON.stringify({ valid: false, warnings, errors }, null, 2));
    process.exit(0);
  }

  const excluded = new Set(["INDEX.md", "README.md"]);
  const specFiles = findMdFiles(specsDir)
    .filter((file) => !excluded.has(file) && !excluded.has(path.basename(file)))
    .sort();

  for (const file of specFiles) {
    validateSpecMappingFile(targetDir, specsDir, file, errors);
  }

  console.log(JSON.stringify({ valid: errors.length === 0, warnings, errors }, null, 2));
}

function auditSpecMappingCoverage() {
  const targetDir = process.cwd();
  const warnings: string[] = [];
  const errors: string[] = [];
  const specArg = args[0];

  if (!specArg) {
    console.error("Usage: node spec-driven.js audit-spec-mapping-coverage <spec-path> [--implementation <repo-path> ...] [--tests <repo-path> ...]");
    process.exit(1);
  }

  const parsed = parseAuditCoverageArgs(args.slice(1), errors);
  const specInput = normalizePath(specArg);
  const specAbsolute = path.resolve(targetDir, specArg);
  const specRelative = normalizePath(path.relative(targetDir, specAbsolute));

  if (path.isAbsolute(specArg)) {
    errors.push(`spec path must be repo-relative, got '${specArg}'`);
  } else if (!specRelative || specRelative.startsWith("../") || specRelative === "..") {
    errors.push(`spec path must not escape the repository, got '${specArg}'`);
  } else if (!fs.existsSync(specAbsolute)) {
    errors.push(`spec file not found: '${specInput}'`);
  } else if (!fs.statSync(specAbsolute).isFile()) {
    errors.push(`spec path must reference a file, got '${specInput}'`);
  }

  let mapping: Record<SpecMappingField, string[]> = { implementation: [], tests: [] };
  if (errors.length === 0) {
    const content = fs.readFileSync(specAbsolute, "utf-8").replace(/\r\n?/g, "\n");
    const lines = content.split("\n");
    if (lines[0] !== "---") {
      errors.push(`${specRelative}: missing mapping frontmatter`);
    } else {
      const closingIndex = lines.findIndex((line, index) => index > 0 && line === "---");
      if (closingIndex === -1) {
        errors.push(`${specRelative}: unterminated mapping frontmatter`);
      } else {
        const parsedMapping = parseSpecMappingFrontmatter(specRelative, lines.slice(1, closingIndex), errors);
        if (parsedMapping) {
          mapping = parsedMapping;
          for (const field of ["implementation", "tests"] as const) {
            mapping[field].forEach((mappedPath, index) => {
              validateMappedSpecPath(targetDir, specRelative, field, mappedPath, index, errors);
            });
          }
        }
      }
    }
  }

  const evidence = {
    implementation: dedupePaths(parsed.implementation),
    tests: dedupePaths(parsed.tests),
  };

  const missing = {
    implementation: evidence.implementation.filter((item) => !mapping.implementation.includes(item)),
    tests: evidence.tests.filter((item) => !mapping.tests.includes(item)),
  };
  const extra = {
    implementation: mapping.implementation.filter((item) => !evidence.implementation.includes(item)),
    tests: mapping.tests.filter((item) => !evidence.tests.includes(item)),
  };

  console.log(JSON.stringify({
    valid: errors.length === 0 && missing.implementation.length === 0 && missing.tests.length === 0,
    spec: specRelative,
    mapping,
    evidence,
    missing,
    extra,
    warnings,
    errors,
  }, null, 2));
}

function auditUnmappedSpecEvidence() {
  const targetDir = process.cwd();
  const warnings: string[] = [];
  const errors: string[] = [];
  const parsed = parseAuditCoverageArgs(args, errors);
  const specsDir = path.join(targetDir, ".spec-driven", "specs");

  if (!fs.existsSync(specsDir) || !fs.statSync(specsDir).isDirectory()) {
    errors.push(`Missing specs directory: ${path.join(".spec-driven", "specs")}/`);
  }

  const mapped: Record<SpecMappingField, string[]> = {
    implementation: [],
    tests: [],
  };

  if (errors.length === 0) {
    const excluded = new Set(["INDEX.md", "README.md"]);
    const specFiles = findMdFiles(specsDir)
      .filter((file) => !excluded.has(file) && !excluded.has(path.basename(file)))
      .sort();

    for (const file of specFiles) {
      const displayFile = normalizePathForMarkdown(path.join(".spec-driven", "specs", file));
      const specPath = path.join(specsDir, file);
      const content = fs.readFileSync(specPath, "utf-8").replace(/\r\n?/g, "\n");
      const lines = content.split("\n");

      if (lines[0] !== "---") {
        errors.push(`${displayFile}: missing mapping frontmatter`);
        continue;
      }

      const closingIndex = lines.findIndex((line, index) => index > 0 && line === "---");
      if (closingIndex === -1) {
        errors.push(`${displayFile}: unterminated mapping frontmatter`);
        continue;
      }

      const parsedMapping = parseSpecMappingFrontmatter(displayFile, lines.slice(1, closingIndex), errors);
      if (!parsedMapping) continue;

      for (const field of ["implementation", "tests"] as const) {
        parsedMapping[field].forEach((mappedPath, index) => {
          validateMappedSpecPath(targetDir, displayFile, field, mappedPath, index, errors);
        });
        mapped[field].push(...parsedMapping[field]);
      }
    }
  }

  const candidates = {
    implementation: dedupePaths(parsed.implementation),
    tests: dedupePaths(parsed.tests),
  };
  const dedupedMapped = {
    implementation: dedupePaths(mapped.implementation),
    tests: dedupePaths(mapped.tests),
  };
  const unmapped = {
    implementation: candidates.implementation.filter((item) => !dedupedMapped.implementation.includes(item)),
    tests: candidates.tests.filter((item) => !dedupedMapped.tests.includes(item)),
  };

  console.log(JSON.stringify({
    valid: errors.length === 0 && unmapped.implementation.length === 0 && unmapped.tests.length === 0,
    mapped: dedupedMapped,
    candidates,
    unmapped,
    warnings,
    errors,
  }, null, 2));
}

function validateSpecMappingFile(targetDir: string, specsDir: string, file: string, errors: string[]): void {
  const specPath = path.join(specsDir, file);
  const content = fs.readFileSync(specPath, "utf-8").replace(/\r\n?/g, "\n");
  const lines = content.split("\n");
  const displayFile = normalizePathForMarkdown(path.join(".spec-driven", "specs", file));

  if (lines[0] !== "---") {
    errors.push(`${displayFile}: missing mapping frontmatter`);
    return;
  }

  const closingIndex = lines.findIndex((line, index) => index > 0 && line === "---");
  if (closingIndex === -1) {
    errors.push(`${displayFile}: unterminated mapping frontmatter`);
    return;
  }

  const frontmatterLines = lines.slice(1, closingIndex);
  const mapping = parseSpecMappingFrontmatter(displayFile, frontmatterLines, errors);
  if (!mapping) return;

  for (const field of ["implementation", "tests"] as const) {
    mapping[field].forEach((mappedPath, index) => {
      validateMappedSpecPath(targetDir, displayFile, field, mappedPath, index, errors);
    });
  }
}

function parseSpecMappingFrontmatter(
  displayFile: string,
  lines: string[],
  errors: string[],
): Record<SpecMappingField, string[]> | null {
  const mapping: Partial<Record<SpecMappingField, string[]>> = {};
  let sawMapping = false;
  let currentField: SpecMappingField | null = null;
  let invalid = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    if (/^mapping:\s*$/.test(line)) {
      sawMapping = true;
      currentField = null;
      continue;
    }

    if (/^mapping:\s+/.test(line)) {
      errors.push(`${displayFile}: mapping must be an object with implementation and tests arrays`);
      invalid = true;
      continue;
    }

    if (/^[^\s].*:/.test(line)) {
      currentField = null;
      continue;
    }

    if (!sawMapping) continue;

    const emptyArrayMatch = line.match(/^  (implementation|tests):\s*\[\s*\]\s*$/);
    if (emptyArrayMatch) {
      const field = emptyArrayMatch[1] as SpecMappingField;
      if (mapping[field]) {
        errors.push(`${displayFile}: mapping.${field} is declared more than once`);
        invalid = true;
      }
      mapping[field] = [];
      currentField = field;
      continue;
    }

    const fieldMatch = line.match(/^  (implementation|tests):\s*$/);
    if (fieldMatch) {
      const field = fieldMatch[1] as SpecMappingField;
      if (mapping[field]) {
        errors.push(`${displayFile}: mapping.${field} is declared more than once`);
        invalid = true;
      }
      mapping[field] = [];
      currentField = field;
      continue;
    }

    const invalidFieldValueMatch = line.match(/^  (implementation|tests):\s+(.+)$/);
    if (invalidFieldValueMatch) {
      errors.push(`${displayFile}: mapping.${invalidFieldValueMatch[1]} must be an array`);
      invalid = true;
      currentField = null;
      continue;
    }

    const unknownFieldMatch = line.match(/^  ([A-Za-z0-9_-]+):/);
    if (unknownFieldMatch) {
      errors.push(`${displayFile}: unsupported mapping field '${unknownFieldMatch[1]}'`);
      invalid = true;
      currentField = null;
      continue;
    }

    const itemMatch = line.match(/^    -\s*(.*)$/);
    if (itemMatch) {
      if (!currentField) {
        errors.push(`${displayFile}: mapping item appears before implementation or tests field`);
        invalid = true;
        continue;
      }

      const rawValue = itemMatch[1].trim();
      if (looksLikeNonStringYamlScalar(rawValue)) {
        errors.push(`${displayFile}: mapping.${currentField} entries must be string file paths`);
        invalid = true;
        continue;
      }

      const value = unquoteYamlScalar(rawValue);
      if (!value) {
        errors.push(`${displayFile}: mapping.${currentField} contains an empty path`);
        invalid = true;
        continue;
      }

      mapping[currentField]!.push(value);
      continue;
    }

    errors.push(`${displayFile}: invalid mapping frontmatter line '${trimmed}'`);
    invalid = true;
  }

  if (!sawMapping) {
    errors.push(`${displayFile}: missing mapping frontmatter`);
    return null;
  }

  for (const field of ["implementation", "tests"] as const) {
    if (!mapping[field]) {
      errors.push(`${displayFile}: missing mapping.${field} array`);
      invalid = true;
    }
  }

  return invalid ? null : {
    implementation: mapping.implementation!,
    tests: mapping.tests!,
  };
}

function parseAuditCoverageArgs(argv: string[], errors: string[]): Record<SpecMappingField, string[]> {
  const result: Record<SpecMappingField, string[]> = {
    implementation: [],
    tests: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token !== "--implementation" && token !== "--tests") {
      errors.push(`unsupported argument '${token}'`);
      continue;
    }

    const field = token === "--implementation" ? "implementation" : "tests";
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      errors.push(`missing value for ${token}`);
      continue;
    }

    const normalized = normalizeRepoRelativeArg(value, `${token} '${value}'`, errors);
    if (normalized) {
      result[field].push(normalized);
    }
    index += 1;
  }

  return result;
}

function normalizeRepoRelativeArg(value: string, label: string, errors: string[]): string | null {
  const normalized = value.split("\\").join("/");
  if (path.isAbsolute(normalized)) {
    errors.push(`${label} must be repo-relative`);
    return null;
  }

  const parts = normalized.split("/");
  if (!normalized || parts.some((part) => part === "" || part === "." || part === "..")) {
    errors.push(`${label} must be a normalized repo-relative file path`);
    return null;
  }

  return normalized;
}

function dedupePaths(values: string[]): string[] {
  return [...new Set(values)];
}

function unquoteYamlScalar(value: string): string {
  const singleQuoted = value.match(/^'(.*)'$/);
  if (singleQuoted) return singleQuoted[1];
  const doubleQuoted = value.match(/^"(.*)"$/);
  if (doubleQuoted) return doubleQuoted[1];
  return value;
}

function looksLikeNonStringYamlScalar(value: string): boolean {
  return /^(?:true|false|null|~)$/i.test(value)
    || /^[-+]?(?:\d+|\d+\.\d+)$/.test(value)
    || /^[\[{]/.test(value);
}

function validateMappedSpecPath(
  targetDir: string,
  displayFile: string,
  field: SpecMappingField,
  mappedPath: string,
  index: number,
  errors: string[],
): void {
  const fieldPath = `mapping.${field}[${index}]`;
  const normalized = mappedPath.split("\\").join("/");
  if (path.isAbsolute(normalized)) {
    errors.push(`${displayFile}: ${fieldPath} must be repo-relative, got '${mappedPath}'`);
    return;
  }

  const parts = normalized.split("/");
  if (!normalized || parts.some((part) => part === "" || part === "." || part === "..")) {
    errors.push(`${displayFile}: ${fieldPath} must be a normalized repo-relative file path, got '${mappedPath}'`);
    return;
  }

  const resolved = path.resolve(targetDir, normalized);
  const relativeToTarget = path.relative(targetDir, resolved);
  if (relativeToTarget.startsWith("..") || path.isAbsolute(relativeToTarget)) {
    errors.push(`${displayFile}: ${fieldPath} must not escape the repository, got '${mappedPath}'`);
    return;
  }

  if (!fs.existsSync(resolved)) {
    errors.push(`${displayFile}: ${fieldPath} references missing file '${mappedPath}'`);
    return;
  }

  if (!fs.statSync(resolved).isFile()) {
    errors.push(`${displayFile}: ${fieldPath} must reference a file, got '${mappedPath}'`);
  }
}

function parseRawPlannedChangeEntry(line: string): RawPlannedChangeEntry | null {
  const match = line.trim().match(/^-\s+`([a-z0-9]+(?:-[a-z0-9]+)*)`\s+-\s+Declared:\s+([a-z-]+)\s+-\s+(.+)$/);
  if (!match) return null;

  const summary = match[3].trim();
  if (!summary) return null;

  return {
    name: match[1],
    declaredStatus: match[2],
    summary,
  };
}

function parsePlannedChangeEntry(line: string): PlannedChangeEntry | null {
  const raw = parseRawPlannedChangeEntry(line);
  if (!raw || !isDeclaredPlannedChangeStatus(raw.declaredStatus)) return null;

  return {
    name: raw.name,
    declaredStatus: raw.declaredStatus,
    summary: raw.summary,
  };
}

function readPlannedChangeEntries(lines: string[] | undefined): PlannedChangeEntry[] {
  if (!lines) return [];
  return lines
    .map((line) => parsePlannedChangeEntry(line))
    .filter((entry): entry is PlannedChangeEntry => entry !== null);
}

function validatePlannedChangeLines(lines: string[] | undefined): string | null {
  if (!lines) return null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (/^\s{0,3}-\s+/.test(line)) {
      const raw = parseRawPlannedChangeEntry(line);
      if (!raw) {
        return "expected '- `\\<change-name>\\` - Declared: <planned|complete> - <summary>'";
      }
      if (!isDeclaredPlannedChangeStatus(raw.declaredStatus)) {
        return `unsupported planned change declared status '${raw.declaredStatus}' (allowed: ${DECLARED_PLANNED_CHANGE_STATUSES.join(", ")})`;
      }
      continue;
    }

    return "planned change descriptions must remain on a single line";
  }

  return null;
}

function roadmapStatus() {
  const targetDir = args[0] ? path.resolve(args[0]) : process.cwd();
  const specDir = path.join(targetDir, ".spec-driven");
  const milestonesDir = path.join(specDir, "roadmap", "milestones");
  const warnings: string[] = [];
  const errors: string[] = [];
  const milestones: Array<{
    file: string;
    goal: string;
    declaredStatus: string;
    derivedStatus: string;
    plannedChanges: Array<{
      name: string;
      declaredStatus: DeclaredPlannedChangeStatus;
      state: string;
      derivedStatus: DeclaredPlannedChangeStatus;
      mismatches: string[];
    }>;
    mismatches: string[];
  }> = [];

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
    "In Scope",
    "Out of Scope",
    "Done Criteria",
    "Planned Changes",
    "Dependencies",
    "Risks",
    "Status",
    "Notes",
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
    const parsedStatus = parseDeclaredRoadmapStatus(sections.get("Status"));
    if (!parsedStatus.declaredStatus) {
      errors.push(`roadmap/milestones/${file} has invalid status: ${parsedStatus.error}`);
      continue;
    }

    const declaredStatus = parsedStatus.declaredStatus;
    const plannedChangeEntries = readPlannedChangeEntries(sections.get("Planned Changes"));
    const plannedChangeError = validatePlannedChangeLines(sections.get("Planned Changes"));
    if (plannedChangeError) {
      errors.push(`roadmap/milestones/${file} has invalid planned change entries: ${plannedChangeError}`);
      continue;
    }

    const plannedChangeNames = plannedChangeEntries.map((entry) => entry.name);
    const plannedChangeStates = readPlannedChangeStates(specDir, plannedChangeNames);
    const plannedChanges = plannedChangeEntries.map((entry, index) => {
      const derivedPlannedChangeStatus = derivePlannedChangeDeclaredStatus(plannedChangeStates[index]);
      const mismatches: string[] = [];
      if (entry.declaredStatus !== derivedPlannedChangeStatus) {
        mismatches.push(
          `declared planned change status '${entry.declaredStatus}' does not match derived planned change status '${derivedPlannedChangeStatus}'`,
        );
      }
      return {
        name: entry.name,
        declaredStatus: entry.declaredStatus,
        state: plannedChangeStates[index],
        derivedStatus: derivedPlannedChangeStatus,
        mismatches,
      };
    });
    const derivedStatus = deriveMilestoneStatus(plannedChangeStates);
    const mismatches: string[] = [];
    if (declaredStatus !== derivedStatus) {
      mismatches.push(`declared status '${declaredStatus}' does not match derived status '${derivedStatus}'`);
    }

    milestones.push({ file, goal, declaredStatus, derivedStatus, plannedChanges, mismatches });
  }

  console.log(JSON.stringify({ valid: errors.length === 0, warnings, errors, milestones }, null, 2));
}

function verifyRoadmap() {
  const targetDir = args[0] ? path.resolve(args[0]) : process.cwd();
  const specDir = path.join(targetDir, ".spec-driven");
  const roadmapDir = path.join(specDir, "roadmap");
  const milestonesDir = path.join(specDir, "roadmap", "milestones");
  const warnings: string[] = [];
  const errors: string[] = [];
  const allowedStatuses = {
    milestoneDeclaredStatuses: [...DECLARED_ROADMAP_STATUSES],
    plannedChangeDeclaredStatuses: [...DECLARED_PLANNED_CHANGE_STATUSES],
  };
  const milestones: Array<{
    file: string;
    goal: string;
    doneCriteria: number;
    plannedChanges: number;
    status: string;
  }> = [];

  if (!fs.existsSync(specDir) || !fs.statSync(specDir).isDirectory()) {
    errors.push(`.spec-driven/ not found in ${targetDir}`);
    console.log(JSON.stringify({ valid: false, warnings, errors, allowedStatuses, milestones }, null, 2));
    process.exit(0);
  }

  if (!fs.existsSync(milestonesDir) || !fs.statSync(milestonesDir).isDirectory()) {
    errors.push(`Missing roadmap milestones directory: ${path.join(".spec-driven", "roadmap", "milestones")}/`);
    console.log(JSON.stringify({ valid: false, warnings, errors, allowedStatuses, milestones }, null, 2));
    process.exit(0);
  }

  validateRoadmapIndex(roadmapDir, errors);

  const milestoneFiles = findMdFiles(milestonesDir).sort();
  if (milestoneFiles.length === 0) {
    warnings.push("roadmap/milestones/ is empty");
    console.log(JSON.stringify({ valid: true, warnings, errors, allowedStatuses, milestones }, null, 2));
    process.exit(0);
  }

  const requiredSections = [
    "Goal",
    "In Scope",
    "Out of Scope",
    "Done Criteria",
    "Planned Changes",
    "Dependencies",
    "Risks",
    "Status",
    "Notes",
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
    const parsedStatus = parseDeclaredRoadmapStatus(sections.get("Status"));
    const goal = firstNonEmptyLine(sections.get("Goal"));

    const plannedChangeError = validatePlannedChangeLines(sections.get("Planned Changes"));
    if (plannedChangeError) {
      errors.push(`roadmap/milestones/${file} has invalid planned change entries: ${plannedChangeError}`);
      continue;
    }

    if (!parsedStatus.declaredStatus) {
      errors.push(`roadmap/milestones/${file} has invalid status: ${parsedStatus.error}`);
      continue;
    }

    const status = parsedStatus.declaredStatus;

    milestones.push({ file, goal, doneCriteria, plannedChanges, status });

    if (plannedChanges > MAX_MILESTONE_PLANNED_CHANGES) {
      errors.push(`roadmap/milestones/${file} has ${plannedChanges} planned changes; split it into smaller milestones`);
    }
  }

  console.log(JSON.stringify({ valid: errors.length === 0, warnings, errors, allowedStatuses, milestones }, null, 2));
}

function archive() {
  const name = requireName("archive");
  const src = requireChange(name);

  const date = formatLocalDate();
  const archivePath = path.join(changesDir, "archive", `${date}-${name}`);

  if (fs.existsSync(archivePath)) {
    console.error(`Error: archive target already exists: ${archivePath}`);
    process.exit(1);
  }

  fs.mkdirSync(path.join(changesDir, "archive"), { recursive: true });
  fs.renameSync(src, archivePath);
  reconcileRoadmapAfterArchive(process.cwd(), name);
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
  const lines: string[] = [];

  ensureSpecDrivenScaffold(specDir, lines);
  regenerateIndexMd(path.join(specDir, "specs"), lines);
  regenerateRoadmapIndex(path.join(specDir, "roadmap"), lines);

  console.log(`Initialized: ${specDir}`);
  for (const line of lines) console.log(`  ${line}`);
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
    const fixResult = runShellCommand(check.fixCommand!, targetDir);
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
  const lines: string[] = [];

  const openspecDir = path.join(targetDir, "openspec");
  const specDir = path.join(targetDir, ".spec-driven");
  if (fs.existsSync(openspecDir)) {
    if (fs.existsSync(specDir)) {
      lines.push(`Skipped openspec/ rename: ${specDir} already exists`);
      skipped++;
    } else {
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

    if (!fs.existsSync(rootDir) || (!hadOpenSpecSkills && !hadOpenSpecCommands)) continue;

    const removedSkills = removeMatchingEntries(skillsDir, isOpenSpecSkillName);
    const removedCommands = removeMatchingEntries(commandsDir, isOpenSpecCommandName);
    const installed = installBundledSkills(bundledSkillsDir, bundledScriptPath, bundledSkills, skillsDir, targetDir);

    lines.push(`Migrated ${tool.name} tool config:`);
    if (removedSkills > 0) lines.push(`  removed ${removedSkills} openspec skill artifact(s)`);
    if (removedCommands > 0) lines.push(`  removed ${removedCommands} openspec command artifact(s)`);
    if (installed > 0) lines.push(`  installed ${installed} auto-spec-driven skill(s)`);
    if (removedSkills === 0 && removedCommands === 0 && installed === 0) {
      lines.push(`  no changes needed`);
    }
    changed += removedSkills + removedCommands + installed;
  }

  for (const entry of fs.readdirSync(targetDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || !entry.name.startsWith(".")) continue;
    if ([".spec-driven", ".claude", ".opencode"].includes(entry.name)) continue;
    if (!hasOpenSpecArtifacts(path.join(targetDir, entry.name), 3)) continue;
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

function loadMaintenanceConfig(targetDir: string): MaintenanceConfig {
  const configPath = path.join(targetDir, ".spec-driven", "maintenance", "config.json");
  if (!fs.existsSync(configPath)) {
    console.error(JSON.stringify({
      status: "error",
      message: `maintenance config not found: ${configPath}`,
      hint: "Create .spec-driven/maintenance/config.json with explicit checks before running maintenance.",
    }, null, 2));
    process.exit(1);
  }

  let parsed: Partial<MaintenanceConfig & { managedBy?: string }> | null = null;
  try {
    parsed = JSON.parse(fs.readFileSync(configPath, "utf-8")) as Partial<MaintenanceConfig & { managedBy?: string }>;
  } catch {
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

function isMaintenanceCheck(value: unknown): value is MaintenanceCheck {
  if (!value || typeof value !== "object") return false;
  const maybe = value as Partial<MaintenanceCheck>;
  return typeof maybe.name === "string"
    && typeof maybe.command === "string"
    && (maybe.fixCommand === undefined || typeof maybe.fixCommand === "string");
}

function runShellCommand(commandText: string, cwd: string): ShellResult {
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

function findActiveMaintenanceChange(targetDir: string, changePrefix: string): string | null {
  const targetChangesDir = path.join(targetDir, ".spec-driven", "changes");
  if (!fs.existsSync(targetChangesDir)) return null;

  for (const entry of fs.readdirSync(targetChangesDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === "archive") continue;
    if (entry.name.startsWith(changePrefix)) return entry.name;
  }
  return null;
}

function makeMaintenanceStamp(): string {
  const iso = new Date().toISOString().replace(/[-:]/g, "");
  return iso.slice(0, 8) + "-" + iso.slice(9, 15);
}

function seedMaintenanceChange(targetDir: string, name: string, branchName: string, failingChecks: MaintenanceCheck[], config: MaintenanceConfig): void {
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

function markTaskComplete(tasksPath: string, taskText: string): void {
  const content = fs.readFileSync(tasksPath, "utf-8");
  const escaped = escapeRegExp(taskText);
  const pattern = new RegExp(`^- \\[ \\] ${escaped}$`, "m");
  if (!pattern.test(content)) return;
  fs.writeFileSync(tasksPath, content.replace(pattern, `- [x] ${taskText}`));
}

function verifyChangeArtifacts(name: string): { valid: boolean; warnings: string[]; errors: string[] } {
  const dir = changeDir(name);
  const warnings: string[] = [];
  const errors: string[] = [];

  if (!fs.existsSync(dir)) {
    errors.push(`Change directory not found: ${dir}`);
    return { valid: false, warnings, errors };
  }

  const specsDir = path.join(dir, "specs");
  if (!fs.existsSync(specsDir)) {
    errors.push("Missing required directory: specs/");
  } else if (findMdFiles(specsDir).length === 0) {
    warnings.push("specs/ is empty — add delta files mirroring the main .spec-driven/specs/ structure");
  }

  for (const file of ["proposal.md", "design.md", "tasks.md", "questions.md"]) {
    const filePath = path.join(dir, file);
    if (!fs.existsSync(filePath)) errors.push(`Missing required artifact: ${file}`);
  }

  const tasksPath = path.join(dir, "tasks.md");
  if (fs.existsSync(tasksPath)) {
    const tasksContent = fs.readFileSync(tasksPath, "utf-8");
    if (/^\s*-\s*\[ \]/im.test(tasksContent)) {
      warnings.push("tasks.md has incomplete tasks");
    }
  }

  return { valid: errors.length === 0, warnings, errors };
}

function archiveChange(name: string): string {
  const src = requireChange(name);
  const date = formatLocalDate();
  const archivePath = path.join(changesDir, "archive", `${date}-${name}`);

  if (fs.existsSync(archivePath)) {
    console.error(`Error: archive target already exists: ${archivePath}`);
    process.exit(1);
  }

  fs.mkdirSync(path.join(changesDir, "archive"), { recursive: true });
  fs.renameSync(src, archivePath);
  return archivePath;
}

function tryArchiveChange(name: string): { ok: true; archivePath: string } | { ok: false; error: string } {
  const src = changeDir(name);
  if (!fs.existsSync(src)) {
    return { ok: false, error: `Change directory not found: ${src}` };
  }

  const date = formatLocalDate();
  const archivePath = path.join(changesDir, "archive", `${date}-${name}`);
  if (fs.existsSync(archivePath)) {
    return { ok: false, error: `archive target already exists: ${archivePath}` };
  }

  try {
    fs.mkdirSync(path.join(changesDir, "archive"), { recursive: true });
    fs.renameSync(src, archivePath);
    reconcileRoadmapAfterArchive(process.cwd(), name);
    return { ok: true, archivePath };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function ensureSpecDrivenScaffold(specDir: string, lines: string[]): number {
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

function regenerateIndexMd(specsDir: string, lines: string[]): void {
  if (!fs.existsSync(specsDir)) return;

  const indexPath = path.join(specsDir, "INDEX.md");
  const mdFiles = findMdFiles(specsDir).filter((file) => !new Set(["INDEX.md", "README.md"]).has(file) && !new Set(["INDEX.md", "README.md"]).has(path.basename(file)));
  fs.writeFileSync(indexPath, buildSpecsIndexContent(specsDir));
  lines.push(`Regenerated specs/INDEX.md (${mdFiles.length} file(s) listed)`);
}

function resolveBundledSkillsDir(): string | null {
  const scriptPath = path.resolve(process.argv[1]);
  const scriptDir = path.dirname(scriptPath);
  const candidates = [
    path.resolve(scriptDir, "..", "..", ".."),
    path.resolve(scriptDir, "..", "..", "skills"),
    path.resolve(scriptDir, "..", ".."),
  ];

  for (const candidate of candidates) {
    if (!fs.existsSync(candidate) || !fs.statSync(candidate).isDirectory()) continue;
    const entries = fs.readdirSync(candidate, { withFileTypes: true });
    if (entries.some((entry) => entry.isDirectory() && entry.name.startsWith("spec-driven-") && fs.existsSync(path.join(candidate, entry.name, "SKILL.md")))) {
      return candidate;
    }
  }

  return null;
}

function resolveBundledScriptPath(): string | null {
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

function installBundledSkills(sourceDir: string, scriptPath: string, skills: string[], targetDir: string, projectDir: string): number {
  let installed = 0;
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  for (const skill of skills) {
    const src = path.join(sourceDir, skill);
    const dest = path.join(targetDir, skill);
    if (fs.existsSync(dest)) continue;
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

function hasMatchingEntries(dir: string, matcher: (name: string) => boolean): boolean {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return false;
  return fs.readdirSync(dir, { withFileTypes: true }).some((entry) => matcher(entry.name));
}

function removeMatchingEntries(dir: string, matcher: (name: string) => boolean): number {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return 0;

  let removed = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!matcher(entry.name)) continue;
    fs.rmSync(path.join(dir, entry.name), { recursive: true, force: true });
    removed++;
  }
  return removed;
}

function hasOpenSpecArtifacts(dir: string, depth: number): boolean {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return false;

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

function isOpenSpecSkillName(name: string): boolean {
  return name.startsWith("openspec-");
}

function isOpenSpecCommandName(name: string): boolean {
  return name === "opsx" || name === "openspec" || name.startsWith("opsx-") || name.startsWith("openspec-") || name.startsWith("opsx:") || name.startsWith("openspec:");
}

function normalizePath(value: string): string {
  return value.split(path.sep).join("/");
}
