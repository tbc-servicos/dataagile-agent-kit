---
description: "Gerencia entradas em múltiplos bancos KeePass configurados em ~/.claude/keepass-config.json"
argument-hint: "<operação> [args] [--db <alias>] — ex: search github, show Servers/prod, list --db pessoal"
allowed-tools:
  - Bash
---

# KeePass CLI Command — Multi-Database

Manipula entradas em múltiplos bancos de dados KeePass usando `keepassxc-cli`.

A lista de bancos disponíveis é lida de `~/.claude/keepass-config.json`.
Para configurar pela primeira vez, use `/keepass-setup`.

---

## PROIBIÇÕES ABSOLUTAS — Jamais faça isso

❌ **NUNCA usar `export`** — exporta TODAS as senhas em texto puro. Proibido sem exceção.
❌ **NUNCA hardcodar senha** — nem "master", nem qualquer outra. Se Keychain falhar, parar e reportar.
❌ **NUNCA usar `find` para localizar arquivos `.kdbx`** — se o arquivo não existir no caminho do config, reportar e parar.
❌ **NUNCA sobrescrever senha no Keychain automaticamente** — nunca executar `security add/delete-generic-password` sem pedido explícito do usuário.
❌ **NUNCA tentar mais de 1 vez a mesma operação** — se falhar, reportar o erro exato e parar.
❌ **NUNCA adivinhar caminho de entrada** — sempre fazer `search` primeiro para obter o caminho exato.
❌ **NUNCA usar `echo "$pass"` com pipe** — usar sempre `printf '%s\n' "$pass"` para consistência.

---

## Como Usar

Execute operações com: `/keepass <operação> [argumentos] [--db <alias>]`

**Por padrão, opera em TODAS as databases. Use `--db <alias>` para filtrar.**

### Operações disponíveis

| Operação | Descrição |
|----------|-----------|
| `list [--db <alias>]` | Listar todas as entradas |
| `search <termo> [--db <alias>]` | Buscar por nome, username, URL ou notas |
| `show "<grupo/entrada>" [--db <alias>]` | Exibir detalhes — SEMPRE fazer `search` antes |
| `add "<grupo/entrada>" [--db <alias>]` | Adicionar nova entrada com senha gerada |
| `edit "<grupo/entrada>" [--db <alias>]` | Editar entrada existente |
| `rm "<grupo/entrada>" [--db <alias>]` | Mover entrada para Lixeira — pede confirmação |
| `totp "<grupo/entrada>" [--db <alias>]` | Gerar código TOTP (2FA) atual da entrada |
| `merge [--db <alias>] [--threshold <0-100>]` | Detectar e mesclar entradas duplicadas (threshold padrão: 70) |
| `generate` | Gerar senha aleatória (sem salvar) |
| `db-info [--db <alias>]` | Informações do banco |
| `list-dbs` | Listar todas as databases configuradas |

### Fluxo obrigatório para `show`

```
1. Executar: search <termo>
2. Apresentar os resultados ao usuário
3. Usar o caminho EXATO retornado pelo search para executar o show
4. Nunca construir ou adivinhar o caminho — usar apenas o que o search retornou
```

---

## Implementação

### Passo 0: Validações obrigatórias

```bash
CONFIG="$HOME/.claude/keepass-config.json"

# ── Abstração Cross-Platform ──────────────────────────────────────────────────

# Detecta o OS atual → "macos" ou "linux"
detect_os() {
  case "$(uname -s)" in
    Darwin) echo "macos" ;;
    Linux)  echo "linux" ;;
    *)      echo "unsupported" ;;
  esac
}

# Recupera senha do secret store do OS
# Uso: get_password "keepassxc-cli" "keepass-pessoal"
get_password() {
  local service="$1" account="$2"
  case "$(detect_os)" in
    macos) security find-generic-password -s "$service" -a "$account" -w 2>/dev/null ;;
    linux) secret-tool lookup service "$service" account "$account" 2>/dev/null ;;
    *)     echo "❌ OS não suportado. Use macOS ou Linux/WSL." >&2; return 1 ;;
  esac
}

# Retorna o caminho do keepassxc-cli
find_keepassxc_cli() {
  if command -v keepassxc-cli &>/dev/null; then
    command -v keepassxc-cli; return
  fi
  case "$(detect_os)" in
    macos)
      for p in /opt/homebrew/bin/keepassxc-cli /usr/local/bin/keepassxc-cli \
                /Applications/KeePassXC.app/Contents/MacOS/keepassxc-cli; do
        [ -x "$p" ] && echo "$p" && return
      done ;;
    linux)
      for p in /usr/bin/keepassxc-cli /usr/local/bin/keepassxc-cli; do
        [ -x "$p" ] && echo "$p" && return
      done ;;
  esac
  echo ""
}

# Verifica se KeePassXC desktop está em execução
check_desktop_running() {
  pgrep -x "KeePassXC" > /dev/null 2>&1
}

# ── Validações ────────────────────────────────────────────────────────────────

# jq instalado?
if ! command -v jq &>/dev/null; then
  case "$(detect_os)" in
    macos) echo "❌ jq não encontrado. Instale com: brew install jq" ;;
    linux) echo "❌ jq não encontrado. Instale com: sudo apt install jq" ;;
  esac
  exit 1
fi

# keepassxc-cli instalado?
KEEPASSXC=$(find_keepassxc_cli)
if [ -z "$KEEPASSXC" ]; then
  case "$(detect_os)" in
    macos) echo "❌ keepassxc-cli não encontrado. Instale com: brew install keepassxc" ;;
    linux) echo "❌ keepassxc-cli não encontrado. Instale com: sudo apt install keepassxc" ;;
  esac
  exit 1
fi

# Arquivo de configuração existe?
if [ ! -f "$CONFIG" ]; then
  echo "❌ Configuração não encontrada: $CONFIG"
  echo "   Execute /keepass-setup para configurar seus bancos."
  exit 1
fi
```

### Passo 1: Resolver aliases

