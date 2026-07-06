# Receita detalhada — gerar relatório SmartView (TReports self-hosted)

Esteira provada de ponta a ponta contra um SmartView (TReports) self-hosted ligado a um AppServer
Protheus. Os valores concretos de host/porta/namespace/credenciais são **do seu ambiente** — defina-os
por variável de ambiente, nunca hardcode credenciais em commits. Abaixo os placeholders e a topologia.

## Ambiente (placeholders)

- SmartView (TReports self-hosted): `https://<smartview-host>` → o `smartview-agent` (.NET) escuta
  numa porta interna (ex.: `:7019`), normalmente atrás de um reverse proxy.
- AppServer Protheus: rodando num container/host (`<appserver-host>`). REST em `:<rest-port>` (ex.: 7777),
  num namespace REST `/<namespace>`. O AppServer também expõe uma **porta TCP de build** (ex.: 1234,
  eventualmente remapeada no host) usada pelo advpls para compilar sem travar o RPO.
- Connector de dados do SmartView: aponta para `http://<appserver-host>:<rest-port>/<namespace>`. Cada
  connector tem um **UUID** (`SV_CONNECTOR_ID`) — descubra o seu via `GET /api/connectors`.
- Login SmartView/Protheus: usuário/senha do seu ambiente (issuer JWT padrão `TOTVS-ADVPL-FWJWT`).
  **Nunca hardcodar em commit** — usar env (`SV_PROTHEUS_USER`/`SV_PROTHEUS_PSW`) ou KeePass.
- Includes Protheus: dir local com `protheus.ch` + `totvs.framework.treports.integratedprovider.th`
  (`PROTHEUS_INCLUDES`).
- advpls (TDS-LS): caminho do binário `advpls` do TDS-LS (`ADVPLS`).

Variáveis usadas pelos scripts: `SV_APPSERVER_HOST`, `SV_APPSERVER_BUILD_PORT`, `SV_APPSERVER_ENV`,
`SV_PROTHEUS_USER`, `SV_PROTHEUS_PSW`, `PROTHEUS_INCLUDES`, `ADVPLS`, `SV_CONNECTOR_ID`.

## Regra de ouro de rede (container↔container)

Se SmartView e AppServer estão em containers no mesmo host/rede, dentro dos containers use o **nome do
container** (ex.: `<appserver-container>:<rest-port>`), NUNCA o hostname público — hostnames públicos
costumam resolver para `127.0.1.1` dentro do container → "Connection refused". Validação de alcance:
`/<namespace>/healthcheck` → `{"status":"ok"}`, `/<namespace>/ping` → 401 (alcançável, pede token).

## Padrão IntegratedProvider (o `.tlpp`)

Ver `assets/VENDASIA.tlpp` para um exemplo completo (dados literais, 7 linhas, renderiza). Esqueleto:

```
#include "protheus.ch"
#include "totvs.framework.treports.integratedprovider.th"
namespace <seu.namespace>.smartview.<dominio>

@totvsFrameworkTReportsIntegratedProvider(active=.T., team="<TIME>", tables="<SX1,SX2>", name="<Nome>", country="ALL", initialRelease="12.1.2410")
class <ClasseUnica> from totvs.framework.treports.integratedprovider.IntegratedProvider
    public method new() as object
    public method getData() as object
    public method getSchema() as object
endclass

method new() class <Classe>           // _Super:new(); appendArea(); setDisplayName(); setDescription()
method getData(nPage, oFilter) class <Classe>   // monta jItems (JsonObject) por linha; self:oData:appendData(jItems); self:setHasNext(.F.); return self:oData
method getSchema() class <Classe>     // self:addProperty(id, titulo, "string|number|date", desc, campo) por coluna; return self:oSchema
```

- `getData` pode: (a) ler tabela via `MPSysOpenQuery`/`FwPreparedStatement` (datas → `FWTimeStamp(5,StoD(...),"00:00:00")`), ou (b) devolver dados **literais** (array hardcoded). Para validar a esteira ou demos, use literais — independe da base ter dado.
- **Sem `BEGIN SEQUENCE`**. Notação húngara. Cada classe num arquivo, nome único (não repetir classe entre fontes).

