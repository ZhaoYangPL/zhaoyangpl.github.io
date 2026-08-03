# Weekend's Website

Personal website and Markdown blog built with Jekyll, Chirpy, GitHub Pages, and a private Vercel Functions editor.

## Content

- Public and private Blog posts live under `_posts/Blog/<Category>/`.
- The visible Blog taxonomy is stored in `_data/blog_categories.yml`.
- Notes remain under `_posts/Notes/`.
- Pushing `main` triggers `.github/workflows/pages-deploy.yml` and publishes the static site.

## Web editor

`/write/` provides the password-protected Markdown editor. Its API is isolated in `admin-api/`; see
[admin-api/README.md](admin-api/README.md) for secret generation, GitHub token permissions, DeepSeek configuration,
and Vercel deployment.

The public Vercel API URL must be set as `editor_api_url` in `_config.yml`. Never put passwords, GitHub tokens,
DeepSeek keys, or the private content key in the Jekyll configuration or committed files.

## Local Jekyll preview

```bash
bundle install
bundle exec jekyll serve --livereload
```

Backend tests do not require third-party packages:

```powershell
cd admin-api
npm.cmd test
```
