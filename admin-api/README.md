# Weekend Blog Admin API

This Vercel Functions project is the private backend for `/write/`. It authenticates the owner, calls DeepSeek,
stages images as Git blobs, creates atomic Git commits, and decrypts private posts. The Jekyll site remains on GitHub
Pages; no secret is embedded in the generated website.

## 1. Generate secrets

Use Node.js 22 or newer:

```powershell
cd admin-api
npm.cmd run generate-secrets
```

The command prints a random admin password, its scrypt verifier, a session signing secret, and a 32-byte private
content key. Save the admin password and `PRIVATE_CONTENT_KEY` in a password manager. Losing the content key makes
private posts and private images unrecoverable.

## 2. Create the GitHub token

Create a fine-grained personal access token restricted to `ZhaoYangPL/zhaoyang.github.io` with only
**Repository permissions → Contents: Read and write**. Workflows permission is not needed because the API only adds
posts, category data, and images; the existing push workflow runs automatically.

## 3. Deploy on Vercel

1. Import this GitHub repository into Vercel.
2. Set the Vercel project **Root Directory** to `admin-api`.
3. Copy every key from `.env.example` into Vercel Project Settings → Environment Variables.
4. Replace the generated values and set `DEEPSEEK_API_KEY`. `DEEPSEEK_MODEL` remains configurable so model upgrades
   do not require code changes.
5. Deploy and open `https://YOUR-PROJECT.vercel.app/api/health`. It should return `{"ok":true,"missing":[]}`.
6. Put the production Vercel URL in the root `_config.yml` as `editor_api_url`, then deploy the Jekyll site.

For local Jekyll development, keep `http://127.0.0.1:4000` in `ALLOWED_ORIGINS`. Production should include only the
real GitHub Pages/custom domain. The login rate limiter is best-effort in a stateless function, so use the generated
high-entropy password.

## 4. DeepSeek behavior

- `/api/ai/suggest` accepts at most 1,200 characters and returns exactly three structured alternatives.
- `/api/ai/polish` splits long Markdown at headings/paragraphs and returns a separate candidate.
- Private drafts never call DeepSeek until the editor's explicit consent checkbox is enabled.

## 5. Private posts

The public repository contains only AES-256-GCM ciphertext. Private images are encrypted before their Git blobs are
created. Reading requires a valid eight-hour admin session; decrypted responses use `Cache-Control: no-store`.

Run the backend tests with:

```powershell
npm.cmd test
```
