---
title: rust 文档 - 集合 - HashMap 哈希映射详解
categories: [Rust, 集合]
series: rust
series_order: 6
tags: [rust]
---

## 学习资源

- **Rust 程序设计语言（2024 edition）简体中文版**
  GitHub 仓库：https://github.com/KaiserY/trpl-zh-cn

- **B站视频教程**
  【Rust编程语言入门教程（Rust语言/Rust权威指南配套）【已完结】】
  https://www.bilibili.com/video/BV1hp4y1k7SV/?share_source=copy_web&vd_source=28d07063ae73341866c4483f21f5f907

> 视频和 GitHub 的资料是配套的

---

# Rust HashMap 哈希映射详解

> **核心概念**：`HashMap<K, V>` 是 Rust 标准库提供的键值对集合类型，通过哈希函数实现快速的键值查找。

## 一、HashMap 简介

### 什么是 HashMap？

`HashMap<K, V>` 是 Rust 中最后一个常用集合类型：

- **键值对存储**：存储键类型 `K` 对应值类型 `V` 的映射
- **哈希函数**：通过哈希函数决定如何将键和值放入内存
- **快速查找**：平均 O(1) 时间复杂度的查找性能
- **无序存储**：不保证元素的顺序

### 其他语言的叫法

很多编程语言都支持这种数据结构，但名字不同：
- **哈希（Hash）**
- **映射（Map）**
- **对象（Object）**
- **哈希表（Hash Table）**
- **关联数组（Associative Array）**
- **字典（Dictionary）**

### 使用场景

HashMap 适用于需要通过任意类型的键来查找数据的场景：
- 游戏中记录每个队伍的分数（队名 → 分数）
- 统计单词出现次数（单词 → 次数）
- 缓存计算结果（输入 → 输出）
- 配置管理（配置名 → 配置值）

### HashMap 的底层实现

**核心原理**：HashMap 使用**哈希表**数据结构，通过哈希函数将键映射到内存位置。

```
HashMap 的内存布局（简化版）

栈上的 HashMap 结构体
┌─────────────────────┐
│ hash_builder        │  <- 哈希函数构建器
│ table: RawTable     │  <- 指向堆上的哈希表
└─────────────────────┘
         |
         v
堆上的哈希表（桶数组）
┌─────┬─────┬─────┬─────┬─────┬─────┐
│ 空  │Entry│ 空  │Entry│Entry│ 空  │
└─────┴─────┴─────┴─────┴─────┴─────┘
         |           |     |
         v           v     v
      (K, V)     (K, V) (K, V)
```

**HashMap 的核心组件**：

1. **哈希函数**：将键转换为哈希值（整数）
2. **桶数组**：存储键值对的数组
3. **冲突处理**：当多个键映射到同一位置时的处理机制

**查找过程**：

```
1. 计算键的哈希值
   key "Blue" → hash(key) → 12345678

2. 将哈希值映射到桶索引
   12345678 % bucket_count → index 3

3. 在桶中查找键值对
   buckets[3] → 找到 ("Blue", 10)
```

**关键特性**：
- HashMap 本身是个结构体，存在**栈**上
- 实际的键值对数据存在**堆**上的哈希表中
- 平均情况下，查找、插入、删除都是 **O(1)** 时间复杂度
- 最坏情况下（哈希冲突严重）是 **O(n)** 时间复杂度

---

## 二、创建 HashMap

### 方法 1：使用 `HashMap::new()` 创建空 HashMap

```rust
use std::collections::HashMap;

let mut scores = HashMap::new();

scores.insert(String::from("Blue"), 10);
scores.insert(String::from("Yellow"), 50);
```

**说明**：
- 必须先 `use std::collections::HashMap` 引入
- HashMap **不在 prelude 中**，需要手动引入
- 创建空 HashMap 时通常需要后续插入数据来推断类型

**为什么需要 use？**

HashMap 不像 Vec 和 String 那样常用，所以没有被自动引入（prelude）。这是 Rust 的设计选择：
- **Vec**：非常常用 → 在 prelude 中
- **String**：非常常用 → 在 prelude 中
- **HashMap**：相对少用 → 需要手动 `use`

### 方法 2：使用 `collect` 方法从两个 Vector 创建

