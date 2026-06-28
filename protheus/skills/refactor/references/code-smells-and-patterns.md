# Code Smells, Refactoring Techniques & Design Patterns

Detailed before/after examples for common refactoring scenarios. Referenced from the main [SKILL.md](../SKILL.md).

> **CRITICAL — Method Implementation Syntax**: When refactoring classes, remember that method **implementations** (outside `class`/`endclass`) NEVER use access modifiers (`public`, `private`, `protected`) or `static`. Always use bare `method methodName() class ClassName`.

---

## Common Code Smells & Fixes

### 1. Long Method/Function

```diff
# BAD: 300-line User Function that does everything
- #include "protheus.ch"
-
- User Function ProcOrder()
-   // 60 lines: open and fetch order from SCR
-   // 40 lines: validate customer in SA1
-   // 50 lines: calculate pricing with SB1 lookup
-   // 40 lines: update inventory in SB2
-   // 30 lines: create shipment record in SC5
-   // 30 lines: send email notifications
-   // 50 lines: generate print report
- Return

# GOOD: Broken into focused Static Functions
+ #include "tlpp-core.th"
+ #include "totvs.ch"
+
+ User Function ProcOrder() as Logical
+   Local aOrder   := {} as Array
+   Local nPricing := 0 as Numeric
+   Local lOk      := .F. as Logical
+
+   aOrder := FetchOrder()
+   If !ValidateCustomer(aOrder)
+     Return .F.
+   EndIf
+   nPricing := CalcPricing(aOrder)
+   UpdateInventory(aOrder)
+   CreateShipment(aOrder)
+   SendNotifications(aOrder, nPricing)
+   lOk := .T.
+ Return lOk
+
+ Static Function FetchOrder() as Array
+   // focused: query SCR work area
+ Return aResult
+
+ Static Function ValidateCustomer(aOrder as Array) as Logical
+   // focused: validate SA1 customer data
+ Return lValid
+
+ Static Function CalcPricing(aOrder as Array) as Numeric
+   // focused: SB1 price lookup and discount calculation
+ Return nTotal
```

### 2. Duplicated Code

```diff
# BAD: Same discount logic duplicated in two places
- #include "protheus.ch"
-
- User Function CalcUsrDisc(cMembership, nTotal)
-   If cMembership == "GOLD"
-     Return nTotal * 0.2
-   ElseIf cMembership == "SILVER"
-     Return nTotal * 0.1
-   EndIf
- Return 0
-
- User Function CalcOrdDisc(cMembership, nTotal)
-   If cMembership == "GOLD"
-     Return nTotal * 0.2
-   ElseIf cMembership == "SILVER"
-     Return nTotal * 0.1
-   EndIf
- Return 0

# GOOD: Extract common logic into a shared Static Function
+ #include "tlpp-core.th"
+ #include "totvs.ch"
+
+ Static Function GetDiscountRate(cMembership as Character) as Numeric
+   Local nRate := 0 as Numeric
+   Do Case
+     Case cMembership == "GOLD"
+       nRate := 0.2
+     Case cMembership == "SILVER"
+       nRate := 0.1
+   EndCase
+ Return nRate
+
+ User Function CalcUsrDisc(cMembership as Character, nTotal as Numeric) as Numeric
+ Return nTotal * GetDiscountRate(cMembership)
+
+ User Function CalcOrdDisc(cMembership as Character, nTotal as Numeric) as Numeric
+ Return nTotal * GetDiscountRate(cMembership)
```

### 3. Large Class/Module

