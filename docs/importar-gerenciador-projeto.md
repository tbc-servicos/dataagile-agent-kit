# Importar Gerenciador de Projetos Protheus

Documentacao da skill `/protheus:importar-gerenciador-projeto` e do endpoint REST `POST /api/v1/projetos/importar` (UTBCA012).

## Visao Geral

O **Gerenciador de Projetos** do Protheus permite importar dicionario de dados (tabelas, campos, indices, parametros, gatilhos, pastas, consultas e grupos) via API REST. O fonte responsavel e o `UTBCA012.tlpp`, que ja deve estar compilado no AppServer do ambiente destino.

A skill do Claude Code conduz uma **entrevista guiada** com o desenvolvedor, coleta as informacoes necessarias e gera o arquivo JSON no formato exato esperado pelo endpoint. Opcionalmente, executa a chamada REST ao ambiente destino.

### Quando usar

- Criacao de tabelas customizadas (SZx, ZZx, etc.)
- Inclusao de campos em tabelas existentes
- Definicao de indices, parametros de sistema e gatilhos
- Migracao de dicionario entre ambientes (dev -> QA -> producao)
- Reimportacao de projeto com `lRefazProjeto: true`
- Atualizacao incremental de projeto existente com `lIncrementar: true` (upsert)

### O que a skill NAO faz

- Nao gera codigo ADVPL/TLPP
- Nao modifica o dicionario diretamente no banco
- Nao cria o endpoint — ele ja deve existir no servidor

---

## Endpoint REST

```
POST http://<servidor>:<porta>/rest/api/v1/projetos/importar
```

### Headers obrigatorios

| Header | Valor | Exemplo |
|--------|-------|---------|
| `Authorization` | `Basic <base64(usuario:senha)>` | `Basic YWRtaW46MTIzNA==` |
| `tenantId` | `<empresa>,<filial>` | `01,01` |
| `Content-Type` | `application/json` | `application/json` |

### Codigos de resposta

| Codigo | Significado | Acao |
|--------|-------------|------|
| `200` | Importado com sucesso | No modo incremental, inclui `nRegistrosNovos` e `nRegistrosAtualizados` |
| `400` | JSON invalido ou campos obrigatorios ausentes | Verificar payload |
| `401` | Credenciais invalidas | Verificar usuario/senha e base64 |
| `409` | Projeto ja existe | Enviar `lRefazProjeto: true` para reimportar ou `lIncrementar: true` para upsert |
| `500` | Erro interno no servidor | Verificar logs do AppServer |

---

## Estrutura do Payload JSON

### Campos raiz

```json
{
  "cProjeto": "000023",
  "cDescricao": "Meu Projeto Customizado",
  "lRefazProjeto": false,
  "lIncrementar": false,
  "SX2": [],
  "SX3": [],
  "SIX": [],
  "SX6": [],
  "SX7": [],
  "SXA": [],
  "SXB": [],
  "SXG": [],
  "SX1": []
}
```

| Campo | Tipo | Obrigatorio | Restricao | Descricao |
|-------|------|-------------|-----------|-----------|
| `cProjeto` | string | SIM | max 6 chars | Codigo unico do projeto |
| `cDescricao` | string | SIM | max 50 chars | Descricao do projeto |
| `lRefazProjeto` | boolean | NAO | default: false | Limpa e reimporta projeto existente |
| `lIncrementar` | boolean | NAO | default: false | Modo incremental: insere novos e atualiza existentes (upsert) |
| `SX2` | array | NAO | — | Tabelas/arquivos |
| `SX3` | array | NAO | — | Campos |
| `SIX` | array | NAO | — | Indices |
| `SX6` | array | NAO | — | Parametros do sistema |
| `SX7` | array | NAO | — | Gatilhos/triggers |
| `SXA` | array | NAO | — | Pastas e agrupamentos |
| `SXB` | array | NAO | — | Consultas padrao |
| `SXG` | array | NAO | — | Grupos de campo |
| `SX1` | array | NAO | — | Perguntas/parametros de menu |

