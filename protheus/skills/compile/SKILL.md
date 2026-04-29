---
name: compile
description: Compila fontes ADVPL/TLPP no AppServer Protheus via TDS-CLI (advpls). AÇÃO COM EFEITO COLATERAL — nunca auto-ativa, requer invocação explícita com namespace completo.
disable-model-invocation: true
---

## Visão Geral

A compilação usa o binário `advpls` do pacote `@totvs/tds-ls`. Há dois modos distintos: **Lint local** (`advpls appre arquivo.prw`) sem AppServer, e **Compilação real** (`advpls cli compile.ini`) no RPO.

Use o MCP `protheus-compile` para detalhes: `searchKnowledge({ skill: "protheus-compile", keyword: "modos compilacao" })`

---

## Pré-requisito: binário `advpls`

### Verificar se está disponível

```bash
# Opção 1 — global
advpls --version

# Opção 2 — local no projeto
node -e "console.log(require('@totvs/tds-ls'))"

# Opção 3 — path conhecido por plataforma
# Linux:   node_modules/@totvs/tds-ls/bin/linux/advpls
# Windows: node_modules\@totvs\tds-ls\bin\windows\advpls.exe
# macOS:   node_modules/@totvs/tds-ls/bin/mac/advpls
```

### Instalar se ausente

```bash
# Opção 1 — npm global (recomendado)
npm i -g @totvs/tds-ls

# Opção 2 — npm local no projeto
npm install @totvs/tds-ls --save-dev

# Opção 3 — download direto (portátil, sem instalação)
# https://github.com/totvs/tds-ls/releases
```

---

## Modo 1 — Lint local (`advpls appre`)

Analisa o código **sem AppServer**. Detecta erros de sintaxe e pré-compilação.

```bash
advpls appre /caminho/arquivo.prw
advpls appre /caminho/arquivo.prw -I /caminho/includes/
advpls appre /caminho/arquivo.prw -I /inc1/ -I /inc2/ -D TOP -D MINHA_DEFINE
```

### Opções do appre

| Opção | Descrição |
|-------|-----------|
| `-I <pasta>` | Diretório de includes (repetível) |
| `-D <define>` | Define constante de pré-compilador (repetível) |

### Saída (JSON via stdout)

```json
{
  "msgs": {
    "arquivo.prw": {
      "Mensagem de erro aqui": "0",
      "Aviso aqui": "1"
    }
  }
}
```

- Tipo `"0"` = **Erro** (bloqueia compilação)
- Tipo `!= "0"` = **Aviso** (compilação pode prosseguir)

### Formato das mensagens

As mensagens têm o padrão `arquivo.prw(linha) texto da mensagem`:

```json
{
  "msgs": {
    "MATA010.prw": {
      "MATA010.prw(42) Variable 'cAux' declared but not used": "1",
      "MATA010.prw(10) Error C2090 File not found HEADER.CH": "0"
    }
  }
}
```

### Categorização de severidade

Tipo `"0"` = **Erro** (bloqueia compilação); `!= "0"` = **Aviso** (compilação pode prosseguir).

Use as tools do MCP `protheus-compile`:

- **Padrões de warning e severidade:** `searchKnowledge({ skill: "protheus-compile", keyword: "severidade erros" })`
- **Padrões comuns de warnings:** `searchKnowledge({ skill: "protheus-compile", keyword: "warning patterns" })`
- **Parser de saída (linha e tipo de mensagem):** `searchKnowledge({ skill: "protheus-compile", keyword: "parser saida compilador" })`

---

## Modo 2 — Compilação real (`advpls cli`)

Compila o fonte no RPO do AppServer. **Requer configuração no CLAUDE.md do projeto.**

### Parâmetros necessários (lidos do CLAUDE.md do projeto)

```
PROTHEUS_SERVER=192.168.1.100
PROTHEUS_PORT=5025
PROTHEUS_ENV=P12
PROTHEUS_USER=admin
PROTHEUS_PSW=senha
PROTHEUS_INCLUDES=/opt/protheus/include/
PROTHEUS_AUTH_TOKEN=<token_harpia>  # opcional
```

