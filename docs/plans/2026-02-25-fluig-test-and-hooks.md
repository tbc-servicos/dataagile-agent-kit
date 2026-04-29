# fluig-test Skill + Hooks de Qualidade — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Criar o skill `fluig-test` (unit Jasmine/Karma + E2E Playwright contra servidor Fluig real) e dois hooks de qualidade para o plugin Fluig (`fluig-lint.sh` + `fluig-ts-preference.sh`).

**Architecture:** O skill `fluig-test` orienta geração de specs Jasmine/Karma para unit tests e specs Playwright para E2E — o E2E exige build + deploy no Fluig antes de executar, e sempre questiona a URL do servidor. Os hooks espelham o padrão global do usuário (`quality-check.sh` + `ts-preference.sh`) adaptados para projetos Angular/PO-UI.

**Tech Stack:** Angular 19, PO-UI 19.36.0, Jasmine, Karma, Istanbul, Playwright, jq, bash

---

## Task 1: Criar skill fluig-test

**Files:**
- Create: `fluig/skills/fluig-test/SKILL.md`

**Step 1: Criar o arquivo SKILL.md**

```markdown
---
name: fluig-test
description: Gera e orienta execução de testes para widgets TOTVS Fluig. Unit tests com Jasmine + Karma e E2E com Playwright contra servidor Fluig real. Sempre questiona a URL do servidor antes de gerar configurações E2E. O E2E requer build + deploy antes de executar. Use quando o usuário pedir testes, specs, cobertura ou validação de widget Fluig.
disable-model-invocation: true
---

Você vai ajudar a criar e executar testes para widgets Fluig.

Existem dois tipos de teste:
- **Unit (Jasmine + Karma):** testa componentes, services e pipes isoladamente, sem servidor
- **E2E (Playwright):** testa o widget publicado no servidor Fluig real

---

## HARD GATE — Antes de qualquer E2E

Antes de gerar qualquer configuração E2E ou executar testes E2E, você DEVE:

1. Perguntar ao usuário a URL do servidor Fluig (ex: `https://fluig.empresa.com.br`)
2. Confirmar que o widget já foi publicado **ou** executar o fluxo de build + deploy agora
3. Nunca usar `localhost` como base URL — widgets Fluig só rodam no servidor Fluig

Use `AskUserQuestion` para coletar:
- URL do servidor Fluig
- Usuário e senha (ou confirmar que `FLUIG_USER`/`FLUIG_PASSWORD` estão definidos)
- Página Fluig onde o widget está publicado (ex: `/portal/p/home`)

---

## Unit Tests — Jasmine + Karma

### Estrutura esperada

```
_node/wg_[nome]/
├── src/app/
│   ├── components/
│   │   └── [nome].component.spec.ts
│   ├── pages/
│   │   └── [nome].page.spec.ts
│   └── services/
│       └── [nome].service.spec.ts
├── karma.conf.js
└── package.json (com script "test")
```

### Template karma.conf.js (com cobertura Istanbul)

```js
module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma'),
    ],
    client: { jasmine: { random: true } },
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage'),
      subdir: '.',
      reporters: [{ type: 'html' }, { type: 'text-summary' }],
    },
    reporters: ['progress', 'kjhtml'],
    browsers: ['ChromeHeadless'],
    restartOnFileChange: true,
    coverageThreshold: {
      global: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70,
      },
    },
  });
};
```

### Template spec — Component

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { PoModule } from '@po-ui/ng-components';
import { [NomeComponent] } from './[nome].component';

describe('[NomeComponent]', () => {
  let component: [NomeComponent];
  let fixture: ComponentFixture<[NomeComponent]>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, PoModule],
      declarations: [[NomeComponent]],
    }).compileComponents();

    fixture = TestBed.createComponent([NomeComponent]);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('deve inicializar propriedades padrão', () => {
    expect(component.[propriedade]).toBe([valorEsperado]);
  });
});
```

### Template spec — Service HTTP

```typescript
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { [NomeService] } from './[nome].service';

