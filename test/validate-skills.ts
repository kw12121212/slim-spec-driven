#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import type { Heading, PhrasingContent, Root, RootContent } from "mdast";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { parseDocument } from "yaml";

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

type PropertySchema = {
  enum?: JsonValue[];
  items?: PropertySchema;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  type?: string;
};

type SchemaRules = {
  allowedTypes: string[];
  basePropertySchemas: Record<string, PropertySchema>;
  baseRequired: string[];
  metadataPropertySchemas: Record<string, PropertySchema>;
  metadataRequired: string[];
  typeRules: Record<string, TypeRule>;
};

type SectionRequirement = {
  exactText: string;
  followedBy?: string;
};

type TypeRule = {
  allowAdditionalSections: boolean;
  allowPreamble: boolean;
  preambleType?: string;
  propertySchemas: Record<string, PropertySchema>;
  required: string[];
  requirePreamble: boolean;
  sectionVariants: SectionRequirement[][];
};

type ValidationError = {
  actual?: JsonValue;
  code: string;
  expected?: JsonValue;
  line?: number;
  message: string;
  path: string;
};

type ValidationResult = {
  detected_type: string | null;
  errors: ValidationError[];
  file: string;
  schema: string;
  section_titles: string[];
  valid: boolean;
};

type FrontmatterSplit = {
  body: string;
  bodyLineOffset: number;
  lines: { line: number; text: string }[];
  raw: string;
};

type ParsedFrontmatter = {
  data: Record<string, JsonValue>;
  keyLines: Record<string, number>;
};

type ParsedSection = {
  firstBlockLine?: number;
  firstBlockType?: string;
  headingLine: number;
  headingText: string;
  level: number;
};

type ParsedAstStructure = {
  preambleLine?: number;
  preambleType?: string;
  sections: ParsedSection[];
};

function main(): void {
  const schemaPath = path.resolve("test/skill-schema.yaml");
  const [targetArg] = process.argv.slice(2);

  if (!targetArg) {
    validateAllSkills();
    return;
  }

  const targetPath = path.resolve(targetArg);
  const errors: ValidationError[] = [];

  if (!fs.existsSync(schemaPath)) {
    errors.push({
      code: "schema.missing",
      message: `Schema file not found: ${schemaPath}`,
      path: "$schema",
    });
    printAndExit(baseResult(targetPath, schemaPath, errors, null, []), 1);
    return;
  }

  if (!fs.existsSync(targetPath)) {
    errors.push({
      code: "file.missing",
      message: `Target file not found: ${targetPath}`,
      path: "$",
    });
    printAndExit(baseResult(targetPath, schemaPath, errors, null, []), 1);
    return;
  }

  let schemaRules: SchemaRules;
  try {
    schemaRules = loadSchemaRules(fs.readFileSync(schemaPath, "utf8"), schemaPath);
  } catch (error) {
    errors.push(toValidationError(error, "schema.parse_error", "$schema", "Failed to parse schema"));
    printAndExit(baseResult(targetPath, schemaPath, errors, null, []), 1);
    return;
  }

  const markdown = fs.readFileSync(targetPath, "utf8");

  let split: FrontmatterSplit;
  try {
    split = splitFrontmatter(markdown);
  } catch (error) {
    errors.push(toValidationError(error, "frontmatter.missing", "frontmatter", "Failed to locate YAML frontmatter"));
    printAndExit(baseResult(targetPath, schemaPath, errors, null, []), 1);
    return;
  }

  let frontmatter: ParsedFrontmatter | null = null;
  try {
    frontmatter = parseFrontmatter(split);
  } catch (error) {
    errors.push(toValidationError(error, "frontmatter.parse_error", "frontmatter", "Failed to parse frontmatter"));
  }

  const detectedType = frontmatter ? getStringAtPath(frontmatter.data, ["metadata", "type"]) : null;

  if (frontmatter) {
    validateFrontmatter(frontmatter, schemaRules, errors);
  }

  let astStructure: ParsedAstStructure = { sections: [] };
  try {
    astStructure = parseSections(split.body, split.bodyLineOffset);
  } catch (error) {
    errors.push(toValidationError(error, "markdown.parse_error", "ast_structure", "Failed to parse markdown body"));
  }

  const sectionTitles = astStructure.sections.map((section) => section.headingText);

  if (detectedType && schemaRules.typeRules[detectedType]) {
    validateAstStructure(astStructure, schemaRules.typeRules[detectedType], errors);
  } else if (detectedType) {
    errors.push({
      actual: detectedType,
      code: "frontmatter.type.unsupported",
      expected: schemaRules.allowedTypes,
      line: frontmatter?.keyLines["metadata.type"],
      message: `Unsupported type "${detectedType}"`,
      path: "frontmatter.metadata.type",
    });
  }

  printAndExit(
    baseResult(targetPath, schemaPath, errors, detectedType, sectionTitles),
    errors.length === 0 ? 0 : 1,
  );
}

