---
title: Rust 迭代器：惰性处理序列的统一接口
categories: [Rust, 迭代器与闭包]
series: rust
series_order: 14
tags: [rust]
---

## 概述

Rust 的**迭代器（iterator）**是处理一系列元素的统一抽象。它把“如何遍历”“何时结束”“怎样组合处理步骤”这些逻辑封装起来，让我们不用反复写索引、边界判断和临时变量。

迭代器最大的特点有两个：

- **惰性（lazy）**：只定义处理流程，不会立刻执行
- **可组合**：可以把多个操作链式拼接起来，最后一次性消费

本文围绕标准库中的 `Iterator` trait，整理以下几个重点：

- `iter`、`iter_mut`、`into_iter` 的区别
- `next` 方法为什么是核心
- 什么是消费适配器和迭代器适配器
- 为什么 `map`、`filter` 常常要和闭包一起使用
- 如何自己实现一个迭代器

<!--more-->

## 迭代器的基本思想

### 什么是迭代器

可以把迭代器理解为一个“按需吐出元素”的对象。它不会一次性把所有结果都算出来，而是在你需要下一个元素时，才交出一个值。

例如：

```rust
let v1 = vec![1, 2, 3];

let v1_iter = v1.iter();
```

这段代码只是**创建了一个迭代器**，并没有真正开始遍历。

### 惰性求值

Rust 中的迭代器默认是惰性的。也就是说，光创建迭代器没有意义，必须再配合消费操作，流程才会真正执行。

例如下面这段代码虽然写了 `map`，但实际上什么都不会发生：

```rust
let v1 = vec![1, 2, 3];

v1.iter().map(|x| x + 1);
```

原因很简单：`map` 只是返回了一个新的迭代器，它描述了“每个元素加 1”这个规则，但没有人去消费它。

---

## for 循环和迭代器

我们经常在 `for` 循环里使用迭代器，只是很多时候没有意识到。

```rust
let v1 = vec![1, 2, 3];

for val in v1.iter() {
    println!("Got: {}", val);
}
```

这里的 `for` 本质上就是不断调用迭代器的 `next` 方法，直到返回 `None` 为止。

如果手动展开，思路大致是：

```rust
let v1 = vec![1, 2, 3];
let mut iter = v1.iter();

while let Some(val) = iter.next() {
    println!("Got: {}", val);
}
```

这就是为什么说：**`for` 循环是迭代器的语法糖。**

---

## Iterator trait 和 next 方法

所有迭代器都实现了标准库中的 `Iterator` trait。它最核心的定义可以理解为：

```rust
pub trait Iterator {
    type Item;

    fn next(&mut self) -> Option<Self::Item>;
}
```

### `type Item` 是什么

`Item` 是关联类型，表示这个迭代器每次产出的元素类型。

- 如果是 `v.iter()`，元素类型通常是 `&T`
- 如果是 `v.into_iter()`，元素类型通常是 `T`
- 如果是 `v.iter_mut()`，元素类型通常是 `&mut T`

### `next` 做了什么

`next` 每调用一次，就尝试返回下一个元素：

- 还有元素时，返回 `Some(元素)`
- 元素耗尽时，返回 `None`

示例：

```rust
#[test]
fn iterator_demonstration() {
    let v1 = vec![1, 2, 3];

    let mut v1_iter = v1.iter();

    assert_eq!(v1_iter.next(), Some(&1));
    assert_eq!(v1_iter.next(), Some(&2));
    assert_eq!(v1_iter.next(), Some(&3));
    assert_eq!(v1_iter.next(), None);
}
```

### 为什么调用 `next` 需要 `mut`

因为迭代器内部要记录“当前走到哪里了”。每调用一次 `next`，状态都会前进一步，所以迭代器本身通常需要是可变的：

```rust
let mut v1_iter = v1.iter();
```

这也说明：**迭代器是有状态的对象。**

---

## `iter`、`iter_mut` 和 `into_iter`

这是最容易混淆的一组方法。

### `iter`

