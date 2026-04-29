---
description: "Wizard interativo para configurar o KeePass Skill — gera ~/.claude/keepass-config.json passo a passo"
allowed-tools:
  - Bash
---

# KeePass Setup Wizard

Guia o usuário na configuração completa do KeePass Skill, coletando informações sobre cada banco de dados e gerando o arquivo `~/.claude/keepass-config.json`.

## Instruções para o Claude

Execute o wizard **interativamente**, uma etapa por vez. Aguarde a resposta do usuário antes de avançar.

---

## Etapa 0: Verificar pré-requisitos

Antes de iniciar, execute estas verificações:

```bash
# Verificar keepassxc-cli
KEEPASSXC_PATH=$(which keepassxc-cli 2>/dev/null || echo "/opt/homebrew/bin/keepassxc-cli")
if [ ! -x "$KEEPASSXC_PATH" ]; then
  echo "NOT_FOUND"
else
  keepassxc-cli --version 2>&1 | head -1
fi
```

```bash
# Verificar jq
which jq 2>/dev/null && jq --version || echo "NOT_FOUND"
```

```bash
# Verificar se já existe configuração
[ -f "$HOME/.claude/keepass-config.json" ] && echo "EXISTS" || echo "NEW"
```

```bash
# Detectar OS
OS=$(uname -s)
case "$OS" in
  Darwin) echo "🍎 macOS detectado" ;;
  Linux)
    if grep -qi microsoft /proc/version 2>/dev/null; then
      echo "🐧 Linux (WSL) detectado"
    else
      echo "🐧 Linux nativo detectado"
    fi ;;
  *) echo "❌ OS não suportado: $OS. Use macOS ou Linux/WSL." ;;
esac
```

```bash
# Verificar secret-tool (Linux/WSL apenas)
if [ "$(uname -s)" = "Linux" ]; then
  if ! command -v secret-tool &>/dev/null; then
    echo "secret-tool não encontrado"
    echo "Instale com: sudo apt install libsecret-tools"
    echo "             ou: sudo dnf install libsecret"
  else
    echo "✓ secret-tool disponível"
  fi
fi
```

Com base nos resultados:
- Se `keepassxc-cli` não encontrado: instruir a instalação conforme o OS detectado e **parar**:
  ```bash
  # macOS
  brew install keepassxc

  # Linux / WSL (Ubuntu/Debian)
  sudo apt update && sudo apt install keepassxc

  # Linux / WSL (Fedora/RHEL)
  sudo dnf install keepassxc
  ```
- Se `jq` não encontrado: instruir `brew install jq` (macOS) ou `sudo apt install jq` / `sudo dnf install jq` (Linux/WSL) e **parar**
- Se configuração já existe: perguntar "Já existe um `keepass-config.json`. Deseja (1) adicionar databases à configuração existente ou (2) recriar do zero?"

---

## Etapa 1: Apresentação

Apresente o wizard ao usuário:

> Vou ajudar você a configurar o KeePass Skill. Precisarei de algumas informações sobre cada banco de dados KeePass que você quer usar.
>
> Para cada banco vou perguntar:
> - Um **alias** curto para identificá-lo (ex: `pessoal`, `trabalho`, `equipe`)
> - O **caminho completo** do arquivo `.kdbx`
> - Se usa um **arquivo de chave** `.keyx`
>
> As **senhas master** serão armazenadas no macOS Keychain de forma segura — nunca no arquivo de configuração.
>
> Quantos bancos de dados KeePass você quer configurar?

---

## Etapa 2: Coletar informações de cada banco

Para cada banco (repita até o número informado pelo usuário):

### 2.1 — Alias

> **Banco N de X — Alias**
>
> Digite um nome curto para identificar este banco (sem espaços, ex: `pessoal`, `trabalho`, `squad`):

Validar: sem espaços, sem caracteres especiais além de `-` e `_`.

### 2.2 — Caminho do arquivo .kdbx

> Qual o **caminho completo** do arquivo `.kdbx`?
>
> Dica: arraste o arquivo para o terminal para obter o caminho, ou use:
> ```bash
> find ~ -name "*.kdbx" 2>/dev/null | grep -v ".Trash"
> ```

Após receber o caminho, verificar se existe:

```bash
# Verificar se arquivo existe (substitua pelo caminho informado)
test -f "CAMINHO_INFORMADO" && echo "✓ Arquivo encontrado" || echo "✗ Arquivo não encontrado"
```

Se não existir: avisar e perguntar se quer corrigir o caminho ou continuar mesmo assim (Google Drive pode não estar sincronizado).

### 2.3 — Arquivo de chave (.keyx)

> Este banco usa um **arquivo de chave** (`.keyx` ou `.key`)?
>
> (s/n)

Se sim:
> Qual o caminho completo do arquivo de chave?

```bash
# Verificar se arquivo .keyx existe
test -f "CAMINHO_KEYX" && echo "✓ Chave encontrada" || echo "✗ Chave não encontrada"
```

### 2.4 — Conta no Keychain

> Qual nome usar para identificar este banco no **macOS Keychain**?
>
> Sugestão: `keepass-ALIAS` (ex: `keepass-pessoal`)
>
> Pressione Enter para aceitar a sugestão ou digite outro nome:

### 2.5 — Descrição

> Descrição curta para este banco (ex: "Banco pessoal - Google Drive"):

---

