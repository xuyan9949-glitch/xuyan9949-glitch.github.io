# Leslie 研究笔记维护说明

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
- 让首页列表、分类筛选和站内搜索能找到新文章

## 常用分类

- `美股`
- `A股`
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