返回元素的**不可变引用**迭代器：

```rust
let v = vec![1, 2, 3];

for x in v.iter() {
    println!("{}", x);
}
```

元素类型是 `&i32`，不会拿走集合所有权。

### `iter_mut`

返回元素的**可变引用**迭代器：

```rust
let mut v = vec![1, 2, 3];

for x in v.iter_mut() {
    *x += 10;
}
```

元素类型是 `&mut i32`，可以原地修改集合中的元素。

### `into_iter`

返回**拥有所有权**的迭代器：

```rust
let v = vec![1, 2, 3];

for x in v.into_iter() {
    println!("{}", x);
}
```

元素类型是 `i32`。迭代过程中会把元素所有权移动出来，之后原集合不能再使用。

### 三者对比

| 方法 | 产出元素类型 | 是否拿走集合所有权 | 典型用途 |
|---|---|---|---|
| `iter()` | `&T` | 否 | 只读遍历 |
| `iter_mut()` | `&mut T` | 否 | 遍历并修改 |
| `into_iter()` | `T` | 是 | 消费集合，转移元素所有权 |

---

## 消费迭代器的方法

有些方法会真正把迭代器跑完，这类方法可以理解为**消费适配器（consuming adaptors）**。

### `sum`

`sum` 会反复调用 `next`，直到迭代结束，然后返回总和：

```rust
#[test]
fn iterator_sum() {
    let v1 = vec![1, 2, 3];

    let v1_iter = v1.iter();

    let total: i32 = v1_iter.sum();

    assert_eq!(total, 6);
}
```

一旦调用了 `sum`，这个迭代器就被消费掉了，不能再继续使用。

类似的方法还有：

- `collect`
- `count`
- `fold`
- `for_each`
- `find`

它们共同的特点是：**最终一定会触发迭代真正执行。**

---

## 产生新迭代器的方法

另一类常见方法不会立刻产出最终结果，而是返回一个**新的迭代器**。这类方法通常叫**迭代器适配器（iterator adaptors）**。

### `map`

`map` 用来“把每个元素变成另一个元素”：

```rust
let v1 = vec![1, 2, 3];

let v2: Vec<_> = v1.iter().map(|x| x + 1).collect();

assert_eq!(v2, vec![2, 3, 4]);
```

这里执行流程是：

1. `iter()` 创建不可变引用迭代器
2. `map()` 定义“每个元素加 1”
3. `collect()` 消费整个迭代器，并把结果收集成 `Vec`

如果没有 `collect()`，这个流程就不会真正运行。

### `filter`

`filter` 用来“保留满足条件的元素”：

```rust
#[derive(PartialEq, Debug)]
struct Shoe {
    size: u32,
    style: String,
}

fn shoes_in_my_size(shoes: Vec<Shoe>, shoe_size: u32) -> Vec<Shoe> {
    shoes
        .into_iter()
        .filter(|shoe| shoe.size == shoe_size)
        .collect()
}
```

这里的闭包 `|shoe| shoe.size == shoe_size` 返回布尔值：

- 返回 `true`，该元素被保留
- 返回 `false`，该元素被丢弃

### 为什么迭代器适配器常和闭包一起出现

因为迭代器负责“遍历流程”，闭包负责“每个元素怎么处理”。

两者配合后，代码会非常紧凑：

```rust
let result: Vec<_> = vec![1, 2, 3, 4, 5]
    .into_iter()
    .filter(|x| x % 2 == 1)
    .map(|x| x * x)
    .collect();

assert_eq!(result, vec![1, 9, 25]);
```

这段代码表达的是：

- 先筛出奇数
- 再求平方
- 最后收集成新数组

整个过程没有手写索引，也没有手动维护临时变量。

---

## 闭包如何捕获环境

迭代器和闭包经常一起出现，关键原因之一是：**闭包可以捕获外部环境中的变量。**

例如：

```rust
fn shoes_in_my_size(shoes: Vec<Shoe>, shoe_size: u32) -> Vec<Shoe> {
    shoes
        .into_iter()
        .filter(|shoe| shoe.size == shoe_size)
        .collect()
}
```

