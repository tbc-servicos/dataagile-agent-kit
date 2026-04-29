import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { generateKey, encryptFile, decryptToBuffer } from '../encrypt-db.js';

// Helper to create temp file
function createTempFile(content) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'encrypt-test-'));
  const filePath = path.join(tmpDir, 'test.txt');
  fs.writeFileSync(filePath, content);
  return { filePath, tmpDir };
}

// Helper to clean up temp files
function cleanupTemp(tmpDir) {
  const files = fs.readdirSync(tmpDir);
  files.forEach(file => {
    fs.unlinkSync(path.join(tmpDir, file));
  });
  fs.rmdirSync(tmpDir);
}

test('generateKey returns 64-character hex string', () => {
  const key = generateKey();
  assert.strictEqual(typeof key, 'string');
  assert.strictEqual(key.length, 64);
  assert.match(key, /^[0-9a-f]{64}$/i);
});

test('generateKey returns different keys each time', () => {
  const key1 = generateKey();
  const key2 = generateKey();
  assert.notStrictEqual(key1, key2);
});

test('encrypt + decrypt roundtrip: original content is restored', () => {
  const originalContent = 'This is secret data for testing encryption and decryption';
  const { filePath, tmpDir } = createTempFile(originalContent);

  try {
    const key = generateKey();
    const encPath = path.join(tmpDir, 'test.enc');
    const decPath = path.join(tmpDir, 'test.dec');

    // Encrypt
    encryptFile(filePath, encPath, key);
    assert(fs.existsSync(encPath), 'Encrypted file should exist');

    // Decrypt
    const decrypted = decryptToBuffer(encPath, key);
    fs.writeFileSync(decPath, decrypted);

    // Verify content
    const recovered = fs.readFileSync(decPath, 'utf8');
    assert.strictEqual(recovered, originalContent);
  } finally {
    cleanupTemp(tmpDir);
  }
});

test('encrypt + decrypt roundtrip with binary data', () => {
  const originalContent = Buffer.from([0, 1, 2, 3, 255, 254, 253, 252, 128, 64, 32, 16]);
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'encrypt-test-'));
  const filePath = path.join(tmpDir, 'test.bin');
  fs.writeFileSync(filePath, originalContent);

  try {
    const key = generateKey();
    const encPath = path.join(tmpDir, 'test.enc');

    // Encrypt
    encryptFile(filePath, encPath, key);

    // Decrypt
    const decrypted = decryptToBuffer(encPath, key);

    // Verify content
    assert.deepStrictEqual(decrypted, originalContent);
  } finally {
    cleanupTemp(tmpDir);
  }
});

test('wrong key throws error on decryption', () => {
  const originalContent = 'Secret message';
  const { filePath, tmpDir } = createTempFile(originalContent);

  try {
    const key1 = generateKey();
    const key2 = generateKey();
    const encPath = path.join(tmpDir, 'test.enc');

    // Encrypt with key1
    encryptFile(filePath, encPath, key1);

    // Try to decrypt with wrong key2
    assert.throws(() => {
      decryptToBuffer(encPath, key2);
    }, /Unsupported state or unable to authenticate data/);
  } finally {
    cleanupTemp(tmpDir);
  }
});

test('invalid key format throws error', () => {
  const originalContent = 'Test content';
  const { filePath, tmpDir } = createTempFile(originalContent);

  try {
    const invalidKey = 'not-a-valid-hex-key';
    const encPath = path.join(tmpDir, 'test.enc');

    assert.throws(() => {
      encryptFile(filePath, encPath, invalidKey);
    }, /Key must be 32 bytes/);
  } finally {
    cleanupTemp(tmpDir);
  }
});

test('decrypting corrupted file throws error', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'encrypt-test-'));
  const encPath = path.join(tmpDir, 'corrupted.enc');

  try {
    const key = generateKey();
    // Write corrupted data (too small)
    fs.writeFileSync(encPath, Buffer.from('too small'));

    assert.throws(() => {
      decryptToBuffer(encPath, key);
    }, /Encrypted file too small/);
  } finally {
    cleanupTemp(tmpDir);
  }
});

test('large file encryption and decryption', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'encrypt-test-'));
  const filePath = path.join(tmpDir, 'large.txt');

  try {
    // Create a 1MB file
    const largeContent = Buffer.alloc(1024 * 1024, 'x');
    fs.writeFileSync(filePath, largeContent);

    const key = generateKey();
    const encPath = path.join(tmpDir, 'large.enc');

    // Encrypt
    encryptFile(filePath, encPath, key);

    // Decrypt
    const decrypted = decryptToBuffer(encPath, key);

    // Verify
    assert.deepStrictEqual(decrypted, largeContent);
  } finally {
    cleanupTemp(tmpDir);
  }
});
