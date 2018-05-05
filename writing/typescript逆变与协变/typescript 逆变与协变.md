---
title: TypeScript 中的逆变与协变
date: 2017-12-14
categories: 编程语言
tags: [TypeScript]
description: 在 Typescript 2.6 中增加了一个新的编译选项 '--strictFunctionTypes' , 如果这个选项为 true 那么 TypeScript 会更严格的检查函数类型的传递，这涉及到一个编程概念: 逆变与协变

---

​	最近翻阅 TypeScript 的文档，发现在 2.6 新增的特性中提到了一个新的编译选项 `--strictFunctionTypes` ， 如果这个选项为 `true` 那么 TypeScript 在编译时会执行更加严格的函数类型检查，仅允许函数协变的传递，在 TypeScript 2.6 之前，函数类型是即支持协变也支持逆变，这样是十分不安全的。

​	逆变与协变其实这个概念源自于类型之间的转换，假设我们有一个父类 `Animal` 然后派生了一个子类 `Dog` ，一个 `Dog` 类型的值是可以安全的赋值给 `Animal` 类型的变量:

```typescript
let aAnimal: Animal = new Animal();
aAnimal = new Dog(); // 这种类型转换是合情合理的
```

这种情况就称之为协变。



> 本文作者水平有限，可能有理解欠缺或偏差之处，若有不当之处，望不吝赐教。
>
> 参考资料：
>
> [TypeScript 2.6](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-6.html)
>
> [.NET 4.0中的泛型协变和反变](http://www.cnblogs.com/Ninputer/archive/2008/11/22/generic_covariant.html)
>
> [泛型中的协变和逆变](https://msdn.microsoft.com/zh-cn/library/dd799517.aspx)