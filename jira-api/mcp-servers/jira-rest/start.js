#!/usr/bin/env node
/**
 * Launcher cross-platform para o MCP server Python do Jira REST API.
 * Detecta Python, cria venv, instala deps e spawna server.py.
 *
 * Funciona em Windows, Linux e macOS sem configuração manual.
 */
import { execSync, spawn } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VENV_DIR = path.join(__dirname, '.venv');
const REQ_FILE = path.join(__dirname, 'requirements.txt');
const SERVER_FILE = path.join(__dirname, 'server.py');

function log(msg) {
  process.stderr.write(`[jira-rest-launcher] ${msg}\n`);
}

function findPython() {
  for (const cmd of ['python3', 'python', 'py']) {
    try {
      const ver = execSync(`${cmd} --version`, {
        encoding: 'utf-8',
        timeout: 5000,
        stdio: ['pipe', 'pipe', 'pipe'],
      }).trim();
      if (ver.includes('3.')) {
        log(`Python encontrado: ${cmd} (${ver})`);
        return cmd;
      }
    } catch { /* try next */ }
  }
  return null;
}

function venvPython() {
  const winPath = path.join(VENV_DIR, 'Scripts', 'python.exe');
  const unixPath = path.join(VENV_DIR, 'bin', 'python');
  return existsSync(winPath) ? winPath : unixPath;
}

function ensureVenv(pythonCmd) {
  if (!existsSync(venvPython())) {
    log(`Criando virtualenv em ${VENV_DIR}...`);
    execSync(`"${pythonCmd}" -m venv "${VENV_DIR}"`, {
      stdio: 'pipe',
      timeout: 30000,
    });
    log('Virtualenv criado');
  }
}

function installDeps() {
  const py = venvPython();
  log('Verificando dependências...');
  execSync(`"${py}" -m pip install -q -r "${REQ_FILE}"`, {
    stdio: 'pipe',
    timeout: 120000,
  });
  log('Dependências OK');
}

// --- Main ---

const pythonCmd = findPython();
if (!pythonCmd) {
  log('ERRO: Python 3 não encontrado. Instale Python 3.9+ e tente novamente.');
  process.exit(1);
}

try {
  ensureVenv(pythonCmd);
  installDeps();
} catch (err) {
  log(`ERRO no setup: ${err.message}`);
  process.exit(1);
}

const py = venvPython();
log(`Iniciando server.py com ${py}`);

const child = spawn(py, [SERVER_FILE], {
  stdio: ['pipe', 'pipe', 'inherit'],
  env: { ...process.env },
});

process.stdin.pipe(child.stdin);
child.stdout.pipe(process.stdout);

child.on('exit', (code) => process.exit(code ?? 1));
process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
