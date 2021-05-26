---
title: 封装 react-native 原生模块
date: 2021-05-26 19:34:09
categories: react-native
tags: [react-native]
description: 本文介绍如何封装一个 react-native 原生模块
---

大部分时间使用 `react-native` 官方和社区提供的组件和模块就可以完成一个 `app` 的开发，极少数时候也需要自己封装一些原生模块。

## 创建一个原生模块

从零开始搭建一个原生组件开发测试环境还是比较麻烦的，好在社区提供了很多脚手架工具，这里我选用的是 [create-react-native-library](https://github.com/callstack/react-native-builder-bob)

要创建一个原生模块只需要执行:

```shell
npx create-react-native-library react-native-geetest
```

> 因为这里是需要对 极验 进行封装，所有就取名为 `react-native-geetest`

随后 `create-react-native-library` 会让你填写一些信息，按说明填写即可，完成后 `create-react-native-library` 会为你生成一个原生模块的模板项目。

## 目录结构

`create-react-native-library` 生成的的目录结构主要包含以下文件夹

```shell
.
...
├── android
├── example
├── ios
├── react-native-geetest.podspec
├── src
...
```

其中:

- `android` 目录存放安卓端代码的地方
- `ios` 目录存放 `iOS` 端代码
- `example` 是一个示例项目，可以通过它来开发调试当前模块的代码
- `src` 目录存放二次封装原生模块或者导出原生模的代码
- `react-native-geetest.podspec` 是 Pod 库的描述文件，`react-native` 在 `iOS` 端使用 `pod` 管理原生依赖，这个文件类似于 `npm` 的 `package.json`

## 安装依赖

进入 `react-native-geetest` 执行 `npm i` 为主工程安装依赖

进入 `react-native-geetest/example` 下为示例工程安装依赖

进入 `react-native-geetest/example/ios` 执行 `pod install` 安装 `iOS` 



## 封装安卓端代码

我们可以用 `Android Studio` 打开 `react-native-geetest/example/android` 目录

> 整个 `example` 其实就是一个 `react-native` 项目，而且已经集成了 `react-native-geetest` —— 现在还只有脚手架为我们生成的一些模板代码

然后执行一次 `gradle` 同步，完成后我们可以看到有有两个项目

![android-tow-projects](/Users/aepkill/personal/aepkill.github.io/writing/2021/封装react-native原生模块/assets/android-tow-projects.png)



`reactnativegeetest` 是进行封装模块的项目

`GeetestExample` 是示例项目



## 封装 iOS 端代码





## 导出原生模块



> 参考资料
>
> - [Native Modules Intro](https://reactnative.dev/docs/native-modules-intro)
>
> 本文作者水平有限，若有理解欠缺与偏差之处，望不吝赐教。