```rust
use std::collections::HashMap;

let teams = vec![String::from("Blue"), String::from("Yellow")];
let initial_scores = vec![10, 50];

let scores: HashMap<_, _> = teams.iter()
                                  .zip(initial_scores.iter())
                                  .collect();
```

**说明**：
- 使用 `zip` 方法将两个 vector 组合成元组的迭代器
- 使用 `collect` 方法将元组迭代器转换成 HashMap
- 必须标注类型 `HashMap<_, _>`，因为 `collect` 可以生成多种集合类型
- 可以用 `_` 占位符让 Rust 推断键和值的具体类型

**工作原理**：

```
teams:          ["Blue", "Yellow"]
initial_scores: [10, 50]
                  ↓ zip
元组迭代器:      [("Blue", 10), ("Yellow", 50)]
                  ↓ collect
HashMap:        {"Blue": 10, "Yellow": 50}
```

### 创建方式对比

| 方式 | 语法 | 适用场景 |
|------|------|---------|
| `HashMap::new()` | `let mut map = HashMap::new();` | 逐步插入键值对 |
| `collect` | `teams.iter().zip(scores.iter()).collect()` | 从两个 vector 批量创建 |

---

## 三、HashMap 和所有权

### 实现了 Copy trait 的类型

对于实现了 `Copy` trait 的类型（如 `i32`），值会被**拷贝**进 HashMap：

```rust
use std::collections::HashMap;

let mut map = HashMap::new();
let key = 1;
let value = 100;

map.insert(key, value);

// ✅ key 和 value 仍然可用（因为 i32 实现了 Copy）
println!("key: {}, value: {}", key, value);
```

### 拥有所有权的类型

对于拥有所有权的类型（如 `String`），值会被**移动**进 HashMap：

```rust
use std::collections::HashMap;

let field_name = String::from("Favorite color");
let field_value = String::from("Blue");

let mut map = HashMap::new();
map.insert(field_name, field_value);

// ❌ 错误：field_name 和 field_value 已被移动
// println!("{}: {}", field_name, field_value);
```

**关键点**：
- `insert` 调用会获取键和值的所有权
- 插入后，原变量不再有效
- HashMap 成为这些值的所有者

### 插入引用

如果插入值的引用，值本身不会被移动：

```rust
use std::collections::HashMap;

let field_name = String::from("Favorite color");
let field_value = String::from("Blue");

let mut map = HashMap::new();
map.insert(&field_name, &field_value);

// ✅ 原变量仍然可用
println!("{}: {}", field_name, field_value);
```

**注意**：
- 引用指向的值必须至少在 HashMap 有效时也是有效的
- 这涉及到**生命周期**的概念（第十章会详细讲）

### 所有权规则总结

| 类型 | 行为 | 原变量是否可用 | 示例 |
|------|------|--------------|------|
| Copy 类型（如 `i32`） | 拷贝 | ✅ 可用 | `map.insert(1, 100)` |
| 非 Copy 类型（如 `String`） | 移动 | ❌ 不可用 | `map.insert(key, value)` |
| 引用（如 `&String`） | 借用 | ✅ 可用 | `map.insert(&key, &value)` |

---

## 四、访问 HashMap 中的值

### 使用 `get` 方法

```rust
use std::collections::HashMap;

let mut scores = HashMap::new();
scores.insert(String::from("Blue"), 10);
scores.insert(String::from("Yellow"), 50);

let team_name = String::from("Blue");
let score = scores.get(&team_name);

match score {
    Some(s) => println!("Blue team score: {}", s),
    None => println!("Team not found"),
}
```

**说明**：
- `get` 方法接受键的**引用**作为参数
- 返回 `Option<&V>` 类型
- 如果键存在，返回 `Some(&value)`
- 如果键不存在，返回 `None`

**为什么返回 Option？**

因为键可能不存在，返回 `Option` 强制你处理这种情况，避免程序崩溃。

### 简化写法

```rust
// 使用 unwrap_or 提供默认值
let score = scores.get(&team_name).unwrap_or(&0);
println!("Score: {}", score);

// 使用 copied 将 Option<&i32> 转换为 Option<i32>
let score: Option<i32> = scores.get(&team_name).copied();
```

### 遍历 HashMap

使用 `for` 循环遍历所有键值对：

