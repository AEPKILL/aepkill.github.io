----
title: zone.js
date: 2016-10-07 13:47:50
categories: 前端技术
tags: [Javascript , TypeScript , 笔记 , 调试]
description: 来自 Angular2 团队的zone.js实现了对异步任务进行了封装，并且提供了异步执行时的 Hook 接口，方便开发者在异步任务执行前后做一些额外的事情，比如：记录日志，监控性能，附加数据到异步上下文中等。

----

用官方的描述来说，zone.js是描述JavaScript执行过程的上下文，它是一个跨异步任务依然存在的上下文，有点类似于TLS（[thread-local storage: 线程本地存储](https://link.zhihu.com/?target=http%3A//en.wikipedia.org/wiki/Thread-local_storage)）技术，zone.js则是将TLS引入到JavaScript语言中的实现框架。

简单来讲zone.js对异步任务进行了封装，并且提供了异步执行时的 Hook 接口，方便开发者在异步任务执行前后做一些额外的事情，比如：记录日志，监控性能，附加数据到异步上下文中等。

## 输出异步任务的耗时

这个例子或许意义不大，但是足够简洁：**在异步任务完成后输出这个异步任务耗时多少。**

```typescript
import 'zone.js';

Zone.current.fork({
    name: 'printAsyncTime',
    onInvokeTask (parentDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone, task: Task, applyThis: any, applyArgs: any[]) {
        let startTime = performance.now(),
            result = parentDelegate.invokeTask(targetZone, task, applyThis, applyArgs);
        console.log(`${task.source} 耗时 ${performance.now() - startTime}ms `, task.data);
        return result;
    }
}).run(Main)

function Main() {
    setTimeout(function whenTimeout() {
        let i = 0;
        while ((i++) < 999999999) { }
    });

    document.addEventListener('click', function whenDocumentClick() {
        let i = 0;
        while ((i++) < 88888888) { }
    });
}
```

```shell
=> setTimeout 耗时 749.48ms
// 当点击页面后输出
=> HTMLDocument.addEventListener:click 耗时 55.73000000000002ms
```

接下来解释一下这个例子：

Zone 是一个类，current 是Zone类的一个静态 Getter，他会返回当前运行环境在哪个 Zone 对象下，在不同的上下文zone.js会自动切换到不同Zone对象保证每次调用 Zone.current 都能够正确获得与当前上下文关联的Zone对象，默认全局代码处于一个名为 "<root>" 的zone上下文，所以这里的 Zone.current 得到的是这个 <root> zone。

fork 是 Zone 对象的一个方法，它返回一个继承自调用方的全新Zone对象：

![img](https://aepkill.github.io/img/zone.js/1.png)



在 fork 的参数中提供了一些Hook操作选项，例如当前例子中的onInvokeTask，同时还有一个必填项 name 属性为返回Zone对象的名称，这个主要是便于调试。

run 也是 Zone 对象的一个方法，它的作用是在当前Zone上下文中执行一段代码，在此案例中是在newZone 的上下文中执行 main 函数。

当执行 main 函数的时候，两个异步函数的回调被封装成了两个 Task ，在**正确的时机**会被执行。在当前案例中，因为设置了异步调用时的 Hook(onInvokeTask) 所以 zone.js 会直接将异步任务交给设置的Hook函数处理。

传给 onInvokeTask Hook 函数的参数有：

1. parentZoneDelegate 父级Zone代理对象
2. currentZone 当前 Zone 对象
3. targetZone 生成这个异步任务的 Zone 对象
4. task 异步任务对象

parentZoneDelegate 是 ZoneDelegate 类的实例，ZoneDelegate 类是 Zone 类的一个辅助类，它的核心功能就是检查调用fork方法时传入的参数有没有设置某个操作的Hook函数，如果有则直接调用该 Hook，如果没有就调用zone.js 默认的操作。

> 这是 ZoneDelegate 的 invokeTask 方法的核心代码：
> this._invokeTaskZS ?
>
> ```typescript
>         this._invokeTaskZS.onInvokeTask(
>             this._invokeTaskDlgt, this.zone, targetZone, task, applyThis, applyArgs) :
>         task.callback.apply(applyThis, applyArgs);
> ```
> this._invokeTaskZS 是调用 fork 方法时传入的参数，ZoneDlegate 的构造函数做了一些处理，如果传入的对象没有 onInvokeTask 这个属性那么 this._invokeTaskZS 为 null。
>
> task.callback 是异步的回调函数，例如上面代码中的的 whenTimeout , whenDocumentClick 函数。
>
> 可见，如果没有设置 onInvokeTask Hook 的话，zone.js 在异步操作被触发直接执行了回调函数。

currentZone 是当前 Hook 函数所在的 Zone 对象，targetZone 是触发异步时的Zone对象，因为zone.js 会沿着整个 fork 链查询 Hook 函数 ，所以触发异步时Zone对象有可能不是当前Hook 函数所在的Zone对象，这里需要区分一下。

![img](https://aepkill.github.io/img/zone.js/2.png)

task 异步任务对象，对于开发者而言仅需要关注它的四个属性：

1. callback 异步任务的回调
2. data 存放异步任务的一些数据
3. type  异步任务的类型
4. source 异步任务是被那个异步函数启动的，如 setTimeout , addEventListener

其他三个参数基本没有什么好讲的，关于type 属性，在 zone.js 中异步任务被划分成三种：‘ microTask’ ， ‘macroTask’ ，‘eventTask’，其中 eventTask 指的是事件监听器产生的异步任务，microTask 和 macroTask 和JS引擎中的microTask macroTask 保持一致：

> macrotask 和 microtask 两个概念，这表示异步任务的两种分类。在挂起任务时，JS 引擎会将所有任务按照类别分到这两个队列中，首先在 macrotask 的队列（这个队列也被叫做 task queue）中取出第一个任务，执行完毕后取出 microtask 队列中的所有任务顺序执行；之后再取 macrotask 任务，周而复始，直至两个队列的任务都取完。
>
> - **macro-task:** script（整体代码）, setTimeout, setInterval, setImmediate, I/O, UI rendering
> - **micro-task:** process.nextTick, Promises（这里指浏览器实现的原生 Promise）,Object.observe, MutationObserver

因为我们只需要输出异步的执行时间，所以就只记录了下异步触发的时间，然后就交给父级parentZoneDelegate对象处理了，等父级处理完毕，再把当前时间和刚才记录的时间做一下减法就可以大概知道这个异步任务消耗了多少时间了。

> 这里用到了大概这个词，因为 parentZoneDelegate  的一些操作也会耗费一些时间，虽然不多，但这里也不是完全精准的异步任务耗时。

## long-stack-trace

上面那个例子主要是为了大概说明一下zone.js的一些概念，接下来我们利用zone.js实现一个强大的调试功能：long-stack-trace。

假设我们有如下代码：

```typescript
import 'zone.js';

function throwError() {
    throw new Error('Error');
}


function main() {
    document.addEventListener('click', throwError);
}

main();
```

当点击网页的时候，我们发现控制台的报错如下：

![img](https://aepkill.github.io/img/zone.js/3.png)

在报错信息中，并不能发现 main 函数中的事件绑定才是整个异常的源头，如果引入了long-stack-trace，那么整个异常链将变得可追溯 ：

![img](https://aepkill.github.io/img/zone.js/4.png)

在实现 long-stace-trace 中，将用到另外两个 Hook 功能：

1. onScheduleTask
2. onHandleError

onScheduleTask 是在异步任务被创建的的时候触发，onHandleError则是异步任务执行发生异常时触发，我们的基本思路就是：异步任务创建的时候将当前的调用栈存入 task.data 中，异常的时候把以前的调用栈读出来，然后和当前的调用栈合并输出。

实现如下：

```typescript
import 'zone.js';

function throwError() {
    throw new Error('Error');
}


function main() {
    document.addEventListener('click', throwError);
}

// 调用栈信息
interface IStackInfo {
    stack: string;
    time: Date;
}
class LongStackTrace {
    // long-stace 存放索引
    public static longStack = Symbol('long-stack');
    public name = 'long-stace-trace';
    public onScheduleTask(parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone, task: Task): Task {
        // 旧的栈信息
        let oldLongStack: IStackInfo[] = (Zone.currentTask && Zone.currentTask.data && Zone.currentTask.data[LongStackTrace.longStack]) || [],
            longStack: IStackInfo[] = [{
                stack: new Error().stack,
                time: new Date()
            }].concat(oldLongStack);
        // 存放新的 longStack
        task.data[LongStackTrace.longStack] = longStack;
        return parentZoneDelegate.scheduleTask(targetZone, task);
    }
    public onHandleError(parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone, error: any): boolean {
        let err = new Error();
        // 生成调用栈
        let longStace: IStackInfo[] = [{
            stack: error.stack,
            time: new Date()
        }].concat(Zone.currentTask.data[LongStackTrace.longStack] || []);

        // 格式化调用栈
        err.stack = longStace.map(stack => `----------------------${stack.time.toLocaleTimeString()}-----------------------\n${stack.stack}`).join('\n');
        
        // 打印调用栈
        console.log(err.stack);
        return false;
    }

}

Zone.current.fork(new LongStackTrace()).run(main);
```

## 背后的原理

zone.js Hook 了浏览器上**全部**的异步操作函数(Node.js版则Hook了Node.js的全部异步操作函数)，例如： setTimeout , setInterval ， Promise 等等，然后在它的Hook 函数内创建并调用了异步对象，因为zone.js的源代码太过繁杂不利于描述流程，这里用伪代码大概描述一下 zone.js是如何Hook setTimeout的：

```typescript
let _setTimeout = window.setTimeout;
let _clearTimeout = window.clearTimeout;

(window as any).setTimeout = function (...args: any[]) {
    // 异步回调函数
    let fn = args[0], task = new Task(fn);
    task.id = _setTimeout(function () {
        task.invoke();
    });
    return task;
};

(window as any).clearTimeout = function (task) {
    _clearTimeout(task.id);
}


// 伪 Task 对象
class Task {
    public callback: Function = null;
    public invoke: Function = null;
    public id: number = -1;
    public constructor(callback: Function) {
        this.callback = callback;

        this.invoke = () => {
            // 调用当前 zone 的 runTask
            // 如果整个 zone.fork 链上有 onInvokeTask 的话
            // 该操作会将task对象传递给 onInvokeTask 处理 
            Zone.current.runTask(this);
        };
    }
}
```

这段代码省略了很多操作，但是已经足够反映 zone.js 是如何执行的了。

关于更详细的 API 及 参数说明请查看 [官方项目地址](https://link.zhihu.com/?target=https%3A//github.com/angular/zone.js)

> 本文作者水平有限，若有理解欠缺与偏差之处，望不吝赐教。
>
> 参考：
>
> 1. [Zone.js](https://link.zhihu.com/?target=https%3A//github.com/angular/zone.js)
> 2. [zone.js - 暴力之美](https://link.zhihu.com/?target=http%3A//www.cnblogs.com/whitewolf/p/zone-js.html) (注意：这篇文章中关于zone.js的使用方法大部分已被废弃)
> 3. 线程本地存储 [分类和原理](https://link.zhihu.com/?target=http%3A//www.cppblog.com/Tim/archive/2012/07/04/181018.html) | [实现探究](https://link.zhihu.com/?target=http%3A//www.cppblog.com/Tim/archive/2012/07/04/181122.html)
> 4. [Brian Ford - Zones - NG-Conf 2014](https://link.zhihu.com/?target=https%3A//www.youtube.com/watch%3Fv%3D3IqtmUscE_U) (需翻墙)
