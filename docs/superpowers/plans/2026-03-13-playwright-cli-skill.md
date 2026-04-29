# Playwright CLI Skill Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar o plugin `playwright` no repositório TBC de skills, com a skill `playwright-cli` cobrindo setup, comandos CLI, test-agents (planner/generator/healer) e autenticação — sem dependência de MCP externo.

**Architecture:** Plugin standalone em `claude_skills/playwright/`, com `SKILL.md` como entry point contendo HARD GATE de verificação/instalação, delegando para arquivos de referência com conhecimento completo embutido (sem `search_knowledge`). Os templates ficam em `references/templates/` para uso direto.

**Tech Stack:** Markdown, Playwright CLI (`npx playwright`), TypeScript (templates), Node.js 18+

**Namespace:** `playwright:` → skill: `playwright-cli`

**Nota sobre `references/`:** Esta skill armazena todo o conhecimento diretamente em arquivos de referência (não usa `search_knowledge` MCP), diferente das skills fluig/protheus. Isso é intencional — a skill é independente de infraestrutura externa.

---

## Pré-execução: Branch strategy

- [ ] **Criar branch feature a partir de main**

```bash
cd /home/jv/developments/tbc/claude_skills
git checkout main
git pull
git checkout -b feature/playwright-plugin
```

---

## Chunk 1: Estrutura do plugin e CLAUDE.md

### Task 1: Criar estrutura de diretórios do plugin

**Files:**
- Create: `playwright/CLAUDE.md`
- Create: `playwright/README.md`
- Create: `playwright/skills/playwright-cli/SKILL.md`
- Create: `playwright/skills/playwright-cli/references/setup.md`
- Create: `playwright/skills/playwright-cli/references/cli-commands.md`
- Create: `playwright/skills/playwright-cli/references/test-agents.md`
- Create: `playwright/skills/playwright-cli/references/auth.md`
- Create: `playwright/skills/playwright-cli/references/templates/playwright.config.ts`
- Create: `playwright/skills/playwright-cli/references/templates/seed.spec.ts`
- Create: `playwright/skills/playwright-cli/references/templates/global-setup.ts`

- [ ] **Step 1: Criar `playwright/CLAUDE.md`**

```markdown
# CLAUDE.md

Plugin Claude Code para testes com **Playwright CLI**.

## Namespace

Skills com prefixo `playwright:` — ex: `/playwright:playwright-cli`

## Testar localmente

```bash
claude --plugin-dir /home/jv/developments/tbc/claude_skills/playwright
```

## Pré-requisitos

- Node.js 18+
- Playwright instalado no projeto (`npm init playwright@latest`)
- Browsers instalados (`npx playwright install`)

## Distribuição

`git@bitbucket-totvs:fabricatbc/claude_skills.git` · marketplace `claude-skills-tbc`
```

- [ ] **Step 2: Criar `playwright/README.md`**

Conteúdo completo de instalação:

```markdown
# playwright — Plugin Claude Code

Plugin com skill `playwright-cli` para setup, execução e geração de testes E2E com Playwright CLI, incluindo suporte ao fluxo test-agents (planner/generator/healer) integrado ao Claude Code.

## Pré-requisitos

| Requisito | Versão mínima |
|-----------|---------------|
| Node.js | 18+ |
| npm | 9+ |
| Claude Code | qualquer |

## Instalação do Playwright no projeto

### 1. Inicializar Playwright no projeto

```bash
npm init playwright@latest
```

Isso cria:
- `playwright.config.ts`
- `tests/example.spec.ts`
- `.github/workflows/playwright.yml` (opcional)

### 2. Instalar browsers

```bash
npx playwright install
```

Para instalar apenas um browser:

```bash
npx playwright install chromium
npx playwright install firefox
npx playwright install webkit
```

### 3. Verificar instalação

```bash
npx playwright --version
npx playwright test --list
```

### 4. (Opcional) Instalar test-agents com Claude Code

```bash
npx playwright init-agents --loop=claude
```

Isso configura o fluxo planner → generator → healer integrado ao Claude Code.

## Uso da skill

```
/playwright:playwright-cli
```

A skill verifica se o Playwright está instalado e guia o fluxo completo.

## Estrutura gerada pela skill

```
projeto/
  playwright.config.ts
  tests/
    seed.spec.ts        # teste de seed (ambiente inicial)
    *.spec.ts           # testes gerados pelo generator
  specs/
    *.md                # planos gerados pelo planner
  .env.test             # credenciais (nunca commitado)
  global-setup.ts       # autenticação global
