import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { requiredEnv } from './config.js';
import { ApiError } from './http.js';

const assetMagic = Buffer.from('WKB1');

function contentKey() {
  const raw = requiredEnv('PRIVATE_CONTENT_KEY');
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) throw new Error('PRIVATE_CONTENT_KEY must be a base64-encoded 32-byte key.');
  return key;
}

export function encryptBytes(bytes) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', contentKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(bytes), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([assetMagic, iv, tag, ciphertext]);
}

export function decryptBytes(envelope) {
  const buffer = Buffer.from(envelope);
  if (buffer.length < 32 || !buffer.subarray(0, 4).equals(assetMagic)) throw new ApiError(400, 'Invalid encrypted asset.');
  const iv = buffer.subarray(4, 16);
  const tag = buffer.subarray(16, 32);
  const ciphertext = buffer.subarray(32);
  try {
    const decipher = createDecipheriv('aes-256-gcm', contentKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  } catch {
    throw new ApiError(400, 'The encrypted asset could not be decrypted.');
  }
}

export function encryptJson(value) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', contentKey(), iv);
  const plaintext = Buffer.from(JSON.stringify(value), 'utf8');
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return {
    version: 1,
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    ciphertext: ciphertext.toString('base64')
  };
}

export function decryptJson(payload) {
  if (!payload || payload.version !== 1) throw new ApiError(400, 'Unsupported encrypted post version.');
  if (
    typeof payload.iv !== 'string'
    || typeof payload.tag !== 'string'
    || typeof payload.ciphertext !== 'string'
    || payload.ciphertext.length > 500000
  ) {
    throw new ApiError(400, 'The encrypted post payload is invalid or too large.');
  }
  try {
    const decipher = createDecipheriv(
      'aes-256-gcm',
      contentKey(),
      Buffer.from(payload.iv, 'base64')
    );
    decipher.setAuthTag(Buffer.from(payload.tag, 'base64'));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(payload.ciphertext, 'base64')),
      decipher.final()
    ]);
    return JSON.parse(plaintext.toString('utf8'));
  } catch {
    throw new ApiError(400, 'The private post could not be decrypted.');
  }
}
