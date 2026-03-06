---
title: rust文档-方法语法和枚举
categories: [Rust, 所有权与借用]
tags: [rust]
---


# Rust 方法语法详解

> **核心概念**：方法是定义在结构体（或枚举、trait 对象）上下文中的函数，它们的第一个参数总是 `self`，代表调用该方法的结构体实例。

## 一、方法与函数的区别

方法与函数类似：它们使用 `fn` 关键字和名称声明，可以拥有参数和返回值，同时包含在某处调用该方法时会执行的代码。

**关键区别**：
- 方法在结构体的上下文中被定义（或者是枚举或 trait 对象的上下文）
- 方法的第一个参数总是 `self`，它代表调用该方法的结构体实例

## 二、定义方法

### 基本示例

让我们把获取一个 `Rectangle` 实例作为参数的 `area` 函数，改写成一个定义于 `Rectangle` 结构体上的 `area` 方法：

```rust
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn area(&self) -> u32 {
        self.width * self.height
    }
}

fn main() {
    let rect1 = Rectangle { width: 30, height: 50 };

    println!(
        "The area of the rectangle is {} square pixels.",
        rect1.area()
    );
}
```

### 关键点说明

1. **`impl` 块**：`impl` 是 implementation 的缩写，用于在结构体的上下文中定义方法
2. **`self` 参数**：在 `impl Rectangle` 上下文中，Rust 知道 `self` 的类型是 `Rectangle`，所以不需要显式声明类型
3. **方法调用语法**：使用 `实例.方法名()` 的方式调用，如 `rect1.area()`

### `self` 的三种形式

方法可以选择获取 `self` 的所有权，或者不可变地借用 `self`，或者可变地借用 `self`：

```rust
impl Rectangle {
    // 不可变借用（最常用）
    fn area(&self) -> u32 {
        self.width * self.height
    }

    // 可变借用（需要修改实例时使用）
    fn double_size(&mut self) {
        self.width *= 2;
        self.height *= 2;
    }

    // 获取所有权（很少见，通常用于转换）
    fn into_tuple(self) -> (u32, u32) {
        (self.width, self.height)
    }
}
```

**选择原则**：
- **`&self`**：只读取数据，不修改（最常用）
- **`&mut self`**：需要修改实例数据时使用
- **`self`**：需要获取所有权时使用（通常用于将 `self` 转换成其他类型）

### 方法 vs 函数的优势

使用方法替代函数的主要好处：
1. **方法语法更简洁**：`rect1.area()` 比 `area(&rect1)` 更清晰
2. **不需要重复类型**：不需要在每个函数签名中重复 `self` 的类型
3. **更好的组织性**：将某个类型实例能做的所有事情都一起放入 `impl` 块中

## 三、自动引用和解引用

### Rust 没有 `->` 运算符

在 C/C++ 语言中，有两个不同的运算符来调用方法：
- `.` 直接在对象上调用方法
- `->` 在一个对象的指针上调用方法

Rust 并没有一个与 `->` 等效的运算符；相反，Rust 有一个叫**自动引用和解引用（automatic referencing and dereferencing）**的功能。

### 工作原理

当使用 `object.something()` 调用方法时，Rust 会自动为 `object` 添加 `&`、`&mut` 或 `*` 以便使 `object` 与方法签名匹配。

```rust
// 这两种写法是等价的
p1.distance(&p2);
(&p1).distance(&p2);

// Rust 会自动处理以下情况：
let rect = Rectangle { width: 10, height: 20 };
let rect_ref = &rect;
let rect_mut = &mut rect;

// 所有这些调用都是有效的
rect.area();        // 自动添加 &
rect_ref.area();   // 自动解引用
rect_mut.area();   // 自动解引用
```

**为什么有效？**
- 方法有一个明确的接收者——`self` 的类型
- Rust 可以根据方法签名（`&self`、`&mut self` 或 `self`）自动推断需要添加的引用或解引用
- 这种隐式借用让所有权在实践中更友好

## 四、带有更多参数的方法

方法可以在 `self` 后增加多个参数，这些参数就像函数中的参数一样工作。

### 示例：`can_hold` 方法

```rust
impl Rectangle {
    fn area(&self) -> u32 {
        self.width * self.height
    }

    fn can_hold(&self, other: &Rectangle) -> bool {
        self.width > other.width && self.height > other.height
    }
}

fn main() {
    let rect1 = Rectangle { width: 30, height: 50 };
    let rect2 = Rectangle { width: 10, height: 40 };
    let rect3 = Rectangle { width: 60, height: 45 };

    println!("Can rect1 hold rect2? {}", rect1.can_hold(&rect2));  // true
    println!("Can rect1 hold rect3? {}", rect1.can_hold(&rect3));  // false
}
```

