#!/usr/bin/env python3
"""
MCP Server para integração com Confluence Cloud API v2.

Fornece ferramentas para criar, atualizar e gerenciar páginas no Confluence.
"""

import os
import base64
from typing import Any

import httpx
from dotenv import load_dotenv
from mcp.server import Server
from mcp.types import Tool, TextContent

# Carrega variáveis de ambiente
load_dotenv()

# Configuração
CONFLUENCE_URL = os.getenv("CONFLUENCE_URL", "").rstrip("/")
CONFLUENCE_EMAIL = os.getenv("CONFLUENCE_EMAIL", "")
CONFLUENCE_API_TOKEN = os.getenv("CONFLUENCE_API_TOKEN", "")
CONFLUENCE_SPACE_KEY = os.getenv("CONFLUENCE_SPACE_KEY", "")
# OAuth Bearer token (opcional) — quando presente, substitui Basic Auth.
# Necessário quando o workspace bloqueia API tokens via política de organização.
# Obter via: https://developer.atlassian.com/console/myapps/ (OAuth 2.0 3LO)
# Scope necessário para attachments: write:attachment:confluence
CONFLUENCE_OAUTH_TOKEN = os.getenv("CONFLUENCE_OAUTH_TOKEN", "")

# Servidor MCP
server = Server("confluence")


def get_auth_header() -> dict[str, str]:
    """Retorna header de autenticação. Usa OAuth Bearer se disponível, senão Basic Auth."""
    if CONFLUENCE_OAUTH_TOKEN:
        return {
            "Authorization": f"Bearer {CONFLUENCE_OAUTH_TOKEN}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
    credentials = f"{CONFLUENCE_EMAIL}:{CONFLUENCE_API_TOKEN}"
    encoded = base64.b64encode(credentials.encode()).decode()
    return {
        "Authorization": f"Basic {encoded}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }


def get_api_url(endpoint: str) -> str:
    """Constrói URL completa da API."""
    return f"{CONFLUENCE_URL}/wiki/api/v2{endpoint}"


async def make_request(
    method: str, endpoint: str, json_data: dict | None = None
) -> dict[str, Any]:
    """Faz requisição para a API do Confluence."""
    async with httpx.AsyncClient() as client:
        response = await client.request(
            method=method,
            url=get_api_url(endpoint),
            headers=get_auth_header(),
            json=json_data,
            timeout=30.0,
        )
        response.raise_for_status()
        return response.json() if response.content else {}


# Definição das ferramentas
@server.list_tools()
async def list_tools() -> list[Tool]:
    """Lista as ferramentas disponíveis."""
    return [
        Tool(
            name="confluence_list_spaces",
            description="Lista todos os spaces disponíveis no Confluence",
            inputSchema={
                "type": "object",
                "properties": {
                    "limit": {
                        "type": "integer",
                        "description": "Número máximo de resultados (padrão: 25, máx: 250)",
                        "default": 25,
                    }
                },
            },
        ),
        Tool(
            name="confluence_list_pages",
            description="Lista páginas de um space no Confluence",
            inputSchema={
                "type": "object",
                "properties": {
                    "space_key": {
                        "type": "string",
                        "description": f"Chave do space (padrão: {CONFLUENCE_SPACE_KEY})",
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Número máximo de resultados",
                        "default": 25,
                    },
                },
            },
        ),
        Tool(
            name="confluence_get_page",
            description="Obtém detalhes de uma página específica",
            inputSchema={
                "type": "object",
                "properties": {
                    "page_id": {
                        "type": "string",
                        "description": "ID da página",
                    }
                },
                "required": ["page_id"],
            },
        ),
        Tool(
            name="confluence_create_page",
            description="Cria uma nova página no Confluence",
            inputSchema={
                "type": "object",
                "properties": {
                    "title": {
                        "type": "string",
                        "description": "Título da página",
                    },
                    "content": {
                        "type": "string",
                        "description": "Conteúdo da página em formato Confluence Storage (XHTML)",
                    },
                    "space_key": {
                        "type": "string",
                        "description": f"Chave do space (padrão: {CONFLUENCE_SPACE_KEY})",
                    },
                    "parent_id": {
                        "type": "string",
                        "description": "ID da página pai (opcional)",
                    },
                },
                "required": ["title", "content"],
            },
        ),
        Tool(
            name="confluence_update_page",
            description="Atualiza uma página existente no Confluence",
            inputSchema={
                "type": "object",
                "properties": {
                    "page_id": {
                        "type": "string",
                        "description": "ID da página a atualizar",
                    },
                    "title": {
                        "type": "string",
                        "description": "Novo título da página",
                    },
                    "content": {
                        "type": "string",
                        "description": "Novo conteúdo em formato Confluence Storage (XHTML)",
                    },
                    "version": {
                        "type": "integer",
                        "description": "Versão atual da página (obrigatório para update)",
                    },
                },
                "required": ["page_id", "title", "content", "version"],
            },
        ),
        Tool(
            name="confluence_delete_page",
            description="Deleta uma página do Confluence",
            inputSchema={
                "type": "object",
                "properties": {
                    "page_id": {
                        "type": "string",
                        "description": "ID da página a deletar",
                    }
                },
                "required": ["page_id"],
            },
        ),
        Tool(
            name="confluence_search",
            description="Busca conteúdo no Confluence usando CQL",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Query CQL (ex: 'type=page AND space=KEY')",
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Número máximo de resultados",
                        "default": 25,
                    },
                },
                "required": ["query"],
            },
        ),
        Tool(
            name="markdown_to_confluence",
            description="Converte Markdown para formato Confluence Storage (XHTML)",
            inputSchema={
                "type": "object",
                "properties": {
                    "markdown": {
                        "type": "string",
                        "description": "Conteúdo em Markdown para converter",
                    }
                },
                "required": ["markdown"],
            },
        ),
        Tool(
            name="confluence_upload_attachment",
            description="Faz upload de um arquivo como anexo em uma página do Confluence e retorna a URL de referência para uso em ac:image",
            inputSchema={
                "type": "object",
                "properties": {
                    "page_id": {
                        "type": "string",
                        "description": "ID da página onde o anexo será enviado",
                    },
                    "file_path": {
                        "type": "string",
                        "description": "Caminho absoluto do arquivo local a fazer upload",
                    },
                    "filename": {
                        "type": "string",
                        "description": "Nome do arquivo no Confluence (opcional, usa o nome do arquivo local por padrão)",
                    },
                },
                "required": ["page_id", "file_path"],
            },
        ),
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
    """Executa uma ferramenta."""
    try:
        result = await _execute_tool(name, arguments)
        return [TextContent(type="text", text=str(result))]
    except httpx.HTTPStatusError as e:
        error_msg = f"Erro HTTP {e.response.status_code}: {e.response.text}"
        return [TextContent(type="text", text=error_msg)]
    except Exception as e:
        return [TextContent(type="text", text=f"Erro: {str(e)}")]


