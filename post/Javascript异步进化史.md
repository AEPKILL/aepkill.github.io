---
title: Javascript 异步进化史
categories: TypeScript
date: 2016-10-04 23:20:19
tags: [Javascript , TypeScript , 笔记]
description: Javascript作为一门深度依赖异步操作的语言，从最开始的Callback到Promise再到Promise + Generator 再到最终的语法糖await和async，不得不说关于异步每一次的进步都让人振奋。

---

## Callback

Javascript 作为一个单线程的语言，无论何时都不能卡住，也无法停下来等待某个事件的完成，因为它一旦停下来就意味着浏览器的假死。

但是，当发起一个网络请求，且服务器没有返回数据的时候，Javascript该干些什么呢？

停下来？不行，停下来浏览器就假死了。

继续执行？那么返回的数据给谁呢？

于是，Javascript引入了异步的概念，我们分两断代码执行，先将此时的代码跑完，等服务器返回数据了在运行设置的回调的函数。

看起来就像这样：

``` typescript
// 获取数据
function getData(callback: (data:any)=>void) {
  setTimeout(function(){
    callback(null , {data:'我是数据'});
  },1000);
}

// 获取数据，并设置回调函数
// 先执行后面的代码，等数据返回了在执行回调函数
getData(function(err , data){
  if (err === null) {
      console.log(data);
  }
});

// other code....
```

看起来似乎是"完美"的解决了等待的问题，代码又可以愉快的跑起来了，但是，考虑这样一种情况：我们要发起两次请求，且第二次请求必须要在第一次完成后才可以发起，于是代码变成了这样：

``` typescript
// 发起第一次请求
getData1(function (err, data) {
  // 检查是否有异常  
  if (err === null) {
    	// 发起第二次请求
        getData2(function (err, data) {
           
        })
    }
})
```

这只是两次请求的情况，如果说发起很多次呢，每一次都必须上次的请求完成后才可以发起请求，代码很快就会变成这样：

``` typescript
getData1(function (err, data) {
    if (err === null) {
        getData2(function (err, data) {
            if (err === null) {
                getData3(function () {
                  ....
                })
            }
        })
    }
})
```

嵌套会越来越深，回调的逻辑也会越来与复杂，最终的形式就是著名的 `Callback Hell(回调地狱)` 。

> 网络请求很少会产生如此多的嵌套，但在动画效果中，一个元素的动画要等上一个元素动画完成再执行的情况却是再常见不过的了，这种情况下很容易产生回调地狱。

Callback 在概念上来说十分简单，但是在回调依赖变得复杂的时候代码会乱成一团，无法管理。

而且如果异步发生异常，那么该如何通知回调？

目前的方式一般是指定回调的第一次参数为 err 参数，异步过程中如果发生异常，那么这个err的值则为异常对象，如果没有异常那么这个err为null，回调函数只需要检查这个err对象是否为空就可以判断异步过程是否有异常。

这种方式虽然解决了异常处理的问题，但是不得不说解决的方式十分的粗糙，程序员并不希望在每个回调内都复制粘贴异常处理的代码，而是希望把异常都放到一个统一的函数内做处理，回调仅关心真正的业务逻辑。

亟需一种优雅的方式来解决这些问题，这就是Promise。

## Promise

### Promise 写法

Promise并不是一种新的语法，它是对回调一种封装，它使用一个对象来传递异步，从而让异步的写法更优雅，使用Promise的异步代码看起来像这样：

``` typescript
function getData(){
  return new Promise(function(resolve,reject){
    setTimeout(function(){
      resolve({data:'我是数据'});
    },1000);
  });
}

getData().then(function(data){
  console.log(data);
}).catch(function(err){ // 处理异常信息
  ...
});
```

乍一眼看上去并没有让代码变简单，反而更复杂了，但是对于多个异步互相依赖的情况下，却会简洁很多：

``` typescript
getData1().then(function(){
  return getData2();
}).then(function(){
  return getData3();
}).then(function(data){
  console.log(data);
// 处理异常
}).catch(function(){
  
})

// 使用 Callback 的情况
getData1(function (err, data) {
    if (err === null) {
        getData2(function (err, data) {
            if (err === null) {
                getData3(function () {
                  ....
                })
            }
        })
    }
})
```

对比使用 Callback 完成异步的层层嵌套，Promise 将回调之间嵌套拍平了，无论多少个异步的依赖都只有一层嵌套，而且将异步中的异常都放到了 catch 和 reject 中做处理，而不是每一个回调内都，无疑，这极大的方便了代码的编写，把程序员的思维从回调的嵌套中拉了回来，开始关注真正的代码逻辑。

