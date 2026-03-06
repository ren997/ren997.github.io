---
title: rust文档-包、Crate 和模块管理详解
categories: [Rust, 模块系统]
tags: [rust]
---


# Rust 包、Crate 和模块管理详解

> **核心概念**：Rust 的模块系统帮助你组织代码，控制作用域和私有性，使大型项目更易管理和维护。

## 一、为什么需要模块系统？

### 代码组织的重要性

当你编写大型程序时，组织代码很重要，因为：
- 难以在脑海中通晓整个程序
- 需要对相关功能进行分组和划分
- 需要清楚在哪里可以找到实现了特定功能的代码
- 需要知道在哪里可以改变一个功能的工作方式

### 模块系统的优势

1. **代码分组**：将代码分解为多个模块和多个文件来组织代码
2. **封装实现细节**：通过公共接口调用，不需要知道实现细节
3. **控制可见性**：定义哪些部分是公共的，哪些是私有的
4. **作用域管理**：管理代码的作用域，避免名称冲突

### 作用域（Scope）概念

**作用域**：代码所在的嵌套上下文有一组定义为 "in scope" 的名称。

- 程序员和编译器需要知道特定位置的特定名称是否引用了变量、函数、结构体、枚举、模块、常量等
- 可以创建作用域，以及改变哪些名称在作用域内还是作用域外
- 同一个作用域内不能拥有两个相同名称的项；可以使用一些工具来解决名称冲突

## 二、模块系统的组成部分

Rust 的模块系统（the module system）包括：

| 组成部分 | 说明 |
|---------|------|
| **包（Packages）** | Cargo 的一个功能，它允许你构建、测试和分享 crate |
| **Crates** | 一个模块的树形结构，它形成了库或二进制项目 |
| **模块（Modules）和 use** | 允许你控制作用域和路径的私有性 |
| **路径（path）** | 一个命名例如结构体、函数或模块等项的方式 |

---


## 三、包（Package）和 Crate

### 基本概念

- **Crate**：一个二进制项或者库
- **Crate root**：一个源文件，Rust 编译器以它为起始点，并构成你的 crate 的根模块
- **包（Package）**：提供一系列功能的一个或者多个 crate。一个包会包含有一个 `Cargo.toml` 文件，阐述如何去构建这些 crate

### 库 Crate 和二进制 Crate 的区别

在了解包的规则之前，我们需要先理解两种 crate 的区别：

| 特性 | **库 Crate（Library Crate）** | **二进制 Crate（Binary Crate）** |
|------|-------------------------------|--------------------------------|
| **入口文件** | `src/lib.rs` | `src/main.rs` 或 `src/bin/*.rs` |
| **编译结果** | 编译为库文件（`.rlib`），供其他项目使用 | 编译为可执行文件（`.exe` 或二进制文件） |
| **用途** | 提供可重用的代码和功能 | 作为程序的入口点，可以直接运行 |
| **是否有 main 函数** | ❌ 没有 `main` 函数 | ✅ 必须有 `main` 函数作为入口 |
| **是否可被其他项目依赖** | ✅ 可以被其他项目作为依赖使用 | ❌ 不能作为依赖，只能运行 |
| **示例** | `rand`、`serde`、`tokio` 等库 | 命令行工具、Web 服务器、游戏等应用程序 |

**简单理解**：
- **库 crate** = 工具箱：提供工具和功能，但不能直接运行
- **二进制 crate** = 应用程序：可以直接运行的程序

**实际例子**：
- `rand` 是一个库 crate，提供随机数生成功能，其他项目可以依赖它
- `cargo` 是一个二进制 crate，可以直接运行 `cargo build` 等命令

### 包的规则

包中所包含的内容由几条规则来确立：

1. **一个包中至多只能包含一个库 crate（library crate）**
  - 如果存在，必须是 `src/lib.rs`
  - 库 crate 用于提供可重用的功能

2. **包中可以包含任意多个二进制 crate（binary crate）**
  - 主二进制 crate：`src/main.rs`
  - 额外的二进制 crate：`src/bin/*.rs`（可以有多个）
  - 每个二进制 crate 都会编译成独立的可执行文件

