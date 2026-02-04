---
title: rust文档-表达式和语句
categories: [Rust, 基础]
tags: [rust]
---

## 学习资源

- **Rust 程序设计语言（2024 edition）简体中文版**
  GitHub 仓库：https://github.com/KaiserY/trpl-zh-cn

- **B站视频教程**
  【Rust编程语言入门教程（Rust语言/Rust权威指南配套）【已完结】】
  https://www.bilibili.com/video/BV1hp4y1k7SV/?p=20&share_source=copy_web&vd_source=28d07063ae73341866c4483f21f5f907

> 视频和 GitHub 的资料是配套的

---

# Rust 中的 Item / Statement / Expression 详解

> **核心概念**：Rust 是一门 **以表达式为中心（expression-based）** 的语言，但在语法层面，代码被严格划分为 **Item / Statement / Expression** 三类。它们是 **并列关系，不是包含关系**。

## 一、总体对照表

| 分类 | 中文含义 | 是否有值 | 能否赋值 (`let x = ...`) | 是否影响执行流程 | 是否需要分号 |
|------|----------|----------|--------------------------|------------------|--------------|
| **Item** | 定义 / 声明 | ❌ | ❌ | ❌ | ❌ |
| **Statement** | 语句 | 值为 `()`（unit type） | ❌ | ✅ | ✅ |
| **Expression** | 表达式 | ✅ | ✅ | ✅ | ❌（加了分号变 Statement） |

---

## 二、Item（项 / 定义）

### 定义
> **Item 用来"定义东西"，不参与运行时求值。它们在编译时被处理，用于定义程序的结构。**

### 特点
- 不产生值
- 不参与运行时求值
- 不需要分号结尾
- 不能用于赋值语句的右侧

### 常见 Item 示例

```rust
// 函数定义
fn foo() {}

// 结构体定义
struct User {
    name: String,
    age: u32,
}

// 枚举定义
enum Option<T> {
    Some(T),
    None,
}

// 特质定义
trait Draw {
    fn draw(&self);
}

// 实现块
impl User {
    fn new(name: String, age: u32) -> User {
        User { name, age }
    }
}

// 模块定义
mod my_mod {
    pub fn hello() {}
}

// 导入声明
use std::fmt;

// 常量定义
const MAX_POINTS: u32 = 100_000;

// 静态变量定义
static LANGUAGE: &str = "Rust";

// 类型别名
type MyInt = i32;
```

### 注意事项
- 函数定义 `fn foo() {}` 是一个 Item，不是 Statement
- Item 在编译时被处理，用于构建程序的静态结构
- Item 可以出现在函数体内部，称为**局部 Item**（如局部函数、局部结构体等）

```rust
fn outer() {
    // 局部函数定义（局部 Item）
    fn inner() {
        println!("I'm a local function!");
    }

    // 局部结构体定义（局部 Item）
    struct LocalPoint {
        x: i32,
        y: i32,
    }

    inner();
    let p = LocalPoint { x: 1, y: 2 };
}
```

---

## 三、Statement（语句）

### 定义
> **Statement 是执行某些操作但不返回值的指令。语句以分号结尾，其值为单元类型 `()`。**

### 特点
- 不返回值（或返回 `()`）
- 必须以分号 `;` 结尾
- 不能用于赋值语句的右侧（因为返回 `()`）
- 影响程序的执行流程

### Statement 的类型

#### 1. 声明语句（Declaration Statement）
```rust
// let 绑定语句
let x = 5;              // 声明并初始化变量
let mut y = 10;         // 声明可变变量
let z: i32 = 20;        // 显式类型声明
```

#### 2. 表达式语句（Expression Statement）
```rust
// 表达式后面加分号就变成了语句
x + 1;                  // 表达式语句，值被丢弃
println!("Hello");      // 函数调用语句
```

#### 3. 空语句（Empty Statement）
```rust
;                       // 只有一个分号
```

### 示例说明

```rust
fn main() {
    // 这是一个 Statement（let 绑定）
    let x = 5;

    // 这也是一个 Statement（表达式语句）
    x + 1;              // 计算了值，但被丢弃了

    // 这也是一个 Statement（函数调用）
    println!("x = {}", x);

    // 错误示例：不能将 Statement 赋值给变量
    // let y = x + 1;   // 这是 Expression，不是 Statement
    // let z = x + 1;   // 这也是 Expression
}
```

### 关键理解
- **表达式 + 分号 = 语句**
- 语句执行操作但不返回值
- 语句的值总是 `()`

---

## 四、Expression（表达式）

### 定义
> **Expression 是计算并产生值的代码片段。表达式是 Rust 的核心，大部分代码都是表达式。**

### 特点
- **有返回值**（这是与 Statement 的核心区别）
- **不需要分号结尾**（加了分号就变成 Statement）
- 可以用于赋值语句的右侧
- 可以嵌套组合

### Expression 的类型

#### 1. 字面量表达式
```rust
5                       // 整数表达式，值为 5
"hello"                 // 字符串字面量表达式
true                    // 布尔表达式
```

#### 2. 算术表达式
```rust
5 + 3                   // 值为 8
10 * 2                  // 值为 20
```

#### 3. 函数调用表达式
```rust
add(1, 2)               // 函数调用，返回函数的结果
```

#### 4. 块表达式（Block Expression）
```rust
{
    let x = 5;
    x + 1                // 块的最后一行是表达式，整个块的值就是这个表达式的值
}                        // 整个块的值是 6
```

