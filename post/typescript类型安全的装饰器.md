---
title: typescript类型安全的装饰器
categories: TypeScript
date: 2021-05-12 09:14:17
tags: [TypeScript, Decorator]
description: 本文探讨 typescript 如何写出类型安全的装饰器
---

## 装饰器简介

在 `TypeScript` 中，装饰器提供了为类及成员（方法 & 属性）添加元数据和元编程的语法。一般而言，如果有为类及成员添加加元数据或者在希望不修改类的情况下为类及类成员提供额外的行为的需求，就可以考虑使用装饰器。

> 详细的介绍可以参考这里 [TypeScript-Decorator](./Typescript-Decorator.md)

## 类型安全的装饰器

没有规矩不成方圆，有些时候我们也希望装饰器仅作用于特定的类和特定的方法。例如有一个 `@Controller` 装饰器，我们仅希望该装饰器作用于实现了 `IController` 接口的类，这里就要用到类型安全的类装饰器。

### 类装饰器

`typescript` 提供了一个 `ClassDecorator` 类型，但是这是一个通用的类装饰器类型，它可以作用于所有的类，并不能满足上面的要求。

e.g:

```typescript
interface IController {
  // 规定每个控制器都必须实现 init 方法
  init(): void;
}

const Controller: ClassDecorator = <TFunction extends Function>(
  target: TFunction
): TFunction | void => {};

// 即使 UserController 没有实现 IController 编译时也不会报错
@Controller
class UserController {}
```

