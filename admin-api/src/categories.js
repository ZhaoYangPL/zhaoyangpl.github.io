import { ApiError } from './http.js';
import { commitEntries, readRepositoryFile } from './github.js';

const taxonomyPath = '_data/blog_categories.yml';
const windowsReserved = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i;

function parseScalar(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith('"')) return JSON.parse(trimmed);
  return trimmed;
}

export function parseCategoriesYaml(source) {
  const categories = [];
  let current = null;
  for (const line of source.split(/\r?\n/)) {
    const name = line.match(/^\s*-\s+name:\s*(.+?)\s*$/);
    if (name) {
      current = { name: parseScalar(name[1]), folder: '' };
      categories.push(current);
      continue;
    }
    const folder = line.match(/^\s+folder:\s*(.+?)\s*$/);
    if (folder && current) current.folder = parseScalar(folder[1]);
  }
  if (categories.some((category) => !category.name || !category.folder)) {
    throw new ApiError(502, 'The Blog category data in GitHub is malformed.');
  }
  return categories;
}

export function serializeCategoriesYaml(categories) {
  return `${categories
    .map((category) => `- name: ${JSON.stringify(category.name)}\n  folder: ${JSON.stringify(category.folder)}`)
    .join('\n')}\n`;
}

export function normalizeCategory(name) {
  const displayName = String(name || '').normalize('NFC').trim();
  if (!displayName || displayName.length > 40) throw new ApiError(400, 'Category names must contain 1–40 characters.');
  if (/[\\/:*?"<>|\x00-\x1f\x7f]/u.test(displayName) || displayName === '.' || displayName === '..') {
    throw new ApiError(400, 'The category name contains unsafe path characters.');
  }
  let folder = displayName.replace(/\s+/gu, '-').replace(/^[. ]+|[. ]+$/gu, '');
  if (!folder || windowsReserved.test(folder) || folder.length > 50) {
    throw new ApiError(400, 'The category name cannot be used as a portable folder name.');
  }
  return { name: displayName, folder };
}

export async function readCategories() {
  const file = await readRepositoryFile(taxonomyPath);
  if (!file) throw new ApiError(502, `GitHub does not contain ${taxonomyPath}. Deploy the site changes first.`);
  return { ...file, categories: parseCategoriesYaml(file.content.toString('utf8')) };
}

export async function createCategory(name) {
  const created = normalizeCategory(name);
  const current = await readCategories();
  if (current.categories.some(
    (category) => category.name.toLocaleLowerCase() === created.name.toLocaleLowerCase()
      || category.folder.toLocaleLowerCase() === created.folder.toLocaleLowerCase()
  )) {
    throw new ApiError(409, 'That Blog category already exists.');
  }
  const categories = [...current.categories, created];
  await commitEntries([
    { path: taxonomyPath, content: Buffer.from(serializeCategoriesYaml(categories), 'utf8') },
    { path: `_posts/Blog/${created.folder}/.gitkeep`, content: Buffer.from('') }
  ], `Add Blog category: ${created.name}`);
  return { created, categories };
}