```bash
# Listar todos os aliases disponíveis
get_all_aliases() {
  jq -r '.databases[].alias' "$CONFIG"
}

# Obter info de um banco pelo alias (usa --arg para evitar injeção por alias com aspas)
get_db_info() {
  local alias="$1"
  local info
  info=$(jq --arg alias "$alias" '.databases[] | select(.alias == $alias)' "$CONFIG")
  if [ -z "$info" ]; then
    echo "❌ Alias '$alias' não encontrado. Aliases disponíveis:"
    jq -r '.databases[] | "  • \(.alias)"' "$CONFIG"
    return 1
  fi
  echo "$info"
}
```

### Passo 2: Executar operação em um banco

```bash
run_on_db() {
  local db_info="$1"
  local op="$2"      # ls, search, show, add, edit, rm, totp, db-info
  local args="$3"    # argumentos adicionais (string, expandida pelo chamador)

  local alias path keychain_service keychain_account keyfile
  alias=$(echo "$db_info" | jq -r '.alias')
  path=$(echo "$db_info" | jq -r '.path')
  keychain_service=$(echo "$db_info" | jq -r '.keychain_service')
  keychain_account=$(echo "$db_info" | jq -r '.keychain_account')
  keyfile=$(echo "$db_info" | jq -r '.keyfile // empty')

  # Para operações de ESCRITA: KeePassXC desktop deve estar fechado
  if [[ "$op" =~ ^(add|edit|rm)$ ]]; then
    if check_desktop_running; then
      echo "❌ [$alias] KeePassXC desktop está aberto."
      echo "   Feche o app antes de operações de escrita para evitar conflitos de lock."
      return 1
    fi
  fi

  # Arquivo existe? Parar imediatamente — não buscar alternativas.
  if [ ! -f "$path" ]; then
    echo "❌ [$alias] Arquivo não encontrado: $path"
    echo "   Verifique se o armazenamento em nuvem está sincronizado."
    echo "   Se o caminho mudou, atualize ~/.claude/keepass-config.json manualmente."
    return 1
  fi

  # Recuperar senha do Keychain — se falhar, parar imediatamente
  local pass
  pass=$(get_password "$keychain_service" "$keychain_account")
  if [ -z "$pass" ]; then
    echo "❌ [$alias] Senha não encontrada no Keychain para '$keychain_account'"
    echo "   Para corrigir, execute manualmente no terminal:"
    echo "   security add-generic-password -s \"$keychain_service\" -a \"$keychain_account\" -w"
    echo "   (nunca executar automaticamente — requer a senha master digitada pelo usuário)"
    return 1
  fi

  # Executar — usar printf '%s\n' para evitar interpretação de flags
  local result exit_code
  if [ -n "$keyfile" ] && [ -f "$keyfile" ]; then
    result=$(printf '%s\n' "$pass" | "$KEEPASSXC" "$op" -q -k "$keyfile" "$path" $args 2>&1)
  else
    result=$(printf '%s\n' "$pass" | "$KEEPASSXC" "$op" -q "$path" $args 2>&1)
  fi
  exit_code=$?

  # Tratar erros conhecidos — reportar e parar, sem retentativas
  if [ $exit_code -ne 0 ]; then
    if echo "$result" | grep -qi "already locked\|in use\|locked by"; then
      echo "❌ [$alias] Database bloqueada por outro processo. Feche o KeePassXC desktop."
    elif echo "$result" | grep -qi "invalid credentials\|wrong key\|Invalid key\|error.*password\|Error while reading"; then
      echo "❌ [$alias] Senha master incorreta no Keychain para '$keychain_account'."
      echo "   Para corrigir manualmente (execute você mesmo no terminal):"
      echo "   1. security delete-generic-password -s \"$keychain_service\" -a \"$keychain_account\""
      echo "   2. security add-generic-password -s \"$keychain_service\" -a \"$keychain_account\" -w"
    elif echo "$result" | grep -qi "entry.*not found\|no entry\|Could not find"; then
      echo "⚠️  [$alias] Entrada não encontrada."
      echo "   Use 'search <termo>' para localizar o caminho exato da entrada."
    else
      echo "❌ [$alias] Erro (exit $exit_code): $result"
    fi
    return $exit_code
  fi

  # Prefixar resultado com alias quando buscando em múltiplos bancos
  [ -n "$result" ] && echo "$result" | sed "s/^/[$alias] /"
  return 0
}
```

### Passo 2b: Funções auxiliares para merge