describe('[NomeService]', () => {
  let service: [NomeService];
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [[NomeService]],
    });
    service = TestBed.inject([NomeService]);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('deve buscar dados via GET', () => {
    const mockData = { id: 1, nome: 'Teste' };

    service.[metodo]().subscribe((data) => {
      expect(data).toEqual(mockData);
    });

    const req = httpMock.expectOne('/api/endpoint');
    expect(req.request.method).toBe('GET');
    req.flush(mockData);
  });
});
```

### Executar unit tests

```bash
cd _node/wg_[nome]
npm test -- --watch=false --code-coverage
```

---

## E2E Tests — Playwright

### HARD GATE: build + deploy obrigatório antes dos testes

Antes de rodar E2E, execute:

```bash
# 1. Build
cd _node/wg_[nome]
npm run build

# 2. Deploy via fluig-deployer (acione o agente fluig-deployer)
# O deploy copia o dist/ para o servidor Fluig configurado
```

### Estrutura esperada

```
_node/wg_[nome]/
├── tests/
│   └── e2e/
│       ├── auth.setup.ts
│       └── wg_[nome].spec.ts
├── playwright.config.ts
└── package.json (com script "test:e2e")
```

### Template playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';

// FLUIG_BASE_URL é OBRIGATÓRIO — sem default intencional
// Exemplo: FLUIG_BASE_URL=https://fluig.empresa.com.br npm run test:e2e
const baseURL = process.env['FLUIG_BASE_URL'];
if (!baseURL) {
  throw new Error(
    'FLUIG_BASE_URL não definido.\n' +
    'Defina a URL do servidor Fluig antes de executar os testes E2E.\n' +
    'Exemplo: FLUIG_BASE_URL=https://fluig.empresa.com.br npm run test:e2e'
  );
}

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL,
    storageState: 'tests/e2e/.auth/user.json',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],
});
```

### Template auth.setup.ts

```typescript
import { test as setup } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const authFile = path.join(__dirname, '.auth/user.json');

setup('autenticar no Fluig', async ({ page }) => {
  const user = process.env['FLUIG_USER'];
  const password = process.env['FLUIG_PASSWORD'];

  if (!user || !password) {
    throw new Error(
      'FLUIG_USER e FLUIG_PASSWORD são obrigatórios para testes E2E.\n' +
      'Exemplo: FLUIG_USER=admin FLUIG_PASSWORD=senha npm run test:e2e'
    );
  }

  await page.goto('/portal/login');
  await page.getByLabel('Usuário').fill(user);
  await page.getByLabel('Senha').fill(password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL('**/portal/home**');

  fs.mkdirSync(path.dirname(authFile), { recursive: true });
  await page.context().storageState({ path: authFile });
});
```

### Template spec E2E

```typescript
import { test, expect } from '@playwright/test';

// Página onde o widget está publicado — ajustar conforme o projeto
const WIDGET_PAGE = process.env['FLUIG_WIDGET_PAGE'] ?? '/portal/p/home';

test.describe('wg_[nome] — E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(WIDGET_PAGE);
    // Aguarda o widget Angular carregar
    await page.waitForSelector('wg-[nome]-root', { timeout: 10_000 });
  });

  test('deve carregar o widget sem erros', async ({ page }) => {
    await expect(page.locator('wg-[nome]-root')).toBeVisible();
  });

  test('deve exibir dados carregados do servidor', async ({ page }) => {
    // Adaptar ao comportamento específico do widget
    await expect(page.locator('[data-testid="conteudo-principal"]')).toBeVisible();
  });
});
```

### Adicionar script no package.json

```json
{
  "scripts": {
    "test": "ng test --watch=false --code-coverage",
    "test:e2e": "playwright test"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.0"
  }
}
```

### Instalar Playwright

```bash
cd _node/wg_[nome]
npm install --save-dev @playwright/test
npx playwright install chromium
```

