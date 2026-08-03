import { randomUUID } from 'node:crypto';
import { createOpaqueToken, verifyOpaqueToken } from './auth.js';
import { encryptBytes } from './crypto.js';
import { createBlob } from './github.js';
import { ApiError } from './http.js';

const maxImageBytes = 3 * 1024 * 1024;
const imageExtensions = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif']
]);

function shanghaiDateParts() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());
  return Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
}

export async function stageImage(file, privacy) {
  if (!(file instanceof Blob)) throw new ApiError(400, 'An image file is required.');
  const extension = imageExtensions.get(file.type);
  if (!extension) throw new ApiError(400, 'Use a JPEG, PNG, WebP, or GIF image.');
  if (file.size <= 0 || file.size > maxImageBytes) throw new ApiError(413, 'Images must be 3 MB or smaller after optimization.');
  if (!['public', 'private'].includes(privacy)) throw new ApiError(400, 'Image privacy must be public or private.');

  const bytes = Buffer.from(await file.arrayBuffer());
  const stored = privacy === 'private' ? encryptBytes(bytes) : bytes;
  const sha = await createBlob(stored);
  const id = randomUUID();
  const { year, month } = shanghaiDateParts();
  const path = privacy === 'private'
    ? `assets/private/blog/${year}/${month}/${id}.enc`
    : `assets/img/blog/${year}/${month}/${id}.${extension}`;
  const descriptor = { id, sha, path, mime: file.type, privacy, size: file.size };
  const stagingToken = createOpaqueToken('staged-asset', descriptor, 24 * 60 * 60);
  const name = typeof file.name === 'string' ? file.name.slice(0, 180) : `image.${extension}`;
  return {
    id,
    name,
    mime: file.type,
    size: file.size,
    privacy,
    markdownUrl: privacy === 'private' ? `private-asset://${id}` : `/${path}`,
    stagingToken
  };
}

export function verifyStagedAsset(asset) {
  if (!asset || typeof asset.stagingToken !== 'string') throw new ApiError(400, 'A staged image token is missing.');
  const descriptor = verifyOpaqueToken(asset.stagingToken, 'staged-asset');
  if (descriptor.id !== asset.id || descriptor.privacy !== asset.privacy) {
    throw new ApiError(400, 'A staged image descriptor was modified.');
  }
  return descriptor;
}
