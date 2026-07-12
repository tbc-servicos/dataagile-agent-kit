<div align="center">

🗺️ **[Fluxo de trabalho visual](./FLUXO-DE-TRABALHO.md)** — mapa mental (Mermaid) do ciclo Protheus e Fluig, gates e onde `/clean-architecture` e `/ddd` entram.

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

```bash
npx github:tbc-servicos/dataagile-agent-kit
```

Funciona em **Claude Code**, **Codex CLI** e **Gemini CLI**. O instalador detecta o CLI instalado, pede a API key e configura tudo automaticamente — instala todos os plugins disponíveis (protheus, fluig, playwright, po-ui). Se algum passo falhar, exibe os comandos exatos para executar manualmente.

### Instalar via IA

Cole este prompt no **Claude Code**:

```
Execute os comandos abaixo para instalar o marketplace DataAgile e todos os plugins disponíveis globalmente:

claude plugin marketplace add https://github.com/tbc-servicos/dataagile-agent-kit.git
claude plugin install protheus@claude-skills-dataagile
claude plugin install fluig@claude-skills-dataagile
claude plugin install po-ui@claude-skills-dataagile
claude plugin install playwright@claude-skills-dataagile

Após cada comando, confirme se foi bem-sucedido. No final, rode "claude plugin list" e me mostre os plugins instalados.
```

Depois configure sua chave de API (substitua `SUA_CHAVE`):

```bash
mkdir -p ~/.config/dataagile && echo '{"api_key":"SUA_CHAVE"}' > ~/.config/dataagile/dev-config.json
```

> Guia completo por CLI, troubleshooting e desinstalação: [INSTALL.md](./INSTALL.md)

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
