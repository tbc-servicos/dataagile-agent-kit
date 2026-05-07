#!/usr/bin/env node
'use strict';

/**
 * setup.js — Baixa a base de conhecimento externa do GitHub Releases.
 *
 * Uso:
 *   node setup.js           — baixa se DB não existe
 *   node setup.js --force   — força re-download mesmo se DB existe
 *
 * Requer: gh CLI autenticado (gh auth login)
 */

const { execSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const DB_PATH = path.join(os.homedir(), '.local', 'share', 'tbc', 'local-knowledge-external.db');
const DB_ASSET = 'local-knowledge-external.db';
const SHA_ASSET = 'local-knowledge-external.db.sha256';
const REPO = 'tbc-servicos/tbc-knowledge-plugins';

const isForce = process.argv.includes('--force');

function checkGhCli() {
  try {
    execSync('gh --version', { stdio: 'ignore' });
  } catch {
    throw new Error('gh CLI não encontrado. Instale: https://cli.github.com/');
  }
  try {
    execSync('gh auth status', { stdio: 'ignore' });
  } catch {
    throw new Error('gh CLI não autenticado. Execute: gh auth login');
  }
}

function downloadRelease(destDir) {
  console.log(`[setup] Baixando ${DB_ASSET} do GitHub Releases (${REPO})...`);
  try {
    execSync(
      `gh release download --repo ${REPO} --pattern "${DB_ASSET}" --pattern "${SHA_ASSET}" --dir "${destDir}" --clobber`,
      { stdio: 'inherit' }
    );
  } catch (e) {
    throw new Error(`Falha ao baixar release: ${e.message}\nVerifique se há releases publicados em https://github.com/${REPO}/releases`);
  }
}

function validateHash(dbPath, shaPath) {
  if (!fs.existsSync(shaPath)) {
    console.warn('[setup] Arquivo .sha256 não encontrado — pulando validação de integridade');
    return;
  }
  const expected = fs.readFileSync(shaPath, 'utf-8').trim().split(/\s+/)[0];
  const actual = crypto.createHash('sha256').update(fs.readFileSync(dbPath)).digest('hex');
  if (expected !== actual) {
    fs.unlinkSync(dbPath);
    throw new Error(`Hash SHA256 inválido!\n  Esperado: ${expected}\n  Obtido:   ${actual}\nDB removido. Re-execute setup.js.`);
  }
  console.log(`[setup] SHA256 validado: ${actual.slice(0, 16)}...`);
}

async function main() {
  console.log('=== local-knowledge-external setup ===');

  if (!isForce && fs.existsSync(DB_PATH)) {
    const stat = fs.statSync(DB_PATH);
    const sizeMB = (stat.size / 1024 / 1024).toFixed(1);
    console.log(`[setup] DB já existe (${sizeMB}MB): ${DB_PATH}`);
    console.log('[setup] Use --force para re-baixar.');
    return;
  }

  checkGhCli();

  const dbDir = path.dirname(DB_PATH);
  fs.mkdirSync(dbDir, { recursive: true, mode: 0o700 });

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tbc-kb-'));
  try {
    downloadRelease(tmpDir);

    const tmpDb = path.join(tmpDir, DB_ASSET);
    const tmpSha = path.join(tmpDir, SHA_ASSET);

    if (!fs.existsSync(tmpDb)) {
      throw new Error(`Asset "${DB_ASSET}" não encontrado no release mais recente`);
    }

    validateHash(tmpDb, tmpSha);

    fs.renameSync(tmpDb, DB_PATH);
    fs.chmodSync(DB_PATH, 0o600);

    const stat = fs.statSync(DB_PATH);
    const sizeMB = (stat.size / 1024 / 1024).toFixed(1);
    console.log(`\n✅ Setup concluído: ${DB_PATH} (${sizeMB}MB, chmod 600)`);
  } finally {
    // Limpar tmpDir
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}

main().catch((e) => {
  console.error(`[setup] Erro: ${e.message}`);
  process.exit(1);
});
