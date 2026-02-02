---
title: rust 错误处理 - panic! 与不可恢复的错误
tags: [rust]
---

## 概述

在 Rust 中，当代码出现无法处理的错误时，可以使用 `panic!` 宏。执行这个宏时，程序会：
1. 打印错误信息
2. 展开并清理栈数据
3. 退出程序

这通常用于检测到某些类型的 bug，而程序员不清楚该如何处理的情况。

<!--more-->

## panic 时的栈展开与终止

### 默认行为：展开（Unwinding）

当出现 panic 时，程序默认会开始**展开（unwinding）**，这意味着：
- Rust 会回溯栈
- 清理它遇到的每一个函数的数据
- 这个回溯和清理过程需要做很多工作

### 替代方案：直接终止（Abort）

另一种选择是**直接终止（abort）**：
- 不清理数据就退出程序
- 程序使用的内存由操作系统来清理
- 可以让最终二进制文件更小

### 配置 panic 行为

在 `Cargo.toml` 的 `[profile]` 部分配置：

```toml
[profile.release]
panic = 'abort'
```

这样在 release 模式中 panic 时会直接终止，而不是展开。

## 基本使用示例

### 示例 1：直接调用 panic!

**文件名：src/main.rs**

```rust
fn main() {
    panic!("crash and burn");
}
```

**运行输出：**

```bash
$ cargo run
   Compiling panic v0.1.0 (file:///projects/panic)
    Finished dev [unoptimized + debuginfo] target(s) in 0.25s
     Running `target/debug/panic`
thread 'main' panicked at 'crash and burn', src/main.rs:2:5
note: Run with `RUST_BACKTRACE=1` for a backtrace.
```

**输出说明：**
- 最后两行包含 `panic!` 调用造成的错误信息
- `src/main.rs:2:5` 表明这是 `src/main.rs` 文件的第 2 行第 5 个字符
- 这是我们代码中直接调用 `panic!` 宏的位置

### 示例 2：库代码中的 panic

在其他情况下，`panic!` 可能出现在我们代码所调用的代码中。错误信息报告的文件名和行号可能指向别人代码中的 `panic!` 宏调用，而不是我们代码中最终导致 `panic!` 的那一行。这时我们需要使用 backtrace 来寻找代码中出问题的地方。

## 使用 backtrace 定位问题

### 示例：数组越界访问

**文件名：src/main.rs**

```rust
fn main() {
    let v = vec![1, 2, 3];
    v[99];  // 尝试访问不存在的索引
}
```

**问题分析：**
- 这里尝试访问 vector 的第 100 个元素（索引 99）
- 但 vector 只有 3 个元素
- Rust 会 panic 而不是返回无效数据

### 为什么 Rust 要 panic？

在 C 这样的语言中，会尝试直接提供所要求的值，即便这可能不是你期望的：
- 你会得到对应内存位置的值
- 即使这些内存并不属于 vector
- 这被称为**缓冲区溢出（buffer overread）**
- 可能导致安全漏洞

**Rust 的做法：**
为了使程序远离这类漏洞，如果尝试读取一个索引不存在的元素，Rust 会停止执行并拒绝继续。

### 运行输出

```bash
$ cargo run
   Compiling panic v0.1.0 (file:///projects/panic)
    Finished dev [unoptimized + debuginfo] target(s) in 0.27s
     Running `target/debug/panic`
thread 'main' panicked at 'index out of bounds: the len is 3 but the index is 99', libcore/slice/mod.rs:2448:10
note: Run with `RUST_BACKTRACE=1` for a backtrace.
```

**注意：**
- 错误指向了 `libcore/slice/mod.rs`，这不是我们编写的文件
- 这是 Rust 源码中 slice 的实现
- 这是真正出现 `panic!` 的地方

## 使用 RUST_BACKTRACE 环境变量

### 什么是 backtrace？

backtrace 是一个执行到目前位置所有被调用的函数的列表。

