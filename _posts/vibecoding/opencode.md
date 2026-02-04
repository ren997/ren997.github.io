---
title: OpenCode 详细使用攻略
categories: [vibecoding, 教程]
tags: [opencode, AI编程, 教程]
---

# OpenCode 详细使用攻略（含完整操作命令）
## 一、工具核心优势
1. 对中国用户友好，无Claude Code的限速、封号问题；
2. 内置免费模型（GLM 4.7、MiniMax 2.1），零配置开箱即用，适合新手入门AI编程；
3. 支持免费接入顶级模型（Gemini 3 Pro、Claude 4.5 Opus、ChatGPT Codex等），涵盖75种AI接入方式；
4. 可练习Agent Skills、MCP、Subagent等高级特性，功能对标Claude Code且开源免费。

## 二、四种形态及安装操作（含命令）
### （一）命令行版（推荐优先安装）
#### 前置准备
1. 访问Node.js官网，下载对应操作系统的安装包并完成安装；
2. 打开终端窗口，执行以下安装命令：
```bash
npm install -g opencode  # 复制该npm命令粘贴到终端，回车执行
```
3. 安装完成后，启动命令：
```bash
opencode  # 输入后回车，启动成功后进入交互页面
```
4. 验证配置：在交互页面输入打招呼信息（如“你好”），收到回复即配置成功。

### （二）桌面客户端
1. 访问OpenCode官方下载页面，点击“下载客户端”；
2. 安装流程：双击安装包 → 一路点击“下一步”完成安装；
3. 启动使用：打开客户端，选择任意文件夹作为项目文件夹，直接开始编程（Beta版存在较多Bug，功能仅含基础对话框）。

### （三）插件版（以VS Code为例）
#### 前置条件
已安装命令行版OpenCode。

#### 安装操作
1. 打开VS Code → 左侧点击“Extensions”（插件图标）；
2. 搜索框输入“OpenCode”，找到对应插件点击“Install”；
3. 启动插件：
  - 快捷键 `Ctrl+Shift+P` 打开命令面板；
  - 输入命令 `Open OpenCode` 并回车，插件自动关联左侧打开的代码文件；
4. 快捷功能：
  - 选中代码后，按 `Ctrl+Alt+K` ，可快速将代码粘贴到OpenCode聊天窗口。

### （四）云端运行环境（以GitHub为例）
#### 操作步骤
1. 项目上传GitHub：将本地项目推送到GitHub公开仓库（仓库设置为Public）；
2. 安装配置命令：
  - 进入本地项目文件夹，打开终端执行插件安装命令（参考OpenCode云端文档提供的安装脚本）；
  - 执行命令后选择适配的模型（需使用API模式）；
3. 提交配置文件：将自动生成的OpenCode配置文件提交到GitHub仓库；
4. 配置环境变量：
  - 进入GitHub项目 → Settings → Secrets and variables → Actions；
  - 点击“New repository secret”，添加两个密钥（参考文档中的Key名称），密钥值在谷歌AI Studio创建并复制；
  - 第一个密钥：粘贴文档指定的Key名称，填入对应密钥值 → 保存；
  - 第二个密钥：粘贴第二个Key名称，填入相同密钥值 → 保存；
5. 云端使用命令：
  - 在GitHub项目的Issue或评论区输入：
```markdown
/open code  # 触发云端功能，可用于解释问题、修复Bug等
```
6. 查看结果：
  - 进入GitHub项目的Actions页面，查看OpenCode工作流执行状态；
  - 执行完成后，在Pull request页面查看代码修改，点击合并按钮即可将修复内容合并到仓库。

## 三、顶级模型接入操作（含完整命令）
### （一）接入Gemini Pro / Claude 4.5 Opus（通过AntiGravity OS插件）
1. 插件安装命令：
  - 访问AntiGravity OS的GitHub首页，复制安装提示词（以“install”开头的完整语句）；
  - 打开OpenCode终端，粘贴提示词并回车，AI自动完成安装（耐心等待安装进度）；
2. 登录配置命令：
```bash
# 安装完成后，打开新终端窗口，执行登录命令（从GitHub复制）
opencode connect antigravity  # 示例命令，以插件官网实际命令为准
```
3. 交互配置步骤：
  - 模型供应商选择：输入“谷歌”或对应序号；
  - 登录方式选择：AntiGravity；
  - Project ID：直接回车（默认值）；
  - 跳转谷歌登录页面，完成登录后复制生成的URL；
  - 将URL粘贴到终端，回车；
  - 提示是否保存配置：输入“N”，回车；
