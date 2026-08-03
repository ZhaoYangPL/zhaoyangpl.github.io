import { deepSeekConfig } from './config.js';
import { ApiError } from './http.js';

async function deepSeekJson(messages, { maxTokens = 2400, temperature = 0.45 } = {}) {
  const config = deepSeekConfig();
  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        response_format: { type: 'json_object' },
        thinking: { type: 'disabled' },
        temperature,
        max_tokens: maxTokens
      })
    });
    if (!response.ok) {
      const details = await response.text();
      throw new ApiError(502, `DeepSeek returned ${response.status}.`, details.slice(0, 300));
    }
    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    try {
      if (!content) throw new Error('Empty model response');
      return JSON.parse(content);
    } catch (error) {
      lastError = error;
      messages = [
        ...messages,
        { role: 'user', content: 'Return only a non-empty, valid JSON object matching the requested schema.' }
      ];
    }
  }
  throw new ApiError(502, 'DeepSeek did not return valid structured output.', lastError?.message);
}

export function validateSuggestions(result) {
  if (!result || !Array.isArray(result.suggestions) || result.suggestions.length !== 3) {
    throw new ApiError(502, 'DeepSeek returned an invalid suggestion set.');
  }
  const suggestions = result.suggestions.map((suggestion, index) => {
    if (typeof suggestion?.text !== 'string' || !suggestion.text.trim()) {
      throw new ApiError(502, 'DeepSeek returned an empty writing suggestion.');
    }
    const defaults = ['Faithful', 'Natural', 'Expressive'];
    return {
      label: typeof suggestion.label === 'string' && suggestion.label.trim() ? suggestion.label.trim() : defaults[index],
      text: suggestion.text.trim()
    };
  });
  return {
    detectedLanguage: ['zh', 'en', 'mixed'].includes(result.detectedLanguage) ? result.detectedLanguage : 'mixed',
    suggestions
  };
}

export async function suggestWindow(text) {
  if (typeof text !== 'string' || text.trim().length < 5 || text.length > 1200) {
    throw new ApiError(400, 'Suggestion text must contain 5–1,200 characters.');
  }
  const result = await deepSeekJson([
    {
      role: 'system',
      content: [
        'You are an English writing partner for a personal blog.',
        'Detect whether the input is Chinese, English, or mixed.',
        'For Chinese or mixed Chinese input, produce three English translations: Faithful, Natural, and Expressive.',
        'For English input, produce three polished English alternatives with the same labels.',
        'Preserve Markdown links, image syntax, inline code, code fences, names, and factual meaning.',
        'Return JSON exactly as {"detectedLanguage":"zh|en|mixed","suggestions":[{"label":"Faithful","text":"..."},{"label":"Natural","text":"..."},{"label":"Expressive","text":"..."}]}.'
      ].join(' ')
    },
    { role: 'user', content: `Writing window:\n${text}` }
  ]);
  return validateSuggestions(result);
}

function splitMarkdown(markdown, maxChars = 8000) {
  const blocks = markdown.split(/(?=^#{1,3}\s)|\n{2,}/m).filter(Boolean);
  const chunks = [];
  let current = '';
  for (const block of blocks) {
    if (current && current.length + block.length > maxChars) {
      chunks.push(current);
      current = '';
    }
    if (block.length > maxChars) {
      if (current) chunks.push(current);
      for (let offset = 0; offset < block.length; offset += maxChars) chunks.push(block.slice(offset, offset + maxChars));
    } else {
      current += `${current ? '\n\n' : ''}${block}`;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

async function polishChunk(markdown, index, total) {
  const result = await deepSeekJson([
    {
      role: 'system',
      content: [
        'Polish the English prose in this Markdown blog section while preserving the author’s voice and factual meaning.',
        'Translate Chinese prose into natural English, but never alter URLs, image targets, code, front matter-like text, or Markdown structure.',
        'Return JSON exactly as {"markdown":"...","summary":["..."]}.',
        `This is section ${index + 1} of ${total}.`
      ].join(' ')
    },
    { role: 'user', content: markdown }
  ], { maxTokens: 7000, temperature: 0.35 });
  if (typeof result?.markdown !== 'string' || !result.markdown.trim()) {
    throw new ApiError(502, 'DeepSeek returned an empty polished section.');
  }
  return {
    markdown: result.markdown.trim(),
    summary: Array.isArray(result.summary) ? result.summary.filter((item) => typeof item === 'string').slice(0, 5) : []
  };
}

export async function polishArticle(markdown) {
  if (typeof markdown !== 'string' || !markdown.trim() || markdown.length > 100000) {
    throw new ApiError(400, 'Full-article polishing accepts 1–100,000 characters.');
  }
  const chunks = splitMarkdown(markdown);
  const results = new Array(chunks.length);
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(3, chunks.length) }, async () => {
    while (nextIndex < chunks.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await polishChunk(chunks[index], index, chunks.length);
    }
  });
  await Promise.all(workers);
  const polished = results.map((result) => result.markdown);
  const summary = results.flatMap((result) => result.summary);
  return {
    markdown: polished.join('\n\n'),
    summary: [...new Set(summary)].slice(0, 12)
  };
}
