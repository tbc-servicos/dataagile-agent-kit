# 📊 Changelog — Claude Skills TBC

Histórico de evolução do projeto de plugins Claude Code para TOTVS.

---

## [1.0.0-github-launch] - 2026-04-29

### Migração Bitbucket → GitHub Público

- **Repo migrado:** `bitbucket.org/fabricatbc/claude_skills` → `github.com/tbc-servicos/tbc-knowledge-plugins`
- **Acesso:** público via HTTPS (sem necessidade de chaves SSH); SSH ainda funciona pra devs internos como alternativa
- **Modelo de monetização:** repo público é o "shell" do plugin; conteúdo proprietário (knowledge base ADVPL/Fluig, fontes TOTVS) é gateado pelo `auth_server_skills` em `mcp.totvstbc.com.br` via MCP — trial automático de 30 dias para clientes externos, fluxo de pagamento manual via "Falar com a TBC" em `/payment`
- **Versões dos plugins mantidas** (fluig 2.0.5, protheus 2.0.8, etc.) — só o repo ganha a tag `v1.0.0-github-launch`
- **Auto-healing no hook `marketplace-update.sh`:** detecta marketplace antigo apontando pro Bitbucket e troca automaticamente para a URL nova
- **Plugins novos no marketplace:** `discli` (Discord CLI) e `tempo` (Google Calendar ↔ Tempo.io)

### Cleanup
- Pastas cliente-específicas removidas do repo público: `cassi/`, `temp_apagar/`
- Design docs internos removidos: `.genie/wishes/tbc-devai-launch/`, `.genie/brainstorms/skills-platform-external/`
- URLs internas (`mcp.totvstbc.com.br`) parametrizadas via env vars (`TBC_MCP_URL`, `TBC_TAE_MCP_URL`) com fallback para os defaults TBC
- `tempo` — projeto Jira default agora vem de `TEMPO_DEFAULT_JIRA_PROJECT` (era hardcoded `DAI`)
- Emails pessoais e exemplos didáticos genericados (`@empresa.com`, `@example.com`)

---

## [1.5.0] - 2026-03-12

### Added
- **advpl-knowledge MCP server**: SQLite-based knowledge base parsed from 11,928+ Protheus standard sources with AES-256-GCM encryption
- **Auth server (Docker)**: Email whitelist, access logging, admin panel with user management and log viewer
- **advpl-specialist skill**: Specialist workflow that queries MCP (fontes + knowledge + docs) + RAG for quality code generation
- **update-knowledge skill**: Automates cloning, parsing, encrypting, and publishing the knowledge base
- **10 MCP query tools**: search_function, find_endpoint, find_smartview, find_exec_auto, find_mvc_pattern, list_modules, search_by_table, search_knowledge, search_documents, get_credentials
- **PDF parser**: Extracts and indexes training material from docs/material_treinamento/

### Changed
- All 13 Protheus + Fluig skills stripped of inline knowledge — now reference encrypted MCP database
- RAG API credentials moved from hardcoded in skills to auth server distribution
- Plugin version bumped to 1.5.0

### Security
- Knowledge base encrypted with AES-256-GCM — useless without auth server approval
- 7-day auth cache with automatic revalidation
- Access logging with denied attempt tracking for leak investigation
- Admin panel for user lifecycle management (add, expire, revoke)

---

## 🚀 [1.4.0] Protheus + [1.3.0] Fluig — 2026-03-11

### ✨ Novidades

#### 🔍 Integração com RAG API — Busca Semântica em TDN

**Objetivo:** Validar e complementar respostas das skills com informações atualizadas do TDN (TOTVS Developer Network).

**O que mudou:**
- ✅ Todas as 22 skills (12 Protheus + 10 Fluig) agora possuem fallback para API de RAG
- ✅ Seção `📚 Consulta à Base de Conhecimento (TDN)` em cada skill
- ✅ Endpoint: `POST https://agentescraping.totvstbc.com.br/api/ask`
- ✅ Busca semântica para perguntas não cobertas na documentação local

**Skills Protheus atualizadas (v1.4.0):**
1. `advpl-patterns` — Referência de padrões ADVPL/TLPP
2. `advpl-writer` — Geração de código ADVPL/TLPP
3. `advpl-sql` — Referência SQL em ADVPL
4. `protheus-test` — Testes E2E com TIR 2.x
5. `protheus-brainstorm` — Planejamento de desenvolvimento
6. `protheus-reviewer` — Revisão de código ADVPL/TLPP
7. `protheus-diagnose` — Diagnóstico de erros
8. `protheus-migrate` — Migração ADVPL → TLPP
9. `protheus-compile` — Compilação TDS-CLI
10. `protheus-subagent-dev` — Orquestração de subagentes
11. `protheus-writing-plans` — Planejamento detalhado
12. `protheus-init-project` — Inicialização de projetos

