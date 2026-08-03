import { suggestWindow } from '../../src/ai.js';
import { api, json, readJson } from '../../src/http.js';

export const handler = api(async (request) => {
  const body = await readJson(request);
  return json(await suggestWindow(body.text));
});

export default { fetch: handler };
