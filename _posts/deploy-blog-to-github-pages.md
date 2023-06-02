---
created_date: 2021-01-29 15:29
updated_date: 2022-08-11 21:28
archive:
tags:
  - 技术方案
  - blog
title: 用 Github Pages 部署静态博客
name: deploy-blog-to-github-pages
slug: deploy-blog-to-github-pages
brief: github pages 是 github 提供的免费静态文件托管服务，可以用来部署静态博客。本文介绍用 next.js 生成的静态博客，部署到 github pages 的过程
---

Github Pages 是 Github 提供的免费静态文件托管服务，可以用来部署静态博客。

## 创建仓库

在 Github 上新建一个仓库 `New repository`

![[deploy-blog-to-github-pages.png|新建仓库]]

仓库名字必须是 `<user>.github.io`。设置仓库可见性，要使用 Github Pages，可见性必须是 `Public`

![[deploy-blog-to-github-pages-1.png|配置仓库]]

## 设置 Github Pages

![[deploy-blog-to-github-pages-2.png|设置 github page]]

你可以先创建一个 `gh-pages` 分支（后面部署会用到）
把 nextjs blog 的构建输出推到 `gh-pages` 分支，分支内的文件目录结构会成为网站的路由路径
对非 Jekyll 项目，构建输出的根目录还要有 `.nojekyll` 文件（确保静态资源能正确加载）

![[deploy-blog-to-github-pages-3.png|blog 的构建输出]]

如果是 Mac/Linux 用户，在项目 package.json 可添加

```json
"postbuild": "touch ./<输出目录名>/.nojekyll"
```

这时可以访问博客了

## 用 Github Action 部署

上面的步骤是我在本地构建并手动推到 `gh-pages` 分支，但更好的方式是通过 Github Action 自动化部署。

在项目中创建 `.github/workflows/publish.yaml`

```yaml
name: GitHub Actions Build and Deploy Demo
on:
  push:
    branches:
      - master # 当 master 分之有更新时自动构建部署
permissions:
  contents: write
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout 🛎️
        uses: actions/checkout@v3 # clone 项目代码
      - name: Cache
        uses: actions/setup-node@v3 # 设置缓存
        with:
          cache: 'yarn'
      - name: build
        run: | # 串行执行构建命令
          yarn
          yarn build
      - name: Build and Deploy # 部署到 github pages
        uses: JamesIves/github-pages-deploy-action@v4 # 用 JamesIves/github-pages-deploy-action 这个 action
        with:
          folder: out # nextjs blog 的构建输出目录
          token: ${{ secrets.ACCESS_TOKEN }} #  为了推到你项目下的 gh-pages 分支，需要你的 github token
```

创建 ACCESS_TOKEN

1. https://github.com/settings/tokens 记下创建的 token
2. 设置 ACCESS_TOKEN

![[deploy-blog-to-github-pages-5.png|secrets.ACCESS_TOKEN 配置]]

代码推送到 master 后，就会触发构建部署

![[deploy-blog-to-github-pages-4.png|运行 action]]

## 关联

[创建 GitHub Pages 站点 - GitHub 文档](https://docs.github.com/zh/pages/getting-started-with-github-pages/creating-a-github-pages-site)

> [本博客](https://marsk6.github.io/) 所有文章除特别声明外，均采用 BY-NC-SA 许可协议。转载请注明出处！
