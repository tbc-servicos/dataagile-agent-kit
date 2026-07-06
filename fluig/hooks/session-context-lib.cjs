'use strict';
// Engine compartilhado dos hooks SessionStart (session-context*.cjs).
// Cross-platform: macOS, Linux, Windows (node puro, sem forks de jq/sort/awk).
//
// O additionalContext e gerado dinamicamente:
//   - versoes dos plugins: lidas de <marketplace>/*/.claude-plugin/plugin.json.
//     O nome vem do plugin.json (no cache instalado o layout e
//     <marketplace>/<plugin>/<versao>/ e o basename seria a versao);
//     quando o cache guarda multiplas versoes, prevalece a maior.
//   - catalogo de skills: lido do frontmatter (name/description) de
//     skills/*/SKILL.md — sem lista hardcoded; skill nova entra sozinha.
//     Frontmatter `internal: true` oculta a skill no perfil "external".

const fs = require('fs');
const path = require('path');
const os = require('os');

const DESC_MAX = 170;

function parseFrontmatter(text) {
  const lines = text.split(/\r?\n/);
  if (lines[0] !== '---') return null;
  const end = lines.indexOf('---', 1);
  if (end === -1) return null;
  const fm = {};
  let i = 1;
  while (i < end) {
    const m = lines[i].match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!m) { i++; continue; }
    const key = m[1];
    let value = m[2].trim();
    if (value === '>' || value === '>-' || value === '|' || value === '|-') {
      const parts = [];
      i++;
      while (i < end && (/^\s+\S/.test(lines[i]) || lines[i].trim() === '')) {
        parts.push(lines[i].trim());
        i++;
      }
      value = parts.join(' ').trim();
    } else {
      i++;
    }
    fm[key] = value;
  }
  return fm;
}

function shortDescription(desc) {
  if (!desc) return '';
  let s = desc.replace(/\s+/g, ' ').trim();
  const dot = s.indexOf('. ');
  if (dot >= 40) s = s.slice(0, dot + 1);
  if (s.length > DESC_MAX) s = s.slice(0, DESC_MAX - 1).trimEnd() + '…';
  return s;
}

function cmpVersions(a, b) {
  const pa = String(a).split('.'), pb = String(b).split('.');
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = parseInt(pa[i] || '0', 10), nb = parseInt(pb[i] || '0', 10);
    if (!isNaN(na) && !isNaN(nb) && na !== nb) return na - nb;
    if ((pa[i] || '') !== (pb[i] || '')) return (pa[i] || '') < (pb[i] || '') ? -1 : 1;
  }
  return 0;
}

function collectVersions(marketRoot) {
  const best = {};
  let entries = [];
  try { entries = fs.readdirSync(marketRoot, { withFileTypes: true }); } catch (e) { return []; }
  for (const ent of entries) {
    if (!ent.isDirectory()) continue;
    const pf = path.join(marketRoot, ent.name, '.claude-plugin', 'plugin.json');
    try {
      const json = JSON.parse(fs.readFileSync(pf, 'utf8'));
      const name = (json.name || ent.name).trim();
      const version = String(json.version || '').trim();
      if (!version) continue;
      if (!best[name] || cmpVersions(version, best[name]) > 0) best[name] = version;
    } catch (e) { /* dir sem plugin.json valido — ignora */ }
  }
  return Object.keys(best).sort().map((n) => `  - ${n} v${best[n]}`);
}

function collectSkills(pluginRoot, namespace) {
  const skillsDir = path.join(pluginRoot, 'skills');
  const skills = {};
  let entries = [];
  try { entries = fs.readdirSync(skillsDir, { withFileTypes: true }); } catch (e) { return skills; }
  for (const ent of entries) {
    if (!ent.isDirectory() || ent.name.startsWith('_')) continue;
    try {
      const fm = parseFrontmatter(fs.readFileSync(path.join(skillsDir, ent.name, 'SKILL.md'), 'utf8'));
      if (!fm || !fm.name) continue;
      skills[fm.name] = {
        line: `  - /${namespace}:${fm.name} — ${shortDescription(fm.description)}`,
        internal: fm.internal === 'true',
      };
    } catch (e) { /* skill sem SKILL.md legivel — ignora */ }
  }
  return skills;
}

// Remove bases de conhecimento locais descontinuadas (remote-only enforcement).
// Idempotente e silencioso.
function cleanupObsoleteDbs() {
  const dir = path.join(os.homedir(), '.local', 'share', 'tbc');
  const files = [
    'local-knowledge.db', 'local-knowledge.db-wal', 'local-knowledge.db-shm',
    'local-knowledge-external.db', 'local-knowledge-external.db-wal', 'local-knowledge-external.db-shm',
    'advpl-knowledge.db', 'protheus_knowledge.db.enc',
  ];
  for (const f of files) {
    try { fs.rmSync(path.join(dir, f), { force: true }); } catch (e) { /* ignora */ }
  }
}

// opts: { pluginRoot, namespace, title, profile: 'internal'|'external',
//         cleanupTbcDbs, groups: [{title, names:[..]}], otherTitle, notes: [..] }
module.exports = function emitSessionContext(opts) {
  let context = '';
  try {
    if (opts.cleanupTbcDbs) cleanupObsoleteDbs();

    const marketRoot = path.resolve(opts.pluginRoot, '..');
    const lines = ['Plugins TBC instalados:'];
    lines.push(...collectVersions(marketRoot));
    lines.push('', `Skills ${opts.title} disponiveis (use Skill tool para invocar):`);

    const skills = collectSkills(opts.pluginRoot, opts.namespace);
    const visible = {};
    for (const [name, s] of Object.entries(skills)) {
      if (opts.profile === 'external' && s.internal) continue;
      visible[name] = s;
    }
    const used = new Set();
    for (const group of opts.groups || []) {
      const members = (group.names || []).filter((n) => visible[n]);
      if (!members.length) continue;
      lines.push(`${group.title}:`);
      for (const n of members) { lines.push(visible[n].line); used.add(n); }
    }
    const leftovers = Object.keys(visible).filter((n) => !used.has(n)).sort();
    if (leftovers.length) {
      lines.push(`${opts.otherTitle || 'Outras skills'}:`);
      for (const n of leftovers) lines.push(visible[n].line);
    }
    for (const note of opts.notes || []) lines.push('', note);
    context = lines.join('\n');
  } catch (e) {
    // Hook nunca deve bloquear a sessao: em erro, emite contexto minimo valido.
    context = `Skills ${opts.title || ''} disponiveis via Skill tool (catalogo indisponivel: ${e.message})`;
  }
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: context },
  }, null, 2) + '\n');
};
