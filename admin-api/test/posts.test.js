import assert from 'node:assert/strict';
import test from 'node:test';
import { buildPostFile, shanghaiTimestamp, validatePostInput } from '../src/posts.js';

test('post validation rejects path traversal and normalizes tags', () => {
  assert.throws(() => validatePostInput({
    title: 'Unsafe', slug: '../unsafe', category: 'Daily', markdown: 'Body', tags: []
  }), /slug/i);
  const post = validatePostInput({
    title: 'Hello', slug: 'hello-world', category: 'Daily', markdown: 'Body', tags: [' writing ', 'writing']
  });
  assert.deepEqual(post.tags, ['writing']);
});

test('private front matter exposes metadata but not plaintext or tags', () => {
  const post = validatePostInput({
    title: 'Locked title',
    slug: 'locked-title',
    category: 'Daily',
    markdown: 'Extremely private body',
    private: true,
    tags: ['secret']
  });
  const file = buildPostFile(post, 'Daily', shanghaiTimestamp(new Date('2026-08-03T00:00:00Z')), {
    version: 1,
    iv: 'iv',
    tag: 'tag',
    ciphertext: 'ciphertext'
  });
  assert.match(file, /title: "Locked title"/);
  assert.match(file, /private: true/);
  assert.equal(file.includes('Extremely private body'), false);
  assert.equal(file.includes('secret'), false);
  assert.match(file, /private-post\.html/);
});
