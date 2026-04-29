# Onboarding — Claude Code Plugins TBC

Guia para desenvolvedores que estão configurando o ambiente pela primeira vez.

---

## Pré-requisitos

- [ ] **Claude Code** instalado: `npm install -g @anthropic-ai/claude-code`
- [ ] **Email cadastrado** no `auth_server_skills` (solicite ao administrador TBC ou faça auto-registro com trial 30d na primeira execução)

> Não precisa configurar SSH — o repo é público no GitHub e a instalação acontece via HTTPS.

---

## Instalação

### Passo 1 — Registrar o marketplace (uma vez por máquina)

```bash
claude plugin marketplace add https://github.com/tbc-servicos/tbc-knowledge-plugins.git
```

### Passo 2 — Instalar o(s) plugin(s)

```bash
claude plugin install fluig@claude-skills-tbc
claude plugin install protheus@claude-skills-tbc
claude plugin install confluence@claude-skills-tbc
```

### Passo 3 — Configurar email (obrigatório para protheus, mit-docs e tae)

O MCP autentica pelo email. **Sem isso, esses plugins não conectam.**

**macOS / Linux:**
```bash
echo 'export TBC_USER_EMAIL=seu.nome@empresa.com.br' >> ~/.zshrc   # ou ~/.bashrc
source ~/.zshrc
```

**Windows (PowerShell):**
```powershell
[Environment]::SetEnvironmentVariable("TBC_USER_EMAIL", "seu.nome@empresa.com.br", "User")
# Reinicie o terminal
```

**Alternativa (qualquer SO):**
```bash
mkdir -p ~/.config/tbc
echo '{ "email": "seu.nome@empresa.com.br" }' > ~/.config/tbc/dev-config.json
```

> **Devs internos TBC:** seu email já está na whitelist (`tier='internal'`) — knowledge completo e criptografado disponível.
> **Clientes externos:** primeiro request cria trial automático de 30 dias (`tier='trial'`). Após esse período, link para `/payment` é exibido — entre em contato com a TBC para ativação.

### Passo 4 — Ir para a pasta do projeto e abrir o Claude

```bash
cd ~/developments/seu-cliente/projeto
claude
# → /fluig:fluig-init-project         (projeto Fluig)
# → /protheus:protheus-init-project   (projeto Protheus)
```

O comando de inicialização vai te entrevistar e gerar um `CLAUDE.md` com as configurações específicas do seu cliente.

---

## Uso diário

### Fluig

```
/fluig:fluig-widget    → criar widget Angular
/fluig:fluig-dataset   → criar dataset
/fluig:fluig-form      → criar formulário
/fluig:fluig-workflow  → criar evento BPM
```

### Protheus

```
/protheus:advpl-writer      → escrever código ADVPL
/protheus:protheus-reviewer → revisar código
/protheus:protheus-compile  → compilar no AppServer
/protheus:protheus-test     → gerar testes TIR
```

### Confluence

```
/confluence:confluence-tools     → criar/atualizar páginas via MCP
/confluence:mit-doc-extractor    → converter documento MIT010/MIT072
/confluence:pdf-image-extractor  → extrair imagens de PDF
```

---

## Atualizar

**Na maioria dos casos: não faça nada.**

O hook `marketplace-update.sh` (executado automaticamente em cada `SessionStart`) já:

1. Faz `git pull` no marketplace clonado (HTTPS público)
2. Sincroniza `skills/`, `hooks/`, `agents/`, `dist/` e `CLAUDE.md` para o cache do plugin instalado
3. Atualiza a versão registrada quando detecta uma nova
4. **Auto-healing de URL antiga:** se você ainda tem o marketplace registrado apontando pro Bitbucket antigo, o hook detecta e troca para o GitHub automaticamente

**Resultado:** ao abrir uma sessão nova depois de uma mudança no marketplace, você já está na versão mais recente — sem precisar rodar comando nenhum.

