#!/usr/bin/env python3
"""
Jira Cloud REST API v3 — MCP Server
Complementa o MCP oficial da Atlassian com attachment download/upload,
custom fields, comments e search avançado.

Auth: Basic Auth (email + API token)
Env vars: JIRA_SITE, JIRA_EMAIL, JIRA_API_TOKEN
"""

import os
import sys
import json
import base64
import mimetypes
from pathlib import Path
from urllib.parse import urljoin

import httpx
from mcp.server.fastmcp import FastMCP

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

JIRA_SITE = os.environ.get("JIRA_SITE", "")
JIRA_EMAIL = os.environ.get("JIRA_EMAIL", "")
JIRA_API_TOKEN = os.environ.get("JIRA_API_TOKEN", "")

mcp = FastMCP("jira-rest", description="Jira Cloud REST API v3")


def _log(msg: str):
    print(f"[jira-rest] {msg}", file=sys.stderr)


def _base_url() -> str:
    return f"https://{JIRA_SITE}/rest/api/3"


def _auth_header() -> dict:
    cred = base64.b64encode(f"{JIRA_EMAIL}:{JIRA_API_TOKEN}".encode()).decode()
    return {
        "Authorization": f"Basic {cred}",
        "Accept": "application/json",
    }


def _check_config() -> str | None:
    """Returns error message if config is missing, None if ok."""
    missing = []
    if not JIRA_SITE:
        missing.append("JIRA_SITE")
    if not JIRA_EMAIL:
        missing.append("JIRA_EMAIL")
    if not JIRA_API_TOKEN:
        missing.append("JIRA_API_TOKEN")
    if missing:
        return f"Missing env vars: {', '.join(missing)}. Configure and restart."
    return None


def _client() -> httpx.Client:
    return httpx.Client(
        headers=_auth_header(),
        timeout=60.0,
        follow_redirects=True,
    )


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------


@mcp.tool()
def get_connection_status() -> str:
    """Check connection to Jira Cloud and show configured site/email."""
    err = _check_config()
    if err:
        return json.dumps({"status": "error", "message": err})

    try:
        with _client() as client:
            r = client.get(f"{_base_url()}/myself")
            r.raise_for_status()
            user = r.json()
            return json.dumps({
                "status": "connected",
                "site": JIRA_SITE,
                "email": JIRA_EMAIL,
                "display_name": user.get("displayName"),
                "account_id": user.get("accountId"),
                "time_zone": user.get("timeZone"),
            }, indent=2)
    except Exception as e:
        return json.dumps({"status": "error", "message": str(e)})


@mcp.tool()
def get_issue(issue_key: str, fields: str = "*all", expand: str = "renderedFields,names") -> str:
    """
    Get a Jira issue with all fields including custom fields.

    Args:
        issue_key: Issue key (e.g. PROJ-123)
        fields: Comma-separated field list or '*all' for everything
        expand: Comma-separated expand options (renderedFields, names, changelog, transitions)
    """
    err = _check_config()
    if err:
        return err

    try:
        with _client() as client:
            r = client.get(
                f"{_base_url()}/issue/{issue_key}",
                params={"fields": fields, "expand": expand},
            )
            r.raise_for_status()
            data = r.json()

            # Build a clean response
            fields_data = data.get("fields", {})
            names_map = data.get("names", {})

            result = {
                "key": data.get("key"),
                "id": data.get("id"),
                "self": data.get("self"),
                "summary": fields_data.get("summary"),
                "status": fields_data.get("status", {}).get("name") if fields_data.get("status") else None,
                "issuetype": fields_data.get("issuetype", {}).get("name") if fields_data.get("issuetype") else None,
                "assignee": fields_data.get("assignee", {}).get("displayName") if fields_data.get("assignee") else None,
                "assignee_email": fields_data.get("assignee", {}).get("emailAddress") if fields_data.get("assignee") else None,
                "reporter": fields_data.get("reporter", {}).get("displayName") if fields_data.get("reporter") else None,
                "priority": fields_data.get("priority", {}).get("name") if fields_data.get("priority") else None,
                "description": fields_data.get("description"),
                "attachments": [],
                "custom_fields": {},
            }

            # Attachments
            for att in fields_data.get("attachment", []):
                result["attachments"].append({
                    "id": att.get("id"),
                    "filename": att.get("filename"),
                    "size": att.get("size"),
                    "mimeType": att.get("mimeType"),
                    "created": att.get("created"),
                })

            # Custom fields with human-readable names
            for field_id, value in fields_data.items():
                if field_id.startswith("customfield_") and value is not None:
                    name = names_map.get(field_id, field_id)
                    result["custom_fields"][name] = value

            return json.dumps(result, indent=2, default=str, ensure_ascii=False)
    except httpx.HTTPStatusError as e:
        return json.dumps({"error": str(e), "status_code": e.response.status_code, "body": e.response.text[:500]})
    except Exception as e:
        return json.dumps({"error": str(e)})


