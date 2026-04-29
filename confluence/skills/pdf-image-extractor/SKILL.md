---
name: pdf-image-extractor
description: Extrai todas as imagens de um arquivo PDF e gera um índice Markdown. Útil para processar documentos MIT010/MIT072 e preparar imagens para publicação no Confluence. Requer pymupdf instalado (pip install pymupdf).
---

## Dependência

```bash
pip install pymupdf
```

## Script bundled

O script está em `scripts/pdf_image_extractor.py`.

## Uso

```bash
python scripts/pdf_image_extractor.py <arquivo.pdf> <diretorio_saida>

# Exemplo:
python scripts/pdf_image_extractor.py documento.pdf output/projeto/images
```

## O que o script faz

1. Abre o PDF com `fitz` (pymupdf)
2. Itera por todas as páginas
3. Extrai cada imagem com nome `page{NNN}_img{NN}.{ext}` (ex: `page001_img01.png`)
4. Salva as imagens no diretório de saída (cria se não existir)
5. Gera `images_index.md` no diretório pai com tabela Markdown:

```markdown
| Arquivo | Página | Descrição |
|---------|--------|-----------|
| page001_img01.png | 001 | [a preencher] |
```

## Estrutura de saída

```
output/{projeto}/
├── images/
│   ├── page001_img01.png
│   ├── page002_img01.jpg
│   └── ...
└── images_index.md
```

## Próximos passos após extração

1. Abrir `images_index.md` e preencher a coluna Descrição
2. Selecionar imagens relevantes para o documento
3. Fazer upload das imagens para a página Confluence (via interface web ou API)
4. Referenciar as imagens no documento Markdown antes de publicar
