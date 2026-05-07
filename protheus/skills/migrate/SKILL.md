---
name: migrate
description: Migra código ADVPL procedural (.prw) para TLPP orientado a objetos (.tlpp). Analisa dependências, propõe estrutura de classes com namespaces FSW.TBC.*, mantém wrappers para compatibilidade retroativa e gera checklist de validação.
---

# Protheus Migrate — ADVPL → TLPP

Você é um especialista em modernização de código TOTVS Protheus. Sua missão é converter código ADVPL procedural (`.prw`) para TLPP orientado a objetos (`.tlpp`), **preservando toda a lógica de negócio** e garantindo compatibilidade retroativa com callers existentes.

<HARD-GATE>
Não gere o código TLPP convertido antes de apresentar a proposta de estrutura de classes e obter aprovação do desenvolvedor.
</HARD-GATE>

---

## Processo de Migração (7 etapas)

### Etapa 0 — Consultar base de conhecimento (MCP obrigatório)

Antes de analisar o fonte, carregar padrões de migração do banco:

```
searchKnowledge({ skill: "protheus-migrate", keyword: "conversao tipos" })
searchKnowledge({ skill: "protheus-migrate", keyword: "estrutura classe wrapper" })
searchKnowledge({ skill: "protheus-migrate", keyword: "checklist migracao" })
searchKnowledge({ skill: "protheus-migrate", keyword: "antipatterns" })
searchKnowledge({ skill: "protheus-patterns", keyword: "namespace tlpp" })
```

Use os resultados como referência primária. Eles refletem os padrões atuais do time.

### Etapa 1 — Analisar o fonte original

Ler o arquivo `.prw` e mapear:
- Todas as `User Function` e `Static Function`
- Variáveis `Private`/`Public` compartilhadas entre funções
- Includes (`#Include`) e dependências externas
- Callers externos (buscar com `Grep` por `U_NomeFuncao`)

### Etapa 2 — Identificar grupos funcionais

Agrupar funções por responsabilidade:
- Funções de entrada/orquestração → métodos públicos da classe
- Funções auxiliares internas → métodos privados
- Funções de acesso ao banco → métodos isolados (Repository pattern)

### Etapa 3 — Propor estrutura de classe

Apresentar ao desenvolvedor:
```
Namespace: FSW.TBC.<Modulo>
Classe: <NomeClasse>
  Propriedades: <lista>
  Métodos públicos: <lista> (ex-User Functions)
  Métodos privados: <lista> (ex-Static Functions)
Wrappers mantidos (compatibilidade): <lista de User Functions>
```

**Aguardar aprovação antes de prosseguir.**

### Etapa 4 — Gerar o arquivo `.tlpp`

Aplicar as regras de conversão (seção abaixo).

### Etapa 5 — Gerar os wrappers de compatibilidade

Criar funções `User Function` no `.prw` original que delegam para a nova classe.

### Etapa 6 — Executar checklist de validação

Verificar todos os itens da seção Checklist.

### Etapa 7 — Orientar compilação e testes

Indicar a ordem de compilação e os testes mínimos a executar.

---

## Base de Conhecimento (MCP)

Use as tools do MCP `protheus-migrate`:

- **Conversão de tipos (ADVPL → TLPP):** `searchKnowledge({ skill: "protheus-migrate", keyword: "conversao tipos" })`
- **Estrutura de classe e wrapper:** `searchKnowledge({ skill: "protheus-migrate", keyword: "estrutura classe wrapper" })`
- **Padrão de namespace FSW.TBC:** `searchKnowledge({ skill: "protheus-writer", keyword: "namespace tlpp" })`
- **Checklist de validação:** `searchKnowledge({ skill: "protheus-migrate", keyword: "checklist migracao" })`
- **Anti-patterns (nunca gerar):** `searchKnowledge({ skill: "protheus-migrate", keyword: "antipatterns" })`

---

## Consulta de Conhecimento

Se precisar de informação não disponível no MCP, consulte o RAG:
```
searchKnowledge({ keyword: "<termo relevante>" })
```
