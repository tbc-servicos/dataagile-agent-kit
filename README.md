<div align="center">

<br/>

# DA DataAgile Agent Kit

[![Versão](https://img.shields.io/badge/versão-2.1.0-1a4d5c?style=flat-square&logoColor=white)](https://github.com/tbc-servicos/dataagile-agent-kit/releases)
[![Claude Code](https://img.shields.io/badge/Claude_Code-plugin-CC785C?style=flat-square&logoColor=white)](https://claude.ai/code)
[![Protheus](https://img.shields.io/badge/Protheus-ADVPL%2FTLPP-1a4d5c?style=flat-square&logoColor=white)](https://dataagile-agent-kit.dataagile.com.br)
[![PO--UI MCP](https://img.shields.io/badge/PO--UI-MCP-22C55E?style=flat-square&logoColor=white)](https://po-ui.io)
[![Licença](https://img.shields.io/badge/licença-MIT-475569?style=flat-square)](./LICENSE)

<br/>

### Protheus e ADVPL dentro do Claude Code — sem sair do terminal.

*DataAgile · Base de conhecimento curada · Agent Teams · Compilação TDS-CLI · Testes TIR*

<br/>

[**Assinar →**](https://dataagile-agent-kit.dataagile.com.br) &nbsp;&nbsp;·&nbsp;&nbsp; [Instalação](./INSTALL.md) &nbsp;&nbsp;·&nbsp;&nbsp; [dev@dataagile.com.br](mailto:dev@dataagile.com.br)

</div>

---

## O problema

Você abre o Claude e pergunta sobre Protheus. Ele responde com segurança. Você cola no ambiente:

```
Function 'ExecBlock' not found at line 47.
```

Acontece porque o modelo não conhece as assinaturas reais, os Pontos de Entrada do seu módulo, nem os parâmetros da sua versão do Protheus.

**O dataagile-agent-kit resolve isso.** O Claude passa a consultar uma base técnica curada com 155k+ registros Protheus — e cita a referência certa, com a assinatura correta.

---

## Para quem é

| Perfil | O que ganha |
|--------|-------------|
| **Dev ADVPL/TLPP** | Brainstorm → plano → implementação via Agent Team → compilação → testes TIR, tudo no terminal |
| **Suporte técnico** | Diagnóstico de erro ERP por categoria, causa raiz identificada, resolução estruturada |
| **Dev front Protheus** | MCP PO-UI nativo — componentes Angular com assinaturas corretas, sem consultar docs manualmente |

---

## Instalação rápida

**Pré-requisito:** API key em [dataagile-agent-kit.dataagile.com.br](https://dataagile-agent-kit.dataagile.com.br)

### Claude Code

```bash
# 1 — Instalar o Claude Code
npm install -g @anthropic-ai/claude-code

# 2 — Configurar a API key
mkdir -p ~/.config/dataagile
echo '{ "api_key": "SUA_CHAVE_AQUI" }' > ~/.config/dataagile/dev-config.json

# 3 — Instalar o plugin
claude plugin marketplace add https://github.com/tbc-servicos/dataagile-agent-kit.git
claude plugin install protheus@claude-skills-dataagile

# 4 — Usar
cd ~/seu-projeto-protheus
claude
# /protheus:brainstorm   → nova feature
# /protheus:suporte      → diagnosticar erro ERP
```

### Codex CLI / Gemini CLI

```bash
# Instalador automático — detecta os CLIs instalados,
# pede a API key e configura tudo em um comando.
npx github:tbc-servicos/dataagile-agent-kit
```

O instalador irá perguntar sua API key durante a execução. Após instalar, carregue uma skill na sessão:

```
get_skill({ name: "protheus:specialist" })
```

Cole o conteúdo retornado no seu system prompt para ativar o skill.

> Guia completo com todos os CLIs, troubleshooting e desinstalação: [INSTALL.md](./INSTALL.md)

---

## Comandos

### Ciclo de desenvolvimento

```
/protheus:brainstorm  → intake técnico, design aprovado antes do código
/protheus:plan        → decompõe design em tasks ADVPL tipadas
/protheus:implement   → Agent Team: implementer → spec-reviewer → reviewer
/protheus:deploy      → compila no AppServer via TDS-CLI, gera patch .ptm
/protheus:qa          → testes TIR E2E no ambiente compilado
/protheus:verify      → checklist Protheus antes de produção
```

### Utilitários

```
/protheus:writer      → gera código ADVPL/TLPP com notação húngara e MVC
/protheus:specialist  → consulta base técnica: funções, PEs, parâmetros
/protheus:reviewer    → revisão CRÍTICO / AVISO / SUGESTÃO
/protheus:diagnose    → erros de compilação, runtime e performance
/protheus:sql         → SQL embarcado (BeginSQL/EndSQL, macros)
/protheus:migrate     → ADVPL procedural → TLPP orientado a objetos
```

### Suporte técnico

```
/protheus:suporte     → diagnóstico de erro ERP com causa raiz e resolução
/protheus:diagnose    → diagnóstico técnico detalhado
/protheus:specialist  → identifica função, PE ou parâmetro exato
```

---

## MCP Servers incluídos

| Server | Função |
|--------|--------|
| `tbc-knowledge` | Base ADVPL remota — `searchFunction`, `findEndpoint`, `findSmartView`, `findExecAuto`, `findMvcPattern` e mais 4 tools |
| `local-knowledge-external` | Base offline de conhecimento técnico ADVPL/TLPP curado e docs Protheus |
| `po-ui` | MCP oficial PO-UI — componentes Angular para fronts Protheus, inputs, outputs e exemplos |

---

## Fluxo recomendado

```
/protheus:brainstorm
        ↓
/protheus:plan
        ↓
/protheus:implement   ←── Agent Team (worktree isolado)
        ↓                  implementer (haiku)
/protheus:deploy           spec-reviewer (sonnet)
        ↓                  reviewer (sonnet)
/protheus:qa
        ↓
/protheus:verify
```

---

<div align="center">

**DataAgile**

[![Assinar um plano](https://img.shields.io/badge/Assinar_um_plano-003CA6?style=for-the-badge&logoColor=white)](https://dataagile-agent-kit.dataagile.com.br)
[![Documentação](https://img.shields.io/badge/Documentação-475569?style=for-the-badge&logoColor=white)](./INSTALL.md)
[![Contato](https://img.shields.io/badge/dev@dataagile.com.br-1E293B?style=for-the-badge&logoColor=white)](mailto:dev@dataagile.com.br)

</div>