---

## Schemas Detalhados

### SX2 — Tabelas/Arquivos

Define as tabelas do dicionario de dados.

> **Importante:** `X2_ARQUIVO` recebe apenas ate **5 caracteres uteis**. O servidor concatena o sufixo da empresa (3 chars) automaticamente. Ex: `"SZZ"` vira `"SZZ010"` no banco.

```json
{
  "X2_CHAVE": "SZZ",
  "X2_PATH": "",
  "X2_ARQUIVO": "SZZ",
  "X2_NOME": "Cadastro Customizado",
  "X2_NOMESPA": "Registro Personalizado",
  "X2_NOMEENG": "Custom Register",
  "X2_ROTINA": "",
  "X2_MODO": "C",
  "X2_MODOUN": "C",
  "X2_MODOEMP": "C",
  "X2_DELET": "0",
  "X2_TTS": "",
  "X2_UNICO": "ZZ_FILIAL+ZZ_COD",
  "X2_PYME": "",
  "X2_MODULO": "",
  "X2_DISPLAY": "",
  "X2_SYSOBJ": "",
  "X2_USROBJ": "",
  "X2_POSLGT": "",
  "X2_CLOB": "",
  "X2_AUTREC": "",
  "X2_TAMFIL": "0",
  "X2_TAMUN": "0",
  "X2_TAMEMP": "0"
}
```

**Campos-chave:**

| Campo | Descricao | Valores |
|-------|-----------|---------|
| `X2_CHAVE` | Chave da tabela (alias) | Ex: `"SZZ"` |
| `X2_ARQUIVO` | Alias fisico (max 5 chars) | Ex: `"SZZ"` |
| `X2_NOME` | Nome em portugues | Max 40 chars |
| `X2_NOMESPA` | Nome em espanhol | Max 40 chars |
| `X2_NOMEENG` | Nome em ingles | Max 40 chars |
| `X2_MODO` | Modo de compartilhamento | `C`=compartilhado, `E`=exclusivo empresa, `U`=exclusivo filial |
| `X2_UNICO` | Chave unica (campos separados por `+`) | Ex: `"ZZ_FILIAL+ZZ_COD"` |

---

### SX3 — Campos

Define os campos de cada tabela.

#### Restricoes de tamanho (confirmadas em producao)

| Campo | Limite | Observacao |
|-------|--------|-----------|
| `X3_TITULO` / `X3_TITSPA` / `X3_TITENG` | max **12 chars** | Titulo do campo |
| `X3_DESCRIC` / `X3_DESCSPA` / `X3_DESCENG` | max **20 chars, apenas ASCII** | Sem acentos, sem c-cedilha |
| `X3_PICTURE` | max **20 chars** | Mascara de exibicao |

#### Valores padrao recomendados

Estes valores devem ser aplicados a **todos** os campos SX3, salvo necessidade especifica:

| Campo | Valor padrao | Significado |
|-------|-------------|-------------|
| `X3_USADO` | `"x       x       x       x       x       x       x       x       x       x       x       x       x       x       x x     "` | Visivel em todos os modulos |
| `X3_RESERV` | `"xxxxxx x        "` | Bitmap de reserva padrao |
| `X3_BROWSE` | `"S"` | Aparece no browse |
| `X3_VISUAL` | `"A"` | Alteravel |
| `X3_CONTEXT` | `"R"` | Contexto real |
| `X3_IDXFLD` | `"N"` | Nao indexado |
| `X3_PROPRI` | `"U"` | Propriedade usuario |

#### Tipos de campo (`X3_TIPO`)

| Tipo | Descricao |
|------|-----------|
| `C` | Caracter |
| `N` | Numerico |
| `D` | Data |
| `L` | Logico |
| `M` | Memo |

