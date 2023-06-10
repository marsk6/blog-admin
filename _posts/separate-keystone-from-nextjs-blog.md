---
created_date: 2021-03-14 22:11
updated_date: 2023-06-10 16:27
archive:
tags:
  - 技术方案
  - blog
title: CMS 和 Nextjs 博客分离部署
name: separate-keystone-from-nextjs-blog
slug: separate-keystone-from-nextjs-blog
brief: keystone 和 nextjs 博客所有内容（前端，CMS，文章数据库）都在同一个仓库，不好维护，需要拆分仓库，通过 github action 全静态部署，在博客的 github action runner 中先启动 keystone 服务器，再运行博客构建。
---

## 前言

前文讲了我的静态博客集成 keystone 来管理文章内容，所有内容（前端，CMS，文章数据库）都在同一个仓库。

但这样对部署和更新文章很不友好，存在频繁切换分支保存开发中的功能和新文章内容，不注意就会把测试的内容带到线上，过多回滚等问题。

因此为了减少维护的成本，对仓库进行拆分，做前后端分离，通过 github action 全静态部署。

## 拆分仓库

两套代码是独立，没有相互依赖，都可以单独运行，单独部署。那分开后前端如何从 keystone 获取数据？

之前用 keystone 的 context api，不用启动 http 服务器，但这种方式有问题 [Error: Your schema.prisma could not be found](https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-monorepo)。

无法使用 context api，那就用 keystone 的 http 接口。

代码拆分为 `nextjs-blog` 和 `blog-admin`

1. 在 `nextjs-blog` 中安装 `@apollo/client`

```shell
yarn add @apollo/client graphql
```

1. 初始化 `graphql` 客户端

```js
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

const client = new ApolloClient({
  uri: 'http://localhost:3000/api/graphql',
  cache: new InMemoryCache(),
  // Enable sending cookies over cross-origin requests
  credentials: 'include',
});
```

1. 使用 http 接口

对照 `blog-admin` 下的 `schema.graphql`，把 context api 查询修改为 graphql api

```js -{1-6} +{8-25}
export async function getAllTags() {
  const tags = await query.Tag.findMany({
    query: 'name posts { title slug }',
  });
  return tags;
}

export async function getAllTags() {
  const {
    data: { tags },
  } = await client.query({
    query: gql`
      query {
        tags {
          name
          posts {
            title
            slug
          }
        }
      }
    `,
  });
  return tags;
}
```

如果担心 gql 语句写错了，可以打开 `http://localhost:3000/api/graphql` 先验证下。

## 修改部署配置

我没把 keystone 部署到云服务器，打算在 `nextjs-blog` Github Actions 的 runner 中先启动 keystone，再构建生成博客。

### 修改 blog-admin 部署配置

1. 增加 keystone 服务器 health check

添加 http 健康检查 `bin/check.sh`，用来检测 keystone http 服务器有没有启动成功。

```shell
#!/bin/sh
CHECK_PORT=3000

echo "[CHECK INFO] $(date '+%Y-%m-%d %H:%M:%S') check http service"

http_code=`curl -s --connect-timeout 2 -o /dev/null -w "%{http_code}" http://localhost:$CHECK_PORT`

if [ $http_code == 200 ] || [ $http_code == 302 ]
then
    echo "[CHECK INFO] check success $http_code"
    exit 0
else
    echo "[CHECK ERROR] check error $http_code"
    exit 2
fi
```

```json title=package.json +{2-5}
  "scripts": {
    "keystone:build": "NODE_ENV=production keystone build",
    "keystone:start": "NODE_ENV=production keystone start",
    "deploy": "yarn keystone:build && yarn keystone:start",
    "healthcheck": "bash ./bin/check.sh",
  },
```

1. 修改 github action 配置

当博客数据有修改时，通过 `blog-admin` 的 GitHub Actions 触发 `nextjs-blog` 自动部署。

```yaml
name: GitHub Actions Build and Deploy
on:
  push:
    paths:
      - app.db # 当 app.db 有变动时触发 action
permissions:
  contents: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Repository Dispatch
        uses: peter-evans/repository-dispatch@v2 # 触发叫 repository_dispatch 的 webhook 事件
        with:
          token: ${{ secrets.ACCESS_TOKEN }}
          repository: marsk6/marsk6.github.io
          event-type: admin-update-event # 需要 dispatch 的事件类型
```

### 修改 nextjs-blog 部署配置

先启动 keystone http 服务器，再执行 blog 构建。

1. 修改 `nextjs-blog` 构建脚本

创建 `build.ts`，先用 `child_process` 把 keystone 服务器跑起来，再执行 `yarn next:build`。

```ts title={build.ts}
import execSh from 'exec-sh';
let count = 0;

/**
 * 判断 keystone 是否启动成功
 */
const isAdminRun = () => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      execSh('yarn healthcheck', { cwd: './admin' }, (err) => {
        if (err) {
          if (count === 5) {
            reject(err);
          } else {
            count++;
            resolve(isAdminRun());
          }
        }
        resolve('');
      });
      clearTimeout(timer);
    }, 2000);
  });
};
const main = async () => {
  console.log('---------------- start admin ----------------');
  // 启动 keystone 服务器
  const childProcess = execSh('yarn keystone:start', { cwd: './admin' });

  await isAdminRun();

  console.log('---------------- to next deploy ----------------');

  // 构建博客
  await execSh.promise('yarn next:build');
  console.log('---------------- finish build ----------------');
  // 关闭 keystone 服务器
  childProcess.kill();
};

main();
```

![[separate-keystone-from-nextjs-blog.png|构建流程]]

```json title={package.json} +{2}
  "scripts": {
    "build": "ts-node --transpileOnly ./script/build.ts",
  }
```

1. 修改 github action 配置

```yaml
name: GitHub Actions Build and Deploy Demo
on:
  push:
    branches:
      - master
  repository_dispatch: # 监听 blog-admin 发出的 repository_dispatch 事件
    types: [admin-update-event] # 监听 dispatch 的事件类型 admin-update-event
permissions:
  contents: write
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: checkout blog repo
        uses: actions/checkout@v3 # 默认拉取当前的仓库，即 nextjs-blog
      - name: checkout admin repo
        uses: actions/checkout@v3
        with:
          repository: marsk6/blog-admin # 拉取 blog-admin 的仓库
          path: admin # 放到 nextjs-blog/admin 的路径下
      - name: cache admin
        uses: actions/setup-node@v3
        with:
          cache: 'yarn'
      - name: install blog deps
        run: |
          pwd
          yarn
      - name: install admin deps
        run: |
          yarn --cwd ./admin
      - name: build admin # 构建 blog-admin
        run: |
          yarn --cwd ./admin keystone:build
      - name: build blog # 执行启动 keystone http 服务器，构建 nextjs-blog 的脚本
        run: |
          yarn build
      - name: deploy blog # 部署到 github-pages
        uses: JamesIves/github-pages-deploy-action@v4
        with:
          folder: out
          token: ${{ secrets.ACCESS_TOKEN }}
```

![[separate-keystone-from-nextjs-blog-1.png|blog github action 流程]]

## 关联

[Repositories - GitHub Docs](https://docs.github.com/en/rest/repos/repos?apiVersion=2022-11-28#create-a-repository-dispatch-event)

> [本博客](https://marsk6.github.io/) 所有文章除特别声明外，均采用 BY-NC-SA 许可协议。转载请注明出处！