function validateAllSkills(): void {
  const skillsDir = path.resolve("skills");
  if (!fs.existsSync(skillsDir) || !fs.statSync(skillsDir).isDirectory()) {
    printAndExit(
      {
        detected_type: null,
        errors: [
          {
            code: "skills_dir.missing",
            message: `Skills directory not found: ${skillsDir}`,
            path: "$",
          },
        ],
        file: "",
        schema: path.resolve("test/skill-schema.yaml"),
        section_titles: [],
        valid: false,
      },
      1,
    );
    return;
  }

  const scriptPath = path.resolve(process.argv[1] ?? "dist/test/validate-skills.js");
  const skillDirs = fs
    .readdirSync(skillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(skillsDir, entry.name))
    .filter((skillDir) => fs.existsSync(path.join(skillDir, "SKILL.md")))
    .sort();

  const skillFiles = skillDirs.map((skillDir) => path.join(skillDir, "SKILL.md"));

  const commandSectionErrors = validateSkillCommandSections(skillFiles);
  if (commandSectionErrors.length > 0) {
    printAndExit(
      {
        detected_type: null,
        errors: commandSectionErrors,
        file: "",
        schema: path.resolve("test/skill-schema.yaml"),
        section_titles: [],
        valid: false,
      },
      1,
    );
    return;
  }

  const symlinkErrors = validateSkillScriptSymlinks(skillDirs);
  if (symlinkErrors.length > 0) {
    printAndExit(
      {
        detected_type: null,
        errors: symlinkErrors,
        file: "",
        schema: path.resolve("test/skill-schema.yaml"),
        section_titles: [],
        valid: false,
      },
      1,
    );
    return;
  }

  const commandReferenceErrors = validateExplicitCommandReferences(skillFiles);
  if (commandReferenceErrors.length > 0) {
    printAndExit(
      {
        detected_type: null,
        errors: commandReferenceErrors,
        file: "",
        schema: path.resolve("test/skill-schema.yaml"),
        section_titles: [],
        valid: false,
      },
      1,
    );
    return;
  }

  let failed = 0;
  for (const skillPath of skillFiles) {
    const result = spawnSync(process.execPath, [scriptPath, skillPath], {
      encoding: "utf8",
    });
    if (result.status !== 0) {
      failed += 1;
      process.stdout.write(result.stdout ?? "");
      process.stderr.write(result.stderr ?? "");
    }
  }

  if (failed > 0) {
    console.error(`Failed ${failed}/${skillFiles.length} skill validation checks.`);
    process.exitCode = 1;
    return;
  }

  console.log(`Validated ${skillFiles.length} skills.`);
}

function normalizeSkillPath(value: string): string {
  return value.split(path.sep).join("/");
}

function validateSkillScriptSymlinks(skillDirs: string[]): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const skillDir of skillDirs) {
    const skillName = path.basename(skillDir);
    const scriptsPath = path.join(skillDir, "scripts");
    let stats: fs.Stats;
    try {
      stats = fs.lstatSync(scriptsPath);
    } catch {
      errors.push({
        code: "skill.scripts_symlink.missing",
        message: `Skill '${skillName}' is missing the required scripts symlink`,
        path: `skills/${skillName}/scripts`,
      });
      continue;
    }

    if (!stats.isSymbolicLink()) {
      errors.push({
        code: "skill.scripts_symlink.invalid_type",
        message: `Skill '${skillName}' scripts entry must be a symlink`,
        path: `skills/${skillName}/scripts`,
      });
      continue;
    }

    const target = fs.readlinkSync(scriptsPath);
    const expectedTarget = path.relative(skillDir, path.resolve("dist", "scripts"));
    const normalizedExpected = normalizeSkillPath(expectedTarget);
    if (normalizeSkillPath(target) !== normalizedExpected) {
      errors.push({
        code: "skill.scripts_symlink.invalid_target",
        message: `Skill '${skillName}' scripts symlink must point to '${normalizedExpected}'`,
        path: `skills/${skillName}/scripts`,
        actual: normalizeSkillPath(target),
        expected: normalizedExpected,
      });
      continue;
    }

    const resolvedPath = path.resolve(skillDir, target);
    if (!fs.existsSync(resolvedPath) || !fs.statSync(resolvedPath).isDirectory()) {
      errors.push({
        code: "skill.scripts_symlink.broken",
        message: `Skill '${skillName}' scripts symlink target does not resolve to a directory`,
        path: `skills/${skillName}/scripts`,
      });
    }
  }

  return errors;
}