@mcp.tool()
def search_issues(jql: str, fields: str = "summary,status,assignee,issuetype,priority", max_results: int = 50) -> str:
    """
    Search Jira issues using JQL.

    Args:
        jql: JQL query (e.g. "project = FSWTBC AND status = 'In Progress'")
        fields: Comma-separated field list
        max_results: Max results per page (1-100)
    """
    err = _check_config()
    if err:
        return err

    try:
        with _client() as client:
            r = client.post(
                f"{_base_url()}/search",
                json={
                    "jql": jql,
                    "fields": [f.strip() for f in fields.split(",")],
                    "maxResults": min(max_results, 100),
                },
            )
            r.raise_for_status()
            data = r.json()

            issues = []
            for issue in data.get("issues", []):
                f = issue.get("fields", {})
                issues.append({
                    "key": issue.get("key"),
                    "summary": f.get("summary"),
                    "status": f.get("status", {}).get("name") if f.get("status") else None,
                    "assignee": f.get("assignee", {}).get("displayName") if f.get("assignee") else None,
                    "issuetype": f.get("issuetype", {}).get("name") if f.get("issuetype") else None,
                    "priority": f.get("priority", {}).get("name") if f.get("priority") else None,
                })

            return json.dumps({
                "total": data.get("total"),
                "count": len(issues),
                "issues": issues,
            }, indent=2, ensure_ascii=False)
    except httpx.HTTPStatusError as e:
        return json.dumps({"error": str(e), "body": e.response.text[:500]})
    except Exception as e:
        return json.dumps({"error": str(e)})


@mcp.tool()
def get_comments(issue_key: str, max_results: int = 50) -> str:
    """
    Get comments from a Jira issue.

    Args:
        issue_key: Issue key (e.g. PROJ-123)
        max_results: Max comments to return
    """
    err = _check_config()
    if err:
        return err

    try:
        with _client() as client:
            r = client.get(
                f"{_base_url()}/issue/{issue_key}/comment",
                params={"maxResults": max_results, "orderBy": "-created"},
            )
            r.raise_for_status()
            data = r.json()

            comments = []
            for c in data.get("comments", []):
                # Extract plain text from ADF body
                body_text = _adf_to_text(c.get("body", {}))
                comments.append({
                    "id": c.get("id"),
                    "author": c.get("author", {}).get("displayName"),
                    "created": c.get("created"),
                    "updated": c.get("updated"),
                    "body": body_text,
                })

            return json.dumps({
                "total": data.get("total"),
                "comments": comments,
            }, indent=2, ensure_ascii=False)
    except httpx.HTTPStatusError as e:
        return json.dumps({"error": str(e), "body": e.response.text[:500]})
    except Exception as e:
        return json.dumps({"error": str(e)})


@mcp.tool()
def add_comment(issue_key: str, text: str) -> str:
    """
    Add a comment to a Jira issue. Accepts plain text (auto-converts to ADF).

    Args:
        issue_key: Issue key (e.g. PROJ-123)
        text: Comment text (plain text, will be wrapped in ADF)
    """
    err = _check_config()
    if err:
        return err

    try:
        adf_body = _text_to_adf(text)
        with _client() as client:
            r = client.post(
                f"{_base_url()}/issue/{issue_key}/comment",
                json={"body": adf_body},
            )
            r.raise_for_status()
            data = r.json()
            return json.dumps({
                "id": data.get("id"),
                "author": data.get("author", {}).get("displayName"),
                "created": data.get("created"),
                "status": "created",
            }, indent=2)
    except httpx.HTTPStatusError as e:
        return json.dumps({"error": str(e), "body": e.response.text[:500]})
    except Exception as e:
        return json.dumps({"error": str(e)})


@mcp.tool()
def download_attachment(attachment_id: str, save_path: str) -> str:
    """
    Download an attachment from Jira to a local file.

    Args:
        attachment_id: Attachment ID (from get_issue attachments list)
        save_path: Local path to save the file (e.g. /tmp/document.pdf)
    """
    err = _check_config()
    if err:
        return err

    try:
        save_dir = Path(save_path).parent
        save_dir.mkdir(parents=True, exist_ok=True)

        with _client() as client:
            r = client.get(f"{_base_url()}/attachment/content/{attachment_id}")
            r.raise_for_status()

            with open(save_path, "wb") as f:
                f.write(r.content)

            return json.dumps({
                "status": "downloaded",
                "path": save_path,
                "size": len(r.content),
                "content_type": r.headers.get("content-type", "unknown"),
            }, indent=2)
    except httpx.HTTPStatusError as e:
        return json.dumps({"error": str(e), "status_code": e.response.status_code, "body": e.response.text[:500]})
    except Exception as e:
        return json.dumps({"error": str(e)})


