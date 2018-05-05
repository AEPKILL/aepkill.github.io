---
title: TypeScript装饰器
categories: 笔记
tags: [typescript , 笔记]
description: 随着TypeScript和ES6里引入了类，在一些场景下我们需要额外的特性来支持标注或修改类及其成员。 装饰器（Decorators）为我们在类的声明及成员上通过元编程语法添加标注提供了一种方式。
date: 2016-9-27 22:09:02
updated: 2016-9-28 14:21:38
---

装饰器是ES7将会提供的功能，目前TypeScript已提供支持，为了避免编译警告，需要在`tsconfig.json`中设置 `compilerOptions`字段中的 `experimentalDecorators` 为 `true`。
## Decorator  模式

在传统面向对象语言中，给对象添加新功能常常会使用到的是继承，但是考虑这样一种情况：

我们设计了一款赛车游戏，定义了一个 基类 `Car` ，而且每一辆车都提供了改装功能，为了简化问题，假设只提供了三种可更改的设备： 轮子(Shoe ) ， 引擎(Engine) ， 车灯(Light)。

如果使用继承的话，为了实现所有组合的情况，我们需要通过 `Car` 基类派生出以下的子类：

1. 仅改装轮子的车：CarShoe

2. 仅改装引擎的车：CarEngine

3. 仅改装车灯的车：CarLight

4. 改装轮子和引擎的车：CarShoeEngine

   .....

一一枚举出来，我们需要派生 8 个类，如果提供改装的数量增加，这个值将成指数形式上涨。

我们换一种思路，使用 `Decorator 模式` ：

将 `Car` 作为主体，增强功能作为装饰，通过组合来增强功能，把主体一层层包裹起来，这样只需要添加3个增强类即可完成功能。

```typescript
// 定义一个 Car 的标准接口
interface ICar {
    // 获取速度
    getSpeed(): number;
    // 获取光照距离
    getLight(): number;
}

// 定义一个 Car 类
class Car implements ICar {
    public speed: number = 100;
    public light: number = 10;
    public getSpeed() {
        return this.speed;
    }
    public getLight() {
        return this.light;
    }
}

// Light 增强Decorator类
class LightUp extends Car {
    public constructor(private _car: ICar) {
        super();
    }
    public getLight() {
        return this.getLight() + 2;
    }
}

// Shoe 增强Decorator类
class ShoeUp extends Car {
    public constructor(private _car: ICar) {
        super();
    }
    public getSpeed() {
        return this.getSpeed() + 10;
    }
}

// Engine 增强Decorator类
class EngineUp extends Car {
    public constructor(private _car: ICar) {
        super();
    }
    public getSpeed() {
        return this.getSpeed() + 50;
    }
}

var car: ICar = new Car();
car = new EngineUp(car); // 增强引擎
car = new LightUp(car); // 增强灯光
```

## Decorator

`Decorator` 和 `Decorator 模式` 看起来如此相似，很容易把他们混为一谈，但二者并不是描述的同一个东西。

`Decorator 模式` 是一个面向对象的设计模式，它允许你在代码运行的过程中随意的将不同的功能组合到一个对象上，本质上来讲，是`在一个独立对象上拓展其功能`。

而 `  Decorator` 是在类或方法等定义时添加功能，而不是在运行时添加，所以 `Decorator` 的装饰作用范围是作用于这个类的`所有对象`。

TypeScript 提供了如下的 `Decorator(装饰器)` ：

### 类装饰器

类装饰器仅接受一个参数，参数为被装饰类的构造函数，类装饰器可以返回一个值，该值会覆盖原构造函数。

> 注意： 如果装饰器返回一个新的构造函数的话记得处理继承关系，TypeScript不会自动处理。

eg:

``` typescript
// 默认情况下 toString 会返回构造函数的定义字符串
// 我们让 toString 返回更友好的值
// 注意：类装饰器会在类申明后处理，所以如果类重载了 toString 的话，这里会覆盖类重载的 toString 方法。
function toStringFriendship(fn: Function) {
    fn.toString = function () {
        return `Class ${(fn as any).name}`;
    }
    // 防止覆盖重载
    if (fn.prototype.toString == undefined){
      fn.prototype.toString = function () {
        return `Instance of ${(fn as any).name}`;
      }
    }
}

@toStringFriendship
class AEPKILL {

}

var aep = new AEPKILL();

console.log( `${AEPKILL} && ${aep}` );  // Class AEPKILL && Instance of AEPKILL
```



