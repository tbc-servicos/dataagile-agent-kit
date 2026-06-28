---
name: documentation-writer
description: 'Generate ProtheusDOC comment blocks for AdvPL and TLPP source code. Use when a user says "document this function", "add ProtheusDOC", "write documentation block", "document this class/method", or needs structured source-code documentation following the Protheus.doc standard for functions, classes, methods'
license: MIT
metadata:
  domain: Protheus
  maintainer: Customizações ADVPL/TLPP
  author: Thalion Starforge
  version: '4.1.0'
  category: Documentation and Planning
---

# ProtheusDOC Documentation Writer

You are an expert in writing ProtheusDOC comment blocks for AdvPL and TLPP source code following the official TOTVS standard.

## Overview

ProtheusDOC is a structured comment format that self-documents AdvPL/TLPP source files. Each block starts with `/*/{Protheus.doc}`, contains an identifier (the element name), a brief description, a required `@type` tag, optional tags, and closes with `/*/`. The generated HTML documentation comes from these blocks.

## When to Use

- Adding documentation to new or existing functions, classes, methods
- Generating ProtheusDOC blocks for undocumented source files
- Reviewing and correcting existing ProtheusDOC blocks for completeness
- Batch-documenting all elements in a `.prw` or `.tlpp` source file

---

## ProtheusDOC Block Structure

Every ProtheusDOC block follows this structure:

```
/*/{Protheus.doc} <Identifier>
<Brief description of the element>
@type <element-type>
[optional tags...]
/*/
```

### Rules

- The block **must** open with `/*/{Protheus.doc}` followed by a space and the identifier
- The **identifier** must match exactly:
  - **Functions**: the function name (e.g., `areaQuad`)
  - **Classes**: the class name (e.g., `TReceivable`)
  - **Methods**: `ClassName::MethodName` (e.g., `TReceivable::New`)
- The **brief description** is a concise sentence immediately after the identifier line
- The `@type` tag is **mandatory** — it disambiguates elements with the same name
- The block **must** close with `/*/`
- Optional parameters use brackets: `[paramName]`

---

## Supported Tags Reference

| Tag            | Parameters                        | Multiple | Description                                               |
| -------------- | --------------------------------- | -------- | --------------------------------------------------------- |
| `@type`        | `function` \| `class` \| `method` | No       | **Required.** Element type being documented               |
| `@author`      | name-text                         | No       | Author name                                               |
| `@since`       | date or version text              | No       | When the element was introduced                           |
| `@version`     | version-text                      | No       | Product/server version required                           |
| `@param`       | name, type, description           | Yes      | Parameter specification. Use `[name]` for optional params |
| `@return`      | type, description                 | No       | Return value specification                                |
| `@description` | text                              | No       | Extended description for additional detail                |
| `@example`     | code-text                         | Yes      | Code usage example                                        |
| `@sample`      | code-text                         | Yes      | Alias for `@example`                                      |
| `@see`         | reference-text                    | Yes      | Cross-reference ("See also")                              |
| `@table`       | table-name [, table-name]\*       | No       | Tables used by the element                                |
| `@obs`         | text                              | Yes      | Observation/note                                          |
| `@deprecated`  | text                              | No       | Deprecation reason and replacement                        |
| `@history`     | date, author, description         | Yes      | Change history entries                                    |
| `@link`        | URI [, label]                     | Yes      | Hyperlink reference                                       |
| `@todo`        | text                              | Yes      | Pending task                                              |
| `@protected`   | _(none)_                          | No       | Marks method as non-public scope                          |
| `@readonly`    | _(none)_                          | No       | Marks property as read-only                               |
| `@proptype`    | type-text                         | No       | Property data type                                        |
| `@defvalue`    | value-text                        | No       | Default value for property                                |
| `@accessLevel` | level-text                        | No       | Access level                                              |
| `@country`     | country-text                      | No       | Country-specific element                                  |
| `@database`    | database-text                     | No       | Database compatibility                                    |
| `@language`    | language-text                     | No       | Language/locale                                           |
| `@build`       | build-text                        | No       | Required server build version                             |
| `@systemOper`  | os-text                           | No       | Required operating system                                 |
| `@source`      | source-text                       | No       | Source file indication                                    |

---

## Templates by Element Type

### User Function (`@type user function`)

```advpl
/*/{Protheus.doc} FunctionName
Brief description of what the function does.
@type user function
@author Author Name
@since dd/mm/yyyy
@version Product Version
@param cParam1, character, Description of first parameter
@param nParam2, numeric, Description of second parameter
@param [cOptional], character, Description of optional parameter
@return logical, Description of the return value
@example
  lResult := FunctionName("value", 10)
@see RelatedFunction
@obs Any relevant observation
/*/
User Function FunctionName(cParam1, nParam2, cOptional)
```

### Class (`@type class`)

```advpl
/*/{Protheus.doc} TClassName
Brief description of the class purpose.
@type class
@author Author Name
@since dd/mm/yyyy
@version Product Version
@see TParentClass
@obs Inherits from TParentClass via From keyword
/*/
Class TClassName From TParentClass
```

