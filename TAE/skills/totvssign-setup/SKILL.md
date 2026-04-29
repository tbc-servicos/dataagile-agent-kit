---
name: totvssign-setup
description: Configura credenciais para o MCP TOTVS Assinatura Eletrônica (TAE). Use quando o MCP totvs-sign não está conectado ou credenciais precisam ser configuradas.
---

# Configuração de Credenciais — TOTVS Sign MCP

O plugin TAE já vem com o MCP server `totvs-sign` configurado.
Esta skill só é necessária se as credenciais ainda não foram configuradas.

## Verificar se está funcionando

Tente usar a tool `totvssign_listPublications`. Se funcionar, não precisa fazer nada.

Se aparecer `getConnectionStatus` como única tool, as credenciais não estão configuradas.

## Configurar Credenciais

O MCP busca credenciais nesta ordem: env vars → config file → KeePass.

### Opção 1: KeePass (se disponível)

```bash
test -f /keepass/trabalho.kdbx && echo "KeePass OK" || echo "KeePass NÃO disponível"
```

Se disponível, verifique a entrada:
```bash
source "$HOME/.claude/.secrets/keepass-creds.sh"
pass=$(keepass_get_pass "keepass-trabalho")
echo "$pass" | keepassxc-cli show -q /keepass/trabalho.kdbx "TBC/Totvs Assinatura Digital TAE - Login" 2>/dev/null
```

Se não existir, pergunte email e senha e crie a entrada.

### Opção 2: Config file

Adicione `tae_email` e `tae_password` em `~/.config/tbc/dev-config.json` e proteja com `chmod 600`.

### Opção 3: Variáveis de ambiente

```bash
export TAE_USER_EMAIL="seu-email@empresa.com"
export TAE_PASSWORD="senha"
```

Após configurar, reinicie o Claude Code.