**说明**：
- `can_hold` 方法接受另一个 `Rectangle` 的不可变借用作为参数
- 使用 `&Rectangle` 是因为我们只需要读取数据，不需要所有权
- 调用后 `rect2` 和 `rect3` 仍然可以使用

## 五、关联函数

### 定义

**关联函数（associated functions）**是在 `impl` 块中定义的**不以 `self` 作为参数的函数**。它们与结构体相关联，但不是方法（因为它们不作用于一个结构体的实例）。

你已经使用过关联函数了：`String::from` 就是一个关联函数。

### 关联函数的返回值

**关联函数可以返回任何类型**，不一定要返回结构体本身。不过，关联函数经常被用作返回一个结构体新实例的构造函数：

```rust
impl Rectangle {
    // 关联函数：创建正方形（返回 Rectangle）
    fn square(size: u32) -> Rectangle {
        Rectangle { width: size, height: size }
    }

    // 关联函数：创建指定宽高的矩形（返回 Rectangle）
    fn new(width: u32, height: u32) -> Rectangle {
        Rectangle { width, height }
    }

    // 关联函数：返回其他类型
    fn max_area() -> u32 {
        u32::MAX
    }

    // 关联函数：返回字符串
    fn type_name() -> &'static str {
        "Rectangle"
    }
}

fn main() {
    // 使用 :: 语法调用关联函数
    let sq = Rectangle::square(3);
    let rect = Rectangle::new(10, 20);
    let max = Rectangle::max_area();
    let name = Rectangle::type_name();
}
```

### 调用语法对比

| 符号 | 名称 | 用途 | 调用对象 | 第一个参数 | 示例 |
|------|------|------|----------|-----------|------|
| `.` | 点号 | 调用**方法** | **实例** | `self`/`&self`/`&mut self` | `rect.area()` |
| `::` | 双冒号 | 调用**关联函数** | **类型** | 无 `self` | `Rectangle::square(3)` |

**记忆技巧：**
- `.` = 实例的行为（"这个对象做什么"）
- `::` = 类型的功能（"这个类型提供什么"）

**示例：**
- **方法**：使用 `.` 语法，如 `rect.area()`
- **关联函数**：使用 `::` 语法，如 `Rectangle::square(3)`

`::` 语法用于关联函数和模块创建的命名空间。

## 六、多个 `impl` 块

每个结构体都允许拥有多个 `impl` 块：

```rust
impl Rectangle {
    fn area(&self) -> u32 {
        self.width * self.height
    }
}

impl Rectangle {
    fn can_hold(&self, other: &Rectangle) -> bool {
        self.width > other.width && self.height > other.height
    }
}
```

**说明**：
- 这里没有理由将这些方法分散在多个 `impl` 块中，不过这是有效的语法
- 在讨论泛型和 trait 时会看到实用的多 `impl` 块的用例（例如为不同的泛型参数实现不同的方法）

## 七、总结

### 核心要点

1. **方法**：定义在 `impl` 块中，第一个参数是 `self`
2. **`self` 的三种形式**：`&self`（不可变借用）、`&mut self`（可变借用）、`self`（获取所有权）
3. **自动引用和解引用**：Rust 会自动处理方法的调用，无需手动添加 `&` 或 `*`
4. **关联函数**：不以 `self` 为参数的函数，通常用作构造函数，使用 `::` 语法调用
5. **多个 `impl` 块**：允许为同一个结构体定义多个 `impl` 块

### 方法 vs 函数 vs 关联函数

| 类型 | 第一个参数 | 调用语法 | 用途 |
|------|-----------|---------|------|
| **方法** | `self`、`&self` 或 `&mut self` | `实例.方法名()` | 操作结构体实例 |
| **关联函数** | 无 `self` | `结构体名::函数名()` | 构造函数、工具函数 |
| **普通函数** | 无特殊要求 | `函数名()` | 独立的功能 |

### 实际应用

结构体让你可以创建出在你的领域中有意义的自定义类型。通过结构体，我们可以将相关联的数据片段联系起来并命名它们，这样可以使得代码更加清晰。方法允许为结构体实例指定行为，而关联函数将特定功能置于结构体的命名空间中并且无需一个实例。


---

# Rust 枚举（Enum）详解

> **核心概念**：枚举允许你定义一个类型，该类型可以是多个可能值中的一个。每个可能的值被称为枚举的**成员（variant）**。

## 一、为什么需要枚举？

### 使用场景示例：IP 地址

假设我们要处理 IP 地址。目前被广泛使用的两个主要 IP 标准：IPv4 和 IPv6。

**关键特性**：
- 任何一个 IP 地址要么是 IPv4 的要么是 IPv6 的，而且不能两者都是
- IPv4 和 IPv6 从根本上讲仍是 IP 地址，应该被当作相同的类型处理

