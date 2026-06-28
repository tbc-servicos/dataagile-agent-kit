#!/usr/bin/env bash
# advpl-lint.sh — Lint ADVPL/TLPP via advpls appre
# Lê o input do hook via stdin (JSON do Claude Code)

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // ""' 2>/dev/null)

# Só actua em .prw e .tlpp
[[ "$FILE" == *.prw ]] || [[ "$FILE" == *.tlpp ]] || exit 0
[[ -f "$FILE" ]] || exit 0

# Localizar advpls: PATH global, npm global, ou local no projeto
find_advpls() {
  if command -v advpls &>/dev/null; then echo "advpls"; return; fi
  local bin
  bin=$(node -e "try{console.log(require('@totvs/tds-ls'))}catch(e){}" 2>/dev/null)
  [[ -n "$bin" && -x "$bin" ]] && echo "$bin" && return
  local prefix
  prefix=$(npm config get prefix 2>/dev/null)
  local platform
  platform=$(node -e "console.log(process.platform)" 2>/dev/null)
  case "$platform" in
    linux)  echo "$prefix/lib/node_modules/@totvs/tds-ls/bin/linux/advpls" ;;
    darwin) echo "$prefix/lib/node_modules/@totvs/tds-ls/bin/mac/advpls" ;;
    win32)  echo "$prefix/node_modules/@totvs/tds-ls/bin/windows/advpls.exe" ;;
  esac
}

ADVPLS=$(find_advpls)

if [[ -z "$ADVPLS" || ! -x "$ADVPLS" ]]; then
  echo "⚠️  ADVPL LINT: advpls não encontrado. Instale: npm i -g @totvs/tds-ls"
  exit 0
fi

# Detectar includes do CLAUDE.md do projeto (busca recursiva para cima)
INCLUDE_FLAGS=()
_dir=$(dirname "$(realpath "$FILE")")
while [[ "$_dir" != "/" ]]; do
  if [[ -f "$_dir/CLAUDE.md" ]]; then
    _inc=$(grep -oP 'PROTHEUS_INCLUDES=\K.+' "$_dir/CLAUDE.md" 2>/dev/null | head -1)
    if [[ -n "$_inc" ]]; then
      # Suporta múltiplos paths separados por ; ou ,
      IFS=';,' read -ra _paths <<< "$_inc"
      for _p in "${_paths[@]}"; do
        _p=$(echo "$_p" | xargs)  # trim
        [[ -n "$_p" ]] && INCLUDE_FLAGS+=(-I "$_p")
      done
    fi
    break
  fi
  _dir=$(dirname "$_dir")
done

RAW=$("$ADVPLS" appre "$FILE" "${INCLUDE_FLAGS[@]}" 2>/dev/null)
[[ -z "$RAW" ]] && echo "✅ ADVPL LINT: $(basename "$FILE") ok" && exit 0

# Parsear JSON e categorizar mensagens
node -e "
const raw = \`$RAW\`.replace(/(\\r\\n|\\n|\\r)/gm, ' ');
const file = '$FILE';
const basename = file.split('/').pop();

// Warnings que devem ser tratados como ERROS (bloqueantes)
// Problemas reais que o Claude deve corrigir antes de avançar
const WARN_AS_ERROR = [
  /variable .+ (declared but )?not used/i,
  /variable .+ (is )?undefined/i,
  /undeclared (identifier|variable)/i,
  /for variable is not local/i,
  /type mismatch/i,
  /too (few|many) parameters/i,
  /more parameters used/i,
  /argument .+ error/i,
  /not allowed more than one source/i,
  /regular functions are not allowed/i,
];

// Warnings apenas informativos (não bloqueantes)
const WARN_INFO = [
  /deprecated/i,
  /rpo incomplete/i,
];

try {
  const data = JSON.parse(raw);
  const msgs = Object.values(data.msgs || {})[0] || {};

  const errors = [];        // tipo 0 — erros reais
  const warnErrors = [];    // tipo != 0, mas críticos
  const warnInfo = [];      // tipo != 0, apenas avisos

  // Formato da mensagem: 'arquivo.prw(linha) texto da mensagem'
  const lineRe = /\\(\\d+\\)/;

  for (const [msg, type] of Object.entries(msgs)) {
    const lineMatch = msg.match(lineRe);
    const line = lineMatch ? lineMatch[1] : '?';
    const text = msg.replace(/^[^(]+\\(\\d+\\)\\s*/, '').trim();
    const entry = { line, text, raw: msg };

    if (type === '0') {
      errors.push(entry);
    } else if (WARN_AS_ERROR.some(re => re.test(text))) {
      warnErrors.push(entry);
    } else if (WARN_INFO.some(re => re.test(text))) {
      warnInfo.push(entry);
    } else {
      warnErrors.push(entry); // desconhecido: tratar como erro por precaução
    }
  }

  const totalIssues = errors.length + warnErrors.length;

  if (totalIssues === 0 && warnInfo.length === 0) {
    console.log('✅ ADVPL LINT: ' + basename + ' ok');
    process.exit(0);
  }

  const lines = ['ADVPL LINT: ' + basename];

  if (errors.length) {
    lines.push('');
    lines.push('❌ Erros de compilação (' + errors.length + '):');
    for (const e of errors) lines.push('   linha ' + e.line + ': ' + e.text);
  }

  if (warnErrors.length) {
    lines.push('');
    lines.push('🔴 Problemas que devem ser corrigidos (' + warnErrors.length + '):');
    for (const e of warnErrors) lines.push('   linha ' + e.line + ': ' + e.text);
  }

  if (warnInfo.length) {
    lines.push('');
    lines.push('⚠️  Avisos informativos (' + warnInfo.length + '):');
    for (const e of warnInfo) lines.push('   linha ' + e.line + ': ' + e.text);
  }

  if (totalIssues > 0) {
    lines.push('');
    lines.push('Corrija os problemas acima antes de compilar.');
    console.log(lines.join('\n'));
    process.exit(2); // bloquear o Claude
  } else {
    console.log(lines.join('\n'));
    process.exit(0);
  }

} catch(e) {
  // JSON inválido — mostrar saída bruta
  console.log('⚠️  ADVPL LINT: saída inesperada do advpls:');
  console.log(raw.substring(0, 300));
  process.exit(0);
}
" 2>/dev/null
