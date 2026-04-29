---
name: confluence-tools
description: Integra Claude com Atlassian Confluence Cloud via MCP Server. Fornece ferramentas para criar, atualizar, deletar e buscar páginas, e converte Markdown para Confluence Storage Format (XHTML). Requer variáveis de ambiente CONFLUENCE_URL, CONFLUENCE_EMAIL, CONFLUENCE_API_TOKEN e CONFLUENCE_SPACE_KEY configuradas no .env.
---

## Configuração do MCP Server

O servidor MCP está em `scripts/server.py`. Para ativá-lo, adicionar ao `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "confluence": {
      "command": "python",
      "args": ["/caminho/absoluto/para/scripts/server.py"]
    }
  }
}
```

Instalar dependências:
```bash
pip install mcp>=1.0.0 httpx>=0.25.0 python-dotenv>=1.0.0
```

## Autenticação

O servidor suporta dois modos:

**Basic Auth** (padrão) — via `CONFLUENCE_EMAIL` + `CONFLUENCE_API_TOKEN` no `.env`.

**OAuth Bearer** — quando `CONFLUENCE_OAUTH_TOKEN` estiver definido no `.env`, substitui o Basic Auth automaticamente. Necessário quando o workspace bloqueia API tokens por política de organização (Atlassian Guard). O token OAuth precisa do scope `write:attachment:confluence` para upload de anexos. Para obter: `https://developer.atlassian.com/console/myapps/` → criar app OAuth 2.0 (3LO) → Authorization Code flow.

## Ferramentas disponíveis

| Ferramenta | Parâmetros obrigatórios | Notas |
|------------|------------------------|-------|
| `confluence_list_spaces` | — | `limit` opcional (padrão 25, máx 250) |
| `confluence_list_pages` | — | `space_key` e `limit` opcionais |
| `confluence_get_page` | `page_id` | Retorna corpo em Storage Format |
| `confluence_create_page` | `title`, `content` | `space_key` e `parent_id` opcionais |
| `confluence_update_page` | `page_id`, `title`, `content`, `version` | `version` é o número atual — o servidor incrementa automaticamente |
| `confluence_delete_page` | `page_id` | — |
| `confluence_search` | `query` | CQL (ex: `type=page AND space=FSW AND text ~ "MIT010"`) |
| `markdown_to_confluence` | `markdown` | Retorna XHTML Storage Format |
| `confluence_upload_attachment` | `page_id`, `file_path` | Upload de arquivo como anexo; retorna `confluence_ref` (`<ri:attachment>`) para uso em `ac:image` |

## Notas de implementação

- **API v2** (`/wiki/api/v2`) para todas as operações exceto busca
- **API v1** (`/wiki/rest/api/content/search`) para `confluence_search` — a v2 não suporta CQL
- Autenticação: Basic Auth com `base64(email:api_token)`
- `confluence_create_page` resolve automaticamente o `spaceId` a partir do `space_key`
- Conteúdo das páginas deve estar em **Confluence Storage Format** (XHTML) — usar `markdown_to_confluence` para converter

## Conversão Markdown → Storage Format

A ferramenta `markdown_to_confluence` usa regex. Ordem de processamento:

1. Blocos de código (``` ``` ```) → `<ac:structured-macro name="code">`
2. Código inline (`` ` ``) → `<code>`
3. Cabeçalhos `#`–`####` → `<h1>`–`<h4>`
4. Negrito `**` → `<strong>`, itálico `*` → `<em>`
5. Links `[text](url)` → `<a href="...">`
6. Blockquotes `>` → `<ac:structured-macro name="info">`
7. Listas `- item` → `<ul><li>`
8. Parágrafos (linhas sem tag) → `<p>`

## Fluxo típico

```
1. markdown_to_confluence(markdown)  → storage_content
2. confluence_list_spaces()          → identificar space_key
3. confluence_create_page(title, storage_content, space_key)
   ou
   confluence_search("title = 'Minha Página'")  → page_id + version
   confluence_update_page(page_id, title, storage_content, version)
```

## Padrão de Layout das Páginas (FSW)

Toda página deve seguir o padrão da página de referência "Gestão do Leite":

| Elemento | Padrão |
|----------|--------|
| Abertura | `layoutSection` 2 colunas: 33.33% (TOC macro) + 66.66% (H2 Visão Geral + texto) |
| TOC | extension `toc` com minLevel=2, maxLevel=3, type=list |
| Seções | `heading` H2, separadas por `rule` (divider) |
| Imagens | `mediaSingle` layout=align-start + `media` type=file, id=fileId UUID, collection=contentId-{PAGE_ID} |
| Tabelas | `table` sem attrs, `tableHeader`/`tableCell` com colspan=1, rowspan=1 |
| Caminhos de menu | negrito + código inline: `**Menu:** \`Módulo >> Submenu\`` |
| Sem macros extras | Não usar panel, info, note, expand, status |

## Upload de Imagens via REST API

Para fazer upload de imagens como anexos (quando o MCP Atlassian não suporta):

```python
import httpx, base64

auth = base64.b64encode(f"{email}:{api_token}".encode()).decode()
headers = {"Authorization": f"Basic {auth}", "X-Atlassian-Token": "no-check"}

# Upload
resp = httpx.post(
    f"{confluence_url}/wiki/rest/api/content/{page_id}/child/attachment",
    headers=headers,
    files={"file": (filename, file_bytes, "image/png")},
    timeout=60
)
att_id = resp.json()["results"][0]["id"]  # ex: att178225153

# Obter fileId UUID (obrigatório para ADF mediaSingle)
att_num = att_id.replace("att", "")
resp2 = httpx.get(f"{confluence_url}/wiki/api/v2/attachments/{att_num}", headers={"Authorization": f"Basic {auth}"})
file_id = resp2.json()["fileId"]  # UUID para usar no ADF
```

## Regras Obrigatórias

- **Seção Downloads:** Toda página DEVE terminar com `## Downloads` contendo tabela de artefatos (fontes, patches, imagens, PDFs) e aviso de backup. Usar `—` quando o link não estiver disponível.
- **Imagens no ADF:** Sempre usar `fileId` UUID do Media Service, nunca o `att{number}`. Obter via `GET /wiki/api/v2/attachments/{id}` após upload.
- **collection das imagens:** Sempre `contentId-{PAGE_ID}` (ID numérico da página destino).