这个特性使得枚举数据结构非常适合这个场景，因为枚举值只可能是其中一个成员。

## 二、定义枚举

### 基本语法

```rust
enum IpAddrKind {
    V4,
    V6,
}
```

现在 `IpAddrKind` 就是一个可以在代码中使用的自定义数据类型了。

### 创建枚举值

枚举的成员位于其标识符的命名空间中，并使用两个冒号 `::` 分开：

```rust
let four = IpAddrKind::V4;
let six = IpAddrKind::V6;
```

**关键点**：
- `IpAddrKind::V4` 和 `IpAddrKind::V6` 都是 `IpAddrKind` 类型的
- 可以使用任一成员作为函数参数

```rust
fn route(ip_type: IpAddrKind) {
    // 处理 IP 地址类型
}

route(IpAddrKind::V4);
route(IpAddrKind::V6);
```
## 三、枚举与数据关联

### 方法一：使用结构体（不推荐）

```rust
enum IpAddrKind {
    V4,
    V6,
}

struct IpAddr {
    kind: IpAddrKind,
    address: String,
}

let home = IpAddr {
    kind: IpAddrKind::V4,
    address: String::from("127.0.0.1"),
};

let loopback = IpAddr {
    kind: IpAddrKind::V6,
    address: String::from("::1"),
};
```

这种方式需要额外的结构体，不够简洁。

### 方法二：直接在枚举成员中关联数据（推荐）

```rust
enum IpAddr {
    V4(String),
    V6(String),
}

let home = IpAddr::V4(String::from("127.0.0.1"));
let loopback = IpAddr::V6(String::from("::1"));
```

**优势**：直接将数据附加到枚举的每个成员上，不需要额外的结构体。

### 方法三：不同成员关联不同类型的数据

枚举的另一个优势：每个成员可以处理不同类型和数量的数据。

```rust
enum IpAddr {
    V4(u8, u8, u8, u8),  // IPv4 用四个 u8 值
    V6(String),          // IPv6 用字符串
}

let home = IpAddr::V4(127, 0, 0, 1);
let loopback = IpAddr::V6(String::from("::1"));
```

**说明**：IPv4 地址总是含有四个值在 0 和 255 之间的数字部分，所以用 `(u8, u8, u8, u8)` 更合适。

### 标准库中的 IpAddr

标准库提供了 `IpAddr` 的定义，它将成员中的地址数据嵌入到了两个不同形式的结构体中：

```rust
struct Ipv4Addr {
    // ...
}

struct Ipv6Addr {
    // ...
}

enum IpAddr {
    V4(Ipv4Addr),
    V6(Ipv6Addr),
}
```

**注意**：虽然标准库中包含一个 `IpAddr` 的定义，仍然可以创建和使用我们自己的定义而不会有冲突，因为我们并没有将标准库中的定义引入作用域。

## 四、枚举成员可以包含多种类型

枚举成员可以包含任意类型的数据：字符串、数字类型、结构体，甚至可以包含另一个枚举！

### 示例：Message 枚举

```rust
enum Message {
    Quit,                           // 没有关联任何数据
    Move { x: i32, y: i32 },       // 包含一个匿名结构体
    Write(String),                  // 包含单独一个 String
    ChangeColor(i32, i32, i32),     // 包含三个 i32
}
```

**说明**：
- `Quit`：没有关联任何数据（类似单元结构体）
- `Move`：包含一个匿名结构体，有 `x` 和 `y` 字段
- `Write`：包含单独一个 `String`（类似元组结构体）
- `ChangeColor`：包含三个 `i32`（类似元组结构体）

### 枚举 vs 多个结构体

如果用不同的结构体来实现相同的功能：

```rust
struct QuitMessage;                    // 类单元结构体
struct MoveMessage {
    x: i32,
    y: i32,
}
struct WriteMessage(String);           // 元组结构体
struct ChangeColorMessage(i32, i32, i32); // 元组结构体
```

**问题**：如果我们使用不同的结构体，由于它们都有不同的类型，我们将不能轻易的定义一个能够处理这些不同类型的结构体的函数。

**枚举的优势**：枚举是单独一个类型，可以统一处理所有成员。

## 五、为枚举定义方法

就像可以使用 `impl` 来为结构体定义方法那样，也可以在枚举上定义方法：

```rust
impl Message {
    fn call(&self) {
        // 在这里定义方法体
        match self {
            Message::Quit => println!("Quit message"),
            Message::Move { x, y } => println!("Move to ({}, {})", x, y),
            Message::Write(s) => println!("Write: {}", s),
            Message::ChangeColor(r, g, b) => println!("Change color to RGB({}, {}, {})", r, g, b),
        }
    }
}

let m = Message::Write(String::from("hello"));
m.call();  // 输出: Write: hello
```

