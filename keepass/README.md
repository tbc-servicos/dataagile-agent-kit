# KeePass Skill for Claude Code

Gerencia múltiplos bancos de dados KeePass diretamente do Claude Code com autenticação segura via macOS Keychain.

## 🎯 O que é

Uma integração completa que permite:

**Plataformas:** macOS ✅ | Linux ✅ | Windows (WSL 2) ✅ | Windows nativo ❌

- 🔍 **Buscar senhas** em múltiplos bancos KeePass
- 📂 **Gerenciar entradas** (listar, mostrar, adicionar, editar, deletar)
- 🌍 **Busca global** em todas as databases por padrão
- 🎯 **Filtro por database** com `--db <alias>`
- 🗣️ **Linguagem natural** — pergunta em português e a skill auto-carrega
- 🔐 **Seguro** — senhas armazenadas no macOS Keychain, nunca na CLI

## ⚡ Quick Start

```bash
# Configurar pela primeira vez (wizard interativo)
/keepass-setup

# Buscar em todas as databases configuradas
/keepass search vpn

# Buscar em uma database específica
/keepass list --db meu-banco

# Ou pergunte naturalmente
# "qual a senha do GitHub?"
# → skill auto-carrega automaticamente ✅
```

## 📂 Arquivos

```
keepass-skill/
├── README.md                          # Este arquivo
├── keepass-config.json.example        # Template de configuração (sem dados reais)
├── keepass-config.json                # Sua configuração real (gitignored)
├── commands/
│   ├── keepass.md                     # Comando /keepass — operações CRUD
│   └── keepass-setup.md              # Comando /keepass-setup — wizard de configuração
├── skills/
│   └── keepass/
│       └── SKILL.md                   # Skill auto-carregável por linguagem natural
└── docs/
    ├── keepass-SETUP.md               # Guia completo de setup (manual)
    ├── keepass-README.md              # Guia detalhado de configuração
    └── keepass-CHEATSHEET.md          # Cheat sheet rápida
```

> **Nota de segurança:** `keepass-config.json` está no `.gitignore` pois contém caminhos e contas do Keychain. Use `keepass-config.json.example` como referência de formato.

## 🚀 Setup

### Pré-requisitos

| Plataforma | Requisitos |
|------------|------------|
| **macOS** | `keepassxc` (via Homebrew: `brew install keepassxc`) |
| **Linux** | `keepassxc` + `libsecret-tools` (`sudo apt install keepassxc libsecret-tools`) |
| **Windows** | **WSL 2 obrigatório** — instale Ubuntu via WSL e siga os requisitos Linux |

> **Windows:** apenas WSL 2 é suportado. Git Bash e cmd.exe nativo não funcionam.
> **Linux/WSL 2:** instale `libsecret-tools` para que o armazenamento de senhas funcione corretamente.

### Instalação

1. **Copiar arquivos para seu Claude Code:**
   ```bash
   cp commands/keepass.md ~/.claude/commands/
   cp commands/keepass-setup.md ~/.claude/commands/
   cp -r skills/keepass ~/.claude/skills/
   ```

2. **Rodar o wizard de configuração:**
   ```
   /keepass-setup
   ```
   O wizard verifica pré-requisitos, coleta informações dos seus bancos, armazena as senhas no Keychain e testa cada conexão.

3. **Testar:**
   ```bash
   /keepass list
   ```

## 📖 Documentação

- **[SETUP.md](docs/keepass-SETUP.md)** — Guia completo com exemplos e troubleshooting
- **[CHEATSHEET.md](docs/keepass-CHEATSHEET.md)** — Referência rápida de comandos
- **[README.md](docs/keepass-README.md)** — Detalhes de configuração

## 🔐 Segurança

- ✅ Senhas armazenadas **apenas no secret store do OS** (Keychain no macOS, libsecret no Linux/WSL — nunca em ambiente ou CLI)
- ✅ Cada database tem **senha master única**
- ✅ Nunca expõe `$KPPASS` na linha de comando
- ⚠️ KeePassXC desktop deve estar **fechado** ao usar a skill

## 📝 Exemplo de Uso

```bash
# Listar todas as entradas
/keepass list

# Buscar VPN
/keepass search "TBC Agro/Squad Tech/VPN"

# Ver detalhes de uma entrada
/keepass show "TBC Agro/Squad Tech/VPN - TBCAgro"

# Adicionar nova entrada
/keepass add "Dev/nova-api" --db squadtech

# Editar entrada (gerar nova senha)
/keepass edit "Servers/prod" --db squadtech

# Deletar entrada
/keepass rm "Old/entry" --db pessoal
```

## 🌍 Databases Suportadas

| Alias | Descrição | Suporta .key |
|-------|-----------|-------------|
| `pessoal` | Google Drive pessoal | ❌ |
| `squadtech` | TBC Agro - Squad Tech | ❌ |
| `tbc-inovacao` | TBC Agro - Inovação | ✅ |

## 🛠️ Troubleshooting

**Erro: "Senha não encontrada no Keychain"**
```bash
security add-generic-password -s "keepassxc-cli" -a "seu-account" -w
```

**Erro: "Banco não encontrado"**
Verifique se o caminho no `keepass-config.json` está correto:
```bash
test -f "/seu/caminho/do/banco.kdbx" && echo "✓ Existe"
```

**Erro: "Nenhuma entrada encontrada"**
Verifique que KeePassXC desktop não está aberto (evita conflitos):
```bash
killall KeePassXC  # Se necessário
```

Veja [SETUP.md](docs/keepass-SETUP.md) para mais troubleshooting.

## 📋 Comandos Disponíveis

```bash
# Busca
/keepass list                    # Listar todas as entradas
/keepass search <termo>          # Buscar por termo
/keepass show <caminho>          # Ver detalhes de uma entrada

# Gerenciamento
/keepass add <caminho>           # Adicionar nova entrada
/keepass edit <caminho>          # Editar entrada
/keepass rm <caminho>            # Deletar entrada

# Opções
--db <alias>                     # Filtrar por database (pessoal, squadtech, tbc-inovacao)
-u <username>                    # Especificar username
--url <url>                      # Especificar URL
```

## 🤝 Contribuindo

Para adicionar novas databases:

1. Edite `keepass-config.json`
2. Adicione a entrada com alias, caminho e credenciais
3. Armazene a senha no Keychain
4. Teste com `/keepass list --db novo-alias`

## 📄 Licença

Privado - TBC Agro Tecnologia

## 📞 Suporte

Documentação completa em `docs/keepass-SETUP.md`

---

**Status:** ✅ Operacional
**Última atualização:** 2026-03-12
**Versão:** 1.0