@mcp.tool()
def upload_attachment(issue_key: str, file_path: str) -> str:
    """
    Upload a file as an attachment to a Jira issue.

    Args:
        issue_key: Issue key (e.g. PROJ-123)
        file_path: Local path to the file to upload
    """
    err = _check_config()
    if err:
        return err

    try:
        file_path = Path(file_path)
        if not file_path.exists():
            return json.dumps({"error": f"File not found: {file_path}"})

        mime_type = mimetypes.guess_type(str(file_path))[0] or "application/octet-stream"

        headers = _auth_header()
        headers["X-Atlassian-Token"] = "no-check"
        # Remove Accept: application/json for multipart
        del headers["Accept"]

        with httpx.Client(headers=headers, timeout=120.0, follow_redirects=True) as client:
            with open(file_path, "rb") as f:
                r = client.post(
                    f"{_base_url()}/issue/{issue_key}/attachments",
                    files={"file": (file_path.name, f, mime_type)},
                )
                r.raise_for_status()
                data = r.json()

                results = []
                for att in data:
                    results.append({
                        "id": att.get("id"),
                        "filename": att.get("filename"),
                        "size": att.get("size"),
                        "mimeType": att.get("mimeType"),
                    })

                return json.dumps({
                    "status": "uploaded",
                    "attachments": results,
                }, indent=2)
    except httpx.HTTPStatusError as e:
        return json.dumps({"error": str(e), "status_code": e.response.status_code, "body": e.response.text[:500]})
    except Exception as e:
        return json.dumps({"error": str(e)})


@mcp.tool()
def get_field_schema(filter_custom: bool = True) -> str:
    """
    List all Jira fields with their IDs, names and types.
    Useful for discovering custom field IDs before querying issues.

    Args:
        filter_custom: If True, only return custom fields. If False, return all fields.
    """
    err = _check_config()
    if err:
        return err

    try:
        with _client() as client:
            r = client.get(f"{_base_url()}/field")
            r.raise_for_status()
            data = r.json()

            fields = []
            for f in data:
                if filter_custom and not f.get("custom", False):
                    continue
                fields.append({
                    "id": f.get("id"),
                    "name": f.get("name"),
                    "type": f.get("schema", {}).get("type") if f.get("schema") else None,
                    "custom": f.get("custom"),
                })

            fields.sort(key=lambda x: x.get("name", ""))
            return json.dumps({
                "total": len(fields),
                "fields": fields,
            }, indent=2, ensure_ascii=False)
    except httpx.HTTPStatusError as e:
        return json.dumps({"error": str(e), "body": e.response.text[:500]})
    except Exception as e:
        return json.dumps({"error": str(e)})


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _text_to_adf(text: str) -> dict:
    """Convert plain text to Atlassian Document Format (ADF)."""
    paragraphs = []
    for line in text.split("\n"):
        if line.strip():
            paragraphs.append({
                "type": "paragraph",
                "content": [{"type": "text", "text": line}],
            })
        else:
            paragraphs.append({"type": "paragraph", "content": []})

    return {
        "version": 1,
        "type": "doc",
        "content": paragraphs if paragraphs else [
            {"type": "paragraph", "content": [{"type": "text", "text": text}]}
        ],
    }


def _adf_to_text(adf: dict) -> str:
    """Extract plain text from ADF document."""
    if not adf or not isinstance(adf, dict):
        return ""

    texts = []

    def _walk(node):
        if isinstance(node, dict):
            if node.get("type") == "text":
                texts.append(node.get("text", ""))
            elif node.get("type") == "hardBreak":
                texts.append("\n")
            for child in node.get("content", []):
                _walk(child)
            if node.get("type") in ("paragraph", "heading", "bulletList", "orderedList"):
                texts.append("\n")
        elif isinstance(node, list):
            for item in node:
                _walk(item)

    _walk(adf)
    return "".join(texts).strip()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    err = _check_config()
    if err:
        _log(f"WARNING: {err}")
    else:
        _log(f"Starting Jira REST API MCP server ({JIRA_SITE}, {JIRA_EMAIL})")
    mcp.run()