### Gerar o arquivo compile.ini

O INI **deve** estar em encoding **ANSI (CP1252)**. Gerar via:

```bash
iconv -f UTF-8 -t CP1252 -o "$INI" <<'INIEOF'
# conteúdo do INI aqui
INIEOF
```

> Se os paths não contêm caracteres acentuados, o INI gerado por `cat`/heredoc já é compatível.

#### Templates INI

Consulte os dois templates (com/sem token) via MCP: `searchKnowledge({ skill: "protheus-compile", keyword: "ini template" })`

**Regra:** se `PROTHEUS_AUTH_TOKEN` está definido no CLAUDE.md, usar template COM token (sem `skip`); caso contrário, usar template SEM token (`skip=true`).

> **Includes múltiplos:** separar paths com `;` — ex: `/inc1/;/inc2/;/inc3/`

### Arquivo de lista de fontes

```
# /tmp/protheus-sources.txt — um arquivo por linha
/caminho/absoluto/MATA010.prw
/caminho/absoluto/MATA020.tlpp
```

### Executar, verificar e limpar

```bash
TS=$(date +%s)
INI=/tmp/protheus-compile-${TS}.ini
LST=/tmp/protheus-sources-${TS}.txt
LOG=/tmp/protheus-compile-${TS}.log

# ... gerar $INI e $LST ...

advpls cli "$INI" --log-file "$LOG"
EXIT=$?

# 1. Ler o log ANTES de deletar
if [[ $EXIT -ne 0 && -f "$LOG" ]]; then
  echo "=== LOG DE COMPILAÇÃO (erro) ==="
  cat "$LOG"
  echo "================================"
fi

# 2. Limpar temporários DEPOIS de ler
rm -f "$INI" "$LST" "$LOG"
echo "Exit code: $EXIT"
```

### Detectar resultado

- **Exit code 0** = sucesso
- **Exit code != 0** = falha — o log já foi exibido acima antes da limpeza

---

## Uso do skill

```
/protheus:compile arquivo.prw
/protheus:compile arquivo1.prw arquivo2.tlpp
/protheus:compile --recompile arquivo.prw
/protheus:compile --lint arquivo.prw    # apenas lint local
```

---

## Instruções para Claude

1. **Verificar `advpls`:** checar se o binário existe; se não, orientar instalação com `npm i -g @totvs/tds-ls` ou download direto de https://github.com/totvs/tds-ls/releases
2. **Lint primeiro:** rodar `advpls appre` antes de compilar — se houver erros tipo `"0"`, parar e reportar
3. **Ler CLAUDE.md do projeto** para obter `PROTHEUS_SERVER`, `PROTHEUS_PORT`, `PROTHEUS_ENV`, `PROTHEUS_USER`, `PROTHEUS_PSW`, `PROTHEUS_INCLUDES`, `PROTHEUS_AUTH_TOKEN`
4. **Gerar temporários em `/tmp`** com timestamp único: `compile-<ts>.ini`, `sources-<ts>.txt`, `compile-<ts>.log`
5. **Montar o INI:** se `PROTHEUS_AUTH_TOKEN` está definido, usar template COM token (sem `skip`); caso contrário, usar template SEM token (`skip=true`). **Não incluir `logToFile`** no INI — usar apenas `--log-file` na CLI. Garantir encoding ANSI (CP1252) se paths contêm acentos.
6. **Executar** `advpls cli "$INI" --log-file "$LOG"` e capturar exit code
7. **Sucesso:** confirmar arquivos compilados
8. **Falha:** ler o log (`cat "$LOG"`) e exibir erros com arquivo + linha **ANTES** de deletar
9. **Sempre deletar** os três arquivos temporários ao final — sucesso ou falha, **após** leitura do log

## Tratamento de Erros Comuns

Consulte erros comuns e soluções via MCP: `searchKnowledge({ skill: "protheus-compile", keyword: "troubleshooting" })`

---

## Consulta de Conhecimento

Se precisar de informação não disponível no MCP, consulte o RAG:
```
searchKnowledge({ keyword: "<termo relevante>" })
```
