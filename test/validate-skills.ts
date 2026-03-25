#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
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
  typeRules: Record<string, TypeRule>;
};

type SectionRequirement = {
  exactText: string;
  followedBy?: string;
};

type TypeRule = {
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
    printAndExit(
      {
        detected_type: null,
        errors: [
          {
            code: "cli.usage",
            message: "Usage: node dist/test/validate-skills.js <path-to-markdown>",
            path: "$",
          },
        ],
        file: "",
        schema: schemaPath,
        section_titles: [],
        valid: false,
      },
      1,
    );
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

  const detectedType =
    frontmatter && typeof frontmatter.data.type === "string" ? frontmatter.data.type : null;

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
      line: frontmatter?.keyLines.type,
      message: `Unsupported type "${detectedType}"`,
      path: "frontmatter.type",
    });
  }

  printAndExit(
    baseResult(targetPath, schemaPath, errors, detectedType, sectionTitles),
    errors.length === 0 ? 0 : 1,
  );
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
  const typeSchema = expectRecord(frontmatterProperties.type, "schema frontmatter type");
  const allowedTypes = expectArray(typeSchema.enum, "schema frontmatter type enum").map(expectString);
  const allOf = expectArray(schema.allOf, "schema.allOf");

  const typeRules: Record<string, TypeRule> = {};
  for (const rule of allOf) {
    const ruleRecord = expectRecord(rule, "schema.allOf[]");
    const typeName = expectString(
      expectRecord(
        expectRecord(
          expectRecord(
            expectRecord(expectRecord(ruleRecord.if, "schema.if").properties, "schema.if.properties")
              .frontmatter,
            "schema.if.frontmatter",
          ).properties,
          "schema.if.frontmatter.properties",
        ).type,
        "schema.if.frontmatter.properties.type",
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

  for (const entry of split.lines) {
    const trimmed = entry.text.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    if (leadingIndent(entry.text) !== 0) {
      continue;
    }

    const match = trimmed.match(/^([A-Za-z0-9_-]+)\s*:/);
    if (match) {
      keyLines[match[1]] = entry.line;
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
  const typeValue = typeof frontmatter.data.type === "string" ? frontmatter.data.type : null;
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

  if (!typeRule) {
    return;
  }

  for (const field of typeRule.required) {
    if (!(field in frontmatter.data)) {
      errors.push({
        code: "frontmatter.required_for_type",
        expected: "present",
        line: frontmatter.keyLines.type,
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
    collectSectionErrors(astStructure.sections, variant),
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
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (let index = 0; index < expected.length; index += 1) {
    const actual = sections[index];
    const expectedSection = expected[index];

    if (!actual) {
      errors.push({
        code: "ast_structure.missing_section",
        expected: expectedSection.exactText,
        message: `Missing section "${expectedSection.exactText}" at position ${index + 1}`,
        path: `ast_structure[${index}]`,
      });
      continue;
    }

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

  if (sections.length > expected.length) {
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