> ⚠️ **Não rode `claude plugin uninstall` por hábito.** Em plugins instalados via marketplace, o uninstall retorna o erro "installed in managed scope" — isso é o sistema te protegendo de uma operação desnecessária. Se você cair nesse erro, veja [Troubleshooting](#troubleshooting).

### Verificar em qual versão você está

Antes de tentar qualquer atualização manual, confirme se você não está já na versão mais recente:

```bash
# 1. Versão registrada no installed_plugins.json (o que claude plugin list mostra)
cat ~/.claude/plugins/installed_plugins.json | grep -A 6 protheus@claude-skills-tbc

# 2. Versões em cache (a maior é a que o Claude Code carrega)
ls ~/.claude/plugins/cache/claude-skills-tbc/protheus/

# 3. Versão no marketplace clone (após git pull automático)
cat ~/.claude/plugins/marketplaces/claude-skills-tbc/protheus/.claude-plugin/plugin.json | grep version
```

Se as três versões estão alinhadas → **você está atualizado**, não há nada a fazer.

### Forçar atualização (último recurso)

Use **apenas se** o diagnóstico acima mostrar inconsistência (ex: marketplace clone em `v2.0.8` mas cache só tem pasta `2.0.7`) — o que indica que o auto-sync falhou (raríssimo).

```bash
claude plugin uninstall protheus@claude-skills-tbc && claude plugin install protheus@claude-skills-tbc
```

Se o uninstall retornar "installed in managed scope", siga o reset manual em [Troubleshooting](#troubleshooting).

---

## Migração do Bitbucket (devs que já usavam o marketplace antigo)

Se você usava o marketplace anterior (`bitbucket.org/fabricatbc/claude_skills`), o auto-healing do hook deve cuidar disso na próxima sessão. Para garantir um cutover limpo, faça manual:

```bash
# 1. Remover marketplace antigo (Bitbucket)
claude plugin marketplace remove claude-skills-tbc

# 2. Adicionar marketplace novo (GitHub)
claude plugin marketplace add https://github.com/tbc-servicos/tbc-knowledge-plugins.git

# 3. Reinstalar plugins que você usa
claude plugin install fluig@claude-skills-tbc
claude plugin install protheus@claude-skills-tbc
# (e os demais)

# 4. Verificar
claude plugin list
```

---

## Troubleshooting

**Plugin não encontrado:**
```bash
claude plugin list                  # verificar se instalado
claude plugin marketplace list      # verificar marketplaces registrados
# Se o marketplace não aparecer, registre novamente:
claude plugin marketplace add https://github.com/tbc-servicos/tbc-knowledge-plugins.git
```

**Erro ao desinstalar — "installed in managed scope, not user":**

> **Antes de aplicar este reset:** confirme se você realmente precisa atualizar (veja [Verificar em qual versão você está](#verificar-em-qual-versao-voce-esta) na seção Atualizar). Na maioria dos casos o auto-sync já cuidou disso e o uninstall era desnecessário.

Se confirmou que precisa forçar e o uninstall caiu no erro: o Claude Code CLI tem um bug — sugere `--scope managed` mas esse valor é inválido. Use o reset manual:

```bash
# Windows (PowerShell):
$pluginsDir = "$env:USERPROFILE\.claude\plugins"

# 1. Remover cache do plugin
Remove-Item -Recurse -Force "$pluginsDir\cache\claude-skills-tbc" -ErrorAction SilentlyContinue

# 2. Limpar entries do installed_plugins.json (editar manualmente ou usar o script abaixo)
$json = Get-Content "$pluginsDir\installed_plugins.json" | ConvertFrom-Json
$json.plugins.PSObject.Properties | Where-Object { $_.Name -like "*@claude-skills-tbc" } | ForEach-Object { $json.plugins.PSObject.Properties.Remove($_.Name) }
$json | ConvertTo-Json -Depth 10 | Set-Content "$pluginsDir\installed_plugins.json"

# 3. Reinstalar
claude plugin install protheus@claude-skills-tbc
claude plugin install fluig@claude-skills-tbc
claude plugin install confluence@claude-skills-tbc
```

```bash
# macOS / Linux:
rm -rf ~/.claude/plugins/cache/claude-skills-tbc

# Editar ~/.claude/plugins/installed_plugins.json e remover as keys *@claude-skills-tbc
# Depois:
claude plugin install protheus@claude-skills-tbc
claude plugin install fluig@claude-skills-tbc
claude plugin install confluence@claude-skills-tbc
```

**MCP protheus / mit-docs / tae não conecta:**
```bash
claude mcp list  # verificar se registrado
# Verificar: $TBC_USER_EMAIL exportado (devs internos) ou conta criada no auth_server_skills
# Testar: /protheus:protheus-compile em um arquivo .prw
```

**MCP retorna 402 (assinatura expirada):**
- Trial de 30d acabou
- Acesse https://mcp.totvstbc.com.br/payment e siga as instruções para regularizar

---

## Contribuindo com plugins

Se você vai editar skills ou criar novos plugins neste repositório, ative os git hooks uma vez após clonar:

```bash
git clone https://github.com/tbc-servicos/tbc-knowledge-plugins.git
cd claude-skills
git config core.hooksPath .githooks
```

A partir daí, a versão em `plugin.json` é **bumped automaticamente no patch** a cada commit que alterar arquivos do plugin. Não é necessário atualizar manualmente.

> Exemplo: você edita `keepass/skills/keepass/SKILL.md` e faz commit → o hook bumpa `keepass` de `1.0.0` para `1.0.1` automaticamente.

Para alterar major/minor (breaking changes ou features grandes), edite o `plugin.json` manualmente antes do commit — o hook respeita mudanças manuais de versão.

---

## Integração automática com JIRA

Os git hooks rastreiam o trabalho no JIRA automaticamente — não é necessária nenhuma configuração além do `git config core.hooksPath .githooks` já descrito acima.

**Fluxo:**
1. **Abrir o Claude Code** — `SessionStart` detecta o plugin e salva contexto em `.jira-session`.
2. **Primeiro commit** — `pre-commit` busca ou cria uma Story do plugin sob a Epic configurada, cria uma Task `[plugin] feat/branch — YYYY-MM-DD` e salva a chave em `.jira-session`.
3. **Commits seguintes** — `pre-commit` adiciona comentário na Task com a mensagem do commit.
4. **`git push`** — `pre-push` pede ao Claude para analisar o diff e grava resumo em linguagem natural na Task.

O arquivo `.jira-session` é criado automaticamente e já está no `.gitignore` — não aparece no git.
Para desativar o rastreamento em uma sessão: `rm .jira-session`.

---

## Dúvidas

- Slack TBC: #desenvolvimento
- Issues no GitHub: https://github.com/tbc-servicos/tbc-knowledge-plugins/issues
- README completo: `README.md` neste repositório
- Inicialização do projeto: `/fluig:fluig-init-project` ou `/protheus:protheus-init-project`