```bash
# Extrai a URL de uma entrada via show --all
# Uso: extract_url_from_entry "$db_info" "Grupo/Entrada"
extract_url_from_entry() {
  local db_info="$1"
  local entry_path="$2"
  local path keychain_service keychain_account keyfile pass result

  path=$(echo "$db_info" | jq -r '.path')
  keychain_service=$(echo "$db_info" | jq -r '.keychain_service')
  keychain_account=$(echo "$db_info" | jq -r '.keychain_account')
  keyfile=$(echo "$db_info" | jq -r '.keyfile // empty')

  pass=$(get_password "$keychain_service" "$keychain_account")
  if [ -z "$pass" ]; then
    return 1
  fi

  if [ -n "$keyfile" ] && [ -f "$keyfile" ]; then
    result=$(printf '%s\n' "$pass" | "$KEEPASSXC" show -q -s --all -k "$keyfile" "$path" "$entry_path" 2>&1)
  else
    result=$(printf '%s\n' "$pass" | "$KEEPASSXC" show -q -s --all "$path" "$entry_path" 2>&1)
  fi

  # Procura por "URL: <url>" na saída
  echo "$result" | grep "^URL:" | sed 's/^URL:[[:space:]]*//'
}

# Extrai o domínio base de uma URL
# Uso: get_domain "https://accounts.google.com/login"  → google.com
get_domain() {
  local url="$1"
  local domain

  # Remove protocolo
  domain="${url#*://}"
  # Remove path
  domain="${domain%%/*}"
  # Remove porta
  domain="${domain%%:*}"
  # Remove subdomínio (leave apenas última 2 partes: domain.tld)
  domain=$(echo "$domain" | awk -F. '{
    n=NF
    if (n >= 2) {
      print $(n-1)"."$n
    } else {
      print $0
    }
  }')

  echo "$domain"
}

# Calcula score fuzzy entre dois títulos (0-100)
# Baseado em tokens (palavras) em comum
# Usa overlap: (2 * interseção) / (token_a + token_b)
# Uso: fuzzy_match_score "Google" "Google Account"  → 70+
fuzzy_match_score() {
  local title_a="$1"
  local title_b="$2"
  local -a tokens_a tokens_b
  local i j count_common score

  # Converter para lowercase e tokenizar por espaço e hífen
  title_a=$(echo "$title_a" | tr '[:upper:]' '[:lower:]')
  title_b=$(echo "$title_b" | tr '[:upper:]' '[:lower:]')

  # Substituir hífens por espaços e tokenizar
  title_a=$(echo "$title_a" | tr '-' ' ')
  title_b=$(echo "$title_b" | tr '-' ' ')

  # Split em arrays de tokens
  mapfile -t tokens_a < <(echo "$title_a" | tr ' ' '\n' | grep -v '^$')
  mapfile -t tokens_b < <(echo "$title_b" | tr ' ' '\n' | grep -v '^$')

  # Contar interseção
  count_common=0
  for tok_a in "${tokens_a[@]}"; do
    for tok_b in "${tokens_b[@]}"; do
      [ "$tok_a" = "$tok_b" ] && ((count_common++)) && break
    done
  done

  # Score: (2 * interseção) / (len_a + len_b)
  # Isso dá peso maior para sobreposição
  local total=$((${#tokens_a[@]} + ${#tokens_b[@]}))

  if [ "$total" -eq 0 ]; then
    echo 0
  else
    score=$((2 * count_common * 100 / total))
    echo "$score"
  fi
}

# Detecta entradas duplicadas no banco baseado em domínio de URL + fuzzy match de título
# Retorna pares no formato: "ENTRADA_A|||ENTRADA_B|||SCORE" (uma linha por par)
# Uso: detect_duplicates "$db_info" 70
detect_duplicates() {
  local db_info="$1"
  local threshold="${2:-70}"
  local path keychain_service keychain_account keyfile pass all_entries
  local -A entries_by_domain domain prev_entry prev_title prev_url

  path=$(echo "$db_info" | jq -r '.path')
  keychain_service=$(echo "$db_info" | jq -r '.keychain_service')
  keychain_account=$(echo "$db_info" | jq -r '.keychain_account')
  keyfile=$(echo "$db_info" | jq -r '.keyfile // empty')

  pass=$(get_password "$keychain_service" "$keychain_account")
  if [ -z "$pass" ]; then
    return 1
  fi

  # Listar todas as entradas
  if [ -n "$keyfile" ] && [ -f "$keyfile" ]; then
    all_entries=$(printf '%s\n' "$pass" | "$KEEPASSXC" ls -q -R -f -k "$keyfile" "$path" 2>&1)
  else
    all_entries=$(printf '%s\n' "$pass" | "$KEEPASSXC" ls -q -R -f "$path" 2>&1)
  fi

  # Para cada entrada, extrair URL e título
  local -a entries array_entries
  while IFS= read -r entry_path; do
    [ -z "$entry_path" ] && continue
    # Ignorar Recycle Bin
    [[ "$entry_path" =~ ^Recycle\ Bin ]] && continue

    # Extrair URL e título (título é o último componente do path)
    local url title domain

    url=$(extract_url_from_entry "$db_info" "$entry_path")
    title=$(basename "$entry_path")

    # Se não tem URL, ignorar
    [ -z "$url" ] && continue

    domain=$(get_domain "$url")
    [ -z "$domain" ] && continue

    # Agrupar por domínio
    if [ -z "${entries_by_domain[$domain]}" ]; then
      entries_by_domain[$domain]="$entry_path|||$title|||$url"
    else
      entries_by_domain[$domain]+=$'\n'"$entry_path|||$title|||$url"
    fi
  done <<< "$all_entries"

  # Para cada domínio com múltiplas entradas, comparar pares
  local -a pairs
  for domain in "${!entries_by_domain[@]}"; do
    local entries_list="${entries_by_domain[$domain]}"
    local -a entries_array
    mapfile -t entries_array < <(echo "$entries_list")

    # Comparar todos os pares no grupo
    for ((i = 0; i < ${#entries_array[@]}; i++)); do
      for ((j = i + 1; j < ${#entries_array[@]}; j++)); do
        IFS='|||' read -r path_a title_a url_a <<< "${entries_array[$i]}"
        IFS='|||' read -r path_b title_b url_b <<< "${entries_array[$j]}"

        # Calcular score fuzzy
        local score
        score=$(fuzzy_match_score "$title_a" "$title_b")

        # Se score >= threshold, é um par candidato
        if [ "$score" -ge "$threshold" ]; then
          pairs+=("$path_a|||$title_a|||$url_a|||$path_b|||$title_b|||$url_b|||$score")
        fi
      done
    done
  done

  # Exibir pares encontrados
  printf '%s\n' "${pairs[@]}"
}

# Teste de credenciais via Playwright headless
# Invoca skills/keepass/test_login.js para cada credencial
# Retorna: "RESULTADO_A RESULTADO_B" (cada resultado é: valid|invalid|incompatible|error:msg)
# Uso: test_credentials "$url" "$username_a" "$password_a" "$username_b" "$password_b"
test_credentials() {
  local url="$1"
  local username_a="$2"
  local password_a="$3"
  local username_b="$4"
  local password_b="$5"

  # Encontrar script test_login.js
  local script_dir
  script_dir=$(dirname "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)")
  local test_script="$script_dir/skills/keepass/test_login.js"

  if [ ! -f "$test_script" ]; then
    echo "error:test_login.js não encontrado"
    return 1
  fi

  # Testar credencial A
  local result_a
  result_a=$(node "$test_script" --url "$url" --username "$username_a" --password "$password_a" 2>&1)

  # Testar credencial B
  local result_b
  result_b=$(node "$test_script" --url "$url" --username "$username_b" --password "$password_b" 2>&1)

  # Retornar ambos os resultados separados por espaço
  echo "$result_a $result_b"
}

# Extrai o username de uma entrada via show --all
# Uso: extract_username_from_entry "$db_info" "Grupo/Entrada"
extract_username_from_entry() {
  local db_info="$1"
  local entry_path="$2"
  local path keychain_service keychain_account keyfile pass result

  path=$(echo "$db_info" | jq -r '.path')
  keychain_service=$(echo "$db_info" | jq -r '.keychain_service')
  keychain_account=$(echo "$db_info" | jq -r '.keychain_account')
  keyfile=$(echo "$db_info" | jq -r '.keyfile // empty')

  pass=$(get_password "$keychain_service" "$keychain_account")
  if [ -z "$pass" ]; then
    return 1
  fi

  if [ -n "$keyfile" ] && [ -f "$keyfile" ]; then
    result=$(printf '%s\n' "$pass" | "$KEEPASSXC" show -q -s --all -k "$keyfile" "$path" "$entry_path" 2>&1)
  else
    result=$(printf '%s\n' "$pass" | "$KEEPASSXC" show -q -s --all "$path" "$entry_path" 2>&1)
  fi

  # Procura por "UserName: <username>" na saída
  echo "$result" | grep "^UserName:" | sed 's/^UserName:[[:space:]]*//'
}

# Extrai a senha de uma entrada via show --all
# Uso: extract_password_from_entry "$db_info" "Grupo/Entrada"
extract_password_from_entry() {
  local db_info="$1"
  local entry_path="$2"
  local path keychain_service keychain_account keyfile pass result

  path=$(echo "$db_info" | jq -r '.path')
  keychain_service=$(echo "$db_info" | jq -r '.keychain_service')
  keychain_account=$(echo "$db_info" | jq -r '.keychain_account')
  keyfile=$(echo "$db_info" | jq -r '.keyfile // empty')

  pass=$(get_password "$keychain_service" "$keychain_account")
  if [ -z "$pass" ]; then
    return 1
  fi

  if [ -n "$keyfile" ] && [ -f "$keyfile" ]; then
    result=$(printf '%s\n' "$pass" | "$KEEPASSXC" show -q -s --all -k "$keyfile" "$path" "$entry_path" 2>&1)
  else
    result=$(printf '%s\n' "$pass" | "$KEEPASSXC" show -q -s --all "$path" "$entry_path" 2>&1)
  fi

  # Procura por "Password: <password>" na saída
  echo "$result" | grep "^Password:" | sed 's/^Password:[[:space:]]*//'
}

# Extrai as notas de uma entrada via show --all
# Uso: extract_notes_from_entry "$db_info" "Grupo/Entrada"
extract_notes_from_entry() {
  local db_info="$1"
  local entry_path="$2"
  local path keychain_service keychain_account keyfile pass result in_notes

  path=$(echo "$db_info" | jq -r '.path')
  keychain_service=$(echo "$db_info" | jq -r '.keychain_service')
  keychain_account=$(echo "$db_info" | jq -r '.keychain_account')
  keyfile=$(echo "$db_info" | jq -r '.keyfile // empty')

  pass=$(get_password "$keychain_service" "$keychain_account")
  if [ -z "$pass" ]; then
    return 1
  fi

  if [ -n "$keyfile" ] && [ -f "$keyfile" ]; then
    result=$(printf '%s\n' "$pass" | "$KEEPASSXC" show -q -s --all -k "$keyfile" "$path" "$entry_path" 2>&1)
  else
    result=$(printf '%s\n' "$pass" | "$KEEPASSXC" show -q -s --all "$path" "$entry_path" 2>&1)
  fi

  # Notas começam após a linha "Notes:" e podem ser multilinhas
  # Pega tudo até o final ou até a próxima chave
  echo "$result" | sed -n '/^Notes:/,$p' | sed '1s/^Notes:[[:space:]]*//'
}

# Exibe duas entradas lado a lado com resultado do teste
# Uso: show_side_by_side "$db_info" "path_a" "path_b" "result_a" "result_b"
# result_a/result_b são: valid|invalid|incompatible
show_side_by_side() {
  local db_info="$1"
  local path_a="$2"
  local path_b="$3"
  local result_a="$4"
  local result_b="$5"

  local title_a title_b username_a username_b password_a password_b url_a url_b notes_a notes_b

  # Extrair campos de A
  title_a=$(basename "$path_a")
  username_a=$(extract_username_from_entry "$db_info" "$path_a") || username_a=""
  password_a=$(extract_password_from_entry "$db_info" "$path_a") || password_a=""
  url_a=$(extract_url_from_entry "$db_info" "$path_a") || url_a=""
  notes_a=$(extract_notes_from_entry "$db_info" "$path_a") || notes_a=""

  # Extrair campos de B
  title_b=$(basename "$path_b")
  username_b=$(extract_username_from_entry "$db_info" "$path_b") || username_b=""
  password_b=$(extract_password_from_entry "$db_info" "$path_b") || password_b=""
  url_b=$(extract_url_from_entry "$db_info" "$path_b") || url_b=""
  notes_b=$(extract_notes_from_entry "$db_info" "$path_b") || notes_b=""

  # Indicadores de status
  local status_a status_b
  case "$result_a" in
    valid) status_a="✅ válida" ;;
    invalid) status_a="❌ inválida" ;;
    incompatible) status_a="⚠️  incompatível" ;;
    *) status_a="❓ desconhecido" ;;
  esac

  case "$result_b" in
    valid) status_b="✅ válida" ;;
    invalid) status_b="❌ inválida" ;;
    incompatible) status_b="⚠️  incompatível" ;;
    *) status_b="❓ desconhecido" ;;
  esac

  # Exibir lado a lado
  echo ""
  echo "════════════════════════════════════════════════════════════════"
  echo "Comparação das entradas:"
  echo "════════════════════════════════════════════════════════════════"
  echo ""

  # Helper para comparar campos
  local -a field_names field_a field_b same
  field_names=("Title" "UserName" "URL" "Notes")
  field_a=("$title_a" "$username_a" "$url_a" "$notes_a")
  field_b=("$title_b" "$username_b" "$url_b" "$notes_b")

  for ((i = 0; i < ${#field_names[@]}; i++)); do
    local field_name="${field_names[$i]}"
    local val_a="${field_a[$i]}"
    local val_b="${field_b[$i]}"
    local indicator

    if [ "$val_a" = "$val_b" ]; then
      indicator="✅ igual"
    else
      indicator="⚠️  conflito"
    fi

    printf "%-12s %s\n" "$field_name" "$indicator"
    printf "  A: %s\n" "$val_a"
    printf "  B: %s\n" "$val_b"
    echo ""
  done

  echo "Resultado do teste de credencial:"
  printf "  A: %s\n" "$status_a"
  printf "  B: %s\n" "$status_b"
  echo ""
  echo "════════════════════════════════════════════════════════════════"
  echo ""
}

# Resolve a entrada vencedora baseado nos resultados dos testes
# Retorna "A" ou "B" (ou vazio se não conseguir resolver automaticamente)
# Uso: resolve_winner "$result_a" "$result_b"
resolve_winner() {
  local result_a="$1"
  local result_b="$2"

  # Ambas válidas → usuário escolhe
  if [ "$result_a" = "valid" ] && [ "$result_b" = "valid" ]; then
    return 0  # Indica que precisa de escolha do usuário
  fi

  # Apenas A válida
  if [ "$result_a" = "valid" ] && [ "$result_b" != "valid" ]; then
    echo "A"
    return 0
  fi

  # Apenas B válida
  if [ "$result_b" = "valid" ] && [ "$result_a" != "valid" ]; then
    echo "B"
    return 0
  fi

  # Nenhuma válida
  return 1
}

# Resolve um conflito de campo pedindo ao usuário
# Uso: resolve_field_conflict "Notes" "valor_a" "valor_b"
# Retorna o valor escolhido ou digitado pelo usuário
resolve_field_conflict() {
  local field="$1"
  local val_a="$2"
  local val_b="$3"

  echo "Campo \"$field\" — conflito:"
  echo "  A: $val_a"
  echo "  B: $val_b"
  read -p "Usar valor de: [A/B/digitar novo valor] " choice

  case "$choice" in
    A|a) echo "$val_a" ;;
    B|b) echo "$val_b" ;;
    *)   echo "$choice" ;;  # Usuário digitou novo valor
  esac
}

# Mescla duas entradas e atualiza a vencedora no banco
# Retorna 0 se bem-sucedido, 1 se cancelado ou erro
# Uso: merge_entries "$db_info" "$path_a" "$path_b" "A"
merge_entries() {
  local db_info="$1"
  local path_a="$2"
  local path_b="$3"
  local winner="$4"

  local path_winner path_loser
  if [ "$winner" = "A" ]; then
    path_winner="$path_a"
    path_loser="$path_b"
  else
    path_winner="$path_b"
    path_loser="$path_a"
  fi

  local title_winner username_winner password_winner url_winner notes_winner
  local title_loser username_loser password_loser url_loser notes_loser

  # Extrair campos da vencedora
  title_winner=$(basename "$path_winner")
  username_winner=$(extract_username_from_entry "$db_info" "$path_winner") || username_winner=""
  password_winner=$(extract_password_from_entry "$db_info" "$path_winner") || password_winner=""
  url_winner=$(extract_url_from_entry "$db_info" "$path_winner") || url_winner=""
  notes_winner=$(extract_notes_from_entry "$db_info" "$path_winner") || notes_winner=""

  # Extrair campos da perdedora
  title_loser=$(basename "$path_loser")
  username_loser=$(extract_username_from_entry "$db_info" "$path_loser") || username_loser=""
  password_loser=$(extract_password_from_entry "$db_info" "$path_loser") || password_loser=""
  url_loser=$(extract_url_from_entry "$db_info" "$path_loser") || url_loser=""
  notes_loser=$(extract_notes_from_entry "$db_info" "$path_loser") || notes_loser=""

  # Resolver cada conflito
  local final_title final_username final_password final_url final_notes

  # Title
  if [ "$title_winner" = "$title_loser" ]; then
    final_title="$title_winner"
  else
    final_title=$(resolve_field_conflict "Title" "$title_winner" "$title_loser")
  fi

  # UserName
  if [ "$username_winner" = "$username_loser" ]; then
    final_username="$username_winner"
  else
    final_username=$(resolve_field_conflict "UserName" "$username_winner" "$username_loser")
  fi

  # Password
  if [ "$password_winner" = "$password_loser" ]; then
    final_password="$password_winner"
  else
    final_password=$(resolve_field_conflict "Password" "$password_winner" "$password_loser")
  fi

  # URL
  if [ "$url_winner" = "$url_loser" ]; then
    final_url="$url_winner"
  else
    final_url=$(resolve_field_conflict "URL" "$url_winner" "$url_loser")
  fi

  # Notes
  if [ "$notes_winner" = "$notes_loser" ]; then
    final_notes="$notes_winner"
  else
    final_notes=$(resolve_field_conflict "Notes" "$notes_winner" "$notes_loser")
  fi

  # Exibir resumo e pedir confirmação
  echo ""
  echo "════════════════════════════════════════════════════════════════"
  echo "Resumo do merge:"
  echo "════════════════════════════════════════════════════════════════"
  echo "  Vencedora: $path_winner"
  echo "  Perdedora: $path_loser → Lixeira"
  echo ""
  echo "Valores finais:"
  echo "  Title: $final_title"
  echo "  UserName: $final_username"
  echo "  URL: $final_url"
  echo "  Notes: $final_notes"
  echo ""
  read -p "Confirma merge? [s/N] " confirm

  if [ "$confirm" != "s" ] && [ "$confirm" != "S" ]; then
    echo "❌ Merge cancelado pelo usuário."
    return 1
  fi

  # Atualizar a vencedora
  local alias path keychain_service keychain_account keyfile pass edit_args
  alias=$(echo "$db_info" | jq -r '.alias')
  path=$(echo "$db_info" | jq -r '.path')
  keychain_service=$(echo "$db_info" | jq -r '.keychain_service')
  keychain_account=$(echo "$db_info" | jq -r '.keychain_account')
  keyfile=$(echo "$db_info" | jq -r '.keyfile // empty')

  # Verificar se KeePassXC está fechado
  if check_desktop_running; then
    echo "❌ [$alias] KeePassXC desktop está aberto."
    echo "   Feche o app antes de gravar as mudanças."
    return 1
  fi

  pass=$(get_password "$keychain_service" "$keychain_account")
  if [ -z "$pass" ]; then
    echo "❌ [$alias] Senha não encontrada no Keychain."
    return 1
  fi

  # Construir comando edit — usar a path exata da vencedora
  # keepassxc-cli edit -q -u <username> --url <url> -p <path>
  # A senha é passada via stdin
  echo "Atualizando entrada vencedora..."
  local edit_result edit_exit
  if [ -n "$keyfile" ] && [ -f "$keyfile" ]; then
    edit_result=$(printf '%s\n' "$pass" | "$KEEPASSXC" edit -q -u "$final_username" --url "$final_url" -k "$keyfile" "$path" "$path_winner" 2>&1)
  else
    edit_result=$(printf '%s\n' "$pass" | "$KEEPASSXC" edit -q -u "$final_username" --url "$final_url" "$path" "$path_winner" 2>&1)
  fi
  edit_exit=$?

  if [ $edit_exit -ne 0 ]; then
    echo "❌ [$alias] Erro ao atualizar entrada vencedora: $edit_result"
    return 1
  fi

  # Remover a perdedora
  echo "Movendo entrada perdedora para Lixeira..."
  local rm_result rm_exit
  if [ -n "$keyfile" ] && [ -f "$keyfile" ]; then
    rm_result=$(printf '%s\n' "$pass" | "$KEEPASSXC" rm -q -k "$keyfile" "$path" "$path_loser" 2>&1)
  else
    rm_result=$(printf '%s\n' "$pass" | "$KEEPASSXC" rm -q "$path" "$path_loser" 2>&1)
  fi
  rm_exit=$?

  if [ $rm_exit -ne 0 ]; then
    echo "❌ [$alias] Erro ao remover entrada perdedora: $rm_result"
    return 1
  fi

  echo "✅ Merge bem-sucedido!"
  return 0
}
```

