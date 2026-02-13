---
title: Solana CLI 通道切换与版本管理实战
categories: [Solana, 问题排查]
tags: [Solana, CLI, Agave]
---

## 概述

在 Solana 开发过程中，很多人都会遇到这几个问题：

- 执行 `agave-install update` 后，版本看起来“降级”了
- 不确定自己当前到底跟踪的是哪个通道
- 想固定到某个版本，或者回滚到之前可用的版本

我这篇文章的背景就是一个真实排障场景：在编译 Anchor 项目时遇到如下错误：

```text
error: failed to parse manifest at `.../blake3-1.8.3/Cargo.toml`
Caused by:
  feature `edition2024` is required
  ... this version of Cargo (1.84.0 ...) ...
```

排查后确认是本机 Solana/工具链版本偏低，和项目依赖出现不兼容；继续升级时又遇到通道配置问题，`update` 后版本“看起来降级”。本文就是围绕这条排障链路整理出来的。

这篇文章专门解决这些问题，面向 **WSL/Linux** 环境，重点讲清楚通道区别、切换方式、版本查询和常见排障。

> 时间快照：本文命令与说明基于 2026-02-13 的官方发布状态。通道头部版本会随时间变化，请以官方 manifest 和 release 页面为准。

<!--more-->

## 通道是什么：stable / beta / edge

Solana CLI（Agave）通过发布通道管理版本，最常见是这三个：

- `stable`：最稳定，更新相对慢，适合生产和保守升级策略
- `beta`：介于稳定与前沿之间，更新速度和风险都居中
- `edge`：更新最快，通常最先拿到新特性，也有最高变更风险

实战上可以这样理解：

- 你要“稳”就用 `stable`
- 你要“尽快体验新版本”就用 `edge`
- 你想折中可以试 `beta`

截至 2026-02-13，一个常见现象是：`edge` 可能先于 `stable` 到达更高主版本。

## 先看当前状态（3 条命令）

先不要急着升级，先看清当前状态：

```bash
solana --version
agave-install --version
agave-install info
```

重点看 `agave-install info` 的三个字段：

- `Release channel`：你当前跟踪的通道（stable/beta/edge）
- `Release URL`：当前通道对应的下载源
- `Release commit`：当前激活版本的提交哈希

如果出现 `Update available`，表示通道里有更新但你还没应用。

## 如何切换通道（官方方式）

官方推荐方式是执行对应通道的安装脚本：

```bash
# 切换到 stable
curl -sSfL https://release.anza.xyz/stable/install | sh

# 切换到 beta
curl -sSfL https://release.anza.xyz/beta/install | sh

# 切换到 edge
curl -sSfL https://release.anza.xyz/edge/install | sh
```

### 方式二：使用 agave-install init 切换通道

```bash
agave-install init stable
agave-install init beta
agave-install init edge
```

切完后统一做一次更新和验证：

```bash
agave-install update
agave-install info
solana --version
```

建议每次切通道后都执行这三条，避免“以为切了，但实际没生效”。

## 如何固定到指定版本（pin）与回滚

如果你不想跟随通道前进，可以直接固定到某个 tag 版本：

```bash
# 示例：固定到 v3.1.8
curl -sSfL https://release.anza.xyz/v3.1.8/install | sh

agave-install info
solana --version
```

回滚建议流程：

1. 先看本地已安装版本缓存

```bash
agave-install list
```

2. 再安装目标版本（按 tag）

```bash
curl -sSfL https://release.anza.xyz/<target-version>/install | sh
```

3. 最后验证

```bash
agave-install info
solana --version
```

注意：`agave-install update` 只会跟随当前 release 配置更新，不会替你自动跨通道做版本策略决策。

## 怎么看每个通道“当前版本”和“可选版本”

这里要区分两个概念：

- 通道头部（会变）：当前通道最新 commit
- 版本 tag（固定）：可安装的具体版本点

### 1) 查看每个通道当前 head commit

```bash
curl -sSfL https://release.anza.xyz/stable/solana-release-x86_64-unknown-linux-gnu.yml
curl -sSfL https://release.anza.xyz/beta/solana-release-x86_64-unknown-linux-gnu.yml
curl -sSfL https://release.anza.xyz/edge/solana-release-x86_64-unknown-linux-gnu.yml
```

可以重点关注返回里的 `commit` 字段。

### 2) 查看可发布版本（tag）列表

优先看官方 Agave Releases 页面：

- https://github.com/anza-xyz/agave/releases

也可以用 API（适合脚本化查询）：

```bash
curl -sSfL "https://api.github.com/repos/anza-xyz/agave/releases?per_page=100"
```

总结一句：通道是“移动目标”，tag 是“固定点”。

## 常见问题与排障

### 问题 1：明明在 `edge`，为什么还是旧版本？

先看：

```bash
agave-install info
```

如果有 `Update available`，执行：

```bash
agave-install update
```

然后再验证版本：

```bash
solana --version
```

### 问题 2：为什么 update 后变成 3.x？

最常见原因是你当前跟踪的是 `stable` 通道。  
`update` 只会在当前通道内更新，不会自动跨到 `edge`。

确认命令：

```bash
agave-install info
```

### 问题 3：安装卡住或中断后异常

先检查是否有残留安装进程：

```bash
pgrep -af agave-install
pgrep -af "release.anza.xyz"
```

必要时结束残留进程后重试安装：

```bash
pkill -f agave-install || true
```

### 问题 4：版本不一致（PATH 冲突）

如果 `solana --version` 和你预期不一致，先检查命令路径：

```bash
which -a solana
which -a agave-install
```

如果存在多个安装来源（如旧版 Solana 安装目录），需要清理 PATH 或移除旧安装。

## 官方文档与参考链接

- Anza CLI 安装文档：https://docs.anza.xyz/cli/install
- Agave Releases（官方版本发布）：https://github.com/anza-xyz/agave/releases
- Solana 安装入口文档：https://solana.com/docs/intro/installation

建议优先以 Anza 文档和 `release.anza.xyz` manifest 结果为准，第三方文章只做参考。

## 总结

最短闭环可以记成 4 步：

1. 看状态：`agave-install info` + `solana --version`
2. 切通道或定版本：`curl .../install | sh`
3. 更新：`agave-install update`
4. 验证：`agave-install info` + `solana --version`

把“通道”和“版本 tag”分开管理，你的 Solana CLI 版本就会非常可控。
