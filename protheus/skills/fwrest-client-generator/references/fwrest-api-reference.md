# FWRest — Complete Method Reference

Authoritative reference for the framework `FWRest` HTTP client class. Source: <https://tdn.totvs.com/display/framework/FWRest>.

`FWRest` supports **GET, POST, PUT, DELETE** only. There is **no PATCH** verb — use `HTTPQuote()` when PATCH is required.

---

## Constructor

### `FWRest():New(cHost) → Self`

Creates the client instance.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `cHost` | Character | Yes | Base URL of the target host (scheme + host + optional port). **Do not include the path here.** |

```tlpp
oClient := FWRest():New("https://api.example.com")
oClient := FWRest():New("http://localhost:8080")
```

---

## Configuration Methods

### `SetPath(cPath) → Nil`

Sets the resource path appended to the host. Must start with `/`. May include a query string.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `cPath` | Character | Yes | Path of the request, e.g. `/api/v1/customers/123` |

```tlpp
oClient:SetPath("/api/v1/customers")
oClient:SetPath("/rest/sample?startIndex=2&count=10")
```

### `SetPostParams(cParams) → Nil`

Sets the request body for the next `:Post()` call. Required for POST with a payload. Has **no effect** on PUT/DELETE — those take the body as a positional argument.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `cParams` | Character | Yes | Body content (typically a JSON string) |

```tlpp
oClient:SetPostParams('{"name":"Acme","taxId":"00000000000191"}')
```

### `SetGetParams(cGetParams) → Nil` *(LIB 20201009+)*

Sets the GET query-string. Equivalent to passing the same string as the optional second arg of `:Get()`.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `cGetParams` | Character | Yes | Query string content (without the leading `?`) |

### `SetTimeOut(nTimeOut) → Nil` *(LIB 20231009+)*

Sets the request timeout in seconds. Default is 120s.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `nTimeOut` | Numeric | Yes | Timeout in seconds |

### `SetChkStatus(lChk) → Nil` *(Release 23+)*

Enables/disables internal HTTP code validation.

- `.T.` (default) — verb returns `.T.` only when HTTP code is in the success range.
- `.F.` — verb returns `.T.` as long as the connection succeeded. The caller MUST inspect `GetHTTPCode()` and `GetResult()` to determine outcome. **Required to read the body of 4xx/5xx responses.**

### `GetChkStatus() → Logical` *(Release 23+)*

Returns the current state of the status-check flag.

### `SetLegacySuccess(lActive) → Logical` *(LIB 20240812+)*

Switches between legacy success range and full HTTP 2xx range.

| Value | Success range |
| --- | --- |
| `.T.` (default) | 200, 201 only |
| `.F.` | 200–299 inclusive |

Use `.F.` for modern APIs that return 202 Accepted, 204 No Content, 207 Multi-Status, etc.

---

## HTTP Verb Methods

All verb methods return `Logical` (`.T.` on success). Read the body with `GetResult()`, errors with `GetLastError()`, status with `GetHTTPCode()`.

### `Get(aHeadStr, cGetParam) → Logical`

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `aHeadStr` | Array | Yes | Array of `"Key: Value"` header strings |
| `cGetParam` | Character | No | Query-string parameters. Default `""`. URI-encode values with `Escape()`. |

Returns `.T.` if HTTP code is 200 (or 200–299 with `SetLegacySuccess(.F.)`).

### `Post(aHeadStr) → Logical`

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `aHeadStr` | Array | Yes | Array of `"Key: Value"` header strings |

**The POST body is NOT a parameter.** Set it beforehand via `SetPostParams(cBody)`.

Returns `.T.` if HTTP code is 200 or 201 (or 200–299 with `SetLegacySuccess(.F.)`).

### `Put(aHeadStr, cPayLoad, cGETParms) → Logical`

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `aHeadStr` | Array | Yes | Array of `"Key: Value"` header strings |
| `cPayLoad` | Character | No | Request body. Default `""`. |
| `cGETParms` | Character | No | Optional query string *(LIB 20230403+)*. |

Returns `.T.` if HTTP code is 200 or 201 (or 200–299 with `SetLegacySuccess(.F.)`).

### `Delete(aHeadStr, cPayLoad, cGETParms) → Logical`

Same signature and semantics as `Put()`.

---

## Result Retrieval

### `GetResult() → Character`

Returns the response body of the last verb call. Empty/`Nil` on transport failure.

### `GetLastError() → Character`

Returns the human-readable error description of the last verb call. Populated when the verb returned `.F.`.

### `GetHTTPCode() → Character` *(Release 23+)*

Returns the HTTP status code of the last response (as character, e.g. `"200"`, `"404"`).

> Known limitation: for HTTP 204 responses without a Reason phrase, `GetHTTPCode()` may return empty.

---

## Header Array Format

Headers are always an `Array` of strings in the form `"Key: Value"` (note the **literal space** after the colon — required by the underlying parser).

```tlpp
Local aHeader := {}
aAdd(aHeader, "Content-Type: application/json")
aAdd(aHeader, "Accept: application/json")
aAdd(aHeader, "Authorization: Bearer " + cToken)
aAdd(aHeader, "X-Tenant-Id: 99,01")
```

---

## SSL / HTTPS

`FWRest` encapsulates SSL transparently. To enable HTTPS:

1. Configure the SSL certificate in the `appserver.ini` Socket section.
2. Pass the `https://` URL to `New()`.

No additional client-side code is needed.

For test environments, the `Socket` section may include `SECURITY=0` (no auth) or `SECURITY=1` (auth required). This is a **server-side** setting unrelated to the FWRest client headers.

---

## Trace / Debug

Enable verbose trace logs by setting `FWTraceLog=1` in the environment section of `appserver.ini`. The trace will include the raw request and response over the wire.

---

## Quick Reference Table

| Method | LIB Required | Returns | Notes |
| --- | --- | --- | --- |
| `New(cHost)` | All | Self | Base URL only |
| `SetPath(cPath)` | All | Nil | Leading `/` |
| `SetPostParams(cBody)` | All | Nil | POST body must be set here |
| `SetGetParams(cQuery)` | 20201009 | Nil | Alternative to `Get()` 2nd arg |
| `SetTimeOut(nSec)` | 20231009 | Nil | Default 120s |
| `SetChkStatus(lChk)` | Release 23 | Nil | `.F.` to read 4xx bodies |
| `GetChkStatus()` | Release 23 | Logical | — |
| `SetLegacySuccess(lActive)` | 20240812 | Logical | `.F.` enables 200–299 |
| `Get(aHead, cQuery)` | All | Logical | — |
| `Post(aHead)` | All | Logical | Body via `SetPostParams` |
| `Put(aHead, cBody, cQuery)` | `cQuery` since 20230403 | Logical | — |
| `Delete(aHead, cBody, cQuery)` | `cQuery` since 20230403 | Logical | — |
| `GetResult()` | All | Character | — |
| `GetLastError()` | All | Character | — |
| `GetHTTPCode()` | Release 23 | Character | — |