这里 `filter` 里的闭包并没有把 `shoe_size` 写成参数，但它依然可以访问 `shoe_size`，因为闭包捕获了当前作用域中的值。

这也是为什么迭代器链式调用在 Rust 里非常自然：**遍历逻辑交给迭代器，条件和转换逻辑交给闭包。**

---

## 自定义迭代器

如果标准库提供的迭代器不够用，也可以自己实现 `Iterator` trait。

### 定义一个计数器

下面定义一个 `Counter`，它会依次返回 `1` 到 `5`：

```rust
struct Counter {
    count: u32,
}

impl Counter {
    fn new() -> Counter {
        Counter { count: 0 }
    }
}
```

### 为 `Counter` 实现 `Iterator`

```rust
impl Iterator for Counter {
    type Item = u32;

    fn next(&mut self) -> Option<Self::Item> {
        self.count += 1;

        if self.count < 6 {
            Some(self.count)
        } else {
            None
        }
    }
}
```

这段实现的关键点是：

- 每次调用 `next`，先把 `count` 加 1
- 如果结果小于 6，就返回 `Some(count)`
- 否则返回 `None`

### 验证行为

```rust
#[test]
fn calling_next_directly() {
    let mut counter = Counter::new();

    assert_eq!(counter.next(), Some(1));
    assert_eq!(counter.next(), Some(2));
    assert_eq!(counter.next(), Some(3));
    assert_eq!(counter.next(), Some(4));
    assert_eq!(counter.next(), Some(5));
    assert_eq!(counter.next(), None);
}
```

### 实现了 `next` 之后能得到什么

一旦实现了 `Iterator`，就不只拥有 `next`，还可以直接使用标准库里所有基于 `next` 默认实现的方法。

例如：

```rust
#[test]
fn using_other_iterator_trait_methods() {
    let sum: u32 = Counter::new()
        .zip(Counter::new().skip(1))
        .map(|(a, b)| a * b)
        .filter(|x| x % 3 == 0)
        .sum();

    assert_eq!(18, sum);
}
```

这段代码做了几件事：

1. 第一个 `Counter` 产生 `1, 2, 3, 4, 5`
2. 第二个 `Counter` 跳过第一个值后产生 `2, 3, 4, 5`
3. `zip` 把它们配对成 `(1,2), (2,3), (3,4), (4,5)`
4. `map` 计算乘积，得到 `2, 6, 12, 20`
5. `filter` 保留能被 3 整除的值，得到 `6, 12`
6. `sum` 最终得到 `18`

这正是迭代器可组合性的体现。

---

## 什么时候优先用迭代器

很多初学者会在 `for i in 0..vec.len()` 和迭代器之间犹豫。通常可以这样判断：

### 更适合用迭代器的场景

- 顺序遍历集合
- 对每个元素做转换
- 根据条件筛选元素
- 多步处理可以链式表达
- 希望代码更短、更聚焦业务逻辑

### 更适合用显式循环的场景

- 控制流程很复杂
- 需要频繁 `break` / `continue`
- 需要同时维护多份可变状态
- 链式调用已经影响可读性

原则很简单：**能让意图更清晰，就用哪种。**

---

## 总结

| 概念 | 说明 |
|---|---|
| **迭代器** | 用统一方式按顺序处理一组元素 |
| **惰性** | 只描述流程，不会立刻执行 |
| **`next`** | 迭代器最核心的方法，每次返回一个元素或 `None` |
| **`iter`** | 产生不可变引用迭代器 |
| **`iter_mut`** | 产生可变引用迭代器 |
| **`into_iter`** | 产生拥有元素所有权的迭代器 |
| **消费适配器** | 如 `sum`、`collect`，会真正执行迭代 |
| **迭代器适配器** | 如 `map`、`filter`，返回新的迭代器 |
| **闭包** | 常与迭代器配合，用来描述每个元素的处理逻辑 |
| **自定义迭代器** | 只要实现 `next`，就能复用大量标准库能力 |