> 注意，千万不要把 Promise 写成和 Callback 一样，不然我们会刚走出 `Callback Hell` 陷入 `Promise Hell` 。
>
> ``` typescript
> // 反面教材
> getData1().then(function(){
>   getData2().then(function(){
>     ....
>   });
> });
> ```

### Promise  实现

接下来根据 [Promise A+规范](https://promisesaplus.com/) 来实现一个标准的 Promise 实现，Promise A+是目前广泛被认可的标准，与之相对应的还有 ES6 Promise 标准，但目前 Promise A+ 更为通用。

一个标准的 Promise A+ 实现需要通过 [Promise A+测试用例](https://github.com/promises-aplus/promises-tests) 的全部测试，不然不能称之为一个健全的 Promise 实现。

完整的代码与注释放在这里: [Promise](https://github.com/AepKill/Promise) ，已通过全部测试。

> Promise 实现起来比较简单，又一个非常重要的基础概念，自己亲手写一遍可以很好的巩固对Promise的理解。

## Promise + Generator

Promise 无疑解决了很多异步的麻烦，但还是不够直观，有没有一种方法可以让我们像写同步代码一样写异步代码，Promise + Generator 给出了答案。

Generator 函数原本是一个生成器，因为它可以将控制权切出当前函数，而且当前函数后还可以被恢复执行，恢复的时候是接着被切出的时下一条语句执行，所有的闭包的变量都还在：

```typescript
// Generator 函数需要在 function 加一个 * 号
function* G() {
    let a = yield 1;
    let b = yield a + 2;
}

// Generator 返回的是一个迭代器
var iter = G();
// 调用 next 的时候执行到 yield 1 ，然后控制权被又被切出了G函数， a 等于 yield 返回的值
var a = iter.next(); // a = 1
// 继续执行 G 函数
// 从let a = yield 1 后面开始执行
// 注意我们 next 还传入了一个值，这个值将被赋值给 G 函数内的变量 a 
// b 的值等于 G 函数内的 a + 2，即 222 + 2
var b = iter.next(222); // b = 224
```

于是开发者很好的利用这个特性来完成异步，我们 yield 一个 Promise 出去，等这个 Promise 完成了，在通过 next(value) 把完成时的值传回来即可。

``` typescript
// 两个生成 Promise 的工具方法
// 根据时间延时触发value
function reject(value: any, time = 0) {
    return new Promise(function (resolve, reject) {
        setTimeout(function () {
            reject(value);
        }, time);
    });
}
function resolve(value: any, time = 0) {
    return new Promise(function (resolve, reject) {
        setTimeout(function () {
            resolve(value);
        }, time);
    });
}


// 执行异步的代码
function Run<T extends Promise<U>, U>(fn: () => Iterable<T>) {
    let iter = G();
    function resolve(data?: any) {
        next(data);
    }
    function reject(data?: any) {

    }
    function next(data?: any) {
        let value = iter.next(data).value;
        if (value) {
            value.then(resolve, reject);
        }
    }
    next();
}

// 用同步的方式写异步
Run(function* () {
    let a = yield resolve(1111, 1000);
    let b = yield resolve(2222, 1000);

    console.log(a + b); // => 3333
});


```



## await/async

Generotor + Promise 允许了我们用同步的方式写异步代码，ES7还针对这种方式定义了一个语法糖，await/async 在写法上更优雅，但是本质上还是 Generotor + Promise。

我们将上面用 Generotor + Promise  换成 await/async 的写法：

``` typescript
function reject<T>(value: T, time = 0) {
    return new Promise<T>(function (resolve, reject) {
        setTimeout(function () {
            reject(value);
        }, time);
    });
}
function resolve<T>(value: T, time = 0) {
    return new Promise<T>(function (resolve, reject) {
        setTimeout(function () {
            resolve(value);
        }, time);
    });
}

async function G() {
    let a = await resolve(1111, 1000);
    let b = await resolve(2222, 1000);
    console.log(a + b);
}

G();
```





## PS

简述了异步的发展历史，关于异步时异常这一块没有提到，有时间补上。

> 本文作者水平有限，若有理解欠缺或偏差之处，望不吝赐教。
>
> 参考资料：
>
> * Promise A+规范 [英文版](https://promisesaplus.com/) [第三方中文翻译版](http://www.ituring.com.cn/article/66566)
> * [ECMAScript6入门手册：Generator函数](http://es6.ruanyifeng.com/#docs/generator)
> * [Promise的队列与setTimeout的队列有何关联](http://zhihu.com/question/36972010/answer/71338002)