import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parsePdfToEntries } from '../parse-pdfs.js';

describe('parsePdfToEntries', () => {
  it('returns empty array for non-existent directory', async () => {
    const result = await parsePdfToEntries('/nonexistent/path/to/pdfs');
    assert.strictEqual(Array.isArray(result), true);
    assert.strictEqual(result.length, 0);
  });

  it('returns empty array for directory with no PDFs', async () => {
    // Create a temporary directory with no PDFs
    const fs = await import('fs');
    const path = await import('path');
    const os = await import('os');
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-test-'));

    try {
      const result = await parsePdfToEntries(tempDir);
      assert.strictEqual(Array.isArray(result), true);
      assert.strictEqual(result.length, 0);
    } finally {
      // Clean up temporary directory
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