### 如何阅读 backtrace？

阅读 backtrace 的关键：
1. **从头开始读**，直到发现你编写的文件
2. **这就是问题的发源地**
3. 这一行**往上**是你的代码所调用的代码
4. 这一行**往下**是调用你的代码的代码
5. 这些行可能包含核心 Rust 代码、标准库代码或用到的 crate 代码

### 获取 backtrace

将 `RUST_BACKTRACE` 环境变量设置为任何不是 0 的值：

```bash
$ RUST_BACKTRACE=1 cargo run
    Finished dev [unoptimized + debuginfo] target(s) in 0.00s
     Running `target/debug/panic`
thread 'main' panicked at 'index out of bounds: the len is 3 but the index is 99', libcore/slice/mod.rs:2448:10
stack backtrace:
   0: std::sys::unix::backtrace::tracing::imp::unwind_backtrace
             at libstd/sys/unix/backtrace/tracing/gcc_s.rs:49
   1: std::sys_common::backtrace::print
             at libstd/sys_common/backtrace.rs:71
             at libstd/sys_common/backtrace.rs:59
   2: std::panicking::default_hook::{{closure}}
             at libstd/panicking.rs:211
   3: std::panicking::default_hook
             at libstd/panicking.rs:227
   4: <std::panicking::begin_panic::PanicPayload<A> as core::panic::BoxMeUp>::get
             at libstd/panicking.rs:476
   5: std::panicking::continue_panic_fmt
             at libstd/panicking.rs:390
   6: std::panicking::try::do_call
             at libstd/panicking.rs:325
   7: core::ptr::drop_in_place
             at libcore/panicking.rs:77
   8: core::ptr::drop_in_place
             at libcore/panicking.rs:59
   9: <usize as core::slice::SliceIndex<[T]>>::index
             at libcore/slice/mod.rs:2448
  10: core::slice::<impl core::ops::index::Index<I> for [T]>::index
             at libcore/slice/mod.rs:2316
  11: <alloc::vec::Vec<T> as core::ops::index::Index<I>>::index
             at liballoc/vec.rs:1653
  12: panic::main
             at src/main.rs:4
  13: std::rt::lang_start::{{closure}}
             at libstd/rt.rs:74
  14: std::panicking::try::do_call
             at libstd/rt.rs:59
             at libstd/panicking.rs:310
  15: macho_symbol_search
             at libpanic_unwind/lib.rs:102
  16: std::alloc::default_alloc_error_hook
             at libstd/panicking.rs:289
             at libstd/panic.rs:392
             at libstd/rt.rs:58
  17: std::rt::lang_start
             at libstd/rt.rs:74
  18: panic::main
```

### 重要提示

1. **输出差异**：实际看到的输出可能因不同的操作系统和 Rust 版本而有所不同
2. **debug 标识**：为了获取带有这些信息的 backtrace，必须启用 debug 标识
3. **默认启用**：当不使用 `--release` 参数运行 `cargo build` 或 `cargo run` 时，debug 标识会默认启用

### 定位问题代码

在上面的输出中，backtrace 的第 12 行指向了我们项目中造成问题的行：
```
12: panic::main
       at src/main.rs:4
```

**调试步骤：**
1. 如果你不希望程序 panic，第一个提到我们编写的代码行的位置是你应该开始调查的
2. 查明是什么值如何在这个地方引起了 panic
3. 在上面的例子中，修复方法就是不要尝试在一个只包含三个项的 vector 中请求索引是 100 的元素

## 调试建议

当将来你的代码出现了 panic 时，你需要搞清楚：
1. 在这特定的场景下代码中执行了什么操作
2. 什么值导致了 panic
3. 应当如何处理才能避免这个问题

## 下一步

本章后面的小节 "panic! 还是不 panic!" 会再次回到 `panic!` 并讲解：
- 何时应该使用 `panic!` 来处理错误情况
- 何时不应该使用 `panic!`
- 如何使用 `Result` 来从错误中恢复