3. **包中至少包含一个 crate**，无论是库的还是二进制的
  - 一个包不能是空的，必须至少有一个 crate

### 创建包

Cargo 提供了两种创建项目的方式，取决于你想要创建什么类型的项目：

#### 方式 1：创建二进制项目（默认）

```bash
$ cargo new my-project
Created binary (application) `my-project` package
$ ls my-project
Cargo.toml
src
$ ls my-project/src
main.rs
```

**结果**：创建一个二进制项目，包含 `src/main.rs` 文件

#### 方式 2：创建库项目

```bash
$ cargo new --lib my-library
Created library `my-library` package
$ ls my-library
Cargo.toml
src
$ ls my-library/src
lib.rs
```

**结果**：创建一个库项目，包含 `src/lib.rs` 文件

### Cargo 的约定

当我们输入了这些命令，Cargo 会给我们的包创建一个 `Cargo.toml` 文件。

**重要约定**：
- `src/main.rs` 就是一个与包同名的**二进制 crate** 的 crate 根（Cargo 自动识别，不需要在 `Cargo.toml` 中声明）
- `src/lib.rs` 就是一个与包同名的**库 crate** 的 crate 根（Cargo 自动识别）
- crate 根文件将由 Cargo 传递给 `rustc` 来实际构建库或者二进制项目

**如何判断项目类型**：
- 有 `src/main.rs` → 二进制项目（可以运行）
- 有 `src/lib.rs` → 库项目（供其他项目使用）
- 两者都有 → 同时是库和二进制项目

### 包的结构

**示例 1：只有二进制 crate**
```
my-project/
├── Cargo.toml
└── src/
    └── main.rs
```
- 使用 `cargo new my-project` 创建
- 只含有一个名为 `my-project` 的二进制 crate
- 可以运行：`cargo run`

**示例 1.5：只有库 crate**
```
my-library/
├── Cargo.toml
└── src/
    └── lib.rs
```
- 使用 `cargo new --lib my-library` 创建
- 只含有一个名为 `my-library` 的库 crate
- **不能直接运行**，只能被其他项目作为依赖使用
- 可以测试：`cargo test`

**示例 2：同时有库和二进制 crate**
```
my-project/
├── Cargo.toml
└── src/
    ├── main.rs
    └── lib.rs
```
- 有两个 crate：一个库和一个二进制项，且名字都与包相同

**示例 3：多个二进制 crate**
```
my-project/
├── Cargo.toml
└── src/
    ├── main.rs
    └── bin/
        ├── binary1.rs
        └── binary2.rs
```
- 通过将文件放在 `src/bin` 目录下，一个包可以拥有多个二进制 crate
- 每个 `src/bin` 下的文件都会被编译成一个独立的二进制 crate

### Crate 的作用域

一个 crate 会将一个作用域内的相关功能分组到一起，使得该功能可以很方便地在多个项目之间共享。

**示例**：`rand` crate 提供了生成随机数的功能
- 通过将 `rand` crate 加入到我们项目的作用域中，我们就可以在自己的项目中使用该功能
- `rand` crate 提供的所有功能都可以通过该 crate 的名字：`rand` 进行访问

**作用域隔离的优势**：
- 可以知晓一些特定的功能是在我们的 crate 中定义的还是在 `rand` crate 中定义的
- 这可以防止潜在的冲突

**示例**：
- `rand` crate 提供了一个名为 `Rng` 的特性（trait）
- 我们还可以在我们自己的 crate 中定义一个名为 `Rng` 的 struct
- 因为一个 crate 的功能是在自身的作用域进行命名的，当我们将 `rand` 作为一个依赖，编译器不会混淆 `Rng` 这个名字的指向
- 在我们的 crate 中，它指向的是我们自己定义的 `struct Rng`
- 我们可以通过 `rand::Rng` 这一方式来访问 `rand` crate 中的 `Rng` 特性（trait）

---

## 四、定义模块来控制作用域与私有性

### 模块的作用

模块让我们可以将一个 crate 中的代码进行分组，以提高可读性与重用性。模块还可以控制项的**私有性**，即项是可以被外部代码使用的（public），还是作为一个内部实现的内容，不能被外部代码使用（private）。

