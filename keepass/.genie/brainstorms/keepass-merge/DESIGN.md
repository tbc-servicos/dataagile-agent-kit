# Design: KeePass Merge Guiado

| Field | Value |
|-------|-------|
| **Slug** | `keepass-merge` |
| **Date** | 2026-04-27 |
| **WRS** | 100/100 |

## Problem

O usuário acumula múltiplas entradas para o mesmo site num banco KeePass e precisa de
uma função guiada que detecte duplicatas, teste as credenciais no site real via Playwright
e consolide as entradas em uma só, movendo a descartada para a Lixeira.

## Scope

### IN
- Novo subcomando `merge` no comando `/keepass` (e na skill)
- Fase 1 — Detecção: busca entradas com URL + título similares dentro de **um único banco**
- Fase 2 — Teste: abre o formulário de login no site via Playwright e testa cada credencial
- Fase 3 — Merge guiado: exibe entradas lado a lado, o usuário escolhe campos conflitantes
- Entrada vencedora é atualizada via `keepassxc-cli edit`; perdedora vai para Lixeira (`rm`)
- Casos ambíguos tratados: ambas válidas (usuário escolhe), nenhuma válida (abortar par),
  site incompatível OAuth/captcha (aviso + fallback para escolha manual)

### OUT
- Merge entre bancos diferentes
- Detecção de duplicatas por critérios além de URL + título (ex: notas, tags)
- Interface gráfica / TUI — apenas output texto interativo no terminal
- Automação total sem interação humana (sempre há passo de confirmação antes do merge)
- Correção automática de Keychain ou config

## Approach

**Fluxo em 3 fases sequenciais:**

```
/keepass merge [--db <alias>] [--threshold <0-100>]

Fase 1 — Detecção
  └─ list todas as entradas do banco
  └─ agrupar por domínio base da URL (ex: accounts.google.com → google.com)
  └─ dentro de cada grupo, comparar títulos com fuzzy match (threshold padrão: 70)
  └─ exibir pares candidatos numerados para o usuário confirmar quais processar

Fase 2 — Teste de credenciais (Playwright)
  └─ para cada par confirmado:
     └─ abrir página de login via Playwright headless
     └─ preencher username + password de cada entrada
     └─ detectar resultado: success / failure / incompatível
     └─ reportar resultado por entrada

Fase 3 — Merge guiado
  └─ exibir entradas lado a lado com resultado do teste
  └─ campos idênticos: mantidos automaticamente
  └─ campos conflitantes: usuário escolhe qual valor usar
  └─ confirmar antes de gravar
  └─ keepassxc-cli edit → vencedora atualizada
  └─ keepassxc-cli rm → perdedora → Lixeira
```

**Alternativas consideradas:**

- *Escolha manual sem teste Playwright*: mais simples, mas o usuário teria que lembrar qual
  senha é a correta — derrotado pela proposta.
- *Merge totalmente automático (sem interação)*: risco de perda de dados — rejeitado; sempre
  há confirmação antes de gravar.

## Decisions

| Decisão | Rationale |
|---------|-----------|
| Detecção por URL + título (fuzzy) | Melhor sinal de duplicata real; evita falsos positivos por título genérico |
| Playwright para teste de credenciais | Testa o login real, não apenas valida formato da senha |
| Aceitar risco de lockout sem proteção extra | Usuário escolheu consciente; aviso exibido antes |
| OAuth/captcha → skip + aviso | Não há como automatizar; informar e passar para escolha manual |
| Ambas válidas → usuário escolhe | Pode haver motivo legítimo para manter ambas (ex: 2 contas) |
| Nenhuma válida → abortar par | Sem dados confiáveis para decidir qual descartar |
| Perdedora → Lixeira (não deleção permanente) | Reversível; segurança contra erro humano |
| Threshold de similaridade configurável | Sites com subdomínios diferentes podem ser a mesma coisa ou não |

## Risks & Assumptions

| Risk | Severity | Mitigation |
|------|----------|------------|
| Rate limiting / bloqueio de conta | High | Aviso explícito antes de iniciar testes; testar um par por vez |
| Site muda estrutura do formulário de login | Medium | Detectar falha de Playwright como "incompatível" e fazer fallback manual |
| Entradas com TOTP obrigatório | Medium | Detectar campos TOTP na entrada e marcar como incompatível para teste auto |
| keepassxc-cli não suporta todos os campos | Low | Usar apenas campos suportados pela CLI (title, username, password, url, notes) |
| KeePassXC desktop aberto durante escrita | High | Verificação já existe em `run_on_db` — bloqueia antes de `edit`/`rm` |
| Playwright não instalado | Medium | Verificar dependência no início; instruir instalação se ausente |
| Fuzzy match gera falsos positivos | Low | Threshold configurável; usuário confirma pares antes do teste |

## Success Criteria

- [ ] `/keepass merge --db pessoal` lista todos os pares de entradas com URL+título similares
      dentro do banco `pessoal`, agrupados por domínio
- [ ] Para cada par confirmado, Playwright testa as credenciais e reporta: ✅ válida / ❌ inválida
      / ⚠️ incompatível (OAuth, captcha, TOTP)
- [ ] Se ambas as credenciais funcionam, o usuário escolhe a entrada vencedora interativamente
- [ ] Se nenhuma funciona, o par é marcado como "não resolvido" e pulado sem modificar o banco
- [ ] Se o site é incompatível com teste automático, o usuário escolhe manualmente a vencedora
- [ ] Campos idênticos são preservados automaticamente; campos conflitantes são resolvidos
      campo a campo pelo usuário
- [ ] Após confirmação: `keepassxc-cli edit` atualiza a vencedora e `keepassxc-cli rm` move
      a perdedora para a Lixeira
- [ ] A entrada perdedora é encontrável em `Recycle Bin/` após o merge
- [ ] O fluxo nunca modifica o banco sem confirmação explícita do usuário
