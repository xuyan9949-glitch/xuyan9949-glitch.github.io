# XXY Alpha 管理台

管理台是独立于公开网站的 Cloudflare Worker 应用。公开网站继续由 GitHub Pages 提供，管理台通过 GitHub API 原子更新文章正文、文章索引和站点地图。管理员使用单独的强密码登录，访客没有任何写入接口权限。

## 地址规划

- 公开阅读：`https://www.xxyalpha.cn/`
- 私人管理：`https://admin.xxyalpha.cn/`
- GitHub 仓库：`xuyan9949-glitch/xuyan9949-glitch.github.io`

## 上线前准备

1. 创建 GitHub fine-grained personal access token。
2. Token 只授权 `xuyan9949-glitch.github.io` 仓库，并授予 `Contents: Read and write`、`Actions: Read-only`。
3. 生成一个强管理密码，并将密码保存到 macOS“密码”应用。
4. 只把密码的 PBKDF2 哈希、随机盐和会话签名密钥保存为 Cloudflare Worker Secrets。

## 本地运行

```bash
cd worker
cp .dev.vars.example .dev.vars
npm install
npm run vendor
npm run dev
```

未填写 `GITHUB_TOKEN` 时，可以直接预览静态演示：

```text
http://127.0.0.1:8093/?demo=1
```

## 配置生产变量

编辑 `worker/wrangler.jsonc`：

- `ADMIN_EMAILS`：允许进入管理台的邮箱。当前唯一管理员为 `xuyan9949@gmail.com`。

以下内容必须使用 Secret，不能写进配置文件：

```bash
cd worker
npx wrangler secret put GITHUB_TOKEN
npx wrangler secret put ADMIN_PASSWORD_HASH
npx wrangler secret put PASSWORD_SALT
npx wrangler secret put SESSION_SECRET
```

## 部署

```bash
cd worker
npx wrangler login
npm test
npx wrangler deploy
```

部署后，在 Worker Settings > Domains & Routes 中绑定 `admin.xxyalpha.cn`，再测试登录和文章发布。

## 内容模型

- `content/articles.json`：管理台内容注册表，包含公开、草稿、下架和回收站状态。
- `content/articles/<id>.html`：文章正文源文件，在文章首次通过管理台保存后创建。
- `articles/<id>/index.html`：公开文章页面，仅在状态为 `published` 时存在。
- `js/articles.js`：公开网站文章索引，仅包含已发布文章。
- `sitemap.xml`：自动排除草稿、下架和回收站内容。

每次写入由一个 Git commit 完成；如果检测到仓库内容已变化，管理台会阻止覆盖并要求刷新。

## 安全原则

- 公开网页中不保存 GitHub Token。
- Worker 的所有写入接口都必须验证签名登录 Cookie，不能只依赖隐藏按钮。
- 管理密码不以明文保存到 Worker；密码哈希采用 PBKDF2-SHA256 和随机盐。
- 登录 Cookie 使用 `HttpOnly`、`Secure`、`SameSite=Strict`，并在七天后失效。
- `workers_dev` 保持关闭，避免产生额外的公开 Worker 地址。
- 删除文章先进入回收站；重新保存为草稿即可恢复。