#### 5. if 表达式
```rust
if condition {
    1
} else {
    0
}                        // if 是表达式，返回分支的值
```

#### 6. match 表达式
```rust
match x {
    1 => "one",
    2 => "two",
    _ => "other",
}                        // match 是表达式，返回匹配分支的值
```

### 表达式 vs 语句的关键区别

```rust
fn main() {
    let x = 5;           // Statement：let 绑定语句

    // Expression：有返回值
    let y = x + 1;       // x + 1 是表达式，值为 6

    // Statement：表达式 + 分号 = 语句
    x + 1;               // 这是语句，值被丢弃

    // 块表达式示例
    let z = {
        let a = 10;
        let b = 20;
        a + b             // 这是表达式，整个块的值是 30
    };                   // z = 30

    // if 表达式示例
    let result = if x > 0 {
        1                 // 表达式分支
    } else {
        0                 // 表达式分支
    };                   // result = 1

    // 函数返回值也是表达式
    let sum = add(1, 2); // add(1, 2) 是表达式
}

fn add(a: i32, b: i32) -> i32 {
    a + b                 // 这是表达式，作为函数返回值
}
```

### 块表达式的特殊规则

```rust
fn example() {
    // 块的最后一行如果是表达式（没有分号），整个块的值就是这个表达式的值
    let x = {
        let a = 5;
        a + 1              // 没有分号，这是表达式
    };                     // x = 6

    // 块的最后一行如果是语句（有分号），整个块的值是 ()
    let y = {
        let a = 5;
        a + 1;             // 有分号，这是语句
    };                     // y = ()

    // 显式返回
    let z = {
        let a = 5;
        return a + 1;      // 使用 return，这是语句
    };                     // z = 6（但会提前返回）
}
```

---

## 五、实际应用示例

### 示例 1：理解函数返回值

```rust
fn add_one(x: i32) -> i32 {
    x + 1                 // 表达式，作为返回值
}

fn add_one_statement(x: i32) -> i32 {
    x + 1;                // 错误！这是语句，返回 ()
    // 应该写 return x + 1; 或者去掉分号
}
```

### 示例 2：if 作为表达式

```rust
fn main() {
    let condition = true;

    // if 是表达式，可以赋值
    let number = if condition {
        5                   // 表达式分支
    } else {
        6                   // 表达式分支
    };                      // number = 5

    // 错误示例：分支必须是表达式
    // let number = if condition {
    //     5;                // 错误：这是语句
    // } else {
    //     6;                // 错误：这是语句
    // };
}
```

### 示例 3：match 作为表达式

```rust
fn main() {
    let x = 3;

    let result = match x {
        1 => "one",         // 表达式分支
        2 => "two",         // 表达式分支
        _ => "other",       // 表达式分支
    };                      // result = "other"
}
```

### 示例 4：循环中的表达式

```rust
fn main() {
    let mut counter = 0;

    // loop 表达式
    let result = loop {
        counter += 1;
        if counter == 10 {
            break counter;  // break 可以返回值，整个 loop 表达式的值
        }
    };                      // result = 10
}
```

### 为什么 `break counter;` 可以加分号？

这是一个常见的疑问。按照前面的规则，"表达式 + 分号 = 语句"，那 `break counter;` 不就变成语句了吗？

**关键点**：`break counter` 的类型是 `!`（never type），表示"永不返回"。

```rust
let result = loop {
    counter += 1;
    if counter == 10 {
        break counter;  // 加分号 ✅
        // break counter   // 不加分号也 ✅
    }
};
```

**为什么两种写法都可以？**

1. **`break` 会立即跳出循环**，后续代码不会执行，所以这行代码是否"返回值"无关紧要
2. **`break counter` 的值传递给 `loop` 表达式**，而不是传递给 `if` 块
3. **`!` 类型可以强制转换为任何类型**，所以即使加了分号变成 `()` 类型的语句，编译器也能处理

**对比其他控制流语句**：

```rust
// return 也是一样的道理
fn foo() -> i32 {
    return 5;   // 加分号 ✅
    // return 5    // 不加分号也 ✅（但通常习惯加分号）
}

// continue 同理
loop {
    continue;   // 加分号 ✅
}
```

**总结**：`break`、`return`、`continue` 这类控制流表达式，因为它们会改变程序执行流程（跳出/返回），所以加不加分号都可以。习惯上我们会加分号，让代码看起来更像"执行一个动作"。

---

## 六、总结

### 核心要点

1. **Item**：定义程序结构，编译时处理，不参与运行时求值
2. **Statement**：执行操作但不返回值，以分号结尾，值为 `()`
3. **Expression**：计算并产生值，不加分号，是 Rust 的核心

### 记忆技巧

- **表达式 + 分号 = 语句**
- **块的最后一行如果是表达式（无分号），整个块的值就是这个表达式的值**
- **Rust 是表达式语言，大部分代码都是表达式**

### 常见错误

```rust
// 错误 1：函数体最后一行加了分号
fn bad() -> i32 {
    5;                    // 错误：返回 () 而不是 5
}

// 错误 2：if 分支加了分号
let x = if true {
    1;                    // 错误：这是语句，不是表达式
} else {
    2;
};

// 正确写法
fn good() -> i32 {
    5                     // 正确：表达式作为返回值
}

let x = if true {
    1                     // 正确：表达式分支
} else {
    2                     // 正确：表达式分支
};
```

---