### Executar E2E

```bash
cd _node/wg_[nome]
FLUIG_BASE_URL=https://fluig.empresa.com.br \
FLUIG_USER=admin \
FLUIG_PASSWORD=senha \
FLUIG_WIDGET_PAGE=/portal/p/minha-pagina \
npm run test:e2e
```

---

## Regras obrigatórias

- **Unit tests:** sempre gerar `*.spec.ts` junto com cada componente/service criado
- **E2E:** nunca usar `localhost` — widget deve estar publicado no Fluig
- **E2E:** sempre perguntar URL, usuário e senha antes de gerar configs
- **E2E:** sempre acionar build + deploy (fluig-deployer) antes de rodar
- **Cobertura:** mínimo 70% statements/branches/functions/lines nos unit tests
- **storageState:** reusar sessão entre testes para não logar a cada spec
```

**Step 2: Verificar se o arquivo foi criado corretamente**

```bash
head -5 fluig/skills/fluig-test/SKILL.md
```
Esperado: ver o frontmatter `---` com `name: fluig-test`

**Step 3: Commit**

```bash
git add fluig/skills/fluig-test/SKILL.md
git commit -m "feat(fluig): criar skill fluig-test com Jasmine/Karma + Playwright E2E"
```

---

## Task 2: Criar hook fluig-lint.sh

**Files:**
- Create: `fluig/hooks/fluig-lint.sh`

**Step 1: Criar o script**

```bash
#!/usr/bin/env bash
# fluig-lint.sh — Lint JS/TS/HTML em projetos Angular/PO-UI Fluig
# Espelha o padrão do quality-check.sh global do usuário
# Ativado por PostToolUse (Edit|Write)

set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Ignorar se sem caminho (ex: NotebookEdit)
if [[ -z "$FILE_PATH" ]]; then
  exit 0
fi

# Ignorar se arquivo não existe
if [[ ! -f "$FILE_PATH" ]]; then
  exit 0
fi

EXT="${FILE_PATH##*.}"

# Só age em JS, TS e HTML
case "$EXT" in
  js|ts|html) ;;
  *) exit 0 ;;
esac

