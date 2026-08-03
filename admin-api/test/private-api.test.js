import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import test from 'node:test';
import { createSessionToken } from '../src/auth.js';
import { encryptJson } from '../src/crypto.js';
import { handler } from '../api/private/decrypt.js';

process.env.ALLOWED_ORIGINS = 'https://zhaoyangpl.github.io';
process.env.SESSION_SECRET = 'test-session-secret-that-is-longer-than-thirty-two-characters';
process.env.PRIVATE_CONTENT_KEY = randomBytes(32).toString('base64');

const payload = encryptJson({ markdown: 'Private **Markdown**', assets: [] });

function request(token) {
  const headers = { Origin: 'https://zhaoyangpl.github.io', 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return new Request('https://api.example.test/api/private/decrypt', {
    method: 'POST',
    headers,
    body: JSON.stringify({ payload })
  });
}

test('private post decryption requires a valid admin session', async () => {
  assert.equal((await handler(request())).status, 401);
  const session = createSessionToken();
  const response = await handler(request(session.token));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { markdown: 'Private **Markdown**', assets: [] });
});
