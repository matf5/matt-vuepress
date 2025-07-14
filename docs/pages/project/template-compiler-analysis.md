---
title: '深度解析：一个轻量级JavaScript模板编译引擎的实现'
---

在现代前端开发中，我们常常需要处理动态渲染的场景。无论是基于后台下发的配置动态生成页面，还是在客户端根据状态渲染不同的UI，我们都需要一个高效的机制来将数据（通常是JSON格式）转换成最终的视图。

传统的“解释执行”模型，即在运行时递归遍历JSON树并创建DOM节点，虽然直观，但在复杂或频繁渲染的场景下可能会遇到性能瓶颈。本文将深度解析一段设计精巧的代码，它实现了一个轻量级的 **模板编译引擎**，通过 **“编译优于解释”** 的思想，将描述UI的JSON对象在运行时动态编译成一个高效的可执行渲染函数，从而获得极致的性能。

## 核心思想：编译优于解释

这段代码的核心思路与Vue、Svelte等现代框架的编译思想一脉相承，但更为轻量和专注。其精髓在于：

1.  **一次性编译 (One-time Compilation)**：它只遍历一次描述UI的JSON树，但目的不是为了直接渲染，而是为了 **生成一段高度优化的JavaScript代码字符串**。
2.  **创建高效函数 (Function Creation)**：它利用 `new Function()` 这个强大的特性，将上一步生成的代码字符串转换成一个真正的、可被V8引擎优化的原生JavaScript函数。
3.  **重复执行 (Reusable Execution)**：之后每当需要重新渲染时，我们只需直接执行这个已经被编译好的函数即可，完全避免了递归遍历的开销，性能表现非常出色。

## 源码与执行流程详解

让我们从入口函数 `createParser` 开始，一步步探寻这个编译引擎是如何工作的。

### 源码