async def _execute_tool(name: str, arguments: dict[str, Any]) -> Any:
    """Executa a lógica de cada ferramenta."""

    if name == "confluence_list_spaces":
        limit = arguments.get("limit", 25)
        return await make_request("GET", f"/spaces?limit={limit}")

    elif name == "confluence_list_pages":
        space_key = arguments.get("space_key", CONFLUENCE_SPACE_KEY)
        limit = arguments.get("limit", 25)
        return await make_request(
            "GET", f"/spaces/{space_key}/pages?limit={limit}"
        )

    elif name == "confluence_get_page":
        page_id = arguments["page_id"]
        return await make_request(
            "GET", f"/pages/{page_id}?body-format=storage"
        )

    elif name == "confluence_create_page":
        space_key = arguments.get("space_key", CONFLUENCE_SPACE_KEY)

        # Busca o ID do space
        spaces = await make_request("GET", f"/spaces?keys={space_key}")
        if not spaces.get("results"):
            raise ValueError(f"Space '{space_key}' não encontrado")
        space_id = spaces["results"][0]["id"]

        payload = {
            "spaceId": space_id,
            "status": "current",
            "title": arguments["title"],
            "body": {
                "representation": "storage",
                "value": arguments["content"],
            },
        }

        if arguments.get("parent_id"):
            payload["parentId"] = arguments["parent_id"]

        return await make_request("POST", "/pages", payload)

    elif name == "confluence_update_page":
        payload = {
            "id": arguments["page_id"],
            "status": "current",
            "title": arguments["title"],
            "body": {
                "representation": "storage",
                "value": arguments["content"],
            },
            "version": {"number": arguments["version"] + 1},
        }
        return await make_request(
            "PUT", f"/pages/{arguments['page_id']}", payload
        )

    elif name == "confluence_delete_page":
        return await make_request("DELETE", f"/pages/{arguments['page_id']}")

    elif name == "confluence_search":
        query = arguments["query"]
        limit = arguments.get("limit", 25)
        # Usa API v1 para CQL search (mais completa)
        url = f"{CONFLUENCE_URL}/wiki/rest/api/content/search"
        async with httpx.AsyncClient() as client:
            response = await client.get(
                url,
                params={"cql": query, "limit": limit},
                headers=get_auth_header(),
                timeout=30.0,
            )
            response.raise_for_status()
            return response.json()

    elif name == "markdown_to_confluence":
        return convert_markdown_to_storage(arguments["markdown"])

    elif name == "confluence_upload_attachment":
        page_id = arguments["page_id"]
        file_path = arguments["file_path"]
        import mimetypes
        import os as _os

        filename = arguments.get("filename") or _os.path.basename(file_path)
        mime_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"

        # Monta header de auth sem Content-Type (multipart define o próprio boundary)
        if CONFLUENCE_OAUTH_TOKEN:
            upload_headers = {"Authorization": f"Bearer {CONFLUENCE_OAUTH_TOKEN}"}
        else:
            credentials = f"{CONFLUENCE_EMAIL}:{CONFLUENCE_API_TOKEN}"
            encoded = base64.b64encode(credentials.encode()).decode()
            upload_headers = {"Authorization": f"Basic {encoded}"}

        with open(file_path, "rb") as f:
            file_content = f.read()

        # API v2: POST /wiki/api/v2/pages/{id}/attachments
        # Verifica duplicata via v2 antes de enviar
        async with httpx.AsyncClient() as client:
            check_resp = await client.get(
                f"{CONFLUENCE_URL}/wiki/api/v2/pages/{page_id}/attachments",
                headers={**upload_headers, "Accept": "application/json"},
                params={"filename": filename},
                timeout=15.0,
            )
            existing = check_resp.json().get("results", []) if check_resp.is_success else []

            if existing:
                # Atualiza attachment existente via v2: POST /wiki/api/v2/attachments/{id}/data
                att_id = existing[0]["id"]
                upload_url = f"{CONFLUENCE_URL}/wiki/api/v2/attachments/{att_id}/data"
            else:
                upload_url = f"{CONFLUENCE_URL}/wiki/api/v2/pages/{page_id}/attachments"

            response = await client.post(
                upload_url,
                headers=upload_headers,
                files={"file": (filename, file_content, mime_type)},
                timeout=60.0,
            )

        if not response.is_success:
            raise ValueError(f"Upload falhou {response.status_code}: {response.text[:400]}")

        data = response.json()
        # v2 retorna {"results": [...]} no POST de criação
        results = data.get("results", [data])
        att = results[0]
        att_id = att["id"]
        # v2 response: links.download ou webui
        links = att.get("_links", att.get("links", {}))
        download_path = links.get("download", f"/wiki/download/attachments/{page_id}/{filename}")

        return {
            "id": att_id,
            "filename": filename,
            "download_url": f"{CONFLUENCE_URL}{download_path}",
            "confluence_ref": f'<ac:image ac:align="center"><ri:attachment ri:filename="{filename}"/></ac:image>',
            "message": "Upload concluído. Use confluence_ref para inserir a imagem na página.",
        }

    else:
        raise ValueError(f"Ferramenta desconhecida: {name}")