function validateExplicitCommandReferences(skillFiles: string[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const disallowedPhrases = [
    "run `audit-unmapped-spec-evidence`",
    "rerun both the script check",
    "Reuse the verify-phase unmapped-audit result",
    "Use the audit output",
    "rerun validation",
    "Always run `verify-spec-mappings`",
    "using the audit command output",
  ];

  for (const skillFile of skillFiles) {
    const content = fs.readFileSync(skillFile, "utf8");
    for (const phrase of disallowedPhrases) {
      if (!content.includes(phrase)) continue;
      errors.push({
        code: "skill.command_reference.implicit",
        message: `Skill command reference must name the concrete script command instead of '${phrase}'`,
        path: normalizeSkillPath(path.relative(path.resolve(), skillFile)),
      });
    }
  }

  return errors;
}

function validateSkillCommandSections(skillFiles: string[]): ValidationError[] {
  const errors: ValidationError[] = [];
  for (const skillFile of skillFiles) {
    const content = fs.readFileSync(skillFile, "utf8");
    const usedSubcommands = extractSkillCliSubcommands(content);
    if (usedSubcommands.length === 0) {
      continue;
    }

    const commandsSection = extractCommandsSection(content);
    if (!commandsSection) {
      errors.push({
        code: "skill.commands_section.missing",
        message: "Skills that use the shared spec-driven CLI must include a '## This Skill's Commands' section with a YAML-like command mapping",
        path: normalizeSkillPath(path.relative(path.resolve(), skillFile)),
      });
      continue;
    }

    const commandsIndex = content.indexOf("## This Skill's Commands");
    const prerequisitesIndex = content.indexOf("## Prerequisites");
    if (prerequisitesIndex !== -1 && commandsIndex > prerequisitesIndex) {
      errors.push({
        code: "skill.commands_section.order",
        message: "Skill '## This Skill's Commands' section must appear before '## Prerequisites'",
        path: normalizeSkillPath(path.relative(path.resolve(), skillFile)),
      });
    }

    const commandsMapping = extractCommandsMapping(commandsSection);
    if (!commandsMapping) {
      errors.push({
        code: "skill.commands_section.invalid_format",
        message: "Skill '## This Skill's Commands' section must contain a fenced yaml block with '<subcommand>: <command>' mappings",
        path: normalizeSkillPath(path.relative(path.resolve(), skillFile)),
      });
      continue;
    }

    const declaredSubcommands = new Set(Object.keys(commandsMapping));
    const usedSubcommandSet = new Set(usedSubcommands);
    for (const subcommand of usedSubcommands) {
      if (declaredSubcommands.has(subcommand)) continue;
      errors.push({
        code: "skill.commands_section.incomplete",
        message: `Skill '## This Skill's Commands' section must map the shared CLI command '${subcommand}' used by the skill`,
        path: normalizeSkillPath(path.relative(path.resolve(), skillFile)),
      });
    }

    for (const subcommand of declaredSubcommands) {
      if (usedSubcommandSet.has(subcommand)) continue;
      errors.push({
        code: "skill.commands_section.extra_entry",
        message: `Skill '## This Skill's Commands' section must not list unused shared CLI command '${subcommand}'`,
        path: normalizeSkillPath(path.relative(path.resolve(), skillFile)),
      });
    }

    for (const [subcommand, command] of Object.entries(commandsMapping)) {
      const expectedPrefix = `node {{SKILL_DIR}}/scripts/spec-driven.js ${subcommand}`;
      if (!command.startsWith(expectedPrefix)) {
        errors.push({
          code: "skill.commands_section.mismatched_command",
          message: `Skill '## This Skill's Commands' entry '${subcommand}' must start with '${expectedPrefix}'`,
          path: normalizeSkillPath(path.relative(path.resolve(), skillFile)),
        });
      }
    }
  }

  return errors;
}

function extractCommandsSection(content: string): string | null {
  const match = content.match(/## This Skill's Commands\s*\n([\s\S]*?)(?=\n##\s+[^\n]+|$)/);
  return match?.[1] ?? null;
}

function extractCommandsMapping(section: string): Record<string, string> | null {
  const blockMatch = section.match(/```yaml\n([\s\S]*?)\n```/);
  if (!blockMatch) return null;

  const mapping: Record<string, string> = {};
  const lines = blockMatch[1]
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) return null;

  for (const line of lines) {
    const match = line.match(/^([a-z0-9-]+):\s+(.+)$/);
    if (!match) return null;
    mapping[match[1]] = match[2];
  }

  return mapping;
}

function extractSkillCliSubcommands(content: string): string[] {
  const matches = Array.from(content.matchAll(/node \{\{SKILL_DIR\}\}\/scripts\/spec-driven\.js ([a-z0-9-]+)/g));
  return [...new Set(matches.map((match) => match[1]))];
}

function baseResult(
  file: string,
  schema: string,
  errors: ValidationError[],
  detectedType: string | null,
  sectionTitles: string[],
): ValidationResult {
  return {
    detected_type: detectedType,
    errors,
    file,
    schema,
    section_titles: sectionTitles,
    valid: errors.length === 0,
  };
}

function printAndExit(result: ValidationResult, code: number): void {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exitCode = code;
}

function loadSchemaRules(schemaText: string, schemaPath: string): SchemaRules {
  const schema = parseYamlObject(schemaText, schemaPath);
  const properties = expectRecord(schema.properties, "schema.properties");
  const frontmatter = expectRecord(properties.frontmatter, "schema.properties.frontmatter");
  const frontmatterProperties = expectRecord(
    frontmatter.properties,
    "schema.properties.frontmatter.properties",
  );
  const metadata = expectRecord(frontmatterProperties.metadata, "schema frontmatter metadata");
  const metadataProperties = expectRecord(
    metadata.properties,
    "schema.properties.frontmatter.properties.metadata.properties",
  );
  const typeSchema = expectRecord(metadataProperties.type, "schema frontmatter metadata type");
  const allowedTypes = expectArray(typeSchema.enum, "schema frontmatter type enum").map(expectString);
  const allOf = expectArray(schema.allOf, "schema.allOf");

  const typeRules: Record<string, TypeRule> = {};
  for (const rule of allOf) {
    const ruleRecord = expectRecord(rule, "schema.allOf[]");
    const ifProperties = expectRecord(
      expectRecord(ruleRecord.if, "schema.if").properties,
      "schema.if.properties",
    );
    const ifFrontmatter = expectRecord(ifProperties.frontmatter, "schema.if.frontmatter");
    const ifFrontmatterProperties = expectRecord(
      ifFrontmatter.properties,
      "schema.if.frontmatter.properties",
    );
    const ifMetadata = expectRecord(
      ifFrontmatterProperties.metadata,
      "schema.if.frontmatter.properties.metadata",
    );
    const ifMetadataProperties = expectRecord(
      ifMetadata.properties,
      "schema.if.frontmatter.properties.metadata.properties",
    );
    const typeName = expectString(
      expectRecord(
        ifMetadataProperties.type,
        "schema.if.frontmatter.properties.metadata.type",
      ).const,
    );

    const thenProperties = expectRecord(
      expectRecord(ruleRecord.then, "schema.then").properties,
      "schema.then.properties",
    );
    const thenFrontmatter = optionalRecord(thenProperties.frontmatter);
    const thenAst = expectRecord(thenProperties.ast_structure, "schema.then.ast_structure");
    const sectionVariants = extractSectionVariants(thenAst);
    const requirePreamble = thenAst.require_preamble === true;

    typeRules[typeName] = {
      allowAdditionalSections: thenAst.allow_additional_sections === true,
      allowPreamble: thenAst.allow_preamble === true || requirePreamble,
      preambleType: typeof thenAst.preamble_type === "string" ? thenAst.preamble_type : undefined,
      propertySchemas: recordOfPropertySchemas(thenFrontmatter?.properties),
      required: toStringArray(thenFrontmatter?.required),
      requirePreamble,
      sectionVariants,
    };
  }

  return {
    allowedTypes,
    basePropertySchemas: recordOfPropertySchemas(frontmatterProperties),
    baseRequired: toStringArray(frontmatter.required),
    metadataPropertySchemas: recordOfPropertySchemas(metadataProperties),
    metadataRequired: toStringArray(metadata.required),
    typeRules,
  };
}

function splitFrontmatter(markdown: string): FrontmatterSplit {
  const normalized = markdown.replace(/\r\n?/g, "\n");
  const lines = normalized.split("\n");

  if (lines[0] !== "---") {
    throw new Error('Markdown file must start with a YAML frontmatter block delimited by "---"');
  }

  const closingIndex = lines.findIndex((line, index) => index > 0 && line === "---");
  if (closingIndex === -1) {
    throw new Error('Missing closing "---" for YAML frontmatter');
  }

  return {
    body: lines.slice(closingIndex + 1).join("\n"),
    bodyLineOffset: closingIndex + 1,
    lines: lines.slice(1, closingIndex).map((text, index) => ({ line: index + 2, text })),
    raw: lines.slice(1, closingIndex).join("\n"),
  };
}

function parseFrontmatter(split: FrontmatterSplit): ParsedFrontmatter {
  const data = parseYamlObject(split.raw, "frontmatter");
  const keyLines: Record<string, number> = {};
  const keyStack: { indent: number; key: string }[] = [];

  for (const entry of split.lines) {
    const trimmed = entry.text.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    if (trimmed.startsWith("- ")) {
      continue;
    }

    const indent = leadingIndent(entry.text);
    const match = trimmed.match(/^([A-Za-z0-9_-]+)\s*:/);
    if (match) {
      while (keyStack.length > 0 && indent <= keyStack[keyStack.length - 1].indent) {
        keyStack.pop();
      }

      const key = match[1];
      const path = [...keyStack.map((entry) => entry.key), key].join(".");
      keyLines[path] = entry.line;
      keyStack.push({ indent, key });
    }
  }

  return {
    data,
    keyLines,
  };
}

function parseYamlObject(input: string, label: string): Record<string, JsonValue> {
  const document = parseDocument(input, {
    prettyErrors: false,
    strict: true,
  });

  if (document.errors.length > 0) {
    const firstError = document.errors[0];
    throw annotateError(firstError, `Invalid YAML in ${label}`);
  }

  const value = document.toJS();
  if (!isRecord(value)) {
    throw new Error(`${label} must be a YAML object`);
  }

  return value as Record<string, JsonValue>;
}

function extractSectionRequirement(value: unknown): SectionRequirement {
  const record = expectRecord(value, "schema section requirement");
  const properties = expectRecord(record.properties, "schema section requirement properties");
  const exactText = expectString(
    expectRecord(properties.exact_text, "schema section exact_text").const,
  );
  const followedBySchema = properties.followed_by;

  return {
    exactText,
    followedBy: followedBySchema
      ? expectString(expectRecord(followedBySchema, "schema section followed_by").const)
      : undefined,
  };
}

function extractSectionVariants(astStructure: Record<string, unknown>): SectionRequirement[][] {
  if (Array.isArray(astStructure.anyOf)) {
    return astStructure.anyOf.map((variant, index) => {
      const record = expectRecord(variant, `schema.then.ast_structure.anyOf[${index}]`);
      return expectArray(record.items, `schema.then.ast_structure.anyOf[${index}].items`).map(
        extractSectionRequirement,
      );
    });
  }

  if (Array.isArray(astStructure.items)) {
    return [expectArray(astStructure.items, "schema.then.ast_structure.items").map(extractSectionRequirement)];
  }

  throw new Error('Expected "items" or "anyOf" in schema ast_structure rule');
}

function recordOfPropertySchemas(input: unknown): Record<string, PropertySchema> {
  if (!input) {
    return {};
  }

  const record = expectRecord(input, "schema properties");
  const schemas: Record<string, PropertySchema> = {};

  for (const [key, value] of Object.entries(record)) {
    const item = expectRecord(value, `schema property ${key}`);
    schemas[key] = {
      enum: Array.isArray(item.enum) ? (item.enum as JsonValue[]) : undefined,
      items: item.items ? propertySchemaFromUnknown(item.items, `${key}.items`) : undefined,
      maxLength: typeof item.maxLength === "number" ? item.maxLength : undefined,
      minLength: typeof item.minLength === "number" ? item.minLength : undefined,
      pattern: typeof item.pattern === "string" ? item.pattern : undefined,
      type: typeof item.type === "string" ? item.type : undefined,
    };
  }

  return schemas;
}

function propertySchemaFromUnknown(input: unknown, label: string): PropertySchema {
  const item = expectRecord(input, label);
  return {
    enum: Array.isArray(item.enum) ? (item.enum as JsonValue[]) : undefined,
    items: item.items ? propertySchemaFromUnknown(item.items, `${label}.items`) : undefined,
    maxLength: typeof item.maxLength === "number" ? item.maxLength : undefined,
    minLength: typeof item.minLength === "number" ? item.minLength : undefined,
    pattern: typeof item.pattern === "string" ? item.pattern : undefined,
    type: typeof item.type === "string" ? item.type : undefined,
  };
}

function validateFrontmatter(
  frontmatter: ParsedFrontmatter,
  schemaRules: SchemaRules,
  errors: ValidationError[],
): void {
  const metadata = optionalRecord(frontmatter.data.metadata);
  const typeValue = metadata && typeof metadata.type === "string" ? metadata.type : null;
  const typeRule = typeValue ? schemaRules.typeRules[typeValue] : undefined;

  for (const field of schemaRules.baseRequired) {
    if (!(field in frontmatter.data)) {
      errors.push({
        code: "frontmatter.required",
        expected: "present",
        message: `Missing required frontmatter field "${field}"`,
        path: `frontmatter.${field}`,
      });
    }
  }

  for (const field of schemaRules.metadataRequired) {
    if (!metadata || !(field in metadata)) {
      errors.push({
        code: "frontmatter.required",
        expected: "present",
        message: `Missing required frontmatter field "metadata.${field}"`,
        path: `frontmatter.metadata.${field}`,
      });
    }
  }

  for (const [field, schema] of Object.entries(schemaRules.basePropertySchemas)) {
    if (field in frontmatter.data) {
      validateValueAgainstSchema(
        frontmatter.data[field],
        schema,
        `frontmatter.${field}`,
        frontmatter.keyLines[field],
        errors,
      );
    }
  }

  if (metadata) {
    for (const [field, schema] of Object.entries(schemaRules.metadataPropertySchemas)) {
      if (field in metadata) {
        validateValueAgainstSchema(
          metadata[field] as JsonValue,
          schema,
          `frontmatter.metadata.${field}`,
          frontmatter.keyLines[`metadata.${field}`],
          errors,
        );
      }
    }
  }

  if (!typeRule) {
    return;
  }

  for (const field of typeRule.required) {
    if (!(field in frontmatter.data)) {
      errors.push({
        code: "frontmatter.required_for_type",
        expected: "present",
        line: frontmatter.keyLines["metadata.type"],
        message: `Type "${typeValue}" requires frontmatter field "${field}"`,
        path: `frontmatter.${field}`,
      });
    }
  }

  for (const [field, schema] of Object.entries(typeRule.propertySchemas)) {
    if (field in frontmatter.data) {
      validateValueAgainstSchema(
        frontmatter.data[field],
        schema,
        `frontmatter.${field}`,
        frontmatter.keyLines[field],
        errors,
      );
    }
  }
}

function validateValueAgainstSchema(
  value: JsonValue,
  schema: PropertySchema,
  valuePath: string,
  line: number | undefined,
  errors: ValidationError[],
): void {
  if (schema.type && !matchesType(value, schema.type)) {
    errors.push({
      actual: value,
      code: "frontmatter.type_mismatch",
      expected: schema.type,
      line,
      message: `Expected ${valuePath} to be of type "${schema.type}"`,
      path: valuePath,
    });
    return;
  }

  if (schema.enum && !schema.enum.some((entry) => deepEqual(entry, value))) {
    errors.push({
      actual: value,
      code: "frontmatter.enum",
      expected: schema.enum,
      line,
      message: `Expected ${valuePath} to be one of the allowed enum values`,
      path: valuePath,
    });
  }

  if (typeof value === "string") {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push({
        actual: value,
        code: "frontmatter.min_length",
        expected: schema.minLength,
        line,
        message: `Expected ${valuePath} to have length >= ${schema.minLength}`,
        path: valuePath,
      });
    }

    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      errors.push({
        actual: value,
        code: "frontmatter.max_length",
        expected: schema.maxLength,
        line,
        message: `Expected ${valuePath} to have length <= ${schema.maxLength}`,
        path: valuePath,
      });
    }

    if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
      errors.push({
        actual: value,
        code: "frontmatter.pattern",
        expected: schema.pattern,
        line,
        message: `Expected ${valuePath} to match pattern ${schema.pattern}`,
        path: valuePath,
      });
    }
  }

  if (Array.isArray(value) && schema.items) {
    value.forEach((item, index) => {
      validateValueAgainstSchema(item, schema.items as PropertySchema, `${valuePath}[${index}]`, line, errors);
    });
  }
}

