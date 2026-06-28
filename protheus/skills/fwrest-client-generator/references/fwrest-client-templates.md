# FWRest Client Code Templates

For authentication header construction see [fwrest-authentication-patterns.md](./fwrest-authentication-patterns.md).
For exact method signatures see [fwrest-api-reference.md](./fwrest-api-reference.md).

---

## Template 0 — Shared Helpers

Place these in a common include file so all integrations reuse them.

```tlpp
#include "tlpp-core.th"
#include "totvs.ch"

Namespace company.integration.rest

//-------------------------------------------------------------------
// Builds the standard header array for JSON-based REST calls.
//-------------------------------------------------------------------
Static Function BuildJsonHeader(cAuth as Character) as Array
  Local aHeader := {} as Array
  aAdd(aHeader, "Content-Type: application/json")
  aAdd(aHeader, "Accept: application/json")
  If !Empty(cAuth)
    aAdd(aHeader, "Authorization: " + cAuth)
  EndIf
Return aHeader

//-------------------------------------------------------------------
// Logs a REST client failure without leaking secrets.
//-------------------------------------------------------------------
Static Function LogRestError(cTag as Character, cUrl as Character, cHttpCode as Character, cError as Character, cBody as Character)
  Local cMsg := cTag + " | URL=" + cUrl + " | HTTP=" + cHttpCode + " | ERR=" + cError as Character
  If !Empty(cBody)
    cMsg += " | BODY=" + SubStr(cBody, 1, 500)
  EndIf
  FWLogMsg("ERROR", , "REST_CLIENT", FunName(), , "01", cMsg, 0, 0, {})
Return Nil
```

---

## Template 1 — GET with Query Parameters

```tlpp
#include "tlpp-core.th"
#include "totvs.ch"

Namespace company.integration.crm

//-------------------------------------------------------------------
// Fetches a paginated list of customers from the external CRM.
//-------------------------------------------------------------------
User Function CrmListCustomers(nPage as Numeric, nPageSize as Numeric) as Json
  Local oClient   := Nil as Object
  Local aHeader   := {} as Array
  Local cQuery    := "" as Character
  Local cResponse := "" as Character
  Local cHttpCode := "" as Character
  Local jResult   := JsonObject():New() as Json
  Local cToken    := GetMV("MV_CRM_TKN",, "") as Character
  Local cHost     := GetMV("MV_CRM_URL",, "https://crm.example.com") as Character
  Local lOk       := .F. as Logical

  // Build URI-safe query string
  cQuery := "page=" + cValToChar(nPage)
  cQuery += "&pageSize=" + cValToChar(nPageSize)

  // Build headers
  aAdd(aHeader, "Accept: application/json")
  aAdd(aHeader, "Authorization: Bearer " + cToken)

  Try
    oClient := FWRest():New(cHost)
    oClient:SetPath("/api/v1/customers")
    oClient:SetTimeOut(30)
    oClient:SetLegacySuccess(.F.)  // accept full 2xx range

    lOk := oClient:Get(aHeader, cQuery)
    cHttpCode := oClient:GetHTTPCode()
    cResponse := oClient:GetResult()

    If !lOk
      LogRestError("CrmListCustomers", cHost + "/api/v1/customers", cHttpCode, oClient:GetLastError(), cResponse)
      Return Nil
    EndIf

    If jResult:fromJson(cResponse) <> Nil
      LogRestError("CrmListCustomers.parse", cHost, cHttpCode, "Invalid JSON response", cResponse)
      Return Nil
    EndIf
  Catch oErr
    LogRestError("CrmListCustomers.exception", cHost, "", oErr:Description, "")
    Return Nil
  EndTry

  FreeObj(oClient)
Return jResult
```

---

## Template 2 — GET by ID (Path Parameter)