方法体使用了 `self` 来获取调用方法的值。

## 六、Option 枚举和空值

### Rust 没有空值（Null）
**空值的问题**：
- 空值（Null）是一个值，它代表没有值
- 在有空值的语言中，变量总是这两种状态之一：空值和非空值
- 当你尝试像一个非空值那样使用一个空值，会出现某种形式的错误
- 因为空和非空的属性无处不在，非常容易出现这类错误

**Tony Hoare 的反思**：
> "我称之为我十亿美元的错误。当时，我在为一个面向对象语言设计第一个综合性的面向引用的类型系统。我的目标是通过编译器的自动检查来保证所有引用的使用都应该是绝对安全的。不过我未能抵抗住引入一个空引用的诱惑，仅仅是因为它是这么的容易实现。这引发了无数错误、漏洞和系统崩溃，在之后的四十多年中造成了数十亿美元的苦痛和伤害。"

### Option<T> 枚举

Rust 并没有空值，不过它确实拥有一个可以编码存在或不存在概念的枚举：`Option<T>`。



```rust
enum Option<T> {
    Some(T),
    None,
}
```

**特点**：
- `Option<T>` 枚举被包含在了 prelude 之中，不需要显式引入作用域
- 可以直接使用 `Some` 和 `None`，不需要 `Option::` 前缀
- `<T>` 是泛型类型参数，意味着 `Some` 成员可以包含任意类型的数据

### 使用 Option<T>

```rust
let some_number = Some(5);
let some_string = Some("a string");

let absent_number: Option<i32> = None;
```

**注意**：如果使用 `None` 而不是 `Some`，需要告诉 Rust `Option<T>` 是什么类型的，因为编译器只通过 `None` 值无法推断出 `Some` 成员保存的值的类型。

当有一个 Some 值时，我们就知道存在一个值，而这个值保存在 Some 中。当有个 None 值时，在某种意义上，它跟空值具有相同的意义：并没有一个有效的值。那么，Option<T> 为什么就比空值要好呢？

### Option<T> 的优势

简而言之，因为 `Option<T>` 和 `T`（这里 `T` 可以是任何类型）是不同的类型，编译器不允许像一个肯定有效的值那样使用 `Option<T>`。

**示例：不能直接使用 Option<T>**

```rust
let x: i8 = 5;
let y: Option<i8> = Some(5);

let sum = x + y;  // ❌ 编译错误！
```

如果运行这些代码，将得到类似这样的错误信息：

```
error[E0277]: the trait bound `i8: std::ops::Add<std::option::Option<i8>>` is not satisfied
 --> src/main.rs:5:17
  |
5 |     let sum = x + y;
  |                 ^ no implementation for `i8 + std::option::Option<i8>`
```

**为什么这是好事？**

很好！事实上，错误信息意味着 Rust 不知道该如何将 `Option<i8>` 与 `i8` 相加，因为它们的类型不同。

- 当在 Rust 中拥有一个像 `i8` 这样类型的值时，编译器确保它总是有一个有效的值
- 我们可以自信使用而无需做空值检查
- 只有当使用 `Option<i8>`（或者任何用到的类型）的时候需要担心可能没有值
- 编译器会确保我们在使用值之前处理了为空的情况

### Option<T> 的核心原则

换句话说，**在对 `Option<T>` 进行 `T` 的运算之前必须将其转换为 `T`**。通常这能帮助我们捕获到空值最常见的问题之一：假设某值不为空但实际上为空的情况。

**类型安全保证**：
1. 为了拥有一个可能为空的值，你必须要显式的将其放入对应类型的 `Option<T>` 中
2. 当使用这个值时，必须明确的处理值为空的情况
3. 只要一个值不是 `Option<T>` 类型，你就**可以**安全的认定它的值不为空

这是 Rust 的一个经过深思熟虑的设计决策，来限制空值的泛滥以增加 Rust 代码的安全性。

### 如何使用 Option<T>

那么当有一个 `Option<T>` 的值时，如何从 `Some` 成员中取出 `T` 的值来使用它呢？

`Option<T>` 枚举拥有大量用于各种情况的方法：
- 可以查看[官方文档](https://doc.rust-lang.org/std/option/enum.Option.html)
- 熟悉 `Option<T>` 的方法将对你的 Rust 之旅非常有用

总的来说，为了使用 `Option<T>` 值，需要编写处理每个成员的代码：
- 你想要一些代码只当拥有 `Some(T)` 值时运行，允许这些代码使用其中的 `T`
- 也希望一些代码在值为 `None` 时运行，这些代码并没有一个可用的 `T` 值

**match 表达式**就是这么一个处理枚举的控制流结构：它会根据枚举的成员运行不同的代码，这些代码可以使用匹配到的值中的数据。




---