```diff
# BAD: God class that handles everything
- #include "tlpp-core.th"
-
- Class TOrderManager
-   Public Method New() as Object
-   Public Method CreateOrder() as Logical
-   Public Method UpdateOrder() as Logical
-   Public Method DeleteOrder() as Logical
-   Public Method SendEmail() as Logical
-   Public Method GenerateReport() as Logical
-   Public Method ProcessPayment() as Logical
-   Public Method ValidateAddress() as Logical
-   // 50 more methods...
- EndClass

# GOOD: Single responsibility per class
+ #include "tlpp-core.th"
+
+ Class TOrderService
+   Public Method New() as Object
+   Public Method Create(jData as Json) as Logical
+   Public Method Update(cOrderId as Character, jData as Json) as Logical
+   Public Method Delete(cOrderId as Character) as Logical
+ EndClass
+
+ Class TEmailService
+   Public Method New() as Object
+   Public Method Send(cTo as Character, cSubject as Character, cBody as Character) as Logical
+ EndClass
+
+ Class TReportService
+   Public Method New() as Object
+   Public Method Generate(cType as Character, jParams as Json) as Logical
+ EndClass
+
+ Class TPaymentService
+   Public Method New() as Object
+   Public Method Process(nAmount as Numeric, cMethod as Character) as Logical
+ EndClass
```

### 4. Long Parameter List

```diff
# BAD: Too many positional parameters
- User Function CadUsr(cEmail, cPasswd, cName, nAge, cAddr, cCity, cCountry, cPhone)
-   // easy to swap arguments by mistake
- Return

# GOOD: Group into a Json parameter object
+ User Function CadUsr(jUserData as Json) as Logical
+   Local cEmail  := jUserData["email"]  as Character
+   Local cPasswd := jUserData["passwd"] as Character
+   Local cName   := jUserData["name"]   as Character
+   Local nAge    := jUserData["age"]    as Numeric
+   Local cAddr   := jUserData["addr"]   as Character
+   Local cPhone  := jUserData["phone"]  as Character
+   // process with clear, named access
+ Return .T.

# EVEN BETTER: TLPP named parameters
+ lOk := CadUsr(            ;
+   cEmail  := "a@b.com",   ;
+   cPasswd := "secure123",  ;
+   cName   := "Test User",  ;
+   cAddr   := "123 Main St",;
+   cPhone  := "555-1234"    ;
+ )
```

### 5. Feature Envy

```diff
# BAD: User Function in the order module reaching heavily into SA1 (customer) data
- #include "protheus.ch"
-
- Static Function CalcDisc()
-   DbSelectArea("SA1")
-   If SA1->A1_TIPO == "G"  // gold membership
-     nDisc := SA1->A1_SALDO * 0.2
-   EndIf
-   If Year(dDataBase) - Year(SA1->A1_DTCAD) > 1
-     nDisc += SA1->A1_SALDO * 0.1
-   EndIf
- Return nDisc

# GOOD: Move logic to a customer-oriented helper
+ #include "tlpp-core.th"
+ #include "totvs.ch"
+
+ // Customer module — owns SA1 data
+ Static Function GetCustDiscRate() as Numeric
+   Local nRate := 0 as Numeric
+   DbSelectArea("SA1")
+   If SA1->A1_TIPO == "G"
+     nRate := 0.2
+   EndIf
+   If Year(dDataBase) - Year(SA1->A1_DTCAD) > 1
+     nRate += 0.1
+   EndIf
+ Return nRate
+
+ // Order module — delegates to customer helper
+ Static Function CalcDisc() as Numeric
+   Local nDisc := SA1->A1_SALDO * GetCustDiscRate() as Numeric
+ Return nDisc
```

### 6. Primitive Obsession

```diff
# BAD: Using raw strings for domain concepts — no validation
- User Function SendMail(cTo, cSubject, cBody)
-   // any string accepted, no format check
- Return
-
- User Function CadSupplier(cCountry, cCNPJ)
-   cDoc := cCountry + "-" + cCNPJ  // no validity check
- Return

# GOOD: Use TLPP domain classes with validation in New()
+ #include "tlpp-core.th"
+
+ Class TEmail
+   Private Data cValue as Character
+
+   Public Method New(cEmail as Character) as Object
+   Public Method GetValue() as Character
+ EndClass
+
+ Method New(cEmail as Character) as Object Class TEmail
+   If !("@" $ cEmail .And. "." $ cEmail)
+     UserException("Invalid email: " + cEmail)
+   EndIf
+   ::cValue := cEmail
+ Return Self
+
+ Method GetValue() as Character Class TEmail
+ Return ::cValue
+
+ Class TCNPJ
+   Private Data cValue as Character
+
+   Public Method New(cCNPJ as Character) as Object
+   Public Method GetValue() as Character
+   Public Method Format() as Character
+ EndClass
+
+ Method New(cCNPJ as Character) as Object Class TCNPJ
+   If Len(AllTrim(cCNPJ)) != 14
+     UserException("Invalid CNPJ: " + cCNPJ)
+   EndIf
+   ::cValue := cCNPJ
+ Return Self
+
+ Method GetValue() as Character Class TCNPJ
+ Return ::cValue
+
+ // Usage
+ Local oEmail := TEmail():New("user@example.com")
+ Local oCNPJ  := TCNPJ():New("12345678000195")
```