function parseSections(markdownBody: string, bodyLineOffset: number): ParsedAstStructure {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdownBody) as Root;
  const sections: ParsedSection[] = [];
  let currentSection: ParsedSection | null = null;
  let preambleType: string | undefined;
  let preambleLine: number | undefined;

  for (const node of tree.children) {
    if (isHeading(node) && node.depth === 2) {
      currentSection = {
        headingLine: toActualLine(node, bodyLineOffset),
        headingText: phrasingToText(node),
        level: node.depth,
      };
      sections.push(currentSection);
      continue;
    }

    if (!currentSection) {
      if (!preambleType) {
        preambleType = classifyNode(node);
        preambleLine = toActualLine(node, bodyLineOffset);
      }
      continue;
    }

    if (!currentSection.firstBlockType) {
      currentSection.firstBlockType = classifyNode(node);
      currentSection.firstBlockLine = toActualLine(node, bodyLineOffset);
    }
  }

  return {
    preambleLine,
    preambleType,
    sections,
  };
}

function validateAstStructure(
  astStructure: ParsedAstStructure,
  rule: TypeRule,
  errors: ValidationError[],
): void {
  if (rule.requirePreamble && !astStructure.preambleType) {
    errors.push({
      code: "ast_structure.preamble_missing",
      expected: rule.preambleType ?? "content",
      message: "Expected content before the first level-2 section heading",
      path: "ast_structure.preamble",
    });
  }

  if (!rule.allowPreamble && astStructure.preambleType) {
    errors.push({
      actual: astStructure.preambleType,
      code: "ast_structure.preamble_unexpected",
      line: astStructure.preambleLine,
      message: "Unexpected content before the first level-2 section heading",
      path: "ast_structure.preamble",
    });
  }

  if (
    rule.preambleType &&
    astStructure.preambleType &&
    astStructure.preambleType !== rule.preambleType
  ) {
    errors.push({
      actual: astStructure.preambleType,
      code: "ast_structure.preamble_type",
      expected: rule.preambleType,
      line: astStructure.preambleLine,
      message: `Expected preamble to start with a ${rule.preambleType} block`,
      path: "ast_structure.preamble",
    });
  }

  const variantErrors = rule.sectionVariants.map((variant) =>
    collectSectionErrors(astStructure.sections, variant, rule.allowAdditionalSections),
  );
  const matchingVariant = variantErrors.find((variant) => variant.length === 0);

  if (matchingVariant) {
    return;
  }

  const bestVariant =
    variantErrors.reduce((best, current) => (current.length < best.length ? current : best), variantErrors[0]) ??
    [];
  errors.push(...bestVariant);
}

