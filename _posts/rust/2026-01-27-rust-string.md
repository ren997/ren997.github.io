---
title: rust 文档 - 集合 - String
categories: [Rust, 集合]
tags: [rust]
sidebar:
  nav: docs-rust
---

## 概述

第四章简单介绍过字符串，现在我们来深入了解一下。字符串是很多 Rust 新手容易卡住的地方，主要有三个原因：

1. **Rust 的严格性**：Rust 会把可能出错的地方都暴露出来
2. **字符串的复杂性**：字符串比大多数程序员想象的要复杂得多
3. **UTF-8 编码**：UTF-8 本身就不简单

这三点加在一起，对于习惯了其他编程语言的开发者来说，确实有点难度。

为什么在集合这一章讲字符串？因为字符串本质上就是**字节的集合**，再加上一些处理这些字节的方法。我们会讲 `String` 的常见操作（创建、更新、读取），也会讲它和其他集合不一样的地方——比如为什么不能用索引访问字符串。

## 什么是字符串？

在深入之前，先搞清楚 Rust 里的"字符串"到底指什么。

Rust 核心语言只有一种字符串类型：`str`（字符串 slice），通常以借用的形式出现：`&str`。第四章讲过，字符串 slice 是对存储在其他地方的 UTF-8 编码字符串数据的引用。比如字符串字面值就存储在程序的二进制文件里，字符串 slice 也是这样。

`String` 类型是标准库提供的，不是核心语言的一部分。它有这些特点：
- **可增长**：长度可以变化
- **可变**：内容可以修改
- **有所有权**：拥有数据
- **UTF-8 编码**：和 `&str` 一样

当 Rust 程序员说"字符串"时，通常指的是 `String` 和 `&str` 这两种类型，而不只是其中一个。虽然这一章主要讲 `String`，但这两种类型在 Rust 标准库中都很常用。

### 其他字符串类型

Rust 标准库还有其他字符串类型，比如 `OsString`、`OsStr`、`CString`、`CStr`。第三方库可能还会提供更多。

注意到这些名字的规律了吗？以 `String` 结尾的拥有所有权，以 `Str` 结尾的是借用。就像 `String` 和 `str` 的关系一样。这些类型可以用不同的编码或内存表示来存储文本。本章不会详细讲这些类型，具体用法可以查看它们的 API 文档。

## 创建字符串

`String` 的很多操作和 `Vec` 类似，从创建空字符串开始：

```rust
let mut s = String::new();
```

这里创建了一个空字符串 `s`，之后可以往里面添加数据。

### 使用 to_string 方法

通常我们会给字符串一些初始值。可以用 `to_string` 方法，它适用于任何实现了 `Display` trait 的类型（字符串字面值也实现了）：

```rust
let data = "initial contents";
let s = data.to_string();

// 也可以直接对字符串字面值调用
let s = "initial contents".to_string();
```

这样就创建了包含 `initial contents` 的字符串。

### 使用 String::from 函数

也可以用 `String::from` 从字符串字面值创建 `String`：

```rust
let s = String::from("initial contents");
```

字符串用得太多了，所以有很多不同的 API 可以选。有些看起来重复，但都有各自的用途。`String::from` 和 `.to_string` 做的事情完全一样，选哪个纯粹看个人喜好。

### UTF-8 编码支持

记住，字符串是 UTF-8 编码的，所以可以包含任何正确编码的数据：

```rust
let hello = String::from("السلام عليكم");  // 阿拉伯语
let hello = String::from("Dobrý den");      // 捷克语
let hello = String::from("Hello");          // 英语
let hello = String::from("שָׁלוֹם");         // 希伯来语
let hello = String::from("नमस्ते");          // 印地语
let hello = String::from("こんにちは");        // 日语
let hello = String::from("안녕하세요");        // 韩语
let hello = String::from("你好");            // 中文
let hello = String::from("Olá");            // 葡萄牙语
let hello = String::from("Здравствуйте");  // 俄语
let hello = String::from("Hola");           // 西班牙语
```