### 7. Magic Numbers/Strings

```diff
# BAD: Unexplained hardcoded values
- If SA1->A1_STATUS == "2"
-   // what does "2" mean?
- EndIf
- nDisc := nTotal * 0.15
- nTimeout := 86400

# GOOD: Named constants with #define
+ #define STATUS_ACTIVE    "1"
+ #define STATUS_INACTIVE  "2"
+ #define STATUS_BLOCKED   "3"
+
+ #define DISC_STANDARD  0.10
+ #define DISC_PREMIUM   0.15
+ #define DISC_VIP       0.20
+
+ #define ONE_DAY_SECS   86400
+
+ If SA1->A1_STATUS == STATUS_INACTIVE
+   // clear intent
+ EndIf
+ nDisc    := nTotal * DISC_PREMIUM
+ nTimeout := ONE_DAY_SECS
```

### 8. Nested Conditionals

```diff
# BAD: Arrow code — deeply nested If/EndIf blocks
- Static Function Process(oOrder)
-   If oOrder != Nil
-     If oOrder:oUser != Nil
-       If oOrder:oUser:lActive
-         If oOrder:nTotal > 0
-           Return ProcessOrder(oOrder)
-         Else
-           Return "Invalid total"
-         EndIf
-       Else
-         Return "User inactive"
-       EndIf
-     Else
-       Return "No user"
-     EndIf
-   Else
-     Return "No order"
-   EndIf
- Return ""

# GOOD: Guard clauses with early Return
+ Static Function Process(oOrder as Object) as Character
+   If oOrder == Nil
+     Return "No order"
+   EndIf
+   If oOrder:oUser == Nil
+     Return "No user"
+   EndIf
+   If !oOrder:oUser:lActive
+     Return "User inactive"
+   EndIf
+   If oOrder:nTotal <= 0
+     Return "Invalid total"
+   EndIf
+ Return ProcessOrder(oOrder)
```

### 9. Dead Code

```diff
# BAD: Unused code lingers
- Static Function OldImpl()
-   // old implementation kept "just in case"
- Return
-
- Private cDeprecated := "old"  // never referenced
-
- // Commented-out block:
- // Static Function OldCalc()
- //   nResult := nA + nB
- // Return

# GOOD: Remove it — version control has the history
+ // Delete unused functions, unused declarations, and commented-out code
+ // If you need it again, git history has it
```

### 10. Inappropriate Intimacy

```diff
# BAD: One module reaches deep into another module's work area internals
- Static Function ProcOrder()
-   DbSelectArea("SA1")
-   cStreet := SA1->(A1_ENDENT)     // reaching into customer address details
-   cConfig := SA1->(A1_XPARAM)     // accessing internal config fields
-   nLimit  := SA1->(A1_LC)         // breaking encapsulation
- Return

# GOOD: Ask, don't tell — use encapsulated helper functions
+ // Customer module exposes what is needed
+ Static Function GetShippingAddr() as Character
+   DbSelectArea("SA1")
+ Return AllTrim(SA1->A1_ENDENT)
+
+ Static Function GetCreditLimit() as Numeric
+   DbSelectArea("SA1")
+ Return SA1->A1_LC
+
+ // Order module delegates to customer helpers
+ Static Function ProcOrder() as Logical
+   Local cAddr  := GetShippingAddr() as Character
+   Local nLimit := GetCreditLimit()  as Numeric
+   // process using encapsulated accessors
+ Return .T.
```

---

## Extract Method Refactoring

### Before and After

