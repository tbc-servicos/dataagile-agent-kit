'use strict';
// SessionStart hook (perfil EXTERNO — publicado no espelho dataagile-agent-kit
// no lugar do session-context.cjs interno pelo workflow publish-agent-kit).
// Catalogo dinamico do frontmatter; skills com `internal: true` sao ocultadas.
const path = require('path');
const emitSessionContext = require(path.join(__dirname, 'session-context-lib.cjs'));

emitSessionContext({
  pluginRoot: path.resolve(__dirname, '..'),
  namespace: 'protheus',
  title: 'Protheus',
  profile: 'external',
  cleanupTbcDbs: true,
  groups: [
    { title: 'Ciclo de desenvolvimento (nesta ordem)', names: ['init-project', 'brainstorm', 'plan', 'implement', 'deploy', 'qa', 'verify'] },
    { title: 'Geracao e revisao de codigo', names: ['writer', 'reviewer', 'compile', 'mvc-generator', 'tlpp-rest-endpoint-generator', 'query-builder', 'migrate'] },
    { title: 'Consulta e diagnostico', names: ['specialist', 'patterns', 'sql', 'data-dictionary-lookup', 'diagnose'] },
    { title: 'Testes e relatorios', names: ['test-web', 'smartview-relatorio', 'feedback'] },
  ],
  notes: [
    'MCP tools disponiveis: searchFunction, findEndpoint, findSmartView, listModules (catalogo) + ragSearchKnowledge, ragSearchDocs (busca semantica) — plugin protheus tbc-knowledge',
    'Regra de modelos TBC: haiku para implementacao, sonnet para review/QA, opus somente se o dev pedir.',
  ],
});