---

## Result 与可恢复的错误

大部分错误并没有严重到需要程序完全停止执行。有时，一个函数会因为一个容易理解并做出反应的原因失败。例如，如果因为打开一个并不存在的文件而失败，此时我们可能想要创建这个文件，而不是终止进程。

### Result 枚举

回忆一下第二章中的 `Result` 枚举，它定义有如下两个成员：

```rust
enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

**类型参数说明：**
- `T` 代表成功时返回的 `Ok` 成员中的数据的类型
- `E` 代表失败时返回的 `Err` 成员中的错误的类型
- 因为 `Result` 有这些泛型类型参数，我们可以将它用于很多不同的场景

### 基本使用：打开文件

**文件名：src/main.rs**

```rust
use std::fs::File;

fn main() {
    let f = File::open("hello.txt");
}
```

**如何知道返回类型？**

我们可以查看标准库 API 文档，或者直接问编译器！给 `f` 一个错误的类型注解：

```rust
let f: u32 = File::open("hello.txt");
```

**编译器输出：**

```
error[E0308]: mismatched types
 --> src/main.rs:4:18
  |
4 |     let f: u32 = File::open("hello.txt");
  |                  ^^^^^^^^^^^^^^^^^^^^^^^ expected u32, found enum
  `std::result::Result`
  |
  = note: expected type `u32`
             found type `std::result::Result<std::fs::File, std::io::Error>`
```

这告诉我们 `File::open` 函数的返回值类型是 `Result<std::fs::File, std::io::Error>`。

### 使用 match 处理 Result

**文件名：src/main.rs**

```rust
use std::fs::File;

fn main() {
    let f = File::open("hello.txt");

    let f = match f {
        Ok(file) => file,
        Err(error) => {
            panic!("Problem opening the file: {:?}", error)
        },
    };
}
```

**说明：**
- 与 `Option` 枚举一样，`Result` 枚举和其成员也被导入到了 prelude 中
- 当结果是 `Ok` 时，返回 `Ok` 成员中的 `file` 值
- 当结果是 `Err` 时，调用 `panic!` 宏

### 匹配不同的错误类型

我们可能希望对不同的错误原因采取不同的行为：

**文件名：src/main.rs**

```rust
use std::fs::File;
use std::io::ErrorKind;

fn main() {
    let f = File::open("hello.txt");

    let f = match f {
        Ok(file) => file,
        Err(error) => match error.kind() {
            ErrorKind::NotFound => match File::create("hello.txt") {
                Ok(fc) => fc,
                Err(e) => panic!("Problem creating the file: {:?}", e),
            },
            other_error => panic!("Problem opening the file: {:?}", other_error),
        },
    };
}
```

**代码解析：**
- `error.kind()` 返回 `io::ErrorKind` 枚举值
- `ErrorKind::NotFound` 表示文件不存在
- 如果文件不存在，尝试创建文件
- 其他错误则直接 panic

**使用闭包的简化写法：**

```rust
use std::fs::File;
use std::io::ErrorKind;

fn main() {
    let f = File::open("hello.txt").unwrap_or_else(|error| {
        if error.kind() == ErrorKind::NotFound {
            File::create("hello.txt").unwrap_or_else(|error| {
                panic!("Problem creating the file: {:?}", error);
            })
        } else {
            panic!("Problem opening the file: {:?}", error);
        }
    });
}
```

这段代码与上面的 `match` 表达式行为相同，但更容易阅读。

## 失败时 panic 的简写

### unwrap 方法

`unwrap` 是 `Result<T, E>` 类型的一个辅助方法：
- 如果 `Result` 值是 `Ok`，`unwrap` 会返回 `Ok` 中的值
- 如果 `Result` 是 `Err`，`unwrap` 会调用 `panic!`

**示例：**

```rust
use std::fs::File;

