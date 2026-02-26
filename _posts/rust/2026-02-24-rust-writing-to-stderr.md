---
title: Rust 将错误信息输出到标准错误而不是标准输出
categories: [Rust, 进阶]
tags: [rust]
---

## 概述

在命令行程序中,正确区分**标准输出 (stdout)** 和**标准错误 (stderr)** 是一种重要的最佳实践:

- **标准输出 (stdout)**: 用于程序的正常输出信息
- **标准错误 (stderr)**: 用于错误信息和诊断信息

这种区分允许用户将程序的正常输出重定向到文件中,同时仍然能在屏幕上看到错误信息。本文将介绍如何在 Rust 中正确地将错误信息写入标准错误流。

## 文件描述符与管道

在 Linux/Unix 系统中,每个进程都有三条标准"管道",分别用数字编号:

| 编号 | 名称 | 说明 | 对应 Rust 宏 |
|---|---|---|---|
| **0** | stdin（标准输入） | 读取用户输入 | `std::io::stdin()` |
| **1** | stdout（标准输出） | 正常输出信息 | `println!` |
| **2** | stderr（标准错误） | 错误/诊断信息 | `eprintln!` |

`println!` 和 `eprintln!` 在**不重定向**时看起来完全一样,都显示在屏幕上。区别只在重定向时才体现。

## Shell 重定向语法

Shell 可以独立控制这两条管道的输出目标:

### `>` 只重定向 stdout（默认为 1 号管道）

`>` 是 `1>` 的简写,不写数字默认就是操作 1 号管道:

```bash
$ cargo run > output.txt
# 等价于
$ cargo run 1> output.txt
```

```
程序
 ├── stdout (1) ──→ 📄 output.txt   # println! 写入文件
 └── stderr (2) ──→ 🖥️  屏幕        # eprintln! 仍显示在屏幕
```

### `2>` 只重定向 stderr（2 号管道）

```bash
$ cargo run 2> error.txt
```

```
程序
 ├── stdout (1) ──→ 🖥️  屏幕        # println! 仍显示在屏幕
 └── stderr (2) ──→ 📄 error.txt   # eprintln! 写入文件
```

### `> file 2>&1` 将两者合并到同一个文件

`2>&1` 的意思是"把 2 号管道合并到 1 号管道":

```bash
$ cargo run > output.txt 2>&1
```

```
程序
 ├── stdout (1) ──→ 📄 output.txt
 └── stderr (2) ──┘  # 合并到 1 号,一起写入文件
```

### `> out.txt 2> err.txt` 分别写入不同文件

```bash
$ cargo run > out.txt 2> err.txt
```

```
程序
 ├── stdout (1) ──→ 📄 out.txt    # 正常输出单独保存
 └── stderr (2) ──→ 📄 err.txt   # 错误信息单独保存
```

### 重定向符号速查表

| 写法 | 完整写法 | 操作对象 |
|---|---|---|
| `>` | `1>` | stdout 覆盖写入 |
| `2>` | `2>` | stderr 覆盖写入 |
| `>>` | `1>>` | stdout 追加写入（不覆盖） |
| `2>>` | `2>>` | stderr 追加写入（不覆盖） |
| `2>&1` | `2>&1` | 将 stderr 合并到 stdout |

<!--more-->

## 问题:所有输出都写入标准输出

### 现象分析

在默认情况下,`println!` 宏只能打印到**标准输出**。如果我们的错误信息也使用 `println!` 输出,那么当用户将标准输出重定向到文件时,错误信息也会被一并写入文件,而不是显示在屏幕上。

### 复现问题

通过将标准输出重定向到文件,同时故意触发一个错误,可以观察到这个问题:

```bash
$ cargo run > output.txt
```

`>` 语法告诉 shell 将标准输出的内容写入到 `output.txt` 文件中而不是屏幕上。由于没有传递任何参数,程序会产生一个错误。

此时我们并没有在屏幕上看到任何错误信息,查看 `output.txt` 文件会发现:

```
Problem parsing arguments: not enough arguments
```

**问题所在**: 错误信息被错误地打印到了标准输出中,并随之写入了文件。命令行程序应当将错误信息发送到标准错误流,这样即便标准输出被重定向到文件,错误信息仍然能显示在屏幕上。

---

## 解决方案:使用 eprintln! 宏

### eprintln! 宏

标准库提供了 `eprintln!` 宏专门用于打印到标准错误流。其用法与 `println!` 完全相同,只是输出目标不同:

| 宏 | 输出目标 | 适用场景 |
|---|---|---|
| `println!` | 标准输出 (stdout) | 程序正常输出 |
| `eprintln!` | 标准错误 (stderr) | 错误信息、诊断信息 |

### 修改代码

将 `main` 函数中所有打印错误信息的 `println!` 替换为 `eprintln!`:

**文件名: src/main.rs**

```rust
fn main() {
    let args: Vec<String> = env::args().collect();

    let config = Config::new(&args).unwrap_or_else(|err| {
        eprintln!("Problem parsing arguments: {}", err);
        process::exit(1);
    });

    if let Err(e) = minigrep::run(config) {
        eprintln!("Application error: {}", e);

        process::exit(1);
    }
}
```

得益于之前的重构,所有打印错误信息的代码都集中在 `main` 函数中,因此修改起来非常方便。

---

## 验证修改效果

### 场景一:触发错误时

不传递任何参数,并将标准输出重定向到文件:

```bash
$ cargo run > output.txt
Problem parsing arguments: not enough arguments
```

**结果**:
- ✅ 错误信息正确显示在屏幕上(通过标准错误输出)
- ✅ `output.txt` 文件为空,没有被写入任何错误信息

### 场景二:正常运行时

传递正确的参数,并将标准输出重定向到文件:

```bash
$ cargo run to poem.txt > output.txt
```

**结果**:
- ✅ 终端不显示任何输出
- ✅ 查看 `output.txt`,其中包含正确的搜索结果:

**文件名: output.txt**

```
Are you nobody, too?
How dreary to be somebody!
```

---

## 总结

通过将错误处理中的 `println!` 替换为 `eprintln!`,我们实现了:

1. **符合命令行程序规范**: 错误信息输出到标准错误,正常输出到标准输出
2. **更好的用户体验**: 用户可以自由重定向标准输出而不会丢失错误信息
3. **便于脚本集成**: 下游脚本可以独立捕获标准输出和标准错误

这是编写命令行工具时应当遵守的基本约定。

---

## 参考资料

- [The Rust Programming Language - Writing Error Messages to Standard Error Instead of Standard Output](https://doc.rust-lang.org/book/ch12-06-writing-to-stderr-instead-of-stdout.html)
- [std::eprintln! macro](https://doc.rust-lang.org/std/macro.eprintln.html)

---