## Compilação (advpls remoto)

`appsrvlinux -compile` LOCAL falha: o appserver vivo trava o RPO ("Failed to open repository"). Compilar **remoto** via `advpls cli advpls.ini` (script `scripts/compile_bo.sh` monta o ini). Parâmetros do `[authentication]`:
- `server=<appserver-host>` (use IPv4 se o hostname resolver para IPv6 e der timeout), `port=<build-port>`, `secure=0`, `build=AUTO`
- `environment=<SV_APPSERVER_ENV>` (env que serve o `/<namespace>`)
- `user=<SV_PROTHEUS_USER> psw=<SV_PROTHEUS_PSW>`
- `[compile]` → `programList` (txt com o caminho do .tlpp), `recompile=T`, `includes=<PROTHEUS_INCLUDES>`

Sucesso = log com `[SUCCESS] Source ... compiled successfully`.

## Registrar + discovery

Após compilar, **reiniciar** o AppServer para indexar o IntegratedProvider (ex.: `docker restart <appserver-container>`).
A REST fica ~60s fora após o commit do build (o oauth2 fica em `000`/hung) — aguardar `/<namespace>/ping` voltar a 401. Depois confirmar:
`GET /api/connectors/business-objects?q=<displayName>` (via `scripts/smartview_client.py` → `find_business_objects`).

## Montar artefato no SmartView

API REST (auth Basic→Bearer, ver `scripts/smartview_client.py`):
- Listar: `GET /api/resources/{report|data-grid|pivot-table}`
- BO vinculado: `GET/PUT /api/resources/{tipo}/<id>/business-object` (body `{name, connectorId, filter}`)
- **Render (dado)**: `POST /api/resources/{data-grid|pivot-table}/<id>/viewer-data` (json `{page,pageSize}`) → linhas
- Import/export `.trp`: `POST /api/resources/report/import` (campo multipart **`inputFile`**! → retorna `importId`+items) / `POST /api/resources/report/export` (body `["<uuid>"]`, retorna ZIP).
- Discovery: `GET /api/connectors/business-object-areas`, `GET /api/connectors/business-objects?q=`

**Criar o artefato com colunas:** rebind via API **NÃO** sincroniza colunas — o `viewer-data` projeta as colunas do BO antigo → vazio. Criar pela **UI (Playwright, model sonnet)**: novo Grid/Pivot/Report → escolher o BO ("Choose business object", filtrar pelo connector, buscar ≥3 chars, Confirm) → adicionar os campos (Field List → arrastar para Detail/linhas/medida). Para Report, o designer é DevExpress (drag real via `page.mouse`, não eventos sintéticos).

## Report (PDF) — pré-requisito de lib nativa

O Report renderiza PDF via DevExpress/**SkiaSharp**. Sem `libfontconfig.so.1` o `designer-model` dá **HTTP 500** (`DllNotFoundException libSkiaSharp/libfontconfig`). Corrigir uma vez no container do agent:
```
docker exec <smartview-agent> apt-get update -qq
docker exec <smartview-agent> apt-get install -y libfontconfig1 libfreetype6
docker restart <smartview-agent>
```
(Idealmente adicionar `libfontconfig1 libfreetype6` ao `command`/imagem do smartview-agent para persistir.) Grid e Pivot NÃO precisam (não usam Skia).

## Gotchas que custaram tempo (evitar)

- **Base vazia / empresa errada**: a REST roda na empresa do `PREPAREIN=00` ([HTTPURI01]); bases de homologação quase não têm dado de negócio. BOs PADRÃO vêm vazios. Por isso prefira BO customizado (literal ou apontando para tabela com dado garantido) para provar render.
- **`.trp` cifrado**: o arquivo exportado é binário cifrado pelo servidor (entropia ~8). Não dá para gerar/editar offline — só a plataforma produz no export.
- **Verificação independente**: confirme o render por API (`viewer-data`) ou lendo o screenshot — não confie só no relatório do agente Playwright. "Existir" ≠ "renderizar dado".
