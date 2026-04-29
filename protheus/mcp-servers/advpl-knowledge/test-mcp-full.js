/**
 * Full integration test: Auth Server → Decrypt DB → MCP Query Handlers
 * Simulates the complete plugin flow locally
 */
import { createApp, decryptValue } from '../../../auth-server/index.js';
import { decryptToBuffer } from './encrypt-db.js';
import { createQueryHandlers } from './index.js';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const AUTH_PORT = 9291;
const AUTH_DB = path.join(__dirname, '../../../auth-server/data/auth.db');
const ENCRYPTED_DB = path.join(__dirname, 'data/protheus_knowledge.db.enc');

async function runFullTest() {
  // ============================================================
  // STEP 1: Start auth server
  // ============================================================
  console.log('=== STEP 1: Starting auth server ===');
  const authApp = createApp(AUTH_DB);
  const server = await new Promise(resolve => {
    const s = authApp.listen(AUTH_PORT, () => {
      console.log(`Auth server on port ${AUTH_PORT}`);
      resolve(s);
    });
  });

  try {
    // ============================================================
    // STEP 2: Authenticate (simulate plugin MCP auth flow)
    // ============================================================
    console.log('\n=== STEP 2: Authenticate as dev ===');
    const email = 'fabricadesoftwaretbc@gmail.com';

    const authRes = await fetch(`http://localhost:${AUTH_PORT}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    if (authRes.status !== 200) {
      throw new Error(`Auth failed: ${authRes.status} - ${await authRes.text()}`);
    }

    const authData = await authRes.json();
    console.log(`Authenticated as: ${email}`);
    console.log(`Encryption key: ${authData.encryption_key.substring(0, 10)}...`);
    console.log(`RAG key encrypted: ${authData.rag_api_key_encrypted.substring(0, 20)}...`);
    console.log(`Expires: ${authData.expires_at}`);

    // ============================================================
    // STEP 3: Decrypt RAG credentials client-side
    // ============================================================
    console.log('\n=== STEP 3: Decrypt RAG credentials ===');
    const ragApiKey = decryptValue(authData.rag_api_key_encrypted, authData.encryption_key);
    const ragApiUrl = decryptValue(authData.rag_api_url_encrypted, authData.encryption_key);
    console.log(`RAG API Key: ${ragApiKey.substring(0, 15)}...`);
    console.log(`RAG API URL: ${ragApiUrl}`);

    // ============================================================
    // STEP 4: Decrypt knowledge database
    // ============================================================
    console.log('\n=== STEP 4: Decrypt knowledge DB ===');
    const plainBuffer = decryptToBuffer(ENCRYPTED_DB, authData.encryption_key);
    const tempDb = path.join(os.tmpdir(), `advpl-test-${Date.now()}.db`);
    fs.writeFileSync(tempDb, plainBuffer);
    console.log(`Decrypted DB: ${(plainBuffer.length / 1024 / 1024).toFixed(1)}MB → ${tempDb}`);

    // ============================================================
    // STEP 5: Create MCP query handlers and run queries
    // ============================================================
    console.log('\n=== STEP 5: MCP Tool Queries ===');
    const handlers = createQueryHandlers(tempDb, { rag_api_key: ragApiKey, rag_api_url: ragApiUrl });

    // Tool 1: searchFunction
    console.log('\n--- Tool: searchFunction({ name: "FINA080" }) ---');
    const funcs = handlers.searchFunction({ name: 'FINA080', limit: 5 });
    console.log(`${funcs.length} results`);
    funcs.forEach(f => console.log(`  ${f.name} [${f.type}] ${f.module}`));

    // Tool 2: findEndpoint
    console.log('\n--- Tool: findEndpoint({ keyword: "reconcil" }) ---');
    const endpoints = handlers.findEndpoint({ keyword: 'reconcil', limit: 5 });
    console.log(`${endpoints.length} results`);
    endpoints.forEach(e => console.log(`  ${e.method} ${e.path} → ${e.function_name}`));

    // Tool 3: findExecAuto
    console.log('\n--- Tool: findExecAuto({ target: "Fina080" }) ---');
    const execAutos = handlers.findExecAuto({ target: 'Fina080', limit: 5 });
    console.log(`${execAutos.length} results`);
    execAutos.forEach(e => console.log(`  ${e.caller_function} → ${e.target_function} [${e.module}]`));

    // Tool 4: searchKnowledge
    console.log('\n--- Tool: searchKnowledge({ keyword: "RecLock" }) ---');
    const knowledge = handlers.searchKnowledge({ keyword: 'RecLock', limit: 3 });
    console.log(`${knowledge.length} results`);
    knowledge.forEach(k => console.log(`  [${k.skill}/${k.category}] ${k.title} (${k.content.length} chars)`));

    // Tool 5: searchDocuments
    console.log('\n--- Tool: searchDocuments({ keyword: "MVC" }) ---');
    const docs = handlers.searchDocuments({ keyword: 'MVC', limit: 3 });
    console.log(`${docs.length} results`);
    docs.forEach(d => console.log(`  [${d.doc_type}] ${d.title} (${d.content.length} chars)`));

    // Tool 6: searchByTable
    console.log('\n--- Tool: searchByTable({ table: "SE5" }) ---');
    const tableSearch = handlers.searchByTable({ table: 'SE5', limit: 5 });
    console.log(`functions: ${tableSearch.functions.length}, endpoints: ${tableSearch.endpoints.length}, smartviews: ${tableSearch.smartviews.length}, exec_auto: ${tableSearch.exec_auto.length}, mvc: ${tableSearch.mvc.length}`);

    // Tool 7: listModules
    console.log('\n--- Tool: listModules() ---');
    const modules = handlers.listModules();
    console.log(`${modules.length} modules. Top 5:`);
    modules.slice(0, 5).forEach(m => console.log(`  ${m.module}: ${m.count} functions`));

    // Tool 8: getCredentials
    console.log('\n--- Tool: getCredentials() ---');
    const creds = handlers.getCredentials();
    console.log(`RAG Key: ${creds.rag_api_key.substring(0, 15)}...`);
    console.log(`RAG URL: ${creds.rag_api_url}`);

    // Tool 9: findSmartView
    console.log('\n--- Tool: findSmartView({ keyword: "Financ" }) ---');
    const svs = handlers.findSmartView({ keyword: 'Financ', limit: 5 });
    console.log(`${svs.length} results`);
    svs.forEach(s => console.log(`  ${s.class_name} [${s.team}] ${s.display_name}`));

    // Tool 10: findMvcPattern
    console.log('\n--- Tool: findMvcPattern({ model_id: "FIN" }) ---');
    const mvcs = handlers.findMvcPattern({ model_id: 'FIN', limit: 5 });
    console.log(`${mvcs.length} results`);
    mvcs.forEach(m => console.log(`  ${m.model_id} tables=${m.tables} [${m.module}]`));

    // Cleanup
    handlers.close();
    fs.unlinkSync(tempDb);

    console.log('\n========================================');
    console.log('=== FULL FLOW TEST: ALL 10 TOOLS OK ===');
    console.log('========================================');

  } finally {
    server.close();
  }
}

runFullTest().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