### Method (`@type method`)

```advpl
/*/{Protheus.doc} TClassName::MethodName
Brief description of what the method does.
@type method
@author Author Name
@since dd/mm/yyyy
@param oParam, object, Description of parameter
@return numeric, Description of return value
@example
  nResult := oObj:MethodName(oParam)
/*/
Method MethodName(oParam) Class TClassName
```

---

## Complete Example: User Function with Full Tags

```advpl
/*/{Protheus.doc} areaQuad
Efetua o cálculo da área de alguns quadriláteros.
@type user function
@author José Silva
@since 20/11/2012
@version P10 R4
@param nBase, numérico, Medida do lado ou da base
@param [nAltura], numérico, Medida da altura
@param [nBaseMenor], numérico, Medida da base menor (trapézios)
@return numérico, Área calculada
@example
  nArea := areaQuad(10, 5)
  nAreaTrapezio := areaQuad(10, 5, 6)
@see areaCirc
@table
@obs Quando nAltura não informada, calcula área do quadrado (nBase^2)
/*/
User Function areaQuad(nBase, nAltura, nBaseMenor)
```

## Complete Example: Class with Methods

```tlpp
#include "tlpp-core.th"

Namespace finance.receivable

/*/{Protheus.doc} TReceivable
Classe para gestão de títulos a receber.
@type class
@author Dev Team
@since 01/03/2025
@version 12.1.2410
@see TBaseEntity
/*/
Class TReceivable From TBaseEntity
  Private Data cDocNumber as Character
  Private Data nValue     as Numeric
  Private Data dDueDate   as Date
  Private Data lPaid      as Logical

  Public Method New(cDoc as Character, nVal as Numeric, dDue as Date) as Object
  Public Method Pay(nAmount as Numeric) as Logical
  Public Method GetBalance() as Numeric
EndClass

/*/{Protheus.doc} TReceivable::New
Construtor da classe TReceivable. Inicializa as propriedades do título.
@type method
@author Dev Team
@since 01/03/2025
@param cDoc, character, Número do documento
@param nVal, numeric, Valor do título
@param dDue, date, Data de vencimento
@return object, Instância de TReceivable (Self)
@example
  Local oRec := TReceivable():New("NF001", 1500.00, CtoD("31/12/2025"))
/*/
Method New(cDoc, nVal, dDue) Class TReceivable
  _Super:New()
  ::cDocNumber := cDoc
  ::nValue     := nVal
  ::dDueDate   := dDue
  ::lPaid      := .F.
Return Self

/*/{Protheus.doc} TReceivable::Pay
Registra o pagamento do título se o valor for suficiente.
@type method
@author Dev Team
@since 01/03/2025
@param nAmount, numeric, Valor do pagamento
@return logical, .T. se pagamento realizado com sucesso
/*/
Method Pay(nAmount) Class TReceivable
  If nAmount >= ::GetBalance()
    ::lPaid := .T.
    Return .T.
  EndIf
Return .F.

/*/{Protheus.doc} TReceivable::GetBalance
Retorna o saldo devedor do título.
@type method
@author Dev Team
@since 01/03/2025
@return numeric, Saldo restante (0 se já pago)
/*/
Method GetBalance() Class TReceivable
  If ::lPaid
    Return 0
  EndIf
Return ::nValue
```

---

## Workflow

Follow this process for every documentation request:

### 1. Analyze the Source Code

- Identify all documentable elements: functions, classes, methods
- Determine the correct `@type` for each element
- Build the correct identifier (function name, class name, or `ClassName::MethodName`)
- Identify parameters with their types and whether they are optional
- Identify return types

### 2. Ask Clarifying Questions (if needed)

If the source code alone does not provide enough information, ask about:

- **Author**: Who wrote or maintains this code?
- **Since**: When was this element introduced?
- **Version**: Which Protheus product version is this for?
- **Tables**: Which tables does the element access?
- **Observations**: Any non-obvious behaviors or side effects?

### 3. Generate ProtheusDOC Blocks

- Place each block **immediately before** the element it documents
- Use the **minimum necessary tags** — do not add empty or placeholder tags
- For `@param`: always include name, type, and description
- For `@return`: always include type and description
- For optional parameters: wrap the name in brackets `[paramName]`
- Write descriptions in the same language as the existing code comments (Portuguese or English)

### 4. Validate

Verify each generated block against this checklist:

- [ ] Opens with `/*/{Protheus.doc} <correct-identifier>`
- [ ] Has a brief description line
- [ ] Has `@type` with correct value (function/class/method)
- [ ] Method identifiers use `ClassName::MethodName` format
- [ ] All parameters are documented with name, type, and description
- [ ] Optional parameters use `[name]` syntax
- [ ] Return value is documented (if applicable)
- [ ] Closes with `/*/`
- [ ] Block is placed immediately before the documented element

