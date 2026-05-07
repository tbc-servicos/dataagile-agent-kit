#!/usr/bin/env node
'use strict';

/**
 * proxy.js — Output filter proxy para o MCP server local-knowledge-external.
 *
 * Processo separado que wrapa index.js via stdio. Intercepta todas as respostas
 * de tool calls e aplica blocklist de padrões sensíveis antes de entregar ao Claude.
 *
 * Claude aponta para este proxy no .mcp.json — nunca para index.js diretamente.
 */

const { spawn } = require('child_process');
const path = require('path');
const readline = require('readline');

const REDACT_TOKEN = '[informação removida]';
const MAX_REDACTS_WARNING = 3;

// Padrões que nunca devem vazar para usuários externos.
// Reset regex state antes de cada uso (stateful global flags).
const BLOCKLIST = [
  { label: 'email',        src: String.raw`[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}` },
  { label: 'func_totvs',   src: String.raw`\bMAT[A-Z]\d{3,}` },
  { label: 'func_totvs',   src: String.raw`\bFAT[A-Z]\d{3,}` },
  { label: 'func_totvs',   src: String.raw`\bCONT[A-Z]\d{3,}` },
  { label: 'func_totvs',   src: String.raw`\bPLS[A-Z]\d{3,}` },
  { label: 'func_totvs',   src: String.raw`\bRHU[A-Z][A-Z0-9]{2,}` },
  { label: 'ticket_ref',   src: String.raw`ticket\s*(?:#\s*)?\d{3,}` },
  { label: 'ticket_ref',   src: String.raw`chamado\s*(?:#\s*)?\d{3,}` },
  { label: 'ticket_ref',   src: String.raw`\bID\s*[:#]?\s*\d{5,}` },
  { label: 'internal_sys', src: String.raw`scrapping[-_]consulta[-_]ticket` },
  { label: 'internal_sys', src: String.raw`agente[_\-]scraping` },
  { label: 'internal_sys', src: String.raw`qdrant` },
  { label: 'internal_sys', src: String.raw`vps[-_]?\d` },
  { label: 'internal_sys', src: String.raw`local[-_]knowledge` },
  { label: 'attribution',  src: String.raw`base de conhecimento totvs` },
  { label: 'attribution',  src: String.raw`banco de tickets` },
  { label: 'attribution',  src: String.raw`tickets?\s+de\s+suporte` },
];

// Pre-compile with 'gi' flags (new RegExp per call to reset lastIndex)
function buildPattern(src) {
  return new RegExp(src, 'gi');
}

function filterText(text) {
  let filtered = text;
  let totalRedacts = 0;

  for (const { label, src } of BLOCKLIST) {
    const re = buildPattern(src);
    filtered = filtered.replace(re, (match) => {
      totalRedacts++;
      process.stderr.write(`[proxy] redacted: ${label} — "${match.slice(0, 40)}"\n`);
      return REDACT_TOKEN;
    });
  }

  if (totalRedacts >= MAX_REDACTS_WARNING) {
    process.stderr.write(`[proxy] AVISO: ${totalRedacts} redações em uma única resposta — verificar qualidade do import-external\n`);
  }

  return filtered;
}

function filterMessage(msg) {
  if (!msg.result?.content) return msg;

  const filteredContent = msg.result.content.map((item) => {
    if (item.type !== 'text') return item;
    return { ...item, text: filterText(item.text) };
  });

  return { ...msg, result: { ...msg.result, content: filteredContent } };
}

// ─── Spawn inner server ───────────────────────────────────────────────────────

const server = spawn('node', [path.join(__dirname, 'index.js')], {
  stdio: ['pipe', 'pipe', 'inherit'],
  env: process.env,
});

server.on('error', (e) => {
  process.stderr.write(`[proxy] falha ao iniciar MCP server: ${e.message}\n`);
  process.exit(1);
});

server.on('exit', (code) => {
  process.exit(code ?? 0);
});

// Claude → proxy stdin → server stdin (passthrough, unfiltered — inputs are safe)
process.stdin.pipe(server.stdin);

// Server stdout → filter → proxy stdout → Claude
const rl = readline.createInterface({ input: server.stdout, terminal: false, crlfDelay: Infinity });

rl.on('line', (line) => {
  if (!line.trim()) return;
  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    // Non-JSON line — pass through unchanged (shouldn't happen in MCP protocol)
    process.stdout.write(line + '\n');
    return;
  }
  const filtered = filterMessage(msg);
  process.stdout.write(JSON.stringify(filtered) + '\n');
});

rl.on('close', () => {
  // Server closed stdout — proxy exits
});

process.on('SIGTERM', () => server.kill('SIGTERM'));
process.on('SIGINT', () => server.kill('SIGINT'));
