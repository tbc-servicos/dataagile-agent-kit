# KeePass Claude Code Skill

Skill para gerenciar múltiplos bancos KeePass via Claude Code, com autenticação pelo macOS Keychain.

## Estrutura

```
commands/keepass.md          # Comando /keepass — operações CRUD
commands/keepass-setup.md    # Comando /keepass-setup — wizard interativo
skills/keepass/SKILL.md      # Skill auto-carregável por linguagem natural
keepass-config.json.example  # Template de configuração (sem dados reais)
keepass-config.json          # Configuração real do usuário (gitignored)
docs/                        # Documentação detalhada
```

## Instalação

```bash
cp commands/keepass.md ~/.claude/commands/
cp commands/keepass-setup.md ~/.claude/commands/
cp -r skills/keepass ~/.claude/skills/
```

Depois rodar `/keepass-setup` para configurar os bancos interativamente.

## Configuração

A lista de bancos fica em `~/.claude/keepass-config.json` (gerado pelo `/keepass-setup`).
O arquivo é **gitignored** — contém caminhos e contas do Keychain específicos de cada usuário.
Use `keepass-config.json.example` como referência de formato.

## Gotchas

- **KeePassXC desktop deve estar fechado** ao usar a skill (conflito de lock no arquivo .kdbx)
- Caminhos dos bancos podem incluir espaços — sempre usar aspas duplas nos comandos bash
- `keepassxc-cli` é descoberto via `find_keepassxc_cli()` — tenta `PATH` primeiro, depois fallbacks por OS (`/opt/homebrew` no macOS, `/usr/bin` no Linux)
- Operação `rm` move para Lixeira; para deletar permanentemente, executar `rm` novamente
- `keepass-config.json` não é commitado — cada usuário gera o seu via `/keepass-setup`

## Plataformas Suportadas

| OS | Secret Store | Dependência extra |
|----|--------------|-------------------|
| macOS | Keychain (`security`) | nenhuma |
| Linux | libsecret (`secret-tool`) | `libsecret-tools` |
| Windows WSL 2 | libsecret (`secret-tool`) | WSL 2 + `libsecret-tools` |

- Windows nativo (cmd/PowerShell/Git Bash) não é suportado
- WSL 1 pode ter problemas com D-Bus/libsecret — use WSL 2
- Linux e WSL 2 requerem `secret-tool` disponível via pacote `libsecret-tools`
