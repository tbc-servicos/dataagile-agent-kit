# Processo de Release — dataagile-agent-kit

Versionamento e publicação dos plugins do marketplace `claude-skills-dataagile`.

## Esquema de versão

- **Tag por plugin:** `<plugin>-vX.Y.Z` — ex.: `protheus-v2.0.9`, `fluig-v2.0.6`.
  Cada plugin versiona de forma independente (SemVer): PATCH = fix, MINOR = feature, MAJOR = breaking.
- A versão de cada plugin vive em **dois lugares** e deve bater:
  - `<plugin>/.claude-plugin/plugin.json` → `"version"`
  - `.claude-plugin/marketplace.json` → entrada do plugin → `"version"`
- `CHANGELOG.md` (raiz) é o histórico rollup do kit.
- O **badge de versão do `README.md`** rastreia esse rollup do kit — nunca a versão de um
  plugin. Ao abrir uma entrada nova no `CHANGELOG.md`, atualize o badge junto.

## Fluxo (obrigatório: issue → PR → tag → release)

1. **Abrir issue** detalhando a melhoria/correção.
2. **Branch + PR** referenciando a issue (`Closes #N`):
   - bump da versão do(s) plugin(s) em `plugin.json` + `marketplace.json`;
   - entrada no `CHANGELOG.md`.
3. **Merge** do PR na `main`.
4. **Tag + push:** `git tag <plugin>-vX.Y.Z && git push origin <plugin>-vX.Y.Z`.
5. O workflow `.github/workflows/release.yml` **cria a GitHub Release** automaticamente no push da tag.

## Consumidores

Após a release, os usuários atualizam:
```bash
claude plugin marketplace update claude-skills-dataagile
claude plugin update <plugin>@claude-skills-dataagile
```
e reiniciam o Claude Code.
