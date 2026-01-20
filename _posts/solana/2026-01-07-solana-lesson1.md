---
title: 第一节-Solana 介绍
tags: Solana 教程
---

## 课程资料

本节主要讲解区块链基础和 Solana 的概述。本文是对资料的 Solana 介绍进行了部分整理，用通俗概念来讲解 Solana 的核心概念。

- **资料来源**：[OpenBuild - Solana 教程](https://openbuild.xyz/learn/challenges/2086624241/1767500233)
- **通俗讲解版本**：如果你觉得本文内容较为抽象，可以阅读 [《第一节-Solana 核心概念通俗讲解》]({{ site.baseurl }}/2026/01/07/solana-lesson1-explanation.html)，该文章用更生活化的语言和类比来解释 Solana 的核心概念

<!--more-->

## 概述
要在 Solana 上进行开发，了解 Solana 开发中独特的几个关键概念至关重要。本节涵盖了您在开始 Solana 开发时需要理解的核心概念，包括账户、交易、程序等内容。

## 账户（Account）

Solana 网络上的所有数据都存储在账户中。您可以将 Solana 网络视为一个包含单一账户表的公共数据库。账户与其地址之间的关系类似于键值对，其中键是地址，值是账户。

每个账户都有相同的基本结构，并且可以通过其地址找到。

![账户基本结构]({{ site.baseurl }}/assets/images/sol1/img.png)

### 账户地址

账户地址是一个 32 字节的唯一 ID，用于在 Solana 区块链上定位账户。账户地址通常以 base58 编码字符串的形式显示。大多数账户使用 Ed25519 公钥 作为其地址，但这并不是强制性的，因为 Solana 还支持程序派生地址。

![账户地址示例]({{ site.baseurl }}/assets/images/sol1/img_1.png)

### 账户结构

每个 Account 的最大大小为 10MiB，并包含以下信息：

- **lamports**: 账户中的 lamports 数量
- **data**: 账户的数据
- **owner**: 拥有该账户的程序的 ID
- **executable**: 指示账户是否包含可执行二进制文件
- **rent_epoch**: 已弃用的租金 epoch 字段

### 账户类型

账户分为两大类：

- **程序账户**：包含可执行代码的账户
- **数据账户**：不包含可执行代码的账户

程序代码与其状态的分离是 Solana 账户模型的一个关键特性。（类似于操作系统，通常将程序和其数据分为不同的文件。）

#### 程序账户

每个程序都由一个加载器程序拥有，用于部署和管理账户。当部署一个新的程序时，会创建一个账户来存储其可执行代码。这被称为程序账户。（为了简化，可以将程序账户视为程序本身。）

在下图中，可以看到一个加载器程序被用来部署一个程序账户。程序账户的 data 包含可执行的程序代码。

![程序账户]({{ site.baseurl }}/assets/images/sol1/img_2.png)

#### 程序数据账户

使用 loader-v3 部署的程序，其 data 字段中不包含程序代码。相反，其 data 指向一个单独的 **程序数据账户**（Program Executable Data Account），该账户包含程序代码。

**关键特征**：
- **存储内容**：程序自身的代码数据（可执行的二进制代码）
- **Owner**：BPF Loader
- **创建时机**：程序部署时由 BPF Loader 自动创建
- **用途**：存储程序的源代码编译后的可执行代码
- **可执行**：False（虽然存储代码，但账户本身不可执行）

**重要理解**：程序数据账户存储的是程序自身的数据（代码），而不是程序运行时的业务数据。

![程序数据账户]({{ site.baseurl }}/assets/images/sol1/img_3.png)

#### 数据账户

数据账户不包含可执行代码，而是用于存储信息。

#### 程序状态账户

程序使用数据账户来维护其状态。为此，程序必须首先创建一个新的数据账户。创建程序状态账户的过程通常是抽象的，但了解其底层过程是有帮助的。

**关键特征**：
- **存储内容**：程序运行时产生的业务数据（用户数据、状态信息等）
- **Owner**：程序本身（program_id）
- **创建时机**：程序运行时通过 CPI 调用 System Program 创建
- **用途**：存储程序的业务状态，如用户余额、NFT 元数据、游戏分数等
- **可执行**：False（纯数据账户）

**重要理解**：程序状态账户存储的是程序运行时产生的业务数据，而不是程序自身的代码数据。每个用户或每个业务实体通常有自己独立的状态账户。

**创建流程**：

为了管理其状态，一个新程序必须：

1. 调用 System Program 来创建一个账户。（然后 System Program 将所有权转移给新程序。）
2. 根据其 instructions 初始化账户数据。

![程序状态账户]({{ site.baseurl }}/assets/images/sol1/img_4.png)

##### 📖 程序数据账户 vs 程序状态账户对比

为了更清晰地理解这两个概念的区别，我们用一个对比表来说明：

| 特征 | 程序数据账户（Program Executable Data Account） | 程序状态账户（Program State Data Account） |
|------|-----------------------------------------------|------------------------------------------|
| **存储内容** | 程序自身的代码数据（可执行二进制代码） | 程序运行时产生的业务数据（用户数据、状态信息） |
| **Owner** | BPF Loader | 程序本身（program_id） |
| **创建时机** | 程序部署时（一次性） | 程序运行时（可多次创建） |
| **创建者** | BPF Loader | 程序通过 CPI 调用 System Program |
| **数量** | 每个程序只有 1 个 | 每个程序可以有多个（每个用户/实体一个） |
| **可执行** | False | False |
| **典型例子** | 智能合约的编译后代码 | 用户余额、NFT 元数据、游戏分数、订单信息 |

**记忆技巧**：
- **程序数据账户** = 程序的"安装包"（存储程序代码）
- **程序状态账户** = 程序的"数据库"（存储业务数据）

##### 📖 完整流程解析

上图展示了程序账户和数据账户之间的 owner 关系。为了更好地理解，我们用完整流程图来展示从部署程序到创建状态账户的全过程：

**阶段一：部署程序（一次性操作）**

```
开发者
    ↓ 执行: solana program deploy
BPF Loader（程序加载器）
    ↓ 创建并设置 owner
Program Account
    ├─ Data: Program Code（程序代码）
    ├─ Executable: True
    └─ Owner: BPF Loader
```

**阶段二：创建状态账户（运行时）**

```
用户
    ↓ 发送交易：调用 Program 的"初始化"指令
Solana Runtime
    ↓ 加载并执行 Program Code
Your Program 执行
    ↓ CPI 调用（跨程序调用）
System Program
    ↓ 创建新账户：分配地址、空间、lamports
    ↓ 设置 owner = Your Program
Data Account
    ├─ Data: (空的，待初始化)
    ├─ Executable: False
    └─ Owner: Your Program
    ↓
Your Program 继续执行
    ↓ 写入初始数据
Data Account
    └─ Data: Program State（程序状态）
```

**关键角色说明**：

- **BPF Loader**：Solana 的程序加载器，负责部署和管理智能合约。它创建 Program Account 并将其标记为可执行（`executable=true`），然后拥有（owner）这个程序账户。
- **System Program**：Solana 的基础系统程序，负责创建账户、转账、分配空间等基础操作。当程序需要创建数据账户时，会通过 CPI（跨程序调用）请求 System Program 帮忙创建。
- **Program Account**：存储程序代码的账户，`executable=true` 表示它可以被执行。
- **Data Account**：存储程序运行时状态的账户，`executable=false` 表示它只是数据容器。

**owner 的含义**：

在 Solana 中，每个账户都有一个 `owner` 字段，表示**哪个程序有权限修改这个账户的数据**。只有 owner 程序才能写入账户的 `data` 字段，这是 Solana 的核心安全机制。

- `Program Account` 的 owner 是 `BPF Loader`：只有 BPF Loader 能修改程序代码（升级/重新部署）
- `Data Account` 的 owner 是 `Your Program`：只有你的程序能按业务规则修改状态数据

**生活化类比**：

想象你在开一家连锁店：
- **BPF Loader** = 总部（负责安装收银系统）
- **Program Account** = 收银系统软件（规则/代码）
- **Your Program** = 收银系统运行时（执行业务逻辑）
- **System Program** = 房产局（能创建新房子/账本）
- **Data Account** = 各分店的账本（存库存、订单、用户积分等）

总部安装好收银系统后，系统运行时需要账本来记录数据，于是请房产局创建账本，并把账本的管理权（owner）设置为"收银系统"，这样只有收银系统能按规则修改账本内容。

#### 系统账户

并非所有账户在由 System Program 创建后都会被分配一个新所有者。由 System Program 拥有的账户称为系统账户。所有钱包账户都是系统账户，这使它们能够支付交易费用。

![系统账户]({{ site.baseurl }}/assets/images/sol1/img_5.png)

##### 📖 系统账户详解

**什么是系统账户？**

系统账户（System Account）是指 **owner 字段为 System Program** 的账户。最典型的例子就是**所有用户的钱包账户**。

**系统账户的结构示例**：

```
你的钱包账户 {
    address: 7xK...abc
    lamports: 1000000000  (1 SOL = 10亿 lamports)
    data: []              (空的，只存 SOL，不存其他数据)
    owner: System Program ◄─── 关键特征！
    executable: false
}
```

**为什么钱包是系统账户？**

- 钱包账户的 **owner 是 System Program**
- 只有 System Program 能修改你的 SOL 余额（lamports 字段）
- 这保证了转账安全：只有通过 System Program 的转账指令才能改余额
- 系统账户可以支付交易费用（因为 System Program 能扣除 lamports）

**系统账户 vs 其他账户的对比**：

| 账户类型 | owner | 用途 | 典型例子 |
|---------|-------|------|---------|
| **系统账户** | System Program | 存 SOL、支付交易费 | 所有钱包账户 |
| **程序账户** | BPF Loader | 存程序代码 | 智能合约 |
| **数据账户** | 某个 Program | 存程序状态 | NFT 元数据、游戏分数 |

**不要混淆的概念**：

- **System Program**：一个程序（负责转账、创建账户等基础操作）
- **System Account**：一类账户（由 System Program 拥有的账户，即钱包）
- **BPF Loader**：另一个程序（负责部署/管理智能合约）

**生活化类比**：

- **System Program** = 银行系统（管理账户余额、转账）
- **System Account** = 储蓄卡账户（你的钱包，由银行管理）
- **BPF Loader** = 应用商店（安装/升级 App）
- **Program Account** = 安装好的 App（智能合约）
- **Data Account** = App 的数据库文件（存游戏进度、用户设置等）

**为什么需要系统账户？**

系统账户是 Solana 账户体系的基础：
1. **支付交易费**：只有系统账户能支付交易费（因为只有 System Program 能扣 lamports）
2. **转账功能**：用户之间转 SOL 就是修改两个系统账户的 lamports 字段
3. **租金机制**：账户需要保持最低余额以避免被清理（虽然租金机制已弃用，但最低余额要求仍存在）

## 指令（Instruction）

指令是与 Solana 区块链交互的基本构建块。指令本质上是一个公共函数，任何使用 Solana 网络的人都可以调用。每个指令用于执行特定的操作。指令的执行逻辑存储在程序中，每个程序定义其自己的指令集。要与 Solana 网络交互，需要将一个或多个指令添加到交易中并发送到网络进行处理。

### SOL 转账示例

下图展示了交易和指令如何协同工作，使用户能够与网络交互。在此示例中，SOL 从一个账户转移到另一个账户。

发送方账户的元数据表明它必须为交易签名。（这允许系统程序扣除lamports。）发送方和接收方账户都必须是可写的，以便其 lamport 余额发生变化。为了执行此指令，发送方的钱包发送包含其签名和包含 SOL 转账指令的消息的交易。

![SOL转账示例1]({{ site.baseurl }}/assets/images/sol1/img_6.png)

交易发送后，系统程序处理转账指令并更新两个账户的 lamport 余额。

![SOL转账示例2]({{ site.baseurl }}/assets/images/sol1/img_7.png)

### 指令结构

![指令结构]({{ site.baseurl }}/assets/images/sol1/img_8.png)

##### 📖 Transaction 和 Instruction 的关系说明

**重要概念**：图中的 `Transaction` 不是说"这是交易指令"，而是说明 **Transaction（交易）是装载 Instruction（指令）的容器**。

**层级关系**：

```
Transaction（交易 = 信封）
    │
    ├─ Instruction 1（指令 = 表单1）
    │   ├─ Program Address: 调用哪个程序
    │   ├─ Accounts: 涉及哪些账户
    │   └─ Instruction Data: 具体参数
    │
    ├─ Instruction 2（指令 = 表单2）
    │   ├─ Program Address: ...
    │   ├─ Accounts: ...
    │   └─ Instruction Data: ...
    │
    └─ ...（可以有多个指令）
```

**举例：同时转账和铸造 NFT**

```rust
// 创建一个 Transaction
let transaction = Transaction {
    signatures: vec![user_signature],
    message: Message {
        instructions: vec![
            // Instruction 1: 转账
            Instruction {
                program_id: system_program::ID,  // System Program
                accounts: vec![
                    AccountMeta { pubkey: sender, is_signer: true, is_writable: true },
                    AccountMeta { pubkey: receiver, is_signer: false, is_writable: true },
                ],
                data: vec![/* 转 1 SOL 的指令数据 */],
            },
            // Instruction 2: 铸造 NFT
            Instruction {
                program_id: nft_program::ID,  // NFT Program
                accounts: vec![
                    AccountMeta { pubkey: user, is_signer: true, is_writable: false },
                    AccountMeta { pubkey: nft_mint, is_signer: false, is_writable: true },
                ],
                data: vec![/* NFT 元数据 */],
            },
        ],
    },
};
```

**关键点**：

1. **Transaction 是容器**：一次提交可以包含多个操作（指令）
2. **Instruction 是具体操作**：每个指令告诉 Solana"调用哪个程序、用哪些账户、传什么参数"
3. **原子性**：Transaction 里的所有 Instruction 要么全部成功，要么全部失败回滚
4. **顺序执行**：Instruction 按数组顺序依次执行（Instruction 1 → Instruction 2 → ...）

**生活化类比**：

去政府办事大厅：
- **Transaction** = 你带的文件袋（一次性提交）
- **Instruction** = 文件袋里的各种表单
  - 表单1：身份证复印（去 A 窗口 = program_id，需要身份证原件 = accounts，复印份数 = data）
  - 表单2：税务登记（去 B 窗口，需要营业执照，填写税号）

工作人员会按顺序处理你的所有表单，如果某个表单填错了（某个 Instruction 失败），整个文件袋会被退回（Transaction 失败）。

一个 Instruction 包含以下信息：

- **program_id**：被调用程序的ID。
- **accounts**：一个账户元数据的数组。
- **data**：一个包含指令所需额外数据的字节数组。

**🎯 整体逻辑解释：三个字段如何配合工作**

用一个转账例子来理解 Instruction 的完整逻辑：

```rust
Instruction {
    // 1️⃣ 告诉 Solana：调用哪个程序
    program_id: 11111111111111111111111111111111,  // System Program 的地址

    // 2️⃣ 告诉程序：要操作哪些账户
    accounts: vec![
        AccountMeta { pubkey: sender, is_signer: true, is_writable: true },    // 转出账户
        AccountMeta { pubkey: receiver, is_signer: false, is_writable: true }, // 接收账户
    ],

    // 3️⃣ 告诉程序：具体做什么、参数是什么
    data: vec![2, 0, 0, 0, 0, 64, 66, 15, 0],
    //         ↑ 指令类型: 2 = Transfer（转账）
    //            ↑ 金额: 1000000 lamports (0.001 SOL)
}
```

**执行流程**：

```
用户发送 Instruction
    ↓
Solana 读取 program_id
    ↓ "要调用 System Program"
找到 System Program 并加载代码
    ↓
System Program 读取 accounts
    ↓ "要操作 sender 和 receiver"
System Program 读取 data
    ↓ "执行 Transfer 指令，金额 1000000"
System Program 执行转账逻辑：
    • 检查 sender 是否签名 (is_signer=true)
    • 检查 sender 余额是否足够
    • sender.lamports -= 1000000
    • receiver.lamports += 1000000
    ↓
转账完成
```

**生活化类比**：

想象你去银行柜台办理转账：

```
Instruction = 一张完整的转账申请表

program_id = 柜台号（3号柜台，转账业务）
            ↓ 你拿着表单去3号柜台

accounts = 涉及的账户
          • 转出账户：我的账户 6228...1234（需要我签字）
          • 转入账户：朋友的账户 6228...5678
            ↓ 柜员知道要操作哪两个账户

data = 具体业务和参数
      • 业务类型：转账
      • 转账金额：1000 元
        ↓ 柜员知道具体要做什么

柜员执行：从我的账户扣1000，加到朋友账户
```

**三个字段的配合关系**：

| 字段 | 作用 | 类比 |
|------|------|------|
| **program_id** | 调用哪个程序（谁来处理） | 去哪个柜台 |
| **accounts** | 操作哪些账户（涉及谁） | 涉及哪些账户卡 |
| **data** | 做什么、参数是什么（具体业务） | 转账金额、业务类型 |

**关键点**：

1. **program_id** 决定"谁来执行"（System Program、Token Program、还是你的自定义程序）
2. **accounts** 列出"涉及的所有账户"，程序会按顺序读取
3. **data** 是"具体指令和参数"，程序根据 data 判断要执行哪个功能
4. 三个字段缺一不可：没有 program_id 不知道调用谁，没有 accounts 不知道操作什么，没有 data 不知道做什么

---

**完整 Instruction 结构体**：

```rust
pub struct Instruction {
    /// Pubkey of the program that executes this instruction.
    pub program_id: Pubkey,

    /// Metadata describing accounts that should be passed to the program.
    pub accounts: Vec<AccountMeta>,

    /// Opaque data passed to the program for its own interpretation.
    pub data: Vec<u8>,
}
```
#### 程序 ID

指令的 program_id 是包含指令业务逻辑的程序的公钥地址。

#### 账户元数据

指令的 accounts 数组是一个 AccountMeta 结构体的数组。每个指令交互的账户都必须提供元数据。（这允许交易并行执行指令，只要它们不修改同一个账户。）

下图展示了一个包含单个指令的交易。指令的 accounts 数组包含两个账户的元数据。

![账户元数据]({{ site.baseurl }}/assets/images/sol1/img_9.png)

账户元数据包括以下信息：

- **pubkey**：账户的公钥地址
- **is_signer**：如果账户必须签署交易，则设置为 true
- **is_writable**：如果指令修改账户的数据，则设置为 true

```rust
pub struct AccountMeta {
    /// An account's public key.
    pub pubkey: Pubkey,

    /// True if an `Instruction` requires a `Transaction` signature matching `pubkey`.
    pub is_signer: bool,

    /// True if the account data or metadata may be mutated during program execution.
    pub is_writable: bool,
}
```

#### 数据

指令的 data 是一个字节数组，用于指定调用程序的哪条指令。它还包括指令所需的任何参数。

## 交易（Transaction）

要与 Solana 网络交互，您必须发送一笔交易。您可以将交易视为一个装有多种表单的信封。每个表单都是一条指令，告诉网络该做什么。发送交易就像邮寄信封，以便处理这些表单。

下面的示例展示了两个交易的简化版本。当第一个交易被处理时，它将执行一条指令。当第二个交易被处理时，它将按顺序执行三条指令：首先是指令 1，然后是指令 2，最后是指令 3。

**交易是原子性的**：如果单条指令失败，整个交易将失败，并且不会发生任何更改。

![交易示例]({{ site.baseurl }}/assets/images/sol1/img_10.png)

### 交易结构

一个 Transaction 包含以下信息：

- **signatures**：一个签名数组
- **message**：交易信息，包括要处理的指令列表

```rust
pub struct Transaction {
    #[wasm_bindgen(skip)]
    #[serde(with = "short_vec")]
    pub signatures: Vec<Signature>,

    #[wasm_bindgen(skip)]
    pub message: Message,
}
```

交易的总大小限制为 **1232 字节**。此限制包括 signatures 数组和 message 结构体。

![交易大小限制]({{ site.baseurl }}/assets/images/sol1/img_11.png)

#### 签名

交易的 signatures 数组包含 Signature 结构体。每个 Signature 为 64 字节，通过使用账户的私钥对交易的 Message 进行签名创建。每个签名账户的指令都必须提供一个签名。

第一个签名属于支付交易基础费用的账户，并且是交易签名。交易签名可用于在网络上查找交易的详细信息。

#### 消息

交易的 message 是一个 Message 结构体，包含以下信息：

- **header**：消息的头部
- **account_keys**：一个账户地址数组，交易指令所需的
- **recent_blockhash**：一个区块哈希，作为交易的时间戳
- **instructions**：一个指令数组

为了节省空间，交易不会单独存储每个账户的权限。相反，账户权限是通过 header 和 account_keys 确定的。

```rust
pub struct Message {
    /// The message header, identifying signed and read-only `account_keys`.
    pub header: MessageHeader,

    /// All the account keys used by this transaction.
    #[serde(with = "short_vec")]
    pub account_keys: Vec<Pubkey>,

    /// The id of a recent ledger entry.
    pub recent_blockhash: Hash,

    /// Programs that will be executed in sequence and committed in
    /// one atomic transaction if all succeed.
    #[serde(with = "short_vec")]
    pub instructions: Vec<CompiledInstruction>,
}
```

##### 头部

消息的 header 是一个 MessageHeader 结构体，包含以下信息：

- **num_required_signatures**：交易所需的总签名数
- **num_readonly_signed_accounts**：需要签名的只读账户总数
- **num_readonly_unsigned_accounts**：不需要签名的只读账户总数

```rust
pub struct MessageHeader {
    /// The number of signatures required for this message to be considered
    /// valid. The signers of those signatures must match the first
    /// `num_required_signatures` of [`Message::account_keys`].
    pub num_required_signatures: u8,

    /// The last `num_readonly_signed_accounts` of the signed keys are read-only
    /// accounts.
    pub num_readonly_signed_accounts: u8,

    /// The last `num_readonly_unsigned_accounts` of the unsigned keys are
    /// read-only accounts.
    pub num_readonly_unsigned_accounts: u8,
}
```

![消息头部]({{ site.baseurl }}/assets/images/sol1/img_12.png)

##### 账户地址

消息的 account_keys 是一个账户地址数组，以紧凑数组格式发送。数组的前缀表示其长度。数组中的每一项是一个公钥，指向其指令使用的账户。accounts_keys 数组必须完整，并严格按以下顺序排列：

1. 签名者 + 可写
2. 签名者 + 只读
3. 非签名者 + 可写
4. 非签名者 + 只读

严格的排序允许 account_keys 数组与消息的 header 中的信息结合，以确定每个账户的权限。

![账户地址数组]({{ site.baseurl }}/assets/images/sol1/img_13.png)

##### 最近的区块哈希

消息的 recent_blockhash 是一个哈希值，作为交易的时间戳并防止重复交易。区块哈希在 150 个区块后过期。（相当于一分钟——假设每个区块为 400 毫秒。）区块过期后，交易也会过期，无法被处理。

`getLatestBlockhash` RPC 方法 允许您获取当前的区块哈希以及区块哈希有效的最后区块高度。

##### 指令

消息的 instructions 是一个包含所有待处理指令的数组，采用紧凑数组格式。数组的前缀表示其长度。数组中的每一项是一个 CompiledInstruction 结构体，包含以下信息：

- **program_id_index**：一个索引，指向 account_keys 数组中的地址。此值表示处理该指令的程序的地址。
- **accounts**：一个索引数组，指向 account_keys 数组中的地址。每个索引指向该指令所需账户的地址。
- **data**：一个字节数组，指定要在程序上调用的指令。它还包括指令所需的任何附加数据。（例如，函数参数）

```rust
pub struct CompiledInstruction {
    /// Index into the transaction keys array indicating the program account that executes this instruction.
    pub program_id_index: u8,

    /// Ordered indices into the transaction keys array indicating which accounts to pass to the program.
    #[serde(with = "short_vec")]
    pub accounts: Vec<u8>,

    /// The program input data.
    #[serde(with = "short_vec")]
    pub data: Vec<u8>,
}
```

![编译后的指令]({{ site.baseurl }}/assets/images/sol1/img_14.png)

## 交易费用

每笔 Solana 交易都需要支付交易费用，以 SOL 结算。交易费用分为两部分：基础费用和优先费用。基础费用用于补偿验证者处理交易的成本。优先费用是可选费用，用于增加当前领导者处理您交易的可能性。

### 基础费用

每笔交易的每个包含的签名费用为 **5000 lamports**。此费用由交易的第一个签名者支付。只有由 System Program 拥有的账户才能支付交易费用。基础费用的分配如下：

- **50% 销毁**： 一半费用被销毁（从流通的 SOL 供应中移除）。
- **50% 分配**： 另一半费用被支付给处理交易的验证者。

### 优先费用

优先费用是一种可选费用，用于增加当前领导者（验证者）处理您交易的可能性。验证者会收到 100% 的优先费用。可以通过调整交易的计算单元（CU）价格和 CU 限制来设置优先费用。

优先费用的计算方式如下：

```
Prioritization fee = CU limit * CU price
```

优先费用用于确定您的交易优先级，相对于其他交易。其计算公式如下：

```
Priority = (Prioritization fee + Base fee) / (1 + CU limit + Signature CUs + Write lock CUs)
```

#### 计算单元限制

默认情况下，每条指令分配 200,000 个 CU，每笔交易分配 140 万个 CU。您可以通过在交易中包含一个 `SetComputeUnitLimit` 指令来更改这些默认值。

要计算交易的适当 CU 限制，我们建议按照以下步骤进行：

1. 通过模拟交易来估算所需的 CU 单位
2. 在此估算值上增加 10% 的安全余量

**注意**：优先费用是由请求的计算单元（CU）限制交易决定的，而不是实际使用的计算单元数量。如果您设置的计算单元限制过高或使用默认值，可能会为未使用的计算单元支付费用。

#### 计算单元价格

计算单元价格是为每个请求的 CU 支付的可选微 lamports 金额。您可以将 CU 价格视为一种小费，用于鼓励 validator 优先处理您的交易。要设置 CU 价格，请在交易中包含一个 `SetComputeUnitPrice` 指令。

默认的 CU 价格为 0，这意味着默认的优先费用也是 0。

## 程序（Program）

在 Solana 中，智能合约被称为程序（program）。程序是一个无状态的账户，其中包含可执行代码。这些代码被组织成称为指令（instructions）的函数。用户通过发送包含一个或多个指令的交易与程序交互。一个交易可以包含来自多个程序的指令。

当程序被部署时，Solana 使用 LLVM 将其编译为可执行和链接格式 (ELF)。ELF 文件包含以 Solana 字节码格式（sBPF）编写的程序二进制文件，并存储在链上的可执行账户中。

### 编写程序

大多数程序使用 Rust 编写，常见的开发方法有两种：

- **Anchor**：Anchor 是一个为快速和简单的 Solana 开发设计的框架。它使用 Rust 宏来减少样板代码，非常适合初学者。
- **原生 Rust**：直接使用 Rust 编写程序，不依赖任何框架。这种方法提供了更多的灵活性，但也增加了复杂性。

### 更新程序

要修改现有程序，必须将一个账户指定为升级权限。（通常是最初部署程序的同一个账户。）如果升级权限被撤销并设置为 None，则该程序将无法再被更新。

### 验证程序

Solana 支持可验证构建，允许用户检查程序的链上代码是否与其公开的源代码匹配。Anchor 框架提供了内置支持来创建可验证构建。

要检查现有程序是否已验证，可以在 Solana Explorer 上搜索其程序 ID。或者，您可以使用 Ellipsis Labs 的 Solana Verifiable Build CLI 独立验证链上程序。

## 程序派生地址（PDA）

Solana 的账户地址指向区块链上账户的位置。许多账户地址是 keypair 的公钥，在这种情况下，相应的私钥用于签署涉及该账户的交易。

公钥地址的一个有用替代方案是程序派生地址 (PDA)。PDA 提供了一种简单的方法来存储、映射和获取程序状态。PDA 是使用程序 ID 和一组可选的预定义输入确定性创建的地址。PDA 看起来与公钥地址类似，但没有对应的私钥。

Solana 运行时允许程序为 PDA 签名而无需私钥。使用 PDA 消除了跟踪账户地址的需要。相反，您可以回忆用于 PDA 派生的特定输入。（要了解程序如何使用 PDA 进行签名，请参阅跨程序调用部分）

### 背景

Solana 的 keypair 是 Ed25519 曲线（椭圆曲线加密）上的点。它们由公钥和私钥组成。公钥成为账户地址，私钥用于为账户生成有效的签名。

![Keypair示例]({{ site.baseurl }}/assets/images/sol1/img_15.png)

PDA 被有意派生为落在 Ed25519 曲线之外。这意味着它没有有效的对应私钥，无法执行加密操作（例如提供签名）。然而，Solana 允许程序为 PDA 签名而无需私钥。

![PDA示例]({{ site.baseurl }}/assets/images/sol1/img_16.png)

您可以将 PDA 理解为一种在链上使用预定义输入集（例如字符串、数字和其他账户地址）创建类似哈希映射结构的方式。

![PDA哈希映射]({{ site.baseurl }}/assets/images/sol1/img_17.png)

### 派生一个 PDA

在使用 PDA 创建账户之前，您必须首先派生地址。派生 PDA 并不会自动在该地址创建链上账户——账户必须通过用于派生 PDA 的程序显式创建。您可以将 PDA 想象成地图上的一个地址：仅仅因为地址存在并不意味着那里已经建造了什么。

Solana SDK 支持使用下表中显示的函数创建 PDA。每个函数接收以下输入：

- **程序 ID**：用于派生 PDA 的程序地址。该程序可以代表 PDA 签名。
- **可选种子**：预定义的输入，例如字符串、数字或其他账户地址。

| SDK | 函数 |
|-----|------|
| @solana/kit (Typescript) | getProgramDerivedAddress |
| @solana/web3.js (Typescript) | findProgramAddressSync |
| solana_sdk (Rust) | find_program_address |

该函数使用程序 ID 和可选种子，然后通过迭代 bump 值尝试创建一个有效的程序地址。bump 值的迭代从 255 开始，每次递减 1，直到找到一个有效的 PDA。找到有效的 PDA 后，函数返回 PDA 和 bump seed。

**bump seed** 是附加到可选种子上的一个额外字节，用于确保生成一个有效的非曲线地址。

![PDA派生过程]({{ site.baseurl }}/assets/images/sol1/img_18.png)

## 跨程序调用（CPI）

当一个 Solana 程序直接调用另一个程序的指令时，就会发生跨程序调用 (CPI)。这使得程序具有可组合性。如果将 Solana 的指令视为程序向网络公开的 API 端点，那么 CPI 就像一个端点在内部调用另一个端点。

在进行 CPI 时，程序可以代表从其程序 ID 派生的 PDA 进行签名。这些签名者权限从调用程序扩展到被调用程序。

![CPI示例]({{ site.baseurl }}/assets/images/sol1/img_19.png)

在进行 CPI 时，账户权限从一个程序扩展到另一个程序。假设程序 A 接收到一个包含签名账户和可写账户的指令。程序 A 然后对程序 B 进行 CPI。此时，程序 B 可以使用与程序 A 相同的账户，并保留其原始权限。（这意味着程序 B 可以使用签名账户进行签名，并可以写入可写账户。）如果程序 B 自己进行 CPI，它可以将这些相同的权限继续传递下去，最多可以传递 **4 层**。

程序指令调用的最大堆栈高度称为 `max_instruction_stack_depth`，并被设置为 `MAX_INSTRUCTION_STACK_DEPTH` 常量的值 **5**。

堆栈高度从初始交易的 1 开始，每当一个程序调用另一个指令时增加 1，从而将 CPI 的调用深度限制为 4。
