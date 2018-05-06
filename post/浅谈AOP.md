---
title: 浅谈 AOP
categories: 设计模式
date: 2016-10-03 15:20:19
tags: [设计模式 , TypeScript]
description: 作为对面向对象的补充，在面向切面编程(AOP)中我们关注是如何将一些公用的逻辑进行抽离，然后再运行时动态将这些逻辑的切入到类的方法的指定位置上
---

`AOP` 全称是 `Aspect Oriented Programming` ，即面向切面编程，这不是一种新鲜的技术，关于它的概念早在90年代就已经提出。

在面向对象编程中(`OOP`)，关注的是如何对数据结构和行为进行抽象，并将其封装成一个类，并通过继承这种手段不断的对一个类进行扩充，以达到复用代码的目的。我们通常还会将不同功能分散到不同的类中去，以降低单一类的复杂性，同时也是为了更好的重用一个类，这在软件设计里面有个名词叫职责分配。

> 在面向对象的设计模式中关于类的职责分配还有一个理想的状态：单一职责原则( Single Respnsibility Principle , SRP )。

在面向对象的编程中，如果有多个类重复使用一段代码逻辑，我们通常会将这部分代码提取出来成为一个独立类的一个方法，然后被这多个类调用，现在我们有了新的选择：面向切面。

在面向切面编程(`AOP`)中我们关注是如何将一些公用的逻辑进行抽离，然后再运行时动态将这些逻辑的切入到类的方法的指定位置上，以达到复用代码的目的，面向切面并不是为了取代面向对象而出现的，只是作为对面向对象编程的一个补充。

> 关于实现AOP的技术，主要有两大类：
>
> 1. 采用动态代理技术，利用截取消息的方式，对该消息进行装饰，以取代原有对象行为的执行；
> 2. 采用静态切入的方式，引入特定的语法创建“切面”，从而使得编译器可以在编译期间织入有关“切面”的代码。
>
> 虽然具体的实现方式不同，然而殊途同归，实现AOP的技术特性却是相同的，本文仅描述静态切入的方式。

下面我们将实例演示面向切面编程( TypeScript 代码 )，我们将定义3个切入点：

1. 方法执行前
2. 方法执行后
3. 方法内产生异常

``` typescript
// filename: Aspect.ts

// 方法执行前切入
export function Before(fn: Function) {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    let value = descriptor.value;
    descriptor.value = function (...args: any[]) {
      fn.apply(this, args);
      value.apply(this, args);
    }
  }
}
// 方法执行后切入
export function after(fn: Function) {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    let value = descriptor.value;
    descriptor.value = function (...args: any[]) {
      value.apply(this, args);
      fn.apply(this, args);
    }
  }
}
// 方法内产生异常切入
export function whenError(fn: Function) {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    let value = descriptor.value;
    descriptor.value = function (...args: any[]) {
      try {
        value.apply(this, args);
      } catch (e) {
        fn.call(this, e, args);
      }
    }
  }
}
```

``` typescript
// filename: App.ts
// 我们实现在添加用户时:
// 1. 记录日志
// 2. 如果无权限添加则发出警告
// 3. 操作完成记录完成的日志
import { after , before , whenError } from 'Aspect';


function log(msg: string) {
  return function () {
    console.log(msg);
  }
}

function waring(err: Error) {
  console.warn(`用户添加失败: ${err.message}`);
}

function checkAuth() {
  console.log('权限检查通过');
}

class User {
  @whenError(waring)  
  @after(log('用户添加成功'))
  @Before(log('开始添加用户'))
  @Before(checkAuth)  
  public add() {
    // 真正添加用户的业务逻辑
  }
}

var user = new User();
user.add(); // =>  开始添加用户
			// => 权限检查通过
			// => 用户添加成功
```

从上面的代码我们可以看出，分离了核心业务代码与权限代码日志代码之间的耦合，让我们专心的书写真正的业务逻辑，同时日志代码和权限代码还可以多方重用，比如以后有个删除用户的方法，验证器几乎可以不需要任何修改的被复用。

> 本文作者水平有限，若有理解欠缺或偏差之处，望不吝赐教。
>
> 您可以通过邮箱联系到我：a@aepkill.com。
>
> 参考：
>
> * [AOP技术基础](http://wayfarer.cnblogs.com/articles/241024.html)​