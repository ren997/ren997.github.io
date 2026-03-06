---
title: Rust 泛型：用类型参数复用代码
categories: [Rust, 泛型 Trait 与生命周期]
tags: [rust]
---

## 概述

泛型（generics）解决的问题很直接：同一段逻辑如果只因为类型不同就要重复写很多遍，怎么办？

Rust 的答案是：把“具体类型”抽象成“类型参数”。

这篇文章只讲泛型本身，不展开 trait 和生命周期的复杂细节。目标是先把下面几件事讲清楚：

- 泛型为什么能减少重复代码
- `T` 到底是什么
- 为什么有时泛型函数还需要 trait bound
- 泛型 struct / enum / impl 怎么写
- 为什么 Rust 泛型没有运行时开销

<!--more-->

## 核心问题

先看一个最常见的重复场景：找最大值。

```rust
fn largest_i32(list: &[i32]) -> i32 {
    let mut largest = list[0];

    for &item in list.iter() {
        if item > largest {
            largest = item;
        }
    }

    largest
}

fn largest_char(list: &[char]) -> char {
    let mut largest = list[0];

    for &item in list.iter() {
        if item > largest {
            largest = item;
        }
    }

    largest
}
```

这两个函数逻辑完全一样，只是处理的类型不同。

这就是泛型最适合出场的地方：逻辑相同，类型不同。

---

## 最小示例

我们希望把上面的两个函数合成一个：

```rust
fn largest<T>(list: &[T]) -> T {
```

这里的 `T` 可以理解成：

- 这是一个“类型占位符”
- 具体是什么类型，由调用时决定

例如：

```rust
let number_list = vec![34, 50, 25, 100, 65];
let result = largest(&number_list);

let char_list = vec!['y', 'm', 'a', 'q'];
let result = largest(&char_list);
```

但这时代码还不能直接通过编译，因为编译器并不知道任意类型 `T` 都支持比较和复制。

---

## 为什么泛型函数还要加约束

下面这个版本才是可工作的：

```rust
fn largest<T: PartialOrd + Copy>(list: &[T]) -> T {
    let mut largest = list[0];

    for &item in list.iter() {
        if item > largest {
            largest = item;
        }
    }

    largest
}
```

### `PartialOrd` 是为什么

因为这段代码里有比较操作：

```rust
if item > largest
```

不是所有类型都支持 `>`，所以要告诉编译器：`T` 至少得是“可比较大小”的类型。

### `Copy` 是为什么

因为函数返回的是 `T` 本身，不是引用：

```rust
fn largest<T: PartialOrd + Copy>(list: &[T]) -> T
```

这里需要把值从切片里取出来并返回。如果类型不能复制，这个写法就不成立。

> 这里先把它理解成：“这个函数要求 `T` 必须具备这些能力。”这些能力是通过 trait 表达的，trait 的细节放在下一篇讲。

---

## 泛型参数到底写在哪

泛型最常见的写法是在函数名后面：

```rust
fn largest<T>(list: &[T]) -> T
```

读法可以理解为：

- `largest` 是一个泛型函数
- 它对某个类型 `T` 工作
- 参数是 `T` 的切片
- 返回值也是 `T`

### 命名习惯

按惯例，Rust 泛型参数通常写成短名字：

- `T`：type
- `U`、`V`：额外类型参数

它们不是关键字，只是习惯上这样写更容易阅读。

---

## 泛型结构体

泛型不只用于函数，也可以用于结构体。

### 一个类型参数

```rust
struct Point<T> {
    x: T,
    y: T,
}
```

这表示：

- `x` 和 `y` 的类型相同
- 但这个“相同类型”可以是任何具体类型

例如：

```rust
let integer = Point { x: 5, y: 10 };
let float = Point { x: 1.0, y: 4.0 };
```

### 两个类型参数

如果你希望两个字段可以是不同类型，就要写两个泛型参数：

```rust
struct Point<T, U> {
    x: T,
    y: U,
}
```

这样下面的写法就合法了：

```rust
let mixed = Point { x: 5, y: 4.0 };
```

### 这里最容易误解的点

`Point<T>` 不是“某一种具体类型”，而是一组类型模板。

例如：

- `Point<i32>` 是一个具体类型
- `Point<f64>` 是另一个具体类型
- `Point<i32, f64>` 又是另一个具体类型

---

## 泛型枚举

标准库里最常见的泛型枚举就是 `Option<T>` 和 `Result<T, E>`。

### `Option<T>`

```rust
enum Option<T> {
    Some(T),
    None,
}
```

它表示：

- 要么有一个 `T`
- 要么没有值

### `Result<T, E>`

```rust
enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

它表示：

- 成功时拿到 `T`
- 失败时拿到 `E`

这两个类型能广泛复用，核心原因就是：它们把具体类型抽象掉了。

---

## 泛型方法和 impl

泛型结构体还可以实现方法。

### 基本例子

```rust
struct Point<T> {
    x: T,
    y: T,
}

impl<T> Point<T> {
    fn x(&self) -> &T {
        &self.x
    }
}
```

这里的重点是：

- `Point<T>` 上的方法要写成 `impl<T> Point<T>`
- `impl` 后面也要声明 `T`

### 为特定具体类型实现方法

有时你只想让某一种具体类型拥有某个方法：

```rust
struct Point<T> {
    x: T,
    y: T,
}

