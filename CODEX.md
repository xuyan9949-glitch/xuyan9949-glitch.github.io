# Codex Project Context

This is Leslie's personal investment research website.

When the user says "我的投资网页", "我的个人网页", "维护我的网页", or "Leslie 投资笔记", assume they mean this project.

## Project Identity

- Local path: `/Users/xuyan/Desktop/leslie-invest-site`
- Production site: `https://www.xxyalpha.cn/`
- GitHub Pages repository: `git@github.com:xuyan9949-glitch/xuyan9949-glitch.github.io.git`
- Main branch: `main`
- Site type: static HTML/CSS/JavaScript, no build step required

## Key Files

- `index.html`: homepage and section layout
- `css/style.css`: visual styles
- `js/articles.js`: article index used by homepage, search, categories, and series navigation
- `js/main.js`: homepage rendering, notes filters, series navigation, tracking, calendar, and diagrams logic
- `notes/index.html`: complete searchable article archive
- `diagrams/index.html`: complete industry diagram gallery
- `calendar/index.html`: complete verification calendar
- `articles/<article-id>/index.html`: individual article pages
- `tools/import_markdown.py`: Markdown-to-article importer
- `tools/backfill_site_metadata.py`: article metadata and sitemap maintenance
- `content/articles.json`: admin content registry, including draft/archive/trash state
- `ADMIN_SETUP.md`: private web admin deployment and security setup
- `README-maintenance.md`: detailed maintenance instructions

## Article Workflow

Preferred workflow for adding a new note:

1. Save the user's note as Markdown in `notes-inbox/`.
2. Add front matter:

```markdown
---
title: 文章标题
date: YYYY-MM-DD
category: 美股
subcategory: 存储
tags: 个股:MU, 产业:存储, 策略:复盘
summary: 首页卡片摘要。
keywords: 搜索关键词
---
```

3. Import it:

```bash
/usr/bin/python3 tools/import_markdown.py notes-inbox/<file>.md --id <article-id>
```

4. Verify:

```bash
node --check js/articles.js
node --check js/main.js
/usr/bin/python3 tools/backfill_site_metadata.py
```

5. Preview locally when useful:

```bash
/usr/bin/python3 -m http.server 8088 --bind 127.0.0.1
```

6. Commit and push:

```bash
git add .
git commit -m "Add <article title>"
git push origin main
```

GitHub Pages may take about 30-120 seconds to refresh. Verify the custom domain after publishing.

## Web Admin

- Planned admin URL: `https://admin.xxyalpha.cn/`
- Admin frontend and Cloudflare Worker are maintained outside the public Pages artifact.
- The admin uses a strong password and a signed, HttpOnly session cookie.
- The Worker stores only the password hash, salt, session key, and GitHub token as Worker Secrets.
- Web admin writes must keep `content/articles.json`, `js/articles.js`, `sitemap.xml`, the article source, and public page consistent in one Git commit.
- Agent imports must also update `content/articles.json`; `tools/import_markdown.py` already does this.
- Never place the GitHub token, plaintext password, or administrator secrets in this repository.

## Content Taxonomy

Main categories:

- `美股`
- `A股`
- `产业思考`
- `近期热点`
- `见贤思齐`

Use consistent tag prefixes:

- `个股:`
- `产业:`
- `策略:`
- `宏观:`
- `财报:`
- `工具:`
- `认知:`
- `市场:`

Current homepage series navigation groups articles into:

- AI基础设施主线
- 光通信与CPO
- 存储超级周期
- AI电子材料
- A股映射与交易框架
- 工具与投资心法

## Safety Notes

- `notes-inbox/` is a local inbox. Its Markdown files are ignored by git except `.gitignore`, so drafts are not accidentally published.
- Do not delete or rewrite existing articles unless the user explicitly asks.
- Before pushing, check `git status --short` and ensure only intended files are staged.
- If the user asks to publish, commit and push to `origin main`, then verify the production URL.