```typescript
/* eslint-disable @typescript-eslint/no-use-before-define */
import type { ContainerElement, Element } from './types';

export * from './types';
export * from './addons/getTemplate';

const forAliasRE = /(.*?)\s+(?:in|of)\s+(.*)/;
const forIteratorRE = /\((\{[^}]*\}|[^,]*),([^,]*)(?:,([^,]*))?\)/;
const DynamicPrefix = ':';

interface ProcessedEach {
  exp: string;
  alias: string;
  index: string;
}

// shadow merge if the dynamic value is plain object
function shouldShadowMerge(dynamicValue: any) {
  return (
    typeof dynamicValue === 'object' &&
    !Array.isArray(dynamicValue) &&
    dynamicValue !== null
  );
}

function isDynamicProp(prop: string) {
  return prop.startsWith(DynamicPrefix);
}

function processEach(each: string): ProcessedEach {
  const inMatch = each.match(forAliasRE);
  if (!inMatch) {
    throw new Error(`Invalid each expression: ${each}`);
  }
  const res: ProcessedEach = {
    exp: '',
    alias: '',
    index: '',
  };
  res.exp = inMatch[2].trim();
  const alias = inMatch[1].trim();
  const iteratorMatch = alias.match(forIteratorRE);
  if (iteratorMatch) {
    res.alias = iteratorMatch[1].trim();
    res.index = iteratorMatch[2].trim();
  } else {
    res.alias = alias;
  }
  return res;
}

function genEach(element: Element) {
  const { each } = element;
  const { exp, alias, index } = processEach(each as string);
  (element as any).eachProcessed = true;
  delete element.each;
  const indexParam = index !== '' ? `,${index}` : '';
  return `_l(${exp}, function (${alias}${indexParam}) {
    return ${codegen(element)};
  })`;
}
function genShow(element: Element) {
  const { show } = element;
  (element as any).showProcessed = true;
  delete element.show;
  return `${show} && ${codegen(element)}`;
}

function genElement(element: Element) {
  const { expression, value: defaultValue } = element;

  const { children = [] } = element as ContainerElement;
  const data = !expression
    ? `${defaultValue ? `'${defaultValue}'` : `''`}`
    : expression;

  const props = Object.keys(element);
  const dynamicProps = props.filter(isDynamicProp);
  const dynamicPropsStatement = `{${dynamicProps
    .map(prop => {
      const dynamicValue = element[prop as keyof Element];
      return dynamicValue ? `${prop.slice(1)}: ${dynamicValue}` : '';
    })
    .join(',')}}`;

  // filter dynamic props in element
  const computedElement = props
    .filter(prop => !isDynamicProp(prop))
    .reduce(
      (res, prop) =>
        Object.assign({}, res, { [prop]: element[prop as keyof Element] }),
      {} as Element,
    );

  return `_h(_m(${JSON.stringify(
    computedElement,
  )}, ${dynamicPropsStatement}), ${data}, _f([${children.map(child => {
    return `${codegen(child)}`;
  })}]))`;
}

function codegen(element: any): string {
  const { each, show } = element;

  if (each && !(element as any).eachProcessed) {
    return genEach(element);
  } else if (show && !(element as any).showProcessed) {
    return genShow(element);
  } else {
    return genElement(element);
  }
}

export function createParser<T>(
  handler: (element: Element, data: any, children?: any[]) => T,
  debug?: boolean,
): (element: Element, data: any) => T {
  return function (element, data) {
    const assignStatements = `const {${Object.keys(data).join(',')}} = params;`;

    const code = `
        ${assignStatements}
        return ${codegen(JSON.parse(JSON.stringify(element)))};
      `;
    /* istanbul ignore else */
    if (debug) {
      console.log('==== template parser debug ====', code);
    }
    const render = new Function('params', '_h', '_l', '_m', '_f', code);
    const eachHandler = function (list: any[], callback: any) {
      return list.map((item, index) => callback(item, index));
    };
    const mergeDynamicProps = function (origin: Element, patch: Element) {
      (Object.keys(patch) as Array<keyof Element>).forEach(
        (prop: keyof Element) => {
          if (shouldShadowMerge(patch[prop])) {
            origin[prop] = origin[prop] || {};
            origin[prop] = Object.assign({}, origin[prop], patch[prop]);
          } else {
            origin[prop] = patch[prop];
          }
        },
      );
      return origin;
    };
    const filterList = function (list: any[]) {
      // the same as list.flat(1)
      // eslint-disable-next-line prefer-spread
      const flattenList = [].concat.apply([], list);
      return flattenList.filter(Boolean);
    };
    return render(data, handler, eachHandler, mergeDynamicProps, filterList);
  };
}
```

### 流程拆解

#### 1. `createParser(handler)` - 准备工作台

一切始于 `createParser`。你调用它并传入一个 `handler` 函数。这个 `handler` 函数是最终的“工人”，它知道如何根据解析结果创建出你想要的视图单元（例如Vue的VNode或React的Element）。`createParser` 的返回值是一个新的函数，我们称之为 `parse`。

#### 2. `parse(element, data)` - 开始解析

`parse` 函数接收两个核心参数：`element`（描述UI结构的JSON树）和 `data`（渲染时需要的动态数据）。一旦被调用，它就立即通过 `codegen(element)` 开启核心的“代码生成”之旅。

#### 3. `codegen(element)` - 核心代码生成器（递归）

这是编译器的“大脑”，它递归地遍历 `element` 树，并根据节点的属性决定生成什么样的JavaScript代码片段：

-   **遇到 `each` 指令** (类似 `v-for`)：调用 `genEach` 来生成循环代码。
-   **遇到 `show` 指令** (类似 `v-if`)：调用 `genShow` 来生成条件判断代码。
-   **普通元素节点**：调用 `genElement` 来生成标准的元素创建代码。

这里有一个非常巧妙的细节：`element.eachProcessed` 标记。它确保了在递归过程中，同一个节点的 `each` 或 `show` 指令只被处理一次，避免了无限循环。