```
```

- [ ] **Step 3: Commit da estrutura base**

```bash
cd /home/jv/developments/tbc/claude_skills
git add playwright/CLAUDE.md playwright/README.md
git commit -m "feat(playwright): add plugin structure with README and CLAUDE.md"
```

---

## Chunk 2: SKILL.md — entry point com HARD GATE

### Task 2: Criar o SKILL.md principal

**Files:**
- Modify: `playwright/skills/playwright-cli/SKILL.md`

- [ ] **Step 1: Criar `playwright/skills/playwright-cli/SKILL.md`**

```markdown
---
name: playwright-cli
description: Setup completo, CLI e test-agents do Playwright. Cobre instalação, playwright.config.ts, todos os comandos npx playwright, fluxo planner/generator/healer com --loop=claude, e autenticação via storageState. Use quando precisar criar, executar ou reparar testes E2E com Playwright CLI.
---

## HARD GATE — Antes de qualquer operação

Antes de gerar configuração, templates ou executar qualquer comando, você DEVE verificar se o Playwright está instalado no projeto atual:

```bash
npx playwright --version
```

**Se não estiver instalado** (erro de comando não encontrado):

```bash
npm init playwright@latest
npx playwright install
```

**Se browsers não estiverem instalados** (erro "Executable doesn't exist"):

```bash
npx playwright install
```

Confirme a instalação antes de prosseguir.

---

## Fluxo de decisão

### Novo projeto / primeiro setup
→ Consulte `references/setup.md` para configuração completa do `playwright.config.ts`

### Executar testes existentes
→ Consulte `references/cli-commands.md` para comandos, flags e filtros

### Gerar testes com IA (test-agents)
→ Consulte `references/test-agents.md` para fluxo planner → generator → healer

### Configurar autenticação
→ Consulte `references/auth.md` para storageState, globalSetup e variáveis de ambiente

---

## Regras Obrigatórias

- Credenciais **sempre** via variáveis de ambiente — nunca hardcoded
- `coverage/`, `test-results/`, `playwright-report/` nunca commitados
- `.env.test` sempre no `.gitignore`
- Todo spec deve cobrir ao menos um caso de erro
- E2E requer ambiente real acessível — nunca `localhost` em ambientes externos
```

- [ ] **Step 2: Commit do SKILL.md**

```bash
cd /home/jv/developments/tbc/claude_skills
git add playwright/skills/playwright-cli/SKILL.md
git commit -m "feat(playwright): add playwright-cli SKILL.md with HARD GATE and decision flow"
```

---

## Chunk 3: Referências — setup e CLI commands

### Task 3: Criar `references/setup.md`

**Files:**
- Create: `playwright/skills/playwright-cli/references/setup.md`

- [ ] **Step 1: Criar `references/setup.md`**