这些都是合法的 `String` 值。

## 更新字符串

`String` 的大小可以变化，内容也可以修改，就像 `Vec` 一样。另外，还可以用 `+` 运算符或 `format!` 宏来拼接字符串。

### 使用 push_str 和 push 追加内容

用 `push_str` 方法可以追加字符串 slice：

```rust
let mut s = String::from("foo");
s.push_str("bar");
```

执行后，`s` 的内容是 `foobar`。`push_str` 接受字符串 slice，因为不需要获取参数的所有权。比如：

```rust
let mut s1 = String::from("foo");
let s2 = "bar";
s1.push_str(s2);
println!("s2 is {}", s2);  // s2 还能用
```

如果 `push_str` 获取了 `s2` 的所有权，最后一行就没法打印 `s2` 了。好在它不会这样做。

`push` 方法用来追加单个字符：

```rust
let mut s = String::from("lo");
s.push('l');
```

执行后，`s` 的内容是 `"lol"`。

### 使用 + 运算符拼接字符串

经常需要把两个字符串合并起来，可以用 `+` 运算符：

```rust
let s1 = String::from("Hello, ");
let s2 = String::from("world!");
let s3 = s1 + &s2; // 注意：s1 被移动了，不能再用
```

执行后，`s3` 的内容是 `Hello, world!`。为什么 `s1` 不能再用了？为什么 `s2` 要加 `&`？这和 `+` 运算符调用的函数签名有关：

```rust
fn add(self, s: &str) -> String {
```

> 这不是标准库的实际签名（标准库用的是泛型），但可以帮助理解。泛型会在第十章讲。

这个签名揭示了 `+` 运算符的几个关键点：

**1. 第二个参数是 `&str`**

所以我们用 `&s2`（引用）和 `s1` 相加。`add` 函数只能把 `&str` 和 `String` 相加，不能把两个 `String` 相加。

**2. 解引用强制多态**

等等，`&s2` 的类型是 `&String`，不是 `&str` 啊？为什么能编译？因为 Rust 会自动把 `&String` 转换成 `&str`，这叫**解引用强制多态（deref coercion）**。可以理解为把 `&s2` 变成了 `&s2[..]`。第十五章会详细讲。因为 `add` 不获取参数的所有权，所以 `s2` 在操作后还能用。

**3. 第一个参数是 `self`（不是 `&self`）**

这意味着 `add` 会获取 `s1` 的所有权，所以 `s1` 会被移动到 `add` 里，之后就不能再用了。虽然 `let s3 = s1 + &s2;` 看起来像是复制了两个字符串，但实际上是：获取 `s1` 的所有权，把 `s2` 的内容追加上去，然后返回结果。看起来复制了很多，实际上没有——这个实现比复制高效多了。

### 使用 format! 宏

如果要拼接多个字符串，用 `+` 就很麻烦了：

```rust
let s1 = String::from("tic");
let s2 = String::from("tac");
let s3 = String::from("toe");

let s = s1 + "-" + &s2 + "-" + &s3;
```

这样 `s` 的内容是 `"tic-tac-toe"`。但这么多 `+` 和 `"`，看着就头疼。对于复杂的字符串拼接，用 `format!` 宏更好：

```rust
let s1 = String::from("tic");
let s2 = String::from("tac");
let s3 = String::from("toe");

let s = format!("{}-{}-{}", s1, s2, s3);
```

这样也能得到 `"tic-tac-toe"`。`format!` 和 `println!` 的工作原理一样，只不过不是打印到屏幕，而是返回一个 `String`。这个版本好理解多了，而且**不会获取任何参数的所有权**。

## 索引字符串

在很多语言里，用索引访问字符串的单个字符是很常见的操作。但在 Rust 里，如果你尝试用索引访问 `String`，会报错：

```rust
let s1 = String::from("hello");
let h = s1[0];  // 错误！
```

会得到这样的错误：

