import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import Database from 'better-sqlite3';

describe('schema', () => {
  it('creates all tables and indexes', () => {
    const dbPath = '/tmp/test-schema-advpl.db';
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
    const schema = fs.readFileSync(new URL('../schema.sql', import.meta.url), 'utf-8');
    const db = new Database(dbPath);
    db.exec(schema);
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
    const tableNames = tables.map(t => t.name);
    assert.ok(tableNames.includes('functions'));
    assert.ok(tableNames.includes('endpoints'));
    assert.ok(tableNames.includes('smartview_objects'));
    assert.ok(tableNames.includes('exec_auto'));
    assert.ok(tableNames.includes('mvc_patterns'));
    assert.ok(tableNames.includes('includes'));
    assert.ok(tableNames.includes('knowledge_patterns'));
    assert.ok(tableNames.includes('documents'));
    assert.ok(tableNames.includes('metadata'));
    db.close();
    fs.unlinkSync(dbPath);
  });
});
