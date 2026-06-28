# Documentation and Conventions — ProtheusDOC, Clean Code, TLPP

Detailed patterns for ProtheusDOC documentation, clean code conventions, and TLPP-specific review checks.

---

## ProtheusDOC Documentation

Every public element (Function, Class, public Method) **must** have a complete ProtheusDOC block. Static Functions and private methods **should** have one.

### Required Block Structure

```
/*/{Protheus.doc} <Identifier>
<Brief description>
@type <function|class|method>
[additional tags...]
/*/
```

### Mandatory Tags

| Tag       | Required For                        | Rule                                         |
| --------- | ----------------------------------- | -------------------------------------------- |
| `@type`   | All elements                        | Must be `function`, `class`, or `method`     |
| `@author` | All elements                        | Author name                                  |
| `@since`  | All elements                        | Introduction date (dd/mm/yyyy) or version    |
| `@param`  | Functions/Methods with parameters   | One per parameter: `name, type, description` |
| `@return` | Functions/Methods with return value | `type, description`                          |

### Recommended Tags

| Tag            | When to Use                                 |
| -------------- | ------------------------------------------- |
| `@version`     | Product/server version required             |
| `@description` | When the brief description is insufficient  |
| `@example`     | Public-facing functions and methods         |
| `@see`         | Cross-references to related elements        |
| `@table`       | When the element accesses database tables   |
| `@obs`         | Important behavioral notes                  |
| `@deprecated`  | When the element is being phased out        |
| `@history`     | Change history: `date, author, description` |

### Documentation Review Checklist

- [ ] Every User Function has a `/*/{Protheus.doc}` block
- [ ] Every Class definition has a `/*/{Protheus.doc}` block
- [ ] Every public Method has a `/*/{Protheus.doc}` block (identifier: `ClassName::MethodName`)
- [ ] The `@type` tag is present and correct (`function`, `class`, or `method`)
- [ ] The `@author` and `@since` tags are present
- [ ] Every parameter has a matching `@param` tag with name, type, and description
- [ ] Optional parameters use bracket notation: `@param [paramName], type, description`
- [ ] Return value is documented with `@return type, description`
- [ ] The identifier matches the actual element name exactly
- [ ] The block opens with `/*/{Protheus.doc}` and closes with `/*/`

### Common Documentation Mistakes

```advpl
// BAD: Missing @type tag
/*/{Protheus.doc} MyFunc
Does something useful.
@author Dev Name
/*/

// BAD: Identifier does not match function name
/*/{Protheus.doc} MyFunction
@type user function
/*/
User Function MyFunc()

// BAD: Missing @param for existing parameters
/*/{Protheus.doc} CalcTotal
Calculates the order total.
@type user function
@return numeric, Total value
/*/
User Function CalcTotal(cCustCode, nDiscount)  // cCustCode and nDiscount undocumented

// GOOD: Complete ProtheusDOC block
/*/{Protheus.doc} CalcTotal
Calculates the order total applying customer-specific discount.
@type user function
@author Dev Name
@since 15/03/2026
@param cCustCode, character, Customer code from SA1
@param nDiscount, numeric, Discount percentage (0-100)
@return numeric, Calculated total after discount
@example
  nTotal := CalcTotal("000001", 10)
@see ApplyDiscount
@table SA1, SC5
/*/
User Function CalcTotal(cCustCode, nDiscount)
```

---

## Clean Code and Naming Conventions

### Variable Naming

| Prefix | Type            | Examples                                  |
| ------ | --------------- | ----------------------------------------- |
| `c`    | Character       | `cName`, `cCodCli`, `cQuery`              |
| `n`    | Numeric         | `nTotal`, `nCount`, `nIndex`              |
| `l`    | Logical         | `lOk`, `lFound`, `lActive`                |
| `d`    | Date            | `dDueDate`, `dStart`                      |
| `a`    | Array           | `aItems`, `aFields`, `aResult`            |
| `o`    | Object          | `oModel`, `oStatement`, `oTempTable`      |
| `b`    | Code Block      | `bCondition`, `bAction`                   |
| `x`    | Variant/Unknown | `xValue` (avoid — prefer typed variables) |

### Variable Scope

```advpl
// BAD: Using Private when Local suffices — leaks into call stack
Private cOrder := ""
Private nTotal := 0

// GOOD: Local variables stay in scope
Local cOrder := "" as Character
Local nTotal := 0  as Numeric
```

**Rule:** Use `Local` by default. Use `Private` only when the variable must be intentionally visible to called functions.

### User Function Size and Responsibility

- Functions should be **< 50 lines** of logic (excluding comments and blank lines)
- Each function should do **one thing**
- If a function has multiple sections separated by blank lines, consider extracting

### Include Directive Case (CA3001)

```advpl
// BAD
#INCLUDE "TOTVS.CH"
#Include "Totvs.ch"

// GOOD
#include "totvs.ch"
#include "tlpp-core.th"
```

### Magic Numbers and Strings

```advpl
// BAD: Magic numbers scattered in code
If nStatus == 3
  nDiscount := nTotal * 0.15
EndIf

// GOOD: Named constants
#define STATUS_APPROVED  3
#define DISCOUNT_RATE    0.15

If nStatus == STATUS_APPROVED
  nDiscount := nTotal * DISCOUNT_RATE
EndIf
```

### Dead Code

Remove commented-out code blocks, unused variables, and unreachable code. Version control preserves history — dead code in source reduces readability.

---

## TLPP-Specific Checks

When reviewing `.tlpp` files, additionally verify the patterns below.

### File Extension Consistency

If the file uses TLPP-exclusive features (`#include "tlpp-core.th"`, Namespace, Try-Catch, type annotations, annotations), it **must** have a `.tlpp` extension. TLPP directives are silently ignored in `.prw`/`.prx` files.

### Type Annotations

```advpl
// BAD: Untyped variables and functions (legacy AdvPL style in .tlpp file)
Static Function CalcTotal(cClient, aItems)
  Local nTotal := 0
Return nTotal

// GOOD: Fully typed
Static Function CalcTotal(cClient as Character, aItems as Array) as Numeric
  Local nTotal := 0 as Numeric
Return nTotal
```

### Namespace Usage

```tlpp
// BAD: No namespace in .tlpp file
#include "tlpp-core.th"
User Function MyRoutine()

// GOOD: Organized with namespace
#include "tlpp-core.th"
Namespace company.module.feature
User Function MyRoutine()
```

### Error Handling

```tlpp
// BAD: ErrorBlock pattern in TLPP
bOldError := ErrorBlock({|e| MyErrHandler(e)})
// risky code
ErrorBlock(bOldError)

// GOOD: Try-Catch in TLPP
Try
  // risky code
Catch oError
  FWLogMsg("ERROR", , "MODULE", "Function", , , oError:Description, , , )
EndTry
```

### Class & Method Declaration vs Implementation

```tlpp
// BAD: Access modifiers or static in method implementation
public method new() as object class View     // WRONG: "public" in implementation
static method callback() class View          // WRONG: "static" in implementation
private method validate() class View         // WRONG: "private" in implementation

// GOOD: Bare "method" in implementation, modifiers only in declaration
class View
    public method new() as object            // declaration: has "public"
    static method callback()                 // declaration: has "static"
    private method validate() as logical     // declaration: has "private"
endclass

method new() as object class View            // implementation: just "method"
method callback() class View                 // implementation: just "method"
method validate() as logical class View      // implementation: just "method"
```