```markdown
# Setup — Playwright CLI

## Inicialização

```bash
npm init playwright@latest
```

Responda as perguntas:
- **TypeScript or JavaScript?** → TypeScript
- **Where to put your end-to-end tests?** → `tests`
- **Add a GitHub Actions workflow?** → depende do projeto
- **Install Playwright browsers?** → Yes

---

## playwright.config.ts — Configuração base

Use o template em `references/templates/playwright.config.ts`.

Principais seções:

### testDir
```ts
testDir: './tests',
```
Diretório onde ficam os `.spec.ts`.

### timeout
```ts
timeout: 30_000,  // 30s por teste
```

### retries
```ts
retries: process.env.CI ? 2 : 0,
```
2 retries em CI, 0 localmente.

### workers
```ts
workers: process.env.CI ? 1 : undefined,
```
Paralelo localmente, serial em CI.

### reporter
```ts
reporter: [['html'], ['list']],
```
Gera relatório HTML em `playwright-report/`.

### use (configurações globais)
```ts
use: {
  baseURL: process.env.BASE_URL || 'http://localhost:3000',
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
  trace: 'on-first-retry',
},
```

### globalSetup (quando usar autenticação)
```ts
globalSetup: require.resolve('./global-setup'),
```
Ver `references/auth.md` para configuração de autenticação global.

---

## Estrutura de pastas recomendada

```
projeto/
  playwright.config.ts
  global-setup.ts          # autenticação (se necessário)
  .env.test                # credenciais (no .gitignore)
  tests/
    seed.spec.ts           # setup inicial do ambiente
    auth.setup.ts          # gera storageState (se necessário)
    *.spec.ts              # testes de funcionalidade
  specs/
    *.md                   # planos do planner (test-agents)
  playwright-report/       # gerado, nunca commitado
  test-results/            # gerado, nunca commitado
```

---

## .gitignore — adicionar sempre

```gitignore
playwright-report/
test-results/
.env.test
/auth.json
```

---

## Estrutura mínima de um spec

```ts
import { test, expect } from '@playwright/test';

test.describe('Feature X', () => {
  test('deve fazer Y com sucesso', async ({ page }) => {
    await page.goto('/rota');
    await expect(page.getByText('Texto esperado')).toBeVisible();
  });

  test('deve exibir erro quando Z', async ({ page }) => {
    await page.goto('/rota-invalida');
    await expect(page.getByRole('alert')).toBeVisible();
  });
});
```
```

### Task 4: Criar `references/cli-commands.md`

**Files:**
- Create: `playwright/skills/playwright-cli/references/cli-commands.md`

- [ ] **Step 1: Criar `references/cli-commands.md`**

```markdown
# CLI Commands — Playwright

## Executar testes

| Comando | Descrição |
|---------|-----------|
| `npx playwright test` | Executa todos os testes |
| `npx playwright test tests/foo.spec.ts` | Arquivo específico |
| `npx playwright test foo bar` | Arquivos que contenham "foo" ou "bar" no nome |
| `npx playwright test tests/foo.spec.ts:42` | Linha específica |
| `npx playwright test -g "título do teste"` | Por título (regex) |

## Flags essenciais

| Flag | Descrição | Exemplo |
|------|-----------|---------|
| `--headed` | Abre o browser visível | `npx playwright test --headed` |
| `--debug` | Abre Playwright Inspector para debug | `npx playwright test --debug` |
| `--ui` | Modo interativo com UI (recomendado para dev) | `npx playwright test --ui` |
| `--project` | Roda em browser específico | `--project=chromium` |
| `--workers` | Controla paralelismo | `--workers=1` (serial) |
| `--retries` | Tentativas em falha | `--retries=2` |
| `--timeout` | Timeout por teste (ms) | `--timeout=60000` |
| `--reporter` | Formato de relatório | `--reporter=html` |
| `--grep` / `-g` | Filtrar por título | `-g "login"` |
| `--grep-invert` | Excluir por título | `--grep-invert "smoke"` |
| `--last-failed` | Roda apenas os que falharam por último | `--last-failed` |

## Exemplos práticos

```bash
# Rodar apenas testes de login no Chrome, com browser visível
npx playwright test tests/login.spec.ts --project=chromium --headed

# Debug de um teste específico
npx playwright test tests/login.spec.ts:15 --debug

# UI mode para desenvolvimento (melhor experiência)
npx playwright test --ui

# Roda serial (sem paralelismo) — útil quando há dependência de estado
npx playwright test --workers=1

