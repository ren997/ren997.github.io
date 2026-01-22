---
title: 第二节-Solana的代币和NFT
tags: [Solana]
---

## 课程资料

本节主要讲解《Trading Bot的实现原理解析&Solana的代币与NFT》，相关学习资料如下：

- **主要课程**：[Trading Bot的实现原理解析&Solana的代币与NFT](https://openbuild.xyz/learn/challenges/2086624241/1767796891)
- **Trading Bot 资料**：[Sniper Bot 课程](https://academy.soldevcamp.com/course/sniper-bot/sniper-1/)（主要用于了解）
- **Solana的代币与NFT**：[代币与NFT课程](https://openbuild.xyz/learn/challenges/2086624241/1766375394)（下面的资料主要基于这一部分）
- **课程源码**：[hello_solana](https://github.com/lbc-team/hello_solana)

### Task 1：铸造 SPL Token

**学习资源：**

- **助教包**：[Task 资源包](https://github.com/Tools-touch/Task-/)
- **课程回放**：[Bilibili 视频](https://www.bilibili.com/video/BV1evzGBsEqW/)

**实践作业：**

- [Task 1: 铸造 SPL Token (web3.js)](https://learn.blueshift.gg/zh-CN/challenges/typescript-mint-an-spl-token)

<!--more-->

## Solana 账户模型

Solana 的账户是一个存储单元，类似于 Linux 的文件系统。

**账户地址表示方式：** Ed25519 公钥的 Base58 编码格式字符串表示，例如：`14grJpemFaf88c8tiVb77W7TYg2W3ir6pfkKz3YjhhZ5`

**账户特性：**
- 最大存储 10 MB 数据
- 空间越大，存储费用越高
- 只有 Owner 可以修改账户数据或减少余额

![账户模型]({{ site.baseurl }}/assets/images/sol2/img.png)

### 账户模型 → 编程模型

Solana 的账户模型设计带来了独特的编程模型：

- **程序和数据是各自独立的账户**（通过 `executable` 字段区分），实现了代码和数据的分离
- **程序是数据账户的 Owner**，负责管理数据账户
- **程序是无状态的**，为大规模并发执行提供了条件

![编程模型]({{ site.baseurl }}/assets/images/sol2/img_1.png)

### PDA（Program Derived Addresses）账号

PDA 是由程序派生的特殊地址，常用于存储程序状态或作为程序控制的签名者：

- **没有私钥**：PDA 地址在 ed25519 曲线外，无法用传统方式签名
- **确定性派生**：根据程序 ID + 种子（seeds）+ bump 值计算得出
- **程序可签名**：派生该 PDA 的程序可以通过 CPI 代表它签名

![PDA 账户]({{ site.baseurl }}/assets/images/sol2/img_2.png)

## Token on Solana

### 什么是代币？

代币是数字资产，代表区块链网络上的所有权、访问权限或价值。可以将它们视为完全以数字形式存在的可编程证书：它们可以代表从货币和所有权股份到投票权和访问通行证的任何事物。

从最基本的层面来看，代币是区块链账本中的一条记录，表示"此地址拥有 X 数量的此资产"。与需要实物证书或集中式数据库来跟踪所有权的传统资产不同，代币利用区块链技术创建了防篡改、透明的所有权记录。

### 为什么代币很重要？

代币实现了**可编程所有权**：任何人都可以创建具有自定义规则的数字资产，这些规则规定了代币如何转移、授予哪些权利或如何与其他系统交互。

这为自动分红、条件转移或基于预定义条件自动执行的复杂金融工具等可能性打开了大门。

关键的创新在于，代币可以在全球范围内即时转移，无需中介，具有透明性（任何人都可以验证所有权），并且可以通过复杂的逻辑进行编程，同时保持底层区块链的安全性保障。

### 不同类型的代币

代币可以根据不同的类别进行分类，例如根据它们的用途或内在特性进行分类。

#### 基于实用性分类

根据这些代币的功能，我们可以将其分为以下几类：

- **实用型代币**：提供对产品或服务的访问。例如，持有某些代币可能会让您获得平台访问权限、折扣费用或特殊功能。
- **治理型代币**：赋予持有者在去中心化组织中的投票权。代币持有者可以对协议更改、资金支出或其他决策进行投票。
- **证券型代币**：以数字形式代表对现实世界资产（如公司股份、房地产或商品）的所有权。
- **稳定币**：旨在保持稳定价值的代币，通常与某种货币挂钩，例如美元（USDC、USDT）。
- **Meme/社区代币**：主要用于投机、社区建设或娱乐价值。

#### 根据特性分类

根据"技术"特性，代币分为两类：**同质化代币**和**非同质化代币**。

- **同质化代币（FT）**：表示可互换；由多个相同的单位组成，可以替代同一代币的任何其他单位，并可以分为小数单位（例如拥有 0.5 个代币）。
- **非同质化代币（NFT）**：表示独特且不可互换；每个代币都是独一无二的、不可分割的，并具有使其与其他代币不同的独特属性。

**技术实现角度：**

同质化代币和非同质化代币从 Token Program 实现角度看是一样的，它们是从数量上来确定其具备的特性：

- **NFT 的特征**：
  - 供应量为 1，因为它们是独一无二的
  - 小数位为 0，因为它们是不可分割的
  - 禁用 mint authority，防止铸造相同特性的代币

Token Program 无法强制执行这些特性。因此，像 MPL-token-metadata 这样的程序不仅提供了元数据的实现，还提供了强制执行这些约束的实现，从而可以轻松创建 NFT。

### 与以太坊的区别

**以太坊的方式：**

在以太坊中，每种代币都需要部署一个完整的智能合约，其中包含所有的代币逻辑、状态管理和转移规则。尽管大多数代币遵循 ERC-20 标准，但每种代币都是一个带有自定义代码的独立程序。

以太坊中，合约地址成为代币的标识符，所有余额都存储在该合约的状态中，该状态内部有一个余额映射。

**Solana 的方式：**

在 Solana 上，由于程序（逻辑）与数据分离，所有与代币相关的逻辑都由 **SPL Token Program** 和 **Token2022 Program** 处理：Solana 的原生代币框架，定义了所有代币的创建、管理和转移方式。

这是一个单一的统一程序，处理网络中的所有代币操作，确保一致性和互操作性。

使用 **Mint 账号来确定 Token 的唯一性**，"mint" 账户包含代币的配置：总量 supply、decimal、mintAuthority 和 freezeAuthority。它相当于代币在 Solana 上的"出生证明"。

## Token 相关的账户

Token 主要涉及 3 个账户：**Token Program**、**Mint Account**、**ATA Account（Token Account）**

### Token Program

**SPL Token 程序**或 **Token 2022 程序**，包含所有的代币逻辑、状态管理和转移规则。

**主要功能：**

- **初始化账户**：正确的所有者（Token Program）、空间和 lamports
- **Mint To**：增加代币的总供应量，创建新代币并将其存入指定账户。只有 mint 权限持有者可以执行此操作。
- **Burn**：减少代币的总供应量，通过从流通中移除代币来永久销毁代币。这会减少代币的总供应量。
- **转账**：将代币从一个账户转移到另一个账户。这是用户之间发送代币的基本操作。
- **授权**：授予代理权限，允许其代表账户所有者转移特定数量的代币。这使得程序化的代币转移成为可能，而无需授予完整的账户控制权。
- **Revoke**：移除当前代理对账户的权限，将账户的完全控制权归还给账户所有者。
- **Close Account**：关闭一个代币账户并将其剩余的 SOL 租金转移到目标账户。代币账户必须余额为零，除非它是一个原生 SOL 账户。

### Mint 账户

在 Solana 上，代币通过由 Token Program 拥有的 Mint 账户地址唯一标识。此账户充当特定代币的全局计数器，并存储以下数据：

- **供应量（supply）**：代币的总供应量
- **小数位数（decimals）**：代币的小数精度
- **Mint 权限（mint_authority）**：被授权创建代币新单位、增加供应量的账户
- **冻结权限（freeze_authority）**：被授权冻结 Token 账户中代币的账户，防止其被转移或销毁

#### 元数据

在区块浏览器和钱包中，代币通常通过特定的名称和图像变得可识别且易于阅读。

代币的名称、符号和图像称为 **Metadata**。因为在其原生形式中，Mint 账户只是一个 32 字节长的公钥，没有附加任何人类可读的信息。

在原生的 SPL Token 程序中，无法直接在代币上设置元数据。因此，像 Metaplex 这样的协议开发了 MPL-token-metadata 程序，为每个代币提供了关联元数据的方法。

使用 Token Extensions 和 Token2022 程序，这一切将完全改变。Metadata 扩展允许您将元数据直接嵌入到 mint account 中，从而无需依赖外部程序。

**示例：** [USDC Token on Solscan](https://solscan.io/token/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v)

![Mint 账户示例]({{ site.baseurl }}/assets/images/sol2/img_3.png)

### Associated Token Account（关联 Token Account）

ATA 是一个特定的 Token Account，用于跟踪每个代币单位的个人所有权。Token Account 存储以下数据：

- **Mint**：Token Account 持有的代币
- **Owner**：被授权从 Token Account 转移代币的账户
- **Amount**：Token Account 当前持有的代币数量

关联 Token Account 的地址是根据所有者地址和 mint account 地址派生出来的（Associated Token Program 的 PDA）。

```javascript
ATA = findProgramAddress(
  [wallet, token_program_id, mint],
  associated_token_program_id
)
```

![ATA 账户]({{ site.baseurl }}/assets/images/sol2/img_4.png)

## Demo: SPL-Token CLI

### 创建 Token

```bash
spl-token create-token
```

这个命令实际上是创建 mint 账户，保存以下信息：

- **decimals**：小数位数，默认是 9（可使用 `--decimals 6` 设置）
- **supply**：当前总供应量
- **mint_authority**：铸造权限，谁可以发行 token
- **freeze_authority**：冻结权限，冻结或解冻某个账户的 Token，防止该账户进行转账或接收 Token

**注意：** mint 账户不是 PDA，Solana 上有很多靓号 token，例如：Jupiter

```bash
# 生成靓号地址
solana-keygen grind --starts-with Lbc:1

# 使用指定密钥对创建 token
spl-token create-token mint_keypair.json
```

### 发行 Token

发行 Token 需要先创建好 ATA 账户：

```bash
# 创建关联 Token 账户
spl-token create-account

# 发行代币
spl-token mint <TOKEN_AMOUNT> []

# 查看余额
spl-token balance

# 查看总供应量
spl-token supply

# 查看 Token mint 的账户信息
spl-token account-info
# 或
spl-token display
```

### 转账 Token

```bash
spl-token transfer <TOKEN_AMOUNT> <RECIPIENT_WALLET_ADDRESS or RECIPIENT_TOKEN_ACCOUNT_ADDRESS>
```

同样需要创建目标的 ATA 账户，或者使用 `--fund-recipient` 参数自动创建。

```bash
# 查看我所有的 Token 账户及余额
spl-token accounts
```

### 关闭 ATA 账户

关闭余额为 0 的地址，可以回收账户资金：

```bash
spl-token close <mint_account>
```

关闭 ATA 需要余额为 0。如果有余额，需要先清空余额：

```bash
spl-token burn
```

### 创建 NFT

NFT 是一个特殊的 TOKEN，它们使用同一个程序，但有以下特点：

- **decimals 为 0**：不可分割
- **每次 mint 一个**：每个 NFT 需要有一个独立的 mint 账户

```bash
# 创建 NFT mint 账户
spl-token create-token --decimals 0
```

### Token2022 Token

Token2022 在 SPL Token 原有指令的基础上添加了扩展模块。

![Token2022]({{ site.baseurl }}/assets/images/sol2/img_5.png)

```bash
# 创建 Token2022 token（启用元数据）
spl-token create-token --enable-metadata --decimals 0 --program-2022

# 初始化元数据
spl-token initialize-metadata 3w...m NAME Symbol https://raw.githubusercontent.com/lbc-team/hello_gill/refs/heads/main/metadata/nft-metadata.json
```

## 使用 Web3.js 铸造 SPL 代币

> **📌 重要说明：**
>
> - **链上程序（智能合约）**：必须用 Rust 编写，部署到 Solana 区块链上运行
> - **客户端代码**：可以用 JavaScript、Python、Go 等多种语言编写，用于与区块链交互
>
> 本节展示的是 **JavaScript 客户端代码**，用于调用链上已有的程序（如 SPL Token Program），而不是编写新的链上程序。

### Solana web3.js 简述

Solana web3.js 是一个流行而简洁的 JavaScript **客户端库**，可以让开发者便捷地与 Solana 区块链交互，与以太坊的 ethers.js 库类似。它用于编写**客户端应用**（前端、后端、脚本等），而不是链上程序。

**安装：**

```bash
npm install @solana/web3.js@1.98.0
```

下面将快速覆盖几个关键示例，分别是：

- 铸造 SPL 代币
- 发送 SOL 交易
- 通过 web3.js 原生质押 SOL（Delegate SOL）

### 所需工具和库

在开始之前，我们需要导入一些库：

```javascript
const solanaWeb3 = require('@solana/web3.js');
const splToken = require('@solana/spl-token');
const bs58 = require('bs58');
```

**库说明：**

- **@solana/web3.js** — Solana 区块链的主要 JS API
- **@solana/spl-token** — SPL Token 操作库（铸币、代币账户等）
- **bs58** — 用于 Base58 编码／解码（如私钥）

### 连接到 Solana

要与链交互，首先要创建一个连接对象：

```javascript
const connection = new solanaWeb3.Connection(
  "https://api.devnet.solana.com",
  { wsEndpoint: "wss://api.devnet.solana.com" }
);
```

这里我们使用 Solana 官方提供的 Devnet RPC / WebSocket 节点。Devnet 是一个面向开发者的测试网络，适合用于学习、调试和开发应用。

### 主程序入口 & 钱包

定义一个异步主函数：

```javascript
async function main() {
  // 代码逻辑
}
```

然后加载钱包：

```javascript
const walletKeyPair = solanaWeb3.Keypair.fromSecretKey(
  new Uint8Array(bs58.decode(process.env.PRIVATE_KEY))
);
```

你现在已经有了一个主钱包，可以用它检查余额：

```javascript
let balance = await connection.getBalance(walletKeyPair.publicKey);
console.log(balance / solanaWeb3.LAMPORTS_PER_SOL);
```

这会打印用户钱包中 SOL 的数量。

### 1. 铸造 SPL Token

#### 创建 Token Mint

```javascript
const mint = await splToken.createMint(
  connection,
  walletKeyPair,
  walletKeyPair.publicKey,
  null,   // freeze authority
  9,      // decimals
  undefined,
  {},
  splToken.TOKEN_PROGRAM_ID
);
```

然后为钱包创建一个关联的 Token 账户：

```javascript
const tokenAccount = await splToken.getOrCreateAssociatedTokenAccount(
  connection,
  walletKeyPair,
  mint,
  walletKeyPair.publicKey
);
```

接着铸造代币：

```javascript
await splToken.mintTo(
  connection,
  walletKeyPair,
  mint,
  tokenAccount.address,
  walletKeyPair.publicKey,
  1000000000000
);
```

运行后，你应该看到代币成功进入你的 Token 账户。

### 2. 发送 SOL 交易

生成第二个钱包：

```javascript
const secondWalletKeyPair = solanaWeb3.Keypair.generate();
```

创建一笔转账交易：

```javascript
const transaction = new solanaWeb3.Transaction().add(
  solanaWeb3.SystemProgram.transfer({
    fromPubkey: walletKeyPair.publicKey,
    toPubkey: secondWalletKeyPair.publicKey,
    lamports: solanaWeb3.LAMPORTS_PER_SOL * 0.001,
  })
);

const signature = await solanaWeb3.sendAndConfirmTransaction(
  connection,
  transaction,
  [walletKeyPair]
);
```

运行后，你会看到 SOL 从主钱包转到了第二个钱包。

### 3. Delegate / 质押 SOL

创建一个 stake 账户：

```javascript
const stakeAccount = solanaWeb3.Keypair.generate();
let createStakeAccountInstruction = solanaWeb3.StakeProgram.createAccount({
  fromPubkey: walletKeyPair.publicKey,
  stakePubkey: stakeAccount.publicKey,
  authorized: new solanaWeb3.Authorized(
    walletKeyPair.publicKey,
    walletKeyPair.publicKey
  ),
  lamports: solanaWeb3.LAMPORTS_PER_SOL * 0.02,
});
```

发送创建指令：

```javascript
let createStakeAccountTransaction = new solanaWeb3.Transaction().add(createStakeAccountInstruction);
createStakeAccountTransaction.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
createStakeAccountTransaction.feePayer = walletKeyPair.publicKey;
createStakeAccountTransaction.partialSign(stakeAccount);

createStakeAccountTransaction = await solanaWeb3.sendAndConfirmTransaction(
  connection,
  createStakeAccountTransaction,
  [walletKeyPair, stakeAccount]
);
```

构建委托指令：

```javascript
let delegateInstruction = solanaWeb3.StakeProgram.delegate({
  stakePubkey: stakeAccount.publicKey,
  authorizedPubkey: walletKeyPair.publicKey,
  votePubkey: new solanaWeb3.PublicKey('{validator public key}'),
});

let delegateTransaction = new solanaWeb3.Transaction().add(delegateInstruction);
delegateTransaction.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
delegateTransaction.feePayer = walletKeyPair.publicKey;
delegateTransaction.sign(walletKeyPair);

delegateTransaction = await solanaWeb3.sendAndConfirmTransaction(
  connection,
  delegateTransaction,
  [walletKeyPair]
);
```

这部分演示了如何将你的 SOL 质押给某个验证者节点。

## 总结

我们使用 solana-web3.js 的三个关键操作：

✅ **铸造 SPL 代币**

✅ **发送 SOL 交易**

✅ **委托（Stake / Delegate）SOL**

做完这些步骤后你就具备了 Solana 核心开发流程的基础技能。
