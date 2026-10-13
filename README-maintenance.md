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

### 极简公司档案入口

首页与 `/research/` 共用公司检索结构，只展示有原稿、摘要或新研究内容的公司。主导航为公司档案与搜索，页脚只保留署名；不显示行业专题、统计面板、文章流、事件、日历或投资工具入口。五份样板原稿从对应公司页进入。其他工具源码和后台维护链保留，但不出现在公开档案导航。

### 章节定位与阅读维护

同步生成器按原稿章节标题生成稳定的 `section-` 地址，章节插入不会改变其他章节的链接。公司页财务、催化剂和逻辑失效条件直接指向对应章节；投研与故事页提供折叠式章节选择。阅读目录位于正文上方，手机工具栏不固定遮挡内容。正文表格可键盘聚焦并横向浏览；重新导入 Word 时只将标题与短章节名计入目录，不把编号论述段落当作章节。


## 公司记录的输入保护

公司页“添加研究”进入现有工作台，并携带公司代码；页内显示可返回的公司档案。连续保存记录时保留公司归属。尚未保存的输入自动暂存在当前浏览器，按入口公司分开；刷新后恢复并展开观察表单，正式保存成功才清除暂存。已有观察记录的存储键与备份格式不变。多页同时编辑时，检测到存储被其他页面更新会暂停覆盖并保留输入。自动暂存与保存记录均不会公开发布或跨设备同步。

原稿导入可先检查而不写入：

```bash
python3 tools/import_research_docx.py /absolute/path/MU_Investment_Dossier.docx --ticker MU --kind dossier --date 2026-10-02 --dry-run
```

检查输出包含新增／替换、标题、原稿日期、段落／表格／图片数量和文件指纹。移除 `--dry-run` 才导入；无效日期、非 Word 文件或空文稿不会写入网站。浏览器的 Word/PDF 发布仍进入现有管理台；本轮不涉及管理台服务的改造或上线。


## 公司检索与返回路径

公司搜索支持多个词共同匹配，例如 `MU 存储`。搜索条件通过 `q` 参数保留在公司页、栏目链接和原稿链接中；从原稿返回公司时恢复投研／故事栏目，再返回目录可继续原来的筛选。搜索框按 Escape 清空输入，不新增浏览历史。

手机导航覆盖旧样式中的全宽、排序与底部间距，七个公司栏目换行显示；长名称允许换行，表格继续在自身区域横向阅读，手机可编辑输入使用 16px 字号。上述为代码与交互检查结果，仍需实际浏览器视觉验收。

公司详情页左上角优先使用官方 logo，保持原比例；按 logoTheme 选择明暗底色，缺少已核验 logo 时用代码占位。新财报分析归入财务分析，其他动态和投资判断归入研究跟踪。

## 公司档案视觉验收

新公司归档须同时完成：原文及故事版、摘要、官方 Logo、独立业务主题配图、卡片裁切与阅读检查。主题配图为业务概念示意，不冒充官方产品照片；不得使用共用占位图作为已完成版本。保持米白与森林绿风格，确认预览后再发布。

## 批量归档的正式验收入口

以后批量上传必须执行 [批量公司档案验收规范](BATCH_ARCHIVE_ACCEPTANCE.md)，并出具逐家公司验收结果。项目级 `AGENTS.md` 已将该规范列为维护前必读。自动检查入口：`python3 tools/check_archive_acceptance.py`。

### 共用概念与未完整公司材料

跨公司概念原稿使用 `--kind concept --id <slug> --related-tickers <codes>`，只保留一份原文和下载，关联到对应公司的研究跟踪。只有故事原稿的公司显示投研待补状态，经营摘要明确来自故事；不得冒充完整投研档案。
