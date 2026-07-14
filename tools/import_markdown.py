#!/usr/bin/env python3
"""Import a Markdown note as a static article page."""

from __future__ import annotations

import argparse
import datetime as dt
import html
import json
import re
import sys
from pathlib import Path


SITE_ROOT = Path(__file__).resolve().parents[1]
ARTICLES_JS = SITE_ROOT / "js" / "articles.js"
ARTICLES_DIR = SITE_ROOT / "articles"
CONTENT_REGISTRY = SITE_ROOT / "content" / "articles.json"


def slugify(text: str) -> str:
    text = text.strip().lower()
    replacements = {
        "：": "-",
        ":": "-",
        "—": "-",
        "–": "-",
        "，": "-",
        ",": "-",
        "。": "-",
        ".": "-",
        "/": "-",
        "\\": "-",
        " ": "-",
    }
    for src, dst in replacements.items():
        text = text.replace(src, dst)
    text = re.sub(r"[^0-9a-z\u4e00-\u9fff-]+", "-", text)
    text = re.sub(r"-{2,}", "-", text).strip("-")
    return text or "untitled-note"


def parse_list_value(raw: str) -> list[str]:
    raw = raw.strip()
    if not raw:
        return []
    if raw.startswith("[") and raw.endswith("]"):
        return [item.strip().strip("\"'") for item in raw[1:-1].split(",") if item.strip()]
    return [item.strip() for item in re.split(r"[,，]", raw) if item.strip()]


def parse_frontmatter(text: str) -> tuple[dict[str, object], str]:
    if not text.startswith("---\n"):
        return {}, text
    end = text.find("\n---", 4)
    if end == -1:
        return {}, text
    block = text[4:end].strip()
    body = text[end + 4 :].lstrip()
    meta: dict[str, object] = {}
    for line in block.splitlines():
        if not line.strip() or line.lstrip().startswith("#") or ":" not in line:
            continue
        key, value = line.split(":", 1)
        key = key.strip()
        value = value.strip().strip("\"'")
        if key in {"tags", "keywords"}:
            meta[key] = parse_list_value(value) if key == "tags" else value
        elif key == "pinned":
            meta[key] = value.lower() in {"true", "yes", "1", "是"}
        else:
            meta[key] = value
    return meta, body


def first_heading(markdown: str) -> str:
    for line in markdown.splitlines():
        match = re.match(r"^#\s+(.+)$", line.strip())
        if match:
            return match.group(1).strip()
    return "未命名笔记"


def remove_first_heading(markdown: str) -> str:
    lines = markdown.splitlines()
    for index, line in enumerate(lines):
        if re.match(r"^#\s+.+$", line.strip()):
            return "\n".join(lines[:index] + lines[index + 1 :]).lstrip()
        if line.strip():
            break
    return markdown


