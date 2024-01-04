---
created_date: 2023-12-29 11:46
updated_date: 2023-12-29 11:55
archive: 
tags:
  - blog
  - 问题记录
title: blog 首页样式闪烁问题排查
name: blog-first-paint-issue
slug: blog-first-paint-issue
brief: 首页首屏样式闪烁问题排查，不建议 tailwindcss 和 css in js 一起使用
---

## 问题描述

打开 blog 首页，发现样式会闪烁，非常短暂，看起来先展示 mobile 的样式，再展示 pc 的样式

![[blog-first-paint-issue.gif|400]]

## 问题排查

1. 问题猜想 1，是移动优先的写法导致了问题，但是闪烁很短暂，没法判断第一次展示的样式，以及 debug 到当时的 css。

```jsx *{4}
<section
  className={cx(
    'container flex gap-2 relative',
    'flex-col', // 👉 默认样式是移动端的样式，再用 @media 适配其他端
    'lg:max-w-5xl lg:flex-row lg:mt-4 lg:items-start lg:mx-auto'
  )}
>
  ...
</section>
```

用 devtools 的 performance screenshot 录制渲染过程，从录制的结果看，页面从窄到宽，但第一次渲染不是 mobile 的样式，所以 `@media` 里的样式不影响渲染顺序。

![[blog-first-paint-issue-1.gif|400]]

2. 问题猜想 2，渲染过程中，js 插入了 css 导致闪烁

```jsx *{4}
<section
  className={cx(
    css`
      flex: 1;
      min-height: calc(100.1vh - var(--header-height));
    `
  )}
>
  {children}
</section>
```

代码里有部分 css in js，js 插入 `flex: 1` 后使内容扩大占满了剩余空间，导致了页面闪烁。移除后就没有闪烁的问题。

## 建议

style component、emotion 等 css in js 存在非静态代码，无法在构建时抽离 css，因此不建议 tailwindcss 和 css in js 一起使用，避免样式闪烁问题。
如果要使用 css in js，可以使用 css module 的平替 [vanilla-extract](https://mantine.dev/styles/vanilla-extract/)，它支持在 js 里写 css，在构建时抽离 css。

> 本博客 ([marsk6](https://marsk6.github.io/)) 所有文章除特别声明外，均采用 BY-NC-SA 许可协议。转载请注明出处！
