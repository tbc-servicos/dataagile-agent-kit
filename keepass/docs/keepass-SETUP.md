# KeePass Claude Code Skill — Setup & Usage Guide

Gerencia múltiplos bancos de dados KeePass diretamente do Claude Code com autenticação via macOS Keychain.

**Status:** ✅ Pronto para usar

---

## 📋 Índice

1. [O que é](#o-que-é)
2. [Pré-requisitos](#pré-requisitos)
3. [Setup Inicial](#setup-inicial)
4. [Como Usar](#como-usar)
5. [Exemplos Práticos](#exemplos-práticos)
6. [Troubleshooting](#troubleshooting)
7. [Referência Rápida](#referência-rápida)

---

## O que é

**KeePass Claude Code Skill** é uma integração que permite:

- 🔍 **Buscar senhas** em múltiplos bancos KeePass
- 📂 **Gerenciar entradas** (listar, mostrar, adicionar, editar, deletar)
- 🌍 **Busca global** em todas as databases por padrão
- 🎯 **Filtro por database** com `--db <alias>`
- 🗣️ **Linguagem natural** — pergunta em português e a skill auto-carrega
- 🔐 **Seguro** — senhas armazenadas no macOS Keychain, nunca na CLI

### Databases Configuradas

| Alias | Descrição | Caminho |
|-------|-----------|---------|
| `pessoal` | Google Drive pessoal | `/Users/rodrigo/My Drive/Personal/Chaves/Personal.kdbx` |
| `squadtech` | TBC Agro - Squad Tech | `/Users/rodrigo/.../tbcagro-squadtech/Passwords.kdbx` |
| `tbc-inovacao` | TBC Agro - Inovação (com .keyx) | `/Users/rodrigo/.../tbc-inovacao/TBC-Keychain.kdbx` |

---

## Pré-requisitos

### ✅ Já Instalado

- `keepassxc-cli` em `/opt/homebrew/bin/keepassxc-cli`
- macOS Keychain (padrão do sistema)
- 3 bancos KeePass com senhas master únicas

### ❓ Se Não Tiver

```bash
# Instalar keepassxc-cli
brew install keepassxc

# Ou atualizar
brew upgrade keepassxc
```

---

## Setup Inicial

### Passo 1: Verificar Configuração

```bash
cat ~/.claude/keepass-config.json
```

Deve mostrar suas 3 databases com caminhos e aliases corretos.

### Passo 2: Armazenar Senhas Master no Keychain

Execute **uma vez para cada database**:

```bash
# Pessoal
security add-generic-password -s "keepassxc-cli" -a "keepass-pessoal" -w

# Squad Tech
security add-generic-password -s "keepassxc-cli" -a "tbcagro-squadtech" -w

# TBC Inovação
security add-generic-password -s "keepassxc-cli" -a "keepass-tbc-inovacao" -w
```

Cada comando vai **pedir a senha master** interativamente. Digite e confirme.

### Passo 3: Verificar Setup

```bash
# Testar acesso a todas as databases
/keepass list
```

Deve listar entradas de TODAS as 3 databases.

### ✅ Pronto!

Se chegou aqui sem erros, o setup está completo.

---

## Como Usar

### Modo 1: Comando Explícito (`/keepass`)

Use quando você **sabe exatamente o que buscar**:

```bash
# Listar todas as entradas (todas as databases)
/keepass list

# Listar apenas de uma database
/keepass list --db pessoal

# Buscar por termo em TODAS
/keepass search vpn

# Buscar em database específica
/keepass search github --db squadtech

# Mostrar entrada específica
/keepass show "TBC Agro/Squad Tech/Gmail Squad Tech"

# Mostrar de database específica
/keepass show "Servers/prod" --db pessoal
```

### Modo 2: Linguagem Natural (Skill Auto-Carrega)

Use quando você **pergunta naturalmente sobre credenciais**:

```
Você: "qual a senha do gmail squad tech?"
Claude: [skill auto-carrega] ✅
         [busca globalmente]
         [retorna resultado]
```

**Exemplos que disparam a skill:**
- "qual é a senha de..."
- "qual o token para..."
- "procura no keepass por..."
- "mostra credenciais de..."
- "qual a chave de acesso para..."

### Modo 3: Operações de Escrita

Adicionar, editar ou deletar entradas:

```bash
# Adicionar com senha gerada (24 caracteres)
/keepass add "Dev/nova-api" --db squadtech

# Adicionar com username e URL
/keepass add "Group/Entry" -u "usuario" --url "https://..." --db pessoal

# Editar (gerar nova senha)
/keepass edit "Servers/prod" --db squadtech

# Deletar (move para lixeira)
/keepass rm "Old/Entry" --db pessoal
```

---

## Exemplos Práticos

### Exemplo 1: Buscar VPN da TBC

**Comando:**
```bash
/keepass search "TBC Agro/Squad Tech/VPN"
```

**Resultado:**
```
/TBC Agro/Squad Tech/VPN - TBCAgro
/TBC Agro/Squad Tech/VPN - TBCAgro - Emerson
```

**Ver detalhes:**
```bash
/keepass show "TBC Agro/Squad Tech/VPN - TBCAgro"
```

### Exemplo 2: Buscar em Database Específica

```bash
# Buscar todas as VPNs no banco pessoal
/keepass search vpn --db pessoal

# Resultado:
# /VPN - TBCAgro
# /Passwords/account.cyberghostvpn.com
# /Passwords/www.expressvpn.com
```

### Exemplo 3: Linguagem Natural

```
Você: "qual a senha do expressVPN que uso pessoalmente?"

Claude:
1. Detecta pergunta sobre senha
2. Skill auto-carrega
3. Busca "expressVPN" globalmente
4. Encontra em "pessoal"
5. Retorna: /Passwords/www.expressvpn.com (rodrigopg15@gmail.com)
6. Oferece: "Execute `/keepass show 'Passwords/www.expressvpn.com'` para ver a senha"
```

### Exemplo 4: Adicionar Nova Entrada

```bash
# Adicionar nova API key no Squad Tech
/keepass add "APIs/nova-api-key" --db squadtech

# Retorna:
# ✅ Entrada criada com senha de 24 caracteres gerada automaticamente
```

---

## Troubleshooting

### ❌ "Senha não encontrada no Keychain"

**Solução:**
```bash
# Verificar se foi armazenada
security find-generic-password -s "keepassxc-cli" -a "keepass-pessoal" -w

# Se vazio, armazenar novamente
security add-generic-password -s "keepassxc-cli" -a "keepass-pessoal" -w
```

### ❌ "Banco não encontrado"

**Solução:**
```bash
# Verificar se arquivo existe
test -f "/Users/rodrigo/My Drive/Personal/Chaves/Personal.kdbx" && echo "✓ Existe" || echo "✗ Não existe"

# Se Google Drive não sincronizou, abrir e aguardar sync manual
```

### ❌ "Erro ao decodificar banco (arquivo .key inválido)"

**Solução:**
```bash
# Verificar se arquivo .key existe
test -f "/Users/rodrigo/Library/CloudStorage/.../tbc-key.keyx" && echo "✓ Existe"

# Verificar permissões (deve ser -rw-------)
ls -l "/Users/rodrigo/Library/CloudStorage/.../tbc-key.keyx"

# Se permissões estão erradas
chmod 600 "/Users/rodrigo/Library/CloudStorage/.../tbc-key.keyx"
```

### ❌ "Nenhuma entrada encontrada"

**Solução:**
1. Verificar se o termo de busca está correto
2. Tentar busca mais abrangente:
   ```bash
   /keepass list --db squadtech | head -20
   ```
3. KeePassXC desktop não deve estar aberto simultaneamente (pode causar conflitos)

### ❌ "Erro: jq is not defined"

**Solução:**
```bash
# Instalar jq
brew install jq

# Verificar
which jq
```

---

## Referência Rápida

### Setup

```bash
# Ver configuração
cat ~/.claude/keepass-config.json

# Armazenar senha (uma vez)
security add-generic-password -s "keepassxc-cli" -a "keepass-pessoal" -w

# Atualizar senha (se mudou)
security delete-generic-password -s "keepassxc-cli" -a "keepass-pessoal"
security add-generic-password -s "keepassxc-cli" -a "keepass-pessoal" -w
```

### Uso

```bash
# Busca global
/keepass list
/keepass search termo
/keepass show "Grupo/Entrada"

# Busca filtrada
/keepass list --db pessoal
/keepass search termo --db squadtech
/keepass show "Grupo/Entrada" --db tbc-inovacao

# Operações
/keepass add "Grupo/Nova" --db squadtech
/keepass edit "Grupo/Entrada" --db pessoal
/keepass rm "Grupo/Antiga" --db pessoal
```

### Adicionar Nova Database

1. Editar configuração:
   ```bash
   nano ~/.claude/keepass-config.json
   ```

2. Adicionar entrada:
   ```json
   {
     "alias": "novo-alias",
     "path": "/caminho/do/banco.kdbx",
     "keychain_service": "keepassxc-cli",
     "keychain_account": "keepass-novo-alias",
     "keyfile": null,
     "description": "Descrição"
   }
   ```

3. Armazenar senha:
   ```bash
   security add-generic-password -s "keepassxc-cli" -a "keepass-novo-alias" -w
   ```

4. Testar:
   ```bash
   /keepass list --db novo-alias
   ```

---

## Segurança

### ✅ Boas Práticas

- ✅ Senhas armazenadas **apenas no Keychain** (não em ambiente, arquivo ou CLI)
- ✅ Cada database tem **senha master única**
- ✅ Arquivos `.key` com **permissões 600** (apenas você pode ler)
- ✅ **Nunca** exponha `$KPPASS` na CLI ou logs
- ✅ KeePassXC **desktop fechado** ao usar a skill (evita conflitos)

### ⚠️ Cuidados

- Operação `rm` move para **Lixeira** (não deleta permanentemente)
- Operações de **escrita requerem confirmação**
- Senhas são exibidas em **texto claro** com `show`
- Google Drive deve estar **sincronizado** para modificações

---

## Suporte & Documentação

### Arquivos Relacionados

```
~/.claude/keepass-config.json     # Configuração das databases
~/.claude/keepass-README.md        # Guia detalhado de configuração
~/.claude/keepass-SETUP.md         # Este arquivo
~/.claude/commands/keepass.md      # Documentação do comando
~/.claude/skills/keepass/SKILL.md  # Documentação da skill
```

### Comandos Úteis

```bash
# Ver todas as senhas armazenadas
security find-generic-password -s "keepassxc-cli" -a "seu-account"

# Listar todas as contas
security find-generic-password -s "keepassxc-cli" 2>&1 | grep acct

# Deletar senha do Keychain
security delete-generic-password -s "keepassxc-cli" -a "keepass-pessoal"

# Validar JSON
cat ~/.claude/keepass-config.json | jq .
```

---

## FAQ

**P: Posso usar a skill em múltiplas máquinas?**
R: Sim, mas cada máquina precisa armazenar as senhas no seu próprio Keychain. Compartilhe apenas o arquivo `keepass-config.json` (sem senhas).

**P: E se esquecer a senha master?**
R: KeePass não permite recuperação. Você precisará acessar o banco pelo KeePassXC desktop ou resetar a senha (requer acesso ao banco original).

**P: Posso editar a configuração manualmente?**
R: Sim, edite `~/.claude/keepass-config.json` com cuidado para não quebrar o JSON. Valide com `jq` após editar.

**P: Por que a skill não auto-carrega em algumas perguntas?**
R: A skill detecta palavras-chave como "senha", "credencial", "login", "token". Se usar termos muito específicos, use `/keepass` explicitamente.

**P: Posso ter bancos com senhas vazias?**
R: Sim, mas não é recomendado por segurança. Deixe a senha mestra protegida mesmo que o banco esteja vazio.

---

**Última atualização:** 2026-03-12
**Status:** ✅ Operacional
**Versão:** 1.0
