# KeePass Skill — Cheat Sheet

## ⚡ Quick Start

```bash
# Listar tudo
/keepass list

# Buscar algo
/keepass search vpn

# Ver entrada
/keepass show "Grupo/Entrada"

# Ou pergunte naturalmente:
# "qual a senha do gmail?"
# → skill auto-carrega ✅
```

---

## 📂 Databases

| Alias | Database |
|-------|----------|
| `pessoal` | Google Drive pessoal |
| `squadtech` | TBC Agro - Squad Tech |
| `tbc-inovacao` | TBC Agro - Inovação |

---

## 🔍 Busca

### Global (todas as 3)
```bash
/keepass list
/keepass search vpn
/keepass search github
/keepass show "Servidores/prod"
```

### Filtrada por Database
```bash
/keepass list --db pessoal
/keepass search vpn --db squadtech
/keepass show "Group/Entry" --db tbc-inovacao
```

---

## ➕ Adicionar

```bash
# Com senha gerada automaticamente
/keepass add "Dev/nova-api" --db squadtech

# Com username e URL
/keepass add "Dev/app" -u "user" --url "https://..." --db pessoal
```

---

## ✏️ Editar

```bash
# Gerar nova senha
/keepass edit "Servers/prod" --db squadtech

# Atualizar username/URL
/keepass edit "Servers/prod" -u "novo-user" --db pessoal
```

---

## 🗑️ Deletar

```bash
# Move para lixeira
/keepass rm "Old/entry" --db pessoal
```

---

## 🔐 Setup (Uma Vez)

```bash
# Armazenar senhas no Keychain
security add-generic-password -s "keepassxc-cli" -a "keepass-pessoal" -w
security add-generic-password -s "keepassxc-cli" -a "tbcagro-squadtech" -w
security add-generic-password -s "keepassxc-cli" -a "keepass-tbc-inovacao" -w

# Testar
/keepass list
```

---

## 🛠️ Troubleshoot

```bash
# Validar config
cat ~/.claude/keepass-config.json | jq .

# Testar Keychain
security find-generic-password -s "keepassxc-cli" -a "keepass-pessoal" -w

# Ver documentação completa
cat ~/.claude/keepass-SETUP.md
```

---

## 📚 Documentação

- **SETUP.md** — Setup completo e troubleshooting
- **README.md** — Guia de configuração detalhado
- **keepass-config.json** — Configuração das databases
- **/keepass** — Command documentation
- **Skill** — Auto-carrega em conversas naturais

---

**💡 Pro Tips:**
- Deixe as senhas no Keychain para não digitar sempre
- KeePassXC desktop deve estar fechado para evitar conflitos
- Use `--db` quando quiser buscar em apenas um banco
- A skill auto-carrega quando pergunta sobre senhas/credenciais
