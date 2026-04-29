#!/usr/bin/env bash
# Cross-platform helper functions for KeePass Skill
# Source this file in other skill scripts to get OS abstraction.

# Detecta o OS atual → retorna "macos" ou "linux"
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
  if command -v keepassxc-cli &>/dev/null; then
    command -v keepassxc-cli
    return
  fi
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
  echo ""
}

# Verifica se KeePassXC desktop está em execução (exit 0 = rodando, 1 = não)
check_desktop_running() {
  pgrep -x "KeePassXC" > /dev/null 2>&1
}

# Imprime o comando para armazenar senha no secret store do OS
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