def convert_markdown_to_storage(markdown: str) -> str:
    """
    Converte Markdown básico para Confluence Storage Format (XHTML).

    Suporta: headers, bold, italic, links, code blocks, tables, lists.
    """
    import re

    content = markdown

    # Code blocks (antes de outras conversões)
    content = re.sub(
        r"```(\w+)?\n(.*?)```",
        r'<ac:structured-macro ac:name="code"><ac:parameter ac:name="language">\1</ac:parameter><ac:plain-text-body><![CDATA[\2]]></ac:plain-text-body></ac:structured-macro>',
        content,
        flags=re.DOTALL,
    )

    # Inline code
    content = re.sub(r"`([^`]+)`", r"<code>\1</code>", content)

    # Headers
    content = re.sub(r"^#### (.+)$", r"<h4>\1</h4>", content, flags=re.MULTILINE)
    content = re.sub(r"^### (.+)$", r"<h3>\1</h3>", content, flags=re.MULTILINE)
    content = re.sub(r"^## (.+)$", r"<h2>\1</h2>", content, flags=re.MULTILINE)
    content = re.sub(r"^# (.+)$", r"<h1>\1</h1>", content, flags=re.MULTILINE)

    # Bold and italic
    content = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", content)
    content = re.sub(r"\*(.+?)\*", r"<em>\1</em>", content)

    # Links
    content = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2">\1</a>', content)

    # Blockquotes (info panel)
    content = re.sub(
        r"^> (.+)$",
        r'<ac:structured-macro ac:name="info"><ac:rich-text-body><p>\1</p></ac:rich-text-body></ac:structured-macro>',
        content,
        flags=re.MULTILINE,
    )

    # Unordered lists
    def convert_ul(match):
        items = match.group(0).strip().split("\n")
        list_items = "".join(f"<li>{item[2:]}</li>" for item in items)
        return f"<ul>{list_items}</ul>"

    content = re.sub(r"(^- .+$\n?)+", convert_ul, content, flags=re.MULTILINE)

    # Paragraphs (linhas que não são tags)
    lines = content.split("\n")
    result = []
    for line in lines:
        stripped = line.strip()
        if stripped and not stripped.startswith("<"):
            result.append(f"<p>{stripped}</p>")
        else:
            result.append(line)

    return "\n".join(result)


async def main():
    """Inicia o servidor MCP."""
    from mcp.server.stdio import stdio_server

    if not all([CONFLUENCE_URL, CONFLUENCE_EMAIL, CONFLUENCE_API_TOKEN]):
        print("ERRO: Configure as variáveis de ambiente:")
        print("  - CONFLUENCE_URL")
        print("  - CONFLUENCE_EMAIL")
        print("  - CONFLUENCE_API_TOKEN")
        print("\nCopie .env.example para .env e preencha os valores.")
        return

    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream, server.create_initialization_options())


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())
