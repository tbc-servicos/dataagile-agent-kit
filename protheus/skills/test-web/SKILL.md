---
name: test-web
description: Ciclo completo de testes E2E do TOTVS Protheus via MCP Playwright com evidências e documentação. Cobre roteiro → aprovação → execução com screenshots → validação → error handling → persistência na base de conhecimento → geração de MIT010. Substitui TIR. Use quando precisar testar rotinas Protheus, validar regras de negócio, coletar evidências ou gerar documentação de testes.
---

# Protheus Test Web — Testes E2E com Evidências e Documentação

Ciclo completo de testes E2E do TOTVS Protheus webapp usando MCP Playwright.
Substitui o TIR (TOTVS Interface Robot) por uma abordagem interativa com visão real da tela.

## Pré-requisitos

- Plugin MCP Playwright instalado (`/plugin` → instalar `playwright`)
- URL do Protheus webapp (porta 7600 tipicamente)
- Credenciais de acesso (usuário/senha)
- Ambiente, módulo e filial do teste
- Roteiro de teste (arquivo markdown, documento ou instruções do usuário)

## Ciclo Completo: Roteiro → Aprovação → Execução → Evidências → Documentação

### Etapa 1 — Elaboração do Roteiro de Testes

Antes de executar qualquer teste, elaborar um roteiro completo e apresentar ao team leader (desenvolvedor humano) para aprovação.

#### Fontes de conhecimento para o roteiro

Consultar a base de conhecimento Protheus via MCP antes de elaborar:

```
searchFunction({ name: "<rotina>", limit: 5 })
searchKnowledge({ skill: "protheus-test", keyword: "<módulo>" })
listTests({ platform: "protheus", module: "<módulo>", limit: 5 })
```

Usar o conhecimento dos fontes padrão para entender:
- Campos obrigatórios da rotina
- Validações e Pontos de Entrada ativos
- Regras de negócio implementadas
- Fluxo esperado da rotina (inclusão, alteração, exclusão)

#### Formato do roteiro

Apresentar ao team leader:

```markdown
# Roteiro de Teste: <nome do teste>

**Rotina:** <código e nome> (ex: MATA103 — Documento de Entrada)
**Módulo:** <sigla> (ex: SIGACOM)
**Ambiente:** <nome do ambiente>
**Filial:** <código e descrição>
**Data:** <data de execução>

## Objetivo
<O que está sendo testado e por quê>

## Pré-condições
<Dados necessários, configurações, pedidos existentes, etc.>

## Cenários de Teste

### TC01 — <descrição>
- **Ação:** <o que fazer>
- **Dados:** <valores a preencher>
- **Resultado esperado:** <o que deve acontecer>

### TC02 — <descrição>
...

## Cleanup
<Como reverter os dados após o teste>
```

**REGRA:** Só prosseguir para a execução após aprovação explícita do team leader.

### Etapa 2 — Preparação de Evidências

Criar diretório de evidências:
```
evidencias/
└── YYYY-MM-DD_<rotina>_<descricao>/
    ├── 01_parametros_iniciais.png
    ├── 02_login.png
    ├── ...
    └── relatorio.md
```

### Etapa 3 — Execução do Teste (QA)

Cada passo DEVE ser acompanhado de screenshot via `browser_take_screenshot`.
Nomear sequencialmente com descrição clara.

#### Fase 1 — Login
1. `browser_navigate` → URL do webapp
2. `browser_wait_for` (5-10s) — repetir se timeout
3. `browser_snapshot` → identificar campos
4. `browser_select_option` → selecionar ambiente
5. Clicar "Ok"
6. **Screenshot:** `01_parametros_iniciais.png`
7. Preencher usuário/senha via `browser_type`
8. Clicar "Entrar"
9. Aguardar (8-12s)
10. **Screenshot:** `02_login.png`

#### Fase 2 — Seleção de Ambiente
1. Alterar Ambiente se necessário (botão pesquisa → tabela → Confirmar)
2. Clicar "Entrar"
3. Fechar popup "base de Desenvolvimento" se aparecer
4. Aguardar menu (15s)
5. **Screenshot:** `03_menu_principal.png`

#### Fase 3 — Navegação
1. Clicar no grupo de menu desejado
2. Clicar na rotina
3. Aguardar (10s)
4. Tratar dialogs (Moedas → Confirmar, Filiais → duplo clique + Ok)
5. **Screenshot:** `04_browse_rotina.png`

#### Fase 4 — Ação do Teste
1. Executar a ação (Incluir, Classificar, etc.)
2. Preencher campos conforme roteiro
3. **Screenshot a cada preenchimento relevante:**
   - `05_cabecalho_preenchido.png`
   - `06_pedido_importado.png`
   - `07_grid_editada.png`
4. Salvar/Confirmar

#### Fase 5 — Validação
1. **Screenshot do resultado:** `08_resultado.png`
2. Se bloqueio esperado: **Screenshot:** `09_bloqueio_regra.png`
3. Se sucesso: **Screenshot:** `10_documento_gravado.png`
4. Registrar resultado: PASSOU / FALHOU / BLOQUEADO (esperado ou não)

