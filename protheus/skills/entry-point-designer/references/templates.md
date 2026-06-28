# Entry Point Code Templates

> **Default**: TLPP. Always use the TLPP template unless the user explicitly requested AdvPL (`.prw`).

---

## TLPP Template (default)

> **File name reminder**: save as `{PE_NAME}.tlpp` (e.g., `MT410INC.tlpp`). No namespaces, no prefixes, no suffixes.
> **Function name reminder**: declare `User Function {PE_NAME}()` — **NEVER** `User Function U_{PE_NAME}()`.

```tlpp
#include "tlpp-core.th"
#include "totvs.ch"

/*/{Protheus.doc} {PE_NAME}
Ponto de entrada — {What this entry point does}.
Acionado em {trigger moment} na rotina {Standard routine name} ({Module}).

PARAMIXB:
  [1] {Type} — {Description of param 1}
  [2] {Type} — {Description of param 2}

@type user function
@author {Author Name}
@since {dd/mm/yyyy}
@return {type}, {Description of return value}
@obs Não adicionar prefixo U_ na declaração da função. Não chamar funções de UI se executado dentro de transação.
@see {Standard routine name}
/*/
User Function {PE_NAME}() as {ReturnType}
  Local aParam  as Array
  Local xParam1 as {Type}
  Local xParam2 as {Type}
  Local lRet    := .T. as Logical

  If Type("PARAMIXB") <> "A" .Or. Len(PARAMIXB) < 2
    Return lRet
  EndIf

  aParam  := PARAMIXB
  xParam1 := aParam[1]
  xParam2 := aParam[2]

  Try
    lRet := ProcessEntryPoint(xParam1, xParam2)
  Catch oError
    FWLogMsg("ERROR", , "EP", "{PE_NAME}", , "01", oError:Description, 0, 0, {})
    lRet := .T.
  EndTry

Return lRet

/*/{Protheus.doc} ProcessEntryPoint
Implementa a lógica de negócio do ponto de entrada {PE_NAME}.
@type static function
@author {Author Name}
@since {dd/mm/yyyy}
@param xParam1, {type}, {Description of param 1}
@param xParam2, {type}, {Description of param 2}
@return logical, .T. permite a operação, .F. bloqueia
/*/
Static Function ProcessEntryPoint(xParam1 as {Type}, xParam2 as {Type}) as Logical
  // Focused business logic here
Return .T.
```

---

## AdvPL Template (opt-in)

> **Use only when the user explicitly asks for AdvPL** (e.g., "em AdvPL", "como .prw", "legacy AdvPL"). Otherwise use the TLPP template above.
>
> **File name reminder**: save as `{PE_NAME}.prw` (e.g., `MT410INC.prw`). No namespaces, no prefixes, no suffixes.
> **Function name reminder**: declare `User Function {PE_NAME}()` — **NEVER** `User Function U_{PE_NAME}()`.

```advpl
#include "totvs.ch"

/*/{Protheus.doc} {PE_NAME}
Ponto de entrada — {What this entry point does}.
Acionado em {trigger moment} na rotina {Standard routine name} ({Module}).

PARAMIXB:
  [1] {Type} — {Description of param 1}
  [2] {Type} — {Description of param 2}

@type user function
@author {Author Name}
@since {dd/mm/yyyy}
@return {type}, {Description of return value — e.g.: .T. allows the operation, .F. blocks it}
@obs Não adicionar prefixo U_ na declaração da função.
@see {Standard routine name}
/*/
User Function {PE_NAME}()
  Local aParam   := PARAMIXB
  Local xParam1  := Nil
  Local xParam2  := Nil
  Local lRet     := .T.

  If Type("PARAMIXB") == "A" .And. Len(PARAMIXB) >= 2
    xParam1 := PARAMIXB[1]
    xParam2 := PARAMIXB[2]
  Else
    Return lRet
  EndIf

  lRet := ProcessEntryPoint(xParam1, xParam2)

Return lRet

/*/{Protheus.doc} ProcessEntryPoint
Implementa a lógica de negócio do ponto de entrada {PE_NAME}.
@type static function
@author {Author Name}
@since {dd/mm/yyyy}
@param xParam1, {type}, {Description of param 1}
@param xParam2, {type}, {Description of param 2}
@return logical, .T. permite a operação, .F. bloqueia
/*/
Static Function ProcessEntryPoint(xParam1, xParam2)
  // Focused business logic here
Return .T.
```