```
error[E0277]: the trait bound `std::string::String: std::ops::Index<{integer}>` is not satisfied
-->
|
3 |     let h = s1[0];
|             ^^^^^ the type `std::string::String` cannot be indexed by `{integer}`
|
= help: the trait `std::ops::Index<{integer}>` is not implemented for `std::string::String`
```

错误信息说得很清楚：**Rust 的字符串不支持索引**。为什么？要回答这个问题，得先了解 Rust 是怎么在内存里存储字符串的。

### 内部表现

`String` 本质上是 `Vec<u8>` 的封装。先来看看 String 的底层结构。

**核心原理**：String 的底层就是**堆上的 UTF-8 字节数组**（`Vec<u8>`）。

```
栈上的 String 结构体                堆上的 UTF-8 字节数组
┌─────────────────┐                ┌───┬───┬───┬───┬───┬───┐
│ ptr: *mut u8    │───────────────>│'H'│'e'│'l'│'l'│'o'│   │
│ len: usize      │ = 5            └───┴───┴───┴───┴───┴───┘
│ capacity: usize │ = 6             已使用    未使用
└─────────────────┘                 (len=5)  (cap-len=1)
```

**String 的三个核心字段**：

1. **`ptr`（指针）**：指向堆上 UTF-8 字节数组的起始位置
2. **`len`（长度）**：当前字符串的**字节数**（注意：不是字符数！）
3. **`capacity`（容量）**：堆上数组的总容量（已分配的字节数）

**关键点**：
- String 本身是个小结构体，存在**栈**上（只有 3 个字段）
- 实际的 UTF-8 字节数据存在**堆**上的连续内存里
- `len` 是**字节数**，不是字符数（UTF-8 编码里一个字符可能占多个字节）
- 容量不够时，会重新分配更大的堆内存，并拷贝旧数据

**String vs &str 的内存布局**：

```rust
// &str（字符串 slice）：只是指向某处 UTF-8 数据的引用
let s: &str = "Hello";
// 内存布局：
// 栈: [ptr, len=5]  <- &str 结构体（2 个字段）
//      |
//      v
// 数据区: "Hello"  <- 可能在程序的只读数据段

// String：拥有堆上的 UTF-8 数据
let s: String = String::from("Hello");
// 内存布局：
// 栈: [ptr, len=5, cap=5]  <- String 结构体（3 个字段）
//      |
//      v
// 堆: ['H', 'e', 'l', 'l', 'o']  <- 实际数据
```

**为什么 String 用堆？**
- **动态大小**：字符串长度运行时可能变化，堆可以动态分配
- **可变性**：可以修改、追加、删除字符
- **所有权**：String 拥有数据，可以安全地转移所有权

**UTF-8 编码示例**：

来看几个正确编码的字符串例子。先看这个：

```rust
let len = String::from("Hola").len();
```

这里 `len` 是 4，说明存储 `"Hola"` 的 `Vec` 长度是 4 个字节。每个字母的 UTF-8 编码都占 1 个字节。

再看这个（注意：首字母是西里尔字母 Ze，不是数字 3）：

```rust
let len = String::from("Здравствуйте").len();
```

有人可能觉得长度是 12（12 个字母）。但 Rust 的答案是 **24**。因为用 UTF-8 编码 `"Здравствуйте"` 需要 24 个字节——每个 Unicode 标量值占 2 个字节。所以字符串的字节索引不一定对应一个有效的 Unicode 标量值。

来看个无效的例子：

```rust
let hello = "Здравствуйте";
let answer = &hello[0];
```

`answer` 应该是什么？应该是第一个字符 `З` 吗？用 UTF-8 编码时，`З` 的第一个字节是 208，第二个是 151。所以 `answer` 实际上是 208，但 208 本身不是一个有效的字母。返回 208 肯定不是用户想要的，但这是 Rust 在字节索引 0 位置能提供的唯一数据。

用户通常不想要字节值，即使字符串只有拉丁字母也一样。即使 `&"hello"[0]` 能返回字节值，它也应该返回 104 而不是 `h`。为了避免返回意外的值导致难以发现的 bug，Rust 干脆不编译这些代码，在开发阶段就把问题暴露出来。

