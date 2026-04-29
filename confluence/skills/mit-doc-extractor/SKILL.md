---
name: mit-doc-extractor
description: Converte documentos de implantação TOTVS (MIT010 Análise de Negócio e MIT072 Especificação Técnica) em documentação de produto para publicação no Confluence. Analisa o conteúdo recebido, extrai seções relevantes, formata em Markdown e remove dados sensíveis do cliente.
---

## Sobre os documentos MIT

- **MIT010** — Documento de Análise de Negócio: descreve regras de negócio, fluxos, integrações e requisitos funcionais
- **MIT072** — Documento de Especificação Técnica: descreve implementação, tabelas, campos, rotinas e pontos de entrada

## Processo de extração

### 1. Analisar o documento recebido

Identificar o tipo (MIT010 ou MIT072) e mapear as seções presentes.

### 2. Remover dados sensíveis (obrigatório)

Antes de qualquer processamento, remover:
- Nome e código do cliente/projeto
- Proposta comercial e valores
- Nomes de gerentes, coordenadores e responsáveis
- Datas específicas do projeto (manter apenas versões de software)
- Informações de contrato

### 3. Extrair e formatar conteúdo

**Para MIT010 (Análise de Negócio):**
- Objetivo e escopo da funcionalidade
- Regras de negócio (numerar cada regra)
- Fluxo do processo (usar lista ordenada ou diagrama textual)
- Integrações com outros módulos TOTVS
- Parâmetros do sistema (MV_) envolvidos
- Perfis de acesso e permissões

**Para MIT072 (Especificação Técnica):**
- Tabelas envolvidas (alias, nome, campos customizados)
- Parâmetros criados (prefixo TB_, nome, tipo, conteúdo)
- Rotinas geradas (nome do arquivo, tipo, descrição)
- Pontos de entrada utilizados
- Consultas padrão (SXB) configuradas
- Menus adicionados

### 4. Estrutura do Markdown gerado

```markdown
# [Nome da Funcionalidade]

## Visão Geral
[Objetivo em 2-3 parágrafos]

## Regras de Negócio
1. [Regra 1]
2. [Regra 2]

## Configuração
### Parâmetros
| Parâmetro | Descrição | Conteúdo |
|-----------|-----------|---------|

### Tabelas / Campos
| Alias | Campo | Descrição |
|-------|-------|-----------|

## Fluxo do Processo
[Descrição do fluxo]

## Rotinas
| Programa | Tipo | Descrição |
|----------|------|-----------|

## Downloads

> **Importante:** Antes de aplicar qualquer artefato, faça backup completo do ambiente (banco de dados e RPO).

| Artefato | Descrição | Link |
|----------|-----------|------|
| Fonte | [nome].prw — [descrição] | [Download](...) |
| Patch | [nome].ptm — Patch de atualização | [Download](...) |
| Boletim Técnico | Documento original em PDF | [Download](...) |
```

> **OBRIGATÓRIO:** A seção `## Downloads` deve sempre estar presente ao final de toda página publicada no Confluence, mesmo que os links ainda não estejam disponíveis (usar `—`).

### 5. Publicar no Confluence

Após revisão do Markdown:
1. Usar `confluence:confluence-tools` para converter e publicar
2. Aplicar `markdown_to_confluence` no conteúdo gerado
3. Criar ou atualizar a página no space correto
