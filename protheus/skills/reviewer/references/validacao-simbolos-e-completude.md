# Guardrails anti-alucinação — Validação de Símbolos & Verificação de Completude

Dois passos **obrigatórios** para qualquer geração, migração ou refatoração de código
ADVPL/TLPP. O `reviewer` deve checar que foram cumpridos; o `writer`/`migrate` devem
executá-los (antes e depois de gerar).

> Adaptado de `totvs/engpro-advpl-tlpp-skills` (MIT) — Engenharia Protheus TOTVS.

---

## 1. Validação de Símbolos da API (ANTES de gerar)

Toda classe, método, função, namespace e assinatura referenciados na saída **devem
existir de fato** no framework/versão alvo. Símbolos **nunca** podem ser inferidos do
conhecimento interno do modelo — é a causa #1 de `Cannot find method ...` / `Class not found ...`.

Procedimento:
1. **Liste cada símbolo externo** do código planejado (classes, métodos, funções, namespaces).
2. **Consulte cada símbolo** na doc oficial (TDN — tdn.totvs.com), no MCP `tbc-knowledge` (`searchFunction`, `searchByTable`) ou no próprio código antes de escrever a chamada.
3. **Referências de skill e exemplos de código também são autoritativos**: um símbolo é válido se aparece em `references/*.md` ou no corpo de uma SKILL.md (algumas APIs reais não estão na TDN mas são usadas em produção).
4. **Rejeite símbolos não encontrados** em doc, código ou referências. Sem alternativa documentada → documentar o gap (ver §2), nunca inventar a chamada.
5. **Valide a assinatura completa** (ordem/tipos/defaults/retorno). Não assuma parâmetro opcional sem fonte.
6. **Valide o contexto de execução** (lifecycle) — método existir não garante validade no contexto.
7. **Migração**: nunca assuma que um símbolo legado foi portado com o mesmo nome no framework novo — validar contra o **alvo**.

---

## 2. Verificação de Completude (DEPOIS de gerar)

Antes de declarar a tarefa concluída:
1. **Gap analysis item a item**: comparar TODAS as features do código original/requisito com o gerado. Marcar cada uma: ✅ migrada · ⚠️ não-migrável (com justificativa referenciando limitação) · 🔄 preservada em camada legada.
2. **Nada omitido em silêncio**: feature não migrada exige justificativa documentada. "Esqueci"/"assumi que o framework faz" **não** são válidas.
3. **Lógica condicional deve ser replicada**: verificações de acesso (`VerifyAccess`, `MPUserHasAccess`), parâmetros (`SuperGetMv`), modo de acesso (`FWModeAccess`), existência de tabela (`FwAliasInDic`), módulo (`nModulo`), país (`cPaisLoc`), feature flags (`FindFunction`) **nunca** são automáticos — codificar explicitamente.
4. **Apresentar o gap analysis ao usuário** antes de considerar concluído.
