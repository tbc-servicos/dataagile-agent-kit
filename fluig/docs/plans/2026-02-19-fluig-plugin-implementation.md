# Fluig Plugin — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Criar um Claude Code plugin completo para desenvolvimento na plataforma TOTVS Fluig, com 5 skills genéricas (scaffolding), 3 subagents especializados (reviewer, QA, deploy) e hooks de validação pós-edição.

**Architecture:** Plugin format Claude Code (`.claude-plugin/plugin.json`) com skills em `skills/`, agents em `agents/` e hooks em `hooks/hooks.json`. Skills são genéricas (sem referência a cliente específico). Subagents executam em contexto isolado para não poluir a conversa principal. Hooks disparam automaticamente pós-edição em arquivos `.js`.

**Tech Stack:** Claude Code Plugin v1.0+, Markdown (SKILL.md), JSON (hooks.json, plugin.json), Angular 19 + PO-UI (templates de widget), JavaScript ES5 (templates de dataset/formulário), Bash (deploy via SSH).

**Design Doc:** `docs/plans/2026-02-19-fluig-plugin-design.md`

---

## Task 1: Plugin Manifest

**Files:**
- Create: `.claude-plugin/plugin.json`

**Step 1: Criar diretório e manifesto**

```bash
mkdir -p /home/jv/developments/claude-code-plugins-custon/fluig/.claude-plugin
```

Conteúdo de `.claude-plugin/plugin.json`:
```json
{
  "name": "fluig",
  "description": "Plugin Claude Code para desenvolvimento TOTVS Fluig — scaffolding de formulários, datasets, widgets, workflows BPM, revisão de código e deploy.",
  "version": "1.0.0",
  "author": {
    "name": "TBC - Time de Desenvolvimento"
  },
  "homepage": "https://bitbucket.org/fabricatbc/claude_skills",
  "repository": "https://bitbucket.org/fabricatbc/claude_skills"
}
```

**Step 2: Verificar que o plugin carrega**

```bash
cd /home/jv/developments/claude-code-plugins-custon/fluig
claude --plugin-dir . --print "list all loaded plugins"
```

Expected: Plugin `fluig` aparece na lista (sem erros de manifest).

**Step 3: Commit**

```bash
git init  # se ainda nao for git repo
git add .claude-plugin/plugin.json CLAUDE.md
git commit -m "feat: add Claude Code plugin manifest"
```

---

## Task 2: Skill `fluig-api-ref` (Referência de APIs)

**Files:**
- Create: `skills/fluig-api-ref/SKILL.md`

> **Por que primeiro?** As outras 4 skills referenciam as APIs. Ter a referência primeiro garante consistência.

**Step 1: Criar estrutura e arquivo**

```bash
mkdir -p skills/fluig-api-ref
```

Conteúdo de `skills/fluig-api-ref/SKILL.md`:

```markdown
---
name: fluig-api-ref
description: Referência das APIs JavaScript e REST da plataforma TOTVS Fluig. Use quando o desenvolvedor tiver dúvidas sobre DatasetFactory, WCMAPI, CardAPI, WorkflowAPI, FormAPI, ZoomAPI ou APIs REST com OAuth2.
---

# APIs Fluig — Referência Rápida

## APIs JavaScript (Client-Side)

### DatasetFactory
```javascript
// Consultar dataset
var dataset = DatasetFactory.getDataset(
    "ds_exemplo",           // Nome do dataset
    null,                   // Fields (null = todos)
    constraints,            // Array de constraints
    null                    // Sort
);

// Criar constraint
var constraint = DatasetFactory.createConstraint(
    "campo",
    "valor",
    "valor",
    ConstraintType.MUST    // MUST | SHOULD | MUST_NOT
);

// Acessar valores
var valor = dataset.getValue(0, "coluna");
var total = dataset.rowsCount;
```

### WCMAPI
```javascript
WCMAPI.create({ description, documentType, documentTypeId, parentDocumentId, publisherId });
WCMAPI.update({ documentId, description });
WCMAPI.delete(documentId);
var doc = WCMAPI.read(documentId);
```

### CardAPI
```javascript
var cardId = CardAPI.create({ formId, parentDocumentId: "0", version: 1000, fields: { campo: "valor" } });
CardAPI.update(cardId, { fields: { campo: "novo" } });
var card = CardAPI.read(cardId);
```

### WorkflowAPI
```javascript
var processId = WorkflowAPI.startProcess({ processId, requester: getValue("WKUser"), cardId, comments });
WorkflowAPI.cancelProcess(processId, "Motivo");
var activities = WorkflowAPI.getCurrentActivities(processId);
```

### FormAPI
```javascript
FormAPI.setValue("campo", "valor");
var valor = FormAPI.getValue("campo");
FormAPI.setEnabled("campo", true);
FormAPI.setVisible("campo", true);
FormAPI.setRequired("campo", true);
```

### ZoomAPI
```javascript
ZoomAPI.setDataset("campo", "ds_exemplo");
ZoomAPI.addConstraint("campo", "filtro", "valor");
ZoomAPI.clear("campo");
```

## APIs REST

### Autenticação OAuth2
```
POST /api/oauth2/token
Content-Type: application/x-www-form-urlencoded
Body: grant_type=password&username=USER&password=PASS
```

### Datasets via REST
```
GET /api/public/ecm/dataset/search
Authorization: Bearer {token}
Body: { "name": "ds_exemplo", "constraints": [{ "field": "campo", "initialValue": "val", "finalValue": "val", "type": 1 }] }
```

### Upload de Artefato
```
POST /api/public/2.0/documents/upload
Content-Type: multipart/form-data
Authorization: Bearer {token}
```

### Workflow REST
```
POST /api/public/2.0/processes/start
Body: { "processId": "nome_processo", "requester": "admin", "cardId": 123456 }

