import assert from 'node:assert/strict';
import test from 'node:test';
import { hashPassword } from '../src/auth.js';
import { handler } from '../api/auth/login.js';

process.env.ALLOWED_ORIGINS = 'https://zhaoyangpl.github.io';
process.env.SESSION_SECRET = 'test-session-secret-that-is-longer-than-thirty-two-characters';
process.env.ADMIN_PASSWORD_HASH = hashPassword('owner-password', { salt: Buffer.alloc(16, 3) });

function loginRequest(password, origin = 'https://zhaoyangpl.github.io') {
  return new Request('https://api.example.test/api/auth/login', {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json', 'X-Forwarded-For': password },
    body: JSON.stringify({ password })
  });
}

test('login accepts the configured origin and returns an expiring token', async () => {
  const response = await handler(loginRequest('owner-password'));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('access-control-allow-origin'), 'https://zhaoyangpl.github.io');
  const body = await response.json();
  assert.equal(typeof body.token, 'string');
  assert.ok(body.expiresAt > Date.now());
});

test('login rejects wrong passwords and unexpected origins', async () => {
  assert.equal((await handler(loginRequest('wrong-password'))).status, 401);
  assert.equal((await handler(loginRequest('owner-password', 'https://evil.example'))).status, 403);
});
