---
name: brainstorm
description: Planejamento de desenvolvimento ADVPL/TLPP — intake de MIT044, explora o projeto, faz perguntas, propõe abordagens e gera design aprovado antes de qualquer código. Encadeia /protheus:plan.
---

<HARD-GATE>
Não gere nenhum código ADVPL/TLPP, não crie arquivos .prw/.tlpp e não invoque nenhum skill de implementação antes de apresentar o design e obter aprovação do desenvolvedor.
</HARD-GATE>

## Passo 0 — Documento de desenvolvimento

Antes de qualquer exploração, pergunte:

> "Existe um documento de desenvolvimento (MIT044) ou levantamento de requisitos
> para esta tarefa? Se sim, informe o caminho do arquivo."

**Se o desenvolvedor informar o caminho:**
1. Leia o documento completo
2. Extraia automaticamente: módulo, tabelas envolvidas, tipo de artefato,
   regras de negócio e restrições
3. Apresente um resumo do que foi extraído e confirme com o desenvolvedor
4. Use esses dados como contexto primário nas perguntas do Passo 2 —
   só pergunte o que estiver faltando ou ambíguo no documento

**Se não houver documento:**
- Continue normalmente para o Passo 1

---

## Passo 1 — Explorar o projeto

Percorra o projeto antes de qualquer pergunta:

```bash
# Fontes existentes e padrão de nomenclatura
find . -name "*.prw" -o -name "*.tlpp" | sort

# CLAUDE.md — configuração do cliente
cat CLAUDE.md 2>/dev/null

# MIT043 — registro de customizações já feitas
find . -name "MIT043*" | head -3 | xargs cat 2>/dev/null

# Commits recentes — o que foi feito
git log --oneline -15 2>/dev/null

# Pontos de Entrada existentes (prefixo PE_ ou padrão legado)
grep -rn "User Function" . --include="*.prw" --include="*.tlpp" | grep -i "^.*PE_\|^.*MT\|^.*FA" | head -20
```

Com base na exploração, identifique:
- Próximo sequencial disponível no padrão `R[MOD][TYPE][SEQ]`
- Módulos já desenvolvidos neste projeto
- Padrão de namespace TLPP, se houver
- Pontos de Entrada já customizados (para evitar duplicidade)

---

## Passo 1.5 — Consultar base de conhecimento (MCP obrigatório)

Antes de formular perguntas ou propor abordagens, consulte o MCP `tbc-knowledge`:

```
# Funções existentes no módulo relevante
searchFunction({ module: "<MOD>", limit: 20 })

# Pontos de Entrada disponíveis para a tabela/rotina
findEndpoint({ keyword: "<tabela ou rotina>" })
findExecAuto({ target: "<rotina>" })
findMvcPattern({ table: "<alias>" })

# Padrões e convenções aplicáveis
searchKnowledge({ skill: "protheus-patterns", keyword: "nomenclatura" })
searchKnowledge({ skill: "protheus-patterns", keyword: "tratamento erros" })

# Material de treinamento relevante
searchDocuments({ keyword: "<modulo ou funcionalidade>" })
```

Use os resultados para:
- Identificar se já existe função/PE que resolve o caso
- Evitar reescrever comportamento já fornecido pelo ERP
- Embasar as abordagens propostas no Passo 3 com evidências da Knowledge Base

---

## Passo 2 — Perguntas (uma por vez)

Faça **uma pergunta por mensagem**. Prefira múltipla escolha quando possível.

### Sequência recomendada:

1. **O que você precisa construir?** (descrição livre)
2. **Qual tipo de artefato?**
   - `A` Cadastro/atualização (User Function ou MVC)
   - `E` Processamento/ExecBlock (função, consulta, relatório)
   - `P` Ponto de Entrada (MVC ou legado)
   - `R` Relatório
3. **Qual módulo?** (FAT, FIN, EST, COM, RH…)
4. **Quais tabelas são envolvidas?** (ex: SA1 Clientes, SC5 Pedidos)
5. **Existe algum Ponto de Entrada padrão já disponível para este caso?**
   *(se for PE — verificar na documentação TDN ou no código existente)*
6. **Precisa persistir dados?** Se sim, em tabela padrão ou customizada?
7. **Há validações ou regras de negócio específicas do cliente?**

Pare quando tiver informações suficientes para propor abordagens.

---

## Passo 3 — Propor 2-3 abordagens

Apresente as opções com trade-offs e sua recomendação. Exemplos de eixos de decisão:

| Decisão | Opção A | Opção B |
|---------|---------|---------|
| Estrutura | User Function simples | MVC completo |
| PE | Ponto de Entrada MVC | Ponto de Entrada legado |
| Persistência | Tabela padrão (SA1…) | Tabela customizada (SZ?) |
| Linguagem | ADVPL `.prw` | TLPP `.tlpp` com namespace |

Sempre indique qual você recomenda e por quê.

---

## Passo 4 — Apresentar design

Apresente o design em seções, aguardando aprovação após cada uma:

### 4.1 — Visão geral
- Nome do arquivo: `R[MOD][TYPE][SEQ].prw` (ou `.tlpp`)
- Tipo de artefato e responsabilidade
- Módulo e próximo sequencial

### 4.2 — Estrutura de funções
- `User Function` principal (nome ≤ 8 chars para `.prw`)
- `Static Function` auxiliares
- Ponto de Entrada (se aplicável) — PE em arquivo próprio, lógica em função externa

### 4.3 — Acesso a dados
- Tabelas lidas e gravadas
- `RecLock / MsUnlock / dbCommit` onde necessário
- `xFilial()` obrigatório em toda busca

### 4.4 — Tratamento de erros
- `ErrorBlock` + programação defensiva com guard clauses (**BEGIN SEQUENCE PROIBIDO**)
- Mensagens ao usuário

### 4.5 — Checklist de conformidade
- Notação húngara em todas as variáveis?
- Limite de 8 chars no nome da User Function?
- ProtheusDoc completo?
- Registrar no MIT043?

---

## Passo 5 — Transição para planejamento

Após aprovação do design, salve o design doc em `docs/plans/YYYY-MM-DD-[modulo]-[descricao]-design.md`:

```
Design aprovado!

Próximo passo:
  /protheus:plan
```

> O `protheus:plan` irá decompor o design em tasks tipadas para ADVPL
> e preparar o plano para os teammates de implementação, revisão, compilação e testes TIR.

---

## Consulta de Conhecimento

Se precisar de informação não disponível no MCP, consulte o RAG:
```
searchKnowledge({ keyword: "<termo relevante>" })
```
