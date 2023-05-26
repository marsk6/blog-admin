---
created_date: 2022-10-18 10:43
updated_date: 2022-10-19 18:15
archive:
tags:
  - 翻译文章
  - 性能优化
keywords:
  - js 引擎
  - js 性能优化
brief: js 引擎编译流程的简单描述；js 引擎用 shape 和 inline cache 做性能优化，介绍 shape 和 inline cache
slug: zh-cn-js-engine-shape-inline-cache
title: 译 - JavaScript 引擎底层：Shapes 和 Inline Caches
---

> 原文 [JavaScript engine fundamentals: Shapes and Inline Caches · Mathias Bynens](https://mathiasbynens.be/notes/shapes-ics)

本文描述了所有 JavaScript 引擎共有的一些关键基础知识——而不仅是 V8。作为 JavaScript 开发人员，深入了解 JavaScript 引擎的工作原理可以帮你了解代码的性能点。

## JavaScript 引擎编译流程

从你编写的 JavaScript 代码开始，JavaScript 引擎解析源代码并将其转换为抽象语法树 (AST)，之后解释器基于 AST 生成字节码。

![parse-js](https://cdn.jsdelivr.net/gh/marsk6/image-center@master/parse-js.png)

为了使其运行得更快，会把生成的字节码与编译分析数据一起发送到优化编译器。优化编译器根据编译分析数据做出某些假设，然后生成高度优化的机器代码。如果某些假设被证明是不对的，则优化编译器会取消优化并返回给解释器。

### 解释器/编译器的工作流程

现在，让我们分析这个流程中实际运行 JavaScript 代码的部分，即代码被解释和优化的部分，并回顾一下主要 JavaScript 引擎之间的一些差异。

通常，有一个包含解释器和优化编译器的流程。解释器快速生成未优化的字节码，优化编译器需要更长的时间，但最终生成高度优化的机器码。

![parse-js-2](https://cdn.jsdelivr.net/gh/marsk6/image-center@master/parse-js-2.png)

这个流程基本就是 V8 的工作方式

![parse-js-v8](https://cdn.jsdelivr.net/gh/marsk6/image-center@master/parse-js-v8.png)

V8 中的解释器称为 Ignition，负责生成和执行字节码。当它运行字节码时，它会收集分析数据，例如经常调用的函数，这些数据可用于加快以后的执行速度。生成的字节码和分析数据被传递给我们的优化编译器 TurboFan，根据分析数据生成高度优化的机器代码。

![parse-js-SpiderMonkey](https://cdn.jsdelivr.net/gh/marsk6/image-center@master/parse-js-SpiderMonkey.png)

在 Firefox 和 SpiderNode 中使用的 Mozilla JavaScript 引擎 SpiderMonkey 的做法略有不同。他们有两个优化编译器。解释器先让 Baseline 编译器优化，生成稍微优化的代码，然后 IonMonkey 编译器结合运行代码时收集的分析数据，生成高度优化的代码。如果推测优化失败，IonMonkey 会回退到 Baseline 的代码。

![parse-js-charkra](https://cdn.jsdelivr.net/gh/marsk6/image-center@master/parse-js-charkra.png)

Edge 和 Node-ChakraCore 中使用的 Microsoft JavaScript 引擎 Chakra 和 SpiderMonkey 有非常相似的设置，带有两个优化编译器。解释器先让 SimpleJIT（这里的 JIT 代表即时编译器）它会生成稍微优化的代码，然后 FullJIT 编译器结合分析数据，生成高度优化的代码。

![parse-js-jscore](https://cdn.jsdelivr.net/gh/marsk6/image-center@master/parse-js-jscore.png)

JavaScriptCore（JSC）是 Apple 的 JavaScript 引擎，用于 Safari 和 React Native，通过三种不同的优化编译器将代码优化发挥到了极致。LLInt（Low-Level Interpreter），先让 Baseline 编译器优化，再到 DFG（Data Flow Graph）编译器，最后到 FTL（Faster Than Light）编译器。

为什么有些引擎有多个优化编译器？这都是关于权衡取舍的，一方面解释器可以快速生成字节码去运行代码，但字节码通常效率不高；另一方面，优化编译器需要更长的时间，但最终会生成更高效的机器代码。一些引擎选择添加多个具有不同时间/效率特征的优化编译器，允许以额外的复杂性为代价对这些权衡进行更细粒度的控制。另一个权衡与内存使用有关。

以上我们说明了各个 JavaScript 引擎在解释器和优化编译器运行流程方面的区别。但除了这些差异之外，在较高的层次上，所有 JavaScript 引擎都具有相同的架构：有一个解析器和某种解释器/编译器运行流程。

## JavaScript Object Model

让我们具体分析某些方面的实现方式来了解 JavaScript 引擎还有哪些共同点。

例如，JavaScript 引擎如何实现 JavaScript 对象模型，它们使用哪些技巧来加速访问 JavaScript 对象的属性？事实证明，所有主要引擎都实现非常类似。

ECMAScript 规范本质上将所有对象定义为字典，字符串键映射到属性 `descriptor`。

![js-object](https://cdn.jsdelivr.net/gh/marsk6/image-center@master/js-object.png)

除了 `[[Value]]` 本身，规范定义了这些属性：

- `[[Writable]]` 指属性是否赋值
- `[[Enumerable]]` 指属性是否被枚举
- `[[Configurable]]` 指是否可以删除该属性
  `[[ ]]` 符号看起来很特别，表示这个属性不直接暴露给 JavaScript。你可以使用 `Object.getOwnPropertyDescriptor` API 获取的对象属性的属性描述符：

```js
const object = { foo: 42 }
Object.getOwnPropertyDescriptor(object, 'foo')
// → { value: 42, writable: true, enumerable: true, configurable: true }
```

好的，这就是 JavaScript 定义对象的方式。数组呢？

你可以将数组视为对象的特例。一个区别是数组对数组索引有特殊处理。这里数组索引是 ECMAScript 规范中的一个特殊术语。在 JavaScript 中，数组成员限制为 2³²−1 个。数组索引是该限制内的任何有效索引，即从 0 到 2³²−2 的任何整数。

另一个区别是数组还有一个神奇的长度属性。

```js
const array = ['a', 'b']
array.length // → 2
array[2] = 'c'
array.length // → 3
```

在此示例中，数组在创建时的长度为 2，然后我们将另一个元素赋值给索引 2 处，长度自动更新。

JavaScript 对 array 的定义类似 object。例如，包括数组索引在内的所有键名都明确表示为字符串。数组中的第一个元素存储在键名 `0` 下。

![js-array-define](https://cdn.jsdelivr.net/gh/marsk6/image-center@master/js-array-define.png)

`length` 只是另一个不可枚举和不可删除的属性。

当将元素添加到数组后，JavaScript 会自动更新 `length` 的 `[[value]]`

![js-array-define-2](https://cdn.jsdelivr.net/gh/marsk6/image-center@master/js-array-define-2.png)

## 优化属性访问

现在我们知道了 object 是在 JavaScript 中的定义，让我们深入研究 JavaScript 引擎如何有效地处理对象。

纵观 JavaScript 程序，访问属性是目前最常见的操作。对于 JavaScript 引擎来说，快速访问属性是至关重要的。

```js
const object = {
  foo: 'bar',
  baz: 'qux',
}

// Here, we’re accessing the property `foo` on `object`:
doSomething(object.foo)
//
```

### Shapes

在 JavaScript 程序中，多个对象具有相同的属性键是很常见，这些对象具有相同的 _shape_。

```js
const object1 = { x: 1, y: 2 }
const object2 = { x: 3, y: 4 }
// `object1` and `object2` have the same shape.
```

在具有相同 shape 的对象上访问相同的属性也很常见：

```js
function logX(object) {
  console.log(object.x)
  //          ^^^^^^^^
}

const object1 = { x: 1, y: 2 }
const object2 = { x: 3, y: 4 }

logX(object1)
logX(object2)
```

考虑到这一点，JavaScript 引擎可以根据对象的形状优化对象属性访问。

假设我们有一个具有属性 `x` 和 `y` 的对象，它使用我们之前讨论过的字典数据结构：它包含字符串形式的键，这些键指向它们各自的属性 `descriptor`。

![js-object-2](https://cdn.jsdelivr.net/gh/marsk6/image-center@master/js-object-2.png)

如果你访问某个属性，例如 `object.y`，JavaScript 引擎在 `JSObject` 中查找键 `y`，然后加载相应的属性 `descriptor`，最后返回 `[[Value]]`。

但是这些属性 `descriptor` 存放在内存的什么地方呢？我们应该将它们存储为 `JSObject` 的一部分吗？如果我们碰到更多具有这种 `shape` 的对象，那么把完整的属性相关信息存储在 `JSObject` 上是一种浪费，因为这些对象的属性名称是重复的。作为一种优化，引擎单独存储对象的 `shape`。

![js-object-2-1](https://cdn.jsdelivr.net/gh/marsk6/image-center@master/js-object-2-1.png)

除了 `[[Value]]`，`Shape` 包含所有属性名称和 `descriptor`。`Shape` 包含一个偏移量，表示属性值在 `JSObject` 的偏移量，因此 JavaScript 引擎知道在哪里可以找到这些值。每个具有相同形状的 `JSObject` 都指向这个 `Shape` 实例。现在每个 `JSObject` 只需存储针对该对象的值了。

![js-object-3](https://cdn.jsdelivr.net/gh/marsk6/image-center@master/js-object-3.png)

当我们有多个对象时，好处就很明显了。不管有多少对象，只要它们的形状相同，我们只需要存储一个 `shape` 和属性信息！

所有 JavaScript 引擎都使用 `shape` 作为优化，但它们并不都称它们为 `shape`：

- 学术论文称它们为 _Hidden Classes_（区分 JavaScript 类）
- V8 称它们为 _Maps_（区分 JavaScript `Maps`）
- Chakra 称它们为*Types*（区分 JavaScript 的变量类型和 `typeof`）
- JavaScriptCore 称它们为 _Structures_
- SpiderMonkey 称它们为 _Shapes_

在整篇文章中，我们将继续使用术语 _shapes_。

### shape 的转变链和 trees

如果你有一个具有特定形状的对象，然后你给它添加了一个属性，会发生什么？JavaScript 引擎如何处理新的 `shape`？

```js
const object = {}
object.x = 5
object.y = 6
```

这些 shape 在 JavaScript 引擎中形成所谓的转变链（_transition chains_）。这是一个例子：

![js-object-4](https://cdn.jsdelivr.net/gh/marsk6/image-center@master/js-object-4.png)

该对象开始时没有任何属性，因此它指向空 `shape`。下一条语句添加属性 `x` 并赋值 `5`，因此 `shape` 转换为包含属性 `x`，并将值 `5` 添加到 `JSObject` 偏移量 0 处。下一行添加属性 `y`，因此又转换为包含 `x` 和 `y` 的另一个 `shape`，并将值 6 附加到 `JSObject` 偏移量 1 处。

> 注意：添加属性的顺序会影响 `shape`。例如，`{ x: 4, y: 5 }` 的形状与 `{ y: 5, x: 4 }` 不同。

我们也无需要为每个 `Shape` 存储完整的属性表。相反，每个 `Shape` 只需要知道它引入的新属性。例如，我们不必在最后一个 `shape` 中存储 `x` 的信息，因为它可以在链中的前面的位置找到。为了使这项工作有效，每个 `Shape` 都链接回其以前的 `shape`：

![js-object-5](https://cdn.jsdelivr.net/gh/marsk6/image-center@master/js-object-5.png)

如果你访问 `o.x`，JavaScript 引擎会在 `shape` 链上查找属性 `x`，直到找到引入属性 `x` 的 `Shape`。

但是，如果无法创建过渡链会怎样？例如，如果您有两个空对象，并为每个对象添加不同的属性，会怎样？

```js
const object1 = {}
object1.x = 5
const object2 = {}
object2.y = 6
```

在这种情况下，我们用分叉，而不是链式，我们最终得到一个转变树（_transition tree_）：

![js-object-6](https://cdn.jsdelivr.net/gh/marsk6/image-center@master/js-object-6.png)

在这里，我们创建了一个空对象 `a`，然后添加属性 `x`。最终得到一个 `JSObject` 和两个 `shape`

再创建空对象 `b`，然后添加属性 `y`。我们最终得到两个 `shape` 链，总共三个 `shape`。这是否意味着我们总是从空 `shape` 开始？不必要。引擎对包含属性的对象字面量做了一些优化。假设我们从空对象字面量开始添加 `x`，或者有一个已经包含 `x` 的对象字面量：

```js
const a = {}
a.x = 6
const b = { x: 6 }
```

在开始，我们从空的 `shape` 链接到含 `x` 的 `shape`。

对于 `b`，直接创建包含 `x` 的 `shape` 而不是从一个空的 `shape` 开始。

![js-object-7](https://cdn.jsdelivr.net/gh/marsk6/image-center@master/js-object-7.png)

Benedikt 的一篇博客 [Surprising polymorphism in React applications](https://medium.com/@bmeurer/surprising-polymorphism-in-react-applications-63015b50abc) 讨论了这些细节如何影响代码的性能。

举个例子，一个 point 对象包含 `x`，`y`，`z` 3 个属性。

```js
const point = {}
point.x = 4
point.y = 5
point.z = 6
```

按之前的学习，这会在内存中创建一个具有 3 个 `shape`（不包括空 `shape`）。当访问该对象的属性 `x` 时，JavaScript 引擎从链表尾向前查找有 `x` 的 `shape`。

![js-object-8](https://cdn.jsdelivr.net/gh/marsk6/image-center@master/js-object-8.png)

当类似的操作多了，那将会非常慢。找到属性的时间是 $O(n)$，即与对象的属性数量成线性关系。为了加快搜索属性的速度，JavaScript 引擎添加了一个 `ShapeTable` 数据结构。这个 `ShapeTable` 是一个字典，将属性键映射到引入给定属性的各个 `Shape`。

![js-object-9](https://cdn.jsdelivr.net/gh/marsk6/image-center@master/js-object-9.png)

等一下，现在又变成字典查找......当初就是用 `shape` 链优化字典查找！那么，为什么 `shape` 上还有优化呢？原因是 `shape` 启用了另一种称为内联缓存（_Inline Caches_）的优化。

### Inline Caches (ICs)

`shape` 背后的主要动机是 Inline Caches 或 ICs 的概念。ICs 是使 JavaScript 快速运行的关键要素！JavaScript 引擎使用 ICs 来存储有关在何处查找对象属性的信息，以减少昂贵的查找次数。

例如函数 `getX`：

![js-object-10](https://cdn.jsdelivr.net/gh/marsk6/image-center@master/js-object-10.png)

第一个 `get_by_id` 指令从第一个参数 (`arg1`) 加载属性 `x` 并将结果存储到 `loc0`。第二条指令返回我们存储到 `loc0` 的内容。

JSC 还在 `get_by_id` 指令中嵌入了一个 Inline Cache，它由两个未初始化的 slot（N/A 和 N/A）组成。

![js-object-11](https://cdn.jsdelivr.net/gh/marsk6/image-center@master/js-object-11.png)

现在假设我们调用 `getX` 并传参 `{ x: 'a' }`。那么该对象会有一个 `shape`。当第一次执行函数时，`get_by_id` 指令查找 `x` 的值。然后 ICs 会存储该对象的 `shape` 和属性的 `offset` 值

![js-object-12](https://cdn.jsdelivr.net/gh/marsk6/image-center@master/js-object-12.png)

后续运行时，ICs 只需要比较 `shape`，如果和之前一样，就从存储的 offset 中加载值即可。具体来说，如果 JavaScript 引擎看到具有 IC 之前记录的形状的对象，它根本不再需要访问属性信息——相反，可以完全跳过昂贵的属性信息查找。这比每次都查找属性要快得多。

![js-object-13](https://cdn.jsdelivr.net/gh/marsk6/image-center@master/js-object-13.png)

### 有效存储数组

对于数组，通常存储的属性是数组索引，属性的值称为数组元素。为数组中的每个数组元素存储属性特性会浪费内存。相反，JavaScript 引擎使用数组索引属性在默认情况下是可写、可枚举和可配置的这一事实，并将数组元素与其他命名属性分开存储。

例如 array 的存储形式

```js
const array = ['#jsconfeu']
```

和对象类似，但值存在哪里呢？

![js-object-14](https://cdn.jsdelivr.net/gh/marsk6/image-center@master/js-object-14.png)

每个数组都有一个单独的 `Elements`（_elements backing_）存储所有数组索引的属性值。JavaScript 引擎不必为每个索引存储属性特性，因为它们通常都是可写、可枚举和可配置的。

![js-object-15](https://cdn.jsdelivr.net/gh/marsk6/image-center@master/js-object-15.png)

但是，如果更改数组索引的属性特性怎么办？

```js
// Please don’t ever do this!
const array = Object.defineProperty([], '0', {
  value: 'Oh noes!!1',
  writable: false,
  enumerable: false,
  configurable: false,
})
```

上面的代码片段定义了一个名为 `0` 的属性（恰好是一个数组索引），并修改了属性特性。在这种边缘情况下，JavaScript 引擎将整个 `Elements` 存储字典。

![js-object-16](https://cdn.jsdelivr.net/gh/marsk6/image-center@master/js-object-16.png)

即使只有一个数组元素具有非默认属性，整个数组的 `Elements` 也会进入这种缓慢且低效的模式。避免在数组索引上使用 `Object.defineProperty`！

### 总结

我们了解了 JavaScript 引擎如何存储对象和数组，以及形状和 ICs 如何帮助优化它们的常见操作。基于这些知识，我们确定了一些有助于提高性能的实用 JavaScript 编码技巧：

- 总是以相同的方式初始化你的对象，所以它们不会有不同的 `shape`。
- 不要乱用数组元素的 property 属性，这样可以高效地存储和操作它们。