### 方法装饰器  &  访问符装饰器

方法装饰器和访问符装饰器均接受三个参数：

1. `target:any` 如果是静态方法或访问符的话，target为构造函数本身，如果是实例方法或访问符 target 为类的prototype。
2. `property: string | Symbol` 装饰器修饰的方法或访问符的名称
3. `propertyDescriptor: PropertyDecorator` 装饰器修饰的方法或访问符的属性描述符


装饰器返回值会被作为新的属性描述符。

> 注意: 
>
> 如果代码输出目标版本小于`ES5`，*Property Descriptor*将会是`undefined`。
>
> 装饰器返回的值也会被忽略

eg:

``` typescript
function Des(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    return descriptor;
}

class AEPKILL {
    @Des //=> 这里传给 target 的值是 AEPKILL.prototype
    public Say() {
        console.log('Its AEPKILL');
    }
    @Des //=> 这里传给 target 的值是 AEPKILL 本身
    public static Say(){
        console.log('Its AEPKILL');
    }
}
```




### 属性装饰器

属性装饰器仅接受两个参数，比方法装饰器和访问符装饰器少了一个属性描述符，这是因为Javascript中属性是动态赋值的内容，必须实例化后才会有属性描述符，所以在编译期间拿不到，也就不会作为参数传递给属性修饰器了。

> 注意：虽然静态属性可以在编译期间拿到属性描述符，可能是为了保持一致性，该参数也不会传递给属性修饰器。

属性装饰器仅接受的参数：

1. `target:any` 如果是静态方法或访问符的话，target为构造函数本身，如果是实例方法或访问符 target 为类的prototype。
2. `property: string | Symbol` 装饰器修饰的方法或访问符的名称

eg:

```typescript
function Des(target: any , propertyKey: string) {
    console.log(target , propertyKey);
}

class AEPKILL {
    @Des 
    public name: string = 'aepkill';
    @Des
    public static static_name: string = 'static_aepkill';
}
```



### 参数装饰器

参数装饰器接受三个参数：

1. `target:any` 作用于实例方法上则是类的prototype ， 作用于静态方法上则是类本身
2. `propertyKey: string| symbol` 方法名
3. `paramIndex: number` 参数位置，从左往右，从0开始

> 注意：参数装饰器仅能用在类构造函数或方法上，不可用非类成员在函数上。

eg:

```typescript
function Desc(target: any, propertyKey: string | symbol, paramIndex: number) {
    
}

class AEPKILL {
    public Say( @Desc name: string) {
        console.log(`Hello ${name}`);
    }
}

// 不允许，参数装饰器不能用在函数上
function Say( @Desc name: string) {

}
```



### 装饰器组合

#### 装饰器求值

类中不同声明上的装饰器将按以下规定的顺序应用：

1. *参数装饰器*，其次是*方法*，*访问符*，或*属性装饰器*应用到每个静态成员。
2. *参数装饰器*应用到构造函数。
3. *类装饰器*应用到类。

#### 装饰器组合

装饰器组合是从下向上求值的。

eg：

```typescript
@b
@a
class AEPKILL{
  
}
```

调用顺序是 a -> b ，且b的参数是被a修饰过的类，复合效果等同于 b(a(AEPKILL))

## Decorator应用

### AOP 

AOP全称是`Aspect Oriented Programming` 中文名称是 `面向切面编程`。

在 AOP 中我们需要一个切入点来干预方法的执行，已完成权限验证日志记录之类工作。

eg:

``` typescript

function before(fn: Function) {
    return function (target: any, property: string | symbol, propertyDescriptor: PropertyDescriptor) {
        let value: Function = propertyDescriptor.value;
        propertyDescriptor.value = function (...args: any[]) {
            fn.apply(this, args);
            value.apply(this, args);
        }
    }
}


function auth(name: string) {
    let isAdmin = isAdmin(); // isAdmin 返回是否是管理员
    if (!isAdmin) {
        throw new Error('无权操作');
    }
}

class Db {
    @before(auth)
    public addUser(){
        console.log('添加用户成功');
    }
}

var db = new Db();
db.addUser();
```

