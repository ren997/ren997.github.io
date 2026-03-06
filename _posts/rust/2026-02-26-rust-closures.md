---
title: Rust 闭包：可以捕获环境的匿名函数
categories: [Rust, 迭代器与闭包]
tags: [rust]
---

## 概述

Rust 的**闭包（closures）**是可以保存进变量或作为参数传递给其他函数的匿名函数。可以在一个地方创建闭包，然后在不同的上下文中执行闭包运算。

不同于函数，闭包允许捕获调用者作用域中的值。本文将展示闭包的这些功能如何复用代码和自定义行为。

<!--more-->

## 使用闭包创建行为的抽象

### 背景场景

考虑以下假想情况：我们在一个通过 app 生成自定义健身计划的初创企业工作，其后端使用 Rust 编写。生成健身计划的算法需要考虑很多不同的因素（年龄、BMI、用户喜好、近期健身活动等），计算大约需要几秒钟。我们只希望在需要时调用算法，并且只希望调用一次。

### 模拟慢计算函数

通过调用 `simulated_expensive_calculation` 函数来模拟调用假象的算法：

**文件名: src/main.rs**

```rust
use std::thread;
use std::time::Duration;

fn simulated_expensive_calculation(intensity: u32) -> u32 {
    println!("calculating slowly...");
    thread::sleep(Duration::from_secs(2));
    intensity
}
```

### main 函数

**文件名: src/main.rs**

```rust
fn main() {
    let simulated_user_specified_value = 10;
    let simulated_random_number = 7;

    generate_workout(
        simulated_user_specified_value,
        simulated_random_number
    );
}
```

### 原始业务逻辑

`generate_workout` 函数根据输入调用慢计算函数来打印出健身计划：

**文件名: src/main.rs**

```rust
fn generate_workout(intensity: u32, random_number: u32) {
    if intensity < 25 {
        println!(
            "Today, do {} pushups!",
            simulated_expensive_calculation(intensity)
        );
        println!(
            "Next, do {} situps!",
            simulated_expensive_calculation(intensity)
        );
    } else {
        if random_number == 3 {
            println!("Take a break today! Remember to stay hydrated!");
        } else {
            println!(
                "Today, run for {} minutes!",
                simulated_expensive_calculation(intensity)
            );
        }
    }
}
```

**问题**：
- 第一个 `if` 块调用了 `simulated_expensive_calculation` **两次**，用户需要等待两倍时间
- `else` 中的 `if` 分支完全不需要调用，但若提前计算则会浪费时间

---

## 重构方案

### 方案一：提取到变量（不理想）

将重复调用提取到一个变量中：

**文件名: src/main.rs**

```rust
fn generate_workout(intensity: u32, random_number: u32) {
    let expensive_result =
        simulated_expensive_calculation(intensity);

    if intensity < 25 {
        println!("Today, do {} pushups!", expensive_result);
        println!("Next, do {} situps!", expensive_result);
    } else {
        if random_number == 3 {
            println!("Take a break today! Remember to stay hydrated!");
        } else {
            println!("Today, run for {} minutes!", expensive_result);
        }
    }
}
```

**缺点**：不管走哪个分支，都需要在最开始调用并等待函数结果，包括那个完全不需要结果的 `else if` 分支。

### 方案二：使用闭包储存代码（推荐）

不同于总是在 `if` 块之前调用函数并储存结果，我们可以定义一个闭包并将其储存在变量中：

**文件名: src/main.rs**

```rust
let expensive_closure = |num| {
    println!("calculating slowly...");
    thread::sleep(Duration::from_secs(2));
    num
};
```

闭包定义语法说明：
- 以一对竖线 `|` 开始，在竖线中指定参数（与 Smalltalk 和 Ruby 的闭包定义类似）
- 多个参数用逗号分隔，如 `|param1, param2|`
- 参数之后是存放闭包体的大括号；若闭包体只有一行则大括号可省略
- 大括号之后需要用于 `let` 语句的分号

> **注意**：`expensive_closure` 包含的是匿名函数的**定义**，而不是调用匿名函数的**返回值**。

