# Wish: Suporte Multiplataforma (macOS + Linux/WSL)

**Status:** SHIPPED
**Slug:** cross-platform-support
**Date:** 2026-03-25

---

## Summary

A KeePass Skill usa `security find-generic-password` (macOS Keychain) e caminhos hardcoded do Homebrew, bloqueando uso em Linux e Windows (via WSL). Este wish adiciona uma camada de abstração que detecta o OS via `uname -s` e delega para o secret store correto — `security` no macOS e `secret-tool` (libsecret) no Linux/WSL — sem quebrar nenhum comportamento existente.

---

## Scope

### IN
- Função `detect_os()` → retorna `macos` ou `linux`
- Função `get_password(service, account)` → abstrai Keychain vs secret-tool
- Função `store_password(service, account)` → instruções de armazenamento por OS
- Função `find_keepassxc_cli()` → descoberta do binário por OS
- Função `check_desktop_running()` → `pgrep` (macOS/Linux) com fallback
- Atualizar `commands/keepass.md` para usar as funções de abstração
- Atualizar `skills/keepass/SKILL.md` com padrões cross-platform
- Atualizar `commands/keepass-setup.md` com instruções por OS (pré-requisitos, armazenamento de senha)
- Atualizar `README.md` e `CLAUDE.md` com requisitos de plataforma

### OUT
- Suporte a Windows nativo (cmd.exe, PowerShell, Git Bash sem WSL)
- Suporte a `pass` (password-store) como alternativa ao secret-tool
- Suporte a outros secret stores Linux (KWallet, 1Password CLI, etc.)
- Alterações no formato de `keepass-config.json`
- Testes automatizados de integração com keepassxc-cli real

---

## Decisões

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Windows runtime | WSL obrigatório | Ambiente Linux completo; evita dois caminhos distintos para Windows |
| Detecção de OS | `uname -s` | Funciona em macOS, Linux nativo e WSL sem dependências |
| Linux secret store | `secret-tool` (libsecret) | Padrão GNOME/Ubuntu/Fedora; API CLI simples |
| macOS secret store | `security find-generic-password` | Sem mudança — já funcionava |
| keepassxc-cli discovery | `which keepassxc-cli` → fallbacks por OS | Homebrew (macOS), `/usr/bin` (Linux), custom path |
| Verificar desktop aberto | `pgrep -x "KeePassXC"` | Funciona em macOS e Linux/WSL igualmente |

---

## Success Criteria

- [x] Em macOS: `get_password` usa `security find-generic-password` e retorna a senha corretamente
- [x] Em Linux/WSL: `get_password` usa `secret-tool lookup` e retorna a senha corretamente
- [x] `find_keepassxc_cli` encontra o binário em macOS (Homebrew) e Linux (`/usr/bin`)
- [x] `/keepass-setup` exibe instruções de pré-requisitos específicas do OS detectado
- [x] `/keepass-setup` armazena senha no Keychain correto por OS
- [x] `/keepass list` funciona sem modificação em ambos os OSes após reconfiguração
- [x] Nenhuma regressão em macOS — comportamento idêntico ao atual

---

## Execution Groups

### Grupo 1 — Funções de abstração cross-platform

**Goal:** Criar o conjunto de funções reutilizáveis que encapsulam diferenças de OS.

**Deliverables:** Bloco de código bash documentado com as 5 funções abaixo, pronto para ser colado nos arquivos de skill.

```bash
# Detecta o OS atual
detect_os() {
  case "$(uname -s)" in
    Darwin) echo "macos" ;;
    Linux)  echo "linux" ;;
    *)      echo "unsupported" ;;
  esac
}

# Recupera senha do secret store do OS
# Uso: get_password "keepassxc-cli" "keepass-pessoal"
get_password() {
  local service="$1" account="$2"
  case "$(detect_os)" in
    macos) security find-generic-password -s "$service" -a "$account" -w 2>/dev/null ;;
    linux) secret-tool lookup service "$service" account "$account" 2>/dev/null ;;
    *)     echo "❌ OS não suportado. Use macOS ou Linux/WSL." >&2; return 1 ;;
  esac
}

# Retorna o caminho do keepassxc-cli
find_keepassxc_cli() {
  # Tenta PATH primeiro (funciona em qualquer OS se instalado corretamente)
  if command -v keepassxc-cli &>/dev/null; then
    command -v keepassxc-cli
    return
  fi
  # Fallbacks por OS
  case "$(detect_os)" in
    macos)
      for p in /opt/homebrew/bin/keepassxc-cli /usr/local/bin/keepassxc-cli; do
        [ -x "$p" ] && echo "$p" && return
      done ;;
    linux)
      for p in /usr/bin/keepassxc-cli /usr/local/bin/keepassxc-cli; do
        [ -x "$p" ] && echo "$p" && return
      done ;;
  esac
  echo "" # não encontrado
}

# Verifica se KeePassXC desktop está em execução
check_desktop_running() {
  pgrep -x "KeePassXC" > /dev/null 2>&1
}

# Imprime instrução de como armazenar a senha no secret store do OS
# Uso: store_password_instruction "keepassxc-cli" "keepass-pessoal"
store_password_instruction() {
  local service="$1" account="$2"
  case "$(detect_os)" in
    macos)
      echo "security add-generic-password -s \"$service\" -a \"$account\" -w" ;;
    linux)
      echo "secret-tool store --label=\"$account\" service \"$service\" account \"$account\"" ;;
  esac
}
```