### 字节、标量值和字形簇

这引出了 UTF-8 的另一个问题：从 Rust 的角度看，理解字符串有三种方式：

1. **字节（Bytes）**
2. **标量值（Scalar Values）**
3. **字形簇（Grapheme Clusters）** - 最接近人们理解的"字母"

比如这个梵文写的印地语单词 `"नमस्ते"`，存储在 vector 里的 `u8` 值是这样的：

```rust
[224, 164, 168, 224, 164, 174, 224, 164, 184, 224, 165, 141, 224, 164, 164, 224, 165, 135]
```

一共 18 个字节，这是计算机最终存储的数据。

如果从 Unicode 标量值的角度看（就像 Rust 的 `char` 类型），这些字节是这样的：

```rust
['न', 'म', 'स', '्', 'त', 'े']
```

一共 6 个 `char`，但第 4 个和第 6 个不是字母，是发音符号，本身没有意义。

如果从字形簇的角度看，就是人们说的 4 个字母：

```rust
["न", "म", "स्", "ते"]
```

Rust 提供了多种方式来解释计算机存储的原始字符串数据，程序可以选择需要的表示方式，不管是什么人类语言。

Rust 不允许用索引访问 `String` 字符的最后一个原因是：**索引操作应该是常数时间 (O(1))**。但对于 `String` 无法保证这个性能，因为 Rust 必须从头遍历到索引位置，才能确定有多少个有效字符。

## 字符串 Slice

用索引访问字符串通常不是好主意，因为字符串索引应该返回什么类型不明确：字节值？字符？字形簇？还是字符串 slice？

所以，如果你真的要用索引创建字符串 slice，Rust 要求你更明确一些。不要用 `[]` 和单个索引，而是用 `[]` 和一个范围来创建包含特定字节的字符串 slice：

```rust
let hello = "Здравствуйте";
let s = &hello[0..4];
```

这里 `s` 是个 `&str`，包含字符串的前 4 个字节。前面说过，这些字母每个占 2 个字节，所以 `s` 是 `"Зд"`。

如果用 `&hello[0..1]` 会怎样？答案是：Rust 运行时会 panic，就像访问 vector 的无效索引一样：

```
thread 'main' panicked at 'byte index 1 is not a char boundary; it is inside 'З' (bytes 0..2) of `Здравствуйте`', src/libcore/str/mod.rs:2188:4
```

要小心使用这个操作，因为可能导致程序崩溃。

## 遍历字符串的方法

好在还有其他方式来获取字符串元素。

### 使用 chars 方法

如果需要操作单个 Unicode 标量值，最好用 `chars` 方法。对 `"नमस्ते"` 调用 `chars` 会把它分开，返回 6 个 `char` 类型的值，然后可以遍历：

```rust
for c in "नमस्ते".chars() {
    println!("{}", c);
}
```

会打印：

```
न
म
स
्
त
े
```

### 使用 bytes 方法

`bytes` 方法返回每个原始字节，可能适合你的场景：

```rust
for b in "नमस्ते".bytes() {
    println!("{}", b);
}
```

会打印组成 `String` 的 18 个字节：

```
224
164
// --snip--
165
135
```

记住，有效的 Unicode 标量值可能由多个字节组成。

### 字形簇

从字符串获取字形簇很复杂，所以标准库没有提供这个功能。[crates.io](https://crates.io) 上有提供这个功能的 crate。

## 总结：字符串并不简单

总之，字符串确实很复杂。不同的语言选择了不同的方式向程序员展示这种复杂性。Rust 选择了准确处理 `String` 数据作为所有 Rust 程序的默认行为，这意味着程序员需要更多地思考如何预先处理 UTF-8 数据。

这种权衡相比其他语言更多地暴露了字符串的复杂性，但也让你在开发后期免于处理涉及非 ASCII 字符的错误。

---

**下一步**：现在来看看更简单的集合：哈希 map！
