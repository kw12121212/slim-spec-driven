#!/usr/bin/env node

import { spawnSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import process from "process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const PROJECT = path.join(ROOT, "test", "todo-app");
const CLI = path.join(ROOT, "dist", "scripts", "spec-driven.js");
const SKILL_VALIDATOR = path.join(ROOT, "dist", "test", "validate-skills.js");
const CHANGE = "add-delete-command";

const GREEN = "";
const RED = "";
const BOLD = "";
const RESET = "";

let passed = 0;
let failed = 0;

function pass(label) {
  console.log(`  ${GREEN}PASS${RESET} ${label}`);
  passed += 1;
}

function fail(label, details = "") {
  console.log(`  ${RED}FAIL${RESET} ${label}${details ? ` (${details})` : ""}`);
  failed += 1;
}

function section(title) {
  console.log(`${BOLD}${title}${RESET}`);
}

function formatDate(date = new Date()) {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function mktempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function rmrf(targetPath) {
  fs.rmSync(targetPath, { recursive: true, force: true });
}

function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf8");
}

function appendFile(filePath, content) {
  fs.appendFileSync(filePath, content, "utf8");
}

function readFile(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function exists(targetPath) {
  return fs.existsSync(targetPath);
}

function isSymlink(targetPath) {
  try {
    return fs.lstatSync(targetPath).isSymbolicLink();
  } catch {
    return false;
  }
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? ROOT,
    env: { ...process.env, ...(options.env ?? {}) },
    encoding: "utf8",
  });

  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";
  const error = result.error ? String(result.error.message || result.error) : "";
  const status = typeof result.status === "number" ? result.status : 1;

  return {
    status,
    stdout,
    stderr,
    combined: `${stdout}${stderr}${error}`,
  };
}

function cli(args, options = {}) {
  return run("node", [CLI, ...args], options);
}

function skillValidator(skillPath, options = {}) {
  return run("node", [SKILL_VALIDATOR, skillPath], options);
}

function runInstallScript(args, options = {}) {
  return run("bash", [path.join(ROOT, "install.sh"), ...args], options);
}

function assertContains(label, needle, haystack) {
  if (haystack.includes(needle)) {
    pass(label);
    return;
  }

  fail(label, `expected to find: ${needle}`);
}

