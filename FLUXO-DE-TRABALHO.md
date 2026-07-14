# Fluxo de trabalho — Protheus e Fluig

> Mapa visual de **como o dev deve trabalhar** com os plugins, onde cada gate acontece
> e **onde `/clean-architecture` e `/ddd` entram**. Os diagramas são Mermaid — o GitHub
> renderiza nativamente.

## Visão geral (mapa mental)

```mermaid
mindmap
  root((Desenvolvimento<br/>com os plugins))
    Design — O QUE construir
      /protheus:brainstorm · /fluig:brainstorm
        DDD estratégico → /ddd
          Linguagem ubíqua com o cliente
          Bounded contexts
          Context map e ACL nas integrações
      /protheus:plan · /fluig:plan
        Tasks com ID T1, T2…
        Task de teste por artefato
      Alternativa: /protheus:advpl-tlpp-sdd
        Specify → Design → Tasks → Execute
    Estrutura — COMO organizar
      /clean-architecture
        Regra de dependência
        Camadas: adaptador → caso de uso → regra pura → repositório
        SOLID aplicado ao stack
    Implementação
      /implement — Agent Team
        TDD test-first
        Worktree isolado
        Gate do ORQUESTRADOR
      Skills geradoras
        writer · mvc-generator · fwrest/rest-generator
        widget · dataset · form · workflow
    Qualidade — gates mecânicos
      Lint hook bloqueante em toda gravação
      Unitário: karma check ≥70% no fluig
      Reviews: spec + código + critérios estruturais
      gates.json — fonte de verdade entre skills
      refactor-method-complexity-reduce p/ complexidade
    Entrega
      deploy — lê gates.json
      qa — E2E Playwright, critério VERIFICÁVEL
      verify — checklist final
```

## Protheus — pipeline completo

```mermaid
flowchart TD
    A["🧠 /protheus:brainstorm<br/>design + <b>/protheus:ddd</b><br/>(linguagem ubíqua, contextos,<br/>agregados, ACL)"] -->|design aprovado<br/>HARD GATE| B["📋 /protheus:plan<br/>tasks T1..Tn + task de teste<br/>estrutura definida com<br/><b>/protheus:clean-architecture</b><br/>(camadas por caso de uso)"]
    B --> C["⚙️ /protheus:implement — Agent Team<br/>implementa nas camadas<br/>regra pura testável por unidade"]
    C -->|"grava gates.json"| D["🔍 Reviews<br/>spec-reviewer: task T tem teste T?<br/>reviewer: convenções + <b>critérios estruturais</b><br/>(mistura de camadas = CRÍTICO)"]
    D -->|"máx. 3 ciclos de correção"| E["🚀 /protheus:deploy<br/>HARD GATE lê gates.json<br/>lint + compila + patch .ptm"]
    E --> F["🧪 /protheus:qa → test-web<br/>E2E <b>Playwright</b> (engine oficial —<br/>TIR só como regressão CI opcional)<br/>rotina aberta via runner <b>dev.tools.U_Run_Aplica</b><br/>(fsttst.tlpp compilado no ambiente)<br/>TC com critério VERIFICÁVEL<br/>ALTO = lista fechada"]
    F --> G["✅ /protheus:verify<br/>checklist TOTVS + produção"]

    H["⚡ Atalho ad-hoc<br/>writer · specialist · compile"] -.->|"SÓ para: 1 fonte, <50 linhas,<br/>sem regra de negócio nova"| E

    style A fill:#e8f0fe,stroke:#4285f4,color:#000
    style C fill:#fef7e0,stroke:#f9ab00,color:#000
    style F fill:#e6f4ea,stroke:#34a853,color:#000
```

**Onde cada skill de arquitetura entra:**

| Momento | Skill | O que ela responde |
|---|---|---|
| Brainstorm (antes de codar) | **`/protheus:ddd`** | *O que* construir: glossário com o key-user, 1 contexto = 1 namespace, invariantes de agregado (alinhado ao ExecAuto), ACL nas integrações |
| Plan/Implement | **`/protheus:clean-architecture`** | *Como* organizar: endpoint/PE fino → caso de uso → regra pura (testável por unidade, sem banco) → repositório (BeginSQL/ExecAuto) |
| Review | Ambas | Checklists estruturais dos reviewers apontam para as `references/` das duas skills; `/protheus:refactor-method-complexity-reduce` automatiza a extração de métodos |
| Legado | `/protheus:migrate` | Procedural → TLPP OO com SRP/Repository (usa os dois guias) |

## Fluig — pipeline completo

```mermaid
flowchart TD
    A["🧠 /fluig:brainstorm<br/>design + <b>/fluig:ddd</b><br/>(processo BPM = bounded context,<br/>card = agregado, ACL p/ ERP)"] -->|design aprovado| B["📋 /fluig:plan<br/>tasks T1..Tn com spec Jasmine por task<br/>estrutura com <b>/fluig:clean-architecture</b><br/>(component → service → domínio → adapter)"]
    B --> C["⚙️ /fluig:implement — Agent Team<br/>TDD: spec falha → implementa → verde<br/>widget · dataset · form · workflow"]
    C -->|"GATE MECÂNICO (orquestrador):<br/>npm test + karma check ≥70%<br/>(karma.conf.template.js)"| D["🔍 Reviews<br/>spec + código + estruturais<br/>(component com HttpClient = CRÍTICO,<br/>god-dataset = CRÍTICO)"]
    D -->|"máx. 3 ciclos<br/>grava gates.json"| E["🚀 /fluig:deploy<br/>HARD GATE lê gates.json<br/>SSH/REST no servidor Fluig"]
    E --> F["🧪 /fluig:qa<br/>E2E <b>Playwright</b> no widget publicado<br/>sem E2E? gera via /fluig:test<br/>(nunca aprova vazio)"]
    F --> G["✅ /fluig:verify<br/>lê o sumário do QA + produção"]

    style A fill:#e8f0fe,stroke:#4285f4,color:#000
    style C fill:#fef7e0,stroke:#f9ab00,color:#000
    style F fill:#e6f4ea,stroke:#34a853,color:#000
```

**Onde cada skill de arquitetura entra:**

| Momento | Skill | O que ela responde |
|---|---|---|
| Brainstorm | **`/fluig:ddd`** | Linguagem ubíqua materializada no diagrama BPM/formulário; documento do processo como agregado (client valida UX, **evento server é a autoridade**); falha de integração modelada |
| Plan/Implement | **`/fluig:clean-architecture`** | Widget em camadas (DI do Angular = DIP; componente nunca injeta HttpClient); dataset/evento como adaptador fino com regra pura separada |
| Review | Ambas | Categoria estrutural dos reviewers referencia as `references/` das skills |

## Os gates em uma linha cada

| Gate | Mecanismo | Quem garante |
|---|---|---|
| Lint em toda gravação | hook PostToolUse (`exit 2` bloqueia) | máquina |
| Unitário (fluig) | karma `check ≥70%` — `npm test` falha sozinho | máquina (orquestrador re-executa) |
| Reviews (spec + código) | teto de 3 ciclos, critérios estruturais | agente sonnet |
| Estado entre skills | `docs/plans/<plan>.gates.json` | arquivo (fonte de verdade) |
| E2E | Playwright com critério VERIFICÁVEL por TC | máquina + evidência |

> **Regra de ouro:** DDD decide *o que* construir (modelo do negócio), Clean Architecture
> decide *como* organizá-lo (camadas testáveis) — e os gates garantem que o que passou
> foi **provado**, não afirmado.