def strip_markdown(text: str) -> str:
    text = re.sub(r"```.*?```", "", text, flags=re.S)
    text = re.sub(r"!\[[^\]]*\]\([^)]+\)", "", text)
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    text = re.sub(r"[#>*_`~-]", "", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def make_summary(markdown: str, explicit: str | None) -> str:
    if explicit:
        return explicit.strip()
    for block in re.split(r"\n\s*\n", markdown):
        clean = strip_markdown(block)
        if clean and not clean.startswith("title:"):
            return clean[:160]
    return "一篇新的研究笔记。"


def inline_markdown(text: str) -> str:
    text = html.escape(text)
    text = re.sub(r"`([^`]+)`", r"<code>\1</code>", text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"\*([^*]+)\*", r"<em>\1</em>", text)
    text = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2">\1</a>', text)
    return text


def render_table(lines: list[str]) -> str:
    rows = []
    for line in lines:
        cells = [inline_markdown(cell.strip()) for cell in line.strip().strip("|").split("|")]
        rows.append(cells)
    if len(rows) < 2:
        return "\n".join(f"<p>{inline_markdown(line)}</p>" for line in lines)
    header = "".join(f"<th>{cell}</th>" for cell in rows[0])
    body = []
    for row in rows[2:]:
        body.append("<tr>" + "".join(f"<td>{cell}</td>" for cell in row) + "</tr>")
    return "<table>\n<thead><tr>" + header + "</tr></thead>\n<tbody>\n" + "\n".join(body) + "\n</tbody>\n</table>"


def markdown_to_html(markdown: str) -> str:
    lines = markdown.splitlines()
    out: list[str] = []
    paragraph: list[str] = []
    list_mode: str | None = None
    table: list[str] = []
    in_code = False
    code_lines: list[str] = []

    def flush_paragraph() -> None:
        nonlocal paragraph
        if paragraph:
            out.append("<p>" + inline_markdown(" ".join(paragraph).strip()) + "</p>")
            paragraph = []

    def flush_list() -> None:
        nonlocal list_mode
        if list_mode:
            out.append(f"</{list_mode}>")
            list_mode = None

    def flush_table() -> None:
        nonlocal table
        if table:
            out.append(render_table(table))
            table = []

    for raw in lines:
        line = raw.rstrip()
        stripped = line.strip()

        if stripped.startswith("```"):
            flush_paragraph()
            flush_list()
            flush_table()
            if in_code:
                out.append("<pre><code>" + html.escape("\n".join(code_lines)) + "</code></pre>")
                code_lines = []
                in_code = False
            else:
                in_code = True
            continue

        if in_code:
            code_lines.append(line)
            continue

        if not stripped:
            flush_paragraph()
            flush_list()
            flush_table()
            continue

        if stripped.startswith("|") and stripped.endswith("|"):
            flush_paragraph()
            flush_list()
            table.append(stripped)
            continue
        flush_table()

        if stripped == "---":
            flush_paragraph()
            flush_list()
            out.append("<hr>")
            continue

        heading = re.match(r"^(#{1,4})\s+(.+)$", stripped)
        if heading:
            flush_paragraph()
            flush_list()
            level = min(len(heading.group(1)) + 1, 4)
            out.append(f"<h{level}>{inline_markdown(heading.group(2))}</h{level}>")
            continue

        unordered = re.match(r"^[-*]\s+(.+)$", stripped)
        ordered = re.match(r"^\d+\.\s+(.+)$", stripped)
        if unordered or ordered:
            flush_paragraph()
            mode = "ul" if unordered else "ol"
            if list_mode != mode:
                flush_list()
                out.append(f"<{mode}>")
                list_mode = mode
            content = unordered.group(1) if unordered else ordered.group(1)
            out.append(f"<li>{inline_markdown(content)}</li>")
            continue

        quote = re.match(r"^>\s+(.+)$", stripped)
        if quote:
            flush_paragraph()
            flush_list()
            out.append(f"<blockquote>{inline_markdown(quote.group(1))}</blockquote>")
            continue

        paragraph.append(stripped)

    flush_paragraph()
    flush_list()
    flush_table()
    if in_code:
        out.append("<pre><code>" + html.escape("\n".join(code_lines)) + "</code></pre>")
    return "\n\n".join(out)


def article_template(
    title: str,
    date: str,
    category: str,
    subcategory: str,
    summary: str,
    article_id: str,
    content_html: str,
) -> str:
    meta_cat = category if not subcategory else f"{category} · {subcategory}"
    page_title = html.escape(title)
    meta_description = html.escape(summary, quote=True)
    canonical_url = f"https://www.xxyalpha.cn/articles/{article_id}/"
    return f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{page_title} | XXY Alpha</title>
    <meta name="description" content="{meta_description}">
    <link rel="canonical" href="{canonical_url}">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="XXY Alpha">
    <meta property="og:title" content="{page_title}">
    <meta property="og:description" content="{meta_description}">
    <meta property="og:url" content="{canonical_url}">
    <meta name="twitter:card" content="summary">
    <link rel="stylesheet" href="/css/style.css">
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='6' fill='%232d6cff'/><text x='16' y='22' text-anchor='middle' font-family='-apple-system,BlinkMacSystemFont,sans-serif' font-weight='700' font-size='22' fill='white'>X</text></svg>">
</head>
<body>
    <nav class="nav">
        <div class="nav-inner">
            <a href="/" class="logo"><span class="logo-mark">X</span><span class="logo-text">XXY Alpha</span></a>
            <div class="nav-links archive-nav-links">
                <a href="/">首页</a><a href="/notes/">笔记</a><a href="/diagrams/">图示</a><a href="/calendar/">日历</a>
            </div>
        </div>
    </nav>

    <main class="container article-page">
        <a href="/" class="back">← 返回首页</a>

        <h1>{page_title}</h1>

        <div class="article-meta">
            <span class="meta-left">{html.escape(date)}</span>
            <span class="meta-dot">·</span>
            <span class="meta-cat">{html.escape(meta_cat)}</span>
            <button class="meta-share" onclick="shareArticle()" title="分享">
                <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                分享
            </button>
        </div>

        <div class="article-content">
{content_html}
        </div>
    </main>

    <footer class="footer">
        <div class="container"><p>© 2026 XXY Alpha · 基于个人研究，不构成投资建议</p></div>
    </footer>

    <script src="/js/share.js"></script>
</body>
</html>
"""


def js_object(article: dict[str, object]) -> str:
    lines = ["  {"]
    order = ["id", "title", "date", "category", "subcategory", "tags", "pinned", "summary", "keywords", "file"]
    for index, key in enumerate(order):
        if key == "subcategory" and not article.get(key):
            continue
        value = json.dumps(article[key], ensure_ascii=False)
        comma = ","
        lines.append(f"    {key}: {value}{comma}")
    lines[-1] = lines[-1].rstrip(",")
    lines.append("  }")
    return "\n".join(lines)


def update_articles_js(article: dict[str, object]) -> None:
    text = ARTICLES_JS.read_text(encoding="utf-8")
    article_id = re.escape(str(article["id"]))
    existing = re.compile(
        r"\n  \{\n\s+id:\s+\"" + article_id + r"\",.*?\n  \},?",
        re.S,
    )
    text = existing.sub("", text)
    insertion = "const articles = [\n" + js_object(article) + ","
    if not text.startswith("const articles = ["):
        raise RuntimeError("js/articles.js format not recognized")
    text = text.replace("const articles = [", insertion, 1)
    ARTICLES_JS.write_text(text, encoding="utf-8")


def update_content_registry(article: dict[str, object]) -> None:
    if CONTENT_REGISTRY.exists():
        registry = json.loads(CONTENT_REGISTRY.read_text(encoding="utf-8"))
    else:
        registry = {"version": 1, "articles": []}
    articles = [item for item in registry.get("articles", []) if item.get("id") != article["id"]]
    for item in articles:
        item["order"] = int(item.get("order", 0)) + 1
    articles.insert(0, {
        **article,
        "status": "published",
        "order": 0,
        "updatedAt": dt.datetime.now(dt.timezone.utc).isoformat(),
    })
    CONTENT_REGISTRY.parent.mkdir(parents=True, exist_ok=True)
    CONTENT_REGISTRY.write_text(
        json.dumps({"version": 1, "articles": articles}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Import a Markdown file into Leslie static site.")
    parser.add_argument("markdown_file", help="Path to the Markdown note")
    parser.add_argument("--id", dest="article_id", help="Article folder id, e.g. storage-cycle-note")
    parser.add_argument("--category", help="Override category")
    parser.add_argument("--subcategory", help="Override subcategory")
    parser.add_argument("--date", help="Override date, YYYY-MM-DD")
    parser.add_argument("--title", help="Override title")
    parser.add_argument("--dry-run", action="store_true", help="Preview parsed metadata without writing files")
    args = parser.parse_args()

    md_path = Path(args.markdown_file).expanduser().resolve()
    if not md_path.exists():
        raise FileNotFoundError(md_path)

    raw = md_path.read_text(encoding="utf-8")
    meta, body = parse_frontmatter(raw)
    title = args.title or str(meta.get("title") or first_heading(body))
    body = remove_first_heading(body)
    article_id = args.article_id or str(meta.get("id") or slugify(title))
    date = args.date or str(meta.get("date") or dt.date.today().isoformat())
    category = args.category or str(meta.get("category") or "见贤思齐")
    subcategory = args.subcategory if args.subcategory is not None else str(meta.get("subcategory") or "")
    tags = meta.get("tags") if isinstance(meta.get("tags"), list) else []
    if not tags:
        tags = [category] + ([subcategory] if subcategory else [])
    summary = make_summary(body, str(meta.get("summary")) if meta.get("summary") else None)
    keywords = str(meta.get("keywords") or " ".join([title, category, subcategory, *tags]))
    pinned = bool(meta.get("pinned", False))

    article = {
        "id": article_id,
        "title": title,
        "date": date,
        "category": category,
        "subcategory": subcategory,
        "tags": tags,
        "pinned": pinned,
        "summary": summary,
        "keywords": keywords,
        "file": f"/articles/{article_id}/",
    }

    if args.dry_run:
        print(json.dumps(article, ensure_ascii=False, indent=2))
        return 0

    content_html = markdown_to_html(body)
    article_dir = ARTICLES_DIR / article_id
    article_dir.mkdir(parents=True, exist_ok=True)
    (article_dir / "index.html").write_text(
        article_template(title, date, category, subcategory, summary, article_id, content_html),
        encoding="utf-8",
    )
    update_content_registry(article)
    update_articles_js(article)
    from backfill_site_metadata import build_sitemap, load_articles

    (SITE_ROOT / "sitemap.xml").write_text(
        build_sitemap(load_articles()),
        encoding="utf-8",
    )
    print(f"Imported: {title}")
    print(f"Page: {article_dir / 'index.html'}")
    print(f"URL: /articles/{article_id}/")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"import_markdown.py: {exc}", file=sys.stderr)
        raise SystemExit(1)
