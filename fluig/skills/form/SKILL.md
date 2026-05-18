---
name: form
description: Cria formulário HTML para TOTVS Fluig com events/ e Util/. Use quando precisar criar formulário Fluig, adicionar validações, máscaras CPF/CNPJ/CEP/telefone, campos condicionais ou integrar SweetAlert2. Gera: HTML responsivo, events/enableFields.js, events/displayFields.js, events/validateForm.js, Util/UtilsHandler.js, Style/custom.css.
---

## Consulta MCP

Antes de gerar código, consulte o MCP `tbc-knowledge`:

```
searchFluigApi({ category: "form" })
// → CardAPI, WCMAPI, getValue/setValue, FormAPI, jQuery masks

searchFluigPatterns({ category: "template", skill: "fluig-form" })
// → templates: HTML base, enableFields.js, validateForm.js, DatasetUtils.js

searchFluigPatterns({ category: "naming" })
// → convenção de nomenclatura e IDs de formulário
```

---

## Padrões e Estrutura

Consulte o MCP antes de gerar o formulário:

```
searchFluigPatterns({ skill: "fluig-form", category: "template" })
searchFluigPatterns({ skill: "fluig-form", category: "naming" })
searchFluigPatterns({ skill: "fluig-form", category: "convention" })
```

Aplique a estrutura de pastas, naming e convenções retornadas pelo MCP.

---

## Instruções para Claude

1. **Perguntar** antes de gerar: qual o ID (6 dígitos)? qual o nome descritivo completo? quais campos (tipo, obrigatório, máscara)?
2. **Consultar MCP** para obter os templates dos arquivos de eventos e utilitários.
3. **Criar TODOS os arquivos** da estrutura definida acima — não apenas o HTML.
4. **Para cada campo informado:** definir a lógica correspondente em enableFields, displayFields, inputFields e validateForm.
5. **Usar SweetAlert2** (Swal.fire()) para todo feedback ao usuário — NUNCA usar alert() nativo.
6. **Aplicar máscaras jQuery** automaticamente para campos do tipo CPF, CNPJ, CEP, telefone e data.
