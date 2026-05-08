# Onboarding — Claude Code Plugins TBC

Guia para configurar o ambiente pela primeira vez.

---

## Pré-requisitos

- [ ] **Claude Code** instalado: `npm install -g @anthropic-ai/claude-code`
- [ ] **API key TBC** — obtida ao assinar um plano em [tbc-agent-kit.totvstbc.com.br](https://tbc-agent-kit.totvstbc.com.br)

---

## Instalação

### Passo 1 — Configurar a API key (obrigatório)

A API key autentica o acesso ao Knowledge Base. Sem ela, o MCP não conecta.

**macOS / Linux:**
```bash
mkdir -p ~/.config/tbc
echo '{ "api_key": "tbc_live_SUA_CHAVE_AQUI" }' > ~/.config/tbc/dev-config.json
```

**Windows (PowerShell):**
```powershell
New-Item -ItemType Directory -Force "$env:USERPROFILE\.config\tbc" | Out-Null
'{ "api_key": "tbc_live_SUA_CHAVE_AQUI" }' | Set-Content "$env:USERPROFILE\.config\tbc\dev-config.json"
```

**Alternativa — variável de ambiente (qualquer SO):**
```bash
export TBC_API_KEY=tbc_live_SUA_CHAVE_AQUI   # macOS/Linux — adicione ao ~/.zshrc ou ~/.bashrc
```
```powershell
[Environment]::SetEnvironmentVariable("TBC_API_KEY", "tbc_live_SUA_CHAVE_AQUI", "User")
# Reinicie o terminal
```

> Substitua `tbc_live_SUA_CHAVE_AQUI` pela sua chave real. Nunca compartilhe a chave.

### Passo 2 — Registrar o marketplace (uma vez por máquina)

```bash
claude plugin marketplace add https://github.com/tbc-servicos/tbc-agent-kit.git
```

### Passo 3 — Instalar os plugins

```bash
claude plugin install protheus@claude-skills-tbc
```

### Passo 4 — Abrir o Claude Code no projeto

```bash
cd ~/developments/seu-projeto
claude
# → /protheus:init-project   (projeto Protheus)
```

O comando de inicialização entrevista e gera um `CLAUDE.md` com as configurações do projeto.

---

## Uso diário

### Protheus — Desenvolvimento

```
/protheus:brainstorm  → planejamento + design aprovado antes do código
/protheus:plan        → decompõe design em tasks ADVPL
/protheus:implement   → Agent Team: implementer → reviewer → spec-reviewer
/protheus:deploy      → compila no AppServer, gera patch .ptm
/protheus:qa          → testes TIR E2E
/protheus:writer      → geração de código ADVPL/TLPP
/protheus:specialist  → consulta base técnica curada
/protheus:diagnose    → diagnostica erros de compilação, runtime, performance
```

### Protheus — Suporte Técnico

```
/protheus:suporte     → diagnóstico de erro ERP: classifica, identifica causa raiz, gera resolução estruturada
/protheus:diagnose    → diagnóstico técnico detalhado com causa raiz
/protheus:specialist  → consulta base para identificar função, PE ou parâmetro
```

---

## Como o MCP funciona

```
Claude Code CLI
  └─ node dist/tbc-mcp-proxy.mjs
       └─ proxy stdio ↔ Streamable HTTP
            └─ TBC Knowledge API  (autenticado por api_key)
```

Cross-platform: macOS, Linux e Windows. Zero dependências extras além do `node` já incluso no Claude Code.

---

## Claude Desktop

Adicione ao arquivo de configuração:
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "tbc-knowledge": {
      "command": "node",
      "args": ["<HOME>/.claude/plugins/marketplaces/claude-skills-tbc/protheus/dist/tbc-mcp-proxy.mjs"],
      "env": {
        "TBC_API_KEY": "tbc_live_SUA_CHAVE_AQUI"
      }
    }
  }
}
```

Substitua `<HOME>` pelo seu home directory.

---

## Atualizar

Os plugins se atualizam automaticamente em cada sessão. Para forçar manualmente:

```bash
claude plugin uninstall protheus@claude-skills-tbc && claude plugin install protheus@claude-skills-tbc
```

---

## Troubleshooting

**Plugin não encontrado:**
```bash
claude plugin list
claude plugin marketplace list
# Se o marketplace não aparecer:
claude plugin marketplace add https://github.com/tbc-servicos/tbc-agent-kit.git
```

**MCP não conecta / API key inválida:**
```bash
# Verificar se a chave está configurada
cat ~/.config/tbc/dev-config.json
# Deve conter: { "api_key": "tbc_live_..." }
```

Chave inválida ou expirada: acesse [tbc-agent-kit.totvstbc.com.br](https://tbc-agent-kit.totvstbc.com.br) para gerar uma nova.

**Erro "installed in managed scope":**

```bash
# macOS/Linux
rm -rf ~/.claude/plugins/cache/claude-skills-tbc ~/.claude/plugins/marketplaces/claude-skills-tbc
claude plugin marketplace add https://github.com/tbc-servicos/tbc-agent-kit.git
claude plugin install protheus@claude-skills-tbc
```

```powershell
# Windows
Remove-Item -Recurse -Force "$env:USERPROFILE\.claude\plugins\cache\claude-skills-tbc","$env:USERPROFILE\.claude\plugins\marketplaces\claude-skills-tbc"
claude plugin marketplace add https://github.com/tbc-servicos/tbc-agent-kit.git
claude plugin install protheus@claude-skills-tbc
```

---

**Suporte:** devkit@totvstbc.com.br