```rust
use std::collections::HashMap;

let mut scores = HashMap::new();
scores.insert(String::from("Blue"), 10);
scores.insert(String::from("Yellow"), 50);

for (key, value) in &scores {
    println!("{}: {}", key, value);
}
```

**输出**（顺序不确定）：

```
Yellow: 50
Blue: 10
```

**关键点**：
- HashMap 是**无序**的，遍历顺序不确定
- 使用 `&scores` 借用 HashMap，不会获取所有权
- `key` 和 `value` 都是引用类型

---

## 五、更新 HashMap

HashMap 的每个键只能对应一个值。更新时有三种策略：

### 策略 1：覆盖旧值

直接插入相同的键，旧值会被替换：

```rust
use std::collections::HashMap;

let mut scores = HashMap::new();

scores.insert(String::from("Blue"), 10);
scores.insert(String::from("Blue"), 25);  // 覆盖旧值

println!("{:?}", scores);  // {"Blue": 25}
```

**说明**：
- 第二次 `insert` 会覆盖第一次的值
- 旧值 10 被丢弃，新值 25 生效

### 策略 2：只在键不存在时插入

使用 `entry` 和 `or_insert` 方法：

```rust
use std::collections::HashMap;

let mut scores = HashMap::new();
scores.insert(String::from("Blue"), 10);

scores.entry(String::from("Yellow")).or_insert(50);
scores.entry(String::from("Blue")).or_insert(50);

println!("{:?}", scores);  // {"Yellow": 50, "Blue": 10}
```

**说明**：
- `entry` 方法返回 `Entry` 枚举，代表可能存在或不存在的值
- `or_insert` 方法：
  - 如果键存在，返回对应值的可变引用
  - 如果键不存在，插入参数值并返回可变引用

**工作原理**：

```
scores.entry("Yellow").or_insert(50)
  ↓
检查 "Yellow" 是否存在
  ↓ 不存在
插入 ("Yellow", 50)
  ↓
返回 &mut 50

scores.entry("Blue").or_insert(50)
  ↓
检查 "Blue" 是否存在
  ↓ 存在（值为 10）
不插入，直接返回 &mut 10
```

### 策略 3：根据旧值更新

使用 `entry` 和 `or_insert` 返回的可变引用：

```rust
use std::collections::HashMap;

let text = "hello world wonderful world";
let mut map = HashMap::new();

for word in text.split_whitespace() {
    let count = map.entry(word).or_insert(0);
    *count += 1;
}

println!("{:?}", map);  // {"world": 2, "hello": 1, "wonderful": 1}
```

**说明**：
- `or_insert(0)` 返回值的**可变引用** `&mut V`
- 使用 `*count` 解引用后才能修改值
- 第一次遇到单词时插入 0，然后加 1
- 后续遇到相同单词时直接加 1

**详细执行过程**：

```
遍历 "hello":
  map.entry("hello").or_insert(0)  → 插入 ("hello", 0)，返回 &mut 0
  *count += 1                       → 修改为 1

遍历 "world":
  map.entry("world").or_insert(0)  → 插入 ("world", 0)，返回 &mut 0
  *count += 1                       → 修改为 1

遍历 "wonderful":
  map.entry("wonderful").or_insert(0) → 插入 ("wonderful", 0)，返回 &mut 0
  *count += 1                          → 修改为 1

遍历 "world"（第二次）:
  map.entry("world").or_insert(0)  → 键已存在，返回 &mut 1
  *count += 1                       → 修改为 2
```

### 更新策略对比

| 策略 | 方法 | 行为 | 使用场景 |
|------|------|------|---------|
| 覆盖旧值 | `insert(k, v)` | 直接替换 | 不关心旧值 |
| 保留旧值 | `entry(k).or_insert(v)` | 键不存在时才插入 | 初始化默认值 |
| 基于旧值更新 | `entry(k).or_insert(v)` + 解引用 | 修改现有值 | 计数、累加等 |

---

## 六、哈希函数

### 默认哈希函数

HashMap 默认使用 **SipHash** 哈希函数：

- **密码学安全**：可以抵抗拒绝服务（DoS）攻击
- **性能代价**：不是最快的算法，但安全性更高
- **适用场景**：大多数情况下的默认选择