# Apenas testes marcados como @smoke
npx playwright test -g "@smoke"

# Ver relatório HTML do último run
npx playwright show-report
```

## Outros comandos úteis

```bash
# Instalar/atualizar browsers
npx playwright install

# Instalar browser específico
npx playwright install chromium

# Listar todos os testes sem executar
npx playwright test --list

# Gerar código gravando ações no browser (codegen)
npx playwright codegen http://localhost:3000

# Ver versão
npx playwright --version
```

## Scripts package.json recomendados

```json
{
  "scripts": {
    "test:e2e": "npx playwright test",
    "test:e2e:ui": "npx playwright test --ui",
    "test:e2e:debug": "npx playwright test --debug",
    "test:e2e:headed": "npx playwright test --headed",
    "test:e2e:report": "npx playwright show-report"
  }
}
```
```

- [ ] **Step 2: Commit das referências de setup e CLI**

```bash
cd /home/jv/developments/tbc/claude_skills
git add playwright/skills/playwright-cli/references/setup.md
git add playwright/skills/playwright-cli/references/cli-commands.md
git commit -m "feat(playwright): add setup and cli-commands references"
```

---

## Chunk 4: Referências — test-agents e auth

### Task 5: Criar `references/test-agents.md`

**Files:**
- Create: `playwright/skills/playwright-cli/references/test-agents.md`

- [ ] **Step 1: Criar `references/test-agents.md`**

```markdown
# Test Agents — Playwright + Claude Code

O Playwright oferece três agentes de IA nativos que se integram diretamente com o Claude Code via `--loop=claude`.

## Inicialização

```bash
npx playwright init-agents --loop=claude
```

Isso configura o ambiente para usar os agentes com Claude Code como LLM.

---

## Os três agentes

### 1. Planner
Analisa a aplicação e gera **planos de teste em Markdown** na pasta `specs/`.

**Entrada:**
- Requisição em linguagem natural (o que testar)
- Um `seed.spec.ts` que configura o ambiente (login, estado inicial)
- Opcional: documento de requisitos (PRD)

**Saída:**
```
specs/
  basic-operations.md
  error-handling.md
  user-flow.md
```

**Formato do plano gerado:**
```markdown
## Test: Adicionar item válido
1. Navegar para /todos
2. Clicar em "Add Todo"
3. Digitar "Comprar leite" no campo de texto
4. Pressionar Enter
5. Verificar que "Comprar leite" aparece na lista
```

---

### 2. Generator
Transforma os planos Markdown em **testes Playwright executáveis** (`.spec.ts`).

**Entrada:** Arquivo `.md` em `specs/`

**Saída:**
```
tests/
  add-valid-todo.spec.ts
  error-handling.spec.ts
```

O generator **valida seletores e asserções** durante a execução — ele abre o browser, localiza elementos e confirma que existem antes de escrever o código.

---

### 3. Healer
Quando testes falham por mudanças na UI, o healer **repara automaticamente**.

**Processo:**
1. Reproduz as etapas que falharam
2. Inspeciona a interface para localizar elementos equivalentes
3. Sugere patches (atualização de locators, ajuste de esperas)
4. Re-executa até passar ou atingir o limite de tentativas

**Uso:**
```bash
npx playwright test --last-failed
# O healer entra em ação automaticamente quando --loop=claude está configurado
```

---

## Estrutura de artefatos

```
projeto/
  specs/                    # planos Markdown (planner)
    basic-operations.md
  tests/
    seed.spec.ts            # teste de seed (OBRIGATÓRIO para agents)
    add-valid-todo.spec.ts  # gerado pelo generator
  playwright.config.ts
