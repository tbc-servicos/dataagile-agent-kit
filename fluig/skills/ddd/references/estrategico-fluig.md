# DDD estratégico no Fluig — linguagem ubíqua, contextos e o mapa de integrações

Referência da skill `/fluig:ddd`.

## Linguagem ubíqua — do glossário ao BPM

Monte no brainstorm, com o key-user, e mantenha na documentação do processo:

| Termo do negócio | Significado acordado | Materialização no Fluig |
|---|---|---|
| Solicitação de desconto | Pedido do vendedor para aplicar % acima da tabela | Processo "Solicitação de Desconto" |
| Alçada do vendedor | Teto de % que aprova sozinho | Campo `tetoAlcada` (consultado, não digitado) |
| Liberação pela supervisão | Aprovação do excedente | Atividade "Liberação pela Supervisão" |
| Contrato vigente | Contrato comercial dentro da vigência | `ds_consulta_contratos_vigentes` |

Regras práticas:
- **O diagrama BPM é o documento de linguagem ubíqua** — o key-user o valida lendo.
  Atividade "Aprovação 2" ou gateway "OK?" = linguagem morta; renomeie.
- Campos do formulário: nome de negócio em camelCase (`percentualNegociado`), nunca
  `txtVal1`/`campo23`. O label E o id falam a língua.
- Datasets seguem `ds_[acao]_[entidade]` com entidade do glossário.
- Mensagens de erro/notificação usam o termo do glossário — são lidas pelo usuário final.
- No Voyager 2.0, se a IA da plataforma gerar processo/formulário por prompt, **revise os
  nomes gerados contra o glossário antes de aprovar** — a IA acelera a materialização,
  não substitui o acordo de linguagem.

## Bounded Contexts — critérios de corte no Fluig

1. **Processos diferentes = contextos diferentes por padrão.** Só unifique se o key-user,
   o fluxo E o vocabulário forem os mesmos.
2. **O mesmo termo muda de significado entre áreas?** "Aprovação" do financeiro (limite de
   crédito) ≠ "aprovação" do comercial (desconto) → dois processos, dois modelos.
3. **Widgets**: um widget serve um contexto. Dashboard multi-contexto legítimo = widget de
   **leitura** que agrega números; nunca um widget que **opera** cinco processos.

Materialização:

```
processos/
├── solicitacao-desconto/        ← contexto
│   ├── form/ (HTML + events/ + Util/)
│   ├── eventos/ (wf_solicitacao_desconto.*.js)
│   └── datasets/ (ds_consulta_contratos_vigentes.js, …)
└── admissao-colaborador/        ← outro contexto, outro modelo
widgets/
└── wg_painel_descontos/         ← janela do contexto solicitacao-desconto
```

Shared kernel (o que pode ser comum): VOs primitivos do negócio (CPF/CNPJ, dinheiro,
vigência) e helpers técnicos. Regra: pequeno, estável, com dono. Formulário e regra de
processo **nunca** são shared kernel.

## Context Mapping — o Fluig entre o usuário e o ERP

O papel típico do Fluig: orquestrar pessoas (workflow) em cima de dados que moram no ERP.
Isso define o mapa:

| Relação | Padrão | Aplicação Fluig |
|---|---|---|
| Fluig ← Protheus (leitura) | **ACL** | Dataset de integração traduz REST/SQL do ERP para colunas na língua do processo. O widget/form consome o dataset, nunca o JSON cru |
| Fluig → Protheus (escrita) | **ACL + ponto único** | Uma atividade/evento definido no fluxo grava via função de infra (`gravarPedidoProtheus()`); payload/rota confinados ali |
| Fluig ← e-commerce/terceiros | **ACL** | Mesmo padrão: um dataset/função por recurso externo |
| Fluig como fornecedor (widget consumido por portal) | **Host aberto** | Contrato estável do dataset/serviço exposto; mudanças aditivas |
| Processo ↔ processo | **Eventos** | Processo A dispara B (subprocesso/integração) com payload mínimo por identidade — não copiando o formulário inteiro |

### Falha de integração é parte do modelo

O erro mais comum em processo Fluig: a integração com o ERP falha e o processo segue (catch
engolido) ou trava sem explicação. Modele o fracasso:
- A escrita no ERP tem **resultado visível no processo** (campo de status, atividade de
  pendência, retry manual).
- O evento loga com contexto e **lança** o erro (a plataforma marca a movimentação) —
  nunca `catch (e) {}`.
- Idempotência: se o evento reexecutar, a gravação no ERP não duplica (chave de negócio
  conferida antes de gravar).

## Sinais de mapa ruim (para o review)

- JSON do Protheus parseado em widget, form E evento → falta a ACL única (dataset).
- Campo de formulário que espelha 20 campos do cadastro do ERP → copie a **identidade**,
  consulte o resto.
- Gravação no ERP espalhada por 3 eventos de atividades diferentes → ponto único.
- Dois processos compartilhando o mesmo formulário "para reaproveitar" → contextos colados.
