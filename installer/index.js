#!/usr/bin/env node
// DataAgile CLI installer — installs DataAgile plugins/MCP server in Claude Code, Codex CLI,
// or Gemini CLI. Falls back to manual instructions on failure.
//
// Usage:
//   node installer/index.js [--dry-run]
//   npx github:tbc-servicos/dataagile-agent-kit [--dry-run]

import { execSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import readline from 'readline';

const MCP_SERVER_NAME = 'dataagile';
const MCP_SERVER_URL = 'https://mcp.totvstbc.com.br/mcp';
const MARKETPLACE_URL = 'https://github.com/tbc-servicos/dataagile-agent-kit.git';
const PLUGINS = ['protheus', 'fluig', 'playwright', 'po-ui'];
const MARKETPLACE_ALIAS = 'claude-skills-tbc';
const DRY_RUN = process.argv.includes('--dry-run');

// ---------------------------------------------------------------------------
// CLI detection
// ---------------------------------------------------------------------------

function which(bin) {
  try {
    const result = execSync(`which ${bin}`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    return result.trim();
  } catch {
    return null;
  }
}

function detectCLIs() {
  return {
    claude: which('claude'),
    gemini: which('gemini'),
    codex:  which('codex'),
  };
}

// ---------------------------------------------------------------------------
// Gemini CLI config: ~/.gemini/settings.json
// Ref: Gemini CLI source — Storage.getGlobalSettingsPath() = ~/.gemini/settings.json
// Schema: { mcpServers: { <name>: { url, type, headers?, timeout?, trust? } } }
// ---------------------------------------------------------------------------

function geminiConfigPath() {
  return path.join(os.homedir(), '.gemini', 'settings.json');
}

function readGeminiSettings() {
  const p = geminiConfigPath();
  if (!fs.existsSync(p)) return {};
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch {
    return null;
  }
}

function installGemini(apiKey) {
  const configPath = geminiConfigPath();
  const settings = readGeminiSettings();

  if (settings === null) {
    return { ok: false, reason: `Could not parse ${configPath}. Edit it manually (see manual instructions below).` };
  }

  const entry = {
    url: MCP_SERVER_URL,
    type: 'http',
    ...(apiKey ? { headers: { 'x-api-key': apiKey } } : {}),
    description: 'DataAgile — Protheus/ADVPL knowledge base and skills',
    trust: false,
  };

  if (DRY_RUN) {
    console.log(`\n[dry-run] Would write to ${configPath}:`);
    const preview = { ...settings, mcpServers: { ...(settings.mcpServers || {}), [MCP_SERVER_NAME]: entry } };
    console.log(JSON.stringify(preview, null, 2));
    return { ok: true, dry: true };
  }

  const configDir = path.dirname(configPath);
  if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });

  const updated = { ...settings, mcpServers: { ...(settings.mcpServers || {}), [MCP_SERVER_NAME]: entry } };
  fs.writeFileSync(configPath, JSON.stringify(updated, null, 2) + '\n', 'utf-8');
  return { ok: true, path: configPath };
}

// ---------------------------------------------------------------------------
// Codex CLI config: ~/.codex/config.yaml
// Ref: Codex CLI docs — YAML file, mcpServers section
// Schema: mcpServers:\n  <name>:\n    transport: http\n    url: <url>\n    headers: { x-api-key: <key> }
// ---------------------------------------------------------------------------

function codexConfigPath() {
  return path.join(os.homedir(), '.codex', 'config.yaml');
}

function installCodex(apiKey) {
  const configPath = codexConfigPath();

  // Build the YAML snippet to inject
  const headerLine = apiKey ? `\n      x-api-key: "${apiKey}"` : '';
  const serverBlock = [
    `  ${MCP_SERVER_NAME}:`,
    `    transport: http`,
    `    url: "${MCP_SERVER_URL}"`,
    ...(apiKey ? [`    headers:`, `      x-api-key: "${apiKey}"`] : []),
  ].join('\n');

  if (DRY_RUN) {
    console.log(`\n[dry-run] Would add to ${configPath} (mcpServers section):`);
    console.log(serverBlock);
    return { ok: true, dry: true };
  }

  let yaml = '';
  if (fs.existsSync(configPath)) {
    yaml = fs.readFileSync(configPath, 'utf-8');
  }

  if (yaml.includes(`  ${MCP_SERVER_NAME}:`)) {
    return { ok: true, skipped: true, reason: `Server "${MCP_SERVER_NAME}" already configured in ${configPath}` };
  }

  if (yaml.includes('mcpServers:')) {
    // Insert after the mcpServers: line
    yaml = yaml.replace('mcpServers:', `mcpServers:\n${serverBlock}`);
  } else {
    yaml += `\nmcpServers:\n${serverBlock}\n`;
  }

  const configDir = path.dirname(configPath);
  if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });

  fs.writeFileSync(configPath, yaml, 'utf-8');
  return { ok: true, path: configPath };
}

