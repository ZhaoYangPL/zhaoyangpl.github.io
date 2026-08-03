import { polishArticle } from '../../src/ai.js';
import { api, json, readJson } from '../../src/http.js';

export const handler = api(async (request) => {
  const body = await readJson(request);
  return json(await polishArticle(body.markdown));
});

export default { fetch: handler };
