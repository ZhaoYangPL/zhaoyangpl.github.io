import { githubConfig } from './config.js';
import { ApiError } from './http.js';

function repositoryBase(config) {
  return `/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}`;
}

export async function githubRequest(path, options = {}) {
  const config = githubConfig();
  const response = await fetch(`https://api.github.com${path}`, {
    method: options.method || 'GET',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${config.token}`,
      'X-GitHub-Api-Version': config.apiVersion,
      'User-Agent': 'weekend-blog-admin-api',
      ...(options.headers || {})
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  if (options.allow404 && response.status === 404) return null;
  if (!response.ok) {
    let details;
    try {
      details = await response.json();
    } catch {
      details = { message: await response.text() };
    }
    const status = response.status === 401 || response.status === 403 ? 502 : response.status;
    throw new ApiError(status, `GitHub rejected the repository operation (${response.status}).`, details?.message);
  }
  if (response.status === 204) return null;
  return response.json();
}

export function encodeRepositoryPath(path) {
  return path.split('/').map(encodeURIComponent).join('/');
}

export async function createBlob(bytes) {
  const config = githubConfig();
  const result = await githubRequest(`${repositoryBase(config)}/git/blobs`, {
    method: 'POST',
    body: { content: Buffer.from(bytes).toString('base64'), encoding: 'base64' }
  });
  return result.sha;
}

export async function readBlob(sha) {
  const config = githubConfig();
  const result = await githubRequest(`${repositoryBase(config)}/git/blobs/${encodeURIComponent(sha)}`);
  if (result.encoding !== 'base64') throw new ApiError(502, 'GitHub returned an unsupported blob encoding.');
  return Buffer.from(result.content.replace(/\n/g, ''), 'base64');
}

export async function readRepositoryFile(path) {
  const config = githubConfig();
  const result = await githubRequest(
    `${repositoryBase(config)}/contents/${encodeRepositoryPath(path)}?ref=${encodeURIComponent(config.branch)}`,
    { allow404: true }
  );
  if (!result) return null;
  if (result.type !== 'file' || result.encoding !== 'base64') throw new ApiError(502, `Unable to read ${path} from GitHub.`);
  return {
    sha: result.sha,
    content: Buffer.from(result.content.replace(/\n/g, ''), 'base64')
  };
}

export async function pathExists(path) {
  return Boolean(await readRepositoryFile(path));
}

async function currentCommitState() {
  const config = githubConfig();
  const ref = await githubRequest(`${repositoryBase(config)}/git/ref/heads/${encodeURIComponent(config.branch)}`);
  const commit = await githubRequest(`${repositoryBase(config)}/git/commits/${encodeURIComponent(ref.object.sha)}`);
  return { config, headSha: ref.object.sha, treeSha: commit.tree.sha };
}

export async function commitEntries(entries, message) {
  const { config, headSha, treeSha } = await currentCommitState();
  const treeEntries = [];
  for (const entry of entries) {
    const sha = entry.sha || await createBlob(entry.content);
    treeEntries.push({ path: entry.path, mode: '100644', type: 'blob', sha });
  }

  const tree = await githubRequest(`${repositoryBase(config)}/git/trees`, {
    method: 'POST',
    body: { base_tree: treeSha, tree: treeEntries }
  });
  const commit = await githubRequest(`${repositoryBase(config)}/git/commits`, {
    method: 'POST',
    body: { message, tree: tree.sha, parents: [headSha] }
  });

  try {
    await githubRequest(`${repositoryBase(config)}/git/refs/heads/${encodeURIComponent(config.branch)}`, {
      method: 'PATCH',
      body: { sha: commit.sha, force: false }
    });
  } catch (error) {
    if (error.status === 409 || error.status === 422) {
      throw new ApiError(409, 'The repository changed while publishing. Retry to create a fresh commit.');
    }
    throw error;
  }

  return {
    sha: commit.sha,
    commitUrl: `https://github.com/${config.owner}/${config.repo}/commit/${commit.sha}`
  };
}
