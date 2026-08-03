import assert from 'node:assert/strict';
import test from 'node:test';
import { commitEntries } from '../src/github.js';

process.env.GITHUB_TOKEN = 'test-token';
process.env.GITHUB_OWNER = 'owner';
process.env.GITHUB_REPO = 'repo';
process.env.GITHUB_BRANCH = 'main';

const response = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json' }
});

test('a non-fast-forward GitHub ref update becomes a retryable conflict', async () => {
  const originalFetch = globalThis.fetch;
  const replies = [
    response({ object: { sha: 'head' } }),
    response({ tree: { sha: 'base-tree' } }),
    response({ sha: 'new-blob' }, 201),
    response({ sha: 'new-tree' }, 201),
    response({ sha: 'new-commit' }, 201),
    response({ message: 'Reference update failed' }, 422)
  ];
  globalThis.fetch = async () => replies.shift();
  try {
    await assert.rejects(
      () => commitEntries([{ path: 'file.md', content: Buffer.from('content') }], 'Test'),
      (error) => error.status === 409 && /changed while publishing/i.test(error.message)
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
