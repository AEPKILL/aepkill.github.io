---
title: react-native应用架构思考
date: 2021-05-19 19:34:09
categories: react-native
tags: [react-native]
description: 记录在开发公司一个 app 时的一些思考和解决方案
---

最近在公司开发一款 `APP`，主要功能包含即时通讯和一些业务模块，技术选型用的是 `react-native`，做这个选型主要是因为公司的人手比较少而且大部分都是前端， `react-native` 开发效率相对较高，前端开发的同事上手也比较简单。

在这个 `APP` 里面的业务功能都比较独立，而且业务不太稳定，所以做成小程序的方式是比较适合的。

所以这里记录一下我在开发过程中的一些思考和解决方案，一点拙见，希望可以抛砖引玉