fn main() {
    let f = File::open("hello.txt").unwrap();
}
```

**如果文件不存在，输出：**

```
thread 'main' panicked at 'called `Result::unwrap()` on an `Err` value: Error {
repr: Os { code: 2, message: "No such file or directory" } }',
src/libcore/result.rs:906:4
```

### expect 方法

`expect` 与 `unwrap` 类似，但允许我们选择 `panic!` 的错误信息：

**示例：**

```rust
use std::fs::File;

fn main() {
    let f = File::open("hello.txt").expect("Failed to open hello.txt");
}
```

**如果文件不存在，输出：**

```
thread 'main' panicked at 'Failed to open hello.txt: Error { repr: Os { code:
2, message: "No such file or directory" } }', src/libcore/result.rs:906:4
```

**优势：**
- 错误信息以我们指定的文本开始
- 更容易找到代码中的错误来源
- 如果在多处使用 `unwrap`，很难分析到底是哪一个 `unwrap` 造成了 panic

## 传播错误

当编写一个其实现会调用一些可能会失败的操作的函数时，除了在这个函数中处理错误外，还可以选择让调用者知道这个错误并决定该如何处理。这被称为**传播（propagating）错误**。

### 使用 match 传播错误

**文件名：src/main.rs**

```rust
use std::io;
use std::io::Read;
use std::fs::File;

fn read_username_from_file() -> Result<String, io::Error> {
    let f = File::open("hello.txt");

    let mut f = match f {
        Ok(file) => file,
        Err(e) => return Err(e),
    };

    let mut s = String::new();

    match f.read_to_string(&mut s) {
        Ok(_) => Ok(s),
        Err(e) => Err(e),
    }
}
```

**函数分析：**

1. **返回值类型**：`Result<String, io::Error>`
   - 成功时返回 `Ok(String)` - 从文件中读取到的用户名
   - 失败时返回 `Err(io::Error)` - 包含错误信息

2. **错误处理流程**：
   - `File::open` 失败时，提早返回错误值
   - `read_to_string` 失败时，返回错误值
   - 两个操作都成功时，返回包含用户名的 `Ok(s)`

3. **为什么要传播错误？**
   - 调用者可能拥有更多信息或逻辑来决定如何处理错误
   - 比起在函数内部处理，传播错误提供了更好的灵活性

### 传播错误的简写：? 运算符

`?` 运算符使错误传播更加简洁：

**文件名：src/main.rs**

```rust
use std::io;
use std::io::Read;
use std::fs::File;

fn read_username_from_file() -> Result<String, io::Error> {
    let mut f = File::open("hello.txt")?;
    let mut s = String::new();
    f.read_to_string(&mut s)?;
    Ok(s)
}
```

**? 运算符的工作方式：**
- 如果 `Result` 的值是 `Ok`，`Ok` 中的值会被返回，程序继续执行
- 如果值是 `Err`，`Err` 中的值将作为整个函数的返回值，就像使用了 `return` 关键字

**与 match 的区别：**
- `?` 运算符会调用 `from` 函数（定义于 `From` trait）
- 将错误从一种类型转换为另一种类型
- 自动处理错误类型转换

### 链式方法调用

我们可以在 `?` 之后直接使用链式方法调用：

**文件名：src/main.rs**

```rust
use std::io;
use std::io::Read;
use std::fs::File;

fn read_username_from_file() -> Result<String, io::Error> {
    let mut s = String::new();
    File::open("hello.txt")?.read_to_string(&mut s)?;
    Ok(s)
}
```

### 更短的写法

Rust 提供了 `fs::read_to_string` 函数来简化这个常见操作：

**文件名：src/main.rs**

```rust
use std::io;
use std::fs;

