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
