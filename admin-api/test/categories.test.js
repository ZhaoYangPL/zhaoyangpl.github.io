import assert from 'node:assert/strict';
import test from 'node:test';
import {
  normalizeCategory,
  parseCategoriesYaml,
  serializeCategoriesYaml
} from '../src/categories.js';

test('category taxonomy round-trips and supports Unicode', () => {
  const categories = [
    { name: 'Daily', folder: 'Daily' },
    { name: '数学随笔', folder: '数学随笔' }
  ];
  assert.deepEqual(parseCategoriesYaml(serializeCategoriesYaml(categories)), categories);
  assert.deepEqual(normalizeCategory(' Causal Notes '), { name: 'Causal Notes', folder: 'Causal-Notes' });
});

test('category names cannot escape the Blog folder', () => {
  for (const name of ['../Secret', 'Math/Other', 'CON', 'bad:name', '.', '']) {
    assert.throws(() => normalizeCategory(name));
  }
});
