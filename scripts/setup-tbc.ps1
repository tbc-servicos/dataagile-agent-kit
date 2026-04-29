# =============================================================
#  TBC Plugin Setup — Windows PowerShell
#  Para analistas e devs — nao requer conhecimento tecnico
# =============================================================

$ErrorActionPreference = "Stop"

$MarketDir = "$env:USERPROFILE\.claude\plugins\marketplaces\claude-skills-tbc"
$RepoURL = "https://github.com/tbc-servicos/tbc-knowledge-plugins.git"
$AuthURL = "https://mcp.totvstbc.com.br/auth"
$ConfigDir = "$env:USERPROFILE\.config\tbc"
$ConfigFile = "$ConfigDir\dev-config.json"

Write-Host "========================================"
Write-Host "  TBC Plugin Setup (Windows)"
Write-Host "  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "========================================"
Write-Host ""

# ----- Passo 1: Verificar pre-requisitos -----
Write-Host "[1/5] Verificando pre-requisitos..."

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "  ERRO: Node.js nao encontrado. Instale em https://nodejs.org"
    exit 1
}
Write-Host "  Node.js OK"

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "  ERRO: Git nao encontrado. Instale em https://git-scm.com"
    exit 1
}
Write-Host "  Git OK"

# ----- Passo 2: Clonar/Atualizar marketplace (HTTPS, sem credenciais) -----
Write-Host ""
Write-Host "[2/5] Instalando plugins TBC..."

if (Test-Path "$MarketDir\.git") {
    Write-Host "  Marketplace ja existe, atualizando..."
    $currentUrl = (git -C $MarketDir remote get-url origin 2>$null)
    if ($currentUrl -like "*bitbucket*") {
        Write-Host "  Detectada URL antiga (Bitbucket). Migrando para GitHub..."
        git -C $MarketDir remote set-url origin $RepoURL
    }
    git -C $MarketDir fetch origin --prune --force --quiet 2>$null
    $branch = git -C $MarketDir rev-parse --abbrev-ref HEAD 2>$null
    if (-not $branch) { $branch = "main" }
    git -C $MarketDir reset --hard "origin/$branch" --quiet 2>$null
    Write-Host "  Atualizado"
} else {
    Write-Host "  Clonando repositorio publico..."
    $parentDir = Split-Path $MarketDir -Parent
    if (-not (Test-Path $parentDir)) {
        New-Item -ItemType Directory -Path $parentDir -Force | Out-Null
    }
    git clone --quiet $RepoURL $MarketDir 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ERRO: Falha ao clonar. Verifique sua conexao."
        exit 1
    }
    Write-Host "  Clonado com sucesso"
}

# ----- Passo 3: Configurar e validar email MCP -----
Write-Host ""
Write-Host "[3/5] Configurando email para o MCP..."

$Email = ""

if (Test-Path $ConfigFile) {
    $configJson = Get-Content $ConfigFile -Raw -ErrorAction SilentlyContinue
    if ($configJson -match '"email"\s*:\s*"([^"]+)"') {
        $Email = $Matches[1]
        Write-Host "  Email encontrado: $Email"
    }
}

if (-not $Email) {
    $gitEmail = git config user.email 2>$null
    $prompt = "  Digite seu email"
    if ($gitEmail) { $prompt += " [$gitEmail]" }
    $prompt += ": "
    $emailInput = Read-Host $prompt
    if ($emailInput) { $Email = $emailInput } else { $Email = $gitEmail }
}

