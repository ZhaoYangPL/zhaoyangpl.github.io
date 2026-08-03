import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

test('Daily posts were migrated into the Blog hierarchy', async () => {
  const dailyDir = path.join(root, '_posts', 'Blog', 'Daily');
  const files = (await readdir(dailyDir)).filter((file) => file.endsWith('.md'));
  assert.equal(files.length, 9);
  for (const file of files) {
    const content = await readFile(path.join(dailyDir, file), 'utf8');
    assert.match(content, /^categories:\s*\[Blog, Daily\]$/m);
  }
});

test('legacy About, DISCARD, and Secret implementations are absent', async () => {
  const absent = [
    '_tabs/about.md',
    '_posts/DISCARD/2025-10-11-DiscardPro.md',
    '_posts/Secret/2025-10-09-SecretNotes.md',
    '_layouts/secret.html',
    'assets/js/secret-loader.js',
    'encryptor.html'
  ];
  for (const relative of absent) {
    await assert.rejects(() => readFile(path.join(root, relative), 'utf8'), { code: 'ENOENT' });
  }
});

test('editor and private reader always sanitize rendered Markdown', async () => {
  const editor = await readFile(path.join(root, 'assets/js/blog-editor.js'), 'utf8');
  const privateReader = await readFile(path.join(root, 'assets/js/private-post.js'), 'utf8');
  assert.match(editor, /DOMPurify\.sanitize\(marked\.parse/);
  assert.match(privateReader, /DOMPurify\.sanitize\(marked\.parse/);
  assert.match(editor, /maxSuggestionChars = 1200/);
});

test('home and search descriptions use a privacy-aware Chirpy summary', async () => {
  const description = await readFile(path.join(root, '_includes/post-description.html'), 'utf8');
  const home = await readFile(path.join(root, '_layouts/home.html'), 'utf8');
  const search = await readFile(path.join(root, 'assets/js/data/search.json'), 'utf8');

  assert.match(description, /if post\.private/);
  assert.match(description, /Private post — sign in to read\./);
  assert.match(description, /include post-summary\.html/);
  assert.match(description, /full_text=true/);
  assert.match(description, /description \| jsonify/);
  assert.match(home, /include post-description\.html/);
  assert.match(search, /include post-description\.html json=true/);
});
