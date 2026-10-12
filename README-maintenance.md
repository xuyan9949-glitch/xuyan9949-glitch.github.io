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

## 2026-09 发布工作台

`/workbench/` 提供粘贴与上传入口，跳转现有 `https://admin.xxyalpha.cn/compose.html`，并传递事件/公司归属。原观察草稿保留在同页折叠区，存储键未变。管理台的新导入功能和档案写入逻辑维护于当前工作区的独立 `publishing-admin` 目录，不放入公开站点。

导入内容在浏览器解析、预览与暂存；确认发布后，正文及档案关联一起提交。DOCX 优先保留格式，DOC/PDF 是文字导入，扫描件需要先识别文字。

## 2026-10 投研研究库 V0

首页与公司目录使用 `templates/research-home.html`、`templates/research-directory.html`，由 `tools/sync_journal.py` 生成。NBIS/LITE/MU 的 `profile` 与文稿索引维护在 `content/archives.json`；摘要按原研究日期展示，不是实时行情。首版图片沿用已选定 V0 Demo。

原稿 HTML、可检索全文和原文件指纹维护在 `content/research-documents.json`；`js/research-data.js` 与文稿阅读页均为生成物。原始 Word 下载在 `downloads/research/<ticker>/`。更新现有原稿可运行：

```sh
python3 tools/import_research_docx.py /absolute/path/MU_Investment_Dossier.docx --ticker MU --kind dossier --date 2026-10-02
```

`--date` 必须使用原稿资料截止日期；摘要的日期、财务数值和来源仍须在档案源中单独审核更新。该命令替换指定原稿版本，Git 保留此前版本；不自动重写其他研究和文章。新增普通文章仍走既有发布后台／Markdown 导入，按 `个股:MU` 或 `财报:MU` 自动参与公司归档。

验证命令：

```sh
python3 tools/sync_journal.py
NODE_PATH=/tmp/xxyalpha-qa/node_modules node tools/test_journal.cjs
NODE_PATH=/tmp/xxyalpha-qa/node_modules node tools/test_research_v0.cjs
```

V0 开发在 PR #3 的分支中。桌面／手机视觉验收前不合并 main。2026-10-12 按用户“正式重来”的指令，已删除探索阶段的 47 个文章页面（46 篇公开文章和 1 个测试页）、全部旧文章登记与 45 组 PDF/Word 下载，同时清空关联的旧事件、经验和公司文章 ID。今天新接入的五份 NBIS/LITE/MU 研究原稿保留；搜索和公司更新记录从新内容开始。网站日历、投资工具、浏览器私人草稿不属于文章清理范围。旧内容不再发布，Git 历史保留删除前的版本。
