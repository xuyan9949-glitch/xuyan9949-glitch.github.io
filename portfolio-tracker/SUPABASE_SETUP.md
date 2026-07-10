# Supabase 云同步配置说明

## 1. 创建 Supabase 项目

进入 Supabase，新建一个项目。

## 2. 执行数据库脚本

打开 Supabase 项目的 SQL Editor，把 `supabase-schema.sql` 的内容复制进去执行。

这会创建 `portfolio_snapshots` 表，并开启 RLS 权限隔离：

- 每个用户只能读取自己的数据
- 每个用户只能更新自己的数据
- 不同账号之间互不可见

## 3. 填写前端配置

打开 `supabase-config.js`，填入：

```js
window.PORTFOLIO_SUPABASE_CONFIG = {
  url: "你的 Supabase Project URL",
  anonKey: "你的 Supabase anon public key"
};
```

这两个值在 Supabase 项目设置的 API 页面里可以找到。

## 4. 登录方式

当前版本使用邮箱登录链接：

- 用户输入邮箱
- Supabase 发送登录链接
- 用户点击邮件里的链接后回到网站
- 同一账号的数据会云同步

## 5. 数据模式

- 未登录：数据保存在当前浏览器本地
- 已登录：数据保存到 Supabase 云端
- 首次登录：如果本机已有记录，会提示是否迁移到云端
- 美股和 A股是两个独立账本，但同属同一个账号

## 6. 线上回调地址

在 Supabase Authentication URL Configuration 中，建议加入：

```text
https://xuyan9949-glitch.github.io/portfolio-tracker/
```

如果你后续使用自定义域名，也要把自定义域名加入允许列表。