impl Point<f32> {
    fn distance_from_origin(&self) -> f32 {
        (self.x.powi(2) + self.y.powi(2)).sqrt()
    }
}
```

这里不是所有 `Point<T>` 都有这个方法，只有 `Point<f32>` 才有。

### 方法自己的泛型参数

```rust
struct Point<T, U> {
    x: T,
    y: U,
}

impl<T, U> Point<T, U> {
    fn mixup<V, W>(self, other: Point<V, W>) -> Point<T, W> {
        Point {
            x: self.x,
            y: other.y,
        }
    }
}
```

这里有两层泛型：

- `impl<T, U>` 是结构体自己的泛型
- `fn mixup<V, W>` 是这个方法额外引入的泛型

这个区分很重要。

---

## 为什么 Rust 泛型没有运行时损耗

很多人第一次接触泛型时会担心：抽象是不是会拖慢运行速度？

Rust 的答案是：不会，通常没有运行时开销。

### 核心原因：单态化

编译器会把你实际用到的具体类型“展开”为对应版本，这个过程叫单态化（monomorphization）。

例如：

```rust
let integer = Some(5);
let float = Some(5.0);
```

编译器可以近似理解为替你生成了：

```rust
enum Option_i32 {
    Some(i32),
    None,
}

enum Option_f64 {
    Some(f64),
    None,
}
```

这不是真实源码，但它能帮助你理解：

- 你写的是一份泛型代码
- 编译器产出的是具体类型的专用代码

所以泛型更像“编译期复用”，不是“运行时动态分派”。

---

## 常见误区

### 误区一：泛型就是“任意类型都能直接用”

不是。

泛型只说明“类型可以变化”，不说明“这些类型一定具备某种能力”。如果代码里需要比较、打印、复制，就要额外加约束。

### 误区二：`T` 是某种特殊类型

不是。

`T` 只是占位符名字，你写成 `A`、`ItemType` 也可以，只是 `T` 更符合社区习惯。

### 误区三：泛型一定有性能损耗

对 Rust 来说，这通常是错的。大多数泛型代码会在编译期单态化，不会引入额外运行时开销。

---

## 总结

| 概念 | 说明 |
|---|---|
| **泛型** | 把具体类型抽象成类型参数 |
| **`T`** | 类型占位符，由调用时决定具体类型 |
| **trait bound** | 约束泛型类型必须具备某些能力 |
| **泛型 struct / enum** | 让数据结构也能复用于多种类型 |
| **泛型 impl / 方法** | 让方法既能依赖类型参数，也能引入自己的泛型参数 |
| **单态化** | Rust 在编译期把泛型展开成具体类型代码 |

> 最佳实践：先把泛型理解成“减少重复的类型模板”，不要一开始就把它和 trait、生命周期混成一团。

---

## 知识自测

尝试独立回答以下问题，答案在下方。

---

**第 1 题**：泛型主要解决什么问题？

**第 2 题**：为什么 `largest_i32` 和 `largest_char` 适合改成泛型函数？

**第 3 题**：为什么 `fn largest<T>(list: &[T]) -> T` 不能直接工作？

**第 4 题**：`PartialOrd` 和 `Copy` 在 `largest` 例子里分别解决什么问题？

**第 5 题**：`Point<T>` 和 `Point<T, U>` 的区别是什么？

**第 6 题**：为什么 `impl<T> Point<T>` 里的 `T` 还要再写一次？

**第 7 题**：方法上的泛型参数和结构体本身的泛型参数有什么区别？

**第 8 题**：Rust 泛型为什么通常没有运行时开销？

---

<details markdown="1">
<summary>📖 点击查看答案</summary>

**第 1 题答案**

泛型主要解决“同一段逻辑因类型不同而重复编写”的问题。

---

**第 2 题答案**

因为它们逻辑完全一样，只是处理的元素类型不同。

---

**第 3 题答案**

因为编译器不知道任意类型 `T` 是否支持比较和复制，所以需要额外约束。

---

**第 4 题答案**

- `PartialOrd`：允许使用 `>` 比较大小
- `Copy`：允许把值复制出来并作为返回值返回

---

**第 5 题答案**

- `Point<T>` 要求两个字段类型相同
- `Point<T, U>` 允许两个字段类型不同

---

**第 6 题答案**

因为 `impl<T>` 需要重新声明这个实现块使用的泛型参数，才能在 `Point<T>` 的方法里使用它。

---

**第 7 题答案**

结构体本身的泛型参数属于整个类型；方法自己的泛型参数只在该方法内部有效。

---

**第 8 题答案**

因为 Rust 会在编译期进行单态化，把泛型代码展开成具体类型版本，所以通常没有额外运行时开销。

</details>

---

## 后续阅读

- [`Rust Trait：定义共享行为`]({% post_url 2026-02-03-rust-traits %})
- [`Rust 生命周期：借用为什么必须标注关系`]({% post_url 2026-02-03-rust-lifetimes %})

---

## 参考资料

- [The Rust Programming Language - Generic Data Types](https://doc.rust-lang.org/book/ch10-01-syntax.html)

---