#### Fase 6 — Cleanup
1. Excluir registro criado (se necessário)
2. **Screenshot:** `11_registro_excluido.png`
3. Confirmar que dados voltaram ao estado original

### Etapa 4 — Tratamento de Erros (error.log)

Se ocorrer erro SMARTCLIENT (THREAD ERROR) durante a execução:

1. **Screenshot imediato:** `XX_erro_smartclient.png`
2. Clicar em "Detalhes" no dialog de erro
3. **Screenshot dos detalhes:** `XX_erro_detalhes.png`
4. Copiar o conteúdo completo do textbox de erro (stack trace)
5. Analisar o erro:
   - Identificar a rotina/linha que causou (ex: `MATA103.PRW line: 3669`)
   - Classificar: erro de ambiente (config), erro de código (dev), erro de dados
6. **Devolver para o desenvolvedor** com:
   - Stack trace completo
   - Screenshot do erro
   - Análise da causa provável
   - Sugestão de correção (se possível)
7. **NÃO prosseguir** com o teste até o erro ser resolvido
8. Registrar a lição aprendida via `/protheus:feedback`

Erros comuns que devem ser devolvidos ao dev:
- `CheckSpecialKey` não configurada → problema de ambiente
- `type mismatch` → campo com tipo incorreto no código
- `array out of bounds` → lógica de array incorreta
- `variable does not exist` → variável não declarada
- Qualquer `THREAD ERROR` com stack trace apontando para `.PRW` customizado

### Etapa 5 — Review das Evidências

Apresentar ao team leader:
1. Lista de screenshots com descrição de cada passo
2. Resultado de cada cenário (PASSOU/FALHOU)
3. Erros encontrados com stack trace (se houver)
4. Perguntar se o teste precisa ser reexecutado ou ajustado

### Etapa 6 — Persistência na Base de Conhecimento

#### Teste bem-sucedido → Salvar via MCP

Após aprovação do team leader, salvar o teste:

```
saveTest({
  platform:     "protheus",
  module:       "<módulo>",
  title:        "<título claro>",
  scenario:     "<cenários cobertos>",
  script:       "<roteiro completo em markdown>",
  tags:         "<tags CSV>",
  submitted_by: "<email do dev>"
})
```

#### Teste com falha ou lição aprendida → /protheus:feedback

Para erros encontrados, comportamentos inesperados ou lições aprendidas:

Invocar `/protheus:feedback` com:
- O que aconteceu (erro, comportamento inesperado)
- Causa raiz identificada
- Como foi resolvido (ou como deveria ser resolvido)
- Contexto (rotina, ambiente, dados)

### Etapa 7 — Geração de Documentação MIT010

Após aprovação das evidências, gerar documento MIT010 (Análise de Negócio):

1. **Cabeçalho:** nome do teste, data, ambiente, responsável
2. **Objetivo:** o que foi testado e por quê
3. **Pré-condições:** dados necessários, configurações do ambiente
4. **Roteiro passo a passo:** cada ação com screenshot inline
5. **Resultado esperado vs obtido:** comparação por cenário
6. **Evidências:** todos os screenshots organizados sequencialmente
7. **Erros encontrados:** stack traces, análise, resolução
8. **Conclusão:** APROVADO / REPROVADO / PENDENTE
9. **Lições aprendidas:** o que foi registrado via feedback

Para gerar o MIT010, usar a skill `confluence:mit-doc-extractor` se disponível,
ou gerar em Markdown/DOCX com referências às imagens.

Formato de saída: perguntar ao usuário (Markdown, DOCX, Confluence).

## Regras Críticas

### Formatação de Números
- Separador de MILHAR = ponto (.)
- Separador DECIMAL = vírgula (,)
- Ao digitar valores, usar APENAS vírgula como decimal, SEM pontos
- Correto: `3,676500` — ERRADO: `3676,500000`

### Checkboxes em Tabelas
- Clique simples = seleciona a linha (NÃO marca o checkbox)
- **Duplo clique** = marca/desmarca o checkbox

### Snapshots Grandes
- Protheus gera snapshots >100K chars — salvar em arquivo com `filename`
- Buscar refs via grep/python no arquivo salvo
- Sempre tirar `browser_take_screenshot` para validação visual

### Tempos de Espera
- Nunca prosseguir sem aguardar carregamento
- Se snapshot retorna vazio, aguardar mais tempo
- Ver tempos em `references/protheus-webapp-patterns.md`

### Evidências (Screenshots)
- OBRIGATÓRIO em cada passo — sem evidência não há teste válido
- Nomes sequenciais e descritivos
- Diretório dedicado por execução

### Aprovação do Roteiro
- OBRIGATÓRIO antes de executar — apresentar roteiro ao team leader
- Baseado no conhecimento dos fontes padrão via MCP
- Só prosseguir com aprovação explícita

### Dialogs Modais
- Sempre verificar se há dialog antes de interagir com a tela
- Buscar botões: "Fechar", "Ok", "Confirmar", "Sim", "Cancelar"

## Referências

Consultar `references/protheus-webapp-patterns.md` para padrões de interface,
formatação, módulos e tempos de espera.