> **最佳实践**：优先把迭代器理解成“描述处理流程的管道”。先定义规则，再在末尾用 `collect`、`sum` 等方法触发执行。

---

## 知识自测

尝试独立回答以下问题，答案在下方。

---

**第 1 题**：为什么说 Rust 的迭代器是“惰性的”？请举一个不会真正执行的例子。

**第 2 题**：`for` 循环和 `next` 方法之间是什么关系？

**第 3 题**：`iter()`、`iter_mut()`、`into_iter()` 三者分别返回什么类型的元素？

**第 4 题**：为什么调用 `next()` 时，迭代器变量通常需要是 `mut`？

**第 5 题**：`map()` 和 `sum()` 有什么本质区别？

**第 6 题**：下面这段代码为什么不会产生结果？

```rust
let v = vec![1, 2, 3];
v.iter().map(|x| x + 1);
```

**第 7 题**：`filter()` 中的闭包返回值应该是什么类型？它的含义是什么？

**第 8 题**：为什么实现一个自定义迭代器时，最关键的是实现 `next()`？

**第 9 题**：下面这段代码最终结果为什么是 `18`？

```rust
let sum: u32 = Counter::new()
    .zip(Counter::new().skip(1))
    .map(|(a, b)| a * b)
    .filter(|x| x % 3 == 0)
    .sum();
```

**第 10 题**：什么情况下你会优先选择显式循环，而不是链式迭代器？

---

<details markdown="1">
<summary>📖 点击查看答案</summary>

**第 1 题答案**

因为迭代器只是在描述处理规则，只有被消费时才真正执行。例如：

```rust
let v = vec![1, 2, 3];
v.iter().map(|x| x + 1);
```

这里只有规则定义，没有消费，所以什么都不会发生。

---

**第 2 题答案**

`for` 循环本质上会不断调用迭代器的 `next()`，直到返回 `None`。因此可以把 `for` 看作迭代器的一层语法糖。

---

**第 3 题答案**

- `iter()` 返回 `&T`
- `iter_mut()` 返回 `&mut T`
- `into_iter()` 返回 `T`

它们分别对应只读借用、可变借用和所有权转移。

---

**第 4 题答案**

因为 `next()` 会改变迭代器内部状态，例如“当前读到第几个元素”。所以调用 `next()` 时，迭代器通常需要是可变的。

---

**第 5 题答案**

`map()` 是迭代器适配器，它返回一个新的迭代器；`sum()` 是消费适配器，它会真正跑完整个迭代器并返回最终结果。

---

**第 6 题答案**

因为 `map()` 返回的新迭代器没有被消费。迭代器是惰性的，不会自动执行。

---

**第 7 题答案**

返回值应该是 `bool`：

- `true` 表示保留该元素
- `false` 表示丢弃该元素

---

**第 8 题答案**

因为 `next()` 决定了：

- 每次产出什么元素
- 什么时候结束迭代

标准库里很多其他迭代器方法，底层都建立在 `next()` 之上。

---

**第 9 题答案**

流程如下：

- `Counter::new()` 产生 `1, 2, 3, 4, 5`
- `Counter::new().skip(1)` 产生 `2, 3, 4, 5`
- `zip` 后得到 `(1,2), (2,3), (3,4), (4,5)`
- 乘积得到 `2, 6, 12, 20`
- 过滤后保留 `6, 12`
- 求和得到 `18`

---

**第 10 题答案**

当控制流复杂、需要维护较多中间状态，或者链式调用已经明显影响可读性时，可以优先选择显式循环。

</details>

---

## 参考资料

- [The Rust Programming Language - Processing a Series of Items with Iterators](https://doc.rust-lang.org/book/ch13-02-iterators.html)
- [std::iter::Iterator](https://doc.rust-lang.org/std/iter/trait.Iterator.html)
- [Rust By Example - Iterators](https://doc.rust-lang.org/rust-by-example/trait/iter.html)

---