```

---

## seed.spec.ts — ponto de partida

O seed é o teste mais simples possível que confirma que o ambiente está funcionando. Use o template em `references/templates/seed.spec.ts`.

**O seed deve:**
- Navegar para a URL base da aplicação
- Confirmar que a página carregou (elemento visível)
- Fazer login se necessário (ver `references/auth.md`)
- Ser o mais simples possível — o planner parte daqui

---

## Fluxo completo com Claude Code

```
1. Criar seed.spec.ts
2. npx playwright init-agents --loop=claude
3. Descrever o que testar para o Claude
4. Planner gera specs/*.md
5. Generator cria tests/*.spec.ts
6. npx playwright test (executar)
7. Se falhar → Healer repara automaticamente
```
```

### Task 6: Criar `references/auth.md`

**Files:**
- Create: `playwright/skills/playwright-cli/references/auth.md`

- [ ] **Step 1: Criar `references/auth.md`**

```markdown
# Autenticação — Playwright CLI

## Abordagem recomendada: storageState

O Playwright reutiliza o estado de autenticação (cookies + localStorage) entre testes para evitar login repetido.

**Fluxo:**
1. `auth.setup.ts` faz login uma vez e salva em `auth.json`
2. Todos os outros specs usam `storageState: 'auth.json'`
3. `auth.json` está no `.gitignore`

---

## Configuração no playwright.config.ts

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  globalSetup: require.resolve('./global-setup'),

  projects: [
    // Projeto de setup — roda primeiro, gera auth.json
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    // Projeto principal — depende do setup
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'auth.json',  // reutiliza autenticação
      },
      dependencies: ['setup'],
    },
  ],
});
```

---

## auth.setup.ts — gera o storageState

```ts
import { test as setup } from '@playwright/test';

setup('autenticar', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Usuário').fill(process.env.TEST_USER!);
  await page.getByLabel('Senha').fill(process.env.TEST_PASSWORD!);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL('/dashboard');

  // Salva o estado de autenticação
  await page.context().storageState({ path: 'auth.json' });
});
```

---

## Variáveis de ambiente — .env.test

Crie `.env.test` (nunca commitar):

```bash
TEST_USER=usuario@empresa.com
TEST_PASSWORD=senha_segura
BASE_URL=https://app.empresa.com
```

Carregar no `playwright.config.ts`:

```ts
import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });
```

---

## globalSetup — autenticação com API (mais rápido)

Para sistemas com API de login, autenticar via API é mais rápido que via browser:

Use o template em `references/templates/global-setup.ts`.

---

## Regras de segurança

- `auth.json` SEMPRE no `.gitignore`
- `.env.test` SEMPRE no `.gitignore`
- Nunca hardcodar usuário/senha em specs ou configurações
- Em CI: usar secrets do GitHub/GitLab — nunca variáveis plain text em logs
- Nunca logar `process.env.TEST_PASSWORD` em nenhuma circunstância
```

- [ ] **Step 2: Commit das referências de agents e auth**

```bash
cd /home/jv/developments/tbc/claude_skills
git add playwright/skills/playwright-cli/references/test-agents.md
git add playwright/skills/playwright-cli/references/auth.md
git commit -m "feat(playwright): add test-agents and auth references"
```

---

## Chunk 5: Templates

### Task 7: Criar templates

**Files:**
- Create: `playwright/skills/playwright-cli/references/templates/playwright.config.ts`
- Create: `playwright/skills/playwright-cli/references/templates/seed.spec.ts`
- Create: `playwright/skills/playwright-cli/references/templates/global-setup.ts`

- [ ] **Step 1: Criar `templates/playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['html'],
    ['list'],
  ],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },

  projects: [
    // Descomentar se precisar de autenticação global:
    // {
    //   name: 'setup',
    //   testMatch: /.*\.setup\.ts/,
    // },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      // dependencies: ['setup'],  // descomentar com auth
      // use: { storageState: 'auth.json' },  // descomentar com auth
    },
    // Descomentar para multi-browser:
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],
});
```

- [ ] **Step 2: Criar `templates/seed.spec.ts`**

```ts
import { test, expect } from '@playwright/test';

/**
 * Seed test — ponto de partida para o test-agents (planner/generator)
 * Deve ser o teste mais simples que confirma que o ambiente está acessível.
 * Adapte a URL e o seletor para a aplicação real.
 */