```diff
# Before: One long function with mixed concerns
- #include "protheus.ch"
-
- User Function PrintRpt(aUsers)
-   ConOut("USER REPORT")
-   ConOut("============")
-   ConOut("")
-   ConOut("Total users: " + cValToChar(Len(aUsers)))
-   ConOut("")
-   ConOut("ACTIVE USERS")
-   ConOut("------------")
-   nActive := 0
-   For nI := 1 To Len(aUsers)
-     If aUsers[nI][2]  // lActive
-       ConOut("- " + aUsers[nI][1] + " (" + aUsers[nI][3] + ")")
-       nActive++
-     EndIf
-   Next nI
-   ConOut("")
-   ConOut("Active: " + cValToChar(nActive))
-   ConOut("")
-   ConOut("INACTIVE USERS")
-   ConOut("--------------")
-   nInactive := 0
-   For nI := 1 To Len(aUsers)
-     If !aUsers[nI][2]
-       ConOut("- " + aUsers[nI][1] + " (" + aUsers[nI][3] + ")")
-       nInactive++
-     EndIf
-   Next nI
-   ConOut("")
-   ConOut("Inactive: " + cValToChar(nInactive))
- Return

# After: Extracted into focused Static Functions
+ #include "tlpp-core.th"
+ #include "totvs.ch"
+
+ User Function PrintRpt(aUsers as Array) as Logical
+   PrintHeader("USER REPORT")
+   ConOut("Total users: " + cValToChar(Len(aUsers)))
+   ConOut("")
+   PrintSection("ACTIVE USERS", aUsers, .T.)
+   PrintSection("INACTIVE USERS", aUsers, .F.)
+ Return .T.
+
+ Static Function PrintHeader(cTitle as Character)
+   ConOut(cTitle)
+   ConOut(Replicate("=", Len(cTitle)))
+   ConOut("")
+ Return
+
+ Static Function PrintSection(cTitle as Character, aUsers as Array, lActive as Logical)
+   Local nI     := 0 as Numeric
+   Local nCount := 0 as Numeric
+   ConOut(cTitle)
+   ConOut(Replicate("-", Len(cTitle)))
+   For nI := 1 To Len(aUsers)
+     If aUsers[nI][2] == lActive
+       ConOut("- " + aUsers[nI][1] + " (" + aUsers[nI][3] + ")")
+       nCount++
+     EndIf
+   Next nI
+   ConOut("")
+   ConOut(cTitle + ": " + cValToChar(nCount))
+   ConOut("")
+ Return
```

---

## Introducing Type Safety

### From Untyped to Typed

```diff
# Before: No types — AdvPL style
- #include "protheus.ch"
-
- User Function CalcDisc(oUser, nTotal, cMembership, dDate)
-   If cMembership == "GOLD" .And. DoW(dDate) == 6
-     Return nTotal * 0.25
-   EndIf
-   If cMembership == "GOLD"
-     Return nTotal * 0.2
-   EndIf
- Return nTotal * 0.1

# After: Full TLPP type safety
+ #include "tlpp-core.th"
+ #include "totvs.ch"
+
+ #define MEMBER_BRONZE "BRONZE"
+ #define MEMBER_SILVER "SILVER"
+ #define MEMBER_GOLD   "GOLD"
+
+ #define RATE_BRONZE      0.10
+ #define RATE_SILVER      0.15
+ #define RATE_GOLD        0.20
+ #define RATE_GOLD_FRIDAY 0.25
+
+ #define DOW_FRIDAY 6
+
+ User Function CalcDisc(cCustId as Character, nTotal as Numeric, dDate as Date) as Json
+   Local cMembership := GetMembership(cCustId) as Character
+   Local nRate       := RATE_BRONZE as Numeric
+   Local nDiscount   := 0 as Numeric
+
+   If nTotal < 0
+     UserException("Total cannot be negative")
+   EndIf
+
+   If dDate == Nil
+     dDate := dDataBase
+   EndIf
+
+   Do Case
+     Case cMembership == MEMBER_GOLD .And. DoW(dDate) == DOW_FRIDAY
+       nRate := RATE_GOLD_FRIDAY
+     Case cMembership == MEMBER_GOLD
+       nRate := RATE_GOLD
+     Case cMembership == MEMBER_SILVER
+       nRate := RATE_SILVER
+   EndCase
+
+   nDiscount := nTotal * nRate
+
+   Local jResult := JsonObject():New() as Json
+   jResult["original"] := nTotal
+   jResult["discount"] := nDiscount
+   jResult["final"]    := nTotal - nDiscount
+   jResult["rate"]     := nRate
+ Return jResult
```

