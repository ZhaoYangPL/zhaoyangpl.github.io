import { publishPost } from '../../src/posts.js';
import { api, json, readJson } from '../../src/http.js';

export const handler = api(async (request) => {
  const body = await readJson(request);
  return json(await publishPost(body), 201);
});

export default { fetch: handler };