### 模块定义示例

在餐饮业，餐馆中会有一些地方被称之为**前台（front of house）**，还有另外一些地方被称之为**后台（back of house）**。我们可以将函数放置到嵌套的模块中，来使我们的 crate 结构与实际的餐厅结构相同。

```rust
// src/lib.rs
mod front_of_house {
    mod hosting {
        fn add_to_waitlist() {}
        fn seat_at_table() {}
    }

    mod serving {
        fn take_order() {}
        fn serve_order() {}
        fn take_payment() {}
    }
}
```

### 模块定义语法

我们定义一个模块，是以 `mod` 关键字为起始，然后指定模块的名字，并且用花括号包围模块的主体。

**模块可以包含**：
- 其他模块（嵌套模块）
- 结构体、枚举、常量、特性（trait）、函数等

### 模块的优势

通过使用模块，我们可以：
1. **将相关的定义分组到一起**，并指出他们为什么相关
2. **更容易找到定义**：可以基于分组来对代码进行导航，而不需要阅读所有的定义
3. **保持程序的组织性**：添加新功能时，知道代码应该放置在何处

### 模块树（Module Tree）

`src/main.rs` 和 `src/lib.rs` 叫做 **crate 根**。这两个文件的内容都是一个从名为 `crate` 的模块作为根的 crate 模块结构，称为**模块树（module tree）**。

**示例 7-1 中的模块树结构**：

```
crate
└── front_of_house
    ├── hosting
    │   ├── add_to_waitlist
    │   └── seat_at_table
    └── serving
        ├── take_order
        ├── serve_order
        └── take_payment
```

### 模块关系

- **嵌套模块**：一些模块被嵌入到另一个模块中（例如，`hosting` 嵌套在 `front_of_house` 中）
- **兄弟模块（siblings）**：定义在同一模块中的模块（`hosting` 和 `serving` 被一起定义在 `front_of_house` 中）
- **父子关系**：如果一个模块 A 被包含在模块 B 中，我们将模块 A 称为模块 B 的**子（child）**，模块 B 则是模块 A 的**父（parent）**
- **根模块**：整个模块树都植根于名为 `crate` 的隐式模块下

### 模块树 vs 文件系统

这个模块树可能会令你想起电脑上文件系统的目录树；这是一个非常恰当的比喻！
- 就像文件系统的目录，你可以使用模块来组织你的代码
- 就像目录中的文件，我们需要一种方法来找到模块

---

## 五、路径用于引用模块树中的项

### 路径的概念

来看一下 Rust 如何在模块树中找到一个项的位置，我们使用路径的方式，就像在文件系统使用路径一样。如果我们想要调用一个函数，我们需要知道它的路径。

### 路径的两种形式

路径有两种形式：

1. **绝对路径（absolute path）**：从 crate 根开始，以 crate 名或者字面值 `crate` 开头
2. **相对路径（relative path）**：从当前模块开始，以 `self`、`super` 或当前模块的标识符开头

绝对路径和相对路径都后跟一个或多个由双冒号（`::`）分割的标识符。

### 路径示例

```rust
mod front_of_house {
    mod hosting {
        fn add_to_waitlist() {}
    }
}

pub fn eat_at_restaurant() {
    // 绝对路径
    crate::front_of_house::hosting::add_to_waitlist();

    // 相对路径
    front_of_house::hosting::add_to_waitlist();
}
```

**说明**：
- **绝对路径**：使用 `crate` 关键字从 crate 根开始，类似于在 shell 中使用 `/` 从文件系统根开始
- **相对路径**：以模块名称为起始，这个模块在模块树中，与当前函数定义在同一层级

### 选择绝对路径还是相对路径？

选择使用相对路径还是绝对路径，取决于你的项目：

- **绝对路径**：更适合移动代码定义和项调用的相互独立
- **相对路径**：如果项的定义代码与使用该项的代码一起移动，相对路径更方便

