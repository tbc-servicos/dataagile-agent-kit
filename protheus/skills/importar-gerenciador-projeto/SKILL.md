---
name: importar-gerenciador-projeto
description: >
  Monta o payload JSON para importação de projetos/dicionário TOTVS via endpoint
  POST /api/v1/projetos/importar (UTBCA012). Entrevista o desenvolvedor sobre
  as tabelas, campos e índices necessários, gera o JSON no formato exato esperado
  pelo endpoint e, opcionalmente, executa a chamada REST ao ambiente destino.
---

# Skill: importar-gerenciador-projeto

## Objetivo

O fonte `UTBCA012.tlpp` já está compilado no servidor Protheus do cliente e expõe o endpoint `POST /api/v1/projetos/importar`. Sua única responsabilidade aqui é **montar o arquivo JSON de payload** que esse endpoint espera, e opcionalmente **chamar o endpoint** para incluir os dados no sistema.

Não gere código ADVPL/TLPP. O produto desta skill é sempre um arquivo `.json`.

---

## Endpoint e Autenticação

```
POST http://<servidor>:<porta>/rest/api/v1/projetos/importar
```

**Headers obrigatórios:**
- `Authorization: Basic <base64(usuario:senha)>`
- `tenantId: <empresa>,<filial>` — ex: `01,01`
- `Content-Type: application/json`

**Campos raiz do payload:**

| Campo | Tipo | Obrigatório | Restrição | Descrição |
|-------|------|-------------|-----------|-----------|
| `cProjeto` | string | SIM | ≤ 6 chars | Código único do projeto |
| `cDescricao` | string | SIM | ≤ 50 chars | Descrição do projeto |
| `lRefazProjeto` | boolean | NÃO | default: false | Se true, limpa e reimporta projeto existente |
| `lIncrementar` | boolean | NÃO | default: false | Se true, modo incremental: insere novos registros e atualiza existentes (upsert) |
| `SX2` | array | NÃO | — | Tabelas/arquivos do dicionário |
| `SX3` | array | NÃO | — | Campos do dicionário |
| `SIX` | array | NÃO | — | Índices |
| `SX6` | array | NÃO | — | Parâmetros do sistema |
| `SX7` | array | NÃO | — | Gatilhos/triggers |
| `SXA` | array | NÃO | — | Pastas e agrupamentos |
| `SXB` | array | NÃO | — | Consultas padrão |
| `SXG` | array | NÃO | — | Grupos de campo |
| `SX1` | array | NÃO | — | Perguntas/parâmetros de menu |

**Precedência de modos** (quando o projeto já existe):
1. `lRefazProjeto: true` → limpa tudo e reimporta do zero
2. `lIncrementar: true` → upsert: insere novos, atualiza existentes
3. Nenhum → retorna 409 Conflict

**Respostas possíveis:**
- `200` — importado com sucesso (inclui `nRegistrosNovos` e `nRegistrosAtualizados` no modo incremental)
- `400` — JSON inválido ou campos obrigatórios ausentes
- `401` — credenciais inválidas
- `409` — projeto já existe (enviar `lRefazProjeto: true` para reimportar ou `lIncrementar: true` para atualização incremental)
- `500` — erro interno no servidor

---

## Schemas por Tabela

### SX2 — Tabelas/Arquivos

> `X2_ARQUIVO` recebe **apenas até 5 chars úteis** — o servidor concatena o sufixo da empresa (3 chars) automaticamente. Ex: `"SZZ"` vira `"SZZ010"` no banco.

