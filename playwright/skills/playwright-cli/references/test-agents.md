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
