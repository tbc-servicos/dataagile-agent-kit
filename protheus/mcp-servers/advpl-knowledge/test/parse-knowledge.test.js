import { describe, it } from 'node:test';
import assert from 'node:assert';
import { extractSections, parseSkillContent } from '../parse-knowledge.js';

describe('extractSections', () => {
  it('splits markdown by ## headers', () => {
    const markdown = `
## Section One
Content of section one.

## Section Two
Content of section two.
`;
    const sections = extractSections(markdown);
    assert.strictEqual(sections.length, 2);
    assert.strictEqual(sections[0].title, 'Section One');
    assert.strictEqual(sections[1].title, 'Section Two');
  });

  it('merges ### subsections into parent ##', () => {
    const markdown = `
## Parent Section
Content here.

### Subsection A
Subsection A content.

### Subsection B
Subsection B content.

## Another Parent
Other content.
`;
    const sections = extractSections(markdown);
    assert.strictEqual(sections.length, 2);
    assert.ok(sections[0].content.includes('Subsection A'));
    assert.ok(sections[0].content.includes('Subsection B'));
    assert.strictEqual(sections[1].title, 'Another Parent');
  });

  it('handles empty markdown', () => {
    const sections = extractSections('');
    assert.strictEqual(sections.length, 0);
  });

  it('handles markdown with no headers', () => {
    const markdown = 'Just some text without headers.';
    const sections = extractSections(markdown);
    assert.strictEqual(sections.length, 0);
  });

  it('handles null/undefined input', () => {
    assert.strictEqual(extractSections(null).length, 0);
    assert.strictEqual(extractSections(undefined).length, 0);
  });
});

describe('parseSkillContent', () => {
  it('removes frontmatter', () => {
    const markdown = `---
name: test-skill
description: Test
---

## Content Section
Real content here with sufficient characters to pass minimum length.
`;
    const entries = parseSkillContent('test-skill', 'protheus', markdown);
    assert.strictEqual(entries.length, 1);
    assert.ok(!entries[0].content.includes('---'));
  });

  it('skips workflow sections', () => {
    const markdown = `
## Quando usar
This is workflow content that needs to be long enough.

## Função nativa
This is knowledge with content that exceeds twenty characters minimum length requirement.

## Fluxo de Trabalho
More workflow content that is long enough.

## Padrões
More knowledge with sufficient content to meet minimum requirements and guidelines.
`;
    const entries = parseSkillContent('test-skill', 'protheus', markdown);
    // Should only have "Função nativa" and "Padrões"
    assert.strictEqual(entries.length, 2);
    const titles = entries.map(e => e.title);
    assert.ok(titles.includes('Função nativa'));
    assert.ok(titles.includes('Padrões'));
  });

  it('skips sections with content < 20 chars', () => {
    const markdown = `
## Short
abc

## Long Enough
This is a much longer section that exceeds twenty characters minimum.
`;
    const entries = parseSkillContent('test-skill', 'protheus', markdown);
    assert.strictEqual(entries.length, 1);
    assert.strictEqual(entries[0].title, 'Long Enough');
  });

  it('extracts tags from content', () => {
    const markdown = `
## ADVPL Pattern
This section discusses ADVPL and PRW file patterns.

## SQL Database
Information about SQL queries and SELECT statements.
`;
    const entries = parseSkillContent('test-skill', 'protheus', markdown);
    assert.strictEqual(entries.length, 2);

    const advplEntry = entries.find(e => e.title === 'ADVPL Pattern');
    assert.ok(advplEntry.tags.includes('advpl'));

    const sqlEntry = entries.find(e => e.title === 'SQL Database');
    assert.ok(sqlEntry.tags.includes('sql'));
  });

  it('categorizes content correctly', () => {
    const markdown = `
## Nomenclatura de Arquivos
Convention content here with details about naming patterns and requirements.

## Funções Nativas
Function definitions content here with function syntax and examples that exceeds minimum chars.

## Erros Comuns
Error handling information and common mistakes to avoid in your code.

## MVC Model Definition
Model, View, Controller pattern details and architecture guidelines for development.
`;
    const entries = parseSkillContent('test-skill', 'protheus', markdown);

    const categories = {};
    for (const entry of entries) {
      categories[entry.title] = entry.category;
    }

    assert.strictEqual(categories['Nomenclatura de Arquivos'], 'convention');
    assert.strictEqual(categories['Funções Nativas'], 'functions');
    assert.strictEqual(categories['Erros Comuns'], 'errors');
    assert.strictEqual(categories['MVC Model Definition'], 'pattern');
  });

  it('returns correct skill name and platform', () => {
    const markdown = `
## Some Pattern
Content here with more than twenty characters.
`;
    const entries = parseSkillContent('my-skill', 'fluig', markdown);
    assert.strictEqual(entries.length, 1);
    assert.strictEqual(entries[0].skill, 'my-skill');
    assert.strictEqual(entries[0].platform, 'fluig');
  });

  it('handles markdown with no headers', () => {
    const markdown = 'Just plain text without any markdown headers.';
    const entries = parseSkillContent('test-skill', 'protheus', markdown);
    assert.strictEqual(entries.length, 0);
  });

  it('handles null/undefined input', () => {
    assert.strictEqual(parseSkillContent('test', 'protheus', null).length, 0);
    assert.strictEqual(parseSkillContent('test', 'protheus', undefined).length, 0);
  });

  it('extracts multiple tags when applicable', () => {
    const markdown = `
## Advanced REST API with Angular
Discusses REST endpoints, HTTP methods, and Angular integration.
Also covers MVC patterns with SELECT queries and table data.
Sufficient content to pass minimum length requirement.
`;
    const entries = parseSkillContent('test-skill', 'protheus', markdown);
    assert.strictEqual(entries.length, 1);

    const tags = entries[0].tags.split(',');
    assert.ok(tags.includes('rest'));
    assert.ok(tags.includes('angular'));
    assert.ok(tags.includes('mvc'));
    assert.ok(tags.includes('sql'));
  });

  it('sets tags to null when no tags found', () => {
    const markdown = `
## Random Content
This section has no tags that match any patterns. Just random words.
`;
    const entries = parseSkillContent('test-skill', 'protheus', markdown);
    assert.strictEqual(entries.length, 1);
    assert.strictEqual(entries[0].tags, null);
  });
});
