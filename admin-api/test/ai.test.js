import assert from 'node:assert/strict';
import test from 'node:test';
import { validateSuggestions } from '../src/ai.js';

test('DeepSeek suggestion output must contain exactly three non-empty choices', () => {
  const result = validateSuggestions({
    detectedLanguage: 'en',
    suggestions: [
      { label: 'Faithful', text: 'One' },
      { label: 'Natural', text: 'Two' },
      { label: 'Expressive', text: 'Three' }
    ]
  });
  assert.equal(result.suggestions.length, 3);
  assert.throws(() => validateSuggestions({ suggestions: [{ text: 'Only one' }] }), /invalid/i);
  assert.throws(() => validateSuggestions({ suggestions: [{ text: '1' }, { text: '' }, { text: '3' }] }), /empty/i);
});
