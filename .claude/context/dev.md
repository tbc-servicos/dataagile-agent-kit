# Contexto: Desenvolvimento de Plugins

## Estrutura de um plugin

```
<plugin>/
├── .claude-plugin/plugin.json   # Manifesto (nome, versão, descrição)
├── CLAUDE.md                    # Documentação do plugin
├── skills/<nome>/SKILL.md       # Uma skill por subdiretório
├── agents/<nome>.md             # Subagentes (Haiku/Sonnet)
├── hooks/
│   ├── hooks.json               # Declaração dos hooks (evento → script)
│   └── *.sh                     # Scripts de hook
└── mcp-servers/<nome>/          # MCP server (opcional)
    ├── index.js
    ├── package.json
    └── start.sh
```

## Convenções de skills

- Frontmatter YAML obrigatório: `name`, `description`
- Invocação: `/namespace:skill-name`
- **Nova skill:** registrar também no hook `session-context` do plugin (lista hardcoded)

## Convenções de subagentes

- **haiku** para implementação mecânica
- **sonnet** para review/QA
- **opus** apenas se o dev pedir explicitamente
- Comunicação bidirecional via `SendMessage`

## Build do MCP Proxy

```bash
cd mcp-proxy
npm install
npm run build
# Gera: dist/tbc-mcp-proxy.mjs e dist/tae-mcp-proxy.mjs
# Auto-copia para: protheus/dist/, fluig/dist/, mit-docs/dist/, TAE/dist/
```

- Nunca editar `dist/` diretamente — sempre editar em `mcp-proxy/` e rebuildar
- Os bundles vivem dentro de cada plugin (`<plugin>/dist/`) — o `.gitignore` usa `/dist/` (root only)

## Teste local de plugins

```bash
claude --plugin-dir ./fluig
claude --plugin-dir ./protheus
claude --plugin-dir ./mit-docs
```
