import {
  assertLoginAllowed,
  clearLoginFailures,
  createSessionToken,
  recordLoginFailure,
  verifyPassword
} from '../../src/auth.js';
import { api, ApiError, json, readJson } from '../../src/http.js';

export const handler = api(async (request) => {
  assertLoginAllowed(request);
  const body = await readJson(request);
  const password = typeof body.password === 'string' ? body.password : '';
  if (!password || password.length > 256 || !verifyPassword(password)) {
    recordLoginFailure(request);
    await new Promise((resolve) => setTimeout(resolve, 350));
    throw new ApiError(401, 'The admin password is incorrect.');
  }
  clearLoginFailures(request);
  return json(createSessionToken());
}, { auth: false });

export default { fetch: handler };
