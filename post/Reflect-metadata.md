---
title: Reflect-metadata
date: 2016-09-29 11:06:18
categories: 笔记
tags: [typescript , 笔记]
description: Reflect-metadata库提供了反射机制，通过这个库可以在记录一些元数据，并在运行时获取。
updated: 2016-9-28 14:21:38

---

Reflect-metadata库提供了反射机制，通过这个库可以在记录一些元数据，并在运行时获取。

反射机制是 TS 提供的一个特色功能， 此功能在 ES6 , ES7 提案中并未涉及。

通俗来讲，反射机制即是编译器在编译过程中将一些数据附着进代码中，代码真正运行时可以获取到这些 **元数据** ，当然，我们也可以自己定义一些 **元数据** 。 

> 注意：上面这段话仅适用于 TS 的反射机制，可能于 C# , Java 等的反射机制有出入。

## 安装使用 Reflect-metadata

`npm insall Reflect-metadata --save`

然后再你的代码中 `import Reflect-metadata` ，然后你就可以使用 Reflect-metadata 了。

> Reflect-metadata 是一个 `有副作用` 的模块，它并没有导出任何函数，而是在全局空间上创建了 Reflect 这个命名空间



## 定义元数据

定义元数据我们可以使用 `React.defineMetadata` 这个函数，这个函数被重载过：

```typescript
function defineMetadata(metadataKey: any, metadataValue: any, target: Object): void;
function defineMetadata(metadataKey: any, metadataValue: any, target: Object, targetKey: string | symbol): void;
function defineMetadata(metadataKey: any, metadataValue: any, target: Object, targetKey?: string | symbol): void;
```

target 代码元数据附着的目标，可以是一个对象或function。

targetKey 可以是一个 Symbol 或 String ，可选参数，指定将元数据关联在一个对象或function的某个字段上。

metadataValue 元数据的值

metadataKey 元数据的键



我们尝试给AEPKILL类的Say方法附加一点元数据:

```typescript
import 'Reflect-metadata';
class AEPKILL {
  public Say(){
    console.log('cool')
  }
};
Reflect.defineMetadata( 'name' , 'aepkill' , AEPKILL.prototype , 'Say' );
```

很简单的一个函数，这里先不讲元数据有何用处，只是直观的感受下元数据该如何定义，通过 `Decorator` 还有一个简便的写法：

```typescript
import 'Reflect-metadata';
class AEPKILL {
  @Reflect.metadata( 'name' , 'aepkill' )
  public Say(){
    console.log('cool')
  }
};
```

`Reflect.metadata` 是一个装饰器工厂，他返回了一个附加元数据的装饰器，本质上来讲，这段代码和上面那段代码并没有任何差异，但是更简洁清晰明了。

## 获取元数据

获取元数据我们可以使用 `React.getMetadata` 这个函数，这个函数也被重载过：

``` typescript
function getMetadata(metadataKey: any, target: Object): any;
function getMetadata(metadataKey: any, target: Object, targetKey: string | symbol): any;
function getMetadata(metadataKey: any, target: Object, targetKey?: string | symbol): any;
```

参数含义和定义元数据一致，只是作用从定义变为了获取。

接上文代码，获取上面定义的`name` 元数据：

``` typescript
....
console.log(Reflect.getMetadata( 'name' ,  AEPKILL.prototype , 'Say')); //=> aepkill
```

## 元数据作用

从上文可以看出其实定义及获取一个元数据还是很简单的一件些事情，但这又有什么用呢？

### 运行时参数检查

> TS的类型检查仅在编译时执行，而在运行过程中则是完全的 Javascript 代码，是不存在类型检查的，我们可以通过 `Decorator` + `元数据` 做到这一点。

通过指定 `tsconfig.json` 的  `compilerOptions`字段中的 `emitDecoratorMetadata` 为 true，可以使编译器将一些编译时的信息附加到元数据，这些编译时的信息包括：

1. 参数类型 [仅方法] ， metadataKey 为 `design:paramtypes`
2. 方法返回值[仅方法]，metadataKey 为 `design:returntype`
3. 字段类型 ， metadataKey 为 `design:type`

编译器将参数类型附加到了元数据，我们只要在运行时获取到并检查一下就可以达到运行时的类型检查了。

