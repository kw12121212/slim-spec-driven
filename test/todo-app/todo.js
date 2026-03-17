#!/usr/bin/env node
// Minimal todo CLI — exists so spec-driven-apply has real code to modify
import fs from "fs";

const FILE = "todos.json";

function load() {
  return fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, "utf-8")) : [];
}
function save(todos) {
  fs.writeFileSync(FILE, JSON.stringify(todos, null, 2));
}

const [, , cmd, ...args] = process.argv;
const todos = load();

if (cmd === "add") {
  todos.push({ text: args.join(" "), done: false });
  save(todos);
  console.log("Added.");
} else if (cmd === "list") {
  if (todos.length === 0) { console.log("No todos."); process.exit(0); }
  todos.forEach((t, i) => console.log(`${i + 1}. [${t.done ? "x" : " "}] ${t.text}`));
} else if (cmd === "done") {
  const i = parseInt(args[0]) - 1;
  if (todos[i]) { todos[i].done = true; save(todos); console.log("Done."); }
  else console.error("Not found.");
} else {
  console.log("Usage: node todo.js add <text> | list | done <n>");
}
