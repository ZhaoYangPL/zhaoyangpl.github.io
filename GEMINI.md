# Gemini Project Instructions for zhaoyang.github.io

This file provides instructions for the Gemini agent to effectively assist with this project.

## About This Project

This is my personal blog, built with Jekyll. It's used for publishing daily thoughts, technical notes, and secret posts.

## Key Technologies

*   **Jekyll:** The static site generator.
*   **Markdown:** The format for all posts and pages.
*   **Liquid:** The templating language used in layouts and includes.
*   **GitHub Pages:** The hosting platform.

## Important Directories

*   `_posts/`: Contains all blog posts, organized into subdirectories like `Daily`, `Notes`, and `Secret`.
*   `_layouts/`: Defines the main HTML structure for different types of pages.
*   `_includes/`: Contains reusable HTML snippets.
*   `assets/`: Stores all static files like images, PDFs, and JavaScript.
*   `_config.yml`: The main Jekyll configuration file.

## Common Commands

*   **To run the development server:** `bundle exec jekyll serve`
*   **To build the site for production:** `bundle exec jekyll build`

## Workflow for New Posts

When creating a new blog post, please follow this convention:
1.  Create a new Markdown file in the appropriate subdirectory under `_posts/`.
2.  The filename must be in the format `YYYY-MM-DD-your-post-title.md`.
3.  Ensure the post has the necessary front matter (e.g., `layout`, `title`, `date`).