调用闭包的完整代码：

**文件名: src/main.rs**

```rust
fn generate_workout(intensity: u32, random_number: u32) {
    let expensive_closure = |num| {
        println!("calculating slowly...");
        thread::sleep(Duration::from_secs(2));
        num
    };

    if intensity < 25 {
        println!(
            "Today, do {} pushups!",
            expensive_closure(intensity)
        );
        println!(
            "Next, do {} situps!",
            expensive_closure(intensity)
        );
    } else {
        if random_number == 3 {
            println!("Take a break today! Remember to stay hydrated!");
        } else {
            println!(
                "Today, run for {} minutes!",
                expensive_closure(intensity)
            );
        }
    }
}
```

此方案仍有一个问题：第一个 `if` 块中仍然调用了闭包两次。后续我们将用 `Cacher` 结构体彻底解决。

---

## 闭包类型推断和注解

闭包不要求像 `fn` 函数那样在参数和返回值上注明类型，因为闭包不用于暴露给外部的接口，编译器能可靠地推断参数和返回值的类型。

### 四种等价的写法

```rust
fn  add_one_v1   (x: u32) -> u32 { x + 1 }  // 函数定义
let add_one_v2 = |x: u32| -> u32 { x + 1 }; // 完整类型注解的闭包
let add_one_v3 = |x|             { x + 1 }; // 省略类型注解
let add_one_v4 = |x|               x + 1  ; // 省略大括号（单行体）
```

这些都是有效的定义，调用时产生相同的行为。

### 类型一旦推断将被锁定

闭包定义会为每个参数和返回值**推断一个具体类型**，且一旦确定后不可改变：

**文件名: src/main.rs**（这些代码不能编译！）

```rust
let example_closure = |x| x;

let s = example_closure(String::from("hello")); // 推断 x 为 String
let n = example_closure(5);                     // 错误！类型已被锁定为 String
```

编译器错误：

```
error[E0308]: mismatched types
 --> src/main.rs
  |
  | let n = example_closure(5);
  |                         ^ expected struct `std::string::String`, found integer
  |
  = note: expected type `std::string::String`
             found type `{integer}`
```

---

## 使用泛型和 Fn trait 缓存闭包结果

### Memoization 模式

可以创建一个存放闭包和调用闭包结果的结构体，该结构体只会在需要结果时执行闭包，并**缓存结果值**，这种模式称为 **memoization（记忆化）** 或 **lazy evaluation（惰性求值）**。

### Fn 系列 trait

三个 trait 之间是**层次包含关系**（`FnOnce ⊇ FnMut ⊇ Fn`），所有闭包至少实现 `FnOnce`，并根据其行为可能同时实现 `FnMut` 和 `Fn`：

| Trait | 捕获方式 | 说明 |
|---|---|---|
| `FnOnce` | 获取所有权 | 所有闭包都实现；**消费**捕获的变量，只能被调用一次 |
| `FnMut` | 可变借用 | 没有移动所有权的闭包还实现；获取可变借用，可改变其环境 |
| `Fn` | 不可变借用 | 不需要可变访问的闭包还实现；从环境获取不可变借用值 |

> **注意**：函数也都实现了这三个 `Fn` trait。如果不需要捕获环境中的值，可以使用函数而不是闭包。

**为什么实现了 `Fn` 就一定实现了 `FnMut`？**

这三个 trait 描述的是**调用者需要对闭包持有什么访问权限**：

| Trait | 调用者需要持有 |
|---|---|
| `FnOnce` | 所有权（`self`） |
| `FnMut` | 可变借用（`&mut self`） |
| `Fn` | 不可变借用（`&self`） |

`Fn` 是最严格的约束——一个用 `&self` 就能调用的闭包，给它 `&mut self` 当然也没问题；反之则不然。因此实现了 `Fn` 的闭包，一定同时实现了 `FnMut` 和 `FnOnce`，而 `FnMut` 的闭包不一定实现 `Fn`。

```
FnOnce ⊇ FnMut ⊇ Fn
```

