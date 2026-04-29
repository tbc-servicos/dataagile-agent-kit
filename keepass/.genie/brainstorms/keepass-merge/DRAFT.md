# Brainstorm Draft: KeePass Merge Guiado

**Slug:** keepass-merge  
**Iniciado:** 2026-04-27  
**Status:** Simmering

## Problema (rascunho)

Usuário tem múltiplas entradas para o mesmo site/serviço num banco KeePass e quer uma
função guiada para consolidá-las — exibindo as entradas lado a lado e decidindo o que
manter, descartar ou combinar.

## Contexto Coletado

- Skill atual suporta: search, show, add, edit, rm, list, totp, generate, list-dbs
- Skill opera em múltiplos bancos (multi-db)
- Escrita exige KeePassXC desktop fechado
- Toda operação destrutiva (rm) exige confirmação explícita

## Perguntas Abertas

1. Escopo: merge dentro de um único banco ou também entre bancos diferentes?
2. O que define "mesmas entradas"? (URL, título, username...)
3. O que fazer com campos conflitantes? (usuário escolhe campo a campo?)
4. Entradas mescladas vão para qual grupo?
5. A entrada "perdedora" vai para Lixeira ou é deletada permanentemente?

## WRS

Problem ✅ | Scope ✅ | Decisions ✅ | Risks ✅ | Criteria ✅ — 100/100 → CRISTALIZADO
