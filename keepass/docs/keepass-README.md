# KeePass Multi-Database — Guia de Configuração

## 📋 Índice

1. [Adicionar Nova Database](#adicionar-nova-database)
2. [Gerenciar Senhas no Keychain](#gerenciar-senhas-no-keychain)
3. [Usando Arquivos .key](#usando-arquivos-key)
4. [Exemplos Práticos](#exemplos-práticos)
5. [Troubleshooting](#troubleshooting)

---

## Adicionar Nova Database

### Passo 1: Editar o arquivo de configuração

```bash
nano ~/.claude/keepass-config.json
```

### Passo 2: Adicionar nova entrada

Adicione um novo objeto no array `databases`:

```json
{
  "alias": "minha-nova-db",
  "path": "/Users/rodrigo/Library/CloudStorage/GoogleDrive-usuario/path/to/Passwords.kdbx",
  "keychain_service": "keepassxc-cli",
  "keychain_account": "keepass-nova-db",
  "keyfile": null,
  "description": "Descrição da database"
}
```

**Campos explicados:**

| Campo | O que é | Exemplo |
|-------|---------|---------|
| `alias` | Identificador curto para usar com `--db` | `pessoal`, `squadtech`, `dept1` |
| `path` | Caminho completo do arquivo .kdbx | `/Users/rodrigo/.../Passwords.kdbx` |
| `keychain_service` | Serviço Keychain (sempre `keepassxc-cli`) | `keepassxc-cli` |
| `keychain_account` | Identificador único no Keychain | `keepass-nova-db` |
| `keyfile` | Caminho do arquivo .key (ou `null`) | `/Users/rodrigo/.keepass/db.key` ou `null` |
| `description` | Descrição legível | "Database do Departamento 1" |

### Passo 3: Salvar arquivo

Pressione `Ctrl+O`, `Enter`, `Ctrl+X` no nano.

### Passo 4: Validar JSON

```bash
cat ~/.claude/keepass-config.json | jq .
```

Se não houver erros, está pronto!

---

## Gerenciar Senhas no Keychain

### Armazenar nova senha

Para cada database, execute **uma vez**:

```bash
security add-generic-password -s "keepassxc-cli" -a "keepass-nova-db" -w
```

Será solicitada a senha master interativamente. Confirme digitando novamente.

### Atualizar senha existente

Se a senha mudou:

```bash
# 1. Deletar a antiga
security delete-generic-password -s "keepassxc-cli" -a "keepass-nova-db"

# 2. Adicionar a nova
security add-generic-password -s "keepassxc-cli" -a "keepass-nova-db" -w
```

### Listar todas as senhas armazenadas

```bash
security find-generic-password -s "keepassxc-cli"
```

### Testar se uma senha está armazenada

```bash
security find-generic-password -s "keepassxc-cli" -a "keepass-nova-db" -w
```

Se retornar a senha, está OK. Se vazio ou erro, não foi armazenada.

---

## Usando Arquivos .key

Alguns bancos KeePass têm um arquivo `.key` adicional para segurança extra.

### Armazenar o arquivo .key

1. Copie o arquivo .key para um local seguro:
   ```bash
   mkdir -p ~/.keepass
   cp /caminho/do/arquivo.key ~/.keepass/db.key
   chmod 600 ~/.keepass/db.key  # Apenas você pode ler
   ```

2. No arquivo de configuração, defina o caminho:
   ```json
   "keyfile": "/Users/rodrigo/.keepass/db.key"
   ```

3. Ao usar o banco, o keepassxc-cli usa automaticamente:
   ```bash
   echo "$pass" | keepassxc-cli search -q -k "$keyfile" "$path" "termo"
   ```

### Onde guardar os .key files

**Recomendação:** `~/.keepass/` (oculto na home)

```bash
~/.keepass/
├── pessoal.key
├── squadtech.key        # Se houver
└── departamento1.key
```

---

## Exemplos Práticos

### Exemplo 1: Adicionar Database Pessoal Adicional

```json
{
  "alias": "pessoal-trabalho",
  "path": "/Users/rodrigo/Library/CloudStorage/GoogleDrive-trabalho/KeePass/Database.kdbx",
  "keychain_service": "keepassxc-cli",
  "keychain_account": "keepass-pessoal-trabalho",
  "keyfile": null,
  "description": "Database pessoal do trabalho"
}
```

Setup:
```bash
security add-generic-password -s "keepassxc-cli" -a "keepass-pessoal-trabalho" -w
```

Uso:
```bash
/keepass search github --db pessoal-trabalho
```

### Exemplo 2: Adicionar Database com .key

```json
{
  "alias": "financeiro",
  "path": "/Users/rodrigo/Library/CloudStorage/GoogleDrive-empresa/KeePass/Financeiro.kdbx",
  "keychain_service": "keepassxc-cli",
  "keychain_account": "keepass-financeiro",
  "keyfile": "/Users/rodrigo/.keepass/financeiro.key",
  "description": "Database de senhas financeiras (com chave de segurança)"
}
```

Setup:
```bash
# 1. Copiar arquivo .key
cp ~/Downloads/financeiro.key ~/.keepass/
chmod 600 ~/.keepass/financeiro.key

# 2. Armazenar senha no Keychain
security add-generic-password -s "keepassxc-cli" -a "keepass-financeiro" -w

# 3. Teste
/keepass list --db financeiro
```

### Exemplo 3: Database Compartilhada

```json
{
  "alias": "equipe",
  "path": "/Users/rodrigo/Library/CloudStorage/GoogleDrive-empresa/Shared/KeePass/Equipe.kdbx",
  "keychain_service": "keepassxc-cli",
  "keychain_account": "keepass-equipe",
  "keyfile": null,
  "description": "Database compartilhada com a equipe"
}
```

---

## Troubleshooting

### Erro: "JSON parse error"

**Problema:** Arquivo de configuração tem erro de sintaxe JSON.

**Solução:**
```bash
cat ~/.claude/keepass-config.json | jq .
```

Corrige o erro e salva novamente.

### Erro: "Senha não encontrada no Keychain"

**Problema:** Senha não foi armazenada corretamente.

**Solução:**
```bash
# 1. Verificar se existe
security find-generic-password -s "keepassxc-cli" -a "keepass-nova-db"

# 2. Se não existir, adicionar
security add-generic-password -s "keepassxc-cli" -a "keepass-nova-db" -w

# 3. Se existir, deletar e refazer
security delete-generic-password -s "keepassxc-cli" -a "keepass-nova-db"
security add-generic-password -s "keepassxc-cli" -a "keepass-nova-db" -w
```

### Erro: "Arquivo .key não encontrado"

**Problema:** Caminho do arquivo .key está incorreto ou arquivo foi movido.

**Solução:**
```bash
# 1. Verificar localização do arquivo
find ~ -name "*.key" -type f

# 2. Atualizar caminho no keepass-config.json
nano ~/.claude/keepass-config.json

# 3. Testar permissões
ls -l /Users/rodrigo/.keepass/db.key
# Deve ter: -rw------- (600)
```

### Erro: "Caminho do banco não existe"

**Problema:** Arquivo .kdbx foi movido ou Google Drive não sincronizou.

**Solução:**
```bash
# 1. Verificar se arquivo existe
test -f "/caminho/do/Passwords.kdbx" && echo "Existe" || echo "Não existe"

# 2. Sincronizar Google Drive manualmente
# Abra Google Drive e aguarde sync

# 3. Atualizar caminho se banco foi movido
nano ~/.claude/keepass-config.json
```

---

## Checklists

### Checklist: Adicionar Nova Database

- [ ] Arquivo .kdbx existe e caminho está correto
- [ ] Arquivo de configuração foi editado com novo `alias`
- [ ] JSON validado com `jq`
- [ ] Senha armazenada no Keychain
- [ ] Se houver `.key`, arquivo foi copiado para `~/.keepass/`
- [ ] Permissões do `.key` são 600: `chmod 600 ~/.keepass/*.key`
- [ ] Testado com `/keepass list --db novo-alias`

### Checklist: Update de Senha Master

- [ ] Deletou senha antiga do Keychain
- [ ] Armazenou nova senha
- [ ] Testou acesso com `/keepass list --db alias`

---

## Referência Rápida

```bash
# Editar configuração
nano ~/.claude/keepass-config.json

# Validar configuração
cat ~/.claude/keepass-config.json | jq .

# Listar todas as databases
jq -r '.databases[].alias' ~/.claude/keepass-config.json

# Verificar senha no Keychain
security find-generic-password -s "keepassxc-cli" -a "keepass-nova-db" -w

# Adicionar senha
security add-generic-password -s "keepassxc-cli" -a "keepass-nova-db" -w

# Deletar senha
security delete-generic-password -s "keepassxc-cli" -a "keepass-nova-db"

# Testar database
/keepass list --db novo-alias
```