GET /api/public/2.0/tasks/user/{userId}
```

## Utilitários JavaScript

### getConstraintValue
```javascript
function getConstraintValue(constraints, fieldName) {
    if (constraints) {
        for (var i = 0; i < constraints.length; i++) {
            if (constraints[i].fieldName == fieldName) {
                return constraints[i].initialValue;
            }
        }
    }
    return null;
}
```

### isNullOrEmpty
```javascript
function isNullOrEmpty(value) {
    return value === null || value === undefined || value === "" || String(value).trim() === "";
}
```

## Máscaras jQuery Comuns
```javascript
$('#cpf').mask('000.000.000-00');
$('#cnpj').mask('00.000.000/0000-00');
$('#cep').mask('00000-000');
$('#telefone').mask('(00) 0000-00009');
$('#data').mask('00/00/0000');
```
```

**Step 2: Verificar que a skill carrega**

```bash
claude --plugin-dir . --print "use fluig-api-ref to tell me how to query a dataset"
```

Expected: Resposta com código usando `DatasetFactory.getDataset`.

**Step 3: Commit**

```bash
git add skills/fluig-api-ref/
git commit -m "feat: add fluig-api-ref skill with JS and REST API reference"
```

---

## Task 3: Skill `fluig-dataset`

**Files:**
- Create: `skills/fluig-dataset/SKILL.md`

**Step 1: Criar arquivo**

```bash
mkdir -p skills/fluig-dataset
```

Conteúdo de `skills/fluig-dataset/SKILL.md`:

```markdown
---
name: fluig-dataset
description: Gera datasets JavaScript para a plataforma TOTVS Fluig seguindo os padrões: nomenclatura ds_[acao]_[entidade].js, funções defineStructure/onSync/createDataset, try/catch obrigatório, log.info e log.error, sem credenciais hardcoded.
---

# Fluig Dataset Builder

## Padrões Obrigatórios

- **Nomenclatura:** `ds_[acao]_[entidade].js` (ex: `ds_consulta_pedidos.js`, `ds_atualiza_beneficiario.js`)
- **Funções:** `defineStructure()`, `onSync(lastSyncDate)`, `createDataset(fields, constraints, sortFields)`
- **Sempre:** `try/catch`, `log.info()` no início, `log.error()` em erros
- **Nunca:** credenciais hardcoded, SQL sem constraint de limite

## Template Base

```javascript
// ds_[acao]_[entidade].js
function defineStructure() {
    addColumn("COLUNA_1");
    addColumn("COLUNA_2");
    // adicionar todas as colunas do resultado
}

function onSync(lastSyncDate) {
    // opcional: sincronização incremental
}

function createDataset(fields, constraints, sortFields) {
    var dataset = DatasetBuilder.newDataset();

    try {
        log.info("Iniciando dataset: ds_[acao]_[entidade]");

        // Extrair constraints
        var filtro = getConstraintValue(constraints, "CAMPO_FILTRO");

        // Lógica principal aqui
        dataset.addRow(new Array("valor1", "valor2"));

        log.info("Dataset finalizado. Linhas: " + dataset.rowsCount);
    } catch (e) {
        log.error("Erro no dataset ds_[acao]_[entidade]: " + e.toString());
        dataset.addRow(new Array("ERRO", e.message || e.toString()));
    }

    return dataset;
}

function getConstraintValue(constraints, fieldName) {
    if (constraints) {
        for (var i = 0; i < constraints.length; i++) {
            if (constraints[i].fieldName == fieldName) {
                return constraints[i].initialValue;
            }
        }
    }
    return null;
}
```

## Template com Integração REST (Protheus/API Externa)

```javascript
function createDataset(fields, constraints, sortFields) {
    var dataset = DatasetBuilder.newDataset();

    try {
        log.info("Iniciando ds_[acao]_[entidade] - integração REST");

        var clientService = fluigAPI.getAuthorizeClientService();
        var url = getConstraintValue(constraints, "URL_BASE") || "http://servidor/api";
        var endpoint = url + "/recurso";

        var headers = {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + getToken()
        };

        var payload = JSON.stringify({
            "campo": getConstraintValue(constraints, "CAMPO")
        });

        var response = clientService.invoke(endpoint, "POST", headers, payload);
        var resultado = JSON.parse(response.getResult());

        if (resultado && resultado.items) {
            for (var i = 0; i < resultado.items.length; i++) {
                var item = resultado.items[i];
                dataset.addRow(new Array(item.campo1, item.campo2));
            }
        }

        log.info("Dataset concluído. " + dataset.rowsCount + " registros.");
    } catch (e) {
        log.error("Erro em ds_[acao]_[entidade]: " + e.toString());
    }

    return dataset;
}
```

## Instruções para Claude

Ao gerar um dataset:
1. Perguntar: qual é o nome (ação + entidade)? Quais colunas retorna? Tem integração externa?
2. Usar o template correto (simples ou REST)
3. Substituir todos os `[placeholders]` por valores reais
4. Garantir `defineStructure()` tem as mesmas colunas que `addRow()` retorna
5. Nunca usar `alert()` — usar apenas `log.info/error`
```

**Step 2: Testar**

```bash
claude --plugin-dir . --print "use fluig-dataset skill to create a dataset called ds_consulta_pedidos that returns NUMERO, FORNECEDOR, VALOR, STATUS"
```

Expected: Dataset JS completo com as 4 colunas, `defineStructure`, `createDataset`, `try/catch`.

**Step 3: Commit**

```bash
git add skills/fluig-dataset/
git commit -m "feat: add fluig-dataset skill with REST integration template"
```

---

## Task 4: Skill `fluig-form`

**Files:**
- Create: `skills/fluig-form/SKILL.md`

**Step 1: Criar arquivo**

```bash
mkdir -p skills/fluig-form
```

Conteúdo de `skills/fluig-form/SKILL.md`:

```markdown
---
name: fluig-form
description: Gera formulários HTML para a plataforma TOTVS Fluig com estrutura completa de pastas, arquivos de eventos JavaScript (enableFields, displayFields, inputFields, validateForm), utilitários e bibliotecas padrão. Usa SweetAlert2 para feedback, jQuery Mask para máscaras e segue o Fluig Style Guide.
---

# Fluig Form Builder

## Padrões Obrigatórios

- **Nomenclatura da pasta:** `[ID-6-DIGITOS] - [Nome Descritivo Completo]`
- **Arquivo principal:** `[nome-sem-espacos].html`
- **Feedback:** SweetAlert2 (`Swal.fire()`), **nunca** `alert()`
- **Máscaras:** jQuery Mask para CPF, CNPJ, CEP, telefone, data
- **Campos:** `id` e `name` sempre iguais e em snake_case

## Estrutura de Pastas

```
[ID] - [Nome]/
├── [nome].html
├── events/
│   ├── enableFields.js     # habilita/desabilita campos por papel (WKUser, WKRoles)
│   ├── displayFields.js    # mostra/oculta campos por atividade (WKNumState)
│   ├── inputFields.js      # validação client-side ao alterar campo
│   └── validateForm.js     # validação geral antes de submeter
├── Util/
│   ├── UtilsHandler.js     # funções auxiliares (formatação, máscaras)
│   └── DatasetUtils.js     # funções de consulta a datasets
├── Lib/
│   ├── jquery.mask.js
│   ├── sweetalert.js
│   └── lodash.min.js
└── Style/
    └── form.css
```

## Template HTML Base

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <link rel="stylesheet" href="Style/form.css">
</head>
<body>
    <div class="container-fluid">
        <div class="row">
            <div class="col-md-12">
                <h3>[Título do Formulário]</h3>
            </div>
        </div>
        <div class="row">
            <div class="col-md-6">
                <div class="form-group">
                    <label for="campo_exemplo">Campo Exemplo <span class="required">*</span></label>
                    <input type="text"
                           id="campo_exemplo"
                           name="campo_exemplo"
                           class="form-control"
                           required>
                </div>
            </div>
        </div>
    </div>

    <!-- Bibliotecas -->
    <script src="Lib/jquery.mask.js"></script>
    <script src="Lib/sweetalert.js"></script>
    <script src="Lib/lodash.min.js"></script>
    <script src="Util/UtilsHandler.js"></script>
    <script src="Util/DatasetUtils.js"></script>
</body>
</html>
```

## Template enableFields.js

```javascript
function enableFields(form, motivo) {
    // Desabilitar todos por padrão
    var campos = ["campo_exemplo", "outro_campo"];
    campos.forEach(function(campo) {
        setDisabled(campo, true);
    });

    // Habilitar conforme o papel
    var usuario = getValue("WKUser");
    var papeis = getValue("WKRoles");

    if (papeis.indexOf("SOLICITANTE") >= 0) {
        setDisabled("campo_exemplo", false);
    }
}
```

## Template validateForm.js

```javascript
function validateForm(form, motivo) {
    try {
        var campo = getValue("campo_exemplo");

        if (!campo || campo.trim() === "") {
            Swal.fire({
                icon: "warning",
                title: "Campo obrigatório",
                text: "Preencha o campo Exemplo antes de continuar."
            });
            return false;
        }

        return true;
    } catch (e) {
        log.error("Erro na validação: " + e.toString());
        return false;
    }
}
```

## Template DatasetUtils.js

```javascript
function consultarDataset(datasetId, filtros) {
    var constraints = [];

    if (filtros) {
        for (var key in filtros) {
            if (filtros.hasOwnProperty(key)) {
                constraints.push(DatasetFactory.createConstraint(
                    key, filtros[key], filtros[key], ConstraintType.MUST
                ));
            }
        }
    }

    return DatasetFactory.getDataset(datasetId, null, constraints, null);
}
```

## Instruções para Claude

Ao gerar um formulário:
1. Perguntar: qual o ID (6 dígitos)? qual o nome? quais campos (tipo, obrigatório, máscara)?
2. Criar TODOS os arquivos da estrutura (não apenas o HTML)
3. Para cada campo: definir `enableFields`, `displayFields`, `inputFields` e `validateForm`
4. Usar SweetAlert2 para todo feedback ao usuário
5. Aplicar máscaras jQuery para CPF/CNPJ/CEP/telefone/data automaticamente
```

**Step 2: Testar**

```bash
claude --plugin-dir . --print "use fluig-form skill to create a form with ID 123456, name 'Solicitação de Compra', fields: solicitante (text, required), valor (currency), data_entrega (date)"
```

Expected: Estrutura completa com HTML, todos os eventos, utilitários.

**Step 3: Commit**

```bash
git add skills/fluig-form/
git commit -m "feat: add fluig-form skill with full folder structure templates"
```

---

## Task 5: Skill `fluig-workflow`

**Files:**
- Create: `skills/fluig-workflow/SKILL.md`

**Step 1: Criar arquivo**

```bash
mkdir -p skills/fluig-workflow
```

Conteúdo de `skills/fluig-workflow/SKILL.md`:

```markdown
---
name: fluig-workflow
description: Gera scripts de eventos de workflow BPM para a plataforma TOTVS Fluig. Cobre eventos: afterProcessCreate, afterProcessFinish, beforeStateEntry, afterStateEntry, subProcessCreated, servicetask. Padrão: nomenclatura wf_[processo].[evento].js, log obrigatório, try/catch, integração Protheus.
---

# Fluig Workflow Builder

## Nomenclatura

`wf_[nome_processo].[evento].js`

Exemplos:
- `wf_solicitacao_compras.afterStateEntry.js`
- `wf_aprovacao_reembolso.beforeStateEntry.js`
- `wf_admissao.afterProcessCreate.js`

## Eventos Disponíveis