## 装饰器原理

我们用一个 @ 符号将装饰器名称放到要装饰的目标上方，于是我们的装饰器就生效了，那么是谁 **调用了装饰器并传递了我们想要的参数** ？

我们查看编译后的代码寻找这背后的秘密。



```typescript
// TypeScript 代码

function toStringFriendship(fn: Function) {
    fn.toString = function () {
        return `Class ${(fn as any).name}`;
    }
    // 防止覆盖重载
    if (fn.prototype.toString == undefined){
      fn.prototype.toString = function () {
        return `Instance of ${(fn as any).name}`;
      }
    }
}
@toStringFriendship
class AEPKILL {

}
var aep = new AEPKILL();
```



```javascript
// 编译后的 Javascript 代码

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
function toStringFriendship(fn) {
    fn.toString = function () {
        return "Class " + fn.name;
    };
    // 防止覆盖重载
    if (fn.prototype.toString == undefined) {
        fn.prototype.toString = function () {
            return "Instance of " + fn.name;
        };
    }
}
var AEPKILL = (function () {
    function AEPKILL() {
    }
    AEPKILL = __decorate([
        toStringFriendship,
        __metadata('design:paramtypes', [])
    ], AEPKILL);
    return AEPKILL;
} ());
var aep = new AEPKILL();	
```

注意这些代码片段：

``` javascript
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
AEPKILL = __decorate([
    toStringFriendship,
    __metadata('design:paramtypes', []) // 这是编译器在附着参数元数据，可以忽略
], AEPKILL);
```

编译器为了优化代码量使用了大量的三元表达式，不利于阅读，我们整理一下代码：

``` typescript
var __decorate = function (decorators, target, key, desc) {
    // r代表result  ， d代表descriptor
    var c = arguments.length, r, d;

    // 如果参数数量小于3的话，说明是类装饰器 或 属性装饰器
    // 属性装饰器返回值会被忽略，类装饰返回值替换原来的构造函数
    if (c < 3) {
        r = target;
    
    // 如果参数熟练大于等于3， 说明是方法装饰器或参数装饰器
    // 还记得上文说过如果 "如果代码输出目标版本小于ES5，Property Descriptor将会是undefined"
    // 如果目标代码小于 ES5 的话， desc 是 undefined，那么就不需要获取 属性描述符了
    } else if (desc === null) {
        r = desc = Object.getOwnPropertyDescriptor(target, key);

    // 目标代码小于ES5的时候
    } else {
        r = desc;
    }

    // 如果引入了 Reflect-metadata 库则直接使用 Reflect-metadata 的函数来作用装饰器
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
        r = Reflect.decorate(decorators, target, key, desc);
    
    // 如果没有引入 Reflect-metadata 就只能自己干了
    else {
        // 从右到遍历装饰器
        for (var i = decorators.length - 1; i >= 0; i--) {
            if (d = decorators[i]) {
                
                // 作用 类装饰器
                if (c < 3) {
                    r = d(r);
                // 作用 方法装饰器 ， 访问符装饰器
                } else if (c > 3) {
                    r = d(target, key, r);
                // 作用 属性装饰器
                } else if (c === 3) {
                    r = d(target, key) || r;
                }
            }
        }
    }
    // 如果是 方法装饰器，访问符装饰器 且有返回的新属性描述符则将属性描述符设置回去  
    if (c > 3 && r) {
        Object.defineProperty(target, key, r);
    }
    // 返回最后装饰器的的返回值
    return r;
}


var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};

// 生效我们的装饰器
// 并将最后一装饰器的返回值覆盖掉类声明
AEPKILL = __decorate([
    toStringFriendship,
    __metadata('design:paramtypes', []) // 这是编译器在附着参数元数据，可以忽略
], AEPKILL);
```







> 本文作者水平有限，若有理解欠缺或偏差之处，请不吝赐教。
>
> 您可以通过邮箱联系到我：a@aepkill.com。
>
> 参考：
> 1. 《设计模式：可复用面向对象软件技术的基础》
> 2. 《Javascript设计模式与开发实践》
> 3. [AOP技术基础](http://wayfarer.cnblogs.com/articles/241024.html)
> 4. [Python装饰器的高级用法](http://www.jianshu.com/p/17cf262fc693?utm_source=tuicool&utm_medium=referrl)