import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import { createQueryHandlers } from '../index.js';

let testDbPath;
let testDb;

before(() => {
  // Create test database in /tmp
  testDbPath = path.join(os.tmpdir(), `test-mcp-server-${Date.now()}.db`);
  testDb = new Database(testDbPath);

  // Read and execute schema
  const schemaPath = new URL('../schema.sql', import.meta.url);
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  testDb.exec(schema);

  // Seed test data
  seedTestData(testDb);

  testDb.close();
});

after(() => {
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
});

function seedTestData(db) {
  // Seed functions
  const insertFunction = db.prepare(`
    INSERT INTO functions (name, type, module, file_path, line_number, parameters, return_type, protheus_doc, version)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertFunction.run('u_UserFunction', 'function', 'crm', '/src/crm/user.prw', 10, 'cName,nAge', 'logical', 'SA1', '1.0');
  insertFunction.run('u_ItemFunc', 'function', 'crm', '/src/crm/item.prw', 20, 'cCode', 'character', 'SB1,SB9', '1.0');
  insertFunction.run('u_CalculateSales', 'function', 'sales', '/src/sales/calc.prw', 50, 'nValue,dDate', 'numeric', 'SF2', '2.0');
  insertFunction.run('u_ReportMain', 'function', 'reports', '/src/reports/main.prw', 100, '', 'nil', 'SA1,SA3', '1.5');

  // Seed endpoints
  const insertEndpoint = db.prepare(`
    INSERT INTO endpoints (path, method, namespace, function_name, file_path, module)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertEndpoint.run('/api/users', 'GET', 'users', 'u_ListUsers', '/src/api/users.prw', 'crm');
  insertEndpoint.run('/api/users/:id', 'POST', 'users', 'u_UpdateUser', '/src/api/users.prw', 'crm');
  insertEndpoint.run('/api/items', 'GET', 'items', 'u_ListItems', '/src/api/items.prw', 'crm');
  insertEndpoint.run('/api/sales/totals', 'GET', 'sales', 'u_GetSalesTotals', '/src/api/sales.prw', 'sales');

  // Seed smartview objects
  const insertSmartView = db.prepare(`
    INSERT INTO smartview_objects (class_name, namespace, team, tables, display_name, country, file_path, module)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertSmartView.run('UserSmartView', 'sv.users', 'team-a', 'SA1,SA3', 'User Management', 'BR', '/src/smartviews/user.tlpp', 'crm');
  insertSmartView.run('ItemSmartView', 'sv.items', 'team-b', 'SB1,SB9', 'Inventory', 'BR', '/src/smartviews/item.tlpp', 'crm');
  insertSmartView.run('SalesSmartView', 'sv.sales', 'team-c', 'SF2,SF8', 'Sales Orders', 'BR', '/src/smartviews/sales.tlpp', 'sales');

  // Seed exec_auto
  const insertExecAuto = db.prepare(`
    INSERT INTO exec_auto (caller_function, target_function, table_alias, module, file_path, line_number)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertExecAuto.run('u_UserFunction', 'u_ValidateUser', 'SA1', 'crm', '/src/crm/user.prw', 25);
  insertExecAuto.run('u_ItemFunc', 'u_ValidateItem', 'SB1', 'crm', '/src/crm/item.prw', 30);
  insertExecAuto.run('u_CalculateSales', 'u_CalcDiscounts', 'SF2', 'sales', '/src/sales/calc.prw', 55);

  // Seed MVC patterns
  const insertMvc = db.prepare(`
    INSERT INTO mvc_patterns (model_id, tables, primary_key, has_grid, file_path, module)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertMvc.run('UserModel', 'SA1,SA3', 'A1_CODIGO', 1, '/src/mvc/user_model.tlpp', 'crm');
  insertMvc.run('ItemModel', 'SB1,SB9', 'B1_CODIGO', 1, '/src/mvc/item_model.tlpp', 'crm');
  insertMvc.run('SalesModel', 'SF2,SF8', 'F2_DOC', 0, '/src/mvc/sales_model.tlpp', 'sales');

  // Seed knowledge patterns
  const insertKnowledge = db.prepare(`
    INSERT INTO knowledge_patterns (skill, category, title, content, tags, platform)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertKnowledge.run('advpl-writer', 'functions', 'Function Naming', 'Always prefix with u_ for user functions', 'naming,conventions', 'protheus');
  insertKnowledge.run('advpl-writer', 'variables', 'Local Variables', 'Declare all local variables at function start', 'best-practice', 'protheus');
  insertKnowledge.run('smartview-builder', 'ui', 'SmartView Basics', 'SmartViews are UI components in TLPP', 'tlpp,smartview', 'protheus');

  // Seed documents
  const insertDoc = db.prepare(`
    INSERT INTO documents (title, source_file, content, section, page_number, doc_type)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertDoc.run('ADVPL Programmer Guide', 'guide.pdf', 'This guide covers ADVPL syntax and best practices', 'Syntax', 1, 'guide');
  insertDoc.run('SmartView Reference', 'smartview.pdf', 'Complete reference for SmartView development', 'SmartView Objects', 5, 'reference');
  insertDoc.run('MVC Architecture', 'mvc.pdf', 'Model-View-Controller patterns in TLPP', 'Architecture', 10, 'guide');
}

describe('MCP Server Query Handlers', () => {
  it('searchFunction by name', () => {
    const handlers = createQueryHandlers(testDbPath);
    const results = handlers.searchFunction({ name: 'UserFunction' });
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].name, 'u_UserFunction');
    assert.strictEqual(results[0].module, 'crm');
    handlers.close();
  });

  it('searchFunction with module filter', () => {
    const handlers = createQueryHandlers(testDbPath);
    const results = handlers.searchFunction({ name: '', module: 'sales' });
    assert.ok(results.length > 0);
    assert.ok(results.every(r => r.module === 'sales'));
    handlers.close();
  });

  it('searchFunction with type filter', () => {
    const handlers = createQueryHandlers(testDbPath);
    const results = handlers.searchFunction({ name: '', type: 'function' });
    assert.ok(results.length > 0);
    assert.ok(results.every(r => r.type === 'function'));
    handlers.close();
  });

  it('searchFunction respects limit', () => {
    const handlers = createQueryHandlers(testDbPath);
    const results = handlers.searchFunction({ name: '', limit: 2 });
    assert.ok(results.length <= 2);
    handlers.close();
  });

  it('findEndpoint by keyword', () => {
    const handlers = createQueryHandlers(testDbPath);
    const results = handlers.findEndpoint({ keyword: 'users' });
    assert.ok(results.length > 0);
    assert.ok(results.some(r => r.path.includes('users')));
    handlers.close();
  });

  it('findEndpoint with method filter', () => {
    const handlers = createQueryHandlers(testDbPath);
    const results = handlers.findEndpoint({ keyword: 'api', method: 'GET' });
    assert.ok(results.every(r => r.method === 'GET'));
    handlers.close();
  });

  it('findEndpoint with module filter', () => {
    const handlers = createQueryHandlers(testDbPath);
    const results = handlers.findEndpoint({ keyword: 'api', module: 'crm' });
    assert.ok(results.every(r => r.module === 'crm'));
    handlers.close();
  });

  it('findSmartView by keyword', () => {
    const handlers = createQueryHandlers(testDbPath);
    const results = handlers.findSmartView({ keyword: 'User' });
    assert.ok(results.length > 0);
    assert.ok(results.some(r => r.class_name.includes('User')));
    handlers.close();
  });

  it('findSmartView with team filter', () => {
    const handlers = createQueryHandlers(testDbPath);
    const results = handlers.findSmartView({ keyword: 'SmartView', team: 'team-a' });
    assert.ok(results.every(r => r.team === 'team-a'));
    handlers.close();
  });

  it('findSmartView with module filter', () => {
    const handlers = createQueryHandlers(testDbPath);
    const results = handlers.findSmartView({ keyword: 'SmartView', module: 'sales' });
    assert.ok(results.every(r => r.module === 'sales'));
    handlers.close();
  });

  it('findExecAuto by target', () => {
    const handlers = createQueryHandlers(testDbPath);
    const results = handlers.findExecAuto({ target: 'ValidateUser' });
    assert.ok(results.length > 0);
    assert.strictEqual(results[0].target_function, 'u_ValidateUser');
    handlers.close();
  });

  it('findExecAuto with caller filter', () => {
    const handlers = createQueryHandlers(testDbPath);
    const results = handlers.findExecAuto({ target: 'Validate', caller: 'UserFunction' });
    assert.ok(results.length > 0);
    assert.ok(results.every(r => r.caller_function.includes('UserFunction')));
    handlers.close();
  });

  it('findExecAuto with table filter', () => {
    const handlers = createQueryHandlers(testDbPath);
    const results = handlers.findExecAuto({ target: '', table: 'SA1' });
    assert.ok(results.some(r => r.table_alias === 'SA1'));
    handlers.close();
  });

  it('findExecAuto with module filter', () => {
    const handlers = createQueryHandlers(testDbPath);
    const results = handlers.findExecAuto({ target: '', module: 'sales' });
    assert.ok(results.every(r => r.module === 'sales'));
    handlers.close();
  });

  it('findMvcPattern by model_id', () => {
    const handlers = createQueryHandlers(testDbPath);
    const results = handlers.findMvcPattern({ model_id: 'UserModel' });
    assert.ok(results.length > 0);
    assert.strictEqual(results[0].model_id, 'UserModel');
    handlers.close();
  });

  it('findMvcPattern with table filter', () => {
    const handlers = createQueryHandlers(testDbPath);
    const results = handlers.findMvcPattern({ model_id: '', table: 'SA1' });
    assert.ok(results.some(r => r.tables && r.tables.includes('SA1')));
    handlers.close();
  });

  it('findMvcPattern with module filter', () => {
    const handlers = createQueryHandlers(testDbPath);
    const results = handlers.findMvcPattern({ model_id: '', module: 'crm' });
    assert.ok(results.every(r => r.module === 'crm'));
    handlers.close();
  });

  it('listModules returns all modules with counts', () => {
    const handlers = createQueryHandlers(testDbPath);
    const results = handlers.listModules();
    assert.ok(results.length > 0);
    assert.ok(results.some(r => r.module === 'crm'));
    assert.ok(results.some(r => r.module === 'sales'));
    // Verify count property exists and is positive
    assert.ok(results.every(r => r.count > 0));
    handlers.close();
  });

  it('searchByTable cross-searches all tables', () => {
    const handlers = createQueryHandlers(testDbPath);
    const results = handlers.searchByTable({ table: 'SA1' });
    assert.ok(results.functions);
    assert.ok(results.endpoints);
    assert.ok(results.smartviews);
    assert.ok(results.exec_auto);
    assert.ok(results.mvc);
    assert.ok(Array.isArray(results.functions));
    assert.ok(Array.isArray(results.endpoints));
    handlers.close();
  });

  it('searchKnowledge by keyword', () => {
    const handlers = createQueryHandlers(testDbPath);
    const results = handlers.searchKnowledge({ keyword: 'prefix' });
    assert.ok(results.length > 0);
    assert.ok(results.some(r => r.content.includes('prefix')));
    handlers.close();
  });

  it('searchKnowledge with skill filter', () => {
    const handlers = createQueryHandlers(testDbPath);
    const results = handlers.searchKnowledge({ keyword: 'Guide', skill: 'advpl-writer' });
    assert.ok(results.every(r => r.skill === 'advpl-writer'));
    handlers.close();
  });

  it('searchKnowledge with category filter', () => {
    const handlers = createQueryHandlers(testDbPath);
    const results = handlers.searchKnowledge({ keyword: '', category: 'functions' });
    assert.ok(results.every(r => r.category === 'functions'));
    handlers.close();
  });

  it('searchKnowledge with platform filter', () => {
    const handlers = createQueryHandlers(testDbPath);
    const results = handlers.searchKnowledge({ keyword: '', platform: 'protheus' });
    assert.ok(results.every(r => r.platform === 'protheus'));
    handlers.close();
  });

  it('searchDocuments by keyword', () => {
    const handlers = createQueryHandlers(testDbPath);
    const results = handlers.searchDocuments({ keyword: 'ADVPL' });
    assert.ok(results.length > 0);
    assert.ok(results.some(r => r.title.includes('ADVPL') || r.content.includes('ADVPL')));
    handlers.close();
  });

  it('searchDocuments with doc_type filter', () => {
    const handlers = createQueryHandlers(testDbPath);
    const results = handlers.searchDocuments({ keyword: 'guide', doc_type: 'guide' });
    assert.ok(results.every(r => r.doc_type === 'guide'));
    handlers.close();
  });

  it('searchDocuments respects limit', () => {
    const handlers = createQueryHandlers(testDbPath);
    const results = handlers.searchDocuments({ keyword: '', limit: 1 });
    assert.ok(results.length <= 1);
    handlers.close();
  });

  it('getCredentials returns cached values', () => {
    const credentials = { rag_api_key: 'test-key-123', rag_search_url: 'https://rag.example.com/search', rag_ask_url: 'https://rag.example.com/ask' };
    const handlers = createQueryHandlers(testDbPath, credentials);
    const result = handlers.getCredentials();
    assert.strictEqual(result.rag_api_key, 'test-key-123');
    assert.strictEqual(result.rag_search_url, 'https://rag.example.com/search');
    assert.strictEqual(result.rag_ask_url, 'https://rag.example.com/ask');
    handlers.close();
  });

  it('close closes database', () => {
    const handlers = createQueryHandlers(testDbPath);
    handlers.close();
    // Trying to query after close should fail
    assert.throws(() => {
      handlers.searchFunction({ name: 'test' });
    });
  });
});