**示例**：
- 如果要将 `front_of_house` 模块和 `eat_at_restaurant` 函数一起移动到一个名为 `customer_experience` 的模块中，我们需要更新 `add_to_waitlist` 的绝对路径，但是相对路径还是可用的
- 如果要将 `eat_at_restaurant` 函数单独移到一个名为 `dining` 的模块中，还是可以使用原本的绝对路径来调用 `add_to_waitlist`，但是相对路径必须要更新

**推荐**：我们更倾向于使用绝对路径，因为它更适合移动代码定义和项调用的相互独立。

### 私有性边界（Privacy Boundary）

让我们试着编译上面的代码，会出现错误：

```
error[E0603]: module `hosting` is private
```

**错误原因**：`hosting` 模块是私有的。我们拥有 `hosting` 模块和 `add_to_waitlist` 函数的正确路径，但是 Rust 不让我们使用，因为它不能访问私有片段。

**模块的私有性作用**：
- 模块不仅对于你组织代码很有用
- 他们还定义了 Rust 的**私有性边界（privacy boundary）**：这条界线不允许外部代码了解、调用和依赖被封装的实现细节
- 如果你希望创建一个私有函数或结构体，你可以将其放入模块

### Rust 的私有性规则

**默认规则**：
- Rust 中默认所有项（函数、方法、结构体、枚举、模块和常量）都是**私有的**
- **父模块中的项不能使用子模块中的私有项**
- **但是子模块中的项可以使用他们父模块中的项**

**原因**：子模块封装并隐藏了他们的实现详情，但是子模块可以看到他们定义的上下文。

**比喻**：把私有性规则想象成餐馆的后台办公室：餐馆内的事务对餐厅顾客来说是不可知的，但办公室经理可以洞悉其经营的餐厅并在其中做任何事情。

**优势**：
- Rust 选择以这种方式来实现模块系统功能，因此默认隐藏内部实现细节
- 这样一来，你就知道可以更改内部代码的哪些部分而不会破坏外部代码
- 你还可以通过使用 `pub` 关键字来创建公共项，使子模块的内部部分暴露给上级模块

## 六、使用 pub 关键字暴露路径

### 为什么需要 pub 关键字？

前面我们提到，模块默认是私有的。现在让我们看看如何使用 `pub` 关键字来暴露路径。

### 示例：无法编译的私有模块

```rust
// src/lib.rs
mod front_of_house {
    mod hosting {
        fn add_to_waitlist() {}
    }
}

pub fn eat_at_restaurant() {
    // 绝对路径
    crate::front_of_house::hosting::add_to_waitlist();

    // 相对路径
    front_of_house::hosting::add_to_waitlist();
}
```

**编译错误**：

```
error[E0603]: module `hosting` is private
 --> src/lib.rs:9:28
  |
9 |     crate::front_of_house::hosting::add_to_waitlist();
  |                            ^^^^^^^ private module
```

### 第一步：使用 pub 公开模块

```rust
// src/lib.rs
mod front_of_house {
    pub mod hosting {  // ✅ 添加 pub
        fn add_to_waitlist() {}
    }
}

pub fn eat_at_restaurant() {
    crate::front_of_house::hosting::add_to_waitlist();
}
```

**仍然有错误**：

```
error[E0603]: function `add_to_waitlist` is private
 --> src/lib.rs:9:37
  |
9 |     crate::front_of_house::hosting::add_to_waitlist();
  |                                     ^^^^^^^^^^^^^^^ private function
```

**关键点**：在 `mod hosting` 前添加了 `pub` 关键字，使其变成公有的。但是 `hosting` 的**内容（contents）**仍然是私有的。

**这表明**：**使模块公有并不使其内容也是公有的**。模块上的 `pub` 关键字只允许其父模块引用它。

### 第二步：同时公开函数

```rust
// src/lib.rs
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}  // ✅ 添加 pub
    }
}

pub fn eat_at_restaurant() {
    // 绝对路径
    crate::front_of_house::hosting::add_to_waitlist();

    // 相对路径
    front_of_house::hosting::add_to_waitlist();
}
```

✅ **现在代码可以编译通过了！**

### 为什么现在可以编译？

