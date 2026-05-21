# Changelog

Histórico das versões públicas do `dataagile-agent-kit`.

---

## [2.2.0] — 2026-05-21

### Adicionado
- **Suporte cross-platform** — Codex CLI e Gemini CLI além do Claude Code
- **Instalador npm** (`installer/index.js`) — detecta CLIs instalados automaticamente, registra o MCP server e pede a API key interativamente; suporte a `--dry-run`
- **`get_skill` MCP tool** — carrega qualquer SKILL.md sob demanda via `get_skill({ name: "protheus:specialist" })`; skills públicas (protheus, fluig) disponíveis para todos os tiers; skills privadas (mit-docs) só para tier interno
- **INSTALL.md** — guia completo zero-contexto: Claude Code, Codex CLI, Gemini CLI, pré-requisitos, uso de skills, troubleshooting (5 entradas), desinstalação
- **package.json** com `"bin"` entry para suporte a `npx github:tbc-servicos/dataagile-agent-kit`

### Alterado
- ONBOARDING.md substituído por INSTALL.md como documento primário de instalação

---

## [2.1.0] — 2026-05-05

### Adicionado
- `/protheus:suporte` — diagnóstico de erro ERP por categoria (parametrização, integridade de dados, runtime, performance, ambiente), identifica causa raiz e gera resposta estruturada

---

## [2.0.8] — 2026-04-29

Primeira release pública no GitHub.

### Plugins disponíveis

| Plugin | Versão | O que faz |
|--------|--------|-----------|
| **protheus** | `2.0.8` | ADVPL/TLPP — brainstorm, plan, implement (Agent Teams), deploy TDS-CLI, QA TIR |
| **playwright** | `1.0.0` | Testes E2E — test agents (planner/generator/healer) + autenticação storageState |

---

## Versionamento

Semver por plugin (`MAJOR.MINOR.PATCH`):

- **MAJOR** — mudanças incompatíveis de interface
- **MINOR** — novas features compatíveis
- **PATCH** — correções e ajustes

---

## Suporte

dev@dataagile.com.br

[knowledge.dataagile.com.br](https://knowledge.dataagile.com.br)

[Issues no GitHub](https://github.com/tbc-servicos/dataagile-agent-kit/issues)
