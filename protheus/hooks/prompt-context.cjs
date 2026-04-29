#!/usr/bin/env node
// UserPromptSubmit hook: detecta workspace ADVPL/TLPP e injeta sugestao de skill.
// Cross-platform: roda igual em Mac, Linux e Windows (CMD/PowerShell/bash).
// Sem dependencias externas — apenas fs e path do Node built-in.

const fs = require('fs');
const path = require('path');

const ADVPL_EXTS = new Set(['.prw', '.tlpp', '.prx', '.ch']);
const MAX_DEPTH = 2;
const MAX_PARENT_LEVELS = 3;
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'target', '.venv', 'venv']);
const PROJECT_ROOT_MARKERS = new Set(['.git', '.hg', '.svn', 'package.json', 'pom.xml']);

function readDirSafe(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return null;
  }
}

function hasAdvplRecursive(dir, depth) {
  if (depth > MAX_DEPTH) return false;
  const entries = readDirSafe(dir);
  if (!entries) return false;
  for (const entry of entries) {
    if (entry.isFile()) {
      if (ADVPL_EXTS.has(path.extname(entry.name).toLowerCase())) return true;
      continue;
    }
    if (entry.isDirectory() && !entry.name.startsWith('.') && !SKIP_DIRS.has(entry.name)) {
      if (hasAdvplRecursive(path.join(dir, entry.name), depth + 1)) return true;
    }
  }
  return false;
}

function hasAdvplShallow(dir) {
  const entries = readDirSafe(dir);
  if (!entries) return false;
  for (const entry of entries) {
    if (entry.isFile() && ADVPL_EXTS.has(path.extname(entry.name).toLowerCase())) {
      return true;
    }
  }
  return false;
}

function isProjectRoot(dir) {
  const entries = readDirSafe(dir);
  if (!entries) return false;
  return entries.some(e => PROJECT_ROOT_MARKERS.has(e.name));
}

function detect() {
  let cwd = process.cwd();

  if (hasAdvplRecursive(cwd, 0)) return true;

  for (let i = 0; i < MAX_PARENT_LEVELS; i++) {
    if (isProjectRoot(cwd)) return false;
    const parent = path.dirname(cwd);
    if (parent === cwd) return false;
    cwd = parent;
    if (hasAdvplShallow(cwd)) return true;
  }
  return false;
}

if (!detect()) {
  process.exit(0);
}

const additionalContext =
  'Workspace contem arquivos ADVPL/TLPP. ' +
  'Para codigo com padroes TOTVS (notacao hungara, BeginSQL, ExecBlock, MVC), ' +
  'prefira invocar a skill apropriada antes de responder: ' +
  '/protheus:writer (codigo), /protheus:diagnose (erros), ' +
  '/protheus:specialist (referencia TOTVS), /protheus:sql (SQL embarcado), ' +
  '/protheus:reviewer (revisao), /protheus:brainstorm (planejamento).';

process.stdout.write(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: 'UserPromptSubmit',
    additionalContext
  }
}));
process.exit(0);
