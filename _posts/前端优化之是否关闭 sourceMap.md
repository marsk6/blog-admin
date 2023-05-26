---
created_date: 2022-05-03 20:14
updated_date: 2023-05-05 14:59
title: 前端优化之是否关闭 sourceMap
slug: if-disable-source-maps-in-live
brief: 建议前端构建开启 source maps，定位线上问题的技巧
tags:
  - 性能优化
---

## 构建配置是否开启 sourceMap？

看到一些前端性能优化的文章，都建议生产环境关闭 sourceMap，因为 sourceMap 会增大包体积，增加构建时间，不安全泄漏源码，这些都没问题。
但是关掉 sourceMap，线上出现问题就很难定位了，所以我的建议是**构建配置开启 sourceMap**，部署时过滤掉或上传到内网存储，**不要部署到生产环境**。

## 浏览器如何加载 sourceMap？

以 Chrome 为例，打开 DevTools，开启 source maps

![enable source map](https://cdn.jsdelivr.net/gh/marsk6/image-center@master/if-disable-source-map-1.png)

只要打开 DevTools，浏览器就会自动下载 source maps，否则不会。
下载 source maps 时的 url 前缀默认和 js 静态资源的前缀一样。

![load source maps](https://cdn.jsdelivr.net/gh/marsk6/image-center@master/if-disable-source-map-2.png)

浏览器自动解析 source maps 后，在 Source -> Page 就会有 webpack 目录。

![Source -> Page](https://cdn.jsdelivr.net/gh/marsk6/image-center@master/if-disable-source-map-3.png)

## 只有 sourceMap，没有 sentry 之类工具时，如何定位线上问题？

一种方法。如果 source maps url 和 js 静态资源的 CDN 域名相同，则可通过代理工具把 source maps 的请求转发到内网服务器，甚至转发到本地

![以 whistle 为例](https://cdn.jsdelivr.net/gh/marsk6/image-center@master/if-disable-source-map-4.png)

## 关联

SourceMapDevToolPlugin：更精细的配置生成的 source maps，例如加载 source maps 的 url

> 本博客所有文章除特别声明外，均采用 BY-NC-SA 许可协议。转载请注明出处！
