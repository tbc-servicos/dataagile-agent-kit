#!/usr/bin/env node
// Cross-platform startup script (replaces start.sh for Windows compatibility)
import { execSync, spawn } from 'child_process';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (!existsSync(path.join(__dirname, 'node_modules'))) {
  process.stderr.write('[start] Installing dependencies...\n');
  execSync('npm install --omit=dev --silent', { cwd: __dirname, stdio: 'inherit' });
  process.stderr.write('[start] Dependencies installed.\n');
}

// Spawn index.js as subprocess so process.argv[1] is the absolute path,
// fixing the import.meta.url === 'file://' + process.argv[1] guard on Windows.
const child = spawn(process.execPath, [path.join(__dirname, 'index.js')], {
  stdio: 'inherit',
  cwd: __dirname
});

child.on('exit', (code) => process.exit(code ?? 0));
