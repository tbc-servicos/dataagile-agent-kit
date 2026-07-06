# Referência de Regras SonarQube — AdvPL/TLPP

Quality gate canônico da TOTVS para revisão de código AdvPL/TLPP. Use estas regras
(G1–G5) como checklist primário no `/protheus:reviewer`, classificando cada achado
pela severidade indicada.

Fonte oficial: `https://sonar-rules.engpro.totvs.com.br`.

> Conteúdo adaptado de `totvs/engpro-advpl-tlpp-skills` (licença MIT) — Engenharia
> Protheus TOTVS. Mantido aqui como referência embutida (independe de MCP/online).

---

## G1 — Segurança

| Regra | Título | Severidade | Padrão proibido | Alternativa |
|------|-------|----------|----------------------|---------------------|
| BG1000 | Troca de contexto em REST/SOAP | MAJOR | `RpcSetEnv`, `RpcSetType` em funções REST/SOAP | Configurar `PrepareIn` do REST Server / ambiente do WebService |
| CA2022 | StaticCall | CRITICAL | `StaticCall()` | `FWLoadModel()`, `FWLoadMenuDef()`, chamada direta por namespace |
| CA2023 | PTInternal | CRITICAL | `PTInternal()` | Proibido sem exceção |
| CA2024 | Atribuição a `__cUserID` | CRITICAL | `__cUserID := ...` | Read-only — nunca atribuir |
| CA2025 | Atribuição a `cEmpAnt` | CRITICAL | `cEmpAnt := ...` | Usar APIs de ambiente |
| CA2050 | SQL Injection | INFO* | Concatenar input em SQL | `FWExecStatement` |
| CA2051 | SQL Injection (Embedded) | INFO* | Concatenar input em Embedded SQL | `FWExecStatement` |
| CA2052 | Senha exposta no fonte | INFO* | Credencial hardcoded | Variável de ambiente / config do AppServer |
| CA2053 | `CREATE PROCEDURE` no fonte | CRITICAL | Procedure direta em AdvPL/TLPP | SPManager |
| BG1200 | Override de ErrorBlock | INFO | `ErrorBlock({...})` | `Try-Catch` (TLPP) |

> *CA2050/CA2051/CA2052 são INFO no SonarQube, mas representam vulnerabilidades de alto impacto.

---

## G2 — Performance e Loops

| Regra | Título | Severidade | Padrão proibido | Alternativa |
|------|-------|----------|----------------------|---------------------|
| CA1002 | API de UI em transação | MAJOR | `MsgAlert/MsgYesNo/MsgInfo/Aviso/Help/Pergunte/ParamBox` dentro de `Begin/End Transaction` ou commit MVC | Mover UI pra fora da transação |
| CA1003 | API proibida em loop | MAJOR | `GetMV/SuperGetMV/ExistBlock/AllUsers` em `While/For/Do While` | Cachear antes do loop |
| CA1003-2 | API em loop (em análise) | MAJOR | `Type()`, `Pergunte()` em loops | Cachear antes do loop |
| CS1000 | Query direta em AdvPL/TLPP | MAJOR | SQL cru sem avaliação | Avaliar impacto Cloud; preferir APIs do framework |

---

## G3 — Legado e Depreciado

| Regra | Título | Severidade | Padrão proibido | Alternativa |
|------|-------|----------|----------------------|---------------------|
| CA1000 | Acesso driver ISAM | MAJOR | `MSCREATE/DBCREATE/CRIATRAB(.T.)/COPY TO` | `FWTemporaryTable` (modo relacional) |
| CA1001 | Lock exclusivo em disco | MAJOR | Semáforo por arquivo / lock exclusivo | `LockByName()` |
| CA1004 | API de console | MINOR | `ConOut/OutErr/?` | `FWLogMsg()` |
| CA1006/CA2020 | Função/classe depreciada | MINOR | `AllUsers()` | `FWSFALLUSERS()` |
| **CA2014** | **PutSX1 depreciado** | **INFO** | **`PutSX1()`** | **API padrão de SX1 (Configurador / Release Incremental)** |
| CA2015 | Override de FormCommit | INFO | Sobrescrever `FormCommit` direto | `FWModelEvent` / `FWFormCommit(oModel)` |
| CA2017-CA2019 | APIs SPF/binárias proibidas | CRITICAL | Acesso SPF, read/write binário | APIs do framework |
| CA4000 | IIF (clean code) | INFO | `IIF()`/`IF()` inline | bloco `If/Else/EndIf` |
| CA3001 | Include deve ser minúsculo | MINOR | `#INCLUDE "TOTVS.CH"` | `#include "totvs.ch"` |
| CA3002 | Herança incorreta | MINOR | `LongClassName` | `LongNameClass` |

> **CA2014** é a regra por trás do caso RCTBM012 (FSWTBCSD-564): `PutSX1`/`AjustaSX1`
> em runtime não criam dicionário no P12 — usar Configurador/Release Incremental.

---

## G4 — Metadados (acesso direto proibido)

Acesso direto às tabelas de sistema (SX*) via `DbSelectArea` é proibido — usar APIs do framework.

| Regra | Tabela | Severidade | API requerida |
|------|-------|----------|-------------|
| CA2000 | SM0 (Empresas) | CRITICAL | APIs padrão de empresa |
| CA2001 | SIX (Índices) | CRITICAL/MINOR | APIs padrão de índice |
| CA2002 | SX1 (Perguntas) | CRITICAL/MINOR | `Pergunte()` |
| CA2003 | SX2 (Tabelas) | CRITICAL/MINOR | `RetSqlName()`, `X2Nome()` |
| CA2004 | SX3 (Campos) | CRITICAL/MINOR | `FWSX3Util()`, `FWFormStruct()` |
| CA2005 | SX7 (Gatilhos) | CRITICAL/MINOR | APIs padrão (indireto) |
| CA2006 | SX9 (Relacionamentos) | CRITICAL/MINOR | APIs padrão (indireto) |
| CA2009 | SX5 (Tabelas genéricas) | MAJOR/MINOR | APIs padrão SX5 |
| CA2010 | SX6 (Parâmetros) | MAJOR/MINOR | `GetMV()`/`SuperGetMV()` |
| CA2021 | SE5 (Mov. caixa) | MAJOR | Família `FKx` + `ExecAuto` |

---

## G5 — Compilação / Clean Code

| Regra | Título | Severidade | Descrição |
|------|-------|----------|-------------|
| CA0000 | Erro de compilação | MAJOR | Sintaxe inválida, charset errado (**usar Windows-1252**), fechamento de bloco inválido |
| CA1005 | Referências a INI (SmartERP) | MINOR | Avaliar compatibilidade Cloud |
| CA2016 | Log/erro sem I18N | MINOR | Mensagens devem usar internacionalização |
