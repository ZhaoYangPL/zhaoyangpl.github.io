import { allowedOrigins, ConfigurationError } from './config.js';
import { verifySessionToken } from './auth.js';

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...headers
    }
  });
}

export async function readJson(request) {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) throw new ApiError(415, 'Expected an application/json request.');
  try {
    return await request.json();
  } catch {
    throw new ApiError(400, 'The JSON request body is invalid.');
  }
}

function requestOrigin(request) {
  return request.headers.get('origin')?.replace(/\/$/, '') || '';
}

function assertOriginAllowed(request) {
  const origin = requestOrigin(request);
  if (origin && !allowedOrigins().includes(origin)) throw new ApiError(403, 'This website origin is not allowed.');
}

function corsHeaders(request) {
  const origin = requestOrigin(request);
  const headers = {
    Vary: 'Origin',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Max-Age': '86400'
  };
  if (origin && allowedOrigins().includes(origin)) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}

function addCors(request, response) {
  const headers = new Headers(response.headers);
  Object.entries(corsHeaders(request)).forEach(([name, value]) => headers.set(name, value));
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function bearerToken(request) {
  const authorization = request.headers.get('authorization') || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) throw new ApiError(401, 'Administrator sign-in is required.');
  return match[1];
}

export function api(handler, { auth = true, methods = ['POST'] } = {}) {
  return async (request) => {
    try {
      assertOriginAllowed(request);
      if (request.method === 'OPTIONS') return addCors(request, new Response(null, { status: 204 }));
      if (!methods.includes(request.method)) throw new ApiError(405, 'Method not allowed.');
      const session = auth ? verifySessionToken(bearerToken(request)) : null;
      const response = await handler(request, session);
      return addCors(request, response instanceof Response ? response : json(response));
    } catch (error) {
      const status = error instanceof ApiError ? error.status : error instanceof ConfigurationError ? 503 : 500;
      const message = status === 500 ? 'The server could not complete this request.' : error.message;
      if (status === 500) console.error(error);
      return addCors(request, json({ error: message, details: error.details }, status));
    }
  };
}