// ---------------------------------------------------------------------------
// Claude Code — install via native plugin system
// ---------------------------------------------------------------------------

function claudeApiKeyConfigPath() {
  return path.join(os.homedir(), '.config', 'dataagile', 'dev-config.json');
}

function saveClaudeApiKey(apiKey) {
  const configPath = claudeApiKeyConfigPath();
  const configDir = path.dirname(configPath);
  if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });
  const existing = fs.existsSync(configPath)
    ? (() => { try { return JSON.parse(fs.readFileSync(configPath, 'utf-8')); } catch { return {}; } })()
    : {};
  fs.writeFileSync(configPath, JSON.stringify({ ...existing, api_key: apiKey }, null, 2) + '\n', 'utf-8');
}

function runCommand(cmd) {
  try {
    execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err.stderr || err.message || '').trim() };
  }
}

function installClaude(apiKey) {
  if (DRY_RUN) {
    console.log(`  [dry-run] Would run: claude plugin marketplace add ${MARKETPLACE_URL}`);
    PLUGINS.forEach(p => console.log(`  [dry-run] Would run: claude plugin install ${p}@${MARKETPLACE_ALIAS}`));
    if (apiKey) console.log(`  [dry-run] Would write API key to ${claudeApiKeyConfigPath()}`);
    return { ok: true, dry: true };
  }

  const results = [];

  // Step 1 — configure API key
  if (apiKey) {
    try {
      saveClaudeApiKey(apiKey);
      console.log(`  ✓ API key saved to ${claudeApiKeyConfigPath()}`);
    } catch (err) {
      console.log(`  ⚠ Could not save API key: ${err.message}`);
      console.log(`    Set manually: export DATAAGILE_API_KEY=${apiKey}`);
    }
  }

  // Step 2 — add marketplace
  console.log(`  → Adding marketplace...`);
  const mktResult = runCommand(`claude plugin marketplace add ${MARKETPLACE_URL}`);
  if (!mktResult.ok) {
    console.log(`  ✗ Failed to add marketplace: ${mktResult.error}`);
    printClaudeManualInstructions(apiKey);
    return { ok: false, reason: 'marketplace add failed' };
  }
  console.log(`  ✓ Marketplace added`);

  // Step 3 — install each plugin
  for (const plugin of PLUGINS) {
    console.log(`  → Installing ${plugin}...`);
    const r = runCommand(`claude plugin install ${plugin}@${MARKETPLACE_ALIAS}`);
    if (r.ok) {
      console.log(`  ✓ ${plugin} installed`);
      results.push({ plugin, ok: true });
    } else {
      console.log(`  ✗ ${plugin} failed: ${r.error}`);
      console.log(`    Retry manually: claude plugin install ${plugin}@${MARKETPLACE_ALIAS}`);
      results.push({ plugin, ok: false, error: r.error });
    }
  }

  const allOk = results.every(r => r.ok);
  return { ok: allOk, results };
}

function printClaudeManualInstructions(apiKey) {
  const keyDisplay = apiKey ?? 'SUA_API_KEY';
  console.log(`
  ── Fallback — execute manualmente: ─────────────────────────────
  claude plugin marketplace add ${MARKETPLACE_URL}
${PLUGINS.map(p => `  claude plugin install ${p}@${MARKETPLACE_ALIAS}`).join('\n')}

  Configurar API key:
  mkdir -p ~/.config/dataagile
  echo '{"api_key":"${keyDisplay}"}' > ~/.config/dataagile/dev-config.json
  `);
}

// ---------------------------------------------------------------------------
// Manual instructions fallback (all CLIs)
// ---------------------------------------------------------------------------