### Passo 3: Parser de argumentos e lógica principal

```bash
# Parser de argumentos
OP=""
ARGS=""
DB_FILTER=""
THRESHOLD="70"

# Iterar sobre argumentos
while [ $# -gt 0 ]; do
  case "$1" in
    --db)
      shift
      DB_FILTER="$1"
      shift
      ;;
    --threshold)
      shift
      THRESHOLD="$1"
      shift
      ;;
    merge)
      OP="merge"
      shift
      ;;
    *)
      if [ -z "$OP" ]; then
        OP="$1"
      else
        ARGS="$ARGS $1"
      fi
      shift
      ;;
  esac
done

# Handler para o subcomando merge
if [ "$OP" = "merge" ]; then
  # ── Verificações de pré-requisitos ────────────────────────────────────────
  
  # node instalado?
  if ! command -v node &>/dev/null; then
    echo "❌ Node.js não encontrado."
    echo "   Instale em: https://nodejs.org"
    exit 1
  fi

  # Playwright instalado?
  if ! node -e "require('@playwright/test')" 2>/dev/null; then
    echo "❌ Playwright não encontrado."
    echo "   Instale com: npm install -g @playwright/test"
    exit 1
  fi

  # test_login.js existe?
  local test_script
  test_script=$(dirname "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)")/skills/keepass/test_login.js
  if [ ! -f "$test_script" ]; then
    echo "❌ skills/keepass/test_login.js não encontrado."
    exit 1
  fi

  if [ -n "$DB_FILTER" ]; then
    db_info=$(get_db_info "$DB_FILTER") || exit 1
    alias="$DB_FILTER"
    
    echo "🔍 Procurando entradas duplicadas no banco '$alias' (threshold: $THRESHOLD)..."
    pairs_output=$(detect_duplicates "$db_info" "$THRESHOLD")
    
    if [ -z "$pairs_output" ]; then
      echo "✅ Nenhum par de entradas duplicadas encontrado com threshold $THRESHOLD."
      exit 0
    fi
    
    # Exibir pares encontrados
    declare -a pairs
    mapfile -t pairs < <(echo "$pairs_output")
    
    echo ""
    echo "📌 Pares de entradas candidatas encontrados:"
    echo ""
    
    for i in "${!pairs[@]}"; do
      pair_num=$((i + 1))
      IFS='|||' read -r path_a title_a url_a path_b title_b url_b score <<< "${pairs[$i]}"
      
      # Extrair username de cada entrada (stub — Grupo 3 vai melhorar)
      username_a="(username)"
      username_b="(username)"
      
      echo "  [$pair_num] — Score: $score"
      echo "      A: $title_a"
      echo "         URL: $url_a"
      echo "         User: $username_a"
      echo "      B: $title_b"
      echo "         URL: $url_b"
      echo "         User: $username_b"
      echo ""
    done
    
    # Aviso de risco obrigatório
    echo "⚠️  AVISO: Testar credenciais automaticamente pode disparar bloqueios de conta"
    echo "   ou captchas. Prosseguir com o teste para o par 1 de ${#pairs[@]}? [s/N]"
    echo ""
    read -p "Confirma: " confirm_risk
    
    if [ "$confirm_risk" != "s" ] && [ "$confirm_risk" != "S" ]; then
      echo "❌ Operação cancelada pelo usuário."
      exit 0
    fi
    
    # Prompt interativo para seleção de pares
    echo ""
    echo "Selecione quais pares processar:"
    echo "  • Digite números separados por vírgula (ex: 1,3)"
    echo "  • Digite 'todos' para processar todos"
    echo "  • Digite 'nenhum' ou deixe em branco para cancelar"
    echo ""
    read -p "Pares a processar: " selection
    
    selection="${selection// /}"  # Remove espaços
    
    if [ "$selection" = "nenhum" ] || [ -z "$selection" ]; then
      echo "❌ Operação cancelada."
      exit 0
    fi
    
    if [ "$selection" = "todos" ]; then
      selection=$(seq -s, 1 "${#pairs[@]}")
    fi
    
    # Processar cada par selecionado
    echo ""
    echo "🔄 Iniciando fluxo de merge..."
    echo ""

    # Parse selection para array de índices (1-based)
    local -a selected_indices
    if [[ "$selection" == *","* ]]; then
      IFS=',' read -ra selected_indices <<< "$selection"
    else
      selected_indices=("$selection")
    fi

    local total_processed=0
    local total_successful=0
    local total_ignored=0
    local total_moved_to_trash=0

    # Processar cada par selecionado
    for idx in "${selected_indices[@]}"; do
      idx=$((idx - 1))  # Converter para 0-based
      
      if [ "$idx" -lt 0 ] || [ "$idx" -ge "${#pairs[@]}" ]; then
        echo "⚠️  Índice inválido: $((idx + 1))"
        continue
      fi

      ((total_processed++))
      
      # Extrair informações do par
      IFS='|||' read -r path_a title_a url_a path_b title_b url_b score <<< "${pairs[$idx]}"
      
      echo "════════════════════════════════════════════════════════════════"
      echo "Processando par $((idx + 1))/$((${#pairs[@]})) — Score: $score"
      echo "════════════════════════════════════════════════════════════════"
      echo ""

      # Extrair credenciais
      local username_a password_a username_b password_b
      username_a=$(extract_username_from_entry "$db_info" "$path_a") || username_a=""
      password_a=$(extract_password_from_entry "$db_info" "$path_a") || password_a=""
      username_b=$(extract_username_from_entry "$db_info" "$path_b") || username_b=""
      password_b=$(extract_password_from_entry "$db_info" "$path_b") || password_b=""

      # Testar credenciais
      echo "Testando credenciais em $url_a..."
      local test_results
      test_results=$(test_credentials "$url_a" "$username_a" "$password_a" "$username_b" "$password_b")
      
      local result_a result_b
      result_a=$(echo "$test_results" | awk '{print $1}')
      result_b=$(echo "$test_results" | awk '{print $2}')

      # Exibir lado a lado
      show_side_by_side "$db_info" "$path_a" "$path_b" "$result_a" "$result_b"

      # Resolver vencedora
      local winner auto_selection
      auto_selection=$(resolve_winner "$result_a" "$result_b")
      exit_code=$?

      if [ $exit_code -eq 0 ] && [ -n "$auto_selection" ]; then
        # Vencedora automática
        winner="$auto_selection"
        echo "✅ Entrada $winner selecionada automaticamente (credencial válida)."
        echo ""
      elif [ "$result_a" = "valid" ] && [ "$result_b" = "valid" ]; then
        # Ambas válidas — usuário escolhe
        read -p "Qual entrada manter como base? [A/B] " winner
        if [ "$winner" != "A" ] && [ "$winner" != "B" ]; then
          echo "❌ Escolha inválida. Par ignorado."
          ((total_ignored++))
          continue
        fi
      else
        # Nenhuma válida
        echo "❌ Nenhuma credencial válida — par ignorado."
        ((total_ignored++))
        continue
      fi

      # Executar merge
      local merge_path_a merge_path_b
      if [ "$winner" = "A" ]; then
        merge_path_a="$path_a"
        merge_path_b="$path_b"
      else
        merge_path_a="$path_b"
        merge_path_b="$path_a"
      fi

      if merge_entries "$db_info" "$merge_path_a" "$merge_path_b" "A"; then
        ((total_successful++))
        ((total_moved_to_trash++))
      else
        ((total_ignored++))
      fi

      echo ""
    done

    # Relatório final
    echo ""
    echo "════════════════════════════════════════════════════════════════"
    echo "=== Relatório de Merge ==="
    echo "════════════════════════════════════════════════════════════════"
    echo "Processados: $total_processed pares"
    echo "Merges concluídos: $total_successful"
    echo "Pares ignorados: $total_ignored (sem credencial válida / cancelados)"
    echo "Entradas na Lixeira: $total_moved_to_trash"
    echo "════════════════════════════════════════════════════════════════"
    echo ""

    if [ $total_successful -gt 0 ]; then
      echo "✅ Merge concluído! Para visualizar as entradas movidas:"
      echo "   /keepass list --db $alias | grep 'Recycle Bin'"
    fi
    
  else
    echo "❌ Operação 'merge' requer --db <alias>"
    exit 1
  fi
  exit 0
fi

# Para outras operações: padrão original
# Se --db especificado: operar apenas naquele banco
# Se não: iterar sobre todos os bancos e agregar resultados

if [ -n "$DB_FILTER" ]; then
  db_info=$(get_db_info "$DB_FILTER") || exit 1
  run_on_db "$db_info" "$OP" "$ARGS"
else
  for alias in $(get_all_aliases); do
    db_info=$(get_db_info "$alias")
    run_on_db "$db_info" "$OP" "$ARGS"
  done
fi
```

