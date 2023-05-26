---
created_date: 2022-04-28 20:46
updated_date: 2023-05-06 17:11
archive:
tags:
  - 技术方案
keywords:
title: 使用 IntersectionObserver 实现目录
slug: intersectionobserver-table-of-content
brief: 用 Intersection Observer API 实现文章目录，目录能跟随页面滚动而高亮标题
---

## 介绍

使用 Intersection Observer API 和 `scroll-padding` 实现一个文章目录，能自动跟随高亮目录标题，其中 scroll-padding 用在当点击目录时，使标题滚到合适的可视区域。

## 现状

`IntersectionObserver` 的 callback 执行时机：

- target 元素在上边界离开和进入可视区域
- target 元素在下边界离开和进入可视区域
- 初始化或快速滚动时，多个 target 同时在可视区域
- 非鼠标滚动交互造成的滚动
- ……

因此为了确定**什么时候**高亮**哪一个**目录标题，设定几个 case。

## case 设计

前提：把上边界作为基线，`threshold` 设为 1，root 是 `document`

- case1: 向上滚动，到基线，变成不相交，active 当前标题
- case2: 向下滚动，到基线，变成相交，active 上一个标题
- case3: 初始化，`heading.getboundingClientRect().top` 离基线最近的 active 标题
- case4: 点击目录，跳到 heading，直接 active，跳过 observe 处理
- caseX: 其他不处理

## 代码实现

### 设置上边界和 `scroll-padding-top`

```typescript
const baseLine = 156 // 上边界的基线位置
const distanceActionToCase1 = baseLine - 6 // scroll-padding-top，点击目录跳转后的标题位置视为 case1
const init = () => {
  document.documentElement.style.scrollPaddingTop = `${distanceActionToCase1}px`
}
```

![baseLine](https://cdn.jsdelivr.net/gh/marsk6/image-center@master/io-toc.png)

用前后的 `scrollTop` 判断滚动方向

```ts
const observer = new IntersectionObserver(
  (entries) => {
    let prevScollTop = document.documentElement.scrollTop
    const isScrollDown = prevScollTop > document.documentElement.scrollTop
    const isScrollUp = !isScrollDown
    prevScollTop = document.documentElement.scrollTop
    // ...
  },
  {
    threshold: [1],
    root: document,
    rootMargin: `-${baseLine}px 0px 0px 0px`, // 设置 rootMargin
  }
)
```

### 处理 case3

比较 `IntersectionObserverEntry.boundingClientRect.top` 和 `baseLine` 的距离，确定哪个 `heading` 离基线最近

```ts
const observer = new IntersectionObserver(
  (entries) => {
    // ...
    let willActiveHeading: Element | null = null
    let isInit = true
    entries.forEach((entry) => {
      const { top } = entry.boundingClientRect
      if (isInit) {
        if (
          Math.abs(top - baseLine) <=
          Math.abs(initClosestHeading.boundingClientRect.top - baseLine)
        ) {
          initClosestHeading = entry
        }
        return
      }
      // ...
    })
    if (isInit) {
      const { hash } = location
      if (hash) {
        ;(
          document.querySelector(`.toc a[href='${hash}']`) as HTMLAnchorElement
        ).click()
      } else {
        initClosestHeading.target.dispatchEvent(new CustomEvent('active'))
      }
      isInit = false
    }
  }
  // ...
)
```

### 处理 case1 和 case2

```ts
const observer = new IntersectionObserver(
  (entries) => {
    // ...
    let willActiveHeading: Element | null = null

    entries.forEach((entry) => {
      if (entry.isIntersecting && isScrollDown) {
        willActiveHeading = entry.target
      } else if (!entry.isIntersecting && isScrollUp) {
        willActiveHeading = entry.target
      }
    })
  }
  // ...
)
```

### 处理 case4

在点击跳转过程中，依然会触发 observer 的 callback

```ts
const article = document.querySelector('.markdown-body')
const allHeadings = article?.querySelectorAll('h1,h2,h3,h4')
allHeadings?.forEach((heading, index) => {
  let a = findToc(heading)
  a?.addEventListener('click', () => {
    tocJumpTo = heading
    tocJumpTo.dispatchEvent(
      new CustomEvent('active', {
        detail: 'cur',
      })
    )
    prevScollTop = document.documentElement.scrollTop
  })
  heading.addEventListener('active', (e) => {
    toc.forEach((t) => t.classList.remove('active-heading'))
    if ((e as CustomEvent).detail === 'prev' && index !== 0) {
      const prevA = findToc(allHeadings[index - 1])
      prevA?.classList.add('active-heading')
      return
    }
    a?.classList.add('active-heading')
  })
  observer?.observe(heading)
})
```

完整代码（React）
https://github.com/marsk6/marsk6.github.io/blob/master/src/components/Toc.tsx

## 实现效果

![实现效果](https://cdn.jsdelivr.net/gh/marsk6/image-center@master/io-toc.gif)

> 本博客 ([Hea的web博客](https://marsk6.github.io/)) 所有文章除特别声明外，均采用 BY-NC-SA 许可协议。转载请注明出处！
