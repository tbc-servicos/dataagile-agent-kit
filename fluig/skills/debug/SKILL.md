---
name: debug
description: Debugging sistemático para Fluig. Guia investigação de root cause em 4 fases: reproduzir, investigar, hipótese, corrigir com teste. Usa logs Docker, Playwright traces, Karma output.
disable-model-invocation: true
---

Você vai conduzir um debugging sistemático de erros encontrados em artefatos Fluig.

## Fluxo de Debugging em 4 Fases

O debugging segue 4 fases obrigatórias em sequência. Não pule para "corrigir" sem antes completar reprodução, investigação e hipótese.

---

## Fase 1 — Reproduzir o Erro

### Passo 1a — Obter descrição exata do erro

Pergunte ao usuário:
- Qual é o erro exato observado? (mensagem, comportamento inesperado, falha silenciosa)
- Em qual cenário ocorre? (ao carregar formulário, ao submeter dados, ao filtrar dataset)
- É reproduzível consistentemente ou intermitente?
- Em qual ambiente? (localhost, servidor HML, servidor de teste)

### Passo 1b — Reproduzir localmente ou no servidor

**Se é erro em localhost (Karma, servidor local):**
```bash
npm test   # Execute Karma/Jasmine para reproduzir
# Ou
npm start  # Inicie ng serve e reproduza no navegador
```

Verifique:
- Console do navegador (F12) — há erros JavaScript?
- Output do Karma — qual teste falhou e com que mensagem?

**Se é erro no servidor deployado (HML ou teste):**
```bash
# Leia o CLAUDE.md do projeto para obter o hostname do servidor.
# Via SSH na VPS
ssh [hostname] "docker logs fluig --tail 100 2>&1"
```

Procure por:
- Stack trace no stdout
- Exceções Java (se Fluig logging capturar)
- Timing de quando o erro ocorreu

### Passo 1c — Coletar evidências do erro

- Captura de tela ou vídeo do comportamento (se no navegador)
- Stack trace completo (copie do console ou dos logs)
- Playground trace do Playwright (se teste E2E falhou) — verifique `test-results/` ou `playwright/traces/`
- Versão do artefato, servidor e ambiente

---

## Fase 2 — Investigar

### Passo 2a — Coletar logs relevantes

**Logs Docker (servidor Fluig):**
```bash
# Leia o CLAUDE.md do projeto para obter o hostname do servidor.
ssh [hostname] "docker logs fluig --since 10m 2>&1 | tail -200"
```

Procure por:
- Timestamp próximo ao momento do erro
- Linhas com `ERROR`, `WARN`, `Exception`
- Stack traces Java completos

**Logs do Karma (localhost):**
```bash
npm test 2>&1 | tee test.log
# Revise test.log para output completo
```

**Playwright traces:**
```bash
# Se o teste E2E deixou trace
ls -la test-results/
# Abra o trace no Playwright Inspector
npx playwright show-trace test-results/*.trace
```

### Passo 2b — Revisar mudanças recentes

```bash
git diff HEAD~5..HEAD [arquivo do artefato]
# Ou para ver todo o histórico do arquivo
git log -p --follow [arquivo] | head -100
```

Identifique:
- Qual mudança foi feita antes do erro aparecer?
- Ela poderia ter causado o comportamento observado?

### Passo 2c — Verificar dependências e variáveis de ambiente

**Se é erro de integração com Protheus:**
- URL da API está correta no CLAUDE.md?
- Token/credenciais estão válidas?
- Protheus está acessível (não down)?

**Se é erro de dataset:**
- A query SQL/JPQL está correta?
- Os parâmetros de entrada estão sendo validados?
- O banco de dados retorna resultado vazio (edge case)?

**Se é erro de widget Angular:**
- Dependências npm estão instaladas (`npm list @po-ui/core`, etc.)?
- Versão do @po-ui está compatível?

---

## Fase 3 — Hipótese

### Passo 3a — Formar hipótese baseada em evidências

Liste 2-3 possíveis causas ordenadas por probabilidade:

```
Hipótese 1 (provável): [descrição]
  Evidência: [qual log ou comportamento suporta isso]
  Como validar: [qual comando ou teste valida]

Hipótese 2 (possível): [descrição]
  Evidência: [qual evidência]
  Como validar: [qual teste]

Hipótese 3 (improvável): [descrição]
  Evidência: [qual evidência]
  Como validar: [qual teste]
```

### Passo 3b — Validar contra evidências

Para cada hipótese:
- Ela explica TODOS os sintomas observados?
- Há contradições com os logs ou comportamento?
- Qual hipótese é mais consistente com as evidências?

Descarte hipóteses que contradigem evidências.

---

## Fase 4 — Corrigir com Teste

### Passo 4a — Escrever teste que reproduz o bug PRIMEIRO

Antes de corrigir o código, escreva um teste que falhe:

Para templates de correção, consulte o MCP:

```
searchFluigPatterns({ category: "template" })
searchFluigPatterns({ category: "error-handling" })
```

Aplique o padrão correto ao tipo de artefato sendo debugado.

Execute o teste e confirme que falha:
```bash
npm test 2>&1 | grep FAIL
```

### Passo 4b — Corrigir o código

Com o teste falhando, agora corrija o artefato usando os padrões obtidos do MCP.

### Passo 4c — Validar: teste passa, bug não ocorre mais

```bash
npm test -- --include='**/nome.spec.ts'  # Teste específico passa?
npm start  # Inicie servidor e valide comportamento manualmente no navegador
```

Se no servidor:
```bash
# Redeploy
/fluig:deploy

# Teste E2E contra servidor atualizado
/fluig:test
```

Confirme:
- ✅ Teste unitário passa
- ✅ Comportamento no navegador/servidor é correto
- ✅ Nenhuma regressão em outros testes

---

## Fontes de Debugging Fluig

### Docker logs (servidor):
```bash
# Leia o CLAUDE.md do projeto para obter o hostname do servidor.
ssh [hostname] "docker logs fluig --tail 50 --timestamps"
```

### Playwright traces (E2E):
```bash
ls -la test-results/
npx playwright show-trace test-results/*.trace  # Abre Playwright Inspector
```

### Karma output (localhost):
```bash
npm test 2>&1 | grep -A 20 "FAIL"
```

### Browser console (F12):
- Abra DevTools (F12)
- Network tab — verifique requisições à API/Protheus
- Console tab — erros JavaScript
- Application tab — localStorage/cookies se relevante

---

## Resumo Final

Após corrigir e validar, anuncie:

```
BUG CORRIGIDO — [descrição do bug]

Root cause: [hipótese confirmada]
Correção: [mudança de código aplicada]
Teste: [teste unitário que valida a correção]
Validação: [comportamento correto confirmado]

Próximo passo: Retorne para /fluig:deploy → /fluig:qa para validar a correção em toda a pipeline.
```

## Regras obrigatórias

- As 4 fases são sequenciais — não pule reprodução ou investigação
- Sempre escrever teste ANTES de corrigir (TDD)
- Sempre validar que o teste passa após correção
- Sempre coletar logs (Docker, Playwright, Karma) antes de especular
- Fase 3 (hipótese) é teórica — validar com testes ou logs, nunca assumir

---

## Consulta de Conhecimento

Se precisar de informação não disponível no MCP, consulte o RAG:
```
searchKnowledge({ keyword: "<termo relevante>" })
```
