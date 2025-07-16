---
title: IntelliJ IDEA使用JVM远程调试
tags: 工具 Java 调试
---

# IntelliJ IDEA使用JVM远程调试

## 背景

我们经常会遇到环境出问题，但是本地又难以复现的情况。这个时候如果只靠日志有时候会很难发现问题的根本原因。本文介绍如何使用IntelliJ IDEA连接线上环境并进行断点调试的方法，即IDEA自带的远程JVM调试功能。

> **注意**：生产环境不建议使用此方法，可能会影响系统性能和稳定性。

## 配置步骤

### 1. 创建远程调试配置

首先点击IDEA右上角的配置按钮：

![IDEA配置按钮](/assets/images/ideaJvmTools/img.png)

在弹出的下拉菜单中，选择"添加配置"或"编辑配置"，然后点击"+"号新建一个远程JVM调试配置：

![新建JVM调试配置](/assets/images/ideaJvmTools/img2.png)

### 2. 设置调试参数

在配置界面中：

- 名称：可以根据实际环境自定义，便于识别
- 调试器模式：选择"附加到远程JVM"
- 传输：选择"Socket"
- 主机：填写目标服务器IP地址
- 端口：填写开放的调试端口
- JDK版本：选择与目标环境对应的版本

![调试参数配置](/assets/images/ideaJvmTools/img3.png)

### 3. 了解JDWP参数

JDWP（Java Debug Wire Protocol）是调试器和目标虚拟机之间的通信协议。参数说明：

- `transport=dt_socket`：使用Socket方式传输
- `server=y`：表示作为服务端等待调试器连接
- `suspend=n`：启动时不挂起虚拟机
- `address=*:端口号`：监听的地址和端口

## 目标环境配置

### Kubernetes环境配置示例

如果项目部署在Kubernetes中，需要在部署配置中添加JVM调试参数，这里用k8s举例，主要就是保证项目启动参数要加上：

![K8s部署参数配置](/assets/images/ideaJvmTools/img4.png)

关键参数：
```
-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005
```

### 端口暴露

对于K8s部署，还需要将服务的调试端口暴露出来。这里采用NodePort方式，将容器的5005端口映射为NodePort的60823：

![K8s服务端口配置](/assets/images/ideaJvmTools/img5.png)

## 开始调试

1. 确认配置无误后，点击"确定"保存配置
2. 在需要调试的代码处设置断点
3. 点击调试按钮启动远程调试
4. 触发对应的业务流程，当执行到断点处时，IDEA将会暂停执行并进入调试状态

## 调试技巧

- 确保本地代码与远程环境代码一致，否则断点可能无法正确命中
- 调试完成后记得关闭调试会话，避免长时间占用连接
- 对于生产环境问题排查，建议先在测试或预发布环境进行验证

## 常见问题

1. 连接超时：检查网络连通性和防火墙设置
2. 断点不生效：确认本地代码版本与远程一致
3. 性能影响：远程调试会对应用性能产生一定影响，请谨慎使用