| Evento | Quando dispara |
|--------|---------------|
| `afterProcessCreate` | Após criação do processo |
| `afterProcessFinish` | Após finalização do processo |
| `beforeStateEntry` | Antes de entrar em atividade |
| `afterStateEntry` | Após entrar em atividade (mais comum) |
| `subProcessCreated` | Quando subprocesso é criado |
| `servicetask1..N` | Service tasks automáticas |

## Template afterStateEntry (mais comum)

```javascript
// wf_[processo].afterStateEntry.js
function afterStateEntry(sequenceId) {
    try {
        log.info("afterStateEntry - Processo: " + getValue("WKNumProces") + " Atividade: " + getValue("WKNumState"));

        var atividade = parseInt(getValue("WKNumState"));

        // Lógica por atividade
        if (atividade === 2) {
            // Aprovação inicial
            var solicitante = getValue("WKUser");
            log.info("Atividade de aprovação. Solicitante: " + solicitante);

            // Notificar responsável
            notificarResponsavel(solicitante);
        }

        if (atividade === 3) {
            // Segunda aprovação — valor alto
            var valor = parseFloat(getValue("valor") || "0");
            if (valor > 1000) {
                setTaskUser("gerente.responsavel");
                log.info("Valor > 1000. Direcionado ao gerente.");
            }
        }

    } catch (e) {
        log.error("Erro em afterStateEntry - Processo " + getValue("WKNumProces") + ": " + e.toString());
    }
}

function notificarResponsavel(usuario) {
    try {
        notifier.notify(
            usuario,
            "templateNotificacao",
            { "NUMERO_PROCESSO": getValue("WKNumProces") },
            usuario + "@empresa.com.br",
            "Notificação de Processo"
        );
    } catch (e) {
        log.error("Erro ao notificar: " + e.toString());
    }
}
```

## Template afterProcessCreate

```javascript
// wf_[processo].afterProcessCreate.js
function afterProcessCreate(processId) {
    try {
        log.info("afterProcessCreate - Processo criado: " + processId);

        var solicitante = getValue("WKUser");
        var cardId = getValue("WKCardId");

        log.info("Solicitante: " + solicitante + " CardId: " + cardId);

        // Inicializar campos do processo
        setValue("data_abertura", new Date().toLocaleDateString("pt-BR"));
        setValue("status", "ABERTO");

    } catch (e) {
        log.error("Erro em afterProcessCreate: " + e.toString());
    }
}
```

## Template afterProcessFinish

```javascript
// wf_[processo].afterProcessFinish.js
function afterProcessFinish(processId) {
    try {
        log.info("afterProcessFinish - Processo finalizado: " + processId);

        var resultado = getValue("resultado_final");
        log.info("Resultado: " + resultado);

        // Integração pós-aprovação
        if (resultado === "APROVADO") {
            integrarComProtheus();
        }

    } catch (e) {
        log.error("Erro em afterProcessFinish: " + e.toString());
    }
}
```

## Variáveis de Sistema Fluig

```javascript
getValue("WKUser")       // usuário logado
getValue("WKNumState")   // número da atividade atual
getValue("WKNumProces")  // número do processo
getValue("WKCardId")     // ID do card (formulário)
getValue("WKRoles")      // papeis do usuário
```

## Instruções para Claude

1. Perguntar: qual o nome do processo? qual o evento? quais as atividades e regras de negócio?
2. Usar o template correto conforme o evento
3. Substituir atividades genéricas pelos números reais do processo
4. Sempre incluir `log.info` no início e `log.error` no catch
5. Para `setTaskUser`: garantir que o login do usuário é uma variável, não hardcoded
```

**Step 2: Testar**

```bash
claude --plugin-dir . --print "use fluig-workflow skill to create afterStateEntry event for process wf_aprovacao_compras with 3 activities: 1=solicitante, 2=supervisor (valor>500 vai para gerente), 3=gerente"
```

Expected: Script JS com lógica de valor, `setTaskUser`, `log.info/error`, `try/catch`.

**Step 3: Commit**

```bash
git add skills/fluig-workflow/
git commit -m "feat: add fluig-workflow skill with all BPM event templates"
```

---

## Task 6: Skill `fluig-widget`

**Files:**
- Create: `skills/fluig-widget/SKILL.md`

**Step 1: Criar arquivo**

```bash
mkdir -p skills/fluig-widget
```

Conteúdo de `skills/fluig-widget/SKILL.md`:

```markdown
---
name: fluig-widget
description: Gera widgets Angular 19 + PO-UI 19.36.0 para a plataforma TOTVS Fluig. Padrão de nomenclatura wg_[nome-kebab-case]. Estrutura: components/, pages/, services/, shared/, utils/. Testes com Jasmine/Karma obrigatórios. Não usa Angular Material puro — sempre PO-UI.
---

# Fluig Widget Builder

## Padrões Obrigatórios

- **Nomenclatura:** `wg_[nome-kebab-case]` (ex: `wg_gestao-ferias`, `wg_portal-compras`)
- **Stack:** Angular 19.0.0 + PO-UI 19.36.0 + TypeScript 5.6.2
- **Testes:** Jasmine + Karma (OBRIGATÓRIO para componentes novos)
- **Nunca:** Angular Material puro, Angular 16, `var` (usar `const`/`let`)

## Estrutura de Pastas

```
_node/wg_[nome]/
├── src/
│   ├── app/
│   │   ├── components/         # componentes reutilizáveis
│   │   │   └── exemplo/
│   │   │       ├── exemplo.component.ts
│   │   │       ├── exemplo.component.html
│   │   │       ├── exemplo.component.scss
│   │   │       └── exemplo.component.spec.ts
│   │   ├── pages/              # páginas/views principais
│   │   ├── services/           # HTTP services + WebSocket
│   │   │   └── exemplo.service.ts
│   │   ├── shared/             # pipes, directives, models, interfaces
│   │   │   └── models/
│   │   │       └── exemplo.model.ts
│   │   ├── utils/              # funções utilitárias puras
│   │   ├── app.component.ts
│   │   ├── app.component.html
│   │   ├── app.module.ts
│   │   └── app.routes.ts
│   ├── assets/
│   └── main.ts
├── angular.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.spec.json
├── karma.conf.js
├── package.json
└── .eslintrc.json
```