```tlpp
User Function CrmGetCustomer(cId as Character) as Json
  Local oClient   := Nil as Object
  Local aHeader   := {} as Array
  Local jResult   := JsonObject():New() as Json
  Local cToken    := GetMV("MV_CRM_TKN",, "") as Character
  Local cHost     := GetMV("MV_CRM_URL",, "") as Character
  Local cPath     := "/api/v1/customers/" + AllTrim(cId) as Character
  Local cHttpCode := "" as Character
  Local cResponse := "" as Character

  aAdd(aHeader, "Accept: application/json")
  aAdd(aHeader, "Authorization: Bearer " + cToken)

  Try
    oClient := FWRest():New(cHost)
    oClient:SetPath(cPath)
    oClient:SetTimeOut(15)
    oClient:SetChkStatus(.F.)  // we want to read 404 body too

    oClient:Get(aHeader)
    cHttpCode := oClient:GetHTTPCode()
    cResponse := oClient:GetResult()

    Do Case
      Case cHttpCode == "200"
        jResult:fromJson(cResponse)
      Case cHttpCode == "404"
        Return Nil
      Otherwise
        LogRestError("CrmGetCustomer", cHost + cPath, cHttpCode, oClient:GetLastError(), cResponse)
        Return Nil
    EndCase
  Catch oErr
    LogRestError("CrmGetCustomer.exception", cHost + cPath, "", oErr:Description, "")
    Return Nil
  EndTry

  FreeObj(oClient)
Return jResult
```

---

## Template 3 — POST JSON Body

```tlpp
User Function CrmCreateCustomer(jPayload as Json) as Json
  Local oClient   := Nil as Object
  Local aHeader   := {} as Array
  Local cBody     := jPayload:toJson() as Character
  Local cResponse := "" as Character
  Local cHttpCode := "" as Character
  Local jResult   := JsonObject():New() as Json
  Local cToken    := GetMV("MV_CRM_TKN",, "") as Character
  Local cHost     := GetMV("MV_CRM_URL",, "") as Character
  Local lOk       := .F. as Logical

  aAdd(aHeader, "Content-Type: application/json")
  aAdd(aHeader, "Accept: application/json")
  aAdd(aHeader, "Authorization: Bearer " + cToken)

  Try
    oClient := FWRest():New(cHost)
    oClient:SetPath("/api/v1/customers")
    oClient:SetTimeOut(30)
    oClient:SetPostParams(cBody)        // body goes here, NOT in :Post()
    oClient:SetLegacySuccess(.F.)

    lOk := oClient:Post(aHeader)
    cHttpCode := oClient:GetHTTPCode()
    cResponse := oClient:GetResult()

    If !lOk
      LogRestError("CrmCreateCustomer", cHost + "/api/v1/customers", cHttpCode, oClient:GetLastError(), cResponse)
      Return Nil
    EndIf

    jResult:fromJson(cResponse)
  Catch oErr
    LogRestError("CrmCreateCustomer.exception", cHost, "", oErr:Description, "")
    Return Nil
  EndTry

  FreeObj(oClient)
Return jResult
```

---

## Template 4 — PUT (Full Update)

```tlpp
User Function CrmUpdateCustomer(cId as Character, jPayload as Json) as Logical
  Local oClient   := Nil as Object
  Local aHeader   := {} as Array
  Local cBody     := jPayload:toJson() as Character
  Local cToken    := GetMV("MV_CRM_TKN",, "") as Character
  Local cHost     := GetMV("MV_CRM_URL",, "") as Character
  Local cPath     := "/api/v1/customers/" + AllTrim(cId) as Character
  Local cHttpCode := "" as Character
  Local lOk       := .F. as Logical

  aAdd(aHeader, "Content-Type: application/json")
  aAdd(aHeader, "Authorization: Bearer " + cToken)

  Try
    oClient := FWRest():New(cHost)
    oClient:SetPath(cPath)
    oClient:SetTimeOut(30)
    oClient:SetLegacySuccess(.F.)

    // PUT body is the 2nd parameter of :Put() — not via SetPostParams
    lOk := oClient:Put(aHeader, cBody)
    cHttpCode := oClient:GetHTTPCode()

    If !lOk
      LogRestError("CrmUpdateCustomer", cHost + cPath, cHttpCode, oClient:GetLastError(), oClient:GetResult())
    EndIf
  Catch oErr
    LogRestError("CrmUpdateCustomer.exception", cHost + cPath, "", oErr:Description, "")
    Return .F.
  EndTry

  FreeObj(oClient)
Return lOk
```