### 定义 Cacher 结构体

**文件名: src/main.rs**

```rust
struct Cacher<T>
    where T: Fn(u32) -> u32
{
    calculation: T,
    value: Option<u32>,
}
```

- `calculation` 字段存放闭包，其 trait bound 指定了接受 `u32` 参数并返回 `u32`
- `value` 字段存放 `Option<u32>`：初始为 `None`，执行闭包后存入 `Some`

### 实现 Cacher 的缓存逻辑

**文件名: src/main.rs**

```rust
impl<T> Cacher<T>
    where T: Fn(u32) -> u32
{
    fn new(calculation: T) -> Cacher<T> {
        Cacher {
            calculation,
            value: None,
        }
    }

    fn value(&mut self, arg: u32) -> u32 {
        match self.value {
            Some(v) => v,
            None => {
                let v = (self.calculation)(arg);
                self.value = Some(v);
                v
            },
        }
    }
}
```

### 在 generate_workout 中使用 Cacher

**文件名: src/main.rs**

```rust
fn generate_workout(intensity: u32, random_number: u32) {
    let mut expensive_result = Cacher::new(|num| {
        println!("calculating slowly...");
        thread::sleep(Duration::from_secs(2));
        num
    });

    if intensity < 25 {
        println!(
            "Today, do {} pushups!",
            expensive_result.value(intensity)
        );
        println!(
            "Next, do {} situps!",
            expensive_result.value(intensity)
        );
    } else {
        if random_number == 3 {
            println!("Take a break today! Remember to stay hydrated!");
        } else {
            println!(
                "Today, run for {} minutes!",
                expensive_result.value(intensity)
            );
        }
    }
}
```

可以调用 `value` 方法任意多次，慢计算最多只会运行一次。

### Cacher 实现的限制

当前 `Cacher` 实现存在两个问题：

**问题一**：假设对于任何 `arg` 参数值总是返回相同的值，以下测试会失败：

```rust
// 这些代码会 panic！
#[test]
fn call_with_different_values() {
    let mut c = Cacher::new(|a| a);

    let v1 = c.value(1);
    let v2 = c.value(2);

    assert_eq!(v2, 2); // 实际返回 1，因为第一次调用的结果被缓存了
}
```

**解决方向**：修改 `Cacher` 存放一个**哈希 map** 而不是单独一个值，以 `arg` 为 key，闭包结果为 value。

**问题二**：只接受获取 `u32` 值并返回 `u32` 值的闭包，灵活性受限。

**解决方向**：引入更多泛型参数来增加 `Cacher` 功能的灵活性。

---

## 闭包会捕获其环境

闭包拥有函数所没有的功能：**可以捕获其环境并访问其被定义的作用域的变量**。

### 示例：捕获环境变量

**文件名: src/main.rs**

```rust
fn main() {
    let x = 4;

    let equal_to_x = |z| z == x; // 闭包捕获了外部变量 x

    let y = 4;

    assert!(equal_to_x(y));
}
```

即便 `x` 并不是 `equal_to_x` 的一个参数，该闭包也可以使用变量 `x`，因为它与 `equal_to_x` 定义于相同的作用域。

### 函数无法做到同样的事

**文件名: src/main.rs**（这些代码不能编译！）

```rust
fn main() {
    let x = 4;

    fn equal_to_x(z: i32) -> bool { z == x } // 错误！

    let y = 4;

    assert!(equal_to_x(y));
}
```

编译器错误：

```
error[E0434]: can't capture dynamic environment in a fn item; use the || { ...
} closure form instead
 --> src/main.rs
  |
4 |     fn equal_to_x(z: i32) -> bool { z == x }
  |                                          ^
```

### 三种捕获方式

闭包可以通过三种方式捕获其环境，对应函数的三种获取参数的方式：

| 捕获方式 | 对应 Trait | 说明 |
|---|---|---|
| 获取所有权 | `FnOnce` | 消费捕获到的变量，只能被调用一次 |
| 可变借用 | `FnMut` | 获取可变借用，可以改变环境中的变量 |
| 不可变借用 | `Fn` | 获取不可变借用，只读取环境中的变量 |