#### Schema completo

```json
{
  "X3_ARQUIVO": "SZZ",
  "X3_ORDEM": "01",
  "X3_CAMPO": "ZZ_FILIAL",
  "X3_TIPO": "C",
  "X3_TAMANHO": "8",
  "X3_DECIMAL": "0",
  "X3_TITULO": "Filial",
  "X3_TITSPA": "Sucursal",
  "X3_TITENG": "Branch",
  "X3_DESCRIC": "Filial",
  "X3_DESCSPA": "Sucursal",
  "X3_DESCENG": "Branch",
  "X3_PICTURE": "",
  "X3_VALID": "",
  "X3_USADO": "x       x       x       x       x       x       x       x       x       x       x       x       x       x       x x     ",
  "X3_RELACAO": "",
  "X3_F3": "",
  "X3_NIVEL": "",
  "X3_RESERV": "xxxxxx x        ",
  "X3_CHECK": "",
  "X3_TRIGGER": "",
  "X3_PROPRI": "U",
  "X3_BROWSE": "S",
  "X3_VISUAL": "A",
  "X3_CONTEXT": "R",
  "X3_OBRIGAT": "",
  "X3_VLDUSER": "",
  "X3_CBOX": "",
  "X3_CBOXSPA": "",
  "X3_CBOXENG": "",
  "X3_PICTVAR": "",
  "X3_WHEN": "",
  "X3_INIBRW": "",
  "X3_GRPSXG": "",
  "X3_FOLDER": "",
  "X3_PYME": "",
  "X3_CONDSQL": "",
  "X3_CHKSQL": "",
  "X3_IDXSRV": "",
  "X3_ORTOGRA": "",
  "X3_IDXFLD": "N",
  "X3_TELA": "",
  "X3_AGRUP": "",
  "X3_POSLGT": "",
  "X3_MODAL": ""
}
```

#### Notas importantes

- **`X3_ORDEM` e ignorado pelo servidor** — ele auto-calcula a proxima ordem disponivel por tabela. Pode informar qualquer valor.
- **Nao incluir campos de controle:** `PR_E_C_N_O`, `PF_L_A_G`, `PM_0_E_M_P`, `ID_PACKAGE`, `D_E_L_E_T_`, `R_E_C_N_O_`, `R_E_C_D_E_L_` — sao inseridos automaticamente.
- **`X3_CBOX`** para combos: formato `"S=Sim;N=Nao"` (opcoes separadas por `;`).
- **`X3_F3`** para consulta padrao: alias da consulta SXB.
- **`X3_OBRIGAT`** para campo obrigatorio: usar `"S"`.

---

### SIX — Indices

Define os indices das tabelas.

```json
{
  "INDICE": "SZZ",
  "ORDEM": "1",
  "CHAVE": "ZZ_FILIAL+ZZ_COD",
  "DESCRICAO": "Filial+Codigo",
  "DESCSPA": "Sucursal+Codigo",
  "DESCENG": "Branch+Code",
  "PROPRI": "U",
  "F3": "",
  "NICKNAME": "SZZ_FILCOD",
  "SHOWPESQ": "S",
  "IX_VIRTUAL": "",
  "IX_VIRCUST": ""
}
```

| Campo | Descricao |
|-------|-----------|
| `INDICE` | Alias da tabela |
| `ORDEM` | Numero sequencial do indice (`"1"`, `"2"`, etc.) |
| `CHAVE` | Campos separados por `+` |
| `DESCRICAO` | Descricao em portugues |
| `NICKNAME` | Apelido unico do indice |
| `SHOWPESQ` | Exibir na pesquisa: `"S"` ou `"N"` |

---

### SX6 — Parametros do Sistema

