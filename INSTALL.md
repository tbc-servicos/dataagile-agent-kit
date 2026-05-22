# DataAgile Agent Kit — Install Guide

Install the DataAgile MCP server and skills in **Claude Code**, **Codex CLI**, or **Gemini CLI**.

---

## Prerequisites

| Requirement | Minimum | How to check |
|-------------|---------|-------------|
| Node.js | 18+ | `node --version` |
| An AI CLI | any below | see sections |
| DataAgile API key | required for paid features | [Get key →](https://dataagile-agent-kit.dataagile.com.br) |

> **Free trial:** 7-day trial activates automatically on your first MCP request. No credit card needed.

---

## Option 1 — Automated Installer (all CLIs)

Run this command to detect all installed CLIs and register the MCP server automatically:

```bash
npx github:tbc-servicos/dataagile-agent-kit --dry-run   # preview what would change
npx github:tbc-servicos/dataagile-agent-kit              # apply
```

The installer will:
1. Detect which CLIs are installed (`claude`, `gemini`, `codex`)
2. **Claude Code** — add the marketplace and install all 4 plugins (protheus, fluig, playwright, po-ui)
3. **Gemini / Codex** — register `mcp.totvstbc.com.br` in each CLI's config
4. If any step fails, print the exact manual commands to run

If you prefer to configure manually, follow the sections below.

---

## Claude Code

Claude Code uses a native plugin system — no manual JSON config needed.

**Install all plugins (automated — same as running the npx installer):**
```bash
claude plugin marketplace add https://github.com/tbc-servicos/dataagile-agent-kit.git
claude plugin install protheus@claude-skills-dataagile
claude plugin install fluig@claude-skills-dataagile
claude plugin install playwright@claude-skills-dataagile
claude plugin install po-ui@claude-skills-dataagile
```

**Configure API key:**
```bash
mkdir -p ~/.config/dataagile
echo '{"api_key":"SUA_API_KEY"}' > ~/.config/dataagile/dev-config.json
# or: export DATAAGILE_API_KEY=SUA_API_KEY
```

**Verify:**
```bash
claude plugin list
# Should show: protheus, fluig, playwright, po-ui
```

**Activate a skill in a session:**
Type `/protheus:brainstorm`, `/fluig:widget`, etc. in the Claude Code prompt.

---

## Gemini CLI

Gemini CLI (v0.20+) supports HTTP MCP servers natively.

**Install (one command):**
```bash
gemini mcp add dataagile https://mcp.totvstbc.com.br/mcp \
  --transport http \
  --header "x-api-key: YOUR_API_KEY" \
  --scope user
```

Replace `YOUR_API_KEY` with your DataAgile API key.

**Verify:**
```bash
gemini mcp list
# Should show: dataagile   https://mcp.totvstbc.com.br/mcp
```

**Load a skill into your session:**
In a Gemini session, call the `get_skill` tool:
```
get_skill({ name: "protheus:specialist" })
```
Paste the returned content into your system prompt to activate the skill.

**Manual config** (if `gemini mcp add` fails):

Edit `~/.gemini/settings.json`:
```json
{
  "mcpServers": {
    "dataagile": {
      "url": "https://mcp.totvstbc.com.br/mcp",
      "type": "http",
      "headers": {
        "x-api-key": "YOUR_API_KEY"
      }
    }
  }
}
```

---

## Codex CLI

Codex CLI supports MCP servers via `~/.codex/config.yaml`.

**Manual config** — edit `~/.codex/config.yaml`:
```yaml
mcpServers:
  dataagile:
    transport: http
    url: "https://mcp.totvstbc.com.br/mcp"
    headers:
      x-api-key: "YOUR_API_KEY"
```

**Verify:**
Start a Codex session and call `get_skill`:
```
get_skill({ name: "protheus:specialist" })
```

---

## After Install — Using Skills

Once the MCP server is registered, you can load any skill on demand:

| Skill | Description |
|-------|-------------|
| `protheus:specialist` | ADVPL/TLPP expert — searches knowledge base, writes code |
| `protheus:brainstorm` | Design a new Protheus feature collaboratively |
| `protheus:writer` | Write ADVPL/TLPP code following TBC standards |
| `protheus:reviewer` | Review ADVPL/TLPP code for quality and standards |
| `fluig:brainstorm` | Design a new Fluig feature |
| `fluig:widget` | Scaffold and implement a Fluig widget |
| `fluig:dataset` | Create a Fluig dataset |

**How to load in Codex/Gemini:**
```
# In your AI session:
get_skill({ name: "protheus:specialist" })
# → Returns the full skill content
# Paste it into your system prompt or prefix your next message with it
```

---

## Troubleshooting

**`get_skill` returns "Skill not found"**
- Check the skill name format: `plugin:skill-name` (e.g. `protheus:specialist`)
- List available skills: ask the AI to call `get_skill({ name: "protheus:list" })` — or check this file

**`get_skill` returns "not available for your current plan"**
- You are trying to access a premium skill (`mit-docs:*`) with a trial/standard plan
- Upgrade at: https://dataagile-agent-kit.dataagile.com.br

**Gemini CLI — auth error on `gemini mcp add`**
- Set your Gemini API key first: `export GEMINI_API_KEY=your_key`
- Or set it in `~/.gemini/settings.json`

**Codex CLI — MCP not connecting**
- Verify `~/.codex/config.yaml` has the correct indentation (YAML is indent-sensitive)
- Confirm `transport: http` (not `sse` or `stdio`)
- Test the URL directly: `curl -s https://mcp.totvstbc.com.br/health`

**Installer can't write config**
- Check file permissions: `ls -la ~/.gemini/` or `ls -la ~/.codex/`
- Run the installer with `sudo` as a last resort, or edit the config manually

**`npx github:tbc-servicos/dataagile-agent-kit` fails**
- Ensure you have Node.js 18+: `node --version`
- If behind a proxy, set `npm_config_https_proxy`
- Fallback: clone locally and run `node installer/index.js`

---

## Uninstall

**Claude Code:**
```bash
claude plugin uninstall protheus@claude-skills-dataagile
claude plugin uninstall fluig@claude-skills-dataagile
claude plugin uninstall playwright@claude-skills-dataagile
claude plugin uninstall po-ui@claude-skills-dataagile
```

**Gemini CLI:**
```bash
gemini mcp remove dataagile --scope user
```

**Codex CLI:**
Remove the `dataagile:` block from `~/.codex/config.yaml`.

---

## Support

- Email: [dev@dataagile.com.br](mailto:dev@dataagile.com.br)
- GitHub Issues: [tbc-servicos/dataagile-agent-kit/issues](https://github.com/tbc-servicos/dataagile-agent-kit/issues)
- Plans and pricing: [dataagile-agent-kit.dataagile.com.br](https://dataagile-agent-kit.dataagile.com.br)
