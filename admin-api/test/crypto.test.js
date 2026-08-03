import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import test from 'node:test';
import { decryptBytes, decryptJson, encryptBytes, encryptJson } from '../src/crypto.js';

process.env.PRIVATE_CONTENT_KEY = randomBytes(32).toString('base64');

test('private post JSON is authenticated and contains no plaintext', () => {
  const source = { markdown: 'A private sentence nobody should see.', assets: [] };
  const encrypted = encryptJson(source);
  assert.equal(JSON.stringify(encrypted).includes('private sentence'), false);
  assert.deepEqual(decryptJson(encrypted), source);
  assert.throws(() => decryptJson({ ...encrypted, tag: Buffer.alloc(16).toString('base64') }), /could not be decrypted/i);
});

test('private image bytes round-trip through the encrypted envelope', () => {
  const source = Buffer.from('not-really-an-image-but-private');
  const encrypted = encryptBytes(source);
  assert.equal(encrypted.includes(source), false);
  assert.deepEqual(decryptBytes(encrypted), source);
  encrypted[encrypted.length - 1] ^= 1;
  assert.throws(() => decryptBytes(encrypted), /could not be decrypted/i);
});