4. 验证模型：
```bash
opencode  # 重启OpenCode
/models  # 输入该命令，查看模型列表，出现Gemini Pro、Claude 4.5 Opus即成功
```

### （二）接入ChatGPT Codex
1. 前置条件：拥有ChatGPT Plus及以上套餐（需先完成订阅）；
2. 接入命令：
```bash
opencode  # 启动OpenCode
/connect  # 输入该命令，回车
```
3. 交互选择：
  - 模型供应商：选择“OpenAI”；
  - 模型版本：选择“GPT Pro”；
  - 浏览器打开自动跳转的链接，点击“继续”，登录ChatGPT账户；
4. 验证：
```bash
/models  # 输入命令，查看模型列表，出现ChatGPT相关模型即成功
```

### （三）接入OpenRouter及其他75种模型
1. 获取API Key：
  - 访问OpenRouter官网 → 点击“Get API Key” → 创建API Key并复制；
2. 接入命令：
```bash
opencode  # 启动OpenCode
/connect  # 输入命令，回车
```
3. 交互配置：
  - 模型供应商：选择“OpenRouter”；
  - 粘贴复制的API Key → 回车；
4. 验证：
```bash
/models  # 输入命令，查看已接入的OpenRouter关联模型
```

## 四、核心功能操作命令（含详细用法）
### （一）模型相关命令
| 命令 | 功能描述 | 用法示例 |
|------|----------|----------|
| `/models` | 查看所有可用模型（带Free标记为免费模型） | 直接在OpenCode终端输入，回车 |

### （二）Session功能（多任务并行）
1. 新建Session：
```bash
New  # 在当前任务执行中，输入该命令，回车即可新建Session
```
2. 查看所有Session：
```bash
/sections  # 输入命令，回车，显示所有运行中/已完成的Session（打转符号表示正在运行）
```
3. 用法示例：
  - 第一个Session：输入“增加计时器功能”，执行；
  - 输入`New` → 第二个Session：输入“调整画笔颜色功能”，执行；
  - 可在多个Session间切换，查看执行进度。

### （三）分享与导出命令
| 命令 | 功能描述 | 用法 |
|------|----------|------|
| `/share` | 将Session对话记录生成网页链接，自动复制到剪贴板 | 输入命令，回车，粘贴链接到浏览器即可查看 |
| `/unshare` | 取消分享，使之前的网页链接失效 | 输入命令，回车 |
| `/export` | 将对话记录导出为文件（默认格式适配编程场景） | 输入命令，回车，按提示选择保存路径 |

### （四）时间线（检查点）命令
```bash
/timeline  # 输入命令，回车
```
- 功能：显示当前Session的所有对话记录节点；
- 操作：选择任意节点 → 点击“reward” → 代码与聊天内容回退到该节点状态，可重新修改。

### （五）Agent Skills迁移操作
1. 源文件处理：将其他工具（如Cloud Code）中的`/.cloud`目录，重命名为`/.opencode`；
2. 项目配置：
  - 打开OpenCode项目文件夹 → 新建`.opencode`文件夹；
  - 在`.opencode`中新建`skills`文件夹；
  - 将重命名后的技能包（原`.cloud`目录下的内容）复制到`skills`文件夹；
3. 验证命令：
```bash
opencode  # 启动OpenCode
你有哪些skills？  # 输入该问题，AI将列出已迁移的技能包
```

### （六）MCP配置（本地+远程）
#### 1. 本地MCP配置（以set cn为例）
1. 找到配置文件路径：`C:\Users\你的用户名\.config\opencode\opencode.json`（Windows）或`~/.config/opencode/opencode.json`（Mac/Linux）；
2. 编辑配置文件：
  - 复制以下配置片段，粘贴到`opencode.json`中（去除多余逗号）：
```json
"mcp": [
  {
    "name": "set cn",  // MCP名称
    "type": "local",  // 类型：本地
    "command": "npx shift cn",  // 执行命令
    "enable": true  // 启用该MCP
  }
]
```
3. 生效命令：
```bash
opencode restart  # 重启OpenCode（或关闭后重新启动）
/mcp  # 输入命令，查看已配置的本地MCP
```

