# Wish: KeePass Merge Guiado com Teste de Credenciais

| Field | Value |
|-------|-------|
| **Status** | DRAFT |
| **Slug** | `keepass-merge` |
| **Date** | 2026-04-27 |
| **Author** | Rodrigo Gonçalves |
| **Appetite** | Medium (2-3 sessões) |
| **Branch** | `wish/keepass-merge` |
| **Design** | [DESIGN.md](../../brainstorms/keepass-merge/DESIGN.md) |

## Summary

O usuário acumula entradas duplicadas para o mesmo site num banco KeePass. Esta wish adiciona o subcomando `merge` à skill keepass: detecta pares por similaridade de URL + título, testa credenciais via Playwright headless, e guia o merge campo a campo — movendo a entrada perdedora para a Lixeira.

## Scope

### IN

- Novo subcomando `merge [--db <alias>] [--threshold <0-100>]` no `commands/keepass.md` e em `skills/keepass/SKILL.md`
- Detecção de pares duplicados por domínio base da URL + fuzzy match de título (threshold padrão: 70)
- Teste de credenciais via Playwright headless (script bash que invoca `playwright`)
- Resolução interativa campo a campo para campos conflitantes
- Merge final: `keepassxc-cli edit` na vencedora + `keepassxc-cli rm` na perdedora → Lixeira
- Tratamento de casos ambíguos: ambas válidas, nenhuma válida, site incompatível (OAuth/captcha/TOTP)

### OUT

- Merge entre bancos diferentes
- Interface gráfica ou TUI
- Detecção por critérios além de URL + título (tags, notas, ícone)
- Automação total sem confirmação humana
- Suporte a Windows nativo (já fora do escopo da skill)

## Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Detecção por URL (domínio base) + título (fuzzy, threshold 70) | Melhor sinal de duplicata; threshold configurável evita falsos positivos |
| 2 | Playwright headless para teste de credenciais | Testa o login real no site; aceito risco de lockout conscientemente |
| 3 | Ambas válidas → usuário escolhe a vencedora | Pode haver 2 contas legítimas para o mesmo site |
| 4 | Nenhuma válida → abortar par sem modificar banco | Sem dados confiáveis para decidir qual descartar |
| 5 | OAuth/captcha/TOTP → aviso + fallback para escolha manual | Impossível automatizar; informar e continuar |
| 6 | Perdedora → Lixeira (`keepassxc-cli rm`) | Reversível; segurança contra erro humano |

## Success Criteria

- [ ] `/keepass merge --db pessoal` lista todos os pares com URL+título similares no banco
- [ ] Playwright testa credenciais e reporta: ✅ válida / ❌ inválida / ⚠️ incompatível
- [ ] Ambas válidas → usuário escolhe interativamente a entrada vencedora
- [ ] Nenhuma válida → par marcado como "não resolvido", banco não modificado
- [ ] Site incompatível → aviso exibido, fallback para escolha manual
- [ ] Campos idênticos preservados; campos conflitantes resolvidos campo a campo pelo usuário
- [ ] Após confirmação: vencedora atualizada via `edit`, perdedora na Lixeira via `rm`
- [ ] Perdedora encontrável em `Recycle Bin/` após merge
- [ ] Fluxo nunca modifica o banco sem confirmação explícita do usuário
- [ ] Aviso de lockout exibido antes de iniciar testes Playwright

## Execution Strategy

| Group | Agent | Description |
|-------|-------|-------------|
| 1 | engineer | Detecção de duplicatas + estrutura base do subcomando `merge` |
| 2 | engineer | Integração Playwright para teste de credenciais |
| 3 | engineer | Merge guiado campo a campo + operações de escrita no banco |

---

## Execution Groups

### Group 1: Detecção de Duplicatas e Estrutura do Subcomando

**Goal:** Implementar a lógica de detecção de pares candidatos ao merge e o esqueleto interativo do subcomando `merge`.

**Deliverables:**
1. Função `detect_duplicates()` em bash: lista entradas do banco, agrupa por domínio base da URL, aplica fuzzy match de título com threshold configurável
2. Saída formatada dos pares candidatos (numerados, com título, URL, username de cada entrada)
3. Prompt interativo para o usuário confirmar quais pares processar
4. Integração do subcomando `merge` em `commands/keepass.md` (parsing de args `--db`, `--threshold`)
5. Stub de saída para Grupo 2 (função `test_credentials()` com assinatura definida mas retorno mockado)

