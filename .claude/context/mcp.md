# Contexto: MCP Servers

## Três tipos de MCP server

### 1. Proxy remoto
- Arquivo: `<plugin>/dist/tbc-mcp-proxy.mjs`
- Conecta ao endpoint TBC Knowledge via Streamable HTTP
- URL configurável via `TBC_MCP_URL` (default: `https://mcp.totvstbc.com.br/mcp`)
- Requer variável de ambiente: `TBC_USER_EMAIL`

### 2. Local SQLite
- Exemplo: `protheus/mcp-servers/advpl-knowledge/`
- SQLite criptografado com 155k+ registros ADVPL
- Roda via `node index.js`

### 3. Python com launcher Node.js
- Exemplo: `jira-api/mcp-servers/jira-rest/`
- FastMCP + httpx
- Launcher `start.js` auto-detecta Python, cria venv e instala deps
- Cross-platform

## Build do proxy

```bash
cd mcp-proxy
npm install
npm run build
```

Gera `dist/tbc-mcp-proxy.mjs` e `dist/tae-mcp-proxy.mjs`, auto-copiados para cada plugin.
