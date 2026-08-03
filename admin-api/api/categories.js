import { createCategory } from '../src/categories.js';
import { api, json, readJson } from '../src/http.js';

export const handler = api(async (request) => {
  const body = await readJson(request);
  return json(await createCategory(body.name), 201);
});

export default { fetch: handler };