```typescript
import 'Refelct-metadata';

// 定义装饰器
function ParamsCheck(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  	// 获取字段类型信息
    let propertyType = Reflect.getMetadata('design:type');
  	// 如果字段是一个方法则进行参数检查
  	if ( typeof propertyType === 'function' && descriptor) {
      // 获取参数类型数组
      let argTypes: Array<any> = Reflect.getMetadata('design:paramtypes', target, propertyKey);
      // 获取原来的方法实体
      let value = descriptor.value;
      // 替换原来的方法，增加检查参数类型检查，合法则调用原来的方法
      descriptor.value = function (...args: Array<any>) {
        if (args.length !== argTypes.length) {
            throw new Error('参数数量不匹配');
        }
        for (let i = 0; i < args.length; i++) {
          	// 检查参数类型
            if (!(args[i] instanceof argTypes[i]) && !(args[i].constructor === argTypes[i])) {
                throw new TypeError(`参数 ${i} 类型不匹配`);
            }
        }
        value.apply(this, args);
      }
  	}
}

class AEPKILL {
  @ParamsCheck
  public say(name: string){
    console.log(`Hello , ${name}`);
  }
}

var aep = new AEPKILL();
aep.say('Jack'); // => Hello , Jack
aep.say(1000 as any); // Error( '参数 0 类型不匹配' );

```

## Reflect-metadata 原理

Reflect-metadata 原理非常简单，源码也只有1000来行，还有一大半是Polyfill 及 申明，真正的功能代码不足500行。

Reflect-metadata 创建了一个 WeakMap 对象 ， 暂且称作为 weakmap。

> WeakMap 是一个仅已对象为键值任意的特殊 Map ， 而且他对键对象保持弱引用，也就是说他的键不影响回收机制。了解更多:[WeakMap详细资料](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap)

当你使用 `defineMetadata( metadataKey , metadataValue , target , targetKey )` 的时候， Reflect-metadata 执行了如下操作(流程说明，非真实源代码)：

``` typescript
let targetMetadata = weakmap.get(target);
if ( isUndefined( targetMetadata ) ) {
  weakmap.set(target , targetMetadata = new Map());
}
let keyMetadata = targetMetadata.get( targetKey );
if (isUndefined( keyMetadata )) {
  targetMetadata.set( targetKey ,  keyMetadata = new Map());
}
keyMetadata.set( metadataKey , metadataValue );
```

代码十分简单，没有什么秘密可言。

## 其他 API

### Reflect.getOwnMetadataKeys

函数原型：

```typescript
function getOwnMetadataKeys(target: Object): any[];
function getOwnMetadataKeys(target: Object, targetKey: string | symbol): any[];
function getOwnMetadataKeys(target: Object, targetKey?: string | symbol): any[] ;
```

获取target或targetKey上的所有元数据键名称。

### Reflect.deleteMetadata

函数原型：

``` typescript
function deleteMetadata(metadataKey: any, target: Object): boolean;
function deleteMetadata(metadataKey: any, target: Object, targetKey: string | symbol): boolean;
function deleteMetadata(metadataKey: any, target: Object, targetKey?: string | symbol): boolean;
```

删除一个元数据，成功返回 `true` , 失败返回 `false` 。

###  Reflect.hasOwnMetadata   && Reflect.hasMetadata

函数原型：

```typescript
function hasMetadata(metadataKey: any, target: Object): boolean;
function hasMetadata(metadataKey: any, target: Object, targetKey: string | symbol): boolean;
function hasMetadata(metadataKey: any, target: Object, targetKey?: string | symbol): boolean;
```

查看一个元素是否拥有指定键名称的元数据 。

Reflect.hasOwnMetadata 仅查看当前对象。

Reflect.hasMetadata 会遍历原型链查找



###  Reflect.getOwnMetadataKeys && Reflect.getMetadataKeys

函数原型：

``` typescript
function getOwnMetadataKeys(target: Object): any[];
function getOwnMetadataKeys(target: Object, targetKey: string | symbol): any[];
function getOwnMetadataKeys(target: Object, targetKey?: string | symbol): any[];
```

获取所有元数据键名称。

 Reflect.getOwnMetadataKeys 仅返回当前对象上的元数据键名称。

Reflect.getMetadataKeys 会遍历原型链。



> 本文作者水平有限，若有理解欠缺或偏差之处，请不吝赐教。
>
> 您可以通过邮箱联系到我：a@aepkill.com。