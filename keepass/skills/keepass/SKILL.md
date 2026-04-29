---
name: keepass
description: "Use this skill when the user asks about passwords, credentials, logins, secrets, or KeePass entries. Supports multiple databases with Keychain authentication and optional .keyx key files. Database list is read from ~/.claude/keepass-config.json."
tags:
  - credentials
  - security
  - keepass
  - multi-database
---

# KeePass Skill — Multi-Database

Auto-loaded quando o usuário menciona passwords, credentials, logins, ou KeePass entries.

Suporta **N databases** configuradas em `~/.claude/keepass-config.json`, com autenticação via macOS Keychain e suporte a arquivos `.keyx`. Pesquisa global em todas as databases por padrão.

---

## PROIBIÇÕES ABSOLUTAS — Jamais faça isso

❌ **NUNCA usar `export`** — exporta TODAS as senhas em texto puro. Proibido sem exceção.
❌ **NUNCA hardcodar senha** — nem "master", nem qualquer outra. Se Keychain falhar, parar e reportar.
❌ **NUNCA usar `find` para localizar arquivos `.kdbx`** — se o arquivo não existir no caminho do config, reportar e parar.
❌ **NUNCA sobrescrever senha no Keychain automaticamente** — nunca executar `security add/delete-generic-password` sem pedido explícito do usuário.
❌ **NUNCA tentar mais de 1 vez a mesma operação** — se falhar, reportar o erro exato e parar.
❌ **NUNCA adivinhar caminho de entrada** — sempre fazer `search` primeiro para obter o caminho exato.
❌ **NUNCA usar `echo "$pass"` com pipe** — usar sempre `printf '%s\n' "$pass"`.

---

## Plataformas Suportadas

| OS | Suporte | Secret Store | Requisito |
|----|---------|--------------|-----------|
| macOS | ✅ Nativo | Keychain (`security`) | `keepassxc` via Homebrew |
| Linux | ✅ Nativo | libsecret (`secret-tool`) | `keepassxc` + `libsecret-tools` |
| Windows (WSL 2) | ✅ Via WSL | libsecret (`secret-tool`) | WSL 2 Ubuntu + mesmos do Linux |
| Windows (nativo) | ❌ Não suportado | — | — |

## Configuração

### Arquivo de configuração

```
~/.claude/keepass-config.json
```

Gerado pelo wizard `/keepass-setup`. Formato:

```json
{
  "databases": [
    {
      "alias": "alias-curto",
      "path": "/caminho/completo/para/banco.kdbx",
      "keychain_service": "keepassxc-cli",
      "keychain_account": "keepass-alias-curto",
      "keyfile": null
    },
    {
      "alias": "outro-banco",
      "path": "/caminho/para/outro.kdbx",
      "keychain_service": "keepassxc-cli",
      "keychain_account": "keepass-outro-banco",
      "keyfile": "/caminho/para/chave.keyx"
    }
  ]
}
```

Se o arquivo não existir, orientar o usuário a executar `/keepass-setup`.

## Quick Reference — Padrões de Busca

### Busca Global (padrão)

Percorre **todas** as databases configuradas:

```bash
CONFIG="$HOME/.claude/keepass-config.json"
KEEPASSXC=$(find_keepassxc_cli)

for alias in $(jq -r '.databases[].alias' "$CONFIG"); do
  db_info=$(jq --arg alias "$alias" '.databases[] | select(.alias == $alias)' "$CONFIG")
  path=$(echo "$db_info" | jq -r '.path')
  account=$(echo "$db_info" | jq -r '.keychain_account')
  service=$(echo "$db_info" | jq -r '.keychain_service')
  keyfile=$(echo "$db_info" | jq -r '.keyfile // empty')

  # Se arquivo não existir, reportar e continuar para próximo banco
  if [ ! -f "$path" ]; then
    echo "❌ [$alias] Arquivo não encontrado: $path"
    continue
  fi

  # get_password abstrai Keychain (macOS) vs secret-tool (Linux/WSL)
  pass=$(get_password "$service" "$account")
  if [ -z "$pass" ]; then
    echo "❌ [$alias] Senha não encontrada no Keychain para '$account'"
    echo "   Execute manualmente: security add-generic-password -s \"$service\" -a \"$account\" -w"
    continue
  fi

  if [ -n "$keyfile" ] && [ -f "$keyfile" ]; then
    result=$(printf '%s\n' "$pass" | "$KEEPASSXC" search -q -k "$keyfile" "$path" "TERMO" 2>&1)
  else
    result=$(printf '%s\n' "$pass" | "$KEEPASSXC" search -q "$path" "TERMO" 2>&1)
  fi

  [ -n "$result" ] && echo "$result" | sed "s/^/[$alias] /"
done
```

