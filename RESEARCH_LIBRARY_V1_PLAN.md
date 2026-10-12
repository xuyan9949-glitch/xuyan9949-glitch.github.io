# XXY Alpha — 投研研究库 V1 整合计划（2026-10-12）

## 目标与边界

把已获认可的 FOLIO／XXY Alpha V0 视觉方案正式整合进现有 www.xxyalpha.cn，而非用演示 HTML 覆盖网站。
视觉：暖白／米白底、深森林绿、克制暖金、山峦森林背景、舒适留白、编辑式阅读布局。
首批真实公司：NBIS（云）、LITE（光）、MU（存），每家提供概览、投资逻辑、财务与估值、催化剂、研究全文、公司故事（有源文件时）、更新记录。
支持桌面及移动端，保持长文阅读体验。

## 已确认的线上系统（main）

- 托管：GitHub Pages，CNAME：www.xxyalpha.cn；原生 HTML/CSS/JS，无打包步骤。
- 页面：首页 index.html；研究入口 research/index.html；文章 articles/<id>/index.html；搜索 notes/index.html；日历 calendar/index.html；发布入口 workbench/index.html。
- 文章正式元数据源：content/articles.json；公开衍生索引 js/articles.js。
- 公司／事件／经验关联源：content/archives.json；js/archive-data.js 为生成物，应由 tools/sync_journal.py 生成。
- 文章导入：tools/import_markdown.py；正式发布后台独立维护于 admin.xxyalpha.cn / publishing-admin，不在本公开站仓库。
- 现有其他子站：portfolio-tracker、zhao-tracker、movies 等，不能被替换或删除。
- README-maintenance.md、CODEX.md、REDESIGN.md 均应视为工程契约。

## 最小改造策略

1. 优先复用已有研究库和文章元数据／发布链，避免建立第二套互相冲突的文章管理后台。
2. 在现有 CSS 基础上引入可逐页迁移的 V1 视觉 token 和组件，先在独立测试页验收，再更换首页及公司模板。
3. 公司卡片和详情页从 content/archives.json 取得身份／标签和关联文章信息；财务摘要、投资论据等结构化资料需携带来源、截至日期、事实/推断类型。
4. 按现有档案生成器改造公司详情模板；不要只手改生成的 research/<ticker>/index.html 后又被同步脚本覆盖。
5. 将 NBIS 加入公司档案源；LITE、MU 复用现有身份和文章关联。三家公司已有的完整投研档案／故事文稿优先保留全文、章节、来源及日期，再关联详情页。
6. V0 的浏览器本地笔记可以保留作草稿，但明确标注本地保存；正式公开文章必须走既有管理员发布流程。
7. 不使用设计效果图中的虚构价格、走势图和日期作为实时行情；未接真实数据时显示研究基准价＋日期，或隐藏报价与图表。既有内容的历史日期不擅自更新。
8. 首页现有文章、档案、事件、日历、旧链接、下载 PDF/DOCX、后台入口与其他子站全部继续可用。

## 建议实现顺序

A. 代码与发布路径审计：确认当前生成器、数据契约、CSS 冲突和源文件完整性。
B. 在 feature/research-library-v1 分支添加独立预览，移植选定的主页／详情页视觉。
C. 三家公司按云→光→存导入：NBIS、LITE、MU；不得杜撰未提供的 NBIS 故事。
D. 打通档案导航、全文阅读、来源链接与搜索；校验后台发布新增文章后可正常挂靠公司。
E. 桌面／移动端视觉、404、历史 URL、搜索、文档导出和脚本生成一致性测试。
F. 提交 Pull Request，人工确认与现场验收后再合并 main；保持可回滚。

## 完成定义（必须逐项验证）

- 首页与公司详情视觉达到用户认可的森林绿 V0 版。
- /research/、/research/lite/、/research/mu/、/research/nbis/ 可正常进入，且全文可查。
- 公司财务数值可追溯到原档案和具体日期；任何示意数据不得标成实时行情。
- 保留原研究档案、文章索引、事件、公开文章、工作台、持仓看板及交易追踪链接。
- 发布一篇带“个股:MU”等标签的测试文章，在预览环境可正确进入公司研究历史；测试稿不误发布至公网。
- 代码与 Python 生成器检查通过，并完成实际浏览器与手机尺寸验收。
- 不直接修改 main；未经验收不替换线上首页。

## 本次对话提供的设计与素材

- 用户选定：米白底／深森林绿／暖金／山景／杂志式主页与公司详情图。
- 已制作 V0 Demo：XXY_Research_V0_Demo.zip（HTML、CSS、JS、图片素材）和单文件离线预览。
- 既有文稿：LITE / MU / NBIS 投研档案，LITE / MU 公司故事。
- 整合开发须使用原始 Demo 和原始文稿，不直接从截图猜测财务数据。

> 这是迁移任务书，不代表功能已部署或通过测试；任何页面改造须与现有 main 的最新提交比较。