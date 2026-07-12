// karma.conf.js — template do plugin fluig (copiar para a raiz do widget se o
// projeto ainda não tiver). O bloco coverageReporter.check transforma a
// cobertura em GATE MECÂNICO: `npm test` FALHA sozinho abaixo do threshold —
// nenhum orquestrador/modelo precisa "lembrar" de conferir.
module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma'),
    ],
    client: { jasmine: {}, clearContext: false },
    jasmineHtmlReporter: { suppressAll: true },
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage'),
      subdir: '.',
      reporters: [{ type: 'html' }, { type: 'text-summary' }, { type: 'json-summary' }],
      // GATE: thresholds do plugin (global 70%; código novo deve mirar 80%)
      check: {
        global: { statements: 70, branches: 70, functions: 70, lines: 70 },
      },
    },
    reporters: ['progress', 'kjhtml', 'coverage'],
    browsers: ['ChromeHeadless'],
    restartOnFileChange: true,
  });
};