---

## Referência de Operações

### `list`

```bash
printf '%s\n' "$pass" | "$KEEPASSXC" ls -q -R -f "$path"
```

### `search <termo>`

```bash
printf '%s\n' "$pass" | "$KEEPASSXC" search -q "$path" "termo"
```

Retorna caminhos exatos das entradas. **Use esses caminhos para `show`.**

### `show "<entrada>"` — SEMPRE fazer `search` antes

```bash
# PASSO 1: buscar para obter o caminho exato
printf '%s\n' "$pass" | "$KEEPASSXC" search -q "$path" "termo"

# PASSO 2: usar o caminho EXATO retornado pelo search (copiar sem modificar)
printf '%s\n' "$pass" | "$KEEPASSXC" show -q -s --all "$path" "Grupo/Entrada/Exata"
```

⚠️ Exibe senha em texto claro. Avisar o usuário antes de executar.
⚠️ Se o usuário não forneceu o caminho exato, executar search e perguntar qual entrada mostrar.

### `add "<entrada>"`

KeePassXC desktop deve estar fechado (verificado automaticamente em `run_on_db`).

```bash
# Com senha gerada (recomendado)
printf '%s\n' "$pass" | "$KEEPASSXC" add -q -g -L 24 -l -U -n -s "$path" "Grupo/Entrada"

# Com username e URL
printf '%s\n' "$pass" | "$KEEPASSXC" add -q -g -L 24 -l -U -n -s \
  -u "usuario" --url "https://exemplo.com" "$path" "Grupo/Entrada"
```