当创建一个闭包时，Rust 根据其如何使用环境中变量来**自动推断**应实现哪个 trait：
- 所有闭包都实现了 `FnOnce`（至少能调用一次）
- 没有移动所有权的闭包还实现了 `FnMut`
- 不需要可变访问的闭包还实现了 `Fn`

### move 关键字

如果希望强制闭包获取其使用的环境值的**所有权**，可以在参数列表前使用 `move` 关键字。这在将闭包传递给新线程以便将数据移动到新线程中时最为实用。

### 示例一：不可变借用（Fn）

闭包只**读取**外部变量，编译器推断为 `Fn`：

**文件名: src/main.rs**

```rust
fn main() {
    let x = 4;

    let equal_to_x = |z| z == x; // 不可变借用 x

    let y = 4;
    assert!(equal_to_x(y)); // ✅ 可以编译运行
    println!("x 仍然可用: {}", x); // ✅ x 未被借走所有权，仍可使用
}
```

### 示例二：可变借用（FnMut）

闭包**修改**外部变量，编译器推断为 `FnMut`：

**文件名: src/main.rs**

```rust
fn main() {
    let mut count = 0;

    let mut increment = || {
        count += 1; // 可变借用 count
        println!("count = {}", count);
    };

    increment(); // count = 1
    increment(); // count = 2
    increment(); // count = 3

    // 注意：在 increment 的借用作用域结束前，不能再使用 count
    // 以下代码若移到最后一次调用之后则可以编译：
    println!("最终 count = {}", count); // ✅ 借用已结束，可以访问
}
```

> **注意**：声明闭包变量时需要加 `mut`（`let mut increment`），因为调用闭包会改变其内部捕获的状态。

### 示例三：获取所有权（FnOnce）

闭包**消费**（移走所有权）外部变量，只能被调用一次，编译器推断为 `FnOnce`：

**文件名: src/main.rs**

```rust
fn main() {
    let s = String::from("hello");

    let consume_s = || {
        // drop 会取得 s 的所有权并销毁它
        drop(s); // s 的所有权在此被消费
    };

    consume_s(); // ✅ 第一次调用成功

    // consume_s(); // ❌ 编译错误！s 已被消费，无法再次调用
}
```

> **提示**：大多数情况下编译器会自动推断最宽松的 trait，无需手动指定。若不确定应使用哪个，从 `Fn` 开始，编译器会告诉你是否需要 `FnMut` 或 `FnOnce`。

---

### 单线程场景：不需要 move

在同一线程中，闭包只需**不可变借用**环境变量即可，不需要使用 `move`：

**文件名: src/main.rs**

```rust
fn main() {
    let x = vec![1, 2, 3];

    let equal_to_x = |z| z == x; // 不可变借用 x，无需 move

    let y = vec![1, 2, 3];

    assert!(equal_to_x(y)); // ✅ 可以编译运行

    println!("x 仍然可用: {:?}", x); // ✅ x 未被移走，仍可使用
}
```

### 演示 move 导致所有权转移

下面的例子刻意使用 `move`，并在之后继续访问 `x`，以展示 `move` 的所有权转移效果：

**文件名: src/main.rs**（这些代码不能编译！）

```rust
fn main() {
    let x = vec![1, 2, 3];

    let equal_to_x = move |z| z == x; // x 的所有权移动进闭包

    println!("can't use x here: {:?}", x); // 错误！x 已被移动

    let y = vec![1, 2, 3];

    assert!(equal_to_x(y));
}
```

编译器错误：

```
error[E0382]: use of moved value: `x`
 --> src/main.rs:6:40
  |
4 |     let equal_to_x = move |z| z == x;
  |                      -------- value moved (into closure) here
5 |
6 |     println!("can't use x here: {:?}", x);
  |                                        ^ value used here after move
  |
  = note: move occurs because `x` has type `std::vec::Vec<i32>`, which does not
  implement the `Copy` trait
```

去掉 `println!` 即可修复问题。

