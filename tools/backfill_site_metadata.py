#!/usr/bin/env python3
"""Backfill article metadata and rebuild sitemap.xml for the static site."""

from __future__ import annotations

import argparse
import html
import json
import re
from datetime import date
from html.parser import HTMLParser
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ARTICLES_JS = ROOT / "js" / "articles.js"
SITE_URL = "https://www.xxyalpha.cn"
DEFAULT_SHARE_IMAGE = f"{SITE_URL}/images/diagrams/存储/industry-map-01.jpg"


class HeadAudit(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.in_head = False
        self.title = ""
        self._in_title = False
        self.description = False
        self.canonical = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if tag == "head":
            self.in_head = True
        elif self.in_head and tag == "title":
            self._in_title = True
        elif self.in_head and tag == "meta" and values.get("name") == "description":
            self.description = bool(values.get("content"))
        elif self.in_head and tag == "link" and values.get("rel") == "canonical":
            self.canonical = bool(values.get("href"))

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self._in_title = False
        elif tag == "head":
            self.in_head = False

    def handle_data(self, data: str) -> None:
        if self._in_title:
            self.title += data


def load_articles() -> list[dict[str, object]]:
    source = ARTICLES_JS.read_text(encoding="utf-8")
    source = re.sub(r"^\s*const\s+articles\s*=\s*", "", source, count=1)
    source = re.sub(r";\s*$", "", source)
    source = re.sub(
        r"^(\s*)([A-Za-z_][A-Za-z0-9_]*):",
        r'\1"\2":',
        source,
        flags=re.MULTILINE,
    )
    source = re.sub(r",(\s*[}\]])", r"\1", source)
    return json.loads(source)


def metadata_block(article: dict[str, object]) -> str:
    title = html.escape(str(article["title"]), quote=True)
    summary = str(article.get("summary", "")).strip()
    if len(summary) > 155:
        summary = summary[:154].rstrip() + "…"
    description = html.escape(summary, quote=True)
    canonical = f"{SITE_URL}{article['file']}"
    return f"""    <meta name="description" content="{description}">
    <link rel="canonical" href="{canonical}">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="XXY Alpha">
    <meta property="og:title" content="{title}">
    <meta property="og:description" content="{description}">
    <meta property="og:url" content="{canonical}">
    <meta property="og:image" content="{DEFAULT_SHARE_IMAGE}">
    <meta name="twitter:card" content="summary_large_image">
"""


def update_article_page(article: dict[str, object]) -> tuple[Path, str, bool]:
    article_id = str(article["id"])
    path = ROOT / "articles" / article_id / "index.html"
    source = path.read_text(encoding="utf-8")
    updated = source
    page_title = html.escape(str(article["title"]))
    updated = re.sub(
        r"<title>.*?</title>",
        f"<title>{page_title} | XXY Alpha</title>",
        updated,
        count=1,
        flags=re.DOTALL,
    )
    if 'rel="canonical"' not in updated:
        updated = re.sub(
            r'(<meta\s+name="viewport"[^>]*>\s*)',
            r"\1" + metadata_block(article),
            updated,
            count=1,
        )
    updated = updated.replace('<span class="logo-mark">L</span>', '<span class="logo-mark">X</span>')
    updated = updated.replace("Leslie 研究笔记", "XXY Alpha")
    updated = updated.replace("© 2026 Leslie", "© 2026 XXY Alpha")
    updated = updated.replace('href="/#notes"', 'href="/notes/"')

    audit = HeadAudit()
    audit.feed(updated)
    if not audit.title.endswith("XXY Alpha") or not audit.description or not audit.canonical:
        raise ValueError(f"Metadata validation failed: {path}")
    return path, updated, updated != source


def build_sitemap(articles: list[dict[str, object]]) -> str:
    today = date.today().isoformat()
    static_paths = ["/", "/notes/", "/diagrams/", "/calendar/", "/about/"]
    rows = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]
    for path in static_paths:
        rows.extend([
            "  <url>",
            f"    <loc>{SITE_URL}{path}</loc>",
            f"    <lastmod>{today}</lastmod>",
            "  </url>",
        ])
    for article in articles:
        rows.extend([
            "  <url>",
            f"    <loc>{SITE_URL}{article['file']}</loc>",
            f"    <lastmod>{article['date']}</lastmod>",
            "  </url>",
        ])
    rows.append("</urlset>")
    return "\n".join(rows) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write", action="store_true", help="Write updates instead of only reporting them")
    args = parser.parse_args()

    articles = load_articles()
    changes = [update_article_page(article) for article in articles]
    changed = [item for item in changes if item[2]]
    print(f"Articles checked: {len(changes)}")
    print(f"Articles needing update: {len(changed)}")

    if args.write:
        for path, content, needs_update in changed:
            if needs_update:
                path.write_text(content, encoding="utf-8")
        (ROOT / "sitemap.xml").write_text(build_sitemap(articles), encoding="utf-8")
        print("Metadata and sitemap written")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
