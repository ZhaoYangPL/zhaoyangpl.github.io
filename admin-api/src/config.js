export class ConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

export function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new ConfigurationError(`Missing required environment variable: ${name}`);
  return value;
}

export function optionalEnv(name, fallback = '') {
  return process.env[name]?.trim() || fallback;
}

export function githubConfig() {
  return {
    token: requiredEnv('GITHUB_TOKEN'),
    owner: optionalEnv('GITHUB_OWNER', 'ZhaoYangPL'),
    repo: optionalEnv('GITHUB_REPO', 'zhaoyang.github.io'),
    branch: optionalEnv('GITHUB_BRANCH', 'main'),
    apiVersion: optionalEnv('GITHUB_API_VERSION', '2022-11-28')
  };
}

export function deepSeekConfig() {
  return {
    apiKey: requiredEnv('DEEPSEEK_API_KEY'),
    baseUrl: optionalEnv('DEEPSEEK_BASE_URL', 'https://api.deepseek.com').replace(/\/$/, ''),
    model: optionalEnv('DEEPSEEK_MODEL', 'deepseek-v4-flash')
  };
}

export function allowedOrigins() {
  return optionalEnv('ALLOWED_ORIGINS', 'https://zhaoyangpl.github.io')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);
}