## Template package.json

```json
{
  "name": "wg-[nome]",
  "version": "1.0.0",
  "scripts": {
    "start": "ng serve",
    "build": "ng build --configuration production",
    "test": "ng test",
    "lint": "ng lint"
  },
  "dependencies": {
    "@angular/core": "^19.0.0",
    "@angular/common": "^19.0.0",
    "@angular/forms": "^19.0.0",
    "@angular/router": "^19.0.0",
    "@po-ui/ng-components": "^19.36.0",
    "@po-ui/ng-templates": "^19.36.0",
    "rxjs": "^7.8.0",
    "tslib": "^2.6.0",
    "zone.js": "~0.14.0"
  },
  "devDependencies": {
    "@angular/cli": "^19.0.0",
    "@angular/compiler-cli": "^19.0.0",
    "typescript": "~5.6.2",
    "karma": "~6.4.0",
    "jasmine-core": "~5.1.0"
  }
}
```

## Template Service HTTP

```typescript
// src/app/services/exemplo.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ExemploService {
  private baseUrl = '/api';  // configurar via environment

  constructor(private http: HttpClient) {}

  getData(filtro: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/recurso?filtro=${filtro}`).pipe(
      catchError(error => {
        console.error('Erro ao buscar dados:', error);
        return throwError(() => error);
      })
    );
  }
}
```

## Template Componente com PO-UI

```typescript
// src/app/components/lista/lista.component.ts
import { Component, OnInit } from '@angular/core';
import { PoTableColumn, PoNotificationService } from '@po-ui/ng-components';

@Component({
  selector: 'app-lista',
  templateUrl: './lista.component.html'
})
export class ListaComponent implements OnInit {
  columns: PoTableColumn[] = [
    { property: 'nome', label: 'Nome' },
    { property: 'valor', label: 'Valor', type: 'currency' },
    { property: 'status', label: 'Status', type: 'label' }
  ];
  items: any[] = [];
  isLoading = false;

  constructor(private notification: PoNotificationService) {}

  ngOnInit(): void {
    this.carregarDados();
  }

  carregarDados(): void {
    this.isLoading = true;
    // chamada ao service
  }
}
```

## Template Spec (Teste)

```typescript
// lista.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListaComponent } from './lista.component';

describe('ListaComponent', () => {
  let component: ListaComponent;
  let fixture: ComponentFixture<ListaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ListaComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ListaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty items', () => {
    expect(component.items).toEqual([]);
  });
});
```

## Comandos de Desenvolvimento

```bash
# Instalar dependências
cd _node/wg_[nome]
npm install

# Desenvolvimento com hot-reload
npm start

# Build para produção (Fluig)
npm run build

# Testes
npm test

# Lint
npm run lint
```

## Instruções para Claude

1. Perguntar: qual o nome do widget (kebab-case)? qual a funcionalidade principal? precisa integrar com Protheus?
2. Gerar TODOS os arquivos (não apenas o componente principal)
3. Usar PO-UI em TODOS os componentes visuais (nunca Material puro)
4. Criar spec.ts para cada componente novo
5. Usar `const`/`let`, nunca `var` no TypeScript
```

**Step 2: Testar**

```bash
claude --plugin-dir . --print "use fluig-widget skill to scaffold wg_portal-compras widget with a PO-UI table showing FORNECEDOR, VALOR, STATUS columns"
```

Expected: Estrutura completa com TS, HTML, service, spec.

**Step 3: Commit**

```bash
git add skills/fluig-widget/
git commit -m "feat: add fluig-widget skill with Angular 19 + PO-UI templates"
```

---

## Task 7: Subagent `fluig-reviewer`

**Files:**
- Create: `agents/fluig-reviewer.md`

**Step 1: Criar arquivo**

```bash
mkdir -p agents
```

Conteúdo de `agents/fluig-reviewer.md`:

```markdown
---
name: fluig-reviewer
description: Revisa código Fluig (datasets, formulários, workflows, widgets) verificando: nomenclatura, tratamento de erros, segurança, padrões de API e boas práticas. Execute com contexto isolado para não poluir a conversa principal.
tools: Read, Grep, Glob
model: sonnet
---

# Fluig Code Reviewer

Você é um revisor de código especializado na plataforma TOTVS Fluig. Revise o artefato fornecido verificando todos os pontos abaixo.

## Checklist de Revisão

### 1. Nomenclatura
- [ ] Dataset: nome começa com `ds_` + ação + entidade (snake_case)
- [ ] Widget: nome começa com `wg_` (kebab-case)
- [ ] Workflow: nome segue `wf_[processo].[evento].js`
- [ ] Formulário: ID tem 6 dígitos, nome descritivo

### 2. Tratamento de Erros (CRÍTICO)
- [ ] Todo código tem `try/catch`
- [ ] `log.info()` no início da função principal
- [ ] `log.error()` no bloco catch com `e.toString()`
- [ ] Dataset retorna linha de erro em vez de quebrar silenciosamente

### 3. Feedback ao Usuário
- [ ] Sem `alert()` nativo — usar `Swal.fire()` (formulários)
- [ ] Mensagens em português, claras ao usuário

### 4. Segurança
- [ ] Sem credenciais hardcoded (URLs, senhas, tokens)
- [ ] URLs de API vêm de datasets de configuração ou constraints
- [ ] Sem `eval()` ou injeção de código dinâmico

### 5. Padrões de API Fluig
- [ ] Dataset usa `DatasetBuilder.newDataset()` e retorna o dataset
- [ ] `defineStructure()` tem as mesmas colunas que `addRow()` insere
- [ ] Workflow usa `getValue()` para ler campos, `setValue()` para escrever
- [ ] `setTaskUser()` usa login vindo de variável, não hardcoded

### 6. Performance
- [ ] Datasets com SQL têm LIMIT/TOP (evita full scan)
- [ ] Loop com resultado de API tem verificação de nulo/vazio

### 7. Widgets Angular
- [ ] TypeScript: sem `var` (usar `const`/`let`)
- [ ] Tipagem forte (sem `any` desnecessário)
- [ ] Tratamento de erros no `catchError` do pipe
- [ ] Spec (`.spec.ts`) existe para o componente

## Formato de Saída

Para cada problema encontrado, reportar:
```
[CRÍTICO|AVISO|SUGESTÃO] Linha N: descrição do problema
Código atual: `trecho`
Correção sugerida: `trecho corrigido`
```

Ao final, sumário:
- Total de problemas críticos:
- Total de avisos:
- Aprovado para deploy: SIM / NÃO (se críticos > 0)
```

