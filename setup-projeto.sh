#!/bin/bash
# setup-projeto.sh — Instala plugins Claude Code TBC no projeto atual
# Uso: ./setup-projeto.sh (executar na raiz do projeto cliente)

set -e
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

ok()   { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
err()  { echo -e "${RED}❌ $1${NC}"; }
info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

MARKETPLACE="https://github.com/tbc-servicos/tbc-knowledge-plugins.git"
MARKETPLACE_NAME="claude-skills-tbc"

echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Claude Code Plugins TBC — Setup${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# 1. Verificar claude CLI
if ! command -v claude &> /dev/null; then
    err "Claude Code não encontrado."
    echo "  Instale com: npm install -g @anthropic-ai/claude-code"
    exit 1
fi
ok "Claude Code: $(claude --version 2>/dev/null | head -1)"

# 2. Repo público no GitHub — sem necessidade de SSH/credenciais

# 3. Adicionar marketplace (idempotente)
echo ""
info "Registrando marketplace $MARKETPLACE_NAME..."
claude plugin marketplace add "$MARKETPLACE" 2>/dev/null \
    && ok "Marketplace registrado" \
    || info "Marketplace já registrado (ok)"

# 4. Selecionar plugin
echo ""
echo "Qual plugin instalar?"
echo "  1) fluig       — Widgets Angular 19, Datasets, Formulários, Workflows BPM"
echo "  2) protheus    — ADVPL/TLPP, Compilação TDS-CLI, Testes TIR"
echo "  3) confluence  — Confluence Cloud API, extração MIT010/MIT072, PDF images"
echo "  4) todos"
echo ""
read -p "Escolha [1/2/3/4]: " CHOICE

case $CHOICE in
    1) PLUGINS=("fluig") ;;
    2) PLUGINS=("protheus") ;;
    3) PLUGINS=("confluence") ;;
    4) PLUGINS=("fluig" "protheus" "confluence") ;;
    *) err "Opção inválida"; exit 1 ;;
esac

# 5. Instalar plugins
echo ""
for PLUGIN in "${PLUGINS[@]}"; do
    info "Instalando $PLUGIN@$MARKETPLACE_NAME..."
    claude plugin install "$PLUGIN@$MARKETPLACE_NAME"
    ok "$PLUGIN instalado!"
done

# 6. Próximos passos
echo ""
ok "Setup concluído!"
echo ""
info "Inicialize o projeto (gera CLAUDE.md do cliente):"
for PLUGIN in "${PLUGINS[@]}"; do
    echo "  claude  →  /${PLUGIN}:${PLUGIN}-init-project"
done
echo ""
info "Para atualizar no futuro:"
for PLUGIN in "${PLUGINS[@]}"; do
    echo "  claude plugin update $PLUGIN@$MARKETPLACE_NAME"
done
echo ""
