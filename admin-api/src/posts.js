import { optionalEnv } from './config.js';
import { encryptJson } from './crypto.js';
import { verifyStagedAsset } from './assets.js';
import { readCategories } from './categories.js';
import { commitEntries, pathExists } from './github.js';
import { ApiError } from './http.js';

function yaml(value) {
  return JSON.stringify(value);
}

export function shanghaiTimestamp(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(now);
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  return {
    day: `${values.year}-${values.month}-${values.day}`,
    full: `${values.year}-${values.month}-${values.day} ${values.hour}:${values.minute}:${values.second} +0800`
  };
}

function validateTags(tags) {
  if (!Array.isArray(tags)) throw new ApiError(400, 'Tags must be an array.');
  const normalized = [...new Set(tags.map((tag) => String(tag).trim()).filter(Boolean))];
  if (normalized.length > 12 || normalized.some((tag) => tag.length > 40 || /[\x00-\x1f\x7f]/u.test(tag))) {
    throw new ApiError(400, 'Use at most 12 tags, each no longer than 40 characters.');
  }
  return normalized;
}

export function validatePostInput(input) {
  const title = String(input?.title || '').trim();
  const slug = String(input?.slug || '').trim().toLowerCase();
  const category = String(input?.category || '').trim();
  const markdown = String(input?.markdown || '').trim();
  const isPrivate = input?.private === true;
  if (!title || title.length > 160) throw new ApiError(400, 'Post titles must contain 1–160 characters.');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 100) {
    throw new ApiError(400, 'The URL slug must use lowercase letters, numbers, and single hyphens.');
  }
  if (!category) throw new ApiError(400, 'Choose a Blog category.');
  if (!markdown || markdown.length > 200000) throw new ApiError(400, 'Markdown must contain 1–200,000 characters.');
  const tags = isPrivate ? [] : validateTags(input.tags || []);
  const stagedAssets = Array.isArray(input.stagedAssets) ? input.stagedAssets : [];
  if (stagedAssets.length > 20) throw new ApiError(400, 'A post may contain at most 20 staged images.');
  return { title, slug, category, markdown, private: isPrivate, tags, stagedAssets };
}

export function buildPostFile(post, categoryName, timestamp, privatePayload = null) {
  const lines = [
    '---',
    `title: ${yaml(post.title)}`,
    `date: ${timestamp.full}`,
    `categories: ${yaml(['Blog', categoryName])}`
  ];

  if (post.private) {
    lines.push(
      'layout: post',
      'private: true',
      'toc: false',
      'comments: false',
      `description: ${yaml('Private post — sign in to read.')}`,
      'encrypted_payload:',
      `  version: ${privatePayload.version}`,
      `  iv: ${yaml(privatePayload.iv)}`,
      `  tag: ${yaml(privatePayload.tag)}`,
      `  ciphertext: ${yaml(privatePayload.ciphertext)}`,
      '---',
      '',
      '{% include private-post.html %}',
      ''
    );
  } else {
    lines.push(`tags: ${yaml(post.tags)}`, '---', '', post.markdown, '');
  }
  return lines.join('\n');
}

export async function publishPost(input) {
  const post = validatePostInput(input);
  const taxonomy = await readCategories();
  const category = taxonomy.categories.find((candidate) => candidate.folder === post.category);
  if (!category) throw new ApiError(400, 'The selected Blog category does not exist.');

  const descriptors = post.stagedAssets.map(verifyStagedAsset);
  const ids = new Set();
  for (const descriptor of descriptors) {
    if (ids.has(descriptor.id)) throw new ApiError(400, 'A staged image was included more than once.');
    ids.add(descriptor.id);
    const expectedPrivacy = post.private ? 'private' : 'public';
    if (descriptor.privacy !== expectedPrivacy) {
      throw new ApiError(400, 'Staged image privacy does not match the post privacy setting.');
    }
  }

  const timestamp = shanghaiTimestamp();
  const postPath = `_posts/Blog/${category.folder}/${timestamp.day}-${post.slug}.md`;
  if (await pathExists(postPath)) throw new ApiError(409, 'A post with this date and slug already exists.');

  let privatePayload = null;
  if (post.private) {
    privatePayload = encryptJson({
      markdown: post.markdown,
      assets: descriptors.map(({ id, sha, mime }) => ({ id, sha, mime }))
    });
  }
  const postFile = buildPostFile(post, category.name, timestamp, privatePayload);
  const entries = [
    { path: postPath, content: Buffer.from(postFile, 'utf8') },
    ...descriptors.map((descriptor) => ({ path: descriptor.path, sha: descriptor.sha }))
  ];
  const commit = await commitEntries(entries, `Publish Blog: ${post.title}`);
  const siteUrl = optionalEnv('SITE_URL', 'https://zhaoyangpl.github.io').replace(/\/$/, '');
  return {
    ...commit,
    postPath,
    postUrl: `${siteUrl}/posts/${post.slug}/`
  };
}
