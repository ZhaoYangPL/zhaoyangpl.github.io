import { api, json } from '../src/http.js';

const required = [
  'ADMIN_PASSWORD_HASH',
  'SESSION_SECRET',
  'PRIVATE_CONTENT_KEY',
  'GITHUB_TOKEN',
  'DEEPSEEK_API_KEY'
];

export const handler = api(async () => {
  const missing = required.filter((name) => !process.env[name]);
  return json({ ok: missing.length === 0, missing }, missing.length === 0 ? 200 : 503);
}, { auth: false, methods: ['GET'] });

export default { fetch: handler };
