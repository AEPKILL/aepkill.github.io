---
title: TypeScript-DI
categories: TypeScript
tags: [typescript , 依赖注入 ]
description: 使用 Typescript 实现一个 Ioc 容器。
date: 2016-9-31 22:09:02
updated: 2016-9-31 23:19:35

---

## 起因

在传统的编码过程中，如果我们需要一个对象，那么通常是自己主动去new一个，那么问题来了，要是我需要很多对象，岂不是要一个个去new ，如果我需要的这个对象还依赖其他对象，为了创建我们需要的对象，还要去实例化这个对象依赖的对象。

eg:

```typescript
class A {

}
class B {
  public constructor(public a: A){

  }
}
class C {
  public constructor(public b: B){
    
  }
}
```

如果我们需要类C的一个实例:

```typescript
let a = new A();
let b = new B(a);
let c = new C(b);
```

可以看到，为了创建类C的一个实例，我们需要先创建一个 B 的实例，而为了创建一个B的实例，我们又需要创建一个A的实例。

我们需要手动去追溯一个类的所有依赖并手动去构建这种关系，无疑，这是非常繁重的工作，特么是依赖树变得异常庞大的时候，追溯依赖会变得十分棘手，甚至可以说是无法完成。

这时候很自然就会想到，有没有一个工具，我只需告诉他我需要一个什么对象，它就可以自动的帮我查找依赖并生成这个对象？

答案是肯定的，这就是大名鼎鼎的 `Ioc(Inversion of Control 控制反转)` 容器。

`Ioc容器` 顾名思义，我们原先是需要自己构建依赖的对象，现在则是将创建依赖的控制权交给 `Ioc` 容器来做，背后的脏活累活我们统统不管。

## 实现Ioc容器

实现一个 Ioc 容器还是十分简单的，我们只需要递归查找依赖并实例化注入即可。

```typescript
// filename: ioc.ts

import "reflect-metadata";
const classPool: Array<Function> = [];

// 标记可被注入类
export function injectable(_constructor: Function) {
    let params: Array<Function> = Reflect.getMetadata('design:paramtypes', _constructor);
    if (classPool.indexOf(_constructor) !== -1) {
        return;
    } else if (params.length) {
        params.forEach((v, i) => {
            if (v === _constructor) {
                throw new Error('不可以依赖自身');
            } else if (classPool.indexOf(v) === -1) {
                throw new Error(`依赖${i}[${(v as any).name}]不可被注入`);
            }
        });
    }
    classPool.push(_constructor);
}


// 创建实例
export function create<T>(_constructor: { new (...args: Array<any>): T }): T {
    // 通过反射机制，获取参数类型列表
    let params: Array<Function> = Reflect.getMetadata('design:paramtypes', _constructor);
    // 实例化参数列表
    let paramInstances = params.map((v, i) => {
        // 参数不可注入
        if (classPool.indexOf(v) === -1) {
            throw new Error(`参数${i}[${(v as any).name}]不可被注入`);

        // 参数又依赖则，递归实例化参数对象
        } else if (v.length) {
            return create(v as any);
            
        // 参数无依赖则直接创建对象
        } else {
            return new (v as any)();
        }
    });
    return new _constructor(...paramInstances);
}

```

 

有了Ioc容器再回到上面那个创建 C 对象的例子就简单多了：

``` typescript
import { injectable , create } from 'ioc';

// 标记类 A 可被注入
@injectable
class A {

}

@injectable
class B {
  public constructor(public a: A){

  }
}

@injectable
class C {
  public constructor(public b: B){
    
  }
}

let c = create(C); // 一行代码搞定

// 对比之前的代码 ， 如果依赖增加差距将更大
// let a = new A();
// let b = new B(a);
// let c = new C(b);
```





> 本文作者水平有限，若有理解欠缺或偏差之处，请不吝赐教。
>
> 您可以通过邮箱联系到我：a@aepkill.com。