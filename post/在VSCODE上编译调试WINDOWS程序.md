---
title: 在 vscode 中编译调试 c++ 代码
date: 2017-12-14
categories: 编程工具
tags: [C++ , VSCode]
description: 一个关于在 windows 上使用 vscode 做 c++ 开发的笔记

---

长期以来我一直是在 Visual Studio 上写 C++ 和 C# 代码，VSCode 我一般用来写一下前端相关的代码。

最近在看一些 C++ 和 C# 的书籍，发现做书上的一些例子或者随手想写点代码来验证一些自己想法时用 Visual Studio 实在不是特别方便，主要原因是因为启动 Visual Studio 比较慢，还有新建项目与启动调试也有些迟钝，毕竟 Visual Studio 是一个重量级的 IDE ， 用来写一些小 Demo 实在是有些大材小用了。

于是我想到了 VSCode 。

VSCode 来写 C# 代码的话不用什么配置，只需要 `dotnet new console` 即可新建一个完整的 `.Net Core` 控制台项目(非控制台项目也大同小异)，然后用 VSCode 打开这个项目的根目录，VSCode 会自动下载一些依赖，基本而言都可以一键完成，不用什么配置，十分方便。

但是 C++ 的话，VSCode 就没那么智能了，需要手动编写 `task.json` 与 `launch.json`。

首先要在 `task.json` 中创建编译任务，因为我使用的是微软的 `VS2017` 提供的命令行工具 `cl` 来进行编译，在编译前还需要设置一些环境变量和依赖等等，所以不是一行命令可以完成的，于是我创建了一个 `build.bat` 批处理脚本进行编译。

所有配置文件如下:

```bash
# filename:build.bat

# 记录当前目录
set current=%cd%
# 使用 VS2017 提供的一个批处理设置环境变量和依赖
call "D:\Program Files (x86)\Microsoft Visual Studio\2017\Enterprise\Common7\Tools\VsDevCmd.bat";
# 回到当前目录
cd /D %current%
# 编译文件
cl main.cpp  /Zi /Fe:debug/main /Fd:debug/main /Fo:debug/main 
```

```json
// filename: task.json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "debug",
      "type": "shell",
      "command": "./build.bat"
    }
  ]
}
```

```json
// filename: launch.json
{
  // Use IntelliSense to learn about possible attributes.
  // Hover to view descriptions of existing attributes.
  // For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387
  "version": "0.2.0",
  "configurations": [
    {
      "name": "debug",
      "type": "cppvsdbg",
      "request": "launch",
      "program": "${workspaceFolder}/debug/main.exe",
      "preLaunchTask": "debug",
      "args": [],
      "stopAtEntry": false,
      "cwd": "${workspaceFolder}",
      "environment": [],
      "externalConsole": true
    }
  ]
}
```

进行完配置就基本和 `Visual Studio` 中写 C++ 差不多了。

![预览](https://raw.githubusercontent.com/AepKill/aepkill.github.io/master/img/c%2B%2B-with-vscode/preview.png)

调试:

![调试](https://raw.githubusercontent.com/AepKill/aepkill.github.io/master/img/c%2B%2B-with-vscode/debug.png)

运行结果:

![运行结果](https://raw.githubusercontent.com/AepKill/aepkill.github.io/master/img/c%2B%2B-with-vscode/result.png)



> 本文作者水平有限，可能有理解欠缺或偏差之处，若有不当之处，望不吝赐教。
>
> 参考资料:
>
> [vscode in cpp](https://www.youtube.com/watch?v=Ok4p1XgZGEY)
>
> [Compiler Command-Line Syntax](https://msdn.microsoft.com/zh-cn/library/610ecb4h.aspx)