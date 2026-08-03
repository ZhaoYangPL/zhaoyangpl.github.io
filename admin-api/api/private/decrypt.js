import { createOpaqueToken } from '../../src/auth.js';
import { decryptJson } from '../../src/crypto.js';
import { api, ApiError, json, readJson } from '../../src/http.js';

export const handler = api(async (request) => {
  const body = await readJson(request);
  const decrypted = decryptJson(body.payload);
  if (typeof decrypted?.markdown !== 'string' || !Array.isArray(decrypted.assets)) {
    throw new ApiError(400, 'The decrypted private post has an invalid structure.');
  }
  const assets = decrypted.assets.map((asset) => {
    if (!asset?.id || !asset?.sha || !/^image\/(jpeg|png|webp|gif)$/.test(asset.mime)) {
      throw new ApiError(400, 'The private post contains an invalid image descriptor.');
    }
    return {
      id: asset.id,
      mime: asset.mime,
      token: createOpaqueToken('private-asset', { sha: asset.sha, mime: asset.mime }, 10 * 60)
    };
  });
  return json({ markdown: decrypted.markdown, assets });
});

export default { fetch: handler };