```json
{
  "X2_CHAVE": "",
  "X2_PATH": "",
  "X2_ARQUIVO": "",
  "X2_NOME": "",
  "X2_NOMESPA": "",
  "X2_NOMEENG": "",
  "X2_ROTINA": "",
  "X2_MODO": "C",
  "X2_MODOUN": "C",
  "X2_MODOEMP": "C",
  "X2_DELET": "0",
  "X2_TTS": "",
  "X2_UNICO": "",
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

### SX3 — Campos

> **`X3_ORDEM` é ignorado pelo servidor** — ele auto-calcula a próxima ordem disponível por tabela. Informe qualquer valor (pode repetir ou deixar vazio).

> **Restrições de tamanho** confirmadas em produção:
> - `X3_TITULO / X3_TITSPA / X3_TITENG` ≤ **12 chars**
> - `X3_DESCRIC / X3_DESCSPA / X3_DESCENG` ≤ **20 chars, apenas ASCII** (sem acentos, sem ç)
> - `X3_PICTURE` ≤ **20 chars**

**Valores padrão recomendados** (baseados no `importar_crm2.json` — versão de referência):

| Campo | Valor padrão | Observação |
|-------|-------------|-----------|
| `X3_USADO` | `"x       x       x       x       x       x       x       x       x       x       x       x       x       x       x x     "` | Campo visível em todos os ambientes |
| `X3_RESERV` | `"xxxxxx x        "` | Bitmap de reserva padrão |
| `X3_BROWSE` | `"S"` | Visível no browse |
| `X3_VISUAL` | `"A"` | Alterável (`A`=alterar, `V`=visualizar) |
| `X3_CONTEXT` | `"R"` | Contexto real (`R`=real, `V`=virtual) |
| `X3_IDXFLD` | `"N"` | Não indexado |
| `X3_PROPRI` | `"U"` | Propriedade usuário (`U`=user, `S`=system) |

**Não incluir no JSON:** `PR_E_C_N_O`, `PF_L_A_G`, `PM_0_E_M_P`, `ID_PACKAGE`, `D_E_L_E_T_`, `R_E_C_N_O_`, `R_E_C_D_E_L_` — são campos de controle inseridos automaticamente pelo servidor.

```json
{
  "X3_ARQUIVO": "",
  "X3_ORDEM": "",
  "X3_CAMPO": "",
  "X3_TIPO": "",
  "X3_TAMANHO": "",
  "X3_DECIMAL": "0",
  "X3_TITULO": "",
  "X3_TITSPA": "",
  "X3_TITENG": "",
  "X3_DESCRIC": "",
  "X3_DESCSPA": "",
  "X3_DESCENG": "",
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

**Tipos de campo (`X3_TIPO`):**
- `C` — Caracter
- `N` — Numérico
- `D` — Data
- `L` — Lógico
- `M` — Memo

### SIX — Índices

```json
{
  "INDICE": "",
  "ORDEM": "",
  "CHAVE": "",
  "DESCRICAO": "",
  "DESCSPA": "",
  "DESCENG": "",
  "PROPRI": "U",
  "F3": "",
  "NICKNAME": "",
  "SHOWPESQ": "",
  "IX_VIRTUAL": "",
  "IX_VIRCUST": ""
}
```

> **`CHAVE`**: campos separados por `+`, ex: `"ZZ_FILIAL+ZZ_COD+ZZ_LOJA"`

### SX6 — Parâmetros do Sistema

```json
{
  "X6_FIL": "",
  "X6_VAR": "",
  "X6_TIPO": "",
  "X6_DESCRIC": "",
  "X6_DSCSPA": "",
  "X6_DSCENG": "",
  "X6_DESC1": "",
  "X6_DSCSPA1": "",
  "X6_DSCENG1": "",
  "X6_DESC2": "",
  "X6_DSCSPA2": "",
  "X6_DSCENG2": "",
  "X6_CONTEUD": "",
  "X6_CONTSPA": "",
  "X6_CONTENG": "",
  "X6_PROPRI": "U",
  "X6_VALID": "",
  "X6_INIT": "",
  "X6_DEFPOR": "",
  "X6_DEFSPA": "",
  "X6_DEFENG": "",
  "X6_PYME": ""
}
```

### SX7 — Gatilhos/Triggers

```json
{
  "X7_CAMPO": "",
  "X7_SEQUENC": "",
  "X7_REGRA": "",
  "X7_CDOMIN": "",
  "X7_TIPO": "",
  "X7_SEEK": "",
  "X7_ALIAS": "",
  "X7_ORDEM": "",
  "X7_CHAVE": "",
  "X7_CONDIC": "",
  "X7_PROPRI": "U"
}
```

### SXA — Pastas e Agrupamentos

```json
{
  "XA_ALIAS": "",
  "XA_ORDEM": "",
  "XA_DESCRIC": "",
  "XA_DESCSPA": "",
  "XA_DESCENG": "",
  "XA_PROPRI": "U",
  "XA_AGRUP": "",
  "XA_TIPO": ""
}
```

### SXB — Consultas Padrão

```json
{
  "XB_ALIAS": "",
  "XB_TIPO": "",
  "XB_SEQ": "",
  "XB_COLUNA": "",
  "XB_DESCRI": "",
  "XB_DESCSPA": "",
  "XB_DESCENG": "",
  "XB_CONTEM": "",
  "XB_WCONTEM": ""
}
```

### SXG — Grupos de Campo

```json
{
  "XG_GRUPO": "",
  "XG_DESCRI": "",
  "XG_DESSPA": "",
  "XG_DESENG": "",
  "XG_SIZEMAX": "",
  "XG_SIZEMIN": "",
  "XG_SIZE": "",
  "XG_PICTURE": "",
  "XG_CHECK1": "",
  "XG_CHECK2": ""
}
```

### SX1 — Perguntas/Parâmetros de Menu

```json
{
  "X1_GRUPO": "",
  "X1_ORDEM": "",
  "X1_PERGUNT": "",
  "X1_PERSPA": "",
  "X1_PERENG": "",
  "X1_VARIAVL": "",
  "X1_TIPO": "",
  "X1_TAMANHO": "",
  "X1_DECIMAL": "",
  "X1_PRESEL": "",
  "X1_GSC": "",
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

## Fluxo de Entrevista

Antes de gerar o JSON, colete as seguintes informações:

### Etapa 1 — Identificação do projeto
1. Código do projeto (`cProjeto`) — máx 6 chars, ex: `"000023"`
2. Descrição (`cDescricao`) — máx 50 chars
3. O projeto já existe no ambiente destino?
   - Se sim: quer **reimportar do zero** (`lRefazProjeto: true`) ou **atualizar incrementalmente** (`lIncrementar: true`)?
   - Se não: criar projeto novo (default)

### Etapa 2 — Origem dos dados
Pergunte se o desenvolvedor tem uma especificação pronta (planilha, documento Word, texto), ou se vai informar os dados manualmente. Se tiver um documento, analise-o para extrair automaticamente tabelas, campos, índices e parâmetros.

### Etapa 3 — Tabelas (SX2)
Para cada tabela nova:
- Alias/código (≤5 chars úteis) — ex: `SZZ`
- Nome em PT, ES, EN
- Modo: `C` (compartilhado), `E` (empresa), `U` (filial)

### Etapa 4 — Campos (SX3)
Para cada campo:
- Tabela destino (`X3_ARQUIVO`)
- Nome do campo (`X3_CAMPO`)
- Tipo (`C`/`N`/`D`/`L`/`M`)
- Tamanho e casas decimais
- Título (≤12 chars, sem acentos em Inglês)
- Descrição (≤20 chars, ASCII)
- Picture (se numérico ou com máscara)
- É obrigatório? (`X3_OBRIGAT`)
- CBOX (se for combo: `"S=Sim;N=Nao"`)

### Etapa 5 — Índices (SIX)
Para cada índice:
- Tabela (`INDICE`)
- Campos-chave separados por `+`
- Descrição

### Etapas opcionais
- SX6 (parâmetros do sistema)?
- SX7 (gatilhos/triggers)?
- SXA (pastas)?
- SXG (grupos de campo)?
- SXB (consultas padrão)?

### Etapa final — Chamada ao endpoint?
Perguntar se o dev quer executar a chamada REST após gerar o JSON:
- URL do servidor (`http://...`)
- `tenantId` (ex: `01,01`)
- Usuário e senha do Protheus

---

## Geração do JSON

1. Gere o arquivo com nome descritivo: `importar_<cProjeto>_<descricao>.json`
2. Aplique todos os schemas acima, preenchendo os valores informados
3. Use os **valores padrão recomendados** para `X3_USADO`, `X3_RESERV`, `X3_BROWSE`, `X3_VISUAL`, `X3_CONTEXT`, `X3_IDXFLD` em todos os campos SX3
4. **Não inclua** os campos de controle: `PR_E_C_N_O`, `PF_L_A_G`, `PM_0_E_M_P`, `ID_PACKAGE`, `D_E_L_E_T_`, `R_E_C_N_O_`, `R_E_C_D_E_L_`
5. `X3_ORDEM` pode ser informado com qualquer valor — o servidor o ignora e auto-calcula
6. Valide `X3_TITULO/TITSPA/TITENG` (≤12), `X3_DESCRIC/DESCSPA/DESCENG` (≤20, ASCII), `X3_PICTURE` (≤20) antes de gerar

### Modo incremental (`lIncrementar: true`)

No modo incremental, o JSON **não precisa conter todos os registros do projeto** — apenas os novos ou alterados:
- Registros novos são inseridos normalmente
- Registros existentes (mesmo `X3_CAMPO` na mesma tabela, por exemplo) são atualizados via upsert (delete + insert)
- Para campos SX3, o `X3_ORDEM` de campos existentes é **preservado automaticamente** pelo servidor
- A versão do PACKAGE (`PCK_VERSAO`) é incrementada automaticamente
- A resposta inclui contadores separados: `nRegistrosNovos` e `nRegistrosAtualizados`

---

## Chamada ao Endpoint (opcional)

Após gerar o JSON, se o dev quiser executar:

```bash
curl -X POST 'http://<servidor>:<porta>/rest/api/v1/projetos/importar' \
  --header 'tenantId: <emp>,<fil>' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Basic <base64>' \
  --data @importar_<cProjeto>_<descricao>.json
```

Para gerar o `Authorization Basic` a partir de `usuario:senha`:
```bash
echo -n "usuario:senha" | base64
```

Para executar diretamente no Claude Code:
```
! curl -X POST ...
```

---

## Exemplo de referência

O arquivo `C:\EstudosIA\claudecode\MigrarProjetoFujioka\importar_crm2.json` é a versão de referência completa (51 campos SX3 + 1 tabela SX2 + 1 índice SIX para o projeto CRM Fujioka). Use como modelo de qualidade para comparar o JSON gerado.
