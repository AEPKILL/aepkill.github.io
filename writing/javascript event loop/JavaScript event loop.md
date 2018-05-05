---
title: JavaScript event loop
date: 2018-03-04 23:47:50
categories: 前端技术
tags: [Javascript ]
description: javascript event loop
---

# 单线程与异步

javascript 是一门单线程的语言，它的语言规范

> 本文作者水平有限，若有理解欠缺或偏差之处，望不吝赐教。
>
> 参考资料:
>
> [JavaScript 运行机制详解：再谈Event Loop](http://www.ruanyifeng.com/blog/2014/10/event-loop.html)
>
> [不要混淆nodejs和浏览器中的event loop](https://cnodejs.org/topic/5a9108d78d6e16e56bb80882#5a98d9a2ce1c90bc44c445af)
>
> [这一次，彻底弄懂 JavaScript 执行机制](http://link.zhihu.com/?target=https%3A//juejin.im/post/59e85eebf265da430d571f89)
>
> [Event Loop的规范和实现](https://zhuanlan.zhihu.com/p/33087629)

