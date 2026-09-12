# XXY Alpha 维护说明

正式网址：`https://www.xxyalpha.cn/`

这个站点现在支持从 Markdown 笔记生成静态文章页面。

## 推荐流程

1. 把 `.md` 笔记放到 `notes-inbox/`。
2. 在笔记开头写 front matter。
3. 运行导入脚本。
4. 打开本地预览检查。
5. 确认无误后提交并推送到 GitHub Pages。

## Markdown 模板

```markdown
---
title: 文章标题
date: 2026-07-06
category: 美股
subcategory: 存储
tags: 个股:MU, 产业:存储, 策略:复盘
summary: 首页卡片显示的摘要。
keywords: 搜索关键词 空格分隔
---

# 文章标题

正文内容。
```

## 导入命令

```bash
/usr/bin/python3 tools/import_markdown.py notes-inbox/example-note.md
```

导入后会自动完成：

- 创建 `articles/<文章id>/index.html`
- 更新 `js/articles.js`
- 更新 `sitemap.xml`
- 让首页列表、分类筛选和站内搜索能找到新文章

## 主要页面

- `/`：精简首页
- `/notes/`：全部笔记与搜索
- `/calendar/`：完整验证日历

## 常用分类

- `美股`
- `产业思考`
- `见贤思齐`
- `近期热点`

## 可选参数

```bash
/usr/bin/python3 tools/import_markdown.py notes-inbox/example-note.md --id my-note --category 美股 --subcategory 存储
```

如果只想预览解析结果，不写入文件：

```bash
/usr/bin/python3 tools/import_markdown.py notes-inbox/example-note.md --dry-run
```

## 站点元信息检查

```bash
/usr/bin/python3 tools/backfill_site_metadata.py
```

命令显示 `Articles needing update: 0` 即表示文章元信息和新域名已同步。

## 2026-09 投资研究博客改版

新入口与维护流程见 `REDESIGN.md`。导入文章会自动调用 `tools/sync_journal.py`，保持研究档案、导航与站点地图一致。档案数据维护 `content/archives.json`；浏览器工作台的草稿须导出后经确认再导入公开内容。

## 长文阅读与下载

文章页提供章节目录、字号、专注模式、同浏览器阅读位置恢复，以及真实 PDF / DOCX 下载。文件由原始文章离线生成，不依赖第三方转换网站。

文章更新后，运行 `tools/build_exports.py --id <文章ID> --render`（使用已配置 python-docx、lxml、Pillow、LibreOffice 的 Python 环境）。不带 `--id` 可重建全部公开文章。macOS 中文字体配置由工具在临时 QA 目录中自动准备。渲染器路径可用 `--renderer` 指定。

`content/downloads.json` 与 `js/downloads.js` 是导出索引，包含原文指纹。原文改变后，旧下载链接会停止展示，直到重新生成；不能在文章更新后继续提供旧文件而不提示。

发布前运行 `python3 tools/check_exports.py`，确认所有公开文章均有匹配的 PDF / DOCX。生成的 PDF / DOCX 纳入 `downloads/<文章ID>/`；QA 页图留在临时目录，不发布。下载日期是文件生成日期，不是假装用户点击时重新生成。
