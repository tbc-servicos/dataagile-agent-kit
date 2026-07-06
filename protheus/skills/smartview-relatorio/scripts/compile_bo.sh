#!/usr/bin/env bash
# Compila um fonte .tlpp no AppServer Protheus RODANDO, via advpls (TDS-LS), sem travar o RPO.
# `appsrvlinux -compile` LOCAL falha ("Failed to open repository") porque o appserver vivo trava o RPO;
# o advpls conecta na porta TCP de build do appserver e compila no RPO da instância em execução.
#
# Uso:   compile_bo.sh <caminho/fonte.tlpp> [environment]
# Ex.:   compile_bo.sh /tmp/VENDASIA.tlpp MEU_ENV_REST
#
# Todos os parametros de ambiente (host, porta, env, credenciais, includes, caminho do
# advpls) vem de variaveis de ambiente — nunca hardcodar credenciais reais em commits.
# Ajuste os valores ao seu AppServer antes de rodar.
set -euo pipefail

SRC="${1:?informe o caminho do .tlpp}"
ENVN="${2:-${SV_APPSERVER_ENV:?defina SV_APPSERVER_ENV (environment do AppServer que serve a REST)}}"

ADV="${ADVPLS:?defina ADVPLS (caminho do binario advpls do TDS-LS)}"
INC="${PROTHEUS_INCLUDES:?defina PROTHEUS_INCLUDES (dir com protheus.ch + totvs.framework.treports.integratedprovider.th)}"
SERVER="${SV_APPSERVER_HOST:?defina SV_APPSERVER_HOST (IP/host do AppServer)}"
PORT="${SV_APPSERVER_BUILD_PORT:-1234}"                      # porta TCP de build do AppServer
PUSER="${SV_PROTHEUS_USER:?defina SV_PROTHEUS_USER}"
PPSW="${SV_PROTHEUS_PSW:?defina SV_PROTHEUS_PSW}"

WORK="$(mktemp -d)"; trap 'rm -rf "$WORK"' EXIT
echo "$SRC" > "$WORK/fontes.txt"
cat > "$WORK/advpls.ini" <<INI
showConsoleOutput=true
logToFile=$WORK/compile.log

[user]
DIRECTORY=$WORK
INCLUDE_DIR=$INC

[authentication]
action=authentication
server=$SERVER
port=$PORT
secure=0
build=AUTO
environment=$ENVN
user=$PUSER
psw=$PPSW

[compile]
action=compile
programList=$WORK/fontes.txt
recompile=T
includes=\${INCLUDE_DIR}
INI

echo ">> compilando $SRC no env $ENVN ($SERVER:$PORT) ..."
"$ADV" --log-all-to-stderr cli "$WORK/advpls.ini" 2>&1 | grep -iE "error|success|compil|fail|authenticat" || true

echo
echo ">> Próximos passos (manuais, ver references/recipe.md):"
echo "   1) reiniciar o AppServer (registra o IntegratedProvider; aguardar a REST voltar: /<namespace>/ping=401)"
echo "   2) confirmar discovery: GET /api/connectors/business-objects?q=<nome>"
echo "   3) (apenas Report PDF) instalar libfontconfig1+libfreetype6 no smartview-agent e reiniciá-lo"
