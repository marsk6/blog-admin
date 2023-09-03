---
title: CSS Color - HSL 函数
created_date: 2021-12-11 23:22
updated_date: 2021-12-12 15:24
tags:
  - css
brief: 对开发者更友好的 css 颜色函数 - HSL，HLS 的每个值都有语义，由 h(色相)、s(饱和度)、l(亮度) 组成，可以让开发者通过值去判断展示的颜色。
slug: CSS-color-function-HSL
---

## 背景

CSS 色彩 `color` 可以使用 3 种值定义：关键字、RGB 立体坐标系、HSL 圆柱坐标系。

关键字，如 `red`、`green`，颜色语义明确，但关键字数量有限，无法表达所有的颜色。

RGB 立体坐标系，即立体直角坐标系，由 3 个 16 进制值组成，`rgb(255, 255, 255)` 或 `#FFFFFF`，16 进制值对计算机友好，开发者就很难推测和调整颜色对应的值。

![[css-hsl-2.png]]

HSL 圆柱坐标系，即立体极坐标系，由 h(色相)、s(饱和度)、l(亮度) 组成，`hsl(60, 100%, 50%)`，相比 RGB 的优点是更加直观：你可以估算你想要的颜色，然后微调。它也更易于创建相称的颜色集合。（通过保持相同的色相并改变亮度/暗度和饱和度）。

![[css-hsl-4.png|420]]



## hsl 圆柱色彩体系

| 值                    | 描述                                             |
| --------------------- | ------------------------------------------------ |
| hue - 色相            | 定义色相，0 或 360 为红，120 为绿，240 为蓝      |
| saturation - 饱和度 % | 定义饱和度，越高颜色越纯，越低则越淡，0% 为灰色  |
| lightness - 亮度 %    | 定义亮度，0% 为黑色，100% 为白色，50% 为黑白之间 |

### 色相（h）

把颜色变成 360° 圆，0 或 360 为红，120 为绿，240 为蓝。
![[css-hsl-1.jpeg]]

### 饱和度（s）

0% - 100%，越高颜色越纯，越低则越淡，0% 为灰色。

0% 为灰色可理解为没有颜色，此时亮度为 50%，显示灰色。
![[css-hsl-3.png]]
### 亮度（l）

0% 为黑色，100% 为白色，50% 为黑白之间。

如果饱和度为 0%，50% 黑白之间为显示灰色

## hsl 函数

CSS 中颜色值可以使用 hsl 函数，例如按照色相圆盘，`color: hsl(60, 100%, 50%)` 为黄色。

使用 hsl 函数，可以让开发者更容易推测值的颜色。

## 关联

- [RGB 颜色空间 - Win32 apps | Microsoft Learn](https://docs.microsoft.com/zh-cn/windows/win32/wcs/rgb-color-spaces)
- [圆柱坐标系 - 维基百科，自由的百科全书](https://zh.wikipedia.org/wiki/%E5%9C%93%E6%9F%B1%E5%9D%90%E6%A8%99%E7%B3%BB)
- [Why should you use HSL color representation in CSS?](https://tsh.io/blog/why-should-you-use-hsl-color-representation-in-css/)

> 本博客 ([marsk6](https://marsk6.github.io/)) 所有文章除特别声明外，均采用 BY-NC-SA 许可协议。转载请注明出处！

----