function printManualInstructions(apiKey) {
  const keyDisplay = apiKey ?? 'SUA_API_KEY';
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║           DataAgile — Instruções de instalação manual        ║
╚══════════════════════════════════════════════════════════════╝

── Claude Code ──────────────────────────────────────────────────
  claude plugin marketplace add ${MARKETPLACE_URL}
${PLUGINS.map(p => `  claude plugin install ${p}@${MARKETPLACE_ALIAS}`).join('\n')}

  Configurar API key:
  mkdir -p ~/.config/dataagile
  echo '{"api_key":"${keyDisplay}"}' > ~/.config/dataagile/dev-config.json

── Gemini CLI ───────────────────────────────────────────────────
  gemini mcp add ${MCP_SERVER_NAME} ${MCP_SERVER_URL} \\
    --transport http \\
    --header "x-api-key: ${keyDisplay}" \\
    --scope user

  ou edite ~/.gemini/settings.json → mcpServers:
  {
    "${MCP_SERVER_NAME}": {
      "url": "${MCP_SERVER_URL}",
      "type": "http",
      "headers": { "x-api-key": "${keyDisplay}" }
    }
  }

── Codex CLI ────────────────────────────────────────────────────
  Edite ~/.codex/config.yaml → mcpServers:

  mcpServers:
    ${MCP_SERVER_NAME}:
      transport: http
      url: "${MCP_SERVER_URL}"
      headers:
        x-api-key: "${keyDisplay}"

── Usando get_skill (Codex / Gemini) ───────────────────────────
  get_skill({ name: "protheus:specialist" })
  get_skill({ name: "fluig:brainstorm" })

  Cole o conteúdo retornado no system prompt para ativar o skill.

── Obter API key ────────────────────────────────────────────────
  https://dataagile-agent-kit.dataagile.com.br
  Contato: dev@dataagile.com.br
`);
}

// ---------------------------------------------------------------------------
// Prompt for API key
// ---------------------------------------------------------------------------

async function promptApiKey() {
  if (!process.stdin.isTTY) return null;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question('\nEnter your DataAgile API key (or press Enter to skip): ', (answer) => {
      rl.close();
      resolve(answer.trim() || null);
    });
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('\n🔍 DataAgile MCP Installer v1.0.0');
  console.log('   MCP server: ' + MCP_SERVER_URL);
  if (DRY_RUN) console.log('   [--dry-run mode: no files will be modified]\n');

  const detected = detectCLIs();
  const found = Object.entries(detected).filter(([, p]) => p);
  const notFound = Object.entries(detected).filter(([, p]) => !p);

  if (found.length > 0) {
    console.log('Detected CLIs:');
    found.forEach(([name, p]) => console.log(`  ✓ ${name}: ${p}`));
  }
  if (notFound.length > 0) {
    console.log('Not found:');
    notFound.forEach(([name]) => console.log(`  ✗ ${name}`));
  }

  if (found.length === 0) {
    console.log('\nNo supported CLI detected. Printing manual instructions.');
    printManualInstructions(null);
    process.exit(0);
  }

  let apiKey = null;
  if (!DRY_RUN) {
    apiKey = await promptApiKey();
  }

  const results = [];

  if (detected.claude) {
    console.log('\n── Claude Code ──────────────────────────────────────────────────');
    const r = installClaude(apiKey);
    results.push({ cli: 'claude', ...r });
  }

  if (detected.gemini) {
    console.log('\n── Gemini CLI ───────────────────────────────────────────────────');
    const r = installGemini(apiKey);
    if (r.ok && !r.dry) {
      if (r.skipped) {
        console.log(`  ℹ Already configured. Path: ${r.path ?? geminiConfigPath()}`);
      } else {
        console.log(`  ✓ MCP server registered in ${r.path}`);
      }
    } else if (r.ok && r.dry) {
      // dry-run output already printed inside installGemini
    } else {
      console.log(`  ✗ Failed: ${r.reason}`);
      console.log('  Fallback:');
      console.log(`    gemini mcp add ${MCP_SERVER_NAME} ${MCP_SERVER_URL} --transport http --scope user`);
    }
    results.push({ cli: 'gemini', ...r });
  }

  if (detected.codex) {
    console.log('\n── Codex CLI ────────────────────────────────────────────────────');
    const r = installCodex(apiKey);
    if (r.ok && !r.dry) {
      if (r.skipped) {
        console.log(`  ℹ Already configured. ${r.reason}`);
      } else {
        console.log(`  ✓ MCP server added to ${r.path}`);
      }
    } else if (r.ok && r.dry) {
      // dry-run output already printed inside installCodex
    } else {
      console.log(`  ✗ Failed: ${r.reason}`);
    }
    results.push({ cli: 'codex', ...r });
  }

  console.log('\n── Próximos passos ──────────────────────────────────────────────');
  if (!apiKey && !DRY_RUN) {
    console.log('  Obter API key: https://dataagile-agent-kit.dataagile.com.br');
    console.log('  Contato: dev@dataagile.com.br');
  }
  if (detected.claude) {
    console.log('  Claude Code: abra seu projeto e use /protheus:brainstorm ou /fluig:widget');
  }
  if (detected.gemini || detected.codex) {
    console.log('  Codex / Gemini — carregar uma skill:');
    console.log('    get_skill({ name: "protheus:specialist" })');
    console.log('    get_skill({ name: "fluig:brainstorm" })');
    console.log('  Cole o conteúdo retornado no system prompt.');
  }
  console.log('  Guia completo: https://github.com/tbc-servicos/dataagile-agent-kit/blob/main/INSTALL.md\n');

  if (DRY_RUN) {
    console.log('[dry-run] No files were modified.\n');
  }
}

main().catch((err) => {
  console.error('Installer error:', err.message);
  process.exit(1);
});
