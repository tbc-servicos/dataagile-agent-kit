'use strict';
// SessionStart hook: injeta o catalogo de skills Fluig.
// Catalogo gerado dinamicamente do frontmatter de skills/*/SKILL.md —
// nao ha lista hardcoded para manter. Ver session-context-lib.cjs.
const path = require('path');
const emitSessionContext = require(path.join(__dirname, 'session-context-lib.cjs'));

emitSessionContext({
  pluginRoot: path.resolve(__dirname, '..'),
  namespace: 'fluig',
  title: 'Fluig',
  profile: 'internal',
  cleanupTbcDbs: false,
  groups: [
    { title: 'Ciclo de desenvolvimento (nesta ordem)', names: ['init-project', 'brainstorm', 'plan', 'implement', 'deploy', 'qa', 'verify'] },
    { title: 'Scaffolding', names: ['widget', 'dataset', 'form', 'workflow'] },
    { title: 'Qualidade e apoio', names: ['review', 'test', 'debug', 'api-ref', 'feedback'] },
  ],
  notes: [
    'MCP tools disponiveis: searchFluigPatterns, searchFluigApi, searchKnowledge (plugin fluig tbc-knowledge)',
    'Regra de modelos TBC: haiku para implementacao, sonnet para review/QA, opus somente se o dev pedir.',
  ],
});
