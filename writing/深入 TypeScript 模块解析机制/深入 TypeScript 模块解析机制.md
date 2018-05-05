---
title: 深入 TypeScript 模块解析机制
categories: TypeScript
date: 2016-10-03 15:40:46
tags: [TypeScript , 笔记]
description: 详细介绍了 TypeScript 的模块解析机制

---

一直以来我都没有去关注过 TypeScript 的模块解析机制究竟是怎样一个过程，只是大概的知道如何去导入使用一个模块，但并不清楚一些编译配置对模块解析机制的影响，直到最近我发现项目里的某些文件中要导入一个模块的路径实在是太长了，我想简化一些导入路径，于是我详细阅读了 TypeScript 的文档和部分源码，终于对 TypeScript 的模块解析机制有了一个比较清晰的脉络。

> 简化前:
>
> ```typescript
> import { ICommercial } from '../../../../../Component/common/Select';
> ```
>
> 简化后:
>
> ```typescript
> import Select from '@Component/common/Select';
> ```

# 相对导入与模块导入

TypeScript 会根据模块名来判断一个模块是应该相对导入还是模块导入。

如果模块名是以 `.` , `..` , `/` ,`\`,`file://` , `盘符:` 开头的名称则 TypeScript 会以`相对导入`来解析这个模块，例如:

``` typescript
import moduleA from './moudleA';
import moduleB from '../moduleB';
import moduleC from '/moduleC';
import moduleD from 'file:///E:/moduleD';
import moduleE from 'E:/moduleE'
```

其他情况则会按照`模块导入`来解析，例如:

``` typescript
import React from 'react';
import { Component } from '@angular/core';
```

# 相对导入

假设我们有这样一个工程:

```shell
c:\example
│   tsconfig.json
│
└───src
        a.ts
        main.ts
```

```json
// filename: tsconfig.json
{
  "compilerOptions": {
    "target": "ES5",
    "strict": true,
    "moduleResolution": "Node"
  },
  "files": [
    "./src/main.ts"
  ]
}
```

 ```typescript
// filename: main.ts
import a from './a';
console.log(a);
 ```

```typescript
// filename: a.ts
export default 'a';
```

当在 `c:/example` 目录下执行 `tsc` 命令后，TypeScript 编译器发现在 `main.ts` 导入了模块 `./a`，这种导入方式符合 `相对导入`规则， TypeScript 编译器会先定位到包含 `main.ts` 的目录我们记作 `containingDirectory` ( 在这个例子中就是 `c:/example/src` ) ， 然后开始解析 `./a`:

TypeScript 会合成路径  `containingDirectory` + `./a.ts` 来定位模块，如果没有找到的话 TypeScript 会继续尝试以 `containingDirectory` + `./a.js` 来定位模块，如果这两种尝试都找不到模块则会查看是否定义了`compilerOptions.rootDirs` :

1. 未定义`compilerOptions.rootDirs` 

   抛出找不到模块的错误

2. 定义了 `compilerOptions.rootDirs` 

   TypeScript 先合成路径 `containingDirectory` + `./a` 记作  `candidate`， 然后遍历所有的  `compilerOptions.rootDirs `获取到 `candidate` 相对每个 `rootDir` 的相对路径，并记录下最短的相对路径我们记作 `suffix`，如果无法匹配到相对路径则抛出找不到模块的错误。

   然后 TypeScript 再继续遍历所有的 `compilerOptions.rootDirs `，并依次在每个 `rootDir` 下面查找`rootDir` + `suffix` + `.ts` 和 `rootDir` +`suffix` + `.js`，如果找到则立即返回模块，如果全部遍历完依然没有找到模块则抛出找不到模块的错误。

   >描述起来似乎有点复杂，接下来举个例子来具体说明一下这个过程。
   >
   >现在有这样一个工程:
   >
   >```shell
   >c:\example
   >│   tsconfig.json
   >│
   >├───common
   >│       a.ts
   >│
   >└───src
   >        main.ts
   >```
   >
   >```json
   >// filename: tsconfig.json
   >{
   >  "compilerOptions": {
   >    "target": "ES5",
   >    "strict": true,
   >    "moduleResolution": "Node",
   >    "rootDirs": [
   >      "src",
   >      "common"
   >    ],
   >  },
   >  "files": [
   >    "./src/main.ts"
   >  ]
   >}
   >```
   >
   >```typescript
   >// filename: src/main.ts
   >import a from './a';
   >console.log(a);
   >```
   >
   >```typescript
   >// filename: common/a.ts
   >export default 'a';
   >```
   >
   >在 `src/main.ts` 中导入模块 `./a` 
   >
   >TypeScript 先定位 `main.ts` 的目录，也就是 `c:/example/src`
   >
   >然后再合成路径 `c:/example/src/a`
   >
   >然后在找出 `c:/example/src/a` 相对每个 `rootDir` 的最短相对路径，在这个例子中 `c:/example/src/a` 只相对 `c:/example/src` 有最短相对路径 `/a`
   >
   >然后 TypeScript 再次遍历 `compilerOptions.rootDirs` ，然后以 `c:/example/common/a.ts` 命中了模块