function collectSectionErrors(
  sections: ParsedSection[],
  expected: SectionRequirement[],
  allowAdditionalSections: boolean,
): ValidationError[] {
  const errors: ValidationError[] = [];
  let actualIndex = 0;

  for (let index = 0; index < expected.length; index += 1) {
    const expectedSection = expected[index];
    let matchedIndex = -1;

    if (allowAdditionalSections) {
      for (let searchIndex = actualIndex; searchIndex < sections.length; searchIndex += 1) {
        if (sections[searchIndex].headingText === expectedSection.exactText) {
          matchedIndex = searchIndex;
          break;
        }
      }
    } else {
      matchedIndex = index < sections.length ? index : -1;
    }

    const actual = matchedIndex === -1 ? undefined : sections[matchedIndex];

    if (!actual) {
      errors.push({
        code: "ast_structure.missing_section",
        expected: expectedSection.exactText,
        message: allowAdditionalSections
          ? `Missing required section "${expectedSection.exactText}" in the expected order`
          : `Missing section "${expectedSection.exactText}" at position ${index + 1}`,
        path: `ast_structure[${index}]`,
      });
      continue;
    }

    actualIndex = matchedIndex + 1;

    if (actual.headingText !== expectedSection.exactText) {
      errors.push({
        actual: actual.headingText,
        code: "ast_structure.section_title",
        expected: expectedSection.exactText,
        line: actual.headingLine,
        message: `Expected section ${index + 1} to be titled "${expectedSection.exactText}"`,
        path: `ast_structure[${index}].exact_text`,
      });
    }

    if (actual.level !== 2) {
      errors.push({
        actual: actual.level,
        code: "ast_structure.heading_level",
        expected: 2,
        line: actual.headingLine,
        message: `Expected "${actual.headingText}" to use a level-2 heading`,
        path: `ast_structure[${index}].heading_level`,
      });
    }

    if (!expectedSection.followedBy) {
      continue;
    }

    if (!actual.firstBlockType) {
      errors.push({
        code: "ast_structure.empty_section",
        expected: expectedSection.followedBy,
        line: actual.headingLine,
        message: `Section "${actual.headingText}" is empty`,
        path: `ast_structure[${index}].followed_by`,
      });
      continue;
    }

    if (actual.firstBlockType !== expectedSection.followedBy) {
      errors.push({
        actual: actual.firstBlockType,
        code: "ast_structure.followed_by",
        expected: expectedSection.followedBy,
        line: actual.firstBlockLine,
        message: `Expected "${actual.headingText}" to be followed by a ${expectedSection.followedBy} block`,
        path: `ast_structure[${index}].followed_by`,
      });
    }
  }

  if (!allowAdditionalSections && sections.length > expected.length) {
    for (let index = expected.length; index < sections.length; index += 1) {
      errors.push({
        actual: sections[index].headingText,
        code: "ast_structure.unexpected_section",
        line: sections[index].headingLine,
        message: `Unexpected extra top-level section "${sections[index].headingText}"`,
        path: `ast_structure[${index}]`,
      });
    }
  }

  return errors;
}