---

## Design Patterns for Refactoring

### Strategy Pattern

```diff
# Before: Conditional logic with If/ElseIf chain
- Static Function CalcShip(nOrderTotal, cMethod)
-   If cMethod == "standard"
-     If nOrderTotal > 50
-       Return 0
-     Else
-       Return 5.99
-     EndIf
-   ElseIf cMethod == "express"
-     If nOrderTotal > 100
-       Return 9.99
-     Else
-       Return 14.99
-     EndIf
-   ElseIf cMethod == "overnight"
-     Return 29.99
-   EndIf
- Return 0

# After: Strategy pattern with TLPP classes
+ #include "tlpp-core.th"
+
+ Class TShippingStrategy
+   Public Method New() as Object
+   Public Method Calculate(nOrderTotal as Numeric) as Numeric
+ EndClass
+
+ Method New() as Object Class TShippingStrategy
+ Return Self
+
+ Method Calculate(nOrderTotal as Numeric) as Numeric Class TShippingStrategy
+ Return 0
+
+ // ---
+
+ Class TStandardShipping From TShippingStrategy
+   Public Method Calculate(nOrderTotal as Numeric) as Numeric
+ EndClass
+
+ Method Calculate(nOrderTotal as Numeric) as Numeric Class TStandardShipping
+   If nOrderTotal > 50
+     Return 0
+   EndIf
+ Return 5.99
+
+ // ---
+
+ Class TExpressShipping From TShippingStrategy
+   Public Method Calculate(nOrderTotal as Numeric) as Numeric
+ EndClass
+
+ Method Calculate(nOrderTotal as Numeric) as Numeric Class TExpressShipping
+   If nOrderTotal > 100
+     Return 9.99
+   EndIf
+ Return 14.99
+
+ // ---
+
+ Class TOvernightShipping From TShippingStrategy
+   Public Method Calculate(nOrderTotal as Numeric) as Numeric
+ EndClass
+
+ Method Calculate(nOrderTotal as Numeric) as Numeric Class TOvernightShipping
+ Return 29.99
+
+ // Usage:
+ Static Function CalcShip(nOrderTotal as Numeric, oStrategy as Object) as Numeric
+ Return oStrategy:Calculate(nOrderTotal)
```

### Chain of Responsibility

```diff
# Before: Flat validation with accumulated errors
- Static Function Validate(jUser)
-   Local aErrors := {}
-   If Empty(jUser["email"])
-     AAdd(aErrors, "Email required")
-   ElseIf !("@" $ jUser["email"])
-     AAdd(aErrors, "Invalid email")
-   EndIf
-   If Empty(jUser["name"])
-     AAdd(aErrors, "Name required")
-   EndIf
-   If jUser["age"] < 18
-     AAdd(aErrors, "Must be 18+")
-   EndIf
-   If jUser["country"] == "blocked"
-     AAdd(aErrors, "Country not supported")
-   EndIf
- Return aErrors

# After: Chain of Responsibility with TLPP classes
+ #include "tlpp-core.th"
+
+ Class TValidator
+   Protected Data oNext as Object
+
+   Public Method New() as Object
+   Public Method SetNext(oValidator as Object) as Object
+   Public Method Validate(jUser as Json) as Character
+   Protected Method DoValidate(jUser as Json) as Character
+ EndClass
+
+ Method New() as Object Class TValidator
+   ::oNext := Nil
+ Return Self
+
+ Method SetNext(oValidator as Object) as Object Class TValidator
+   ::oNext := oValidator
+ Return oValidator
+
+ Method Validate(jUser as Json) as Character Class TValidator
+   Local cError := ::DoValidate(jUser) as Character
+   If !Empty(cError)
+     Return cError
+   EndIf
+   If ::oNext != Nil
+     Return ::oNext:Validate(jUser)
+   EndIf
+ Return ""
+
+ Method DoValidate(jUser as Json) as Character Class TValidator
+ Return ""
+
+ // ---
+
+ Class TEmailRequiredValidator From TValidator
+   Protected Method DoValidate(jUser as Json) as Character
+ EndClass
+
+ Method DoValidate(jUser as Json) as Character Class TEmailRequiredValidator
+   If Empty(jUser["email"])
+     Return "Email required"
+   EndIf
+ Return ""
+
+ // ---
+
+ Class TEmailFormatValidator From TValidator
+   Protected Method DoValidate(jUser as Json) as Character
+ EndClass
+
+ Method DoValidate(jUser as Json) as Character Class TEmailFormatValidator
+   If !Empty(jUser["email"]) .And. !("@" $ jUser["email"])
+     Return "Invalid email"
+   EndIf
+ Return ""
+
+ // Build the chain:
+ Local oValidator := TEmailRequiredValidator():New()
+ oValidator:SetNext(TEmailFormatValidator():New()):;
+   SetNext(TNameValidator():New()):;
+   SetNext(TAgeValidator():New()):;
+   SetNext(TCountryValidator():New())
```