#### 4. `genEach`, `genShow`, `genElement` - 拼接JS代码字符串

这三个函数是真正的“建筑师”，负责将抽象的节点信息转换成具体的代码字符串：

-   **`genEach(element)`**: 它会解析 `item in items` 这样的语法，并生成一段调用 `_l(items, (item, index) => { ... })` 的代码字符串。这里的 `_l` 是一个我们稍后会注入的运行时循环辅助函数。
-   **`genShow(element)`**: 它会生成一段三元表达式代码字符串，如 `condition && "..."`，实现条件渲染。
-   **`genElement(element)`**: 这是最核心的部分。
    1.  **动静分离**：它做了一项非常重要的优化——将节点的 **静态属性** 和 **动态属性**（以 `:` 前缀标识）分离开。
    2.  静态属性通过 `JSON.stringify()` 直接固化成一个JSON字符串，无需运行时计算。
    3.  动态属性则被组合成一个对象字面量字符串，如 `{ prop1: dynamicValue1, ... }`，值是动态的表达式。
    4.  最终，它生成一段调用 `_h(_m(staticProps, dynamicProps), data, children)` 的代码。`_h` 是渲染元素的辅助函数，`_m` 是合并属性的辅助函数。
    5.  它的子节点，则通过递归调用 `codegen(child)` 来生成对应的代码，最终拼接成一个完整的调用链。

#### 5. `new Function(...)` - JIT 即时编译的魔法

所有生成的代码字符串被拼接在一起，形成一个完整的函数体。此时，`const render = new Function('params', '_h', '_l', '_m', '_f', code)` 这行代码发挥了它的魔力。它在运行时动态创建了一个新的JavaScript函数，这个函数的参数就是我们代码里用到的所有运行时辅助函数的占位符（`_h`, `_l` 等）。

#### 6. `render(...)` - 执行并注入运行时依赖

最后，我们调用这个刚刚被动态编译出来的 `render` 函数，并将它运行时所需要的所有“工具”作为参数注入进去：

-   `data`: 作为 `params` 传入，这样函数内部就可以通过解构赋值访问到所有动态数据。
-   `handler`: 作为 `_h` (hyperscript) 传入，这是最终创建VNode或Element的函数。
-   `eachHandler`: 作为 `_l` (list) 传入，提供了处理循环的具体实现。
-   `mergeDynamicProps`: 作为 `_m` (merge) 传入，负责在运行时将静态属性和动态属性合并。
-   `filterList`: 作为 `_f` (filter) 传入，用于处理和过滤子节点数组，例如 `flat` 操作。

## 设计亮点总结

这段代码虽然行数不多，但处处体现了编译思维的精髓：

1.  **关注点分离 (Separation of Concerns)**：
    -   **模板定义 (JSON `Element`)**: 负责定义 **“UI是什么”**。
    -   **编译器 (`codegen`)**: 负责将“是什么”高效地转换成 **“如何渲染”** 的指令代码。
    -   **运行时 (Runtime)**: `_h`, `_l` 等辅助函数提供了 **“如何渲染”** 的具体实现。三者各司其职，清晰解耦。

2.  **性能至上 (Performance-Oriented)**：通过一次性编译生成原生JS函数，避免了反复解释执行的性能开销。将静态和动态属性分离处理，也是Vue等成熟框架中常见的编译优化手段，可以最大化地减少运行时的计算量。

3.  **高度可扩展 (Highly Extensible)**：由于最终的渲染行为是由外部注入的 `handler` 决定的，所以这个编译引擎是平台无关的。你可以传入一个创建Vue VNode的`handler`，也可以传入一个创建React Element的`handler`，而编译器本身无需任何改动，具有极强的灵活性和扩展性。

总而言之，这不仅仅是一个简单的JSON遍历器，而是一个设计精良、高度优化、可扩展的微型模板编译引擎，是前端工程化深度的一个绝佳范例。 