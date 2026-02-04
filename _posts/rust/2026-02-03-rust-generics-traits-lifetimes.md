---
title: Rust 泛型、Trait 与生命周期
categories: [Rust, 进阶]
tags: [rust]
---

## 概述

泛型、trait 和生命周期是 Rust 中三个重要的概念,它们共同帮助我们编写灵活、可复用且安全的代码:

- **泛型 (Generics)**: 允许我们为函数、结构体、枚举和方法定义参数化类型,避免代码重复
- **Trait**: 定义共享的行为,类似于其他语言的接口,用于抽象类型的功能
- **生命周期 (Lifetimes)**: 确保引用在需要时始终有效,防止悬垂引用

本文将详细介绍这三个概念的语法和使用方法。

<!--more-->

## 泛型数据类型

### 在函数定义中使用泛型

当使用泛型定义函数时,我们在函数签名中通常为参数和返回值指定数据类型的位置放置泛型。这样编写的代码将更灵活,能向函数调用者提供更多功能,同时不引入重复代码。

#### 示例:寻找最大值

让我们看一个例子,展示两个功能相同但类型不同的函数:

**文件名: src/main.rs**

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

fn main() {
    let number_list = vec![34, 50, 25, 100, 65];
    let result = largest_i32(&number_list);
    println!("The largest number is {}", result);

    let char_list = vec!['y', 'm', 'a', 'q'];
    let result = largest_char(&char_list);
    println!("The largest char is {}", result);
}
```

这两个函数有着相同的代码,只是类型不同。让我们使用泛型来消除重复。

#### 泛型类型参数

为了定义泛型版本的函数,需要在函数名称与参数列表中间的尖括号 `<>` 中声明类型参数:

```rust
fn largest<T>(list: &[T]) -> T {
```

这可以理解为:函数 `largest` 有泛型类型 `T`。它有一个参数 `list`,类型是一个 `T` 值的 slice。`largest` 函数将返回一个与 `T` 相同类型的值。

**注意**: 按照惯例,Rust 的类型参数名通常很短(通常就一个字母),并遵循驼峰命名法。`T` 作为 "type" 的缩写是大部分 Rust 程序员的首选。

#### 带有 Trait Bound 的泛型函数

直接使用泛型可能无法编译,因为并非所有类型都支持比较操作。我们需要添加 trait bound,trait我们会在后续讲解:

**文件名: src/main.rs**

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

fn main() {
    let number_list = vec![34, 50, 25, 100, 65];
    let result = largest(&number_list);
    println!("The largest number is {}", result);

    let char_list = vec!['y', 'm', 'a', 'q'];
    let result = largest(&char_list);
    println!("The largest char is {}", result);
}
```

### 结构体定义中的泛型

同样可以使用 `<>` 语法来定义拥有一个或多个泛型参数类型字段的结构体。

#### 单个泛型参数

**文件名: src/main.rs**

```rust
struct Point<T> {
    x: T,
    y: T,
}

fn main() {
    let integer = Point { x: 5, y: 10 };
    let float = Point { x: 1.0, y: 4.0 };
}
```

注意 `Point<T>` 的定义中只使用了一个泛型类型,这意味着字段 `x` 和 `y` **必须是相同类型的**。

#### 多个泛型参数

如果想要 `x` 和 `y` 可以有不同类型,可以使用多个泛型类型参数:

**文件名: src/main.rs**

```rust
struct Point<T, U> {
    x: T,
    y: U,
}

fn main() {
    let both_integer = Point { x: 5, y: 10 };
    let both_float = Point { x: 1.0, y: 4.0 };
    let integer_and_float = Point { x: 5, y: 4.0 };
}
```

现在所有这些 `Point` 实例都是被允许的了!

**注意**: 虽然可以在定义中使用任意多的泛型类型参数,但太多的话代码将难以阅读和理解。当你的代码中需要许多泛型类型时,可能表明代码需要重组为更小的部分。

### 枚举定义中的泛型

枚举也可以在其成员中存放泛型数据类型。

#### Option<T> 枚举

```rust
enum Option<T> {
    Some(T),
    None,
}
```

`Option<T>` 是一个拥有泛型 `T` 的枚举,它有两个成员:
- `Some`: 存放了一个类型 `T` 的值
- `None`: 不存在任何值

#### Result<T, E> 枚举

枚举也可以拥有多个泛型类型:

```rust
enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

`Result` 枚举有两个泛型类型 `T` 和 `E`:
- `Ok`: 存放类型 `T` 的值(成功的结果)
- `Err`: 存放类型 `E` 的值(错误信息)

这个定义使得 `Result` 枚举能很方便地表达任何可能成功或失败的操作。

### 方法定义中的泛型

可以像第五章那样为定义中带有泛型的结构体或枚举实现方法。

#### 基本方法实现

**文件名: src/main.rs**

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

fn main() {
    let p = Point { x: 5, y: 10 };
    println!("p.x = {}", p.x());
}
```

**重点**: 必须在 `impl` 后面声明 `T`,这样就可以在 `Point<T>` 上实现的方法中使用它了。

#### 为特定类型实现方法

可以选择为特定的具体类型实现方法:

```rust
impl Point<f32> {
    fn distance_from_origin(&self) -> f32 {
        (self.x.powi(2) + self.y.powi(2)).sqrt()
    }
}
```

这段代码意味着 `Point<f32>` 类型会有 `distance_from_origin` 方法,而其他 `T` 不是 `f32` 类型的 `Point<T>` 实例则没有这个方法。

#### 混合不同的泛型参数

**文件名: src/main.rs**

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

fn main() {
    let p1 = Point { x: 5, y: 10.4 };
    let p2 = Point { x: "Hello", y: 'c'};

    let p3 = p1.mixup(p2);
    println!("p3.x = {}, p3.y = {}", p3.x, p3.y);
}
```

这个例子展示了:
- 泛型参数 `T` 和 `U` 声明于 `impl` 之后(与结构体定义相对应)
- 泛型参数 `V` 和 `W` 声明于 `fn mixup` 之后(只对方法本身相关)

### 泛型代码的性能

使用泛型类型参数的代码相比使用具体类型**没有任何速度上的损失**!

#### 单态化 (Monomorphization)

Rust 通过在编译时进行泛型代码的**单态化**来保证效率。单态化是一个通过填充编译时使用的具体类型,将通用代码转换为特定代码的过程。

**示例**:

```rust
let integer = Some(5);
let float = Some(5.0);
```

当 Rust 编译这些代码时,它会进行单态化,将泛型定义 `Option<T>` 展开为:

```rust
enum Option_i32 {
    Some(i32),
    None,
}

enum Option_f64 {
    Some(f64),
    None,
}

fn main() {
    let integer = Option_i32::Some(5);
    let float = Option_f64::Some(5.0);
}
```

我们可以使用泛型来编写不重复的代码,而 Rust 将会为每一个实例编译其特定类型的代码。这意味着在使用泛型时**没有运行时开销**!

---

## Trait: 定义共享的行为

trait 告诉 Rust 编译器某个特定类型拥有可能与其他类型共享的功能。可以通过 trait 以一种抽象的方式定义共享的行为。可以使用 trait bounds 指定泛型是任何拥有特定行为的类型。

**注意**: trait 类似于其他语言中常被称为**接口 (interfaces)** 的功能,虽然有一些不同。

### 定义 Trait

一个类型的行为由其可供调用的方法构成。如果可以对不同类型调用相同的方法,这些类型就可以共享相同的行为。trait 定义是一种将方法签名组合起来的方法,目的是定义一个实现某些目的所必需的行为的集合。

#### 示例: Summary Trait

**文件名: src/lib.rs**

```rust
pub trait Summary {
    fn summarize(&self) -> String;
}
```

这里使用 `trait` 关键字来声明一个 trait,后面是 trait 的名字。在大括号中声明描述实现这个 trait 的类型所需要的行为的方法签名。

**要点**:
- 方法签名后跟分号,而不是在大括号中提供实现
- 每个实现这个 trait 的类型都需要提供其自定义行为的方法体
- trait 体中可以有多个方法,一行一个方法签名且都以分号结尾

### 为类型实现 Trait

现在我们定义了 `Summary` trait,接着可以在需要拥有这个行为的类型上实现它。

**文件名: src/lib.rs**

```rust
pub struct NewsArticle {
    pub headline: String,
    pub location: String,
    pub author: String,
    pub content: String,
}

impl Summary for NewsArticle {
    fn summarize(&self) -> String {
        format!("{}, by {} ({})", self.headline, self.author, self.location)
    }
}

pub struct Tweet {
    pub username: String,
    pub content: String,
    pub reply: bool,
    pub retweet: bool,
}

impl Summary for Tweet {
    fn summarize(&self) -> String {
        format!("{}: {}", self.username, self.content)
    }
}
```

在类型上实现 trait 类似于实现与 trait 无关的方法。区别在于 `impl` 关键字之后,我们提供需要实现 trait 的名称,接着是 `for` 和需要实现 trait 的类型的名称。

#### 使用 Trait 方法

一旦实现了 trait,就可以用与普通方法一样的方式调用 trait 方法:

```rust
let tweet = Tweet {
    username: String::from("horse_ebooks"),
    content: String::from("of course, as you probably already know, people"),
    reply: false,
    retweet: false,
};

println!("1 new tweet: {}", tweet.summarize());
```

这会打印出: `1 new tweet: horse_ebooks: of course, as you probably already know, people`

#### 孤儿规则 (Orphan Rule)

实现 trait 时需要注意的一个限制是,**只有当 trait 或者要实现 trait 的类型位于 crate 的本地作用域时,才能为该类型实现 trait**。

**可以这样做**:
- 为 `aggregator` crate 的自定义类型 `Tweet` 实现标准库中的 `Display` trait
- 在 `aggregator` crate 中为 `Vec<T>` 实现 `Summary` trait

**不能这样做**:
- 在 `aggregator` crate 中为 `Vec<T>` 实现 `Display` trait(因为 `Display` 和 `Vec<T>` 都定义于标准库中)

这个限制是被称为**相干性 (coherence)** 的程序属性的一部分,或者更具体地说是**孤儿规则 (orphan rule)**。这条规则确保了其他人编写的代码不会破坏你的代码,反之亦然。

### 默认实现

有时为 trait 中的某些或全部方法提供默认的行为是很有用的。

**文件名: src/lib.rs**

```rust
pub trait Summary {
    fn summarize(&self) -> String {
        String::from("(Read more...)")
    }
}
```

如果想要对 `NewsArticle` 实例使用这个默认实现,可以通过指定一个空的 `impl` 块:

```rust
impl Summary for NewsArticle {}
```

现在仍然可以对 `NewsArticle` 实例调用 `summarize` 方法:

```rust
let article = NewsArticle {
    headline: String::from("Penguins win the Stanley Cup Championship!"),
    location: String::from("Pittsburgh, PA, USA"),
    author: String::from("Iceburgh"),
    content: String::from("The Pittsburgh Penguins once again are the best hockey team in the NHL."),
};

println!("New article available! {}", article.summarize());
```

这段代码会打印: `New article available! (Read more...)`

#### 默认实现调用其他方法

默认实现允许调用相同 trait 中的其他方法,哪怕这些方法没有默认实现:

```rust
pub trait Summary {
    fn summarize_author(&self) -> String;

    fn summarize(&self) -> String {
        format!("(Read more from {}...)", self.summarize_author())
    }
}
```

为了使用这个版本的 `Summary`,只需在实现 trait 时定义 `summarize_author` 即可:

```rust
impl Summary for Tweet {
    fn summarize_author(&self) -> String {
        format!("@{}", self.username)
    }
}
```

现在可以调用 `summarize` 了:

```rust
let tweet = Tweet {
    username: String::from("horse_ebooks"),
    content: String::from("of course, as you probably already know, people"),
    reply: false,
    retweet: false,
};

println!("1 new tweet: {}", tweet.summarize());
```

这会打印出: `1 new tweet: (Read more from @horse_ebooks...)`

**注意**: 无法从相同方法的重载实现中调用默认方法。

### Trait 作为参数

知道了如何定义 trait 和在类型上实现这些 trait 之后,我们可以探索如何使用 trait 来接受多种不同类型的参数。

#### impl Trait 语法

```rust
pub fn notify(item: impl Summary) {
    println!("Breaking news! {}", item.summarize());
}
```

对于 `item` 参数,我们指定了 `impl` 关键字和 trait 名称,而不是具体的类型。该参数支持任何实现了指定 trait 的类型。

#### Trait Bound 语法

`impl Trait` 语法是一个较长形式的语法糖,这被称为 **trait bound**:

```rust
pub fn notify<T: Summary>(item: T) {
    println!("Breaking news! {}", item.summarize());
}
```

这与之前的例子相同,不过稍微冗长了一些。trait bound 与泛型参数声明在一起,位于尖括号中的冒号后面。

**何时使用 Trait Bound**:

对于简单情况,`impl Trait` 很方便:

```rust
pub fn notify(item1: impl Summary, item2: impl Summary) {
```

但如果希望强制两个参数是相同类型,只能使用 trait bound:

```rust
pub fn notify<T: Summary>(item1: T, item2: T) {
```

#### 通过 + 指定多个 Trait Bound

如果需要同时实现两个不同的 trait,可以使用 `+` 语法:

```rust
pub fn notify(item: impl Summary + Display) {
    println!("Breaking news! {}", item.summarize());
}
```

`+` 语法也适用于泛型的 trait bound:

```rust
pub fn notify<T: Summary + Display>(item: T) {
    println!("Breaking news! {}", item.summarize());
}
```

#### 通过 where 简化 Trait Bound

当有多个泛型参数时,trait bound 信息会使函数签名难以阅读:

```rust
fn some_function<T: Display + Clone, U: Clone + Debug>(t: T, u: U) -> i32 {
```

可以使用 `where` 从句来简化:

```rust
fn some_function<T, U>(t: T, u: U) -> i32
where
    T: Display + Clone,
    U: Clone + Debug
{
    // 函数体
}
```

这个函数签名更清晰,函数名、参数列表和返回值类型都离得很近。

### 返回实现了 Trait 的类型

也可以在返回值中使用 `impl Trait` 语法,来返回实现了某个 trait 的类型:

```rust
fn returns_summarizable() -> impl Summary {
    Tweet {
        username: String::from("horse_ebooks"),
        content: String::from("of course, as you probably already know, people"),
        reply: false,
        retweet: false,
    }
}
```

通过使用 `impl Summary` 作为返回值类型,我们指定了 `returns_summarizable` 函数返回某个实现了 `Summary` trait 的类型,但不确定其具体的类型。

**限制**: 这只适用于返回单一类型的情况。以下代码无法编译:

```rust
// 这些代码不能编译！
fn returns_summarizable(switch: bool) -> impl Summary {
    if switch {
        NewsArticle {
            // ...
        }
    } else {
        Tweet {
            // ...
        }
    }
}
```

### 使用 Trait Bound 有条件地实现方法

通过使用带有 trait bound 的泛型参数的 `impl` 块,可以有条件地只为那些实现了特定 trait 的类型实现方法。

```rust
use std::fmt::Display;

struct Pair<T> {
    x: T,
    y: T,
}

impl<T> Pair<T> {
    fn new(x: T, y: T) -> Self {
        Self { x, y }
    }
}

impl<T: Display + PartialOrd> Pair<T> {
    fn cmp_display(&self) {
        if self.x >= self.y {
            println!("The largest member is x = {}", self.x);
        } else {
            println!("The largest member is y = {}", self.y);
        }
    }
}
```

类型 `Pair<T>` 总是实现了 `new` 方法,但只有那些为 `T` 类型实现了 `PartialOrd` trait 和 `Display` trait 的 `Pair<T>` 才会实现 `cmp_display` 方法。

#### Blanket Implementations

也可以对任何实现了特定 trait 的类型有条件地实现 trait。这被称为 **blanket implementations**。

例如,标准库为任何实现了 `Display` trait 的类型实现了 `ToString` trait:

```rust
impl<T: Display> ToString for T {
    // --snip--
}
```

因为标准库有了这些 blanket implementation,我们可以对任何实现了 `Display` trait 的类型调用 `to_string` 方法:

```rust
let s = 3.to_string();
```

---

## 生命周期与引用有效性

Rust 中的每一个引用都有其**生命周期 (lifetime)**,也就是引用保持有效的作用域。大部分时候生命周期是隐含并可以推断的,正如大部分时候类型也是可以推断的一样。

当引用的生命周期以不同方式相关联时,我们需要使用泛型生命周期参数来注明它们的关系,这样就能确保运行时实际使用的引用绝对是有效的。

### 生命周期避免了悬垂引用

生命周期的主要目标是**避免悬垂引用**,它会导致程序引用了非预期引用的数据。

#### 示例: 悬垂引用

```rust
// 这些代码不能编译！
{
    let r;

    {
        let x = 5;
        r = &x;
    }

    println!("r: {}", r);
}
```

**错误信息**:

```
error[E0597]: `x` does not live long enough
  --> src/main.rs:7:5
   |
6  |         r = &x;
   |              - borrow occurs here
7  |     }
   |     ^ `x` dropped here while still borrowed
...
10 | }
   | - borrowed value needs to live until here
```

变量 `x` 并没有 "存在得足够久"。当 `x` 在内部作用域结束时就离开了作用域,但 `r` 在外部作用域仍然有效。如果 Rust 允许这段代码工作,`r` 将会引用在 `x` 离开作用域时被释放的内存。

### 借用检查器

Rust 编译器有一个**借用检查器 (borrow checker)**,它比较作用域来确保所有的借用都是有效的。

#### 无效的引用示例

```rust
// 这些代码不能编译！
{
    let r;                // ---------+-- 'a
                          //          |
    {                     //          |
        let x = 5;        // -+-- 'b  |
        r = &x;           //  |       |
    }                     // -+       |
                          //          |
    println!("r: {}", r); //          |
}                         // ---------+
```

这里将 `r` 的生命周期标记为 `'a`,将 `x` 的生命周期标记为 `'b`。内部的 `'b` 块要比外部的生命周期 `'a` 小得多。编译时,Rust 比较这两个生命周期的大小,并发现 `r` 拥有生命周期 `'a`,但它引用了一个拥有生命周期 `'b` 的对象。程序被拒绝编译,因为 `'b` 比 `'a` 要小:被引用的对象比它的引用者存在的时间更短。

#### 有效的引用示例

```rust
{
    let x = 5;            // ----------+-- 'b
                          //           |
    let r = &x;           // --+-- 'a  |
                          //   |       |
    println!("r: {}", r); //   |       |
                          // --+       |
}                         // ----------+
```

这里 `x` 拥有生命周期 `'b`,比 `'a` 要大。这意味着 `r` 可以引用 `x`:Rust 知道 `r` 中的引用在 `x` 有效的时候也总是有效的。

### 函数中的泛型生命周期

让我们编写一个返回两个字符串 slice 中较长者的函数。

#### 函数签名

**文件名: src/main.rs**

```rust
fn main() {
    let string1 = String::from("abcd");
    let string2 = "xyz";

    let result = longest(string1.as_str(), string2);
    println!("The longest string is {}", result);
}
```

#### 第一次尝试(编译失败)

```rust
// 这些代码不能编译！
fn longest(x: &str, y: &str) -> &str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

**错误信息**:

```
error[E0106]: missing lifetime specifier
 --> src/main.rs:1:33
  |
1 | fn longest(x: &str, y: &str) -> &str {
  |                                 ^ expected lifetime parameter
  |
  = help: this function's return type contains a borrowed value, but the
  signature does not say whether it is borrowed from `x` or `y`
```

提示文本揭示了返回值需要一个泛型生命周期参数,因为 Rust 并不知道将要返回的引用是指向 `x` 或 `y`。

### 生命周期注解语法

生命周期注解并不改变任何引用的生命周期的长短。与当函数签名中指定了泛型类型参数后就可以接受任何类型一样,当指定了泛型生命周期后函数也能接受任何生命周期的引用。生命周期注解描述了多个引用生命周期相互的关系,而不影响其生命周期。

#### 语法规则

生命周期注解有着一个不太常见的语法:
- 生命周期参数名称必须以撇号 (`'`) 开头
- 其名称通常全是小写
- 类似于泛型,名称非常短
- `'a` 是大多数人默认使用的名称

#### 示例

```rust
&i32        // 引用
&'a i32     // 带有显式生命周期的引用
&'a mut i32 // 带有显式生命周期的可变引用
```

单个的生命周期注解本身没有多少意义。生命周期注解告诉 Rust 多个引用的泛型生命周期参数如何相互联系。

### 函数签名中的生命周期注解

现在来修复 `longest` 函数。就像泛型类型参数,泛型生命周期参数需要声明在函数名和参数列表间的尖括号中:

**文件名: src/main.rs**

```rust
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

这段代码能够编译并会产生我们希望得到的结果。

#### 含义说明

函数签名表明:
- 对于某些生命周期 `'a`,函数会获取两个参数
- 两个参数都是与生命周期 `'a` 存在得一样长的字符串 slice
- 函数会返回一个同样也与生命周期 `'a` 存在得一样长的字符串 slice

记住:
- 通过在函数签名中指定生命周期参数时,我们并没有改变任何传入或返回的值的生命周期
- 而是指出任何不遵守这个协议的传入值都将被借用检查器拒绝

**关键点**: 当具体的引用被传递给 `longest` 时,被 `'a` 所替代的具体生命周期是 `x` 的作用域与 `y` 的作用域相重叠的那一部分。换句话说,泛型生命周期 `'a` 的具体生命周期等同于 `x` 和 `y` 的生命周期中较小的那一个。

#### 使用示例 1: 有效的引用

**文件名: src/main.rs**

```rust
fn main() {
    let string1 = String::from("long string is long");

    {
        let string2 = String::from("xyz");
        let result = longest(string1.as_str(), string2.as_str());
        println!("The longest string is {}", result);
    }
}
```

在这个例子中,`string1` 直到外部作用域结束都是有效的,`string2` 则在内部作用域中是有效的,而 `result` 引用了一些直到内部作用域结束都是有效的值。借用检查器认可这些代码,能够编译和运行。

#### 使用示例 2: 无效的引用

```rust
// 这些代码不能编译！
fn main() {
    let string1 = String::from("long string is long");
    let result;
    {
        let string2 = String::from("xyz");
        result = longest(string1.as_str(), string2.as_str());
    }
    println!("The longest string is {}", result);
}
```

**错误信息**:

```
error[E0597]: `string2` does not live long enough
  --> src/main.rs:15:5
   |
14 |         result = longest(string1.as_str(), string2.as_str());
   |                                            ------- borrow occurs here
15 |     }
   |     ^ `string2` dropped here while still borrowed
16 |     println!("The longest string is {}", result);
17 | }
   | - borrowed value needs to live until here
```

错误表明为了保证 `println!` 中的 `result` 是有效的,`string2` 需要直到外部作用域结束都是有效的。

### 深入理解生命周期

指定生命周期参数的正确方式依赖函数实现的具体功能。

#### 示例: 总是返回第一个参数

```rust
fn longest<'a>(x: &'a str, y: &str) -> &'a str {
    x
}
```

在这个例子中,我们为参数 `x` 和返回值指定了生命周期参数 `'a`,但没有为参数 `y` 指定,因为 `y` 的生命周期与参数 `x` 和返回值的生命周期没有任何关系。

#### 返回值必须与参数关联

当从函数返回一个引用,返回值的生命周期参数需要与一个参数的生命周期参数相匹配。如果返回的引用**没有**指向任何一个参数,那么唯一的可能就是它指向一个函数内部创建的值,它将会是一个悬垂引用:

```rust
// 这些代码不能编译！
fn longest<'a>(x: &str, y: &str) -> &'a str {
    let result = String::from("really long string");
    result.as_str()
}
```

即便我们为返回值指定了生命周期参数 `'a`,这个实现却编译失败了,因为返回值的生命周期与参数完全没有关联。

**最佳实践**: 在这种情况,最好的解决方案是返回一个有所有权的数据类型而不是一个引用,这样函数调用者就需要负责清理这个值了。

### 结构体定义中的生命周期注解

目前为止,我们只定义过有所有权类型的结构体。我们也可以定义包含引用的结构体,不过需要为结构体定义中的每一个引用添加生命周期注解。

**文件名: src/main.rs**

```rust
struct ImportantExcerpt<'a> {
    part: &'a str,
}

fn main() {
    let novel = String::from("Call me Ishmael. Some years ago...");
    let first_sentence = novel.split('.')
        .next()
        .expect("Could not find a '.'");
    let i = ImportantExcerpt { part: first_sentence };
}
```

这个结构体有一个字段 `part`,它存放了一个字符串 slice(一个引用)。类似于泛型参数类型,必须在结构体名称后面的尖括号中声明泛型生命周期参数,以便在结构体定义中使用生命周期参数。

这个注解意味着 `ImportantExcerpt` 的实例不能比其 `part` 字段中的引用存在得更久。

### 生命周期省略 (Lifetime Elision)

在早期版本的 Rust 中,每一个引用都必须有明确的生命周期。例如:

```rust
fn first_word<'a>(s: &'a str) -> &'a str {
```

在编写了很多 Rust 代码后,Rust 团队发现在特定情况下 Rust 程序员们总是重复地编写一模一样的生命周期注解。这些场景是可预测的并且遵循几个明确的模式。Rust 团队就把这些模式编码进了 Rust 编译器中,如此借用检查器在这些情况下就能推断出生命周期而不再强制程序员显式地增加注解。

#### 生命周期省略规则

被编码进 Rust 引用分析的模式被称为**生命周期省略规则 (lifetime elision rules)**。编译器采用三条规则来判断引用何时不需要明确的注解:

**规则 1**: 每一个是引用的参数都有它自己的生命周期参数
- 一个引用参数: `fn foo<'a>(x: &'a i32)`
- 两个引用参数: `fn foo<'a, 'b>(x: &'a i32, y: &'b i32)`

**规则 2**: 如果只有一个输入生命周期参数,那么它被赋予所有输出生命周期参数
- `fn foo<'a>(x: &'a i32) -> &'a i32`

**规则 3**: 如果方法有多个输入生命周期参数并且其中一个参数是 `&self` 或 `&mut self`,那么所有输出生命周期参数被赋予 `self` 的生命周期
- 使得方法更容易读写

#### 示例 1: first_word

开始时:

```rust
fn first_word(s: &str) -> &str {
```

应用规则 1 - 每个引用参数都有其自己的生命周期:

```rust
fn first_word<'a>(s: &'a str) -> &str {
```

应用规则 2 - 因为只有一个输入生命周期参数,将其赋予输出生命周期参数:

```rust
fn first_word<'a>(s: &'a str) -> &'a str {
```

现在所有引用都有了生命周期,编译器可以继续分析而无须程序员标记生命周期。

#### 示例 2: longest

开始时:

```rust
fn longest(x: &str, y: &str) -> &str {
```

应用规则 1 - 每个引用参数都有其自己的生命周期:

```rust
fn longest<'a, 'b>(x: &'a str, y: &'b str) -> &str {
```

应用规则 2 - 因为有多个输入生命周期,规则 2 不适用。

应用规则 3 - 因为没有 `self` 参数,规则 3 不适用。

应用了三个规则之后编译器还没有计算出返回值类型的生命周期,这就是为什么会出现错误的原因。我们需要手动标记生命周期。

### 方法定义中的生命周期注解

当为带有生命周期的结构体实现方法时,其语法依然类似泛型类型参数的语法。

#### 基本方法

```rust
impl<'a> ImportantExcerpt<'a> {
    fn level(&self) -> i32 {
        3
    }
}
```

`impl` 之后和类型名称之后的生命周期参数是必要的,但因为第一条生命周期规则,我们并不必须标注 `self` 引用的生命周期。

#### 应用第三条规则的例子

```rust
impl<'a> ImportantExcerpt<'a> {
    fn announce_and_return_part(&self, announcement: &str) -> &str {
        println!("Attention please: {}", announcement);
        self.part
    }
}
```

这里有两个输入生命周期,所以 Rust 应用第一条生命周期省略规则并给予 `&self` 和 `announcement` 它们各自的生命周期。接着,因为其中一个参数是 `&self`,返回值类型被赋予了 `&self` 的生命周期,这样所有的生命周期都被计算出来了。

### 静态生命周期

有一种特殊的生命周期值得讨论:`'static`,其生命周期能够存活于整个程序期间。所有的字符串字面值都拥有 `'static` 生命周期:

```rust
let s: &'static str = "I have a static lifetime.";
```

这个字符串的文本被直接储存在程序的二进制文件中,而这个文件总是可用的。因此所有的字符串字面值都是 `'static` 的。

**注意**: 你可能在错误信息的帮助文本中见过使用 `'static` 生命周期的建议,但将引用指定为 `'static` 之前,思考一下这个引用是否真的在整个程序的生命周期里都有效。大部分情况,代码中的问题是尝试创建一个悬垂引用或者可用的生命周期不匹配,请解决这些问题而不是指定一个 `'static` 的生命周期。

### 结合泛型类型参数、Trait Bounds 和生命周期

让我们看一下在同一函数中指定泛型类型参数、trait bounds 和生命周期的语法:

```rust
use std::fmt::Display;

fn longest_with_an_announcement<'a, T>(x: &'a str, y: &'a str, ann: T) -> &'a str
where
    T: Display
{
    println!("Announcement! {}", ann);
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

这个函数:
- 返回两个字符串 slice 中较长者
- 带有一个额外的参数 `ann`
- `ann` 的类型是泛型 `T`,可以被放入任何实现了 `Display` trait 的类型
- 因为生命周期也是泛型,所以生命周期参数 `'a` 和泛型类型参数 `T` 都位于函数名后的同一尖括号列表中

---

## 总结

本章介绍了很多内容!现在你知道了:

1. **泛型类型参数**: 代码可以适用于不同的类型,避免重复代码
2. **Trait 和 Trait Bounds**: 保证了即使类型是泛型的,这些类型也会拥有所需要的行为
3. **生命周期注解**: 指定引用生命周期之间的关系,保证了灵活多变的代码不会出现悬垂引用

所有这一切都发生在编译时,所以不会影响运行时效率!

### 后续学习

- 第十七章会讨论 **trait 对象**,这是另一种使用 trait 的方式
- 第十九章会涉及到生命周期注解更复杂的场景
- 第二十章讲解一些高级的类型系统功能

接下来,让我们学习如何在 Rust 中编写测试,来确保代码的所有功能能像我们希望的那样工作!

---

## 参考资料

- [The Rust Programming Language - Generic Types, Traits, and Lifetimes](https://doc.rust-lang.org/book/ch10-00-generics.html)
- [Generic Data Types](https://doc.rust-lang.org/book/ch10-01-syntax.html)
- [Traits: Defining Shared Behavior](https://doc.rust-lang.org/book/ch10-02-traits.html)
- [Validating References with Lifetimes](https://doc.rust-lang.org/book/ch10-03-lifetime-syntax.html)
- [Advanced Lifetimes](https://doc.rust-lang.org/book/ch19-02-advanced-lifetimes.html)
- [Trait Objects](https://doc.rust-lang.org/book/ch17-02-trait-objects.html)

---