### 多线程场景：必须使用 move

`move` 真正**必须使用**的场景是多线程。新线程的生命周期不确定，可能超过主线程，若闭包只是借用外部变量，主线程结束后变量被销毁，新线程访问就会产生**悬垂引用**，编译器会直接拒绝：

**文件名: src/main.rs**（这些代码不能编译！）

```rust
use std::thread;

fn main() {
    let x = vec![1, 2, 3];

    // 错误：编译器无法保证 x 在新线程执行期间始终有效
    let handle = thread::spawn(|| {
        println!("在新线程中使用 x: {:?}", x);
    });

    handle.join().unwrap();
}
```

加上 `move`，将 `x` 的所有权转移进新线程，问题解决：

**文件名: src/main.rs**

```rust
use std::thread;

fn main() {
    let x = vec![1, 2, 3];

    // ✅ move 将 x 的所有权转移进新线程，新线程独立拥有 x
    let handle = thread::spawn(move || {
        println!("在新线程中使用 x: {:?}", x);
    });

    // println!("{:?}", x); // 此处不可再使用 x，所有权已转移

    handle.join().unwrap();
}
```

| 场景 | 是否需要 move |
|---|---|
| 同一线程，只读变量 | ❌ 不可变借用即可 |
| 同一线程，修改变量 | ❌ 可变借用即可 |
| 传给新线程 | ✅ 必须 move，生命周期不确定 |

---

## 总结

| 特性 | 说明 |
|---|---|
| **匿名函数** | 闭包是可以储存在变量中或作为参数传递的匿名函数 |
| **类型推断** | 闭包通常不需要标注参数和返回值类型，编译器会自动推断 |
| **类型锁定** | 一旦推断出具体类型，闭包的类型就被锁定，不可再用其他类型调用 |
| **捕获环境** | 闭包可捕获外部作用域的变量，函数则不能 |
| **Fn trait** | 根据捕获方式分为 `Fn`、`FnMut`、`FnOnce`，编译器自动推断 |
| **move 关键字** | 强制闭包获取捕获变量的所有权，常用于多线程场景 |
| **惰性求值** | 配合 `Cacher` 结构体可实现 memoization，避免重复执行耗时计算 |

> **最佳实践**：大部分需要指定 `Fn` 系列 trait bound 的时候，可以从 `Fn` 开始，编译器会根据闭包体中的情况告诉你是否需要 `FnMut` 或 `FnOnce`。

---

## 知识自测

尝试独立回答以下问题，答案在下方。

---

**第 1 题**：闭包和普通函数最核心的区别是什么？

**第 2 题**：以下四种写法是否等价？哪些部分是可以省略的？

```rust
fn  add_one_v1   (x: u32) -> u32 { x + 1 }
let add_one_v2 = |x: u32| -> u32 { x + 1 };
let add_one_v3 = |x|             { x + 1 };
let add_one_v4 = |x|               x + 1  ;
```

**第 3 题**：以下代码能否正常编译？为什么？

```rust
let example_closure = |x| x;
let s = example_closure(String::from("hello"));
let n = example_closure(5);
```

**第 4 题**：文章中提到了两种重构方案，分别有什么缺点？

**第 5 题**：`Cacher` 的 `value` 方法是如何实现"只计算一次"的？请描述其核心逻辑。

**第 6 题**：`Cacher` 当前实现有哪两个限制？各自的解决方向是什么？

**第 7 题**：`Fn`、`FnMut`、`FnOnce` 三者之间是什么关系？一个实现了 `Fn` 的闭包，是否也实现了 `FnOnce`？

**第 8 题**：下面这个闭包实现了哪个 Fn trait？为什么？

```rust
let x = 4;
let equal_to_x = |z| z == x;
```

**第 9 题**：`move` 关键字的作用是什么？以下代码为什么无法编译？

```rust
let x = vec![1, 2, 3];
let equal_to_x = move |z| z == x;
println!("{:?}", x);
```

**第 10 题**：如果你需要把一个闭包传递给新线程执行，应该优先考虑使用哪个关键字？原因是什么？