让我们看看绝对路径和相对路径，并根据私有性规则，再检查一下为什么增加 `pub` 关键字使得我们可以在 `add_to_waitlist` 中调用这些路径。

**绝对路径分析**：
1. 从 `crate` 根开始
2. `front_of_house` 模块不是公有的，但因为 `eat_at_restaurant` 函数与 `front_of_house` 定义于同一模块中（即，它们是兄弟），我们可以从 `eat_at_restaurant` 中引用 `front_of_house`
3. `hosting` 模块被标记为 `pub`，我们可以访问 `hosting` 的父模块，所以可以访问 `hosting`
4. `add_to_waitlist` 函数被标记为 `pub`，我们可以访问其父模块，所以这个函数调用是有效的

**相对路径分析**：
1. 路径从 `front_of_house` 开始（而不是从 crate 根开始）
2. `front_of_house` 模块与 `eat_at_restaurant` 定义于同一模块，所以该模块相对路径是有效的
3. 因为 `hosting` 和 `add_to_waitlist` 被标记为 `pub`，路径其余的部分也是有效的

**关键规则**：私有性规则不但应用于模块，还应用于结构体、枚举、函数和方法。

## 七、使用 super 起始的相对路径

### super 的作用

我们还可以使用 `super` 开头来构建从父模块开始的相对路径。这么做类似于文件系统中以 `..` 开头的语法。

### 示例：使用 super 调用父模块的函数

```rust
// src/lib.rs
fn serve_order() {}

mod back_of_house {
    fn fix_incorrect_order() {
        cook_order();
        super::serve_order();  // 使用 super 访问父模块的函数
    }

    fn cook_order() {}
}
```

**说明**：
- `fix_incorrect_order` 函数在 `back_of_house` 模块中
- 使用 `super` 进入 `back_of_house` 的父模块（也就是本例中的 crate 根）
- 在父模块中可以找到 `serve_order` 函数

### 为什么使用 super？

**优势**：
- 如果 `back_of_house` 模块和 `serve_order` 函数之间具有某种关联关系
- 当我们重新组织 crate 的模块树时，需要一起移动它们
- 使用 `super` 可以让代码更容易维护，只需要更新很少的代码

**类比**：`super` 就像文件系统中的 `..`，表示"上一级目录"。

## 八、公有的结构体和枚举

### 公有结构体的特性

我们还可以使用 `pub` 来设计公有的结构体和枚举，不过有一些额外的细节需要注意。

**重要规则**：如果我们在一个结构体定义的前面使用了 `pub`，这个结构体会变成公有的，**但是这个结构体的字段仍然是私有的**。我们可以根据情况决定每个字段是否公有。

### 示例：带有公有和私有字段的结构体

```rust
// src/lib.rs
mod back_of_house {
    pub struct Breakfast {
        pub toast: String,       // 公有字段
        seasonal_fruit: String,  // 私有字段
    }

    impl Breakfast {
        pub fn summer(toast: &str) -> Breakfast {
            Breakfast {
                toast: String::from(toast),
                seasonal_fruit: String::from("peaches"),
            }
        }
    }
}

pub fn eat_at_restaurant() {
    // 在夏天点一份 Rye 吐司作为早餐
    let mut meal = back_of_house::Breakfast::summer("Rye");

    // 改变我们想要的面包类型
    meal.toast = String::from("Wheat");
    println!("I'd like {} toast please", meal.toast);

    // 下面这行如果取消注释会编译失败
    // 我们不能看到或修改随餐搭配的季节水果
    // meal.seasonal_fruit = String::from("blueberries");
}
```

**说明**：
- `toast` 字段是公有的，所以我们可以在 `eat_at_restaurant` 中使用点号来随意的读写 `toast` 字段
- `seasonal_fruit` 字段是私有的，不能在外部访问

**关键点**：因为 `back_of_house::Breakfast` 具有私有字段，所以这个结构体需要提供一个公共的关联函数来构造实例（这里我们命名为 `summer`）。如果 `Breakfast` 没有这样的函数，我们将无法在 `eat_at_restaurant` 中创建 `Breakfast` 实例，因为我们不能在外部设置私有字段 `seasonal_fruit` 的值。

