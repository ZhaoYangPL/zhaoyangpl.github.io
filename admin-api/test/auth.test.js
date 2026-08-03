import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createOpaqueToken,
  createSessionToken,
  hashPassword,
  verifyOpaqueToken,
  verifyPassword,
  verifySessionToken
} from '../src/auth.js';

process.env.SESSION_SECRET = 'test-session-secret-that-is-longer-than-thirty-two-characters';

test('scrypt password hashes verify without storing the password', () => {
  const hash = hashPassword('correct horse battery staple', { salt: Buffer.alloc(16, 7) });
  assert.equal(verifyPassword('correct horse battery staple', hash), true);
  assert.equal(verifyPassword('wrong password', hash), false);
  assert.equal(hash.includes('correct horse'), false);
});

test('session and purpose-bound tokens reject tampering', () => {
  const session = createSessionToken();
  assert.equal(verifySessionToken(session.token).sub, 'weekend-admin');
  assert.throws(() => verifySessionToken(`${session.token}x`), /invalid/i);

  const token = createOpaqueToken('staged-asset', { id: 'asset-1' }, 60);
  assert.deepEqual(verifyOpaqueToken(token, 'staged-asset'), { id: 'asset-1' });
  assert.throws(() => verifyOpaqueToken(token, 'private-asset'), /wrong purpose/i);
});
