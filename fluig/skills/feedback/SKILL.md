---
name: feedback
description: Registra um aprendizado de correção na base de conhecimento Fluig. Usar quando Claude erra e o dev corrige, para que o erro não se repita com outros devs. Conduz diálogo de confirmação antes de persistir.
---

# Fluig Feedback — Registro de Aprendizado

Use esta skill quando:
- Claude cometeu um erro que foi corrigido pelo dev
- Dev invocou explicitamente `/fluig:feedback`

**Regra inegociável:** nunca submeter sem confirmação explícita do dev.

---

## Passo 1 — Confirmar intenção

Perguntar ao dev:

> "Posso registrar esse aprendizado na base de conhecimento para que outros devs não recebam a mesma resposta errada?"

Aguardar confirmação. Se o dev recusar, encerrar sem insistir.

---

## Passo 2 — Gerar rascunho estruturado

Analisar o contexto da conversa e propor:

```
❌ ERRO: <o que Claude gerou de incorreto — específico>
📍 CONTEXTO: <situação — dataset, widget, workflow, formulário, evento Fluig>
✅ REGRA: <o que está correto, de forma prescritiva e direta>
💻 EXEMPLO ERRADO:
   <código JavaScript/Angular incorreto, se aplicável>
💻 EXEMPLO CORRETO:
   <código JavaScript/Angular correto, se aplicável>
🏷 TAGS: <palavras-chave separadas por vírgula que Claude usaria ao buscar>
        ex: dataset, FormController, fluigc, WCMAPI, widget, Angular, PO-UI
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
  plugin:      "fluig",
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

**Sucesso:**
> "✅ Aprendizado #<ID> registrado e disponível para todos os devs agora via searchKnowledge."

**Falha (isError: true ou exception):**
> "⚠️ Não foi possível registrar o feedback: <motivo>.
> O rascunho foi preservado abaixo para você copiar manualmente se precisar:"
>
> [exibir rascunho completo]
