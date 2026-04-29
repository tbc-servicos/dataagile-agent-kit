# claude_skills

Marketplace público de plugins Claude Code para times TOTVS — skills, hooks, subagentes e MCP servers em Node.js/Python, distribuído via GitHub. O conteúdo restrito (knowledge base proprietário, fontes ADVPL, etc.) é gateado pelo `auth_server_skills` remoto via MCP — o repo público é apenas o "shell" do plugin.

## Carregar contexto antes de trabalhar

Antes de iniciar qualquer tarefa, leia o arquivo de contexto correspondente:

| Área | Arquivo |
|------|---------|
| Desenvolvimento de plugins | `.claude/context/dev.md` |
| Versionamento e deploy | `.claude/context/deploy.md` |
| MCP servers | `.claude/context/mcp.md` |
| Hooks | `.claude/context/hooks.md` |

Se a tarefa tocar múltiplas áreas, leia os arquivos relevantes em paralelo.

## Regras inegociáveis (sempre aplicar)

- **NUNCA fazer commit direto na `main`** — todo trabalho vai em branch + PR, sem exceção
- Nunca editar `dist/` diretamente — sempre editar em `mcp-proxy/` e rodar `npm run build`
- Nova skill exige registro duplo: `SKILL.md` + hook `session-context` do plugin
- Ao versionar plugin, atualizar `plugin.json` **e** `marketplace.json` raiz
- Hooks devem ser idempotentes e rápidos — erros bloqueiam a sessão
- Subagentes: haiku para implementação, sonnet para review/QA, opus só se o dev pedir
- **Cross-platform obrigatório:** todo hook/script novo deve rodar em Mac, Linux e Windows (ver seção abaixo)

## Cross-Platform Compatibility (obrigatório)

Todo hook, script ou ferramenta deste projeto **deve funcionar em Mac, Linux e Windows**.

**Regras:**
- Hooks novos: usar Node.js (`.cjs` ou `.mjs`) — bash quebra em Windows nativo (CMD/PowerShell sem Git Bash)
- Comando do hook: sempre `node "${CLAUDE_PLUGIN_ROOT}/path/script.cjs"` — Windows não associa `.cjs` automaticamente
- Paths: usar `path.join`, `path.dirname` do Node — nunca strings com `/` ou `\` hardcoded
- Operações de arquivo: `fs.readdirSync`, `fs.statSync` — não `find`, `ls`, `grep`, `jq`
- Variáveis de ambiente: `process.env` em Node — não `$VAR` (POSIX) ou `%VAR%` (CMD)
- Quando precisar de shell: detectar SO via `process.platform` e bifurcar comando

**Validação obrigatória antes de merge:**
- Testar em pelo menos 2 dos 3 SOs (idealmente os 3)
- Se hook envolver paths com espaços, testar com path real estilo `C:\Program Files`

**Hooks bash legados** (`session-context`, `marketplace-update.sh`, `advpl-lint.sh`): mantidos por compatibilidade via wrapper `run-hook.cmd`. **Novos hooks devem ser `.cjs`**. Migrar legados quando precisar tocar neles.

## Checklist antes de abrir PR

- [ ] `plugin.json` e `marketplace.json` raiz com versão atualizada
- [ ] Nova skill registrada no hook `session-context`
- [ ] Build do MCP proxy rodado se `mcp-proxy/` foi alterado
- [ ] `dist/` commitado dentro do plugin (não na raiz)
- [ ] Hooks testados localmente com `claude --plugin-dir ./<plugin>`

## Comandos essenciais

```bash
# Testar plugin localmente
claude --plugin-dir ./fluig

# Rebuild MCP proxy
cd mcp-proxy && npm install && npm run build
```