Flags: `-g` gerar senha | `-L 24` comprimento | `-l` lowercase | `-U` uppercase | `-n` números | `-s` símbolos

### `edit "<entrada>"`

KeePassXC desktop deve estar fechado (verificado automaticamente em `run_on_db`).

```bash
printf '%s\n' "$pass" | "$KEEPASSXC" edit -q -u "novo_usuario" --url "https://novo.com" "$path" "Grupo/Entrada"

# Gerar nova senha
printf '%s\n' "$pass" | "$KEEPASSXC" edit -q -g -L 24 -l -U -n -s "$path" "Grupo/Entrada"
```

### `rm "<entrada>"` — SEMPRE pedir confirmação

**Antes de executar, perguntar ao usuário:**
```
Confirma exclusão de '<entrada>' no banco '<alias>'? (s/n)
```
Só prosseguir se a resposta for "s" ou "sim". Se não, abortar.

```bash
printf '%s\n' "$pass" | "$KEEPASSXC" rm -q "$path" "Grupo/Entrada"
```

Move para Lixeira. Para deletar permanentemente, executar `rm` novamente dentro de `Recycle Bin/`.

### `totp "<entrada>"`

```bash
printf '%s\n' "$pass" | "$KEEPASSXC" show -q --totp "$path" "Grupo/Entrada"
```