>还有一个 `compilerOptions.rootDir` 配置，虽然看起来和 `compilerOptions.rootDirs` 类似，但是 `compilerOptions.rootDir` 并不参与 模块的解析仅用于控制输出目录结构。

#模块导入

如果没有设置 `compilerOptions.rootDir`，导入规则如下:

> TypeScript如何解析模块
>
> TypeScript是模仿Node.js运行时的解析策略来在编译阶段定位模块定义文件。 因此，TypeScript在Node解析逻辑基础上增加了TypeScript源文件的扩展名（.ts，.tsx和.d.ts）。 同时，TypeScript在package.json里使用字段"types"来表示类似"main"的意义 - 编译器会使用它来找到要使用的"main"定义文件。+
>
> 比如，有一个导入语句import { b } from "./moduleB"在/root/src/moduleA.ts里，会以下面的流程来定位"./moduleB"：
> /root/src/moduleB.ts
> /root/src/moduleB.tsx
> /root/src/moduleB.d.ts
> /root/src/moduleB/package.json (如果指定了"types"属性)
> /root/src/moduleB/index.ts
> /root/src/moduleB/index.tsx
> /root/src/moduleB/index.d.ts
> 回想一下Node.js先查找moduleB.js文件，然后是合适的package.json，再之后是index.js。
> 类似地，非相对的导入会遵循Node.js的解析逻辑，首先查找文件，然后是合适的文件夹。 因此/root/src/moduleA.ts文件里的import { b } from "moduleB"会以下面的查找顺序解析：
> /root/src/node_modules/moduleB.ts
> /root/src/node_modules/moduleB.tsx
> /root/src/node_modules/moduleB.d.ts
> /root/src/node_modules/moduleB/package.json (如果指定了"types"属性)
> /root/src/node_modules/moduleB/index.ts
> /root/src/node_modules/moduleB/index.tsx
> /root/src/node_modules/moduleB/index.d.ts 
>
> /root/node_modules/moduleB.ts
> /root/node_modules/moduleB.tsx
> /root/node_modules/moduleB.d.ts
> /root/node_modules/moduleB/package.json (如果指定了"types"属性)
> /root/node_modules/moduleB/index.ts
> /root/node_modules/moduleB/index.tsx
> /root/node_modules/moduleB/index.d.ts 
>
> /node_modules/moduleB.ts
> /node_modules/moduleB.tsx
> /node_modules/moduleB.d.ts
> /node_modules/moduleB/package.json (如果指定了"types"属性)
> /node_modules/moduleB/index.ts
> /node_modules/moduleB/index.tsx
> /node_modules/moduleB/index.d.ts
> 不要被这里步骤的数量吓到 - TypeScript只是在步骤（8）和（15）向上跳了两次目录。 这并不比Node.js里的流程复杂。




>本文作者水平有限，若有理解欠缺与偏差之处，望不吝赐教。
>
>参考资料:
>
>TypeScript Doc [英文](https://www.typescriptlang.org/docs/home.html) [中文](https://www.gitbook.com/book/zhongsp/typescript-handbook/details)
>
>[moduleNameResolver.ts](https://github.com/Microsoft/TypeScript/blob/master/src/compiler/moduleNameResolver.ts)