---

## Template 5 — DELETE

```tlpp
User Function CrmDeleteCustomer(cId as Character) as Logical
  Local oClient   := Nil as Object
  Local aHeader   := {} as Array
  Local cToken    := GetMV("MV_CRM_TKN",, "") as Character
  Local cHost     := GetMV("MV_CRM_URL",, "") as Character
  Local cPath     := "/api/v1/customers/" + AllTrim(cId) as Character
  Local cHttpCode := "" as Character
  Local lOk       := .F. as Logical

  aAdd(aHeader, "Authorization: Bearer " + cToken)

  Try
    oClient := FWRest():New(cHost)
    oClient:SetPath(cPath)
    oClient:SetTimeOut(15)
    oClient:SetLegacySuccess(.F.)  // accept 204 No Content as success

    lOk := oClient:Delete(aHeader)
    cHttpCode := oClient:GetHTTPCode()

    If !lOk
      LogRestError("CrmDeleteCustomer", cHost + cPath, cHttpCode, oClient:GetLastError(), oClient:GetResult())
    EndIf
  Catch oErr
    LogRestError("CrmDeleteCustomer.exception", cHost + cPath, "", oErr:Description, "")
    Return .F.
  EndTry

  FreeObj(oClient)
Return lOk
```

---

## Template 6 — Reading 4xx / 5xx Response Body

When the API encodes error details in the response body of a 400/422/etc, you MUST disable internal status checking, otherwise `GetResult()` may be empty.

```tlpp
oClient := FWRest():New(cHost)
oClient:SetPath("/api/v1/orders")
oClient:SetPostParams(cBody)
oClient:SetChkStatus(.F.)  // <-- key call

oClient:Post(aHeader)      // ignore return value
cHttpCode := oClient:GetHTTPCode()
cResponse := oClient:GetResult()

If Val(cHttpCode) >= 200 .AND. Val(cHttpCode) < 300
  // success
ElseIf Val(cHttpCode) >= 400 .AND. Val(cHttpCode) < 500
  // parse error body
  jErr := JsonObject():New()
  jErr:fromJson(cResponse)
  cClientMsg := jErr:GetJsonText("message")
EndIf
```

---

## Template 7 — Sending Binary / GZipped File

```tlpp
User Function UploadBatchFile(cFilePath as Character) as Logical
  Local oClient as Object
  Local oFile   := FWFileReader():New(cFilePath) as Object
  Local aHeader := {} as Array
  Local lOk     := .F. as Logical

  If !oFile:Open()
    LogRestError("UploadBatchFile", cFilePath, "", "Cannot open file", "")
    Return .F.
  EndIf

  aAdd(aHeader, "Authorization: Basic " + Encode64(GetMV("MV_BAT_USR",,"") + ":" + GetMV("MV_BAT_PWD",,"")))
  aAdd(aHeader, "Content-Type: application/json")
  aAdd(aHeader, "Content-Encoding: gzip")

  Try
    oClient := FWRest():New(GetMV("MV_BAT_URL",, ""))
    oClient:SetPath("/api/batch/contracts")
    oClient:SetTimeOut(120)
    oClient:SetPostParams(Encode64(oFile:FullRead()))

    lOk := oClient:Post(aHeader)
    If !lOk
      LogRestError("UploadBatchFile", cFilePath, oClient:GetHTTPCode(), oClient:GetLastError(), oClient:GetResult())
    EndIf
  Catch oErr
    LogRestError("UploadBatchFile.exception", cFilePath, "", oErr:Description, "")
  EndTry

  oFile:Close()
  FreeObj(oFile)
  FreeObj(oClient)
Return lOk
```

---

## Template 8 — Escaping Query Values

When query values may contain spaces, `&`, `=`, or non-ASCII characters, encode them with `Escape()`.

```tlpp
Local cSearch := "Acme & Co" as Character
Local cQuery  := "search=" + Escape(cSearch) + "&active=true" as Character

oClient:SetPath("/api/v1/customers")
oClient:Get(aHeader, cQuery)
```