```json
{
  "X6_FIL": "  ",
  "X6_VAR": "MV_XPARAM1",
  "X6_TIPO": "C",
  "X6_DESCRIC": "Parametro customizado",
  "X6_DSCSPA": "Parametro personalizado",
  "X6_DSCENG": "Custom parameter",
  "X6_DESC1": "Descricao detalhada do",
  "X6_DSCSPA1": "Descripcion detallada",
  "X6_DSCENG1": "Detailed description",
  "X6_DESC2": "parametro",
  "X6_DSCSPA2": "del parametro",
  "X6_DSCENG2": "of parameter",
  "X6_CONTEUD": "VALOR_PADRAO",
  "X6_CONTSPA": "VALOR_PADRAO",
  "X6_CONTENG": "DEFAULT_VALUE",
  "X6_PROPRI": "U",
  "X6_VALID": "",
  "X6_INIT": "",
  "X6_DEFPOR": "",
  "X6_DEFSPA": "",
  "X6_DEFENG": "",
  "X6_PYME": ""
}
```

| Campo | Descricao |
|-------|-----------|
| `X6_FIL` | Filial (`"  "` = todas) |
| `X6_VAR` | Nome do parametro (convencao: `MV_X...`) |
| `X6_TIPO` | Tipo: `C`, `N`, `D`, `L` |
| `X6_CONTEUD` | Conteudo/valor padrao |

---

### SX7 — Gatilhos/Triggers

```json
{
  "X7_CAMPO": "ZZ_CEP",
  "X7_SEQUENC": "001",
  "X7_REGRA": "ExecAutoFunc('A1_END')",
  "X7_CDOMIN": "ZZ_ENDER",
  "X7_TIPO": "P",
  "X7_SEEK": "",
  "X7_ALIAS": "",
  "X7_ORDEM": "",
  "X7_CHAVE": "",
  "X7_CONDIC": "",
  "X7_PROPRI": "U"
}
```

| Campo | Descricao |
|-------|-----------|
| `X7_CAMPO` | Campo de origem (que dispara o gatilho) |
| `X7_SEQUENC` | Sequencia (para multiplos gatilhos no mesmo campo) |
| `X7_REGRA` | Expressao ADVPL a executar |
| `X7_CDOMIN` | Campo de destino (que recebe o resultado) |
| `X7_TIPO` | `P`=primario, `E`=estrangeiro |

---

### SXA — Pastas e Agrupamentos

```json
{
  "XA_ALIAS": "SZZ",
  "XA_ORDEM": "01",
  "XA_DESCRIC": "Dados Gerais",
  "XA_DESCSPA": "Datos Generales",
  "XA_DESCENG": "General Data",
  "XA_PROPRI": "U",
  "XA_AGRUP": "",
  "XA_TIPO": ""
}
```

---

### SXB — Consultas Padrao

```json
{
  "XB_ALIAS": "SZZ",
  "XB_TIPO": "1",
  "XB_SEQ": "01",
  "XB_COLUNA": "DB",
  "XB_DESCRI": "Codigo",
  "XB_DESCSPA": "Codigo",
  "XB_DESCENG": "Code",
  "XB_CONTEM": "ZZ_COD",
  "XB_WCONTEM": ""
}
```

---

### SXG — Grupos de Campo

```json
{
  "XG_GRUPO": "001",
  "XG_DESCRI": "Codigo",
  "XG_DESSPA": "Codigo",
  "XG_DESENG": "Code",
  "XG_SIZEMAX": "6",
  "XG_SIZEMIN": "6",
  "XG_SIZE": "6",
  "XG_PICTURE": "@!",
  "XG_CHECK1": "",
  "XG_CHECK2": ""
}
```

---

### SX1 — Perguntas/Parametros de Menu

