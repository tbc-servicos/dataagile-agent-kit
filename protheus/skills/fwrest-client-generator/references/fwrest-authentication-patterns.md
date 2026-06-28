# FWRest Authentication Patterns

Header construction patterns for the most common authentication schemes when consuming external REST APIs with `FWRest`.

> **Security rule, always-on:** read credentials from Protheus parameters (`GetMV("MV_XXX",, "")`), environment variables, or a vault. **Never** hardcode secrets in source. **Never** log full tokens or passwords.

---

## 1. No Authentication

```tlpp
Local aHeader := {} as Array
aAdd(aHeader, "Content-Type: application/json")
aAdd(aHeader, "Accept: application/json")
```

The server-side `appserver.ini` `[Socket]` section must have `SECURITY=0` for the call to succeed against an unauthenticated server.

---

## 2. HTTP Basic Authentication

Format: `Authorization: Basic base64(user:password)`

```tlpp
Local cUser := GetMV("MV_API_USR",, "") as Character
Local cPass := GetMV("MV_API_PWD",, "") as Character
Local aHeader := {} as Array

aAdd(aHeader, "Content-Type: application/json")
aAdd(aHeader, "Authorization: Basic " + Encode64(cUser + ":" + cPass))
```

Notes:
- `Encode64()` is the framework Base64 encoder.
- Basic auth should only be used over **HTTPS**.

---

## 3. Bearer Token / JWT

Format: `Authorization: Bearer <token>`

```tlpp
Local cToken := GetMV("MV_API_TKN",, "") as Character
Local aHeader := {} as Array

aAdd(aHeader, "Content-Type: application/json")
aAdd(aHeader, "Authorization: Bearer " + cToken)
```

If the token is short-lived (JWT), use the OAuth 2.0 client-credentials pattern below to refresh it on demand and cache it in a static variable until expiry.

---

## 4. API Key (Custom Header)

Many APIs use a custom header like `X-API-Key`, `apikey`, or `api-token`.

```tlpp
Local cApiKey := GetMV("MV_API_KEY",, "") as Character
Local aHeader := {} as Array

aAdd(aHeader, "Content-Type: application/json")
aAdd(aHeader, "X-API-Key: " + cApiKey)
```

Confirm the exact header name with the target API documentation — common alternatives: `Api-Key`, `apikey`, `X-Auth-Token`.

---

## 5. OAuth 2.0 — Client Credentials Grant

Two-step pattern: (1) request a token from the auth server, (2) use the token in subsequent calls. Cache the token in a static variable until near expiry.

```tlpp
#include "tlpp-core.th"
#include "totvs.ch"

Namespace company.integration.auth

Static __cCachedToken := "" as Character
Static __nTokenExpiry := 0 as Numeric  // seconds since epoch (use Seconds() + offset)

//-------------------------------------------------------------------
// Returns a valid OAuth 2.0 access token, refreshing if expired.
//-------------------------------------------------------------------
User Function GetOAuthToken() as Character
  Local oClient   := Nil as Object
  Local aHeader   := {} as Array
  Local cBody     := "" as Character
  Local cResponse := "" as Character
  Local jResp     := JsonObject():New() as Json
  Local cAuthUrl  := GetMV("MV_OAUTHU",, "") as Character
  Local cClientId := GetMV("MV_OAUTID",, "") as Character
  Local cSecret   := GetMV("MV_OAUTSC",, "") as Character
  Local nNow      := Seconds() + Day(Date()) * 86400 as Numeric

  // Use cached token until 60s before expiry
  If !Empty(__cCachedToken) .AND. nNow < (__nTokenExpiry - 60)
    Return __cCachedToken
  EndIf

  cBody := "grant_type=client_credentials"
  cBody += "&client_id=" + Escape(cClientId)
  cBody += "&client_secret=" + Escape(cSecret)

  aAdd(aHeader, "Content-Type: application/x-www-form-urlencoded")
  aAdd(aHeader, "Accept: application/json")

  Try
    oClient := FWRest():New(cAuthUrl)
    oClient:SetPath("/oauth/token")
    oClient:SetTimeOut(15)
    oClient:SetPostParams(cBody)

    If !oClient:Post(aHeader)
      FWLogMsg("ERROR", , "OAUTH", FunName(), , "01", ;
        "Token fetch failed HTTP=" + oClient:GetHTTPCode() + " ERR=" + oClient:GetLastError(), 0, 0, {})
      Return ""
    EndIf

    cResponse := oClient:GetResult()
    If jResp:fromJson(cResponse) <> Nil
      Return ""
    EndIf

    __cCachedToken := jResp:GetJsonText("access_token")
    __nTokenExpiry := nNow + Val(cValToChar(jResp["expires_in"]))
  Catch oErr
    FWLogMsg("ERROR", , "OAUTH", FunName(), , "01", oErr:Description, 0, 0, {})
    Return ""
  EndTry

  FreeObj(oClient)
Return __cCachedToken
```

Caller usage:

```tlpp
Local cToken := GetOAuthToken() as Character
Local aHeader := {} as Array

If Empty(cToken)
  Return Nil  // auth failure already logged
EndIf

aAdd(aHeader, "Content-Type: application/json")
aAdd(aHeader, "Authorization: Bearer " + cToken)
```

---

## 6. OAuth 2.0 — Authorization Code Grant

The authorization-code grant requires a browser-based user consent step that **cannot** happen inside a server-side Protheus routine. Implementation pattern:

1. A separate frontend (web or SmartClient) drives the user-consent flow and obtains the **refresh token**.
2. Persist the refresh token securely (encrypted Protheus parameter or external vault).
3. The Protheus integration uses the **refresh token grant** (similar to client-credentials above but with `grant_type=refresh_token&refresh_token=...`) to obtain access tokens for API calls.

Code follows the same shape as Template 5 — only `cBody` differs.

---

## 7. Multi-Tenant Headers (TOTVS Pattern)

TOTVS APIs often expect a `tenantId` header in the form `"tenantId: <empresa>,<filial>"`:

```tlpp
aAdd(aHeader, "tenantId: " + cValToChar(cEmpAnt) + "," + cValToChar(cFilAnt))
aAdd(aHeader, "Authorization: Bearer " + cToken)
```

---

## Quick Decision Table

| API requires | Header pattern |
| --- | --- |
| No auth (internal/test) | none |
| Username + password | `Authorization: Basic <base64(user:pass)>` |
| Pre-issued long-lived token | `Authorization: Bearer <token>` |
| Custom key header | `X-API-Key: <key>` (or vendor-specific name) |
| Short-lived JWT issued by auth server | OAuth 2.0 client-credentials flow + cache |
| User-on-behalf-of access | OAuth 2.0 authorization-code (separate frontend) + refresh token in Protheus |
| TOTVS multi-tenant | Add `tenantId: <empresa>,<filial>` alongside auth header |

---

## Anti-Patterns

| Anti-pattern | Why it fails |
| --- | --- |
| Hardcoded `cToken := "eyJhbGc..."` | SonarQube blocker + leaks via source repo |
| Calling auth endpoint on every request | Rate-limit / latency / cost — always cache the token |
| Logging the full `Authorization` header | Token theft on log exposure |
| Sharing one OAuth token across tenants | Cross-tenant data leakage |
| Storing secrets in `cEmpAnt`/`__cUserID` | These are protected variables — SonarQube blocker |
| Using HTTP Basic over plain HTTP | Credentials sent in plaintext |