#### 2. 远程MCP配置（以context7 mcp server为例）
1. 编辑`opencode.json`配置文件：
  - 追加以下配置片段：
```json
{
  "name": "context7",  // MCP名称
  "type": "remote",  // 类型：远程
  "url": "https://context7-mcp-server.example.com",  // 远程URL（从文档复制）
  "hide": "context7-secret-string",  // 隐藏字段（从文档复制）
  "apiKey": "你的context7-api-key"  // 官网创建并复制的API Key
}
```
2. 生效命令：
```bash
opencode restart  # 重启
/mcp  # 查看已配置的远程MCP
```

### （七）自定义命令与智能体
#### 1. 自定义命令（以“运行测试”为例）
1. 配置路径：`C:\Users\你的用户名\.config\opencode\com`（Windows）或`~/.config/opencode/com`（Mac/Linux）；
2. 新建文件：在`com`文件夹中新建`运行测试.md`，内容如下：
```markdown
# 运行测试
- mode: build  # 模式：build/play可选
- description: 执行项目单元测试，输出测试结果
- command: npm run test  # 实际执行的命令（可自定义）
```
3. 使用命令：
```bash
opencode  # 启动
/运行测试  # 输入自定义命令，回车执行
```

#### 2. 自定义智能体（以code review为例）
1. 配置路径：`C:\Users\你的用户名\.config\opencode\agent`（Windows）或`~/.config/opencode/agent`（Mac/Linux）；
2. 新建文件：在`agent`文件夹中新建`code-review.md`，内容如下：
```markdown
# Code Review 智能体
- type: sub agent  # 类型：sub agent（后台调度）/ primary（主智能体）
- model: gpt-4.2  # 关联的模型（可自定义）
- description: 自动评审代码质量，检查语法错误、逻辑漏洞、代码规范符合性
```
3. 使用说明：
  - 主智能体（primary）：启动OpenCode后，按`Tab`键切换到该智能体直接使用；
  - 子智能体（sub agent）：当AI需要评审代码时，自动后台调度执行。

## 五、热门插件：Oh my OpenCode（详细操作）
### （一）插件简介
集成LSP高级语法解析、AST代码搜索、多模态理解（图片/PDF）、任务分配、3个MCP server（web search/context/group app）、7大智能体（西西福斯/先知/图书管理员等），每个智能体匹配最优模型。

### （二）安装命令
1. 访问Oh my OpenCode的GitHub首页，复制安装提示词（以“install oh my opencode”开头的完整语句）；
2. 启动OpenCode，粘贴提示词并回车；
3. 交互配置：
  - 询问“是否有Claude订阅？”：输入“N”（无）；
  - 询问“是否有ChatGPT订阅？”：输入“Y”（有）；
  - 询问“是否有Gemini订阅？”：输入“Y”（有）；
  - 点击“确认”，等待安装完成。

### （三）插件配置修改
1. 配置文件路径：`C:\Users\你的用户名\.config\opencode\oh-my-opencode-config.json`（Windows）；
2. 编辑模型配置：将主智能体“西西福斯”的模型改为`gpt-4.2`（或自定义其他模型），保存文件；
3. 生效命令：
```bash
opencode restart  # 重启OpenCode
```

### （四）核心用法命令
#### 1. 选择智能体
```bash
@先知  # 输入“@+智能体名称”，回车，指定该智能体执行任务（如架构设计）
```

#### 2. Ultra Work模式（多智能体并行）
```bash
ulw  # 输入魔法词，回车
# 后续输入需求（如“创建一个宠物商店网页，含商品展示、购买功能”），回车
```
- 功能：主智能体西西福斯拆分任务清单，调度多个智能体并行执行，自动生成项目。

#### 3. Raf Loop模式（长时间循环任务）
```bash
/raf loop  # 输入命令，回车
# 输入需求（如“使用springboard4最新标准重构整个项目，直到所有测试用例通过”），回车
```
- 功能：强制AI长时间循环工作，直至复杂任务完成（可连续运行数小时）。

## 六、其他实用命令
| 命令 | 功能描述 | 用法 |
|------|----------|------|
| `/inate` | 通读项目文件夹，生成`agents.md`文件（作为项目系统提示词，帮助AI快速理解项目） | 启动OpenCode后，输入命令，回车，等待文件生成 |
| `/compact` | 压缩历史对话上下文，提炼摘要，释放模型上下文窗口 | 对话内容较多时，输入命令，回车 |