---

<details markdown="1">
<summary>📖 点击查看答案</summary>

**第 1 题答案**

闭包可以**捕获定义时所在作用域的环境变量**，普通函数不能。函数从未允许捕获环境，因此也不会产生额外的内存开销。

---

**第 2 题答案**

四种写法**完全等价**，调用时产生相同行为。可以省略的部分：
- **类型注解**（参数类型和返回值类型）：编译器可自动推断
- **大括号**：当闭包体只有一行时可省略

第一行是函数定义，后三行是闭包，最后一行是最精简的写法。

---

**第 3 题答案**

**不能编译**。但原因不是"无法推断类型"，而恰恰相反：

编译器在第一次调用时**成功推断**出 `x` 的类型为 `String`，并将其**锁定**。第二次用整数 `5` 调用时，与已锁定的 `String` 类型冲突，因此报错。

> 核心：**类型一旦推断确定就被锁定，不可再用不同类型调用同一闭包。**

---

**第 4 题答案**

| 方案 | 缺点 |
|---|---|
| 方案一（提取到变量） | 无论走哪个分支都**提前执行**了计算，包括完全不需要结果的 `if random_number == 3` 分支 |
| 方案二（使用闭包） | 闭包本身没有缓存能力，第一个 `if` 块中**仍然调用了闭包两次** |

---

**第 5 题答案**

`value` 方法通过 `match self.value` 判断：
- 若为 `None`：执行闭包计算结果，存入 `Some(v)` 并返回
- 若为 `Some(v)`：直接返回缓存的值，不再执行闭包

这样无论调用多少次，慢计算**最多只执行一次**。

---

**第 6 题答案**

**限制一**：对任意 `arg` 只缓存**第一次调用**的结果，不同参数值仍会返回第一次的缓存值，导致结果错误。
→ 解决方向：用 **`HashMap`** 以 `arg` 为 key 分别缓存不同参数对应的结果。

**限制二**：只支持 `u32 -> u32` 类型的闭包，无法复用于其他类型场景。
→ 解决方向：引入更多**泛型参数**来增加灵活性。

---

**第 7 题答案**

三者是**层次包含关系**：`FnOnce ⊇ FnMut ⊇ Fn`

- `FnOnce` 最宽泛，**所有**闭包都实现它（保证至少能调用一次）
- `Fn` 最严格，实现了 `Fn` 的闭包**同时也**实现了 `FnMut` 和 `FnOnce`

所以：实现了 `Fn` 的闭包，**一定也**实现了 `FnOnce`。

---

**第 8 题答案**

实现了 **`Fn`**。

因为该闭包对捕获的变量 `x` 只做**不可变借用**（只是读取 `x` 的值做比较），没有修改也没有消费，因此编译器推断其实现 `Fn`。

---

**第 9 题答案**

`move` 关键字强制将捕获变量的**所有权转移进闭包**。

代码无法编译的原因：`move |z| z == x` 执行后，`x` 的所有权已移入闭包，外部作用域中的 `x` 不再有效。之后 `println!` 试图使用已失效的 `x`，编译器报 "use of moved value" 错误。去掉 `println!` 即可修复。

---

**第 10 题答案**

应优先使用 **`move`** 关键字。

原因：新线程的生命周期可能**超过**当前作用域。若闭包只是借用外部变量，编译器无法保证引用在线程整个执行期间始终有效；使用 `move` 将所有权转移进闭包，新线程就拥有了独立的数据，不再依赖外部作用域的生命周期，从而保证内存安全。

</details>

---

## 参考资料

- [The Rust Programming Language - Closures: Anonymous Functions that Can Capture Their Environment](https://doc.rust-lang.org/book/ch13-01-closures.html)
- [std::ops::Fn trait](https://doc.rust-lang.org/std/ops/trait.Fn.html)
- [std::ops::FnMut trait](https://doc.rust-lang.org/std/ops/trait.FnMut.html)
- [std::ops::FnOnce trait](https://doc.rust-lang.org/std/ops/trait.FnOnce.html)

---
