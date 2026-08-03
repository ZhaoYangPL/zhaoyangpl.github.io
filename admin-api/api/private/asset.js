import { verifyOpaqueToken } from '../../src/auth.js';
import { decryptBytes } from '../../src/crypto.js';
import { readBlob } from '../../src/github.js';
import { api, ApiError, readJson } from '../../src/http.js';

export const handler = api(async (request) => {
  const body = await readJson(request);
  const descriptor = verifyOpaqueToken(body.token, 'private-asset');
  if (!descriptor?.sha || !/^image\/(jpeg|png|webp|gif)$/.test(descriptor.mime)) {
    throw new ApiError(400, 'The private image token is invalid.');
  }
  const encrypted = await readBlob(descriptor.sha);
  const image = decryptBytes(encrypted);
  return new Response(image, {
    status: 200,
    headers: {
      'Content-Type': descriptor.mime,
      'Content-Length': String(image.length),
      'Cache-Control': 'private, no-store, max-age=0',
      'Content-Disposition': 'inline',
      'X-Content-Type-Options': 'nosniff'
    }
  });
});

export default { fetch: handler };
