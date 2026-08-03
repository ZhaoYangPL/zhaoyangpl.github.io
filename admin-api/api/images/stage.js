import { stageImage } from '../../src/assets.js';
import { api, ApiError, json } from '../../src/http.js';

export const handler = api(async (request) => {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('multipart/form-data')) throw new ApiError(415, 'Expected a multipart image upload.');
  const form = await request.formData();
  const file = form.get('file');
  const privacy = String(form.get('privacy') || 'public');
  return json({ asset: await stageImage(file, privacy) }, 201);
});

export default { fetch: handler };
