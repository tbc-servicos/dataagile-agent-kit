# Camadas no widget Angular + PO-UI — esqueleto e SOLID

Referência da skill `/fluig:clean-architecture`. Código em Angular moderno (standalone,
`inject()`, signals) — **sem versão fixa**: confirme padrões atuais via MCP do Angular CLI
(`get_best_practices`) e componentes via MCP do PO-UI antes de gerar.

## Estrutura de pastas (screaming architecture)

Organize por **assunto de negócio**, não por tipo técnico:

```
src/app/
├── aprovacao/                     ← contexto/feature
│   ├── domain/                    ← regra pura (TS sem Angular)
│   │   ├── politica-desconto.ts
│   │   └── politica-desconto.spec.ts   ← Jasmine puro, sem TestBed
│   ├── data/                      ← adaptadores de dados
│   │   ├── pedidos-api.service.ts      ← só HTTP/DatasetFactory
│   │   └── pedidos.repository.ts       ← abstração (classe abstrata/token)
│   ├── aprovacao.service.ts       ← caso de uso (estado + orquestração)
│   └── pages/aprovacao-page/      ← PO-UI: po-table, po-modal…
└── shared/                        ← VOs e utilitários REALMENTE comuns
```

## Camada 1 — Domínio (TS puro)

```typescript
// domain/politica-desconto.ts — zero imports de framework
export interface DecisaoDesconto {
  percentual: number;
  requerSupervisao: boolean;
  motivo?: string;
}

export function decidirDesconto(
  percentualNegociado: number,
  tetoAlcada: number,
  contratoVigente: boolean,
): DecisaoDesconto {
  if (!contratoVigente) {
    return { percentual: 0, requerSupervisao: false, motivo: 'Sem contrato vigente' };
  }
  return {
    percentual: percentualNegociado,
    requerSupervisao: percentualNegociado > tetoAlcada,
    motivo: percentualNegociado > tetoAlcada ? 'Excede alçada' : undefined,
  };
}
```

Spec correspondente roda **sem TestBed** (rápido, sem mock de HTTP):

```typescript
it('bloqueia para supervisão acima da alçada', () => {
  const d = decidirDesconto(20, 15, true);
  expect(d.requerSupervisao).toBeTrue();
});
```

## Camada 2 — Adapter de dados (DIP com a DI do Angular)

```typescript
// data/pedidos.repository.ts — a ABSTRAÇÃO que o caso de uso conhece
export abstract class PedidosRepository {
  abstract listarPendentes(): Observable<Pedido[]>;
  abstract aprovar(id: string, decisao: DecisaoDesconto): Observable<void>;
}

// data/pedidos-api.service.ts — a implementação concreta (só tradução HTTP)
@Injectable()
export class PedidosApiService extends PedidosRepository {
  private http = inject(HttpClient);
  listarPendentes(): Observable<Pedido[]> {
    return this.http.get<PedidoDto[]>('/api/pedidos?status=pendente')
      .pipe(map(dtos => dtos.map(paraPedido)));   // DTO ≠ modelo do domínio
  }
  // ...
}

// no provider da feature:
{ provide: PedidosRepository, useClass: PedidosApiService }
```

- O caso de uso injeta `PedidosRepository` (abstração). Teste injeta um fake — sem
  `HttpTestingController` para testar regra.
- Trocar REST → dataset Fluig (`DatasetFactory`) = trocar a implementação registrada.
  Nenhum componente ou regra muda.

## Camada 3 — Caso de uso (service de aplicação)

```typescript
@Injectable()
export class AprovacaoService {
  private repo = inject(PedidosRepository);
  readonly pedidos = signal<Pedido[]>([]);
  readonly carregando = signal(false);

  carregar(): void { /* repo.listarPendentes() → pedidos.set(...) */ }

  aprovar(pedido: Pedido, tetoAlcada: number): Observable<void> {
    const decisao = decidirDesconto(pedido.percentual, tetoAlcada, pedido.contratoVigente);
    return this.repo.aprovar(pedido.id, decisao);
  }
}
```

Note: a decisão vem do **domínio**; o service só coordena e expõe estado. Nada de regra
no componente, nada de HTTP aqui.

## Camada 4 — Apresentação (PO-UI)

```typescript
@Component({ /* po-table, po-modal — consulte o MCP do PO-UI para inputs/outputs */ })
export class AprovacaoPageComponent {
  protected svc = inject(AprovacaoService);
  // template liga em svc.pedidos() e chama svc.aprovar(...) — só isso
}
```

Componente dumb: sem `HttpClient`, sem `DatasetFactory`, sem cálculo. Notificação de
resultado via `PoNotificationService` (convenção do plugin) fica AQUI (apresentação),
nunca no service de dados.

## SOLID rápido no Angular

| Princípio | Aplicação | Violação típica |
|---|---|---|
| SRP | 1 service = 1 assunto; componente só apresenta | `*Component` com 400 linhas e 3 `subscribe` aninhados |
| OCP | estratégia via token de DI (`provide`) | `switch (tipo)` repetido em N componentes |
| LSP | implementações honram a abstração | fake do teste diverge do contrato real |
| ISP | abstrações por papel (`ConsultaPedidos` ≠ `AprovaPedidos`) | `ApiService` gordo injetado em tudo |
| DIP | componente→service→abstração; concreta só no provider | `inject(HttpClient)` em componente |

## Checklist de review (widget)

- [ ] Nenhum componente injeta `HttpClient`/chama `DatasetFactory`
- [ ] `domain/` sem imports de `@angular/*`/`@po-ui/*` e com spec Jasmine puro
- [ ] DTO da API convertido em modelo próprio no adapter (não circula cru)
- [ ] Estado no service (signal/observable) — componente não guarda cópia mutável
- [ ] Versões do `package.json` respeitadas — sem downgrade/upgrade implícito no código gerado
- [ ] Componentes PO-UI conferidos no MCP (`get_component_docs`) — nada de input inventado
