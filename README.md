# tbc-agent-kit

> **Protheus e ADVPL dentro do Claude Code — sem sair do terminal.**

Plugin Claude Code para desenvolvimento **ADVPL/TLPP** e suporte técnico **Protheus**. Conecta o Claude a uma base técnica curada com funções, pontos de entrada e padrões — construída com a qualidade do ecossistema TOTVS.

## O problema

Você pergunta para o Claude sobre Protheus e ele inventa:

- Função que não existe → `Function not found` no compilador
- Ponto de entrada com assinatura errada → bug silencioso em produção
- Parâmetro fora da versão do ambiente → funciona em HML, quebra em produção

O plugin resolve isso: o Claude para de adivinhar e cita a referência certa, com a assinatura correta.

## Para quem é

| Perfil | O que ganha |
|--------|-------------|
| **Dev ADVPL/TLPP** | Brainstorm → plano → implementação → compilação → testes TIR, tudo em sequência no terminal |
| **Suporte técnico** | Triagem de chamados por categoria, causa raiz identificada, resposta estruturada com passos de resolução |

## Comandos disponíveis

### Desenvolvimento

```
/protheus:brainstorm  → intake técnico, design aprovado antes do código
/protheus:plan        → decompõe design em tasks ADVPL
/protheus:implement   → Agent Team: implementer → reviewer → spec-reviewer
/protheus:writer      → gera código ADVPL/TLPP com estrutura correta para Protheus
/protheus:specialist  → consulta base técnica curada: funções, pontos de entrada, parâmetros
/protheus:reviewer    → revisa código com checklist de qualidade
/protheus:diagnose    → diagnostica erros de compilação, runtime, performance
/protheus:deploy      → compila no AppServer via TDS-CLI, gera patch .ptm
/protheus:qa          → testes TIR E2E no ambiente compilado
/protheus:sql         → SQL embarcado em ADVPL (BeginSQL/EndSQL, macros)
/protheus:migrate     → migra ADVPL procedural para TLPP orientado a objetos
```

### Suporte técnico

```
/protheus:suporte     → triagem de chamado: classifica, identifica causa raiz, gera resolução estruturada
/protheus:diagnose    → diagnóstico técnico com causa raiz
/protheus:specialist  → consulta base para identificar função, PE ou parâmetro
```

## Instalação

**Pré-requisito:** API key obtida ao assinar um plano em [tbc-agent-kit.totvstbc.com.br](https://tbc-agent-kit.totvstbc.com.br).

### 1 — Instalar o Claude Code

```bash
npm install -g @anthropic-ai/claude-code
```

### 2 — Configurar a API key

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

**Variável de ambiente (qualquer SO):**
```bash
export TBC_API_KEY=tbc_live_SUA_CHAVE_AQUI   # adicione ao ~/.zshrc ou ~/.bashrc
```

### 3 — Adicionar o marketplace

```bash
claude plugin marketplace add https://github.com/tbc-servicos/tbc-agent-kit.git
```

### 4 — Instalar o plugin

```bash
claude plugin install protheus@claude-skills-tbc
```

### 5 — Abrir o Claude Code no projeto

```bash
cd ~/seu-projeto
claude
# → /protheus:brainstorm   (iniciar nova feature)
# → /protheus:suporte      (triar chamado de suporte)
```

---

📘 **[Guia completo de onboarding](./ONBOARDING.md)** — configuração detalhada, troubleshooting, Claude Desktop.

🌐 **Assinar:** [tbc-agent-kit.totvstbc.com.br](https://tbc-agent-kit.totvstbc.com.br)

📨 **Contato:** devkit@totvstbc.com.br