[点击这里在线预览示例](https://www.typescriptlang.org/play?#code/JYOwLgpgTgZghgYwgAgJIGED24qYDZ7TIDeAUMsgPSXKAjkYFnag89aBUcoOXGgbEqAWaoL8Jgo-qDeGYDztQA3OyUMDDJAnaaBVm3JiQEgBQBKAFzIAbpmAATANykAvqVIJsAZ0lYc+QlA3o8cCxYAiEc1DhhMUZAC8yAA8ACoAYgCuIAhgwNjIEAAekCC6FshRMXHYAHxK8mBwUADmEGAaEdGx8SCk6shV2bXIAD5aOrqBuSRUAFR9yAB0I+a6ECPIfTRGhqTUyIDOyoD+8sgAqhbQNmC4BESAhTaAkOYiaNu79siAaP6Ai9GAb6aA+nKAsHKAWPKApUaAmKmkAAJndtBmzlc602UF+e38xCMQA)

要把这个类装饰器改为类型安全的装饰器我们只需要限制一下 `@Controller` 参数中 `target` 的类型即可，如下所示:

```typescript
// 引入一个构造函数类型
interface Construct<Class, Args extends any[] = any[]> {
  new (...args: Args): Class;
}

interface IController {
  /** 假设每个控制器都必须实现 init 方法 */
  init(): void;
}

// 因为类装饰器的 target 接收的是类的构造函数，所以这里我们限制 target 的类型为 Construct<IController> 即可
const Controller = <T extends IController>(
  target: Construct<T>
): Construct<T> | void => {};

// 未实现 IController 会报错
// 错误信息:  Property 'init' is missing in type 'UserController' but required in type 'IController'.t
@Controller
class UserController {}

// 实现了 IController 不会报错
@Controller
class User2Controller implements IController {
  init() {}
}
```

[点击这里在线预览示例](https://www.typescriptlang.org/play?#code/PTAElR9RTRUADlCo5QQ80AQJhfxUA6mhvH0NHqAoAlgOwBcBTAJwDMBDAY2NAGEB7fAZ0NIFdrCAeegG0osWAGlABBUgHMWoYgA8S+ACazK+AJ4BtALqgAvKHXadAPlABvbKFD5iAd1AAKAHRvK0lgC4JngJQ+AkIsANzYAL7YeERkVLSgAJJMRKSM-PxkltagwABUuaCA4gqAfdGA89awgOXGgGxKgBZqgL8JgKP6gN4ZgHnagA3OoAS4hKCAnaaAqzagucDZXYROAaAAboy4ymGR2CCggAdqgFxy6ICjEYAOmTWAIW6ghB5SxD2ApcaAbKZ7gPRm6HtIaIAw-4ACRoCncoCb8YAziYCIRoA3coAKaVVDsdTqA9lg1gxmGxONweElmOw0hlSOZAM7KgHvlbDUaE9ZJI9KZQw8AAqckUxBUsgRKWRZFMTmyR2kp0CuNhvBJpmwk2SMK4nPMAB9prNlAZzBZwmElmBAFTm7US+NShNIoEAWPKAUqNAJipstA2sA99GAQ-lAPYGPlAAAVUgAHMiEDSgADkY0dnVkAFtcMICFJOvhDhpbU6AKosMjKumkV0AIw4PVIxAAjhxcAnxQQA0HHTSCSjHS5CNgAAIR1XYwTCUCh8OIlUoyyLZbtQBhckra5HQIBYOS1upL7bL1ArsmrpAATKX67h3daMu7KYRqRPMlYbGMJg2IkAÏÏ)

自此我们已经实现了一个类型安全的类装饰器，我们可以放心的使用这个类装饰器，而不用担心不小心把这个装饰器应用在了一些不合适的类上面，`TypeScript` 在编译时就会为我们做一次类型检查。

### 方法装饰器

接下来我们希望有一个 `@Initialed` 装饰器，它作用在实现了 `IController` 的类的方法上面，`@Initialed` 会确保方法被调用时一定执行了 `IController.init` 方法。

方法装饰器的签名是:

```typescript
declare type MethodDecorator = <T>(
  target: Object,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<T>
) => TypedPropertyDescriptor<T> | void;
```

这里的 `target` 接收的是类的 `prototype`，在 `typescript` 中一个类的 `prototype` 的类型和这个类的实例类型是一样的，即:

```typescript
class Person {
  walk() {}
}

const person = new Person();

// true
type IsSame = typeof person extends typeof Person.prototype ? true : false;
```

所以这里我们限制 `target` 为 `IController` 即可

e.g:

```typescript
// 引入一个构造函数类型
interface Construct<Class, Args extends any[] = any[]> {
  new (...args: Args): Class;
}

interface IController {
  /** 假设每个控制器都必须实现 init 方法 */
  init(): void;
}

const Initialed = (
  target: IController,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<(...args: any[]) => any>
) => {
  /** 判断有没有执行 init 如果没有则执行一遍，这里就不写具体实现了 */
};

class UserController {
  // 这里会报错
  // Property 'init' is missing in type 'UserController' but required in type 'IController'.
  @Initialed
  login(name: string) {}
}

// 实现了 IController 不会报错
class User2Controller implements IController {
  init() {}

  // 这里不会报错
  @Initialed
  login() {}
}
```

[点击这里在线预览示例](https://www.typescriptlang.org/play?ssl=34&ssc=2&pln=1&pc=1#code/PTAElR9RTRUADlCo5QQ80AQJhfxUA6mhvH0NHqAoAlgOwBcBTAJwDMBDAY2NAGEB7fAZ0NIFdrCAeegG0osWAGlABBUgHMWoYgA8S+ACazK+AJ4BtALqgAvKHXadAPlABvbKFD5iAdwAUAOleVpLAFwSPASm8CQiwA3NgAvtjYIBAwCCgYOAQkFDR0TKzsXLyBwmKSMnKKxCpqmroGRmVmlta2Di5uHt75LP4MgsKhEXhEZFS0oACS6eyM-PxkNTbAAFQzoIDiCoB90YDz1rCA5caAbEqAFmqAvwmAo-qA3hmAedqADc6gBLiEoICdpoCrNqAzwLWXhI5tAG6MuMpdkdjUZhsIb4K64SgTZQVRyEdxSYiEbzDZijcZkMQAB1IjAxZEIGgA0sQNN42KQCFJQAAfUAsDQAWwARmMxMpiCxqOSMYRGKRvAAVDS45QABWxuNI+IAIuzObhubyeA1nHCvJUTL4DOZjKZNfpzBZQLN5oASJUAtaaASHNAIU2FsA5kaAGQiLqDroAgzUAOeY2wCYSg7oIBZBMeYG6AI6sgAqiwyCNsWjSFMjWBAJvxgBnEwBY8oBSo0AmKm1aJinF4jSgADkr0LF1k9NwwgpTtA+NxRfDkZR0YmpFLjI411IxAAjhxcN2oQRa0K6IXkUQW2RC85agABQbO8GQ2r8RhSAiOfCUenEUnsCmaw0RbrRM6AMLkhlGxq3QIBYOXTWeoIdAjdIACZrzGLvSMRNd0QsgTqit5WDYrzvJYoDdNMiZJg+mbzouYIQsQyiruum5HtB4T-NgQA)

再进一步我们还可以限制类方法的参数类型，例如我们有一个 `@InjectUser` 装饰器，我们会自动将用户信息注入到该方法的第一个参数中，所以我们要限制方法的第一个参数是 `IUser` 类型，要实现这个功能，我们只要限制方法装饰器中 `descriptor` 的类型即可。

e.g:

```typescript
// 引入一个构造函数类型
interface Construct<Class, Args extends any[] = any[]> {
  new (...args: Args): Class;
}

interface IController {
  /** 假设每个控制器都必须实现 init 方法 */
  init(): void;
}

interface IUser {
  name: string;
  permission: string;
}

const InjectUser = (
  target: Object,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<(user: IUser, ...args: any[]) => any>
) => {
  /** 判断有没有执行 init 如果没有则执行一遍 */
};

class User2Controller implements IController {
  init() {}

  // 不会报错
  @InjectUser
  updateUserName(user: IUser, newName: string) {}

  // 会报错
  @InjectUser
  getUserName() {}
}
```

[点击这里在线预览示例](https://www.typescriptlang.org/play?#code/PTAElR9RTRUADlCo5QQ80AQJhfxUA6mhvH0NHqAoAlgOwBcBTAJwDMBDAY2NAGEB7fAZ0NIFdrCAeegG0osWAGlABBUgHMWoYgA8S+ACazK+AJ4BtALqgAvKHXadAPlABvbKFD5iAdwAUAOleVpLAFwSPASm8CQiwA3NgAvth4RGRUtKAAkkxEpIz8-GSW1qDAAFQ5oIDiCoB90YDz1rCA5caAbEqAFmqAvwmAo-qA3hmAedqADc6gBLiEoICdpoCrNqA5wFmdhI7+oABujLjKoRFRJBQ0dPEAqiwZVjb4lAC2xN5spARSoTYADmR7uMK4zEfsp-OR2NTMbAn4AFbE3BsZQyOQjuKTEQjeADyACNftwxBcUldSIQNABpYgaR4nfBSUAAH1ALA0e2hqTEymILGoJwuhEYpG8ABUNFdlAAFJFkVEAESpNNwdIZPEcHE2jISANIYlczlBXiMml0vgM5mMphV+nMFmyeVAgBIlQC1poBIc0AhTbGwDmRoAZCI6+C6oEAQZqAHPNzYBMJWt0EAsgmDMALN6CYSgKUAJiS7FS6VIHT2F3SByIskSzHDaS2IztYxVOoWNhAoEAsHKALHlAKVGgExUrIAAXiPz+hClWQ4F2UlBIUoAcvtiKLxd51uKxHZ7B2DtjTlnQDnsmAS+WbFWa-9xVkwXXxcOu1nIjYImEgA)

### 属性装饰器

上面的 `InjectUser` 是将 `user` 作为一个参数注入到方法中，也可以采用其他的方式，例如将 `user` 注入到一个类实例属性上面，这就要用到属性装饰器。

属性装饰器的签名是:

```typescript
declare type PropertyDecorator = (
  target: Object,
  propertyKey: string | symbol
) => void;
```

其中 `target` 接收的是 `prototype`， `propertyKey` 接收的是属性名，这个例子稍微复杂一点。

e.g:

```typescript
// 引入一个构造函数类型
interface Construct<Class, Args extends any[] = any[]> {
  new (...args: Args): Class;
}

interface IController {
  /** 假设每个控制器都必须实现 init 方法 */
  init(): void;
}

interface IUser {
  name: string;
  permission: string;
}

const InjectUser = <T, K>(
  target: T,
  propertyKey: K
): K extends keyof T ? (T[K] extends IUser ? void : unknown) : unknown => {
  return null as any;
};

class User2Controller implements IController {
  // 不会报错
  @InjectUser
  user!: IUser;

  // 会报错
  @InjectUser
  user2!: number;

  init() {}
}
```

[点击在线预览示例](https://www.typescriptlang.org/play?ssl=33&ssc=2&pln=1&pc=1#code/PTAElR9RTRUADlCo5QQ80AQJhfxUA6mhvH0NHqAoAlgOwBcBTAJwDMBDAY2NAGEB7fAZ0NIFdrCAeegG0osWAGlABBUgHMWoYgA8S+ACazK+AJ4BtALqgAvKHXadAPlABvbKFD5iAdwAUAOleVpLAFwSPASm8CQiwA3NgAvth4RGRUtKAAkkxEpIz8-GSW1qDAAFQ5oIDiCoB90YDz1rCA5caAbEqAFmqAvwmAo-qA3hmAedqADc6gBLiEoICdpoCrNqA5wFmdhI7+oABujLjKoRFRJBQ0dPEAqiwZVjb4lAC2xN5spARSoTYADmR7uMK4zEfsp-OR2NTMbAn4AFbE3BsZQw8AAqYgA0qZHIR3FJiIRvKDQBcUldSIQNGDiBpvGD-FkwXJFMQVLIANZYxjkUDArIAfmpWjBegUSlUCQBpFA9Oms1A3g4+FJ+EY9nwfNAAqFIrF+nM21ApDhHFIYvwHDSRjUmhekWogmEoA5ACYkuxUulObg9hd0gciLJEswzWktlkQKBALBygCx5QClRoBMVKyAAF4j8-oQOVkOJtSABCbzraOhN1gX0BmzB0P-aOR6NGuO2Dh7ABGZHOHXwXXGllAETCQA)

用于类静态方法和属性的装饰器，可以通过上面的例子稍加修改即可，这里不再赘述。

> 上述设计的例子仅为了方便演示，不用深究其设计的合理性
>
> 本文作者水平有限，若有理解欠缺或偏差之处，望不吝赐教。