**Step 2: Verificar que o agent carrega**

```bash
claude --plugin-dir . --print "use fluig-reviewer agent to review this dataset: function createDataset(fields, constraints, sortFields) { var d = DatasetBuilder.newDataset(); d.addRow(['test']); return d; }"
```

Expected: Lista de problemas: sem `try/catch`, sem `log.info`, sem `defineStructure`.

**Step 3: Commit**

```bash
git add agents/fluig-reviewer.md
git commit -m "feat: add fluig-reviewer subagent for code quality review"
```

---

## Task 8: Subagent `fluig-qa`

**Files:**
- Create: `agents/fluig-qa.md`

**Step 1: Criar arquivo**

Conteúdo de `agents/fluig-qa.md`:

```markdown
---
name: fluig-qa
description: Analisa qualidade de artefatos Fluig identificando casos de borda não tratados, campos obrigatórios sem validação, datasets sem constraints de filtro, e verifica se widgets têm cobertura de testes adequada. Foca em QA antes do deploy.
tools: Read, Grep, Glob, Bash
model: sonnet
---

# Fluig QA Analyzer

Você é um analista de QA especializado em TOTVS Fluig. Analise o artefato e identifique riscos de qualidade.

## Análise por Tipo de Artefato

### Datasets
- [ ] O que acontece se a query retorna 0 linhas? Tratado?
- [ ] O que acontece se a API externa está fora do ar? Timeout? Retry?
- [ ] Constraints opcionais vs obrigatórias — o código lida com ambos?
- [ ] Se `constraints` é null, o código quebra?
- [ ] Valores numéricos: podem vir como string? Parseados corretamente?

### Formulários (Events)
- [ ] `validateForm`: todos os campos obrigatórios validados?
- [ ] `enableFields`: cobre todos os papeis/perfis possíveis?
- [ ] `displayFields`: cobre todas as atividades do processo?
- [ ] Campos de data: validação de formato? Datas passadas permitidas?
- [ ] Campos de valor: aceita negativos? Zero?
- [ ] Zoom: o que acontece se o dataset do zoom retorna vazio?

### Workflows
- [ ] `afterStateEntry`: cobre todas as atividades do processo (não apenas a 1)?
- [ ] `setTaskUser`: o que acontece se o login não existe no Fluig?
- [ ] Integração Protheus: o que acontece se o Protheus está fora?
- [ ] Notificações: o que acontece se o email é inválido?

### Widgets Angular
- [ ] Cobertura de testes: componentes principais têm spec.ts?
- [ ] Loading state: há indicador de carregamento enquanto aguarda API?
- [ ] Estado vazio: há mensagem quando lista está vazia?
- [ ] Erro de API: há tratamento visual (mensagem de erro PO-UI)?
- [ ] Responsividade: usa grid PO-UI (não px fixo)?

## Formato de Saída

Para cada risco:
```
[ALTO|MÉDIO|BAIXO] Caso de borda: [descrição]
Cenário de risco: [o que pode acontecer]
Recomendação: [como mitigar]
```

Sumário final:
- Riscos altos: N
- Pronto para produção: SIM / NÃO
```

**Step 2: Commit**

```bash
git add agents/fluig-qa.md
git commit -m "feat: add fluig-qa subagent for quality analysis"
```

---

## Task 9: Subagent `fluig-deployer`

**Files:**
- Create: `agents/fluig-deployer.md`

**Step 1: Criar arquivo**

Conteúdo de `agents/fluig-deployer.md`:

```markdown
---
name: fluig-deployer
description: Executa deploy de artefatos Fluig no servidor via SSH ou REST API. Suporta dois modos: SSH (copia arquivos para VPS e reinicia container) e REST (upload via API Fluig com OAuth2). Requer confirmação antes de deploy em produção.
tools: Bash
model: haiku
---

# Fluig Deployer

Você é responsável pelo deploy de artefatos na plataforma TOTVS Fluig.

## IMPORTANTE: Confirmação Obrigatória

Antes de qualquer deploy, confirmar com o usuário:
1. Ambiente destino (dev/homologação/produção)
2. Lista de artefatos a serem deployados
3. Backup feito? (em produção, sempre exigir confirmação)

**NUNCA** deploy automático em produção sem confirmação explícita.

## Modo 1: SSH (VPS Hostinger)

### Verificar status do servidor
```bash
ssh vps_4_hostinger_fluig "docker ps --format 'table {{.Names}}\t{{.Status}}' | grep fluig"
```

### Verificar logs antes do deploy
```bash
ssh vps_4_hostinger_fluig "docker logs --tail 50 fluig"
```

### Copiar artefato (dataset/formulário/workflow)
```bash
# Para datasets
scp ./ds_exemplo.js vps_4_hostinger_fluig:/path/to/fluig/datasets/

# Para formulários (pasta completa)
scp -r "./256831 - Nome Formulario/" vps_4_hostinger_fluig:/path/to/fluig/forms/