### 公有枚举的特性

与结构体相反，**如果我们将枚举设为公有，则它的所有成员都将变为公有**。我们只需要在 `enum` 关键字前面加上 `pub`。

```rust
// src/lib.rs
mod back_of_house {
    pub enum Appetizer {
        Soup,   // 自动公有
        Salad,  // 自动公有
    }
}

pub fn eat_at_restaurant() {
    let order1 = back_of_house::Appetizer::Soup;
    let order2 = back_of_house::Appetizer::Salad;
}
```

### 结构体 vs 枚举的 pub 行为对比

| 类型 | `pub` 行为 | 原因 |
|------|-----------|------|
| **结构体** | `pub struct` 只公开结构体本身，字段默认私有 | 结构体通常不需要将所有字段公有化 |
| **枚举** | `pub enum` 会公开所有成员 | 如果枚举成员不公有，枚举就没用了 |

**总结**：
- 枚举成员默认就是公有的，因为给每个成员添加 `pub` 很麻烦
- 结构体遵循常规，内容全部是私有的，除非使用 `pub` 关键字

## 九、使用 use 关键字将名称引入作用域

### 为什么需要 use？

到目前为止，似乎我们编写的用于调用函数的路径都很冗长且重复，并不方便。例如，无论我们选择 `add_to_waitlist` 函数的绝对路径还是相对路径，每次调用时都必须指定 `front_of_house` 和 `hosting`。

幸运的是，有一种方法可以简化这个过程：我们可以**一次性将路径引入作用域**，然后使用 `use` 关键字调用该路径中的项，就如同它们是本地项一样。

### 基本用法

```rust
// src/lib.rs
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}
    }
}

use crate::front_of_house::hosting;

pub fn eat_at_restaurant() {
    hosting::add_to_waitlist();
    hosting::add_to_waitlist();
    hosting::add_to_waitlist();
}
```

**说明**：
- 我们将 `crate::front_of_house::hosting` 模块引入了作用域
- 只需要指定 `hosting::add_to_waitlist` 即可调用函数
- 不再需要每次都写完整路径

### use 的工作原理

在作用域中增加 `use` 和路径类似于在文件系统中创建**软连接（符号连接，symbolic link）**。

通过在 crate 根增加 `use crate::front_of_house::hosting`，现在 `hosting` 在作用域中就是有效的名称了，如同 `hosting` 模块被定义于 crate 根一样。

**注意**：通过 `use` 引入作用域的路径也会检查私有性，同其它路径一样。

### 使用相对路径的 use

你还可以使用 `use` 和相对路径来将一个项引入作用域：

```rust
// src/lib.rs
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}
    }
}

use front_of_house::hosting;  // 相对路径

pub fn eat_at_restaurant() {
    hosting::add_to_waitlist();
    hosting::add_to_waitlist();
    hosting::add_to_waitlist();
}
```

### 创建惯用的 use 路径

你可能会疑惑，为什么我们使用 `use crate::front_of_house::hosting`，然后调用 `hosting::add_to_waitlist`，而不是直接引入函数本身？

**不推荐的写法**：

```rust
// src/lib.rs
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}
    }
}

use crate::front_of_house::hosting::add_to_waitlist;

pub fn eat_at_restaurant() {
    add_to_waitlist();  // ❌ 不清楚函数来自哪里
    add_to_waitlist();
    add_to_waitlist();
}
```

**推荐的写法**：

```rust
use crate::front_of_house::hosting;

pub fn eat_at_restaurant() {
    hosting::add_to_waitlist();  // ✅ 清楚表明函数来自 hosting 模块
}
```

### use 的习惯用法

| 项类型 | 推荐的 use 方式 | 原因 |
|-------|----------------|------|
| **函数** | 引入父模块，调用时指定模块名 | 清晰表明函数不是在本地定义的 |
| **结构体、枚举等** | 引入完整路径 | 这是 Rust 社区的惯例 |

**示例：引入结构体的习惯用法**

```rust
use std::collections::HashMap;

fn main() {
    let mut map = HashMap::new();  // 直接使用 HashMap
    map.insert(1, 2);
}
```

