import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual
} from 'node:crypto';
import { requiredEnv } from './config.js';
import { ApiError } from './http.js';

const loginAttempts = new Map();
const loginWindowMs = 15 * 60 * 1000;
const maxLoginAttempts = 5;

const encode = (value) => Buffer.from(value).toString('base64url');
const decodeJson = (value) => JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));

function sessionSecret() {
  const secret = requiredEnv('SESSION_SECRET');
  if (secret.length < 32) throw new Error('SESSION_SECRET must contain at least 32 characters.');
  return secret;
}

function signature(value) {
  return createHmac('sha256', sessionSecret()).update(value).digest('base64url');
}

export function hashPassword(password, options = {}) {
  const N = options.N || 16384;
  const r = options.r || 8;
  const p = options.p || 1;
  const salt = options.salt || randomBytes(16);
  const derived = scryptSync(password, salt, 64, { N, r, p, maxmem: 64 * 1024 * 1024 });
  return `scrypt$${N}$${r}$${p}$${Buffer.from(salt).toString('base64url')}$${derived.toString('base64url')}`;
}

export function verifyPassword(password, encodedHash = requiredEnv('ADMIN_PASSWORD_HASH')) {
  const parts = encodedHash.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') throw new Error('ADMIN_PASSWORD_HASH has an invalid format.');
  const [, N, r, p, saltValue, expectedValue] = parts;
  const salt = Buffer.from(saltValue, 'base64url');
  const expected = Buffer.from(expectedValue, 'base64url');
  const actual = scryptSync(password, salt, expected.length, {
    N: Number(N),
    r: Number(r),
    p: Number(p),
    maxmem: 64 * 1024 * 1024
  });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function signPayload(payload) {
  const header = encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = encode(JSON.stringify(payload));
  const unsigned = `${header}.${body}`;
  return `${unsigned}.${signature(unsigned)}`;
}

function verifySignedPayload(token) {
  const parts = String(token).split('.');
  if (parts.length !== 3) throw new ApiError(401, 'The session token is malformed.');
  const unsigned = `${parts[0]}.${parts[1]}`;
  const expected = Buffer.from(signature(unsigned));
  const actual = Buffer.from(parts[2]);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new ApiError(401, 'The session token is invalid.');
  }
  const payload = decodeJson(parts[1]);
  if (!Number.isFinite(payload.exp) || payload.exp <= Math.floor(Date.now() / 1000)) {
    throw new ApiError(401, 'The session has expired.');
  }
  return payload;
}

export function createSessionToken() {
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = 8 * 60 * 60;
  const token = signPayload({ sub: 'weekend-admin', typ: 'session', iat: now, exp: now + expiresIn });
  return { token, expiresAt: (now + expiresIn) * 1000 };
}

export function verifySessionToken(token) {
  const payload = verifySignedPayload(token);
  if (payload.typ !== 'session' || payload.sub !== 'weekend-admin') throw new ApiError(401, 'Invalid session type.');
  return payload;
}

export function createOpaqueToken(purpose, value, expiresInSeconds) {
  const now = Math.floor(Date.now() / 1000);
  return signPayload({ typ: purpose, value, iat: now, exp: now + expiresInSeconds });
}

export function verifyOpaqueToken(token, purpose) {
  const payload = verifySignedPayload(token);
  if (payload.typ !== purpose) throw new ApiError(400, 'The signed token has the wrong purpose.');
  return payload.value;
}

function attemptKey(request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

export function assertLoginAllowed(request) {
  const key = attemptKey(request);
  const now = Date.now();
  const current = loginAttempts.get(key);
  if (!current || current.resetAt <= now) {
    loginAttempts.set(key, { count: 0, resetAt: now + loginWindowMs });
    return;
  }
  if (current.count >= maxLoginAttempts) throw new ApiError(429, 'Too many failed sign-in attempts. Try again later.');
}

export function recordLoginFailure(request) {
  const key = attemptKey(request);
  const current = loginAttempts.get(key) || { count: 0, resetAt: Date.now() + loginWindowMs };
  current.count += 1;
  loginAttempts.set(key, current);
}

export function clearLoginFailures(request) {
  loginAttempts.delete(attemptKey(request));
}