# Para widgets (build Angular)
cd _node/wg_nome && npm run build
scp -r ./dist/wg-nome/ vps_4_hostinger_fluig:/path/to/fluig/widgets/wg_nome/
```

### Reiniciar container se necessário
```bash
ssh vps_4_hostinger_fluig "docker restart fluig"
```

### Verificar após deploy
```bash
ssh vps_4_hostinger_fluig "docker logs --tail 20 fluig"
```

## Modo 2: REST API Fluig

### Obter token OAuth2
```bash
TOKEN=$(curl -s -X POST "https://FLUIG_SERVER/api/oauth2/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&username=$FLUIG_USER&password=$FLUIG_PASS" \
  | jq -r '.access_token')
echo "Token: $TOKEN"
```

### Upload de artefato
```bash
curl -X POST "https://FLUIG_SERVER/api/public/2.0/documents/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@./ds_exemplo.js" \
  -F "description=Dataset Exemplo" \
  -F "parentId=0"
```

## Fluxo de Deploy Recomendado

1. Executar `fluig-reviewer` → sem problemas críticos?
2. Executar `fluig-qa` → riscos altos resolvidos?
3. Confirmar ambiente e lista de artefatos
4. Deploy via SSH ou REST
5. Verificar logs pós-deploy
6. Confirmar funcionamento no ambiente destino

## Variáveis de Ambiente Necessárias

```bash
# Para deploy SSH
FLUIG_VPS_HOST=vps_4_hostinger_fluig   # alias no ~/.ssh/config

# Para deploy REST
FLUIG_SERVER=https://seu-servidor-fluig.com.br
FLUIG_USER=admin
FLUIG_PASS=$FLUIG_PASS   # nunca hardcoded
```
```

**Step 2: Commit**

```bash
git add agents/fluig-deployer.md
git commit -m "feat: add fluig-deployer subagent for SSH and REST deploy"
```

---

## Task 10: Hooks de Validação

**Files:**
- Create: `hooks/hooks.json`

**Step 1: Criar arquivo**

```bash
mkdir -p hooks
```

Conteúdo de `hooks/hooks.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "file=$(echo \"$CLAUDE_TOOL_INPUT\" | jq -r '.file_path // .path // \"\"' 2>/dev/null); if [[ \"$file\" == *.js ]] && [[ \"$file\" != *.spec.js ]] && [[ \"$file\" != *.min.js ]]; then if ! grep -q 'try' \"$file\" 2>/dev/null; then echo \"⚠️  AVISO FLUIG: '$file' não tem try/catch. Adicione tratamento de erros.\"; fi; if grep -q 'alert(' \"$file\" 2>/dev/null; then echo \"❌ ERRO FLUIG: '$file' usa alert() nativo. Use Swal.fire() (SweetAlert2).\"; fi; fi"
          }
        ]
      }
    ]
  }
}
```

**Step 2: Testar hook**

Criar um arquivo JS de teste e verificar que o hook dispara:

```bash
claude --plugin-dir . --print "create a file /tmp/test-hook.js with: function test() { alert('hello'); }"
```

Expected: Aviso no output sobre `alert()` e ausência de `try/catch`.

**Step 3: Commit**

```bash
git add hooks/hooks.json
git commit -m "feat: add post-edit hooks for Fluig JS validation"
```

---

## Task 11: README e Atualizar CLAUDE.md

**Files:**
- Create: `README.md`
- Modify: `CLAUDE.md`

**Step 1: Criar README.md**

```markdown
# Fluig Plugin — Claude Code

Plugin Claude Code para desenvolvimento na plataforma **TOTVS Fluig**.

## Instalação

### Opção 1: `--plugin-dir` (sem instalar)
```bash
claude --plugin-dir /path/to/fluig-plugin
```

### Opção 2: No projeto (via Bitbucket)
```bash
cd /seu/projeto/fluig
git clone git@bitbucket-totvs:fabricatbc/claude_skills.git .claude/skills
echo ".claude/skills/" >> .gitignore
```

## Skills Disponíveis

| Comando | Descrição |
|---------|-----------|
| `/fluig:form` | Scaffolding de formulário HTML + events/ + Util/ |
| `/fluig:dataset` | Scaffolding de dataset JavaScript |
| `/fluig:widget` | Scaffolding de widget Angular 19 + PO-UI |
| `/fluig:workflow` | Scaffolding de script BPM/evento |
| `/fluig:api-ref` | Referência das APIs Fluig (DatasetFactory, CardAPI, etc.) |

## Subagents Disponíveis

| Agent | Uso |
|-------|-----|
| `fluig-reviewer` | `"use fluig-reviewer to review @ds_exemplo.js"` |
| `fluig-qa` | `"use fluig-qa to analyze @events/validateForm.js"` |
| `fluig-deployer` | `"use fluig-deployer to deploy ds_exemplo.js to dev"` |

## Hooks

Validação automática após edição de arquivos `.js`:
- Detecta ausência de `try/catch`
- Detecta uso de `alert()` nativo (deve ser SweetAlert2)

## Fluxo de Desenvolvimento Recomendado

1. **Criar artefato:** usar skill (`/fluig:dataset`)
2. **Revisar:** `"use fluig-reviewer to review @artefato.js"`
3. **QA:** `"use fluig-qa to analyze @artefato.js"`
4. **Deploy:** `"use fluig-deployer to deploy to dev"`
```

**Step 2: Atualizar CLAUDE.md** (arquivo existente em `CLAUDE.md`):

Adicionar seção com namespace das skills e fluxo de uso.

**Step 3: Commit final**

```bash
git add README.md CLAUDE.md
git commit -m "docs: add README and update CLAUDE.md with plugin usage"
```

---

---

## Task 12: Marketplace Privado no Bitbucket (`claude_skills`)

**Files:**
- Create: `/home/jv/developments/tbc/claude_skills/.claude-plugin/marketplace.json`
- Modify: `/home/jv/developments/tbc/claude_skills/README.md` (adicionar seção de instalação via marketplace)