## Etapa 3: Confirmar configuração

Exibir resumo de todos os bancos coletados e perguntar:

> Configuração a ser gerada:
>
> | Alias | Arquivo .kdbx | .keyx | Keychain |
> |-------|---------------|-------|----------|
> | alias1 | /caminho/... | não | keepass-alias1 |
> | alias2 | /caminho/... | sim | keepass-alias2 |
>
> Confirma? (s/n)

---

## Etapa 4: Gerar arquivo de configuração

Construir o JSON e salvar:

```bash
# Gerar keepass-config.json com os dados coletados
cat > "$HOME/.claude/keepass-config.json" << 'EOF'
{
  "databases": [
    {
      "alias": "ALIAS",
      "path": "CAMINHO_KDBX",
      "keychain_service": "keepassxc-cli",
      "keychain_account": "KEYCHAIN_ACCOUNT",
      "keyfile": null_ou_caminho,
      "description": "DESCRICAO"
    }
  ]
}
EOF
```

```bash
# Validar JSON gerado
jq . "$HOME/.claude/keepass-config.json" && echo "✓ JSON válido"
```

---

## Etapa 5: Armazenar senhas no Keychain/secret-tool

Para cada banco configurado, use a função `store_password_instruction` para gerar o comando correto conforme o OS detectado:

```bash
# macOS — verificar se já existe no Keychain
security find-generic-password -s "keepassxc-cli" -a "KEYCHAIN_ACCOUNT" 2>/dev/null \
  && echo "JA_EXISTE" || echo "NAO_EXISTE"

# Linux/WSL — verificar se já existe no secret-tool
secret-tool lookup service "keepassxc-cli" account "KEYCHAIN_ACCOUNT" 2>/dev/null \
  && echo "JA_EXISTE" || echo "NAO_EXISTE"
```

- Se **não existe**: instruir o usuário a executar o comando correto para o OS detectado:

  ```bash
  # macOS:
  security add-generic-password -s "keepassxc-cli" -a "KEYCHAIN_ACCOUNT" -w

  # Linux/WSL:
  secret-tool store --label="KEYCHAIN_ACCOUNT" service "keepassxc-cli" account "KEYCHAIN_ACCOUNT"
  # (será solicitada a senha interativamente)
  ```

  E informar: "O sistema vai pedir sua senha master para este banco. Digite e pressione Enter (a senha não aparece enquanto digita)."

- Se **já existe**: perguntar "Já existe uma senha para `KEYCHAIN_ACCOUNT` no secret store. Deseja manter ou substituir?"

Aguardar confirmação do usuário após cada senha armazenada antes de passar para o próximo banco.

---

## Etapa 6: Teste de conexão

Após todas as senhas configuradas, testar cada banco:

```bash
# Testar banco ALIAS (substitua conforme configuração)
KEEPASSXC=$(which keepassxc-cli 2>/dev/null || echo "/opt/homebrew/bin/keepassxc-cli")
CONFIG="$HOME/.claude/keepass-config.json"

alias="ALIAS"
path=$(jq -r ".databases[] | select(.alias == \"$alias\") | .path" "$CONFIG")
account=$(jq -r ".databases[] | select(.alias == \"$alias\") | .keychain_account" "$CONFIG")
keyfile=$(jq -r ".databases[] | select(.alias == \"$alias\") | .keyfile // empty" "$CONFIG")
pass=$(security find-generic-password -s "keepassxc-cli" -a "$account" -w 2>/dev/null)

if [ -n "$keyfile" ] && [ -f "$keyfile" ]; then
  result=$(echo "$pass" | "$KEEPASSXC" db-info -q -k "$keyfile" "$path" 2>&1)
else
  result=$(echo "$pass" | "$KEEPASSXC" db-info -q "$path" 2>&1)
fi

echo "$result"
```

- Se sucesso: "✓ Banco `ALIAS` conectado com sucesso"
- Se erro `Invalid credentials`: senha master incorreta — orientar a deletar e re-adicionar no Keychain
- Se arquivo não encontrado: Google Drive não sincronizado — orientar a abrir o app e aguardar sync
- Se `already locked`: KeePassXC desktop está aberto — orientar a fechar

---

## Etapa 7: Conclusão

```bash
# Mostrar resumo final
echo "=== Configuração KeePass Skill ==="
jq -r '.databases[] | "✓ [\(.alias)] \(.description)"' "$HOME/.claude/keepass-config.json"
echo ""
echo "Arquivo salvo em: $HOME/.claude/keepass-config.json"
```

Exibir mensagem final:

> **Setup concluído!**
>
> Agora você pode usar:
> - `/keepass list` — listar todas as entradas
> - `/keepass search <termo>` — buscar por termo
> - `/keepass show "<grupo/entrada>"` — ver detalhes
> - `/keepass list --db <alias>` — filtrar por banco
>
> Ou simplesmente pergunte naturalmente: _"qual a senha do GitHub?"_ — a skill detecta automaticamente.
>
> Para adicionar mais bancos no futuro, execute `/keepass-setup` novamente.

> **Nota Linux/WSL:** As senhas ficam no GNOME Keyring via `secret-tool`.
> Certifique-se de que a sessão D-Bus esteja ativa (ambientes desktop funcionam normalmente).
> Em WSL headless, exporte `DBUS_SESSION_BUS_ADDRESS` manualmente se necessário.