### Busca Filtrada

Se usuário especificar `--db <alias>`:

```bash
db_info=$(jq --arg alias "$alias" '.databases[] | select(.alias == $alias)' "$CONFIG")
# ... processar apenas esse banco
```

### Fluxo obrigatório para `show`

```
1. Executar: search <termo>
2. Apresentar os resultados ao usuário
3. Usar o caminho EXATO retornado pelo search para executar o show
4. Nunca construir ou adivinhar o caminho
```

## Padrões de Segurança

1. ✅ Sempre passar senha via `printf '%s\n' "$pass" | ...` — nunca expor na CLI
2. ✅ **Nunca usar `export`** — expõe TODAS as senhas em texto puro
3. ✅ **Confirmar antes de `rm`** — perguntar: "Confirma exclusão de 'X'? (s/n)"
4. ✅ **Verificar KeePassXC fechado** antes de writes: `pgrep -x KeePassXC`
5. ✅ **Parar na primeira falha** — não tentar variações; reportar o erro exato
6. ✅ **Validar arquivo `.kdbx` existe** — `test -f "$path"` antes de qualquer op; não usar `find`
7. ✅ **Avisar sobre texto claro** — `show` exibe senha sem encriptação
8. ✅ **Nunca corrigir Keychain automaticamente** — apenas instruir o usuário

## Tratamento de Erros Comuns

| Erro | Causa | OS | Ação |
|------|-------|----|------|
| `already locked` / `in use` | KeePassXC desktop aberto | Todos | Fechar app antes de writes — **parar e reportar** |
| `Invalid credentials` / `Wrong key` | Senha master errada no secret store | Todos | **Parar e instruir** o usuário a corrigir manualmente |
| Arquivo não encontrado | Nuvem não sincronizada ou caminho errado | Todos | **Parar e reportar** — não usar `find` para buscar alternativas |
| Saída vazia | Nenhuma entrada encontrada | Todos | Normal — informar ao usuário; oferecer `search` |
| `jq: command not found` | `jq` não instalado | Todos | macOS: `brew install jq` / Linux: `sudo apt install jq` |
| `keepassxc-cli: command not found` | App não instalado | Todos | macOS: `brew install keepassxc` / Linux: `sudo apt install keepassxc` |
| `secret-tool: command not found` | libsecret não instalado | Linux/WSL | `sudo apt install libsecret-tools` |
| `Cannot autolaunch D-Bus` | Sem sessão D-Bus ativa | Linux/WSL headless | Executar em sessão desktop ou exportar `DBUS_SESSION_BUS_ADDRESS` |

## Quando Carrega Automaticamente

Este skill auto-carrega quando detecta:

- "qual é a senha de..." / "what's the password for..."
- "busca no KeePass..." / "search KeePass..."
- "mostra credenciais de..." / "show credentials..."
- "adiciona entrada..." / "add entry..."
- "qual o token/chave/secret para..."
- Qualquer menção a "password", "credential", "secret", "login", "api key", "token"

## Como Usar

### Natural Language (Skill Auto-Carrega)

```
Usuário: "qual a senha do GitHub?"

Claude:
1. Skill detecta pergunta sobre credencial
2. Lê lista de databases do config
3. Executa search globalmente em todas as databases
4. Retorna resultado com username/URL (sem exibir senha)
5. Oferece: "Execute /keepass show 'Grupo/GitHub' para ver a senha"
   (usando o caminho EXATO retornado pelo search)
```

### Comando Explícito

```
/keepass search github              # busca em TODAS as databases
/keepass search github --db pessoal # busca apenas em 'pessoal'
/keepass show "Grupo/Entrada"       # exibe detalhes (senha visível) — usar caminho do search
/keepass list --db trabalho         # lista entradas de um banco específico
/keepass add "Dev/nova-api" --db trabalho
/keepass merge --db pessoal         # detectar entradas duplicadas
/keepass list-dbs                   # mostra todos os bancos configurados
```

## Operações de Merge

### Detectar duplicatas

```
/keepass merge --db pessoal --threshold 70
```

Detecta e lista entradas duplicadas baseado em:
- URL (domínio base)
- Título (fuzzy match com threshold configurável)

Exibe pares encontrados e pede confirmação antes de processar.

### Primeiro uso (sem configuração)

Se `~/.claude/keepass-config.json` não existir:

```
Execute /keepass-setup para configurar seus bancos KeePass.
O wizard vai guiar você pela configuração passo a passo.
```