```json
{
  "X1_GRUPO": "XREPORT",
  "X1_ORDEM": "01",
  "X1_PERGUNT": "Da filial?",
  "X1_PERSPA": "De la sucursal?",
  "X1_PERENG": "From branch?",
  "X1_VARIAVL": "MV_PAR01",
  "X1_TIPO": "C",
  "X1_TAMANHO": "6",
  "X1_DECIMAL": "0",
  "X1_PRESEL": "1",
  "X1_GSC": "G",
  "X1_VALID": "",
  "X1_VAR01": "", "X1_DEF01": "", "X1_DEFSPA1": "", "X1_DEFENG1": "", "X1_CNT01": "",
  "X1_VAR02": "", "X1_DEF02": "", "X1_DEFSPA2": "", "X1_DEFENG2": "", "X1_CNT02": "",
  "X1_VAR03": "", "X1_DEF03": "", "X1_DEFSPA3": "", "X1_DEFENG3": "", "X1_CNT03": "",
  "X1_VAR04": "", "X1_DEF04": "", "X1_DEFSPA4": "", "X1_DEFENG4": "", "X1_CNT04": "",
  "X1_VAR05": "", "X1_DEF05": "", "X1_DEFSPA5": "", "X1_DEFENG5": "", "X1_CNT05": "",
  "X1_F3": "",
  "X1_PYME": "",
  "X1_GRPSXG": "",
  "X1_PICTURE": "",
  "X1_IDFIL": ""
}
```

---

## Como Usar a Skill

### Via Claude Code

```
/protheus:importar-gerenciador-projeto
```

O Claude ira conduzir uma entrevista em etapas:

1. **Identificacao do projeto** — codigo, descricao, modo (criar / reimportar / incremental)
2. **Origem dos dados** — especificacao pronta (planilha, Word, texto) ou manual
3. **Tabelas (SX2)** — alias, nome triligue, modo de compartilhamento
4. **Campos (SX3)** — campo, tipo, tamanho, titulo, descricao, picture, obrigatoriedade
5. **Indices (SIX)** — tabela, campos-chave, descricao
6. **Opcionais** — parametros SX6, gatilhos SX7, pastas SXA, grupos SXG, consultas SXB
7. **Execucao** — gerar apenas o JSON ou tambem chamar o endpoint

### Arquivo gerado

O JSON e salvo com nome descritivo: `importar_<cProjeto>_<descricao>.json`

### Executar manualmente via cURL

```bash
# Gerar base64 da autenticacao
echo -n "admin:1234" | base64
# Resultado: YWRtaW46MTIzNA==

# Chamar o endpoint
curl -X POST 'http://servidor:8080/rest/api/v1/projetos/importar' \
  --header 'tenantId: 01,01' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Basic YWRtaW46MTIzNA==' \
  --data @importar_000023_meu_projeto.json
```

### Executar via Claude Code

```
! curl -X POST 'http://servidor:8080/rest/api/v1/projetos/importar' \
  --header 'tenantId: 01,01' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Basic YWRtaW46MTIzNA==' \
  --data @importar_000023_meu_projeto.json
```

---

## Modo Incremental

O modo incremental (`lIncrementar: true`) permite **adicionar ou atualizar registros** em um projeto existente sem precisar reimportar tudo do zero.

### Precedencia de modos

Quando o projeto ja existe no ambiente destino:

| Prioridade | Condicao | Comportamento |
|------------|----------|---------------|
| 1 (maior) | `lRefazProjeto: true` | Limpa tudo e reimporta do zero |
| 2 | `lIncrementar: true` | Upsert: insere novos, atualiza existentes |
| 3 (menor) | Nenhum | Retorna `409 Conflict` |

### Como funciona o upsert

Para cada registro no JSON:
1. O servidor identifica a **chave unica** do registro (ex: `X3_ARQUIVO + X3_CAMPO` para SX3)
2. Se o registro ja existe no projeto → **delete + insert** (atualiza)
3. Se o registro nao existe → **insert** (novo)

### Preservacao de X3_ORDEM

No modo incremental, o `X3_ORDEM` de campos SX3 **existentes** e preservado automaticamente pelo servidor. Campos novos recebem a proxima ordem disponivel. Voce nao precisa se preocupar com a ordenacao.