# Ignorar arquivos gerados/minificados
if [[ "$FILE_PATH" == *.min.js ]] || \
   [[ "$FILE_PATH" == *.d.ts ]] || \
   [[ "$FILE_PATH" == */dist/* ]] || \
   [[ "$FILE_PATH" == */.angular/* ]]; then
  exit 0
fi

# Detectar se é projeto Fluig (tem @po-ui no package.json)
CWD=$(echo "$INPUT" | jq -r '.cwd // empty')
[[ -z "$CWD" ]] && CWD="$(dirname "$FILE_PATH")"

is_fluig_project() {
  local dir="$1"
  for i in 1 2 3 4; do
    local pkg="$dir/package.json"
    if [[ -f "$pkg" ]] && jq -e '(.dependencies["@po-ui/ng-components"] // .devDependencies["@po-ui/ng-components"]) != null' "$pkg" &>/dev/null 2>&1; then
      return 0
    fi
    dir="$(dirname "$dir")"
  done
  return 1
}

if ! is_fluig_project "$CWD"; then
  exit 0
fi

ERRORS=""

# 1. Prettier — auto-fix silencioso (não bloqueia)
if command -v npx &>/dev/null; then
  npx --yes prettier --write "$FILE_PATH" &>/dev/null || true
fi

# 2. ESLint — bloqueia se erros e config existir
if command -v npx &>/dev/null; then
  ESLINT_CONFIG=$(find "$CWD" -maxdepth 4 \( \
    -name "eslint.config.js" -o -name "eslint.config.mjs" -o \
    -name ".eslintrc.js" -o -name ".eslintrc.cjs" -o \
    -name ".eslintrc.json" -o -name ".eslintrc.yml" -o \
    -name ".eslintrc" \
  \) 2>/dev/null | head -1)
  if [[ -n "$ESLINT_CONFIG" ]]; then
    ESLINT_EXIT=0
    ESLINT_OUT=$(npx --yes eslint "$FILE_PATH" 2>&1) || ESLINT_EXIT=$?
    if [[ $ESLINT_EXIT -ne 0 ]]; then
      ERRORS+="ESLint:\n${ESLINT_OUT}\n"
    fi
  fi
fi

# 3. tsc --noEmit — bloqueia se error TS (só para .ts)
if [[ "$EXT" == "ts" ]]; then
  TSCONFIG=$(find "$CWD" -maxdepth 3 -name "tsconfig.json" 2>/dev/null | head -1)
  if [[ -n "$TSCONFIG" ]] && command -v npx &>/dev/null; then
    TSC_OUT=$(cd "$CWD" && npx --yes tsc --noEmit 2>&1) || true
    if echo "$TSC_OUT" | grep -qE "error TS"; then
      ERRORS+="TypeScript:\n${TSC_OUT}\n"
    fi
  fi
fi

# 4. Regras Fluig-específicas para JS (não se aplica a spec/test)
if [[ "$EXT" == "js" ]] && \
   [[ "$FILE_PATH" != *.spec.js ]] && \
   [[ "$FILE_PATH" != *.test.js ]]; then

  if grep -q 'alert(' "$FILE_PATH" 2>/dev/null; then
    ERRORS+="Fluig: uso de alert() proibido — use Swal.fire() (SweetAlert2)\n"
  fi

  # Services e datasets devem ter try/catch
  BASENAME=$(basename "$FILE_PATH")
  if [[ "$BASENAME" == ds_* ]] || [[ "$BASENAME" == wf_* ]]; then
    if ! grep -q 'try' "$FILE_PATH" 2>/dev/null; then
      ERRORS+="Fluig: '${BASENAME}' não tem try/catch — obrigatório em datasets e workflows\n"
    fi
  fi
fi

if [[ -n "$ERRORS" ]]; then
  jq -n --arg reason "Qualidade Fluig: corrija os erros antes de continuar:\n\n${ERRORS}" \
    '{"decision":"block","reason":$reason}'
  exit 0
fi

exit 0
```

**Step 2: Tornar executável**

```bash
chmod +x fluig/hooks/fluig-lint.sh
```

**Step 3: Testar manualmente com um arquivo TypeScript fake**

```bash
echo '{"tool_input":{"file_path":"/tmp/test.ts"},"cwd":"/tmp"}' | \
  bash fluig/hooks/fluig-lint.sh
```
Esperado: `exit 0` silencioso (não é projeto Fluig)

**Step 4: Commit**

```bash
git add fluig/hooks/fluig-lint.sh
git commit -m "feat(fluig): criar hook fluig-lint.sh para validação JS/TS/HTML"
```

---

## Task 3: Criar hook fluig-ts-preference.sh

**Files:**
- Create: `fluig/hooks/fluig-ts-preference.sh`

**Step 1: Criar o script**

```bash
#!/usr/bin/env bash
# fluig-ts-preference.sh — Injeta contexto TypeScript em projetos Fluig Angular
# Ativado por UserPromptSubmit
# Espelha o padrão do ts-preference.sh global do usuário

set -euo pipefail

INPUT=$(cat)
CWD=$(echo "$INPUT" | jq -r '.cwd // empty')

if [[ -z "$CWD" ]]; then
  exit 0
fi

PKG="$CWD/package.json"

# Busca package.json subindo até 3 níveis
if [[ ! -f "$PKG" ]]; then
  for i in 1 2 3; do
    CWD="$(dirname "$CWD")"
    PKG="$CWD/package.json"
    [[ -f "$PKG" ]] && break
  done
fi

if [[ ! -f "$PKG" ]]; then
  exit 0
fi

# Validar JSON antes de usar
if ! jq empty "$PKG" &>/dev/null 2>&1; then
  exit 0
fi

# Detectar projeto Fluig: tem @po-ui/ng-components
IS_FLUIG=false
if jq -e '(.dependencies["@po-ui/ng-components"] // .devDependencies["@po-ui/ng-components"]) != null' "$PKG" &>/dev/null 2>&1; then
  IS_FLUIG=true
fi

if [[ "$IS_FLUIG" != "true" ]]; then
  exit 0
fi

jq -n '{
  hookSpecificOutput: {
    hookEventName: "UserPromptSubmit",
    additionalContext: "Este projeto usa Angular 19 + PO-UI 19.36.0 (Fluig widget). SEMPRE use TypeScript (.ts). NUNCA crie arquivos .js para componentes, services, pipes ou models — apenas .spec.ts para testes. Use const/let, nunca var. Notificações: sempre Swal.fire(), nunca alert()."
  }
}'

exit 0
```

**Step 2: Tornar executável**

```bash
chmod +x fluig/hooks/fluig-ts-preference.sh
```

**Step 3: Testar com payload sem package.json**

```bash
echo '{"cwd":"/tmp"}' | bash fluig/hooks/fluig-ts-preference.sh
```
Esperado: `exit 0` silencioso

**Step 4: Commit**

```bash
git add fluig/hooks/fluig-ts-preference.sh
git commit -m "feat(fluig): criar hook fluig-ts-preference.sh para forçar TypeScript"
```

---

## Task 4: Atualizar hooks.json

**Files:**
- Modify: `fluig/hooks/hooks.json`

**Step 1: Substituir conteúdo do hooks.json**

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/hooks/fluig-lint.sh",
            "timeout": 60,
            "statusMessage": "Verificando qualidade Fluig..."
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/hooks/fluig-ts-preference.sh",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

**Step 2: Verificar JSON válido**

```bash
jq . fluig/hooks/hooks.json
```
Esperado: JSON formatado sem erros

**Step 3: Commit**

```bash
git add fluig/hooks/hooks.json
git commit -m "feat(fluig): atualizar hooks.json com fluig-lint e fluig-ts-preference"
```

---

## Task 5: Atualizar plugin cache e sincronizar

**Files:**
- Modify: `fluig/.claude-plugin/plugin.json` (bump version 1.0.0 → 1.1.0)

**Step 1: Bump version no plugin.json**

Alterar `"version": "1.0.0"` para `"version": "1.1.0"` em `fluig/.claude-plugin/plugin.json`.

**Step 2: Sincronizar cache instalado**

```bash
# Criar cache da nova versão
cp -r ~/.claude/plugins/cache/claude-skills-tbc/fluig/1.0.0 \
       ~/.claude/plugins/cache/claude-skills-tbc/fluig/1.1.0

rsync -a --delete /path/to/claude_skills/fluig/ \
       ~/.claude/plugins/cache/claude-skills-tbc/fluig/1.1.0/
```

**Step 3: Atualizar installed_plugins.json**

Alterar entrada `fluig@claude-skills-tbc` para versão `1.1.0` e novo installPath.

**Step 4: Commit final**

```bash
git add fluig/.claude-plugin/plugin.json
git commit -m "chore(fluig): bump version 1.0.0 → 1.1.0"
```

**Step 5: Push**

```bash
git push origin main
```

---

## Checklist de verificação final

- [ ] `fluig/skills/fluig-test/SKILL.md` existe e tem frontmatter correto
- [ ] `fluig/hooks/fluig-lint.sh` é executável e sai silencioso fora de projetos Fluig
- [ ] `fluig/hooks/fluig-ts-preference.sh` é executável e sai silencioso fora de projetos Fluig
- [ ] `fluig/hooks/hooks.json` tem PostToolUse e UserPromptSubmit configurados
- [ ] `fluig/.claude-plugin/plugin.json` está na versão 1.1.0
- [ ] Cache local sincronizado com v1.1.0
- [ ] Todos os commits feitos e push enviado