Gera o código TOTP atual (6 dígitos, válido por ~30s). A entrada precisa ter TOTP configurado.
Compatível com keepassxc-cli v2.7.x+. O subcomando `totp` só existe na v2.8+.

### `generate`

```bash
"$KEEPASSXC" generate -L 24 -l -U -n -s
```

### `list-dbs`

```bash
jq -r '.databases[] | "[\(.alias)] — \(.path)"' "$CONFIG"
```

### `db-info`

```bash
printf '%s\n' "$pass" | "$KEEPASSXC" db-info -q "$path"
```

### `merge [--db <alias>] [--threshold <0-100>]`

Detecta e lista entradas duplicadas baseado em:
- **Domínio base da URL** (ex: `google.com` para `https://accounts.google.com/login`)
- **Fuzzy match de título** com threshold configurável (padrão: 70)

Fluxo:
1. Lista todas as entradas do banco
2. Agrupa por domínio de URL
3. Compara títulos dentro de cada grupo com fuzzy match
4. Exibe pares com score ≥ threshold
5. Pede confirmação do usuário antes de processar

```bash
# Detectar duplicatas em um banco com threshold padrão (70)
/keepass merge --db pessoal

# Usar threshold customizado
/keepass merge --db pessoal --threshold 80
```

**Dependências do `merge`:**
- ✅ **Group 2:** Teste de credenciais via Playwright (implementado)
- ⏳ **Group 3:** Merge guiado campo a campo e escrita no banco (futura)