### 处理同名项

当你想使用 `use` 语句将两个具有相同名称的项带入作用域时，因为 Rust 不允许这样做，你需要使用父模块来区分它们。

**方法 1：使用父模块区分**

```rust
use std::fmt;
use std::io;

fn function1() -> fmt::Result {
    // --snip--
}

fn function2() -> io::Result<()> {
    // --snip--
}
```

如你所见，使用父模块可以区分这两个 `Result` 类型。

**方法 2：使用 as 关键字重命名**

使用 `use` 将两个同名类型引入同一作用域这个问题还有另一个解决办法：在这个类型的路径后面，使用 `as` 指定一个新的本地名称或者别名。

```rust
use std::fmt::Result;
use std::io::Result as IoResult;  // 使用 as 重命名

fn function1() -> Result {
    // --snip--
}

fn function2() -> IoResult<()> {
    // --snip--
}
```

在第二个 `use` 语句中，我们选择 `IoResult` 作为 `std::io::Result` 的新名称，它与从 `std::fmt` 引入作用域的 `Result` 并不冲突。

**总结**：两种方法都是惯用的，如何选择取决于你！

### 使用 pub use 重导出名称

当使用 `use` 关键字将名称导入作用域时，在新作用域中可用的名称是私有的。如果想让调用你编写的代码的代码能够像在自己的作用域内引用这些类型，可以结合 `pub` 和 `use`。

**这个技术被称为"重导出（re-exporting）"**：将项引入作用域并同时使其可供其他代码引入自己的作用域。

```rust
// src/lib.rs
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}
    }
}

pub use crate::front_of_house::hosting;  // 重导出

pub fn eat_at_restaurant() {
    hosting::add_to_waitlist();
    hosting::add_to_waitlist();
    hosting::add_to_waitlist();
}
```

**效果**：
- 通过 `pub use`，外部代码现在可以通过新路径 `hosting::add_to_waitlist` 来调用 `add_to_waitlist` 函数
- 如果没有指定 `pub use`，`eat_at_restaurant` 函数可以在其作用域中调用 `hosting::add_to_waitlist`，但外部代码则不允许使用这个新路径

**何时使用重导出？**

当你的代码的内部结构与调用你的代码的程序员的思考领域不同时，重导出会很有用。

**示例**：在餐馆的比喻中
- 经营餐馆的人会想到"前台"和"后台"
- 但顾客在光顾一家餐馆时，可能不会以这些术语来考虑餐馆的各个部分

使用 `pub use`，我们可以使用一种结构编写代码，却将不同的结构形式暴露出来。这样做使我们的库井井有条，方便开发和使用。

### 使用外部包

在第二章中我们编写了一个猜猜看游戏。那个项目使用了一个外部包 `rand` 来生成随机数。

**步骤 1：在 Cargo.toml 中添加依赖**

```toml
[dependencies]
rand = "0.5.5"
```

在 `Cargo.toml` 中加入 `rand` 依赖告诉了 Cargo 要从 crates.io 下载 `rand` 和其依赖，并使其可在项目代码中使用。

**步骤 2：使用 use 引入作用域**

```rust
use rand::Rng;

fn main() {
    let secret_number = rand::thread_rng().gen_range(1, 101);
}
```

**总结**：crates.io 上有很多 Rust 社区成员发布的包，将其引入你自己的项目都需要相同的步骤：
1. 在 `Cargo.toml` 中列出依赖
2. 通过 `use` 将其中定义的项引入项目包的作用域中

### 标准库也是外部 crate

注意标准库（`std`）对于你的包来说也是外部 crate。因为标准库随 Rust 语言一同分发，无需修改 `Cargo.toml` 来引入 `std`，不过需要通过 `use` 将标准库中定义的项引入项目包的作用域中来引用它们。

```rust
use std::collections::HashMap;  // 以标准库 crate 名 std 开头的绝对路径
```

### 使用嵌套路径来消除大量的 use 行

当需要引入很多定义于相同包或相同模块的项时，为每一项单独列出一行会占用源码很大的空间。

**传统写法**：