fn read_username_from_file() -> Result<String, io::Error> {
    fs::read_to_string("hello.txt")
}
```

这个函数会：
1. 打开文件
2. 新建一个 `String`
3. 读取文件的内容
4. 将内容放入 `String`
5. 返回它

## ? 运算符的使用限制

### 只能用于返回 Result 的函数

`?` 运算符只能被用于返回值类型为 `Result` 的函数。

**错误示例：**

```rust
use std::fs::File;

fn main() {
    let f = File::open("hello.txt")?;  // 编译错误！
}
```

**编译器错误：**

```
error[E0277]: the `?` operator can only be used in a function that returns
`Result` or `Option` (or another type that implements `std::ops::Try`)
 --> src/main.rs:4:13
  |
4 |     let f = File::open("hello.txt")?;
  |             ^^^^^^^^^^^^^^^^^^^^^^^^ cannot use the `?` operator in a
  function that returns `()`
```

**解决方案：**

1. 将函数返回值类型修改为 `Result<T, E>`
2. 使用 `match` 或 `Result` 的方法来处理 `Result<T, E>`

### main 函数返回 Result

`main` 函数可以返回 `Result<(), Box<dyn Error>>`：

```rust
use std::error::Error;
use std::fs::File;

fn main() -> Result<(), Box<dyn Error>> {
    let f = File::open("hello.txt")?;
    Ok(())
}
```

**说明：**
- `Box<dyn Error>` 被称为 "trait 对象"
- 可以理解为使用 `?` 时 `main` 允许返回的 "任何类型的错误"

## panic! 还是不 panic!

### 决策指南

**返回 Result 的优势：**
- 将选择权交给调用者
- 调用者可以选择以符合他们场景的方式尝试恢复
- 是定义可能会失败的函数的好的默认选择

**使用 panic! 的场景：**
- 示例代码
- 代码原型
- 测试
- 当你比编译器知道更多的情况

### 示例、代码原型和测试

**示例代码：**
- 调用 `unwrap` 可以被理解为一个占位符
- 使示例代码更加明确

**原型设计：**
- `unwrap` 和 `expect` 方法在原型设计时非常方便
- 当准备好让程序更加健壮时，它们会在代码中留下清晰的标记

**测试：**
- 如果方法调用在测试中失败了，我们希望这个测试都失败
- `panic!` 是测试如何被标记为失败的

### 当你比编译器知道更多的情况

当你有其他逻辑来确保 `Result` 会是 `Ok` 值时，调用 `unwrap` 是合适的：

```rust
use std::net::IpAddr;

let home: IpAddr = "127.0.0.1".parse().unwrap();
```

**说明：**
- `127.0.0.1` 是一个有效的 IP 地址
- 虽然 `parse` 方法返回 `Result`，但我们知道这里不会失败
- 如果 IP 地址字符串来源于用户，就需要以更健壮的方式处理 `Result`

### 错误处理指导原则

**建议使用 panic! 的情况：**

当有可能会导致**有害状态**的情况下建议使用 `panic!`。有害状态是指：
- 一些假设、保证、协议或不可变性被打破的状态
- 例如无效的值、自相矛盾的值或者被传递了不存在的值

**同时满足以下条件：**
1. 有害状态并不包含**预期**会偶尔发生的错误
2. 在此之后代码的运行依赖于不处于这种有害状态
3. 当没有可行的手段来将有害状态信息编码进所使用的类型中的情况

**使用 Result 的情况：**

当错误预期会出现时，返回 `Result` 比调用 `panic!` 更合适：
- 解析器接收到错误数据
- HTTP 请求返回一个表明触发了限流的状态
- 应该通过返回 `Result` 来表明失败预期是可能的

### 验证与安全

当代码对值进行操作时，应该首先验证值是有效的，并在其无效时 `panic!`：
- 这主要是出于安全的原因
- 尝试操作无效数据会暴露代码漏洞
- 这就是标准库在尝试越界访问数组时会 `panic!` 的主要原因

**函数契约：**
- 函数通常都遵循**契约（contracts）**
- 他们的行为只有在输入满足特定条件时才能得到保证
- 当违反契约时 panic 是有道理的
- 函数的契约应该在函数的 API 文档中得到解释

### 利用类型系统进行验证

Rust 的类型系统可以为你进行很多检查：
- 如果函数有一个特定类型的参数，编译器已经确保其拥有一个有效值
- 使用不同于 `Option` 的类型，程序期望它是**有值**的并且不是**空值**
- 使用像 `u32` 这样的无符号整型，确保它永远不为负

## 创建自定义类型进行有效性验证

### 问题场景

回忆第二章的猜猜看游戏，我们要求用户猜测一个 1 到 100 之间的数字，但从未验证用户的猜测是否在这个范围内。

**简单的解决方案：**

```rust
loop {
    // --snip--

    let guess: i32 = match guess.trim().parse() {
        Ok(num) => num,
        Err(_) => continue,
    };

    if guess < 1 || guess > 100 {
        println!("The secret number will be between 1 and 100.");
        continue;
    }

    match guess.cmp(&secret_number) {
        // --snip--
    }
}
```

**问题：**
- 如果有很多函数都有这样的要求，在每个函数中都有这样的检查将是非常冗余的
- 可能潜在地影响性能

### 更好的解决方案：自定义类型

创建一个新类型来将验证放入创建其实例的函数中：

```rust
pub struct Guess {
    value: i32,
}

