# Starcat Blog — authoring guide

Static blog for [starcat.ink](https://starcat.ink). Posts are authored in Markdown and generated into complete HTML with [marked](https://github.com/markedjs/marked) (MIT, vendored under `vendor/marked.min.js`). Static rendering keeps the initial response readable by people, search crawlers, feed readers, and clients that do not execute JavaScript.

## Add a post

1. Create `posts/your-slug.md` (slug: lowercase letters, numbers, hyphens only).
2. Optional frontmatter at the top:

```markdown
---
title: Your Title
date: 2026-07-22
summary: One-line description for SEO / previews.
author: Starcat
---

Markdown body starts here.
```

3. Register the post in `posts/index.json` (list page + metadata). Newest posts should have the latest `date` — the list sorts by `date` descending.

```json
{
  "slug": "your-slug",
  "title": "Your Title",
  "summary": "One-line description for SEO / previews.",
  "date": "2026-07-22",
  "author": "Starcat",
  "minutes": 4
}
```

4. Generate the blog and sitemap:

```bash
node blog/generate-blog.mjs
node blog/verify-blog.mjs
```

5. Review generated HTML, `blog/feed.xml`, and `sitemap.xml`, then deploy the `starcat-site/direct` site as usual.

## URLs

| Page | Path |
|------|------|
| List | `/blog/` or `/blog/index.html` |
| Post | `/blog/your-slug/` |
| Atom feed | `/blog/feed.xml` |

The former `/blog/post.html?slug=...` form is a compatibility route only. Production Nginx redirects valid slugs to the clean URL and returns `404` for invalid values.

## Local preview

Serve the `starcat-site/direct` directory over HTTP (file:// will block `fetch` of `.md` in most browsers):

```bash
cd supports/starcat-site/direct && python3 -m http.server 8765
```

Then open `http://127.0.0.1:8765/blog/`. Run the generator again after editing Markdown or metadata.