```rust
use std::cmp::Ordering;
use std::io;
// ---snip---
```

**嵌套路径写法**：

```rust
use std::{cmp::Ordering, io};
// ---snip---
```

在较大的程序中，使用嵌套路径从相同包或模块中引入很多项，可以显著减少所需的独立 `use` 语句的数量！

### 使用 self 合并子路径

我们可以在路径的任何层级使用嵌套路径。例如，当一个路径是另一个路径的子路径时：

**传统写法**：

```rust
use std::io;
use std::io::Write;
```

**使用 self 合并**：

```rust
use std::io::{self, Write};
```

这一行便将 `std::io` 和 `std::io::Write` 同时引入作用域。

### 通过 glob 运算符引入所有公有项

如果希望将一个路径下**所有**公有项引入作用域，可以指定路径后跟 `*`（glob 运算符）：

```rust
use std::collections::*;
```

这个 `use` 语句将 `std::collections` 中定义的所有公有项引入当前作用域。

**⚠️ 注意**：使用 glob 运算符时请多加小心！Glob 会使得我们难以推导作用域中有什么名称和它们是在何处定义的。

**常见使用场景**：
- 测试模块 `tests` 中，这时会将所有内容引入作用域
- `prelude` 模式

---

## 十、将模块分割进不同文件

### 为什么需要分割模块？

到目前为止，本章所有的例子都在一个文件中定义多个模块。当模块变得更大时，你可能想要将它们的定义移动到单独的文件中，从而使代码更容易阅读。

### 分割模块的方法

**步骤 1：在 crate 根文件中声明模块**

```rust
// src/lib.rs
mod front_of_house;  // 使用分号，告诉 Rust 在其他文件中加载模块内容

pub use crate::front_of_house::hosting;

pub fn eat_at_restaurant() {
    hosting::add_to_waitlist();
    hosting::add_to_waitlist();
    hosting::add_to_waitlist();
}
```

**关键点**：在 `mod front_of_house` 后使用分号，而不是代码块，这将告诉 Rust 在另一个与模块同名的文件中加载模块的内容。

**步骤 2：创建模块文件**

```rust
// src/front_of_house.rs
pub mod hosting {
    pub fn add_to_waitlist() {}
}
```

### 嵌套模块的分割

继续重构，将 `hosting` 模块也提取到其自己的文件中：

**步骤 1：修改父模块文件**

```rust
// src/front_of_house.rs
pub mod hosting;  // 声明子模块
```

**步骤 2：创建子模块文件**

```rust
// src/front_of_house/hosting.rs
pub fn add_to_waitlist() {}
```

### 文件结构总结

```
crate-root/
├── src/
│   ├── lib.rs                    # crate 根文件
│   ├── front_of_house.rs         # front_of_house 模块
│   └── front_of_house/           # front_of_house 的子模块目录
│       └── hosting.rs            # hosting 子模块
```

**重要特性**：
- 模块树依然保持相同
- `eat_at_restaurant` 中的函数调用也无需修改继续保持有效
- 这个技巧让你可以在模块代码增长时，将它们移动到新文件中

**注意**：
- `src/lib.rs` 中的 `pub use crate::front_of_house::hosting` 语句没有改变
- `mod` 关键字声明了模块，Rust 会在与模块同名的文件中查找模块的代码
- 在文件作为 crate 的一部分而编译时，`use` 不会有任何影响

---

## 总结

Rust 的模块系统提供了强大的代码组织能力：

1. **包（Package）和 Crate**：Cargo 的功能，允许你构建、测试和分享 crate
2. **模块（Modules）**：控制作用域和私有性，组织代码结构
3. **路径（Path）**：绝对路径和相对路径，用于引用模块中的项
4. **pub 关键字**：控制项的可见性，默认所有项都是私有的
5. **use 关键字**：将路径引入作用域，简化代码
6. **文件分割**：将模块定义移动到不同文件中，保持代码清晰

**核心原则**：
- 模块定义的代码默认是私有的
- 可以通过 `pub` 关键字使定义变为公有
- 通过 `use` 语句将路径引入作用域，多次使用时可以使用更短的路径

---