impl Guess {
    pub fn new(value: i32) -> Guess {
        if value < 1 || value > 100 {
            panic!("Guess value must be between 1 and 100, got {}.", value);
        }

        Guess { value }
    }

    pub fn value(&self) -> i32 {
        self.value
    }
}
```

**设计说明：**

1. **私有字段**：`value` 字段是私有的
   - 使用 `Guess` 结构体的代码不允许直接设置 `value` 的值
   - 调用者必须使用 `Guess::new` 方法来创建实例

2. **new 函数**：关联函数
   - 接收一个 `i32` 类型的参数 `value`
   - 验证值是否在 1 到 100 之间
   - 如果不在范围内，调用 `panic!`
   - 如果通过验证，返回 `Guess` 实例

3. **value 方法**：getter 方法
   - 借用 `self`
   - 返回 `value` 字段的值
   - 这样的公有方法是必要的，因为 `value` 字段是私有的

**优势：**
- 获取或返回一个 `Guess` 的函数可以声明为获取或返回 `Guess`，而不是 `i32`
- 函数体中无需进行任何额外的检查
- 类型系统保证了值的有效性

## 总结

Rust 的错误处理功能被设计为帮助你编写更加健壮的代码：

1. **panic! 宏**
   - 代表一个程序无法处理的状态
   - 停止执行而不是使用无效或不正确的值继续处理

2. **Result 枚举**
   - 代表操作可能会在一种可以恢复的情况下失败
   - 可以使用 `Result` 来告诉代码调用者他需要处理潜在的成功或失败

3. **最佳实践**
   - 在适当的场景使用 `panic!` 和 `Result`
   - 利用 Rust 的类型系统进行验证
   - 创建自定义类型来确保值的有效性

在适当的场景使用 `panic!` 和 `Result` 将会使你的代码在面对不可避免的错误时显得更加可靠。

---

## 参考资料

- [The Rust Programming Language - Error Handling](https://doc.rust-lang.org/book/ch09-00-error-handling.html)
- [Unrecoverable Errors with panic!](https://doc.rust-lang.org/book/ch09-01-unrecoverable-errors-with-panic.html)
- [Recoverable Errors with Result](https://doc.rust-lang.org/book/ch09-02-recoverable-errors-with-result.html)
- [To panic! or Not to panic!](https://doc.rust-lang.org/book/ch09-03-to-panic-or-not-to-panic.html)
- [Result API 文档](https://doc.rust-lang.org/std/result/enum.Result.html)
- [panic! 宏文档](https://doc.rust-lang.org/std/macro.panic.html)

---