**什么是 DoS 攻击？**

攻击者可以构造特殊的键，使它们都映射到同一个桶，导致哈希表退化成链表，查找性能从 O(1) 降到 O(n)。

### 自定义哈希函数

如果性能监测显示默认哈希函数太慢，可以指定不同的 hasher：

```rust
use std::collections::HashMap;
use std::hash::BuildHasherDefault;
use std::collections::hash_map::DefaultHasher;

// 使用自定义 hasher
let mut map = HashMap::with_hasher(BuildHasherDefault::<DefaultHasher>::default());
map.insert(1, 2);
```

**说明**：
- `hasher` 是实现了 `BuildHasher` trait 的类型
- 不需要从头实现，可以使用 [crates.io](https://crates.io) 上的第三方库
- 常用的替代方案：`FxHashMap`（Firefox 使用的哈希函数，更快但不抗 DoS）

**性能 vs 安全性**：

| 哈希函数        | 性能 | 安全性       | 适用场景          |
|-------------|----|-----------|---------------|
| SipHash（默认） | 中等 | 高（抗 DoS）  | 通用场景，键来自不可信输入 |
| FxHash      | 快  | 低（不抗 DoS） | 键可信，追求性能      |
| AHash       | 很快 | 中等        | 平衡性能和安全性      |

---

## 七、常用方法

### 插入和删除

```rust
use std::collections::HashMap;

let mut map = HashMap::new();

// 插入
map.insert("key1", 100);
map.insert("key2", 200);

// 删除（返回 Option<V>）
let removed = map.remove("key1");  // Some(100)
let not_found = map.remove("key3");  // None

// 清空
map.clear();
```

### 查询

```rust
use std::collections::HashMap;

let mut map = HashMap::new();
map.insert("key1", 100);

// 检查键是否存在
if map.contains_key("key1") {
    println!("key1 exists");
}

// 获取值
let value = map.get("key1");  // Some(&100)

// 获取可变引用
if let Some(v) = map.get_mut("key1") {
    *v += 50;  // 修改为 150
}

// 获取长度
let len = map.len();  // 1

// 检查是否为空
let is_empty = map.is_empty();  // false
```

### 常用方法总结

| 方法                 | 说明       | 返回值              |
|--------------------|----------|------------------|
| `insert(k, v)`     | 插入键值对    | `Option<V>`（旧值）  |
| `get(&k)`          | 获取值的引用   | `Option<&V>`     |
| `get_mut(&k)`      | 获取值的可变引用 | `Option<&mut V>` |
| `remove(&k)`       | 删除键值对    | `Option<V>`      |
| `contains_key(&k)` | 检查键是否存在  | `bool`           |
| `entry(k)`         | 获取 Entry | `Entry<K, V>`    |
| `len()`            | 获取键值对数量  | `usize`          |
| `is_empty()`       | 检查是否为空   | `bool`           |
| `clear()`          | 清空所有键值对  | `()`             |

**更多方法**：查看标准库 [HashMap API 文档](https://doc.rust-lang.org/std/collections/struct.HashMap.html)

---

## 八、实战练习

### 练习 1：统计数字的平均数、中位数和众数

```rust
use std::collections::HashMap;

fn statistics(numbers: &[i32]) -> (f64, i32, i32) {
    // 平均数
    let sum: i32 = numbers.iter().sum();
    let mean = sum as f64 / numbers.len() as f64;

    // 中位数
    let mut sorted = numbers.to_vec();
    sorted.sort();
    let median = sorted[sorted.len() / 2];

    // 众数（使用 HashMap 统计）
    let mut counts = HashMap::new();
    for &num in numbers {
        *counts.entry(num).or_insert(0) += 1;
    }
    let mode = counts.iter()
                     .max_by_key(|&(_, count)| count)
                     .map(|(&num, _)| num)
                     .unwrap();

    (mean, median, mode)
}

fn main() {
    let numbers = vec![1, 2, 3, 3, 4, 5, 5, 5];
    let (mean, median, mode) = statistics(&numbers);
    println!("平均数: {}, 中位数: {}, 众数: {}", mean, median, mode);
}
```

### 练习 2：Pig Latin 转换

```rust
fn pig_latin(word: &str) -> String {
    let vowels = ['a', 'e', 'i', 'o', 'u'];
    let first_char = word.chars().next().unwrap();

    if vowels.contains(&first_char.to_ascii_lowercase()) {
        // 元音开头：加 "hay"
        format!("{}-hay", word)
    } else {
        // 辅音开头：移到结尾加 "ay"
        let rest: String = word.chars().skip(1).collect();
        format!("{}-{}ay", rest, first_char)
    }
}

fn main() {
    println!("{}", pig_latin("first"));   // irst-fay
    println!("{}", pig_latin("apple"));   // apple-hay
}
```

### 练习 3：员工管理系统

```rust
use std::collections::HashMap;

fn main() {
    let mut departments: HashMap<String, Vec<String>> = HashMap::new();

    // 添加员工
    departments.entry("Engineering".to_string())
               .or_insert(Vec::new())
               .push("Sally".to_string());

    departments.entry("Sales".to_string())
               .or_insert(Vec::new())
               .push("Amir".to_string());

    // 获取部门员工列表
    if let Some(employees) = departments.get("Engineering") {
        println!("Engineering: {:?}", employees);
    }

    // 获取所有员工（按部门字典序）
    let mut dept_names: Vec<_> = departments.keys().collect();
    dept_names.sort();

    for dept in dept_names {
        let mut employees = departments[dept].clone();
        employees.sort();
        println!("{}: {:?}", dept, employees);
    }
}
```

---

## 九、总结

### 核心要点

1. **创建 HashMap**
   - `HashMap::new()`：创建空 HashMap
   - `collect`：从迭代器创建
   - 需要 `use std::collections::HashMap`

2. **所有权规则**
   - Copy 类型：拷贝进 HashMap
   - 非 Copy 类型：移动进 HashMap
   - 引用：不移动，但需要注意生命周期

3. **访问值**
   - `get(&key)`：返回 `Option<&V>`
   - 遍历：`for (k, v) in &map`

4. **更新策略**
   - 覆盖：`insert(k, v)`
   - 保留旧值：`entry(k).or_insert(v)`
   - 基于旧值更新：`entry(k).or_insert(v)` + 解引用

5. **哈希函数**
   - 默认：SipHash（安全但较慢）
   - 可自定义：使用第三方 hasher

### HashMap vs Vec vs String

| 特性    | HashMap | Vec     | String     |
|-------|---------|---------|------------|
| 数据结构  | 哈希表     | 动态数组    | UTF-8 字节数组 |
| 访问方式  | 键       | 索引      | 索引/迭代器     |
| 有序性   | 无序      | 有序      | 有序         |
| 查找复杂度 | O(1) 平均 | O(n)    | O(n)       |
| 插入复杂度 | O(1) 平均 | O(1) 末尾 | O(1) 末尾    |
| 内存开销  | 高（哈希表）  | 低       | 低          |

### 最佳实践

1. **选择合适的集合类型**
   - 需要通过键查找 → HashMap
   - 需要有序列表 → Vec
   - 需要文本处理 → String

2. **预分配容量**
   ```rust
   // 如果知道大致大小，预分配容量
   let mut map = HashMap::with_capacity(100);
   ```

3. **使用 entry API**
   ```rust
   // ✅ 推荐：使用 entry API
   map.entry(key).or_insert(0);

   // ❌ 不推荐：手动检查
   if !map.contains_key(&key) {
       map.insert(key, 0);
   }
   ```

4. **注意所有权**
   ```rust
   // ✅ 使用引用避免移动
   let value = map.get(&key);

   // ❌ 不要尝试移动值
   // let value = map[&key];  // 这会尝试移动值
   ```

5. **选择合适的哈希函数**
   - 默认 SipHash：通用场景
   - FxHash：性能敏感且键可信
   - AHash：平衡性能和安全性

---

## 参考资料

- [The Rust Programming Language - Hash Maps](https://doc.rust-lang.org/book/ch08-03-hash-maps.html)
- [HashMap API 文档](https://doc.rust-lang.org/std/collections/struct.HashMap.html)
- [SipHash 论文](https://www.131002.net/siphash/siphash.pdf)

---

**下一步**：我们已经学习了 Rust 的三大常用集合类型（Vector、String、HashMap）。接下来是学习错误处理的好时机！