if (-not $Email) {
    Write-Host "  AVISO: Email nao informado. MCP nao vai funcionar."
} else {
    Write-Host "  Verificando acesso ao MCP..."
    try {
        $body = "{`"email`":`"$Email`"}"
        $response = Invoke-WebRequest -Uri $AuthURL -Method Post -Body $body -ContentType "application/json" -UseBasicParsing -ErrorAction Stop
        Write-Host "  Email validado — acesso ao MCP liberado"
        if (-not (Test-Path $ConfigDir)) {
            New-Item -ItemType Directory -Path $ConfigDir -Force | Out-Null
        }
        Set-Content -Path $ConfigFile -Value "{`n  `"email`": `"$Email`"`n}"
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 402) {
            Write-Host ""
            Write-Host "  ============================================"
            Write-Host "  AVISO: Trial expirado para '$Email'"
            Write-Host "  ============================================"
            Write-Host "  Acesse https://mcp.totvstbc.com.br/payment para regularizar."
            if (-not (Test-Path $ConfigDir)) {
                New-Item -ItemType Directory -Path $ConfigDir -Force | Out-Null
            }
            Set-Content -Path $ConfigFile -Value "{`n  `"email`": `"$Email`"`n}"
        } elseif ($statusCode -eq 403) {
            Write-Host ""
            Write-Host "  ============================================"
            Write-Host "  ERRO: Email '$Email' nao tem acesso ao MCP"
            Write-Host "  ============================================"
            Write-Host "  Solicite cadastro: https://mcp.totvstbc.com.br/admin"
        } else {
            Write-Host "  AVISO: Nao foi possivel validar (servidor indisponivel). Salvando email."
            if (-not (Test-Path $ConfigDir)) {
                New-Item -ItemType Directory -Path $ConfigDir -Force | Out-Null
            }
            Set-Content -Path $ConfigFile -Value "{`n  `"email`": `"$Email`"`n}"
        }
    }
}

# ----- Passo 4: StatusLine -----
Write-Host ""
Write-Host "[4/5] Configurando rodape TBC..."

$Settings = "$env:USERPROFILE\.claude\settings.json"
$StatusLineCmd = 'bash "$HOME/.claude/plugins/marketplaces/claude-skills-tbc/scripts/statusline-tbc.sh"'

if (Test-Path $Settings) {
    $settingsContent = Get-Content $Settings -Raw
    if ($settingsContent -like "*statusline-tbc*") {
        Write-Host "  Rodape ja configurado"
    } else {
        $statusLineJson = @"
  "statusLine": {
    "type": "command",
    "command": "$StatusLineCmd"
  }
"@
        $settingsContent = $settingsContent.TrimEnd()
        if ($settingsContent.EndsWith("}")) {
            $lastBrace = $settingsContent.LastIndexOf("}")
            $beforeBrace = $settingsContent.Substring(0, $lastBrace).TrimEnd()
            if (-not $beforeBrace.EndsWith(",") -and -not $beforeBrace.EndsWith("{")) {
                $beforeBrace += ","
            }
            $newContent = $beforeBrace + "`n" + $statusLineJson + "`n}"
            Set-Content -Path $Settings -Value $newContent -NoNewline
            Write-Host "  Rodape configurado"
        } else {
            Write-Host "  AVISO: settings.json formato inesperado. Adicione manualmente."
        }
    }
} else {
    Write-Host "  AVISO: settings.json nao encontrado. Abra o Claude Code uma vez antes."
}

# ----- Passo 5: Claude Desktop + Validacao -----
Write-Host ""
Write-Host "[5/5] Configurando Claude Desktop..."

$DesktopConfig = "$env:APPDATA\Claude\claude_desktop_config.json"
$ProxyPath = "$MarketDir\dist\tbc-mcp-proxy.mjs" -replace '\\', '\\'
$TaeProxyPath = "$MarketDir\dist\tae-mcp-proxy.mjs" -replace '\\', '\\'

$ConfiguredEmail = ""
if (Test-Path $ConfigFile) {
    $cfgContent = Get-Content $ConfigFile -Raw -ErrorAction SilentlyContinue
    if ($cfgContent -match '"email"\s*:\s*"([^"]+)"') {
        $ConfiguredEmail = $Matches[1]
    }
}
if (-not $ConfiguredEmail) { $ConfiguredEmail = "seu@email.com.br" }

if (Test-Path $DesktopConfig) {
    $desktopContent = Get-Content $DesktopConfig -Raw
    if ($desktopContent -like "*tbc-knowledge*") {
        Write-Host "  Claude Desktop ja configurado"
    } else {
        Write-Host "  AVISO: Claude Desktop existe mas sem MCP TBC."
        Write-Host "  Adicione manualmente em: $DesktopConfig"
    }
} else {
    $DesktopDir = Split-Path $DesktopConfig -Parent
    if (-not (Test-Path $DesktopDir)) {
        New-Item -ItemType Directory -Path $DesktopDir -Force | Out-Null
    }
    $desktopJson = @"
{
  "mcpServers": {
    "tbc-knowledge": {
      "command": "node",
      "args": ["$ProxyPath"],
      "env": { "TBC_USER_EMAIL": "$ConfiguredEmail" }
    },
    "totvs-sign": {
      "command": "node",
      "args": ["$TaeProxyPath"],
      "env": { "TAE_USER_EMAIL": "$ConfiguredEmail", "TAE_PASSWORD": "CONFIGURE_SUA_SENHA" }
    }
  }
}
"@
    Set-Content -Path $DesktopConfig -Value $desktopJson
    Write-Host "  Claude Desktop configurado"
    Write-Host "  AVISO: Configure a senha do TOTVS Sign em:"
    Write-Host "    $DesktopConfig"
    Write-Host "    Substitua CONFIGURE_SUA_SENHA pela sua senha"
}

Write-Host ""
Write-Host "--- Plugins TBC ---"
Get-ChildItem -Path $MarketDir -Directory | ForEach-Object {
    $pf = Join-Path $_.FullName ".claude-plugin\plugin.json"
    if (Test-Path $pf) {
        $content = Get-Content $pf -Raw
        if ($content -match '"version"\s*:\s*"([^"]+)"') {
            Write-Host "  OK  $($_.Name) v$($Matches[1])"
        }
    }
}

Write-Host ""
if (Test-Path "$MarketDir\dist\tbc-mcp-proxy.mjs") {
    Write-Host "  OK  MCP proxy bundle"
} else {
    Write-Host "  ERR MCP proxy bundle NAO encontrado"
}

Write-Host ""
Write-Host "========================================"
Write-Host "  SETUP COMPLETO — Reinicie o Claude Code"
Write-Host "========================================"
