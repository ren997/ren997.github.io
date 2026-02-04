---
title: rust文档-切片
categories: [Rust, 基础]
tags: [rust]
---


# Rust 切片（Slice）详解

> **核心概念**：切片是对连续数据序列的**引用视图**，它不拥有数据，只是"借用"了一段数据。

## 一、切片的本质

切片是一种**胖指针（fat pointer）**，包含两部分信息：
- 指向数据的指针
- 数据的长度

```rust
let s = String::from("hello world");
let slice = &s[0..5];  // slice 的类型是 &str
// slice 内部：{ ptr: 指向 'h' 的地址, len: 5 }
```

## 二、切片类型总览

| 类型 | 本质 | 拥有数据 | 可修改内容 | 可改变长度 |
|------|------|----------|------------|------------|
| `String` | 堆上的字符串 | ✅ | ✅ | ✅ |
| `&String` | 对 String 的不可变引用 | ❌ | ❌ | ❌ |
| `&mut String` | 对 String 的可变引用 | ❌ | ✅ | ✅ |
| `&str` | 字符串切片（不可变） | ❌ | ❌ | ❌ |
| `&mut str` | 字符串切片（可变） | ❌ | ✅（有限） | ❌ |
| `Vec<T>` | 堆上的动态数组 | ✅ | ✅ | ✅ |
| `&[T]` | 数组切片（不可变） | ❌ | ❌ | ❌ |
| `&mut [T]` | 数组切片（可变） | ❌ | ✅ | ❌ |

## 三、字符串切片 `&str`

### 基本用法

```rust
let s = String::from("hello world");

// 创建切片的几种方式
let hello = &s[0..5];     // "hello"
let world = &s[6..11];    // "world"
let hello2 = &s[..5];     // 从开头开始，等价于 &s[0..5]
let world2 = &s[6..];     // 到结尾，等价于 &s[6..len]
let whole = &s[..];       // 整个字符串，等价于 &s[0..len]
```

### 字符串字面量就是切片

```rust
let s: &str = "hello world";  // 字符串字面量的类型就是 &str
// 它是指向二进制程序中某处的切片，所以是不可变的
```

### 注意：切片索引必须在有效的 UTF-8 字符边界

```rust
let s = String::from("你好");
// let slice = &s[0..1];  // ❌ 错误！"你"占 3 个字节，不能在中间切
let slice = &s[0..3];     // ✅ 正确，得到 "你"
```

## 四、数组切片 `&[T]`

```rust
let arr = [1, 2, 3, 4, 5];

let slice: &[i32] = &arr[1..4];  // [2, 3, 4]
println!("{:?}", slice);

// Vec 也可以创建切片
let vec = vec![1, 2, 3, 4, 5];
let slice: &[i32] = &vec[1..4];  // [2, 3, 4]
```

## 五、可变切片 `&mut [T]` / `&mut str`

### 可变数组切片

```rust
let mut arr = [1, 2, 3, 4, 5];
let slice: &mut [i32] = &mut arr[1..4];

slice[0] = 99;  // 修改切片会影响原数组
println!("{:?}", arr);  // [1, 99, 3, 4, 5]
```

### 可变字符串切片（功能有限）

```rust
let mut s = String::from("hello");
let slice: &mut str = &mut s[..];

slice.make_ascii_uppercase();  // ✅ 原地修改，长度不变
println!("{}", s);  // "HELLO"

// 注意：不能改变长度！
// slice.push('!');  // ❌ 不存在这个方法
```

**为什么 `&mut str` 功能有限？**
- `str` 是 UTF-8 编码，修改字符可能改变字节长度
- 切片不拥有数据，无法重新分配内存
- 如果需要修改字符串长度，使用 `&mut String`

## 六、切片与借用规则

切片本质是引用，所以遵守 Rust 的借用规则：

```rust
let mut s = String::from("hello");

let slice = &s[0..2];  // 不可变借用

// s.push_str(" world");  // ❌ 错误！不能在不可变借用存在时修改
println!("{}", slice);   // 使用切片

s.push_str(" world");    // ✅ 切片不再使用后，可以修改
```

### 借用规则回顾

1. **同一时间**，要么只有一个可变引用，要么有多个不可变引用
2. 引用必须始终有效（不能悬垂）

```rust
let mut s = String::from("hello");

// 多个不可变切片 ✅
let s1 = &s[0..2];
let s2 = &s[3..5];
println!("{} {}", s1, s2);

// 可变切片独占 ✅
let s3 = &mut s[..];
s3.make_ascii_uppercase();
// 此时不能有其他引用
```

## 七、切片作为函数参数

使用切片作为参数比使用 `String` 或 `Vec` 更灵活：

```rust
// 推荐：接受切片，更通用
fn first_word(s: &str) -> &str {
    let bytes = s.as_bytes();
    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return &s[0..i];
        }
    }
    &s[..]
}

fn main() {
    let s1 = String::from("hello world");
    let s2 = "hello world";  // &str

    // 两种类型都能传入
    let word1 = first_word(&s1);  // &String 会自动转换为 &str
    let word2 = first_word(s2);   // &str 直接传入

    println!("{} {}", word1, word2);
}
```

### Deref 强制转换

`&String` 可以自动转换为 `&str`，这是因为 `String` 实现了 `Deref<Target = str>`：

```rust
fn print_str(s: &str) {
    println!("{}", s);
}

let s = String::from("hello");
print_str(&s);  // &String 自动转换为 &str
```

## 八、常见错误

### 错误 1：返回局部变量的切片

```rust
fn bad() -> &str {
    let s = String::from("hello");
    &s[..]  // ❌ 错误！s 在函数结束时被释放，切片会悬垂
}

// 正确做法：返回 String
fn good() -> String {
    String::from("hello")
}
```

### 错误 2：在切片存在时修改原数据

```rust
let mut s = String::from("hello");
let slice = &s[..];
s.clear();  // ❌ 错误！不能在借用存在时修改
println!("{}", slice);
```

### 错误 3：切片索引越界或不在字符边界

```rust
let s = String::from("hello");
// let slice = &s[0..10];  // ❌ 运行时 panic：索引越界

let s2 = String::from("你好");
// let slice = &s2[0..1];  // ❌ 运行时 panic：不在字符边界
```

---

## 参考资料

- [The Rust Programming Language - Functions](https://doc.rust-lang.org/book/ch03-03-how-functions-work.html)
- [Rust Reference - Statements](https://doc.rust-lang.org/reference/statements.html)
- [Rust Reference - Expressions](https://doc.rust-lang.org/reference/expressions.html)
- [The Rust Programming Language - Slice Type](https://doc.rust-lang.org/book/ch04-03-slices.html)



---