function classifyNode(node: RootContent): string {
  switch (node.type) {
    case "code":
      return "code_block";
    case "list":
      return "list";
    case "paragraph":
      return "paragraph";
    case "table":
      return "table";
    default:
      return node.type;
  }
}

function phrasingToText(node: Heading | PhrasingContent): string {
  if ("value" in node && typeof node.value === "string") {
    return node.value;
  }

  if (node.type === "break") {
    return " ";
  }

  if ("alt" in node && typeof node.alt === "string") {
    return node.alt;
  }

  if ("children" in node && Array.isArray(node.children)) {
    return node.children.map((child) => phrasingToText(child as PhrasingContent)).join("");
  }

  return "";
}

function toActualLine(node: { position?: { start?: { line?: number } } }, offset: number): number {
  return (node.position?.start?.line ?? 1) + offset;
}

function isHeading(node: RootContent): node is Heading {
  return node.type === "heading";
}

function matchesType(value: JsonValue, expectedType: string): boolean {
  switch (expectedType) {
    case "array":
      return Array.isArray(value);
    case "boolean":
      return typeof value === "boolean";
    case "number":
      return typeof value === "number";
    case "object":
      return isRecord(value);
    case "string":
      return typeof value === "string";
    default:
      return true;
  }
}

function deepEqual(left: JsonValue, right: JsonValue): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function annotateError(error: unknown, prefix: string): Error {
  const message = error instanceof Error ? error.message : String(error);
  const annotated = new Error(`${prefix}: ${message}`);
  const line = extractYamlErrorLine(error);
  if (line !== undefined) {
    (annotated as Error & { line?: number }).line = line;
  }
  return annotated;
}