### Versao do PACKAGE

A cada importacao incremental, o servidor incrementa automaticamente `PCK_VERSAO` (via `Soma1()`) e atualiza data/hora da ultima modificacao.

### Resposta no modo incremental

```json
{
  "lSucesso": true,
  "cMensagem": "Projeto atualizado incrementalmente com sucesso.",
  "nRegistros": 5,
  "nRegistrosNovos": 3,
  "nRegistrosAtualizados": 2
}
```

### Exemplo de payload incremental

Adicionar 1 campo novo a um projeto existente:

```json
{
  "cProjeto": "000023",
  "cDescricao": "Cadastro Customizado TBC",
  "lIncrementar": true,
  "SX3": [
    {
      "X3_ARQUIVO": "SZZ",
      "X3_ORDEM": "04",
      "X3_CAMPO": "ZZ_STATUS",
      "X3_TIPO": "C",
      "X3_TAMANHO": "1",
      "X3_DECIMAL": "0",
      "X3_TITULO": "Status",
      "X3_TITSPA": "Estado",
      "X3_TITENG": "Status",
      "X3_DESCRIC": "Status do Registro",
      "X3_DESCSPA": "Estado del Registro",
      "X3_DESCENG": "Record Status",
      "X3_PICTURE": "@!",
      "X3_VALID": "",
      "X3_USADO": "x       x       x       x       x       x       x       x       x       x       x       x       x       x       x x     ",
      "X3_RELACAO": "",
      "X3_F3": "",
      "X3_NIVEL": "",
      "X3_RESERV": "xxxxxx x        ",
      "X3_CHECK": "",
      "X3_TRIGGER": "",
      "X3_PROPRI": "U",
      "X3_BROWSE": "S",
      "X3_VISUAL": "A",
      "X3_CONTEXT": "R",
      "X3_OBRIGAT": "",
      "X3_VLDUSER": "",
      "X3_CBOX": "A=Ativo;I=Inativo",
      "X3_CBOXSPA": "A=Activo;I=Inactivo",
      "X3_CBOXENG": "A=Active;I=Inactive",
      "X3_PICTVAR": "",
      "X3_WHEN": "",
      "X3_INIBRW": "",
      "X3_GRPSXG": "",
      "X3_FOLDER": "",
      "X3_PYME": "",
      "X3_CONDSQL": "",
      "X3_CHKSQL": "",
      "X3_IDXSRV": "",
      "X3_ORTOGRA": "",
      "X3_IDXFLD": "N",
      "X3_TELA": "",
      "X3_AGRUP": "",
      "X3_POSLGT": "",
      "X3_MODAL": ""
    }
  ]
}
```

> **Nota:** No modo incremental, voce pode enviar apenas os arrays que contem alteracoes. Nao precisa enviar SX2, SIX, etc. vazios.

---

## Exemplo Completo

Payload minimo para criar uma tabela `SZZ` com 3 campos e 1 indice:

```json
{
  "cProjeto": "000023",
  "cDescricao": "Cadastro Customizado TBC",
  "lRefazProjeto": false,
  "SX2": [
    {
      "X2_CHAVE": "SZZ",
      "X2_PATH": "",
      "X2_ARQUIVO": "SZZ",
      "X2_NOME": "Cadastro Customizado",
      "X2_NOMESPA": "Registro Personalizado",
      "X2_NOMEENG": "Custom Register",
      "X2_ROTINA": "",
      "X2_MODO": "C",
      "X2_MODOUN": "C",
      "X2_MODOEMP": "C",
      "X2_DELET": "0",
      "X2_TTS": "",
      "X2_UNICO": "ZZ_FILIAL+ZZ_COD",
      "X2_PYME": "",
      "X2_MODULO": "",
      "X2_DISPLAY": "",
      "X2_SYSOBJ": "",
      "X2_USROBJ": "",
      "X2_POSLGT": "",
      "X2_CLOB": "",
      "X2_AUTREC": "",
      "X2_TAMFIL": "0",
      "X2_TAMUN": "0",
      "X2_TAMEMP": "0"
    }
  ],
  "SX3": [
    {
      "X3_ARQUIVO": "SZZ",
      "X3_ORDEM": "01",
      "X3_CAMPO": "ZZ_FILIAL",
      "X3_TIPO": "C",
      "X3_TAMANHO": "8",
      "X3_DECIMAL": "0",
      "X3_TITULO": "Filial",
      "X3_TITSPA": "Sucursal",
      "X3_TITENG": "Branch",
      "X3_DESCRIC": "Filial",
      "X3_DESCSPA": "Sucursal",
      "X3_DESCENG": "Branch",
      "X3_PICTURE": "",
      "X3_VALID": "",
      "X3_USADO": "x       x       x       x       x       x       x       x       x       x       x       x       x       x       x x     ",
      "X3_RELACAO": "",
      "X3_F3": "",
      "X3_NIVEL": "",
      "X3_RESERV": "xxxxxx x        ",
      "X3_CHECK": "",
      "X3_TRIGGER": "",
      "X3_PROPRI": "U",
      "X3_BROWSE": "S",
      "X3_VISUAL": "V",
      "X3_CONTEXT": "R",
      "X3_OBRIGAT": "",
      "X3_VLDUSER": "",
      "X3_CBOX": "",
      "X3_CBOXSPA": "",
      "X3_CBOXENG": "",
      "X3_PICTVAR": "",
      "X3_WHEN": "",
      "X3_INIBRW": "",
      "X3_GRPSXG": "",
      "X3_FOLDER": "",
      "X3_PYME": "",
      "X3_CONDSQL": "",
      "X3_CHKSQL": "",
      "X3_IDXSRV": "",
      "X3_ORTOGRA": "",
      "X3_IDXFLD": "N",
      "X3_TELA": "",
      "X3_AGRUP": "",
      "X3_POSLGT": "",
      "X3_MODAL": ""
    },
    {
      "X3_ARQUIVO": "SZZ",
      "X3_ORDEM": "02",
      "X3_CAMPO": "ZZ_COD",
      "X3_TIPO": "C",
      "X3_TAMANHO": "6",
      "X3_DECIMAL": "0",
      "X3_TITULO": "Codigo",
      "X3_TITSPA": "Codigo",
      "X3_TITENG": "Code",
      "X3_DESCRIC": "Codigo do Registro",
      "X3_DESCSPA": "Codigo del Registro",
      "X3_DESCENG": "Record Code",
      "X3_PICTURE": "@!",
      "X3_VALID": "",
      "X3_USADO": "x       x       x       x       x       x       x       x       x       x       x       x       x       x       x x     ",
      "X3_RELACAO": "",
      "X3_F3": "",
      "X3_NIVEL": "",
      "X3_RESERV": "xxxxxx x        ",
      "X3_CHECK": "",
      "X3_TRIGGER": "",
      "X3_PROPRI": "U",
      "X3_BROWSE": "S",
      "X3_VISUAL": "A",
      "X3_CONTEXT": "R",
      "X3_OBRIGAT": "S",
      "X3_VLDUSER": "",
      "X3_CBOX": "",
      "X3_CBOXSPA": "",
      "X3_CBOXENG": "",
      "X3_PICTVAR": "",
      "X3_WHEN": "",
      "X3_INIBRW": "",
      "X3_GRPSXG": "",
      "X3_FOLDER": "",
      "X3_PYME": "",
      "X3_CONDSQL": "",
      "X3_CHKSQL": "",
      "X3_IDXSRV": "",
      "X3_ORTOGRA": "",
      "X3_IDXFLD": "N",
      "X3_TELA": "",
      "X3_AGRUP": "",
      "X3_POSLGT": "",
      "X3_MODAL": ""
    },
    {
      "X3_ARQUIVO": "SZZ",
      "X3_ORDEM": "03",
      "X3_CAMPO": "ZZ_DESC",
      "X3_TIPO": "C",
      "X3_TAMANHO": "50",
      "X3_DECIMAL": "0",
      "X3_TITULO": "Descricao",
      "X3_TITSPA": "Descripcion",
      "X3_TITENG": "Description",
      "X3_DESCRIC": "Descricao",
      "X3_DESCSPA": "Descripcion",
      "X3_DESCENG": "Description",
      "X3_PICTURE": "@!",
      "X3_VALID": "",
      "X3_USADO": "x       x       x       x       x       x       x       x       x       x       x       x       x       x       x x     ",
      "X3_RELACAO": "",
      "X3_F3": "",
      "X3_NIVEL": "",
      "X3_RESERV": "xxxxxx x        ",
      "X3_CHECK": "",
      "X3_TRIGGER": "",
      "X3_PROPRI": "U",
      "X3_BROWSE": "S",
      "X3_VISUAL": "A",
      "X3_CONTEXT": "R",
      "X3_OBRIGAT": "",
      "X3_VLDUSER": "",
      "X3_CBOX": "",
      "X3_CBOXSPA": "",
      "X3_CBOXENG": "",
      "X3_PICTVAR": "",
      "X3_WHEN": "",
      "X3_INIBRW": "",
      "X3_GRPSXG": "",
      "X3_FOLDER": "",
      "X3_PYME": "",
      "X3_CONDSQL": "",
      "X3_CHKSQL": "",
      "X3_IDXSRV": "",
      "X3_ORTOGRA": "",
      "X3_IDXFLD": "N",
      "X3_TELA": "",
      "X3_AGRUP": "",
      "X3_POSLGT": "",
      "X3_MODAL": ""
    }
  ],
  "SIX": [
    {
      "INDICE": "SZZ",
      "ORDEM": "1",
      "CHAVE": "ZZ_FILIAL+ZZ_COD",
      "DESCRICAO": "Filial+Codigo",
      "DESCSPA": "Sucursal+Codigo",
      "DESCENG": "Branch+Code",
      "PROPRI": "U",
      "F3": "",
      "NICKNAME": "SZZ_FILCOD",
      "SHOWPESQ": "S",
      "IX_VIRTUAL": "",
      "IX_VIRCUST": ""
    }
  ]
}
```

