<div align="center">

<br/>

```
████████╗██████╗  ██████╗
╚══██╔══╝██╔══██╗██╔════╝
██║   ██████╔╝██║
██║   ██╔══██╗██║
   ██║   ██████╔╝╚██████╗
   ╚═╝   ╚═════╝  ╚═════╝
```

**Agent Kit**

[![Versão](https://img.shields.io/badge/versão-2.1.0-003CA6?style=flat-square&logoColor=white)](https://github.com/tbc-servicos/dataagile-agent-kit/releases)
[![Claude Code](https://img.shields.io/badge/Claude_Code-plugin-CC785C?style=flat-square&logoColor=white)](https://claude.ai/code)
[![TOTVS](https://img.shields.io/badge/TOTVS-Protheus-003CA6?style=flat-square&logoColor=white)](https://www.totvs.com)
[![PO--UI MCP](https://img.shields.io/badge/PO--UI-MCP-22C55E?style=flat-square&logoColor=white)](https://po-ui.io)
[![Licença](https://img.shields.io/badge/licença-MIT-475569?style=flat-square)](./LICENSE)

<br/>

### Protheus e ADVPL dentro do Claude Code — sem sair do terminal.

*Plugin oficial TBC · Base de conhecimento curada · Agent Teams · Compilação TDS-CLI · Testes TIR*

<br/>

[**Assinar →**](https://knowledge.dataagile.com.br) &nbsp;&nbsp;·&nbsp;&nbsp; [Onboarding](./ONBOARDING.md) &nbsp;&nbsp;·&nbsp;&nbsp; [dev@dataagile.com.br](mailto:dev@dataagile.com.br)

</div>

---

## O problema

Você abre o Claude e pergunta sobre Protheus. Ele responde com segurança. Você cola no ambiente:

```
Function 'ExecBlock' not found at line 47.
```

Acontece porque o modelo não conhece as assinaturas reais, os Pontos de Entrada do seu módulo, nem os parâmetros da sua versão do Protheus.

**O dataagile-agent-kit resolve isso.** O Claude passa a consultar uma base técnica curada com 155k+ registros TOTVS — e cita a referência certa, com a assinatura correta.

---

## Para quem é

| Perfil | O que ganha |
|--------|-------------|
| **Dev ADVPL/TLPP** | Brainstorm → plano → implementação via Agent Team → compilação → testes TIR, tudo no terminal |
| **Suporte técnico** | Diagnóstico de erro ERP por categoria, causa raiz identificada, resolução estruturada |
| **Dev front Protheus** | MCP PO-UI nativo — componentes Angular com assinaturas corretas, sem consultar docs manualmente |

---

## Instalação rápida

**Pré-requisito:** API key em [knowledge.dataagile.com.br](https://knowledge.dataagile.com.br)

**1 — Instalar o Claude Code**

```bash
npm install -g @anthropic-ai/claude-code
```

**2 — Configurar a API key**

```bash
# macOS / Linux
mkdir -p ~/.config/dataagile
echo '{ "api_key": "dataagile_SUA_CHAVE_AQUI" }' > ~/.config/dataagile/dev-config.json
```

```powershell
# Windows (PowerShell)
New-Item -ItemType Directory -Force "$env:USERPROFILE\.config\dataagile" | Out-Null
'{ "api_key": "dataagile_SUA_CHAVE_AQUI" }' | Set-Content "$env:USERPROFILE\.config\dataagile\dev-config.json"
```

**3 — Instalar o plugin**

```bash
claude plugin marketplace add https://github.com/tbc-servicos/dataagile-agent-kit.git
claude plugin install protheus@claude-skills-dataagile
```

**4 — Usar**

```bash
cd ~/seu-projeto-protheus
claude
# /protheus:brainstorm   → nova feature
# /protheus:suporte      → diagnosticar erro ERP
```

> Guia detalhado com troubleshooting e Claude Desktop: [ONBOARDING.md](./ONBOARDING.md)

---

## Comandos

### Ciclo de desenvolvimento

```
/protheus:brainstorm  → intake técnico, design aprovado antes do código
/protheus:plan        → decompõe design em tasks ADVPL tipadas
/protheus:implement   → Agent Team: implementer → spec-reviewer → reviewer
/protheus:deploy      → compila no AppServer via TDS-CLI, gera patch .ptm
/protheus:qa          → testes TIR E2E no ambiente compilado
/protheus:verify      → checklist TOTVS antes de produção
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
| `local-knowledge-external` | Base offline de conhecimento técnico ADVPL/TLPP curado e docs TOTVS |
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

**TBC — Fábrica de Software & Inovação TOTVS Brasil Central**

[![Assinar um plano](https://img.shields.io/badge/Assinar_um_plano-003CA6?style=for-the-badge&logoColor=white)](https://knowledge.dataagile.com.br)
[![Documentação](https://img.shields.io/badge/Documentação-475569?style=for-the-badge&logoColor=white)](./ONBOARDING.md)
[![Contato](https://img.shields.io/badge/dev@dataagile.com.br-1E293B?style=for-the-badge&logoColor=white)](mailto:dev@dataagile.com.br)

</div>