> **Contexto:** O repositório `claude_skills` no Bitbucket (`git@bitbucket.org:fabricatbc/claude_skills.git`) já existe e é privado. O controle de acesso ao marketplace é feito pelas permissões do Bitbucket — quem não tem acesso ao repo não consegue adicionar o marketplace.

**Step 1: Copiar o plugin fluig para dentro do claude_skills**

```bash
# Copiar o plugin completo para dentro do repo claude_skills
cp -r /home/jv/developments/claude-code-plugins-custon/fluig/ \
      /home/jv/developments/tbc/claude_skills/fluig/

# Verificar estrutura copiada
ls /home/jv/developments/tbc/claude_skills/fluig/
```

Expected: diretório `fluig/` com `.claude-plugin/`, `skills/`, `agents/`, `hooks/`, `README.md`.

**Step 2: Criar o arquivo de marketplace**

```bash
mkdir -p /home/jv/developments/tbc/claude_skills/.claude-plugin
```

Conteúdo de `/home/jv/developments/tbc/claude_skills/.claude-plugin/marketplace.json`:

```json
{
  "name": "claude-skills-tbc",
  "owner": {
    "name": "TBC - Time de Desenvolvimento",
    "email": "dev@tbc.com.br"
  },
  "metadata": {
    "description": "Plugins Claude Code para desenvolvimento TOTVS (Fluig e Protheus) — TBC",
    "pluginRoot": "."
  },
  "plugins": [
    {
      "name": "fluig",
      "source": "./fluig",
      "description": "Plugin completo para desenvolvimento TOTVS Fluig — scaffolding de formulários, datasets, widgets e workflows BPM, revisão de código, análise QA e deploy.",
      "version": "1.0.0",
      "author": {
        "name": "TBC - Time de Desenvolvimento"
      },
      "category": "development",
      "tags": ["fluig", "totvs", "bpm", "angular", "po-ui"]
    }
  ]
}
```

**Step 3: Validar o marketplace localmente**

```bash
cd /home/jv/developments/tbc/claude_skills
claude plugin validate .
```

Expected: `✅ Marketplace valid. 1 plugin found: fluig`

**Step 4: Testar adicionando o marketplace local**

```bash
# Dentro do Claude Code:
# /plugin marketplace add /home/jv/developments/tbc/claude_skills
# /plugin install fluig@claude-skills-tbc
```

Expected: Plugin `fluig` aparece instalado, skills `/fluig:*` disponíveis.

**Step 5: Commit e push para Bitbucket**

```bash
cd /home/jv/developments/tbc/claude_skills

git add .claude-plugin/marketplace.json
git add fluig/
git commit -m "feat: add fluig plugin and marketplace.json for Claude Code distribution"
git push origin main
```

**Step 6: Verificar instalação remota**

Testar do zero em outra sessão:

```bash
# Usando SSH (chave configurada)
/plugin marketplace add git@bitbucket.org:fabricatbc/claude_skills.git

# Ou HTTPS
/plugin marketplace add https://bitbucket.org/fabricatbc/claude_skills.git

# Instalar o plugin
/plugin install fluig@claude-skills-tbc
```

Expected: Plugin instalado corretamente a partir do Bitbucket privado.

**Step 7: Configurar auto-instalação no projeto CASSI (opcional)**

Adicionar ao `.claude/settings.json` do projeto `cassi_fluig` para que o time seja solicitado a instalar automaticamente:

```json
{
  "extraKnownMarketplaces": {
    "claude-skills-tbc": {
      "source": {
        "source": "url",
        "url": "git@bitbucket.org:fabricatbc/claude_skills.git"
      }
    }
  },
  "enabledPlugins": {
    "fluig@claude-skills-tbc": true
  }
}
```

**Step 8: Documentar instalação no README do claude_skills**

Adicionar seção no `/home/jv/developments/tbc/claude_skills/README.md`:

```markdown
## Instalação via Marketplace Claude Code (Recomendado)

### Pré-requisito: acesso ao repositório Bitbucket
```bash
# Verificar acesso
git ls-remote git@bitbucket.org:fabricatbc/claude_skills.git
```

### Adicionar o marketplace
```bash
# Via SSH (recomendado)
/plugin marketplace add git@bitbucket.org:fabricatbc/claude_skills.git

# Via HTTPS
/plugin marketplace add https://bitbucket.org/fabricatbc/claude_skills.git
```

### Instalar o plugin Fluig
```bash
/plugin install fluig@claude-skills-tbc
```

### Atualizações automáticas
Para atualizações automáticas na inicialização, configurar:
```bash
# ~/.bashrc ou ~/.zshrc
export BITBUCKET_TOKEN=seu_app_password_aqui
```

Gerar App Password em: Bitbucket → Settings → App passwords → Permissão: Repositories (Read)
```

**Step 9: Commit final**

```bash
cd /home/jv/developments/tbc/claude_skills
git add README.md
git commit -m "docs: add marketplace installation instructions to README"
git push origin main
```

---

## Critérios de Aceitação

1. `claude --plugin-dir . --print "list available skills"` → mostra as 5 skills com namespace `fluig:`
2. `/fluig:dataset` → gera JS completo com `defineStructure`, `createDataset`, `try/catch`, `log.info/error`
3. `/fluig:form` → gera estrutura completa de pastas com HTML + 4 eventos + Util/ + Lib/
4. `/fluig:widget` → gera scaffold Angular 19 com PO-UI e estrutura components/pages/services
5. `/fluig:workflow` → gera script de evento correto com template do evento solicitado
6. `fluig-reviewer` → identifica código sem `try/catch` e com `alert()` nativo
7. `fluig-qa` → identifica casos de borda não tratados
8. Hook → avisa sobre JS sem `try/catch` após edição
9. `/plugin marketplace add git@bitbucket.org:fabricatbc/claude_skills.git` → marketplace `claude-skills-tbc` adicionado com sucesso
10. `/plugin install fluig@claude-skills-tbc` → plugin instalado, skills e agents disponíveis