function parseJson(text) {
  const trimmed = text.trim();
  if (trimmed.length === 0) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start === -1 || end === -1 || end < start) return null;
    try {
      return JSON.parse(trimmed.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

function assertJsonField(label, field, expected, jsonText) {
  const parsed = parseJson(jsonText);
  const actual = parsed && Object.hasOwn(parsed, field) ? String(parsed[field]) : "";
  if (actual === expected) {
    pass(label);
    return;
  }

  fail(label, `expected ${field}=${expected}, got ${field}=${actual}`);
}

function assertExit(label, expected, result) {
  if (String(result.status) === String(expected)) {
    pass(`${label} (exit ${result.status})`);
    return;
  }

  fail(label, `expected exit ${expected}, got ${result.status}`);
}

function assertFileExists(label, filePath) {
  if (exists(filePath) && fs.statSync(filePath).isFile()) {
    pass(label);
    return;
  }

  fail(label, `${filePath} missing`);
}

function assertDirExists(label, dirPath) {
  if (exists(dirPath) && fs.statSync(dirPath).isDirectory()) {
    pass(label);
    return;
  }

  fail(label, `${dirPath} missing`);
}

function assertNotExists(label, targetPath) {
  if (!exists(targetPath)) {
    pass(label);
    return;
  }

  fail(label, `${targetPath} still exists`);
}

function resetState() {
  rmrf(path.join(PROJECT, ".spec-driven", "changes", CHANGE));
  rmrf(path.join(PROJECT, ".spec-driven", "changes", "archive"));
}

function createSkill(dir, name) {
  const skillDir = path.join(dir, name);
  ensureDir(skillDir);
  writeFile(path.join(skillDir, "SKILL.md"), `---\nname: ${name}\ndescription: migrated\n---\n`);
}

function replaceOnce(filePath, searchValue, replaceValue) {
  const content = readFile(filePath);
  if (!content.includes(searchValue)) {
    throw new Error(`Expected to find '${searchValue}' in ${filePath}`);
  }
  writeFile(filePath, content.replace(searchValue, replaceValue));
}

function replaceTaskTemplateCommands(tasksPath) {
  replaceOnce(tasksPath, "- [ ] Replace with the repo's lint or validation command", "- [ ] Run `npm run build` to confirm validation passes");
  replaceOnce(tasksPath, "- [ ] Replace with the repo's unit test command", "- [ ] Run `npm test` to confirm unit tests pass");
}

function initGitRepo(dir, message) {
  run("git", ["-C", dir, "init"]);
  run("git", ["-C", dir, "config", "user.email", "spec-driven@example.com"]);
  run("git", ["-C", dir, "config", "user.name", "spec-driven"]);
  run("git", ["-C", dir, "add", "."]);
  run("git", ["-C", dir, "commit", "-m", message]);
}

function currentBranch(dir) {
  return run("git", ["-C", dir, "branch", "--show-current"]).stdout.trim();
}

function readGitFile(dir, refPath) {
  return run("git", ["-C", dir, "show", refPath]).stdout;
}

function hasMaintenanceChange(dir) {
  const changesPath = path.join(dir, ".spec-driven", "changes");
  if (!exists(changesPath)) return false;
  const entries = fs.readdirSync(changesPath, { withFileTypes: true });
  return entries.some((entry) => entry.isDirectory() && entry.name.startsWith("maintenance-"));
}

function restoreFreshTasks(projectDir, changeName) {
  const freshName = `${changeName}-fresh`;
  const freshDir = path.join(projectDir, ".spec-driven", "changes", freshName);
  rmrf(freshDir);
  cli(["propose", freshName], { cwd: projectDir });
  const freshTasks = readFile(path.join(freshDir, "tasks.md"));
  writeFile(path.join(projectDir, ".spec-driven", "changes", changeName, "tasks.md"), freshTasks);
  rmrf(freshDir);
  replaceTaskTemplateCommands(path.join(projectDir, ".spec-driven", "changes", changeName, "tasks.md"));
}

function runValidateSkillsSection() {
  section("[0] validate-skills");
  const skillsDir = path.join(ROOT, "skills");
  const skillNames = fs
    .readdirSync(skillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => exists(path.join(skillsDir, entry.name, "SKILL.md")))
    .map((entry) => entry.name)
    .sort();

  for (const skillName of skillNames) {
    const skillPath = path.join(skillsDir, skillName, "SKILL.md");
    const result = skillValidator(skillPath);
    if (result.status === 0) {
      pass(`skill schema valid: ${skillName}`);
    } else {
      fail(`skill schema invalid: ${skillName}`);
      if (result.combined.trim()) {
        process.stdout.write(result.combined);
      }
    }
  }

  const reviewSkill = readFile(path.join(skillsDir, "spec-driven-review", "SKILL.md"));
  assertContains(
    "review skill identifies specialized checklist routing",
    "Identify specialized review checklists",
    reviewSkill,
  );
  assertContains(
    "review skill covers security-sensitive checklist",
    "Security-sensitive",
    reviewSkill,
  );
  assertContains("review skill covers UI checklist", "**UI**", reviewSkill);
  assertContains("review skill covers DX checklist", "**DX**", reviewSkill);
  assertContains("review skill covers migration checklist", "**Migration**", reviewSkill);
  assertContains("review skill covers API checklist", "**API**", reviewSkill);
  assertContains("review skill covers maintenance checklist", "**Maintenance**", reviewSkill);
}

function runInitSection() {
  section("[1] init");

  const initDir = mktempDir("spec-driven-init-");
  const initResult = cli(["init", initDir]);
  assertContains("creates .spec-driven/", "Initialized:", initResult.combined);
  assertFileExists("config.yaml exists", path.join(initDir, ".spec-driven", "config.yaml"));
  assertFileExists("roadmap INDEX.md exists", path.join(initDir, ".spec-driven", "roadmap", "INDEX.md"));
  assertDirExists("roadmap milestones/ dir exists", path.join(initDir, ".spec-driven", "roadmap", "milestones"));
  assertFileExists("INDEX.md exists", path.join(initDir, ".spec-driven", "specs", "INDEX.md"));
  assertDirExists("specs/ dir exists", path.join(initDir, ".spec-driven", "specs"));
  assertDirExists("changes/ dir exists", path.join(initDir, ".spec-driven", "changes"));

  writeFile(path.join(initDir, ".spec-driven", "roadmap", "INDEX.md"), "# custom roadmap\n");
  const duplicateInit = cli(["init", initDir]);
  assertContains("duplicate init exits 0 (idempotent)", "Initialized:", duplicateInit.combined);
  assertContains("duplicate init reports index regeneration", "INDEX.md", duplicateInit.combined);
  assertFileExists("duplicate init preserves config.yaml", path.join(initDir, ".spec-driven", "config.yaml"));
  assertContains(
    "duplicate init repairs roadmap index heading",
    "# Roadmap Index",
    readFile(path.join(initDir, ".spec-driven", "roadmap", "INDEX.md")),
  );
  assertContains(
    "duplicate init repairs roadmap milestones section",
    "## Milestones",
    readFile(path.join(initDir, ".spec-driven", "roadmap", "INDEX.md")),
  );

  rmrf(initDir);
}

function runVerifyRoadmapSection() {
  console.log(`\n${BOLD}[1a] verify-roadmap${RESET}`);

  const roadmapDir = mktempDir("spec-driven-roadmap-");
  cli(["init", roadmapDir]);
  writeFile(
    path.join(roadmapDir, ".spec-driven", "roadmap", "INDEX.md"),
    "# Roadmap Index\n\n## Milestones\n- [m1-foundation.md](milestones/m1-foundation.md) - m1-foundation - active\n",
  );
  writeFile(
    path.join(roadmapDir, ".spec-driven", "roadmap", "milestones", "m1-foundation.md"),
    "# m1-foundation\n\n## Goal\nShip the first roadmap milestone\n\n## In Scope\n- establish the first roadmap milestone structure\n- add validation and status reporting for roadmap milestones\n\n## Out of Scope\n- broader roadmap automation beyond validation and status reporting\n\n## Done Criteria\n- Roadmap scaffold exists\n- Validation exists\n\n## Planned Changes\n- `add-roadmap-milestones` - Declared: planned - create the milestone-based roadmap scaffold that establishes milestone files.\n- `add-roadmap-size-validation` - Declared: planned - validate milestone structure and bounded size so oversized milestones are rejected before roadmap work drifts.\n\n## Dependencies\n- roadmap must stay separate from changes\n\n## Risks\n- roadmap validation should stay easy to interpret for maintainers\n\n## Status\n- Declared: active\n\n## Notes\n- This milestone should stay small enough to validate the roadmap workflow itself.\n",
  );

  let out = cli(["verify-roadmap", roadmapDir]).combined;
  assertJsonField("verify-roadmap valid=true for bounded milestone", "valid", "true", out);
  assertContains("verify-roadmap reports milestone summary", '"plannedChanges": 2', out);
  assertContains("verify-roadmap reports allowed milestone statuses", '"milestoneDeclaredStatuses": [', out);
  assertContains("verify-roadmap reports allowed planned change statuses", '"plannedChangeDeclaredStatuses": [', out);

  ensureDir(path.join(roadmapDir, ".spec-driven", "changes", "add-roadmap-size-validation"));
  ensureDir(path.join(roadmapDir, ".spec-driven", "changes", "archive", `${formatDate()}-add-roadmap-milestones`));
  out = cli(["roadmap-status", roadmapDir]).combined;
  assertJsonField("roadmap-status valid=true for bounded milestone", "valid", "true", out);
  assertContains("roadmap-status reports archived planned change", '"name": "add-roadmap-milestones"', out);
  assertContains("roadmap-status reports declared planned change status", '"declaredStatus": "planned"', out);
  assertContains("roadmap-status reports archived state", '"state": "archived"', out);
  assertContains("roadmap-status reports derived planned change status", '"derivedStatus": "complete"', out);
  assertContains("roadmap-status reports active state", '"state": "active"', out);
  assertContains("roadmap-status derives active milestone state", '"derivedStatus": "active"', out);

  writeFile(
    path.join(roadmapDir, ".spec-driven", "roadmap", "INDEX.md"),
    "# Roadmap Index\n\n## Milestones\n- [m1-foundation.md](milestones/m1-foundation.md) - m1-foundation - active\n- [m3-missing.md](milestones/m3-missing.md) - m3-missing - complete\n",
  );
  writeFile(
    path.join(roadmapDir, ".spec-driven", "roadmap", "milestones", "m3-missing.md"),
    "# m3-missing\n\n## Goal\nDetect missing change references\n\n## In Scope\n- detect planned changes that do not exist in active or archived change state\n\n## Out of Scope\n- automatically creating missing changes\n\n## Done Criteria\n- status command exists\n\n## Planned Changes\n- `nonexistent-change` - Declared: complete - exercise mismatch reporting when the change is missing from both active and archived change state.\n\n## Dependencies\n- planned change names must stay aligned with real change directories\n\n## Risks\n- names can drift\n\n## Status\n- Declared: complete\n\n## Notes\n- The declared status is intentionally stale for mismatch coverage.\n",
  );

  out = cli(["roadmap-status", roadmapDir]).combined;
  assertContains("roadmap-status reports missing planned change", '"state": "missing"', out);
  assertContains(
    "roadmap-status reports planned change mismatch",
    "declared planned change status 'complete' does not match derived planned change status 'planned'",
    out,
  );
  assertContains("roadmap-status reports status mismatch", "does not match derived status", out);

  writeFile(
    path.join(roadmapDir, ".spec-driven", "roadmap", "milestones", "m6-multiline.md"),
    "# m6-multiline\n\n## Goal\nReject multiline planned change details\n\n## In Scope\n- verify that indented detail lines under a valid planned change entry are rejected\n\n## Out of Scope\n- accepting multiline planned change prose after a canonical first line\n\n## Done Criteria\n- roadmap validation rejects multiline planned change entries\n\n## Planned Changes\n- `multiline-change` - Declared: planned - keep a parseable first line while allowing extra context\n  Scope: cover why this planned change exists and what the next step should focus on.\n  Notes: the CLI should still resolve the change by `multiline-change` only.\n\n## Dependencies\n- top-level planned change parsing must stay deterministic\n\n## Risks\n- multiline details could be mistaken for separate planned changes if indentation is ignored\n\n## Status\n- Declared: proposed\n\n## Notes\n- This fixture verifies multiline planned change detail rejection.\n",
  );
  writeFile(
    path.join(roadmapDir, ".spec-driven", "roadmap", "INDEX.md"),
    "# Roadmap Index\n\n## Milestones\n- [m6-multiline.md](milestones/m6-multiline.md) - m6-multiline - proposed\n",
  );

  out = cli(["verify-roadmap", roadmapDir]).combined;
  assertJsonField("verify-roadmap rejects multiline planned change details", "valid", "false", out);
  assertContains("verify-roadmap reports multiline single-line guidance", "single line", out);

  out = cli(["roadmap-status", roadmapDir]).combined;
  assertJsonField("roadmap-status rejects multiline planned change details", "valid", "false", out);
  assertContains("roadmap-status reports multiline planned change format guidance", "single line", out);

  rmrf(path.join(roadmapDir, ".spec-driven", "roadmap", "milestones", "m6-multiline.md"));
  writeFile(
    path.join(roadmapDir, ".spec-driven", "roadmap", "milestones", "m2-too-large.md"),
    "# m2-too-large\n\n## Goal\nToo much work in one stage\n\n## In Scope\n- show what happens when one milestone grows too large\n\n## Out of Scope\n- automatically splitting the milestone\n\n## Done Criteria\n- Everything ships\n\n## Planned Changes\n- `change-1` - Declared: planned - first oversized planned change\n- `change-2` - Declared: planned - second oversized planned change\n- `change-3` - Declared: planned - third oversized planned change\n- `change-4` - Declared: planned - fourth oversized planned change\n- `change-5` - Declared: planned - fifth oversized planned change\n- `change-6` - Declared: planned - sixth oversized planned change\n\n## Dependencies\n- the oversized milestone still follows the required heading structure\n\n## Risks\n- too much scope\n\n## Status\n- Declared: proposed\n\n## Notes\n- This milestone is intentionally invalid because it exceeds the size limit.\n",
  );

  out = cli(["verify-roadmap", roadmapDir]).combined;
  assertJsonField("verify-roadmap valid=false for oversized milestone", "valid", "false", out);
  assertContains("verify-roadmap reports split guidance", "split it into smaller milestones", out);

  writeFile(
    path.join(roadmapDir, ".spec-driven", "roadmap", "INDEX.md"),
    "# Roadmap Index\n\n## Milestones\n- [m1-foundation.md](milestones/m1-foundation.md) - m1-foundation - active\n- [m2-too-large.md](milestones/m2-too-large.md) - m2-too-large - proposed\n- [m3-missing.md](milestones/m3-missing.md) - m3-missing - complete\n",
  );
  writeFile(
    path.join(roadmapDir, ".spec-driven", "roadmap", "milestones", "m4-bad-status.md"),
    "# m4-bad-status\n\n## Goal\nUse invalid status shape\n\n## In Scope\n- verify that invalid declared statuses are rejected\n\n## Out of Scope\n- testing mismatch behavior for otherwise valid statuses\n\n## Done Criteria\n- Validation rejects it\n\n## Planned Changes\n- `change-1` - Declared: planned - provide one valid planned change entry while status stays invalid\n\n## Dependencies\n- the milestone should stay structurally valid aside from status\n\n## Risks\n- malformed markdown can hide the real validation error\n\n## Status\n- Declared: someday\n\n## Notes\n- This fixture isolates the invalid status case.\n",
  );
  writeFile(
    path.join(roadmapDir, ".spec-driven", "roadmap", "milestones", "m5-bad-planned-change.md"),
    "# m5-bad-planned-change\n\n## Goal\nReject malformed planned change entries\n\n## In Scope\n- verify planned change entry format validation\n\n## Out of Scope\n- status mismatch reporting\n\n## Done Criteria\n- malformed planned change entries fail validation\n\n## Planned Changes\n- `change-1` - Declared: someday - provide one malformed planned change entry while milestone status stays valid\n\n## Dependencies\n- the rest of the milestone shape stays valid\n\n## Risks\n- malformed change entries could break roadmap status parsing\n\n## Status\n- Declared: proposed\n\n## Notes\n- This fixture intentionally omits the required summary format.\n",
  );

  out = cli(["verify-roadmap", roadmapDir]).combined;
  assertJsonField("verify-roadmap rejects malformed planned change entry", "valid", "false", out);
  assertContains("verify-roadmap reports unsupported planned change status", "unsupported planned change declared status", out);
  assertContains("verify-roadmap reports allowed planned change status values", "allowed: planned, complete", out);

  rmrf(path.join(roadmapDir, ".spec-driven", "roadmap", "milestones", "m5-bad-planned-change.md"));
  out = cli(["verify-roadmap", roadmapDir]).combined;
  assertJsonField("verify-roadmap rejects invalid declared status", "valid", "false", out);
  assertContains("verify-roadmap reports invalid milestone status", "invalid status", out);
  assertContains("verify-roadmap reports allowed milestone status values", "allowed: proposed, active, blocked, complete", out);

  const invalidIndexDir = mktempDir("spec-driven-invalid-index-");
  cli(["init", invalidIndexDir]);
  writeFile(
    path.join(invalidIndexDir, ".spec-driven", "roadmap", "milestones", "m1-invalid-index-status.md"),
    "# m1-invalid-index-status\n\n## Goal\nKeep roadmap index status aligned with milestone status\n\n## In Scope\n- verify roadmap index validation rejects stale or invalid milestone status labels\n\n## Out of Scope\n- archive reconciliation behavior\n\n## Done Criteria\n- verify-roadmap rejects mismatched roadmap index status\n\n## Planned Changes\n- `index-status-check` - Declared: planned - provide one valid planned change while status stays invalid\n\n## Dependencies\n- roadmap index validation must read milestone status from the file itself\n\n## Risks\n- invalid milestone statuses could be hidden by stale roadmap index labels\n\n## Status\n- Declared: someday\n\n## Notes\n- This fixture isolates invalid milestone status handling inside roadmap index validation.\n",
  );
  writeFile(
    path.join(invalidIndexDir, ".spec-driven", "roadmap", "INDEX.md"),
    "# Roadmap Index\n\n## Milestones\n- [m1-invalid-index-status.md](milestones/m1-invalid-index-status.md) - m1-invalid-index-status - proposed\n",
  );

  out = cli(["verify-roadmap", invalidIndexDir]).combined;
  assertJsonField(
    "verify-roadmap rejects roadmap index status mismatch for invalid milestone status",
    "valid",
    "false",
    out,
  );
  assertContains("verify-roadmap reports roadmap index status mismatch", "must match milestone declared status 'someday'", out);
  rmrf(invalidIndexDir);

  const archiveRoadmapDir = mktempDir("spec-driven-archive-roadmap-");
  cli(["init", archiveRoadmapDir]);
  ensureDir(path.join(archiveRoadmapDir, ".spec-driven", "changes", "archive"));
  writeFile(
    path.join(archiveRoadmapDir, ".spec-driven", "roadmap", "milestones", "m1-archive-sync.md"),
    "# m1-archive-sync\n\n## Goal\nComplete a roadmap milestone via archive\n\n## In Scope\n- verify archive-driven roadmap reconciliation\n\n## Out of Scope\n- broader roadmap sync flows beyond archive closeout\n\n## Done Criteria\n- All planned changes are archived\n\n## Planned Changes\n- `archive-sync-change` - Declared: planned - archive the last remaining planned change in this milestone\n\n## Dependencies\n- archive must update roadmap\n\n## Risks\n- archive reconciliation could leave roadmap status stale\n\n## Status\n- Declared: active\n\n## Notes\n- Archiving the only listed change should complete the milestone.\n",
  );
  writeFile(
    path.join(archiveRoadmapDir, ".spec-driven", "roadmap", "INDEX.md"),
    "# Roadmap Index\n\n## Milestones\n- [m1-archive-sync.md](milestones/m1-archive-sync.md) - m1-archive-sync - active\n",
  );

  cli(["propose", "archive-sync-change"], { cwd: archiveRoadmapDir });
  cli(["archive", "archive-sync-change"], { cwd: archiveRoadmapDir });
  assertContains(
    "archive reconciles milestone declared status",
    "- Declared: complete",
    readFile(path.join(archiveRoadmapDir, ".spec-driven", "roadmap", "milestones", "m1-archive-sync.md")),
  );
  assertContains(
    "archive reconciles planned change declared status",
    "`archive-sync-change` - Declared: complete - archive the last remaining planned change in this milestone",
    readFile(path.join(archiveRoadmapDir, ".spec-driven", "roadmap", "milestones", "m1-archive-sync.md")),
  );
  assertContains(
    "archive reconciles roadmap index status",
    "m1-archive-sync - complete",
    readFile(path.join(archiveRoadmapDir, ".spec-driven", "roadmap", "INDEX.md")),
  );

  const archiveDuplicateDir = mktempDir("spec-driven-archive-duplicate-");
  cli(["init", archiveDuplicateDir]);
  writeFile(
    path.join(archiveDuplicateDir, ".spec-driven", "roadmap", "milestones", "m2-duplicate-planned-changes.md"),
    "# m2-duplicate-planned-changes\n\n## Goal\nExpose duplicate planned change reconciliation during archive\n\n## In Scope\n- verify archive reconciliation does not leave duplicate planned change entries behind\n\n## Out of Scope\n- broader roadmap normalization outside archive closeout\n\n## Done Criteria\n- the archived planned change appears exactly once after archive\n\n## Planned Changes\n- `duplicate-archive-change` - Declared: planned - the original planned change entry before dependencies\n\n## Dependencies\n- duplicate section headings should not duplicate planned changes after archive\n\n## Planned Changes\n- `duplicate-archive-change` - Declared: planned - the later planned change entry that currently wins parser state\n\n## Risks\n- archive can rewrite one section while leaving another stale copy behind\n\n## Status\n- Declared: active\n\n## Notes\n- This milestone intentionally uses duplicate headings to reproduce the archive bug.\n",
  );
  writeFile(
    path.join(archiveDuplicateDir, ".spec-driven", "roadmap", "INDEX.md"),
    "# Roadmap Index\n\n## Milestones\n- [m2-duplicate-planned-changes.md](milestones/m2-duplicate-planned-changes.md) - m2-duplicate-planned-changes - active\n",
  );

  cli(["propose", "duplicate-archive-change"], { cwd: archiveDuplicateDir });
  cli(["archive", "duplicate-archive-change"], { cwd: archiveDuplicateDir });
  const duplicateArchiveMilestone = readFile(
    path.join(archiveDuplicateDir, ".spec-driven", "roadmap", "milestones", "m2-duplicate-planned-changes.md"),
  );
  const duplicateArchiveMatches = duplicateArchiveMilestone.match(/`duplicate-archive-change` - Declared:/g) ?? [];
  if (duplicateArchiveMatches.length === 1) {
    pass("archive leaves only one planned change entry after reconciliation");
  } else {
    fail(
      "archive leaves only one planned change entry after reconciliation",
      `expected 1 entry, got ${duplicateArchiveMatches.length}`,
    );
  }

  rmrf(archiveRoadmapDir);
  rmrf(archiveDuplicateDir);
  rmrf(roadmapDir);
}

function runVerifySpecMappingsSection() {
  console.log(`\n${BOLD}[1aa] verify-spec-mappings${RESET}`);

  const mappingDir = mktempDir("spec-driven-mappings-");
  cli(["init", mappingDir]);
  writeFile(path.join(mappingDir, "src", "app.js"), "export function run() { return 'ok'; }\n");
  writeFile(path.join(mappingDir, "test", "app.test.js"), "import '../src/app.js';\n");
  writeFile(
    path.join(mappingDir, ".spec-driven", "specs", "core", "behavior.md"),
    "---\n" +
      "mapping:\n" +
      "  implementation:\n" +
      "    - src/app.js\n" +
      "  tests:\n" +
      "    - test/app.test.js\n" +
      "---\n\n" +
      "# Core Behavior\n\n" +
      "### Requirement: app-runs\n" +
      "The app MUST run.\n",
  );

  let out = cli(["verify-spec-mappings", mappingDir]).combined;
  assertJsonField("verify-spec-mappings accepts valid mappings", "valid", "true", out);

  writeFile(
    path.join(mappingDir, ".spec-driven", "specs", "core", "missing-frontmatter.md"),
    "# Missing Frontmatter\n\n### Requirement: missing-mapping\nThe system MUST report missing mapping frontmatter.\n",
  );
  out = cli(["verify-spec-mappings", mappingDir]).combined;
  assertJsonField("verify-spec-mappings rejects missing frontmatter", "valid", "false", out);
  assertContains("verify-spec-mappings reports missing frontmatter file", "missing-frontmatter.md", out);
  rmrf(path.join(mappingDir, ".spec-driven", "specs", "core", "missing-frontmatter.md"));

  writeFile(
    path.join(mappingDir, ".spec-driven", "specs", "core", "invalid-field.md"),
    "---\n" +
      "mapping:\n" +
      "  implementation: src/app.js\n" +
      "  tests: []\n" +
      "---\n\n" +
      "# Invalid Field\n\n" +
      "### Requirement: invalid-mapping-field\n" +
      "The system MUST report invalid mapping fields.\n",
  );
  out = cli(["verify-spec-mappings", mappingDir]).combined;
  assertJsonField("verify-spec-mappings rejects invalid mapping field", "valid", "false", out);
  assertContains("verify-spec-mappings reports implementation array error", "mapping.implementation must be an array", out);
  rmrf(path.join(mappingDir, ".spec-driven", "specs", "core", "invalid-field.md"));

  writeFile(
    path.join(mappingDir, ".spec-driven", "specs", "core", "non-string-entry.md"),
    "---\n" +
      "mapping:\n" +
      "  implementation:\n" +
      "    - 123\n" +
      "  tests: []\n" +
      "---\n\n" +
      "# Non-string Entry\n\n" +
      "### Requirement: non-string-mapping-entry\n" +
      "The system MUST report non-string mapping entries.\n",
  );
  out = cli(["verify-spec-mappings", mappingDir]).combined;
  assertJsonField("verify-spec-mappings rejects non-string mapping entry", "valid", "false", out);
  assertContains("verify-spec-mappings reports string path error", "entries must be string file paths", out);
  rmrf(path.join(mappingDir, ".spec-driven", "specs", "core", "non-string-entry.md"));

  writeFile(
    path.join(mappingDir, ".spec-driven", "specs", "core", "missing-path.md"),
    "---\n" +
      "mapping:\n" +
      "  implementation:\n" +
      "    - src/missing.js\n" +
      "  tests:\n" +
      "    - test/app.test.js\n" +
      "---\n\n" +
      "# Missing Path\n\n" +
      "### Requirement: missing-mapped-path\n" +
      "The system MUST report missing mapped files.\n",
  );
  out = cli(["verify-spec-mappings", mappingDir]).combined;
  assertJsonField("verify-spec-mappings rejects missing mapped file", "valid", "false", out);
  assertContains("verify-spec-mappings identifies missing path", "src/missing.js", out);

  rmrf(mappingDir);
}

function runAuditSpecMappingCoverageSection() {
  console.log(`\n${BOLD}[1ab] audit-spec-mapping-coverage${RESET}`);

  const mappingDir = mktempDir("spec-driven-audit-mappings-");
  cli(["init", mappingDir]);
  writeFile(path.join(mappingDir, "src", "app.js"), "export function run() { return 'ok'; }\n");
  writeFile(path.join(mappingDir, "src", "extra.js"), "export const extra = true;\n");
  writeFile(path.join(mappingDir, "test", "app.test.js"), "import '../src/app.js';\n");
  writeFile(
    path.join(mappingDir, ".spec-driven", "specs", "core", "behavior.md"),
    "---\n"
      + "mapping:\n"
      + "  implementation:\n"
      + "    - src/app.js\n"
      + "    - src/extra.js\n"
      + "  tests: []\n"
      + "---\n\n"
      + "# Core Behavior\n\n"
      + "### Requirement: app-runs\n"
      + "The app MUST run.\n",
  );

  let out = cli([
    "audit-spec-mapping-coverage",
    ".spec-driven/specs/core/behavior.md",
    "--implementation", "src/app.js",
    "--tests", "test/app.test.js",
  ], { cwd: mappingDir }).combined;
  assertJsonField("audit-spec-mapping-coverage flags missing evidence", "valid", "false", out);
  assertContains("audit-spec-mapping-coverage reports missing test", '"tests": [\n      "test/app.test.js"', out);
  assertContains("audit-spec-mapping-coverage reports extra implementation", '"implementation": [\n      "src/extra.js"', out);

  out = cli([
    "audit-spec-mapping-coverage",
    ".spec-driven/specs/core/behavior.md",
    "--implementation", "src/app.js",
    "--implementation", "src/app.js",
  ], { cwd: mappingDir }).combined;
  assertJsonField("audit-spec-mapping-coverage dedupes evidence", "valid", "true", out);

  out = cli([
    "audit-spec-mapping-coverage",
    ".spec-driven/specs/core/behavior.md",
    "--implementation",
  ], { cwd: mappingDir }).combined;
  assertJsonField("audit-spec-mapping-coverage reports missing flag value", "valid", "false", out);
  assertContains("audit-spec-mapping-coverage explains missing flag value", "missing value for --implementation", out);

  out = cli([
    "audit-spec-mapping-coverage",
    ".spec-driven/specs/core/behavior.md",
    "--implementation", "../escape.js",
  ], { cwd: mappingDir }).combined;
  assertJsonField("audit-spec-mapping-coverage rejects escaped evidence path", "valid", "false", out);
  assertContains("audit-spec-mapping-coverage reports normalized path requirement", "must be a normalized repo-relative file path", out);

  rmrf(mappingDir);
}

function runAuditUnmappedSpecEvidenceSection() {
  console.log(`\n${BOLD}[1ac] audit-unmapped-spec-evidence${RESET}`);

  const mappingDir = mktempDir("spec-driven-unmapped-evidence-");
  cli(["init", mappingDir]);
  writeFile(path.join(mappingDir, "src", "app.js"), "export function run() { return 'ok'; }\n");
  writeFile(path.join(mappingDir, "src", "extra.js"), "export const extra = true;\n");
  writeFile(path.join(mappingDir, "test", "app.test.js"), "import '../src/app.js';\n");
  writeFile(
    path.join(mappingDir, ".spec-driven", "specs", "core", "behavior.md"),
    "---\n"
      + "mapping:\n"
      + "  implementation:\n"
      + "    - src/app.js\n"
      + "  tests:\n"
      + "    - test/app.test.js\n"
      + "---\n\n"
      + "# Core Behavior\n\n"
      + "### Requirement: app-runs\n"
      + "The app MUST run.\n",
  );

  let out = cli([
    "audit-unmapped-spec-evidence",
    "--implementation", "src/app.js",
    "--tests", "test/app.test.js",
  ], { cwd: mappingDir }).combined;
  assertJsonField("audit-unmapped-spec-evidence accepts fully mapped candidates", "valid", "true", out);

  out = cli([
    "audit-unmapped-spec-evidence",
    "--implementation", "src/app.js",
    "--implementation", "src/extra.js",
  ], { cwd: mappingDir }).combined;
  assertJsonField("audit-unmapped-spec-evidence flags unmapped implementation", "valid", "false", out);
  assertContains("audit-unmapped-spec-evidence reports unmapped implementation", '"implementation": [\n      "src/extra.js"', out);

  out = cli([
    "audit-unmapped-spec-evidence",
    "--tests",
  ], { cwd: mappingDir }).combined;
  assertJsonField("audit-unmapped-spec-evidence reports missing flag value", "valid", "false", out);
  assertContains("audit-unmapped-spec-evidence explains missing flag value", "missing value for --tests", out);

  rmrf(mappingDir);
}

function runInstallSection() {
  console.log(`\n${BOLD}[1b] install${RESET}`);

  const installHome = mktempDir("spec-driven-install-home-");
  let out = runInstallScript(["--cli", "codex"], { env: { HOME: installHome } }).combined;
  assertContains("install reports brainstorm skill copy", "copied: spec-driven-brainstorm/", out);
  assertFileExists(
    "install copies brainstorm skill into agent store",
    path.join(installHome, ".auto-spec-driven", "skills", "spec-driven-brainstorm", "SKILL.md"),
  );
  if (isSymlink(path.join(installHome, ".agents", "skills", "spec-driven-brainstorm"))) {
    pass("install links brainstorm skill for codex");
  } else {
    fail("install missing brainstorm symlink for codex");
  }

  assertContains("install reports maintenance skill copy", "copied: spec-driven-maintenance/", out);
  assertFileExists(
    "install copies maintenance skill into agent store",
    path.join(installHome, ".auto-spec-driven", "skills", "spec-driven-maintenance", "SKILL.md"),
  );
  if (isSymlink(path.join(installHome, ".agents", "skills", "spec-driven-maintenance"))) {
    pass("install links maintenance skill for codex");
  } else {
    fail("install missing maintenance symlink for codex");
  }

  assertContains("install reports spec-edit skill copy", "copied: spec-driven-spec-edit/", out);
  assertFileExists(
    "install copies spec-edit skill into agent store",
    path.join(installHome, ".auto-spec-driven", "skills", "spec-driven-spec-edit", "SKILL.md"),
  );
  if (isSymlink(path.join(installHome, ".agents", "skills", "spec-driven-spec-edit"))) {
    pass("install links spec-edit skill for codex");
  } else {
    fail("install missing spec-edit symlink for codex");
  }

  assertContains("install reports sync-specs skill copy", "copied: spec-driven-sync-specs/", out);
  assertFileExists(
    "install copies sync-specs skill into agent store",
    path.join(installHome, ".auto-spec-driven", "skills", "spec-driven-sync-specs", "SKILL.md"),
  );
  if (isSymlink(path.join(installHome, ".agents", "skills", "spec-driven-sync-specs"))) {
    pass("install links sync-specs skill for codex");
  } else {
    fail("install missing sync-specs symlink for codex");
  }

  assertContains("install reports resync-code-mapping skill copy", "copied: spec-driven-resync-code-mapping/", out);
  assertFileExists(
    "install copies resync-code-mapping skill into agent store",
    path.join(installHome, ".auto-spec-driven", "skills", "spec-driven-resync-code-mapping", "SKILL.md"),
  );
  if (isSymlink(path.join(installHome, ".agents", "skills", "spec-driven-resync-code-mapping"))) {
    pass("install links resync-code-mapping skill for codex");
  } else {
    fail("install missing resync-code-mapping symlink for codex");
  }

  assertContains("install reports roadmap-plan skill copy", "copied: roadmap-plan/", out);
  assertFileExists(
    "install copies roadmap-plan skill into agent store",
    path.join(installHome, ".auto-spec-driven", "skills", "roadmap-plan", "SKILL.md"),
  );
  if (isSymlink(path.join(installHome, ".agents", "skills", "roadmap-plan"))) {
    pass("install links roadmap-plan skill for codex");
  } else {
    fail("install missing roadmap-plan symlink for codex");
  }

  assertContains("install reports roadmap-milestone skill copy", "copied: roadmap-milestone/", out);
  assertFileExists(
    "install copies roadmap-milestone skill into agent store",
    path.join(installHome, ".auto-spec-driven", "skills", "roadmap-milestone", "SKILL.md"),
  );
  if (isSymlink(path.join(installHome, ".agents", "skills", "roadmap-milestone"))) {
    pass("install links roadmap-milestone skill for codex");
  } else {
    fail("install missing roadmap-milestone symlink for codex");
  }

  assertContains("install reports roadmap-recommend skill copy", "copied: roadmap-recommend/", out);
  assertFileExists(
    "install copies roadmap-recommend skill into agent store",
    path.join(installHome, ".auto-spec-driven", "skills", "roadmap-recommend", "SKILL.md"),
  );
  if (isSymlink(path.join(installHome, ".agents", "skills", "roadmap-recommend"))) {
    pass("install links roadmap-recommend skill for codex");
  } else {
    fail("install missing roadmap-recommend symlink for codex");
  }

  assertContains("install reports roadmap-propose skill copy", "copied: roadmap-propose/", out);
  assertFileExists(
    "install copies roadmap-propose skill into agent store",
    path.join(installHome, ".auto-spec-driven", "skills", "roadmap-propose", "SKILL.md"),
  );
  if (isSymlink(path.join(installHome, ".agents", "skills", "roadmap-propose"))) {
    pass("install links roadmap-propose skill for codex");
  } else {
    fail("install missing roadmap-propose symlink for codex");
  }

  assertContains("install reports roadmap-sync skill copy", "copied: roadmap-sync/", out);
  assertFileExists(
    "install copies roadmap-sync skill into agent store",
    path.join(installHome, ".auto-spec-driven", "skills", "roadmap-sync", "SKILL.md"),
  );
  if (isSymlink(path.join(installHome, ".agents", "skills", "roadmap-sync"))) {
    pass("install links roadmap-sync skill for codex");
  } else {
    fail("install missing roadmap-sync symlink for codex");
  }

  assertContains("install reports ship skill copy", "copied: spec-driven-ship/", out);
  assertFileExists(
    "install copies ship skill into agent store",
    path.join(installHome, ".auto-spec-driven", "skills", "spec-driven-ship", "SKILL.md"),
  );
  if (isSymlink(path.join(installHome, ".agents", "skills", "spec-driven-ship"))) {
    pass("install links ship skill for codex");
  } else {
    fail("install missing ship symlink for codex");
  }

  ensureDir(path.join(installHome, ".auto-spec-driven", "skills", "spec-driven-spec-content", "scripts"));
  writeFile(
    path.join(installHome, ".auto-spec-driven", "skills", "spec-driven-spec-content", "SKILL.md"),
    "---\nname: stale\ndescription: stale\n---\n",
  );
  ensureDir(path.join(installHome, ".agents", "skills"));
  fs.symlinkSync(
    path.join(installHome, ".auto-spec-driven", "skills", "spec-driven-spec-content"),
    path.join(installHome, ".agents", "skills", "spec-driven-spec-content"),
  );

  out = runInstallScript(["--cli", "codex"], { env: { HOME: installHome } }).combined;
  assertNotExists(
    "install removes retired skill from agent store",
    path.join(installHome, ".auto-spec-driven", "skills", "spec-driven-spec-content"),
  );
  if (!isSymlink(path.join(installHome, ".agents", "skills", "spec-driven-spec-content"))) {
    pass("install removes retired skill symlink");
  } else {
    fail("install left retired skill symlink");
  }

  rmrf(installHome);

  const projectInstallDir = mktempDir("spec-driven-project-install-");
  const projectInstallHome = mktempDir("spec-driven-project-home-");
  out = runInstallScript(["--project", projectInstallDir], { env: { HOME: projectInstallHome } }).combined;
  assertContains("project install reports ship skill copy", "copied: spec-driven-ship/", out);
  assertFileExists(
    "project install copies ship skill into agent store",
    path.join(projectInstallDir, ".agent", "skills", "spec-driven-ship", "SKILL.md"),
  );
  if (isSymlink(path.join(projectInstallDir, ".agents", "skills", "spec-driven-ship"))) {
    pass("project install links ship skill for agents");
  } else {
    fail("project install missing ship symlink for agents");
  }
  if (isSymlink(path.join(projectInstallDir, ".codex", "skills", "spec-driven-ship"))) {
    pass("project install links ship skill for codex");
  } else {
    fail("project install missing ship symlink for codex");
  }
  rmrf(projectInstallDir);
  rmrf(projectInstallHome);
}

function runMigrateSection() {
  console.log(`\n${BOLD}[1c] migrate${RESET}`);

  const migrateDir = mktempDir("spec-driven-migrate-");
  ensureDir(path.join(migrateDir, "openspec", "specs"));
  ensureDir(path.join(migrateDir, ".claude", "skills"));
  ensureDir(path.join(migrateDir, ".claude", "commands", "opsx"));
  ensureDir(path.join(migrateDir, ".opencode", "skills"));
  ensureDir(path.join(migrateDir, ".opencode", "commands"));
  ensureDir(path.join(migrateDir, ".cursor", "skills"));
  ensureDir(path.join(migrateDir, ".cursor", "commands"));
  writeFile(path.join(migrateDir, "openspec", "specs", "legacy.md"), "# legacy spec\n");
  createSkill(path.join(migrateDir, ".claude", "skills"), "openspec-propose");
  createSkill(path.join(migrateDir, ".opencode", "skills"), "openspec-apply-change");
  createSkill(path.join(migrateDir, ".cursor", "skills"), "openspec-propose");
  writeFile(path.join(migrateDir, ".claude", "commands", "opsx", "propose.md"), "legacy command\n");
  writeFile(path.join(migrateDir, ".opencode", "commands", "opsx-apply.md"), "legacy command\n");
  writeFile(path.join(migrateDir, ".cursor", "commands", "opsx-propose.md"), "legacy command\n");

  let out = cli(["migrate", migrateDir]).combined;
  assertContains("migrate renames openspec dir", "Moved openspec/ -> .spec-driven/", out);
  assertContains("migrate installs claude skills", "Migrated claude tool config:", out);
  assertContains("migrate installs opencode skills", "Migrated opencode tool config:", out);
  assertContains("migrate skips unsupported tools", "Skipped unsupported AI tool: .cursor", out);
  assertDirExists("migrate creates .spec-driven dir", path.join(migrateDir, ".spec-driven"));
  assertNotExists("migrate removes openspec dir", path.join(migrateDir, "openspec"));
  assertFileExists("migrate adds config.yaml", path.join(migrateDir, ".spec-driven", "config.yaml"));
  assertDirExists("migrate adds claude brainstorm skill", path.join(migrateDir, ".claude", "skills", "spec-driven-brainstorm"));
  assertDirExists("migrate adds claude spec-driven skill", path.join(migrateDir, ".claude", "skills", "spec-driven-propose"));
  assertDirExists("migrate adds claude resync-code-mapping skill", path.join(migrateDir, ".claude", "skills", "spec-driven-resync-code-mapping"));
  assertNotExists("migrate removes claude openspec skill", path.join(migrateDir, ".claude", "skills", "openspec-propose"));
  assertNotExists("migrate removes claude commands", path.join(migrateDir, ".claude", "commands", "opsx"));
  assertDirExists("migrate adds opencode brainstorm skill", path.join(migrateDir, ".opencode", "skills", "spec-driven-brainstorm"));
  assertDirExists("migrate adds opencode spec-driven skill", path.join(migrateDir, ".opencode", "skills", "spec-driven-apply"));
  assertNotExists("migrate removes opencode openspec skill", path.join(migrateDir, ".opencode", "skills", "openspec-apply-change"));
  assertDirExists("migrate preserves unsupported tool skill", path.join(migrateDir, ".cursor", "skills", "openspec-propose"));

  ensureDir(path.join(migrateDir, "openspec"));
  out = cli(["migrate", migrateDir]).combined;
  assertContains("migrate skips rename when spec-driven exists", "Skipped openspec/ rename", out);

  rmrf(migrateDir);
}

function runMaintenanceSection() {
  console.log(`\n${BOLD}[1d] maintenance${RESET}`);

  const maintDir = mktempDir("spec-driven-maint-");
  cli(["init", maintDir]);
  ensureDir(path.join(maintDir, "scripts"));
  writeFile(
    path.join(maintDir, "package.json"),
    '{\n  "name": "maintenance-fixture",\n  "type": "module",\n  "scripts": {\n    "lint": "node scripts/check-status.js",\n    "lint:fix": "node scripts/fix-status.js"\n  }\n}\n',
  );
  ensureDir(path.join(maintDir, ".spec-driven", "maintenance"));
  writeFile(
    path.join(maintDir, ".spec-driven", "maintenance", "config.json"),
    '{\n  "checks": [\n    {\n      "name": "lint",\n      "command": "npm run lint",\n      "fixCommand": "npm run lint:fix"\n    }\n  ]\n}\n',
  );
  writeFile(
    path.join(maintDir, "scripts", "check-status.js"),
    'import fs from "fs";\nconst status = fs.readFileSync("status.txt", "utf-8").trim();\nif (status !== "fixed") {\n  console.error("status is not fixed");\n  process.exit(1);\n}\nconsole.log("status ok");\n',
  );
  writeFile(
    path.join(maintDir, "scripts", "fix-status.js"),
    'import fs from "fs";\nfs.writeFileSync("status.txt", "fixed\\n");\nconsole.log("fixed");\n',
  );
  writeFile(path.join(maintDir, "status.txt"), "broken\n");
  initGitRepo(maintDir, "initial maintenance fixture");
  const baseBranch = currentBranch(maintDir);

  let out = cli(["run-maintenance", maintDir]).combined;
  assertContains("run-maintenance reports repaired status", '"status": "repaired"', out);
  assertContains("run-maintenance reports fixed lint check", '"fixedChecks": [', out);
  const maintenanceData = parseJson(out) ?? {};
  const maintenanceBranch = String(maintenanceData.branch ?? "");
  const maintenanceChange = String(maintenanceData.change ?? "");
  const statusContent = readGitFile(maintDir, `${maintenanceBranch}:status.txt`);
  assertContains("run-maintenance applies fix command on maintenance branch", "fixed", statusContent);
  const archiveTasks = readGitFile(
    maintDir,
    `${maintenanceBranch}:.spec-driven/changes/archive/${formatDate()}-${maintenanceChange}/tasks.md`,
  );
  assertContains(
    "run-maintenance archives successful change on maintenance branch",
    "- [x] Verify the maintenance change is valid and archive it",
    archiveTasks,
  );
  if (currentBranch(maintDir) === baseBranch) {
    pass("run-maintenance restores original branch");
  } else {
    fail("run-maintenance did not restore original branch");
  }
  const lastCommit = run("git", ["-C", maintDir, "log", "--oneline", "-1", maintenanceBranch]).stdout;
  assertContains("run-maintenance creates maintenance commit", "chore: maintenance", lastCommit);

  out = cli(["propose", "maintenance-pending"], { cwd: maintDir }).combined;
  assertContains("creates active maintenance change for duplicate test", "Created change:", out);
  out = cli(["run-maintenance", maintDir]).combined;
  assertContains("run-maintenance skips when active maintenance change exists", '"reason": "active-maintenance-change"', out);
  rmrf(maintDir);

  const missingConfigDir = mktempDir("spec-driven-missing-config-");
  cli(["init", missingConfigDir]);
  run("git", ["-C", missingConfigDir, "init"]);
  run("git", ["-C", missingConfigDir, "config", "user.email", "spec-driven@example.com"]);
  run("git", ["-C", missingConfigDir, "config", "user.name", "spec-driven"]);
  out = cli(["run-maintenance", missingConfigDir]).combined;
  assertContains("run-maintenance errors when config missing", '"status": "error"', out);
  assertContains("run-maintenance reports config hint", "Create .spec-driven/maintenance/config.json", out);
  rmrf(missingConfigDir);

  const noChecksDir = mktempDir("spec-driven-no-checks-");
  cli(["init", noChecksDir]);
  ensureDir(path.join(noChecksDir, ".spec-driven", "maintenance"));
  writeFile(path.join(noChecksDir, ".spec-driven", "maintenance", "config.json"), '{\n  "checks": []\n}\n');
  run("git", ["-C", noChecksDir, "init"]);
  run("git", ["-C", noChecksDir, "config", "user.email", "spec-driven@example.com"]);
  run("git", ["-C", noChecksDir, "config", "user.name", "spec-driven"]);
  out = cli(["run-maintenance", noChecksDir]).combined;
  assertContains("run-maintenance skips with no configured checks", '"reason": "no-configured-checks"', out);
  rmrf(noChecksDir);

  const cleanDir = mktempDir("spec-driven-clean-");
  cli(["init", cleanDir]);
  ensureDir(path.join(cleanDir, "scripts"));
  ensureDir(path.join(cleanDir, ".spec-driven", "maintenance"));
  writeFile(
    path.join(cleanDir, "package.json"),
    '{\n  "name": "maintenance-clean",\n  "type": "module",\n  "scripts": {\n    "lint": "node scripts/check-status.js"\n  }\n}\n',
  );
  writeFile(path.join(cleanDir, "scripts", "check-status.js"), 'console.log("status ok");\n');
  writeFile(
    path.join(cleanDir, ".spec-driven", "maintenance", "config.json"),
    '{\n  "checks": [\n    {\n      "name": "lint",\n      "command": "npm run lint"\n    }\n  ]\n}\n',
  );
  initGitRepo(cleanDir, "initial clean fixture");
  out = cli(["run-maintenance", cleanDir]).combined;
  assertContains("run-maintenance reports clean status", '"status": "clean"', out);
  rmrf(cleanDir);

  const dirtyDir = mktempDir("spec-driven-dirty-");
  cli(["init", dirtyDir]);
  ensureDir(path.join(dirtyDir, "scripts"));
  ensureDir(path.join(dirtyDir, ".spec-driven", "maintenance"));
  writeFile(
    path.join(dirtyDir, "package.json"),
    '{\n  "name": "maintenance-dirty",\n  "type": "module",\n  "scripts": {\n    "lint": "node scripts/check-status.js",\n    "lint:fix": "node scripts/fix-status.js"\n  }\n}\n',
  );
  writeFile(path.join(dirtyDir, "scripts", "check-status.js"), "process.exit(1);\n");
  writeFile(path.join(dirtyDir, "scripts", "fix-status.js"), "process.exit(0);\n");
  writeFile(
    path.join(dirtyDir, ".spec-driven", "maintenance", "config.json"),
    '{\n  "checks": [\n    {\n      "name": "lint",\n      "command": "npm run lint",\n      "fixCommand": "npm run lint:fix"\n    }\n  ]\n}\n',
  );
  initGitRepo(dirtyDir, "initial dirty fixture");
  appendFile(path.join(dirtyDir, "package.json"), "uncommitted\n");
  out = cli(["run-maintenance", dirtyDir]).combined;
  assertContains("run-maintenance skips dirty working tree", '"reason": "dirty-working-tree"', out);
  rmrf(dirtyDir);

  const unfixableDir = mktempDir("spec-driven-unfixable-");
  cli(["init", unfixableDir]);
  ensureDir(path.join(unfixableDir, "scripts"));
  ensureDir(path.join(unfixableDir, ".spec-driven", "maintenance"));
  writeFile(
    path.join(unfixableDir, "package.json"),
    '{\n  "name": "maintenance-unfixable",\n  "type": "module",\n  "scripts": {\n    "test": "node scripts/fail.js"\n  }\n}\n',
  );
  writeFile(
    path.join(unfixableDir, ".spec-driven", "maintenance", "config.json"),
    '{\n  "checks": [\n    {\n      "name": "test",\n      "command": "npm test"\n    }\n  ]\n}\n',
  );
  writeFile(path.join(unfixableDir, "scripts", "fail.js"), 'console.error("still failing");\nprocess.exit(1);\n');
  initGitRepo(unfixableDir, "initial unfixable fixture");
  out = cli(["run-maintenance", unfixableDir]).combined;
  assertContains("run-maintenance reports unfixable status", '"status": "unfixable"', out);
  assertContains("run-maintenance identifies unfixable check", '"unfixableChecks": [', out);
  if (!hasMaintenanceChange(unfixableDir)) {
    pass("run-maintenance does not create unfixable change directory");
  } else {
    fail("run-maintenance created unexpected unfixable change directory");
  }
  rmrf(unfixableDir);

  const commitFailDir = mktempDir("spec-driven-commit-fail-");
  cli(["init", commitFailDir]);
  ensureDir(path.join(commitFailDir, "scripts"));
  ensureDir(path.join(commitFailDir, ".git", "hooks"));
  ensureDir(path.join(commitFailDir, ".spec-driven", "maintenance"));
  writeFile(
    path.join(commitFailDir, "package.json"),
    '{\n  "name": "maintenance-commit-fail",\n  "type": "module",\n  "scripts": {\n    "lint": "node scripts/check-status.js",\n    "lint:fix": "node scripts/fix-status.js"\n  }\n}\n',
  );
  writeFile(
    path.join(commitFailDir, ".spec-driven", "maintenance", "config.json"),
    '{\n  "checks": [\n    {\n      "name": "lint",\n      "command": "npm run lint",\n      "fixCommand": "npm run lint:fix"\n    }\n  ]\n}\n',
  );
  writeFile(
    path.join(commitFailDir, "scripts", "check-status.js"),
    'import fs from "fs";\nconst status = fs.readFileSync("status.txt", "utf-8").trim();\nif (status !== "fixed") {\n  console.error("status is not fixed");\n  process.exit(1);\n}\n',
  );
  writeFile(path.join(commitFailDir, "scripts", "fix-status.js"), 'import fs from "fs";\nfs.writeFileSync("status.txt", "fixed\\n");\n');
  writeFile(path.join(commitFailDir, "status.txt"), "broken\n");
  initGitRepo(commitFailDir, "initial commit failure fixture");
  writeFile(path.join(commitFailDir, ".git", "hooks", "pre-commit"), '#!/usr/bin/env bash\necho "blocked by pre-commit" >&2\nexit 1\n');
  fs.chmodSync(path.join(commitFailDir, ".git", "hooks", "pre-commit"), 0o755);
  out = cli(["run-maintenance", commitFailDir]).combined;
  assertContains("run-maintenance reports blocked commit failure", '"reason": "git-commit-failed"', out);
  assertContains("run-maintenance reports pre-commit stderr", "blocked by pre-commit", out);
  rmrf(commitFailDir);

  const restoreFailDir = mktempDir("spec-driven-restore-fail-");
  cli(["init", restoreFailDir]);
  ensureDir(path.join(restoreFailDir, "scripts"));
  ensureDir(path.join(restoreFailDir, ".spec-driven", "maintenance"));
  writeFile(
    path.join(restoreFailDir, "package.json"),
    '{\n  "name": "maintenance-restore-fail",\n  "type": "module",\n  "scripts": {\n    "lint": "node scripts/check-status.js",\n    "lint:fix": "node scripts/fix-status.js"\n  }\n}\n',
  );
  writeFile(
    path.join(restoreFailDir, ".spec-driven", "maintenance", "config.json"),
    '{\n  "checks": [\n    {\n      "name": "lint",\n      "command": "npm run lint",\n      "fixCommand": "npm run lint:fix"\n    }\n  ]\n}\n',
  );
  writeFile(
    path.join(restoreFailDir, "scripts", "check-status.js"),
    'import fs from "fs";\nconst status = fs.readFileSync("status.txt", "utf-8").trim();\nif (status !== "fixed") {\n  console.error("status is not fixed");\n  process.exit(1);\n}\n',
  );
  writeFile(path.join(restoreFailDir, "scripts", "fix-status.js"), 'import fs from "fs";\nfs.writeFileSync("status.txt", "fixed\\n");\n');
  writeFile(path.join(restoreFailDir, "status.txt"), "broken\n");
  initGitRepo(restoreFailDir, "initial restore failure fixture");
  const restoreBaseBranch = currentBranch(restoreFailDir);
  writeFile(
    path.join(restoreFailDir, ".git", "hooks", "post-commit"),
    `#!/usr/bin/env bash\ngit branch -D ${restoreBaseBranch} >/dev/null 2>&1 || true\n`,
  );
  fs.chmodSync(path.join(restoreFailDir, ".git", "hooks", "post-commit"), 0o755);
  out = cli(["run-maintenance", restoreFailDir]).combined;
  assertContains("run-maintenance reports blocked restore failure", '"reason": "restore-branch-failed"', out);
  assertContains("run-maintenance keeps maintenance branch in blocked output", '"branch": "maintenance-', out);
  rmrf(restoreFailDir);

  const archiveFailDir = mktempDir("spec-driven-archive-fail-");
  cli(["init", archiveFailDir]);
  ensureDir(path.join(archiveFailDir, "scripts"));
  ensureDir(path.join(archiveFailDir, ".spec-driven", "maintenance"));
  writeFile(
    path.join(archiveFailDir, "package.json"),
    '{\n  "name": "maintenance-archive-fail",\n  "type": "module",\n  "scripts": {\n    "lint": "node scripts/check-status.js",\n    "lint:fix": "node scripts/fix-status.js"\n  }\n}\n',
  );
  writeFile(
    path.join(archiveFailDir, ".spec-driven", "maintenance", "config.json"),
    '{\n  "checks": [\n    {\n      "name": "lint",\n      "command": "npm run lint",\n      "fixCommand": "npm run lint:fix"\n    }\n  ]\n}\n',
  );
  writeFile(
    path.join(archiveFailDir, "scripts", "check-status.js"),
    'import fs from "fs";\nconst status = fs.readFileSync("status.txt", "utf-8").trim();\nif (status !== "fixed") process.exit(1);\n',
  );
  writeFile(path.join(archiveFailDir, "scripts", "fix-status.js"), 'import fs from "fs";\nfs.writeFileSync("status.txt", "fixed\\n");\n');
  writeFile(path.join(archiveFailDir, "status.txt"), "broken\n");
  initGitRepo(archiveFailDir, "initial archive failure fixture");
  rmrf(path.join(archiveFailDir, ".spec-driven", "changes", "archive"));
  writeFile(path.join(archiveFailDir, ".spec-driven", "changes", "archive"), "not-a-directory\n");
  run("git", ["-C", archiveFailDir, "add", ".spec-driven/changes/archive"]);
  run("git", ["-C", archiveFailDir, "commit", "-m", "add archive blocker"]);
  out = cli(["run-maintenance", archiveFailDir]).combined;
  assertContains("run-maintenance reports blocked archive failure", '"reason": "archive-failed"', out);
  rmrf(archiveFailDir);
}

function runProjectWorkflowSections() {
  section("[2] propose");

  let out = cli(["propose", CHANGE], { cwd: PROJECT }).combined;
  assertContains("creates change directory", "Created change:", out);
  assertContains("reports proposal.md", "proposal.md", out);
  assertContains("reports specs/ dir", "specs/", out);
  assertContains("reports design.md", "design.md", out);
  assertContains("reports tasks.md", "tasks.md", out);
  assertContains("reports questions.md", "questions.md", out);
  assertFileExists("proposal.md exists", path.join(PROJECT, ".spec-driven", "changes", CHANGE, "proposal.md"));
  assertDirExists("specs/ dir exists", path.join(PROJECT, ".spec-driven", "changes", CHANGE, "specs"));
  assertFileExists("design.md exists", path.join(PROJECT, ".spec-driven", "changes", CHANGE, "design.md"));
  assertFileExists("tasks.md exists", path.join(PROJECT, ".spec-driven", "changes", CHANGE, "tasks.md"));
  assertFileExists("questions.md exists", path.join(PROJECT, ".spec-driven", "changes", CHANGE, "questions.md"));

  assertExit("duplicate propose exits 1", 1, cli(["propose", CHANGE], { cwd: PROJECT }));
  assertExit("invalid name exits 1", 1, cli(["propose", "Bad_Name"], { cwd: PROJECT }));

  console.log(`\n${BOLD}[3] modify${RESET}`);
  out = cli(["modify"], { cwd: PROJECT }).combined;
  assertContains("lists active changes", CHANGE, out);

  out = cli(["modify", CHANGE], { cwd: PROJECT }).combined;
  assertContains("shows proposal.md path", "proposal.md", out);
  assertContains("shows specs/ dir", "specs/", out);
  assertContains("shows design.md path", "design.md", out);
  assertContains("shows tasks.md path", "tasks.md", out);
  assertContains("shows questions.md path", "questions.md", out);

  out = cli(["modify", "nonexistent"], { cwd: PROJECT }).combined;
  assertContains("nonexistent change errors", "not found", out);

  console.log(`\n${BOLD}[3b] list${RESET}`);
  out = cli(["list"], { cwd: PROJECT }).combined;
  assertContains("list shows active changes", CHANGE, out);
  assertContains("list shows proposed status", "proposed", out);

  const tasksFile = path.join(PROJECT, ".spec-driven", "changes", CHANGE, "tasks.md");
  replaceOnce(tasksFile, "- [ ] Task 1", "- [x] Task 1");
  out = cli(["list"], { cwd: PROJECT }).combined;
  assertContains("list shows in-progress status", "in-progress", out);

  replaceOnce(tasksFile, "- [x] Task 1", "- [ ] Task 1");
  replaceTaskTemplateCommands(tasksFile);

  const questionsFile = path.join(PROJECT, ".spec-driven", "changes", CHANGE, "questions.md");
  writeFile(
    questionsFile,
    `# Questions: ${CHANGE}\n\n## Open\n\n- [ ] Q: Is this correct?\n  Context: depends on this\n\n## Resolved\n`,
  );
  out = cli(["list"], { cwd: PROJECT }).combined;
  assertContains("list shows blocked status on open questions", "blocked", out);

  writeFile(questionsFile, `# Questions: ${CHANGE}\n\n## Open\n\n## Resolved\n`);

  console.log(`\n${BOLD}[4] apply${RESET}`);
  out = cli(["apply", CHANGE], { cwd: PROJECT }).combined;
  assertJsonField("total > 0", "total", "6", out);
  assertJsonField("complete = 0", "complete", "0", out);
  assertJsonField("remaining = 6", "remaining", "6", out);

  replaceOnce(tasksFile, "- [ ] Task 1", "- [x] Task 1");
  replaceOnce(tasksFile, "- [ ] Task 2", "- [x] Task 2");
  out = cli(["apply", CHANGE], { cwd: PROJECT }).combined;
  assertJsonField("complete = 2 after marking", "complete", "2", out);
  assertJsonField("remaining = 4 after marking", "remaining", "4", out);
  assertExit("missing change exits 1", 1, cli(["apply", "nonexistent"], { cwd: PROJECT }));

  console.log(`\n${BOLD}[5] verify${RESET}`);
  out = cli(["verify", CHANGE], { cwd: PROJECT }).combined;
  assertJsonField("valid=true for seeded change", "valid", "true", out);
  assertContains("warns about placeholders", "placeholders", out);
  assertContains("warns about incomplete tasks", "incomplete", out);
  assertContains("warns about empty specs dir", "specs/ is empty", out);

  writeFile(tasksFile, "# Tasks\n\n## Implementation\n\n- [ ] Task 1\n\n## Verification\n\n- [ ] Verify\n");
  out = cli(["verify", CHANGE], { cwd: PROJECT }).combined;
  assertJsonField("missing testing section is invalid", "valid", "false", out);
  assertContains("errors on missing testing section", "Testing", out);

  writeFile(
    tasksFile,
    "# Tasks\n\n## Implementation\n\n- [ ] Task 1\n\n## Testing\n\n- [ ] Run `npm test` to confirm unit tests pass\n\n## Verification\n\n- [ ] Verify\n",
  );
  out = cli(["verify", CHANGE], { cwd: PROJECT }).combined;
  assertJsonField("missing lint coverage is invalid", "valid", "false", out);
  assertContains("errors on missing lint coverage", "lint or validation", out);

  writeFile(
    tasksFile,
    "# Tasks\n\n## Implementation\n\n- [ ] Task 1\n\n## Testing\n\n- [ ] Run `npm run build` to confirm validation passes\n\n## Verification\n\n- [ ] Verify\n",
  );
  out = cli(["verify", CHANGE], { cwd: PROJECT }).combined;
  assertJsonField("missing unit test coverage is invalid", "valid", "false", out);
  assertContains("errors on missing unit coverage", "unit test", out);

  writeFile(
    tasksFile,
    "# Tasks\n\n## Implementation\n\n- [ ] Task 1\n\n## Testing\n\n- [ ] Run `npm run build` to confirm validation passes\n- [ ] Run `npm run test:e2e` to confirm integration tests pass\n\n## Verification\n\n- [ ] Verify\n",
  );
  out = cli(["verify", CHANGE], { cwd: PROJECT }).combined;
  assertJsonField("integration tests do not satisfy unit requirement", "valid", "false", out);
  assertContains("integration tests still report missing unit coverage", "unit test", out);

  writeFile(
    tasksFile,
    "# Tasks\n\n## Implementation\n\n- [ ] Task 1\n\n## Testing\n\n- [ ] Lint passes\n- [ ] Unit tests pass\n\n## Verification\n\n- [ ] Verify\n",
  );
  out = cli(["verify", CHANGE], { cwd: PROJECT }).combined;
  assertJsonField("vague testing wording is invalid", "valid", "false", out);
  assertContains("errors on vague lint wording", "explicit runnable command", out);

  writeFile(tasksFile, "");
  out = cli(["verify", CHANGE], { cwd: PROJECT }).combined;
  assertJsonField("empty tasks.md -> invalid", "valid", "false", out);

  restoreFreshTasks(PROJECT, CHANGE);
  out = cli(["verify", CHANGE], { cwd: PROJECT }).combined;
  assertJsonField("valid=true after restore", "valid", "true", out);

  assertExit("nonexistent change exits 0 with errors", 0, cli(["verify", "nonexistent"], { cwd: PROJECT }));

  writeFile(
    questionsFile,
    "# Questions\n\n## Open\n\n- [ ] Q: What should happen here?\n  Context: unclear\n\n## Resolved\n",
  );
  out = cli(["verify", CHANGE], { cwd: PROJECT }).combined;
  assertJsonField("verify errors on open questions", "valid", "false", out);
  assertContains("verify reports open questions message", "open", out);

  writeFile(
    questionsFile,
    "# Questions\n\n## Open\n\n## Resolved\n\n- [x] Q: What should happen here?\n  Context: unclear\n  A: Do the right thing\n",
  );
  out = cli(["verify", CHANGE], { cwd: PROJECT }).combined;
  assertJsonField("verify passes when questions resolved", "valid", "true", out);

  writeFile(questionsFile, `# Questions: ${CHANGE}\n\n## Open\n\n## Resolved\n`);

  console.log(`\n${BOLD}[6] archive${RESET}`);
  out = cli(["archive", CHANGE], { cwd: PROJECT }).combined;
  assertContains("reports archived path", "Archived:", out);
  assertContains("includes date prefix", formatDate(), out);

  const today = formatDate();
  assertDirExists("archive dir exists", path.join(PROJECT, ".spec-driven", "changes", "archive", `${today}-${CHANGE}`));
  assertNotExists("source dir removed", path.join(PROJECT, ".spec-driven", "changes", CHANGE));
  assertExit("archive nonexistent exits 1", 1, cli(["archive", "nonexistent"], { cwd: PROJECT }));
  assertExit("duplicate archive exits 1", 1, cli(["archive", CHANGE], { cwd: PROJECT }));

  console.log(`\n${BOLD}[7] cancel${RESET}`);
  cli(["propose", "to-cancel"], { cwd: PROJECT });
  assertDirExists("change exists before cancel", path.join(PROJECT, ".spec-driven", "changes", "to-cancel"));
  out = cli(["cancel", "to-cancel"], { cwd: PROJECT }).combined;
  assertContains("reports cancelled path", "Cancelled:", out);
  assertNotExists("change removed after cancel", path.join(PROJECT, ".spec-driven", "changes", "to-cancel"));
  assertExit("cancel nonexistent exits 1", 1, cli(["cancel", "nonexistent"], { cwd: PROJECT }));
}

function main() {
  console.log(`\n${BOLD}spec-driven test suite${RESET} - project: test/todo-app\n`);

  resetState();
  runValidateSkillsSection();
  runInitSection();
  runVerifyRoadmapSection();
  runVerifySpecMappingsSection();
  runAuditSpecMappingCoverageSection();
  runAuditUnmappedSpecEvidenceSection();
  runInstallSection();
  runMigrateSection();
  runMaintenanceSection();
  runProjectWorkflowSections();
  resetState();

  console.log("");
  const total = passed + failed;
  if (failed === 0) {
    console.log(`${GREEN}${BOLD}All ${total} tests passed.${RESET}`);
    return;
  }

  console.log(`${RED}${BOLD}${failed}/${total} tests failed.${RESET}`);
  process.exit(1);
}

main();