---

## Regras de Segurança

1. **Nunca expor a senha master** — sempre via `printf '%s\n' "$pass" | ...`; jamais em argumento CLI
2. **Nunca usar `export`** — expõe TODAS as senhas em texto puro; proibição absoluta
3. **Confirmar antes de `rm`** — perguntar ao usuário; só executar com confirmação explícita
4. **Verificar KeePassXC fechado** antes de `add`/`edit`/`rm` (integrado em `run_on_db`)
5. **Parar na primeira falha** — não tentar variações; reportar o erro exato
6. **Nunca corrigir Keychain automaticamente** — apenas instruir o usuário com os comandos
7. **Usar aspas duplas** — caminhos têm espaços; sempre `"$path"`, nunca `$path`
8. **Avisar sobre texto claro** — ao usar `show`, mencionar que senha ficará visível
9. **Search antes de show** — nunca construir caminhos; usar apenas o que o search retornar

## Diagnóstico

```bash
# jq instalado?
command -v jq && echo "✓" || echo "✗ brew install jq"

# keepassxc-cli instalado?
keepassxc=$(find_keepassxc_cli); [ -n "$keepassxc" ] && echo "✓ $keepassxc" || echo "✗ não encontrado"

# KeePassXC desktop aberto? (deve estar fechado para writes)
pgrep -x KeePassXC && echo "⚠️ Aberto" || echo "✓ Fechado"

# Node.js instalado? (necessário para merge)
command -v node && echo "✓ $(node -v)" || echo "✗ https://nodejs.org"

# Playwright instalado? (necessário para merge)
node -e "require('@playwright/test')" 2>/dev/null && echo "✓" || echo "✗ npm install -g @playwright/test"

# JSON válido?
jq . ~/.claude/keepass-config.json

# Keychain configurado para um banco? (macOS)
security find-generic-password -s "keepassxc-cli" -a "KEYCHAIN_ACCOUNT" -w 2>&1 | head -c 3 | xxd

# Arquivo .kdbx acessível?
test -f "CAMINHO" && echo "✓" || echo "✗ (nuvem sincronizada?)"
```