**Acceptance criteria:**
- `detect_os` retorna `macos` em macOS e `linux` em Linux/WSL
- `get_password` delega corretamente por OS sem expor a senha
- `find_keepassxc_cli` retorna path válido se instalado, string vazia se não
- `check_desktop_running` retorna exit code 0 se rodando, 1 se não

**Validation:**
```bash
# Em macOS
uname -s  # → Darwin
# Em Linux/WSL
uname -s  # → Linux

# Testar descoberta do binário
bash -c 'source functions.sh && find_keepassxc_cli'
```

---

### Grupo 2 — Atualizar `commands/keepass.md`

**Goal:** Substituir todas as chamadas diretas de `security`, `pgrep` e path hardcoded pelo uso das funções de abstração.

**Deliverables:** `commands/keepass.md` atualizado com:
- Bloco das 5 funções no Passo 0
- `KEEPASSXC=$(find_keepassxc_cli)` substituindo path hardcoded
- `pass=$(get_password "$keychain_service" "$keychain_account")` em `run_on_db`
- `check_desktop_running` substituindo `pgrep -x KeePassXC` direto
- Seção de diagnóstico atualizada com comandos por OS

**Acceptance criteria:**
- Nenhuma referência a `security find-generic-password` fora da função `get_password`
- Nenhum path `/opt/homebrew` hardcoded
- `pgrep -x KeePassXC` direto substituído por `check_desktop_running`

**Validation:**
```bash
grep -n "security find-generic-password\|/opt/homebrew\|pgrep -x" commands/keepass.md
# → deve retornar vazio (apenas dentro das funções de abstração)
```

---

### Grupo 3 — Atualizar `skills/keepass/SKILL.md`

**Goal:** Atualizar o pseudocódigo e padrões de referência para usar funções cross-platform.

**Deliverables:** `skills/keepass/SKILL.md` atualizado com:
- Pseudocódigo de busca global usando `get_password` e `find_keepassxc_cli`
- Tabela de erros expandida com erros Linux (`secret-tool` não instalado, etc.)
- Nota de plataforma: macOS nativo, Linux nativo, Windows via WSL

**Acceptance criteria:**
- Pseudocódigo não usa `security` diretamente
- Tabela de erros cobre macOS e Linux

**Validation:**
```bash
grep -n "security find-generic-password" skills/keepass/SKILL.md
# → deve retornar vazio
```

---

### Grupo 4 — Atualizar `commands/keepass-setup.md`

**Goal:** Wizard detecta OS no início e adapta todas as instruções: instalação de pré-requisitos, armazenamento de senha, teste de conexão.

**Deliverables:** `commands/keepass-setup.md` atualizado com:
- Etapa 0 expandida: detectar OS com `uname -s` e exibir contexto
- Pré-requisitos por OS:
  - macOS: `brew install keepassxc`
  - Linux/WSL: `sudo apt install keepassxc` ou `sudo dnf install keepassxc`
- Verificação de `secret-tool` em Linux: `which secret-tool || sudo apt install libsecret-tools`
- Etapa de armazenamento de senha usando `store_password_instruction` por OS
- Mensagem de conclusão com comandos de teste por OS

**Acceptance criteria:**
- Wizard exibe instruções corretas detectando `Darwin` vs `Linux`
- Instrução de armazenamento de senha muda por OS
- Pré-requisitos incluem `libsecret-tools` para Linux

**Validation:**
```bash
grep -n "detect_os\|uname\|secret-tool\|libsecret" commands/keepass-setup.md
# → deve ter referências em múltiplas etapas
```

---

### Grupo 5 — Documentação: README + CLAUDE.md

**Goal:** Deixar claro para novos usuários os requisitos por plataforma.

**Deliverables:**
- `README.md`: seção de pré-requisitos expandida com tabela por OS; nota sobre WSL obrigatório para Windows
- `CLAUDE.md`: adicionar nota de plataformas suportadas e dependências por OS

**Acceptance criteria:**
- README menciona WSL como requisito para Windows
- README lista `libsecret-tools` como dependência Linux
- Tabela de suporte de plataformas presente

**Validation:**
```bash
grep -n "WSL\|libsecret\|Linux" README.md | wc -l
# → pelo menos 3 linhas
```

---

## Dependencies

Nenhuma dependência externa. Todos os grupos são sequenciais internamente mas os Grupos 2, 3 e 4 podem ser implementados em paralelo após o Grupo 1.

```
Grupo 1 → Grupo 2
        → Grupo 3
        → Grupo 4
        → Grupo 5
```

---

## Assumptions

- `secret-tool` está disponível via `libsecret-tools` (apt) ou `libsecret` (dnf/pacman) nas distribuições Linux mais comuns
- WSL 2 com Ubuntu é o ambiente Windows assumido — outros distros WSL funcionam mas não são testados explicitamente
- `pgrep` está disponível em todas as plataformas alvo (macOS nativo, Linux, WSL)
- keepassxc-cli instalado via gerenciador de pacotes padrão do OS

## Risks

- `secret-tool` requer sessão D-Bus ativa — pode falhar em ambientes headless Linux (CI, containers). Mitigação: documentar limitação, não tratar como bug.
- WSL 1 (não WSL 2) pode ter limitações com D-Bus/libsecret. Mitigação: recomendar WSL 2 na documentação.