**Acceptance Criteria:**
- [ ] Com banco contendo entradas duplicadas, `merge --db <alias>` lista os pares corretamente
- [ ] Com threshold 70, entradas com título similar (ex: "Google" e "Google Account") são agrupadas
- [ ] Entradas com URLs de domínios distintos não aparecem como par
- [ ] Usuário pode selecionar subset de pares para processar (ex: digitar "1,3" para pares 1 e 3)
- [ ] Se nenhum par encontrado, exibe mensagem e encerra sem erro

**Validation:**
```bash
# Executar busca manual num banco com duplicatas conhecidas e verificar output
/keepass merge --db pessoal --threshold 70
```

**depends-on:** none

---

### Group 2: Integração Playwright para Teste de Credenciais

**Goal:** Implementar o teste real de credenciais via Playwright headless, substituindo o stub do Grupo 1.

**Deliverables:**
1. Script `test_login.js` (Node.js + Playwright) que recebe URL, username, password via stdin e retorna: `valid`, `invalid`, `incompatible`, ou `error:<msg>`
2. Função bash `test_credentials()` que invoca o script e interpreta o resultado
3. Detecção de incompatibilidade: OAuth redirect, captcha visível, campo TOTP obrigatório
4. Aviso de risco de lockout exibido antes do primeiro teste de cada par
5. Atualização de `commands/keepass.md` com dependência de Playwright documentada

**Acceptance Criteria:**
- [ ] Credencial válida no site real retorna `valid`
- [ ] Credencial inválida retorna `invalid` (não trava nem lança exceção)
- [ ] Site com OAuth (ex: "Sign in with Google") retorna `incompatible`
- [ ] Se Playwright não estiver instalado, erro claro com instrução de instalação
- [ ] Aviso de risco é exibido antes de iniciar testes de cada par

**Validation:**
```bash
node test_login.js --url "https://github.com" --user "testuser" --pass "wrongpass" 2>&1
# esperado: invalid
```

**depends-on:** Group 1

---

### Group 3: Merge Guiado Campo a Campo e Escrita no Banco

**Goal:** Implementar o fluxo completo de resolução de conflitos e a escrita final no banco (edit + rm).

**Deliverables:**
1. Função `show_side_by_side()`: exibe os dois lados do par com resultado do teste Playwright integrado
2. Seleção da entrada vencedora quando ambas são válidas (ou fallback manual)
3. Resolução campo a campo para conflitos (title, username, password, url, notes)
4. Confirmação final antes de gravar ("Confirma merge? [s/n]")
5. `keepassxc-cli edit` na vencedora com os campos resolvidos
6. `keepassxc-cli rm` na perdedora → Lixeira
7. Relatório final: pares processados, pares abortados, entradas movidas para Lixeira

**Acceptance Criteria:**
- [ ] Campos idênticos entre as duas entradas são preservados automaticamente sem prompt
- [ ] Para cada campo conflitante, usuário escolhe entre valor A, valor B, ou digita um novo
- [ ] Confirmação é obrigatória antes de qualquer escrita no banco
- [ ] Após merge bem-sucedido, `keepassxc-cli search <termo>` mostra 1 entrada (não 2)
- [ ] Após merge, entrada perdedora está em `Recycle Bin/` no banco
- [ ] Se KeePassXC desktop estiver aberto, operação é abortada com mensagem clara
- [ ] Relatório final lista todos os pares processados e seus desfechos

**Validation:**
```bash
# Verificar que entrada perdedora está na Lixeira
/keepass list --db pessoal | grep "Recycle Bin"
# Verificar que sobrou apenas 1 entrada para o termo mesclado
/keepass search <termo-mesclado> --db pessoal
```

**depends-on:** Group 2

## Assumptions / Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Rate limiting / bloqueio de conta por testes automáticos | High | Aviso exibido antes; testar um par por vez |
| Site muda estrutura do formulário de login | Medium | Falha de Playwright → fallback `incompatible` |
| Entradas com TOTP obrigatório no login | Medium | Detectar campo TOTP → marcar como `incompatible` |
| Playwright não instalado no ambiente | Medium | Verificar no início; instruir instalação |
| KeePassXC desktop aberto durante escrita | High | Verificação já existente em `run_on_db` — bloqueia antes |
| Fuzzy match gera falsos positivos | Low | Threshold configurável; usuário confirma pares antes |