**Skills Fluig atualizadas (v1.3.0):**
1. `fluig-api-ref` — Referência de APIs Fluig
2. `fluig-dataset` — Datasets JavaScript
3. `fluig-widget` — Widgets Angular 19 + PO-UI
4. `fluig-form` — Formulários HTML
5. `fluig-workflow` — Eventos BPM
6. `fluig-brainstorm` — Planejamento Fluig
7. `fluig-review` — Revisão de código Fluig
8. `fluig-verify` — Verificação pré-deploy
9. `fluig-test` — Testes E2E Playwright
10. `fluig-init-project` — Inicialização de projetos

---

### 🔧 Melhorias

#### SSH Bitbucket Simplificado
- ❌ Removido alias personalizado `bitbucket-totvs`
- ✅ Usando `git@bitbucket.org` direto (padrão)
- ✅ Chave SSH padrão (`id_ed25519`)
- ✅ Sem necessidade de `~/.ssh/config` customizado

#### Instalação TDS-LS Documentada Corretamente
- ✅ **Opção 1:** `npm install @totvs/tds-ls --save-dev` (recomendado)
- ✅ **Opção 2:** Download binário portátil (GitHub Releases)
- ✅ **Opção 3:** Usar TDS-VSCode bundled
- ✅ Seção de troubleshooting para problemas de PATH

---

### 📝 Documentação

#### Plano de Implementação
- **Arquivo:** `docs/plans/2026-03-11-rag-api-integration.md`
- **Tamanho:** 898 linhas
- **Detalhe:** 23 tasks documentadas (22 skills + 1 validação)
- **Formato:** TDD com steps explícitos para cada skill

#### Commits
- **Total:** 24 novos commits
- **23 commits RAG API:** Um por skill + sumário
- **1 commit README:** SSH + TDS-LS
- **Mensagens:** Descritivas e rastreáveis

---

## 📊 Métricas de Evolução

| Métrica | Antes | Depois | Mudança |
|---------|-------|--------|---------|
| Skills Protheus | 12 | 12 | +RAG API |
| Skills Fluig | 10 | 10 | +RAG API |
| Cobertura RAG | 0% | 100% | ✅ |
| Versão Protheus | 1.3.1 | 1.4.0 | Minor bump |
| Versão Fluig | 1.2.1 | 1.3.0 | Minor bump |
| Documentação TDS | Simples | Completa | +Troubleshooting |

---

## 🎯 Benefícios

### Para Desenvolvedores
- ✅ Respostas validadas contra TDN atual
- ✅ Busca semântica em documentação oficial
- ✅ Fallback automático quando skill não cobre pergunta
- ✅ Instalação TDS mais clara com múltiplas opções

### Para Equipe TBC
- ✅ 22 skills sincronizadas com conhecimento central
- ✅ Redução de divergência entre documentação local e TDN
- ✅ Melhor experiência de setup (SSH simplificado)
- ✅ Preparação para integração com n8n RAG

### Para Clientes
- ✅ Melhor precisão nas respostas dos agentes
- ✅ Informações sempre atualizadas
- ✅ Menos necessidade de pesquisa manual no TDN

---

## 🔗 Integração com Infraestrutura Existente

**API de RAG:**
```
POST https://agentescraping.totvstbc.com.br/api/ask
Content-Type: application/json

{
  "question": "Como criar um dataset com constraint dinâmico no Fluig?"
}
```

**Funcionalidade:**
- Scraping em tempo real do TDN
- Busca semântica com contexto
- Respostas estruturadas

---

## 🚀 Próximos Passos

1. **Deploy:** Atualizar plugins no marketplace privado
2. **Comunicação:** Notificar equipe sobre RAG API fallback
3. **Monitoramento:** Acompanhar uso da API de RAG
4. **Iteração:** Adicionar mais fontes de conhecimento conforme necessário

---

## 🏷️ Versionamento

**Versão Semântica:**
- `MAJOR.MINOR.PATCH`
- **MINOR bump** quando há novas features (como RAG API)
- **PATCH bump** para bug fixes
- **MAJOR bump** para mudanças breaking

**Versões Atuais:**
- Protheus: **1.4.0** (feature: RAG API)
- Fluig: **1.3.0** (feature: RAG API)

---

**Última atualização:** 2026-03-11
**Repositório:** https://bitbucket.org/fabricatbc/claude_skills
**Marketplace:** `claude-skills-tbc`