test('ambiente acessível', async ({ page }) => {
  await page.goto('/');
  // Adapte para um elemento que confirme que a app carregou
  await expect(page).toHaveTitle(/.+/);
});
```

- [ ] **Step 3: Criar `templates/global-setup.ts`**

```ts
import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup — executa uma vez antes de todos os testes
 * Útil para autenticação via API (mais rápido que via browser)
 * Referenciado em playwright.config.ts: globalSetup: './global-setup'
 */
async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;

  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(`${baseURL}/login`);
  await page.getByLabel('Usuário').fill(process.env.TEST_USER!);
  await page.getByLabel('Senha').fill(process.env.TEST_PASSWORD!);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL(`${baseURL}/dashboard`);

  // Salva estado de autenticação para todos os testes
  await page.context().storageState({ path: 'auth.json' });
  await browser.close();
}

export default globalSetup;
```

- [ ] **Step 4: Commit dos templates**

```bash
cd /home/jv/developments/tbc/claude_skills
git add playwright/skills/playwright-cli/references/templates/
git commit -m "feat(playwright): add playwright.config.ts, seed.spec.ts and global-setup.ts templates"
```

---

## Chunk 6: Validação local e publicação

### Task 8: Testar plugin localmente

**Files:**
- (nenhum arquivo novo — apenas testes)

- [ ] **Step 1: Testar plugin com --plugin-dir**

```bash
cd /home/jv/developments/tbc/claude_skills
claude --plugin-dir /home/jv/developments/tbc/claude_skills/playwright --print "liste as skills disponíveis"
```

Saída esperada: linha contendo `playwright:playwright-cli` na listagem de skills.

- [ ] **Step 2: Verificar SKILL.md carrega sem erro**

```bash
claude --plugin-dir /home/jv/developments/tbc/claude_skills/playwright --print "/playwright:playwright-cli" 2>&1 | head -30
```

Saída esperada: texto contendo "HARD GATE" e "npx playwright --version" sem mensagens de erro como "skill not found", "parse error" ou "YAML error".

- [ ] **Step 3: Abrir PR para branch main**

```bash
cd /home/jv/developments/tbc/claude_skills
git push -u origin feature/playwright-plugin
gh pr create --title "feat(playwright): add playwright-cli plugin" \
  --body "Novo plugin playwright com skill playwright-cli cobrindo setup, CLI commands, test-agents (planner/generator/healer) e autenticação. Sem dependência de MCP externo."
```

### Task 9: Habilitar plugin após merge

**Files:**
- Modify: `~/.claude/settings.json`

- [ ] **Step 1: Após merge do PR, atualizar marketplace**

```bash
claude plugins update claude-skills-tbc
```

- [ ] **Step 2: Habilitar plugin nas settings**

Adicionar em `/home/jv/.claude/settings.json` na seção `plugins`:

```json
"playwright@claude-skills-tbc": true
```

- [ ] **Step 3: Validar em nova sessão**

Abrir nova sessão Claude Code e executar:

```
/playwright:playwright-cli
```

Saída esperada: texto começando com "HARD GATE — Antes de qualquer operação" e o comando `npx playwright --version`. Sem mensagem "skill not found" ou "unknown skill".

---

## Ordem de execução resumida

0. Pré-execução — criar branch `feature/playwright-plugin`
1. Chunk 1 — Estrutura base (CLAUDE.md + README.md)
2. Chunk 2 — SKILL.md entry point com HARD GATE
3. Chunk 3 — References: setup + cli-commands
4. Chunk 4 — References: test-agents + auth
5. Chunk 5 — Templates: playwright.config.ts + seed.spec.ts + global-setup.ts
6. Chunk 6 — Validação local (`--plugin-dir`) + PR
7. Pós-merge — atualizar marketplace + habilitar nas settings