---

## Troubleshooting

| Problema | Causa provavel | Solucao |
|----------|---------------|---------|
| `401 Unauthorized` | Credenciais invalidas | Verificar usuario/senha e encoding base64 |
| `409 Conflict` | Projeto ja existe | Usar `lRefazProjeto: true` para reimportar ou `lIncrementar: true` para upsert |
| `400 Bad Request` | JSON mal formatado | Validar JSON (campos obrigatorios `cProjeto` e `cDescricao`) |
| `500 Internal Error` | Erro no AppServer | Verificar logs do AppServer; confirmar que UTBCA012 esta compilado |
| Campo com acento no SX3 | `X3_DESCRIC` aceita apenas ASCII | Remover acentos e caracteres especiais |
| Titulo truncado | `X3_TITULO` > 12 chars | Abreviar para max 12 caracteres |
| Tabela nao criada | `X2_ARQUIVO` > 5 chars | Usar max 5 chars (servidor adiciona sufixo empresa) |

---

## Referencia

- **Fonte servidor:** `UTBCA012.tlpp` (compilado no AppServer)
- **Skill Claude Code:** `/protheus:importar-gerenciador-projeto`
- **Exemplo de referencia:** `importar_crm2.json` (projeto CRM Fujioka — 51 campos SX3, 1 SX2, 1 SIX)
- **Plugin:** `protheus@claude-skills-tbc` v2.0.7+