---

## AdvPL/TLPP-Specific Code Smells

### 11. IIF Usage

```diff
- // BAD: IIF makes debugging harder and prevents line-level code coverage
- cStatus := IIF(lActive, "Active", "Inactive")
- nValue  := IIF(nQty > 0, nQty * nPrice, 0)

+ // GOOD: Explicit If/Else is debuggable and testable
+ If lActive
+   cStatus := "Active"
+ Else
+   cStatus := "Inactive"
+ EndIf
+
+ If nQty > 0
+   nValue := nQty * nPrice
+ Else
+   nValue := 0
+ EndIf
```

### 12. API Calls in Loops

```diff
- // BAD: GetMV called inside loop — executes SX6 lookup every iteration
- For nI := 1 To Len(aItems)
-   cParam := GetMV("MV_PARAM1")
-   // process using cParam
- Next nI

+ // GOOD: Cache before loop
+ cParam := GetMV("MV_PARAM1")
+ For nI := 1 To Len(aItems)
+   // process using cached cParam
+ Next nI
```

### 13. UI Calls in Transactions

```diff
- // BAD: MsgYesNo inside transaction — blocks the thread and can cause deadlock
- Begin Transaction
-   RecLock("SA1", .F.)
-   SA1->A1_NOME := cNewName
-   If MsgYesNo("Confirm change?")  // PROHIBITED inside transaction
-     MsUnlock()
-   EndIf
- End Transaction

+ // GOOD: UI before transaction, logic inside
+ If MsgYesNo("Confirm change?")
+   Begin Transaction
+     RecLock("SA1", .F.)
+     SA1->A1_NOME := cNewName
+     MsUnlock()
+   End Transaction
+ EndIf
```

### 14. SQL Injection via Concatenation

```diff
- // BAD: User input concatenated directly into SQL
- cQuery := "SELECT A1_NOME FROM " + RetSQLName("SA1")
- cQuery += " WHERE A1_COD = '" + cUserInput + "'"

+ // GOOD: FWExecStatement parameterizes dynamic values and caches the prepared query
+ Local oStatement := FWExecStatement():New(ChangeQuery( ;
+   "SELECT A1_NOME FROM " + RetSQLName("SA1") + " WHERE A1_COD = ?"))
+ oStatement:SetString(1, cUserInput)
+ cAlias := oStatement:OpenAlias()
+ // ... consume (cAlias)->A1_NOME ...
+ (cAlias)->(DBCloseArea())
+ oStatement:Destroy()
```

### 15. ISAM Driver Usage

```diff
- // BAD: ISAM driver — deprecated and slow
- cTmpFile := CriaTrab(Nil, .F.)
- DbCreate(cTmpFile, aStruct, "DBFCDXADS")
- DbUseArea(.T., "DBFCDXADS", cTmpFile, cAlias)

+ // GOOD: FWTemporaryTable with relational mode
+ Local oTempTable := FWTemporaryTable():New(cAlias)
+ oTempTable:SetFields(aStruct)
+ oTempTable:Create()
```
