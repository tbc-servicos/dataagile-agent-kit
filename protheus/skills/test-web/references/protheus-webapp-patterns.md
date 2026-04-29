# Protheus Webapp — Padrões de Interface e Interação

## Estrutura de Telas

### Tela de Parâmetros Iniciais
- Combo "Programa Inicial" (SIGAADV, SIGACOM, etc.)
- Combo "Ambiente no servidor" (lista de ambientes)
- Botão "Ok"

### Tela de Login
- Campo "Usuário" (textbox)
- Campo "Senha" (textbox)
- Combo idioma (Português, Espanhol, Inglês)
- Botão "Entrar"

### Tela de Seleção Empresa/Filial/Ambiente
- Campo "Data base" (date)
- Campo "Grupo" (textbox + botão pesquisa)
- Campo "Filial" (textbox + botão pesquisa)
- Campo "Ambiente" (textbox + botão pesquisa) → combo com módulos
- Botão "Entrar"
- Botão "Voltar"

### Menu Principal
- Barra superior: Log Off, empresa/filial, data, usuário, ambiente
- Menu lateral: Favoritos, Recentes, TOTVS News, grupos de menu
- Campo "Pesquisar" para buscar rotinas
- Botão "Trocar módulo"

### Browse (FWMBrowse)
- Toolbar: Incluir, Classificar, Visualizar, Outras Ações
- Grid com colunas configuráveis
- Filtrar, Pesquisar
- MOSTRAR DETALHES (expande painel inferior)

### Formulário de Inclusão/Edição
- Cabeçalho com campos do registro
- Grid de itens (tabela editável)
- Abas inferiores: Totais, Inf. Fornecedor/Cliente, Descontos, Livros Fiscais, etc.
- Toolbar: Outras Ações, Cancelar, Salvar

## Dialogs Modais Comuns

### Dialog de Moedas
- Campos: DOLAR, UFIR, Euro, IENE, Taxa de Juros Mensal
- Botões: Cancelar, Confirmar

### Dialog Seleção de Filiais
- Tabela: checkbox, Filial, Descricao, CNPJ
- Checkbox "Inverte Selecao"
- Botões: Ok, Cancelar

### Dialog Selecionar Pedido de Compra (<F5>)
- Campo: Fornecedor (read-only, mostra nome)
- Tabela: checkbox, Loja, Pedido, Emissao, Origem
- Botões: Outras Ações, Cancelar, Salvar

### Dialog MT100OK (Validar documento de entrada)
- Mensagem de confirmação de recebimento
- Botões: Não, Sim

### Dialog de Erro SMARTCLIENT
- Mensagem genérica de erro
- Botões: Detalhes, Salvar, Enviar LOG, Fechar
- Ao clicar Detalhes: textbox com stack trace completo

## Formatação de Dados

### Números
- Separador de milhar: PONTO (.)
- Separador decimal: VÍRGULA (,)
- Ao digitar valores em campos, usar APENAS vírgula como decimal
- Exemplo correto: `3,676500` (três reais e 67 centavos)
- Exemplo ERRADO: `3676,500000` (Protheus interpreta como 3.676.500)

### Datas
- Formato: DD/MM/AAAA
- Exemplo: 26/03/2026

### Códigos
- Fornecedor: 6 dígitos (ex: 000765)
- Loja: 2 dígitos (ex: 01)
- Filial: 2 dígitos (ex: 05)
- Produto: 9 dígitos (ex: 010100021)
- Número NF: 9 dígitos (ex: 000402150)

## Interação com Grid (Tabelas Editáveis)

### Selecionar linha
- Clique simples na linha

### Marcar checkbox em tabela
- **Duplo clique** na célula do checkbox (primeira coluna)
- Clique simples apenas seleciona a linha, NÃO marca o checkbox

### Editar célula
- **Duplo clique** na célula desejada
- Campo de edição aparece como textbox sobreposto
- Digitar o valor e pressionar Enter para confirmar
- O cursor move para a próxima célula editável

### Navegar na grid
- Tab: próximo campo editável
- Enter: confirma e avança

## Tempos de Espera Típicos

| Operação | Tempo mínimo |
|---|---|
| Carregamento inicial da página | 5-10s |
| Login (após clicar Entrar) | 8-12s |
| Seleção de ambiente/módulo | 10-15s |
| Abrir rotina do menu | 8-10s |
| Processar importação de pedido | 10-15s |
| Salvar documento | 5-10s |
| Dialog de Moedas aparecer | 5-8s |

## Módulos Comuns (Ambiente)

| Código | Sigla | Nome |
|---|---|---|
| 01 | SIGAATF | Ativo Fixo |
| 02 | SIGACOM | Compras |
| 04 | SIGAEST | Estoque/Custos |
| 05 | SIGAFAT | Faturamento |
| 06 | SIGAFIN | Financeiro |
| 07 | SIGAGPE | Gestão de Pessoal |
| 09 | SIGAFIS | Livros Fiscais |
| 10 | SIGAPCP | Planej.Contr.Produção |
