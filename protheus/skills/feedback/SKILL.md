---
name: feedback
description: Registra um aprendizado de correção na base de conhecimento Protheus. Usar quando Claude erra e o dev corrige, para que o erro não se repita com outros devs. Conduz diálogo de confirmação antes de persistir.
---

# Protheus Feedback — Registro de Aprendizado

Use esta skill quando:
- Claude cometeu um erro que foi corrigido pelo dev
- Dev invocou explicitamente `/protheus:feedback`

**Regra inegociável:** nunca submeter sem confirmação explícita do dev.

---

## Passo 1 — Confirmar intenção

Perguntar ao dev:

> "Posso registrar esse aprendizado na base de conhecimento para que outros devs não recebam a mesma resposta errada?"

Aguardar confirmação. Se o dev recusar, encerrar sem insistir.

---

## Passo 2 — Gerar rascunho estruturado

Analisar o contexto da conversa (o que Claude disse de errado, o que o dev corrigiu) e propor:

```
❌ ERRO: <o que Claude gerou de incorreto — específico>
📍 CONTEXTO: <situação — rotina, módulo, padrão Protheus envolvido>
✅ REGRA: <o que está correto, de forma prescritiva e direta>
💻 EXEMPLO ERRADO:
   <código ADVPL/TLPP incorreto, se aplicável>
💻 EXEMPLO CORRETO:
   <código ADVPL/TLPP correto, se aplicável>
🏷 TAGS: <palavras-chave separadas por vírgula que Claude usaria ao buscar>
        ex: ExecAuto, MATA010, ErrorBlock, notação húngara, RecLock
```

---

## Passo 3 — Dev revisa e aprova

Apresentar o rascunho e perguntar:

> "Esse rascunho está correto? Pode editar qualquer campo antes de confirmar."

Aguardar resposta. Aplicar edições se o dev solicitar. Só avançar após aprovação explícita.

---

## Passo 4 — Submeter via MCP

Chamar a tool MCP `submitFeedback` com os campos aprovados:

```
submitFeedback({
  plugin:      "protheus",
  error:       <campo ERRO>,
  context:     <campo CONTEXTO ou null se não informado>,
  rule:        <campo REGRA>,
  example_bad: <EXEMPLO ERRADO ou null>,
  example_ok:  <EXEMPLO CORRETO ou null>,
  tags:        <TAGS como string separada por vírgula>
})
```

---

## Passo 5 — Confirmar resultado

**Usuário interno — sucesso:**
> "✅ Aprendizado #<ID> registrado e disponível para todos os devs agora via searchKnowledge."

**Usuário externo — sucesso:**
> "✅ Feedback #<ID> enviado para revisão. Ficará disponível na base de conhecimento após aprovação pela equipe DataAgile."

**Falha (isError: true ou exception):**
> "⚠️ Não foi possível registrar o feedback: <motivo>.
> O rascunho foi preservado abaixo para você copiar manualmente se precisar:"
>
> [exibir rascunho completo]
