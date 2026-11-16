# Weekend's Website

Personal website and Markdown blog built with Jekyll, Chirpy, GitHub Pages, and a private Vercel Functions editor.

## Content

- Public and private Blog posts live under `_posts/Blog/<Category>/`.
- The visible Blog taxonomy is stored in `_data/blog_categories.yml`.
- Historical course notes remain under `_posts/Notes/` but are excluded from the published site, along with the Notes tab.
- Research interests and project descriptions live in `_data/research.yml`.
- Talks and their materials live in `_data/talks.yml` and appear alongside projects on the research timeline.
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

## Research talks and materials

To add a talk, replace the empty `[]` in `_data/talks.yml` with a list, or append to the existing list. The timeline merges talks with project start dates and sorts them chronologically. Use a project ID from `_data/research.yml` to connect a talk to its project.

```yaml
- date: "2026-12-01" # Replace with the actual talk date.
  title: "Your talk title"
  event: "Your seminar or reading group"
  project: context-compaction
  description: "A short description of the question discussed in this talk."
  recording: "https://www.youtube.com/watch?v=YOUR_VIDEO_ID"
  slides: /assets/file/talks/your-talk-slides.pdf
  notes: /posts/your-talk-notes/
  # Optional: a direct MP4 URL or site path adds a native video player.
  # video_file: /assets/video/your-talk.mp4
```

All material fields are optional: only supplied links appear. A hosted recording is usually preferable for large videos. Local paths must start with `/`; external links must be full URLs. The example is a template, not a published talk.

## One-page CV

The editable source is [Wenkai_Chen_Mitacs_CV_Revised.tex](assets/file/个人经历/Wenkai_Chen_Mitacs_CV_Revised.tex). Compile it with pdfLaTeX, then place the PDF at `assets/file/Wenkai_Chen_CV.pdf`. The homepage uses `cv_url` in `_config.yml` for its CV link. Keep LaTeX auxiliary files outside the published assets directory.
