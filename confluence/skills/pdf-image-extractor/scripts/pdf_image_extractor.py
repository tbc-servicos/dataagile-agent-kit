#!/usr/bin/env python3
"""
Extrai imagens de documentos PDF.

Uso:
    python pdf_image_extractor.py <arquivo.pdf> [diretorio_saida]

Exemplo:
    python pdf_image_extractor.py documento.pdf output/projeto/images
"""

import os
import sys
from pathlib import Path

try:
    import fitz  # pymupdf
except ImportError:
    print("Erro: pymupdf não instalado.")
    print("Instale com: pip install pymupdf")
    sys.exit(1)


def extract_images(pdf_path: str, output_dir: str) -> list[str]:
    """
    Extrai todas as imagens de um PDF.

    Args:
        pdf_path: Caminho do arquivo PDF
        output_dir: Diretório de saída para as imagens

    Returns:
        Lista de caminhos das imagens extraídas
    """
    Path(output_dir).mkdir(parents=True, exist_ok=True)

    doc = fitz.open(pdf_path)
    extracted = []

    print(f"Processando: {pdf_path}")
    print(f"Total de páginas: {len(doc)}")
    print("-" * 40)

    for page_num in range(len(doc)):
        page = doc[page_num]
        images = page.get_images()

        for img_index, img in enumerate(images):
            xref = img[0]
            try:
                base_image = doc.extract_image(xref)
                image_bytes = base_image["image"]
                image_ext = base_image["ext"]

                filename = f"page{page_num + 1:03d}_img{img_index + 1:02d}.{image_ext}"
                filepath = os.path.join(output_dir, filename)

                with open(filepath, "wb") as f:
                    f.write(image_bytes)

                extracted.append(filepath)
                print(f"  Extraída: {filename} ({len(image_bytes)} bytes)")

            except Exception as e:
                print(f"  Erro ao extrair imagem {img_index + 1} da página {page_num + 1}: {e}")

    doc.close()
    return extracted


def generate_index(images: list[str], output_dir: str) -> str:
    """Gera um índice Markdown das imagens extraídas."""
    index_path = os.path.join(output_dir, "..", "images_index.md")

    lines = [
        "# Índice de Imagens\n",
        "| Arquivo | Página | Descrição |",
        "|---------|--------|-----------|",
    ]

    for img_path in sorted(images):
        filename = os.path.basename(img_path)
        # Extrai número da página do nome do arquivo
        page_num = filename.split("_")[0].replace("page", "")
        lines.append(f"| {filename} | {page_num} | [a preencher] |")

    content = "\n".join(lines)

    with open(index_path, "w", encoding="utf-8") as f:
        f.write(content)

    return index_path


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    pdf_path = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else "output/images"

    if not os.path.exists(pdf_path):
        print(f"Erro: Arquivo não encontrado: {pdf_path}")
        sys.exit(1)

    print("=" * 40)
    print("PDF Image Extractor")
    print("=" * 40)

    images = extract_images(pdf_path, output_dir)

    print("-" * 40)
    print(f"Total: {len(images)} imagens extraídas")
    print(f"Diretório: {output_dir}")

    if images:
        index_path = generate_index(images, output_dir)
        print(f"Índice: {index_path}")

    print("=" * 40)


if __name__ == "__main__":
    main()