function toValidationError(
  error: unknown,
  code: string,
  errorPath: string,
  fallbackMessage: string,
): ValidationError {
  const line =
    error && typeof error === "object" && "line" in error && typeof error.line === "number"
      ? error.line
      : undefined;

  return {
    code,
    line,
    message: error instanceof Error ? error.message : fallbackMessage,
    path: errorPath,
  };
}

function extractYamlErrorLine(error: unknown): number | undefined {
  if (!error || typeof error !== "object" || !("linePos" in error)) {
    return undefined;
  }

  const linePos = (error as { linePos?: unknown }).linePos;
  if (Array.isArray(linePos) && typeof linePos[0]?.line === "number") {
    return linePos[0].line;
  }

  if (
    linePos &&
    typeof linePos === "object" &&
    "start" in linePos &&
    typeof (linePos as { start?: { line?: number } }).start?.line === "number"
  ) {
    return (linePos as { start: { line: number } }).start.line;
  }

  return undefined;
}

function expectRecord(value: unknown, label: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error(`Expected ${label} to be an object`);
  }
  return value;
}

function optionalRecord(value: unknown): Record<string, unknown> | undefined {
  return isRecord(value) ? value : undefined;
}

function getStringAtPath(value: Record<string, JsonValue>, path: string[]): string | null {
  let current: unknown = value;

  for (const segment of path) {
    if (!isRecord(current) || !(segment in current)) {
      return null;
    }
    current = current[segment];
  }

  return typeof current === "string" ? current : null;
}

function expectArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`Expected ${label} to be an array`);
  }
  return value;
}

function expectString(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error("Expected schema value to be a string");
  }
  return value;
}

function toStringArray(value: unknown): string[] {
  if (!value) {
    return [];
  }
  return expectArray(value, "string array").map(expectString);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function leadingIndent(line: string): number {
  const match = line.match(/^ */);
  return match ? match[0].length : 0;
}

main();
