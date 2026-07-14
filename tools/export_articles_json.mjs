#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = await readFile(resolve(root, "js/articles.js"), "utf8");
const context = {};
vm.runInNewContext(`${source}\nthis.__articles = articles;`, context, { filename: "js/articles.js" });

const now = new Date().toISOString();
const articles = context.__articles.map((article, order) => ({
  ...JSON.parse(JSON.stringify(article)),
  status: "published",
  order,
  updatedAt: now,
}));

const output = resolve(root, "content/articles.json");
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify({ version: 1, articles }, null, 2)}\n`, "utf8");
console.log(`Exported ${articles.length} articles to content/articles.json`);
