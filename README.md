# EvilAppleJuice

<div align="center">

**Apple BLE 邻近配对消息欺骗工具 - Node.js 实现**

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0-brightgreen)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-ISC-blue)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Linux%20%7C%20macOS%20%7C%20Windows-lightgrey)](#-平台兼容性）

⚠️ **仅用于安全研究和教育目的**

</div>

---

## 📖 目录

- [项目简介](#-项目简介)
- [功能特性](#-功能特性)
- [快速开始](#-快速开始)
- [使用指南](#-使用指南)
- [平台说明](#-平台说明)
- [API 参考](#-api-参考)
- [开发指南](#-开发指南)
- [故障排除](#-故障排除)
- [贡献指南](#-贡献指南)
- [许可证](#-许可证)

---

## 🎯 项目简介

EvilAppleJuice 是一个基于 Node.js 的 BLE（蓝牙低功耗）广播工具，能够模拟 Apple 设备的邻近配对消息。当附近的 Apple 设备接收到这些广播时，会触发系统级的配对弹窗提示。

### 技术原理

通过 BLE 广播发送特定格式的 **EIR (Extended Inquiry Response)** 数据包，模拟 Apple 设备的配对请求协议。这些数据包包含：

- Apple 厂商 ID (`0x004C`)
- 设备类型标识
- 配对状态信息
- 随机生成的 MAC 地址

### 应用场景

- 🔬 **安全研究**: 测试 Apple 设备的 BLE 配对机制
- 🎓 **教育学习**: 理解 BLE 协议和邻近配对原理
- 🛡️ **渗透测试**: 评估蓝牙安全性（需授权）
- 🔍 **协议分析**: 研究 Apple BLE 通信协议

---

## ✨ 功能特性

### 🎮 多种交互模式

| 模式 | 描述 | 适用场景 |
|------|------|----------|
| **CLI 交互** | 命令行问答式交互 | 新手友好，简单易用 |
| **TUI 界面** | 文本图形化界面 | 实时监控，专业用户 |
| **编程 API** | Node.js 模块调用 | 集成到其他项目 |

### 📡 广播模式

- ✅ **单设备模式**: 选择特定设备持续广播
- ✅ **随机模式**: 自动随机切换设备进行间隔广播
- ✅ **自定义配置**: 灵活调整广播参数

### 📊 实时监控

- 蓝牙状态检测
- 广播次数统计
- 运行时间追踪
- 当前设备显示（随机模式）
- 彩色日志输出

### 🔧 技术特性

- 模块化架构设计
- 完整的错误处理
- 优雅的信号管理
- 跨平台支持
- TypeScript 类型定义

---

## 🚀 快速开始

### 前置要求

- **Node.js**: 16.x 或更高版本（推荐 20+）
- **npm** 或 **yarn**
- **Bluetooth 4.0+** 适配器

### 安装步骤

```bash
# 1. 克隆仓库
git clone https://github.com/yourusername/EvilAppleJuice-js.git
cd EvilAppleJuice-js

# 2. 安装依赖
npm install

# 3. 验证安装
npm test
```

### 系统配置

#### Linux （推荐）

```bash
# 安装蓝牙依赖
sudo apt-get install bluetooth bluez libbluetooth-dev libudev-dev

# 设置权限（无需 root 运行）
sudo setcap cap_net_raw+eip $(eval readlink -f `which node`)

# 启动蓝牙服务
sudo systemctl start bluetooth
```

#### macOS

```bash
# 安装 Xcode Command Line Tools
xcode-select --install

# 授予终端蓝牙权限
# 系统偏好设置 → 安全性与隐私 → 隐私 → 蓝牙
```

> ⚠️ **重要提示**: macOS 由于 CoreBluetooth 限制，**无法发送自定义 EIR 数据**，因此无法触发 Apple 配对弹窗。详见 [平台说明](#-平台说明)。

#### Windows

```bash
# 安装构建工具
npm install --global --production windows-build-tools

# 使用 Zadig 工具为 BLE 适配器安装 WinUSB 驱动
# 下载地址：https://zadig.akeo.ie/
```

### 运行程序

```bash
# 方式 1: CLI 交互模式（推荐新手）
npm start

# 方式 2: TUI 图形界面
npm run tui

# 方式 3: 直接运行
node index.js
```

---

## 📖 使用指南

### CLI 交互模式

启动后会进入交互式菜单：

```
? 请选择操作：
❯ 🚀 启动单设备模式
  🎲 启动随机模式
  ℹ️  查看设备信息
  ⚙️  配置参数
  ❌ 退出
```

#### 单设备模式

1. 选择 "启动单设备模式"
2. 从列表中选择要模拟的设备（如 AirPods Pro）
3. 服务启动，显示实时状态
4. 按 `Ctrl+C` 停止并返回菜单

```
正在启动单设备模式。..

设备：AirPods Pro
广播持续时间：3000ms
停止间隔：1000ms

 ✓ 服务已启动

提示：按 Ctrl+C 停止服务

广播次数：42 | 运行时间：126s
```

#### 随机模式

1. 选择 "启动随机模式"
2. 服务自动随机切换设备
3. 实时显示当前设备和统计信息
4. 按 `Ctrl+C` 停止

```
正在启动随机模式。..

广播持续时间：3000ms
停止间隔：1000ms
模式：随机切换设备

 ✓ 服务已启动

广播次数：85 | 当前设备：AppleTV Setup | 运行时间：256s
```

#### 配置参数

可以自定义广播参数：

- **广播持续时间**: 每次广播持续的毫秒数（默认 3000ms）
- **停止间隔时间**: 两次广播之间的间隔（默认 1000ms）

配置会保存并在下次启动时使用。

### TUI 图形界面

TUI 提供三个面板的实时监控：

```
┌─────────────────┬─────────────────┐
│ 📊 Status       │ 📈 Statistics   │
│ Bluetooth: on   │ Count: 42       │
│ Mode: single    │ Time: 126s      │
│ Device: AirPods │                 │
├─────────────────┴─────────────────┤
│ 📱 Select Device                  │
│ > AirPods Pro                     │
│   AirPods Max                     │
│   AppleTV Setup                   │
├───────────────────────────────────┤
│ 📝 Logs                           │
│ [12:00:01] ℹ Service started     │
│ [12:00:02] ✔ Broadcasting...     │
└───────────────────────────────────┘
```

**快捷键**:

| 按键 | 功能 |
|------|------|
| `1` | 选择单设备模式 |
| `2` | 选择随机模式 |
| `↑/↓` | 导航设备列表 |
| `Space` | 启动/停止广播 |
| `r` | 重置统计 |
| `q` / `Ctrl+C` | 退出 |

**滚动支持**:

- 鼠标滚轮上下滚动
- `PgUp/PgDn` 翻页
- `Home/End` 跳到顶部/底部

### 编程 API

将 EvilAppleJuice 作为模块集成到您的项目中：

```javascript
const evilAppleJuice = require('./lib');

// 获取可用设备列表
const devices = evilAppleJuice.getAvailableDevices();
console.log('可用设备：', devices);

// 单设备模式
await evilAppleJuice.startSingleMode('AirPods Pro', {
  delayMilliseconds: 3000,
  stopDelayMilliseconds: 1000
});

// 随机模式
await evilAppleJuice.startRandomMode({
  delayMilliseconds: 5000
});

// 获取实时状态
const status = evilAppleJuice.getStatus();
console.log('广播次数：', status.broadcastCount);

// 停止服务
await evilAppleJuice.stop();
```

#### 事件监听

```javascript
// 监听日志
evilAppleJuice.logger.onLog((entry) => {
  console.log(`[${entry.type}] ${entry.message}`);
});

// 监听状态变化
evilAppleJuice.stateManager.onStateChange((newState, oldState) => {
  if (newState.isRunning !== oldState.isRunning) {
    console.log('服务状态变更：', newState.isRunning ? '运行中' : '已停止');
  }
});
```

---

## 🖥️ 平台说明

### 兼容性对比

| 功能 | Linux | macOS | Windows |
|------|-------|-------|---------|
| 基本 BLE 广播 | ✅ | ✅ | ✅ |
| 自定义 EIR 数据 | ✅ | ❌ | ⚠️ |
| Apple 配对弹窗 | ✅ | ❌ | ⚠️ |
| CLI 界面 | ✅ | ✅ | ✅ |
| TUI 界面 | ✅ | ✅ | ✅ |
| 多连接支持 | ✅ | ✅ | ✅ |

**图例**:
- ✅ 完全支持
- ❌ 不支持（系统限制）
- ⚠️ 部分支持（取决于硬件和驱动）

### macOS 限制说明

#### 为什么不支持？

macOS 使用 **CoreBluetooth** 框架，出于安全和隐私考虑：

1. **不允许**应用程序直接控制底层 BLE 广播数据
2. **不提供** `startAdvertisingWithEIRData` API
3. 只能使用标准广播（设备名称 + UUID）

这是**系统级限制**，不是软件 bug。

#### 影响

- ❌ 无法发送自定义 Apple 配对数据包
- ❌ 无法触发 Apple 设备的配对弹窗
- ✅ 可以用于学习 BLE 基本概念
- ✅ 可以进行标准 BLE 广播测试

#### 解决方案

如需完整功能，请：

1. **使用 Linux 系统**（推荐 Raspberry Pi）
2. **Linux 虚拟机**（VirtualBox/VMware）
3. **双系统安装** Linux

### 推荐硬件

| 适配器 | 兼容性 | 价格 | 备注 |
|--------|--------|------|------|
| CSR 4.0 USB | ⭐⭐⭐⭐⭐ | $5-10 | 最稳定，推荐 |
| Realtek RTL8761B | ⭐⭐⭐⭐ | $8-15 | 良好兼容 |
| 内置蓝牙 | ⭐⭐⭐ | - | 因设备而异 |

---

## 🔌 API 参考

### 核心方法

#### `startSingleMode(deviceName, config?)`

启动单设备广播模式。

**参数**:
- `deviceName` (string): 设备名称
- `config` (object, 可选）: 配置选项

**示例**:
```javascript
await evilAppleJuice.startSingleMode('AirPods Pro', {
  delayMilliseconds: 3000,
  stopDelayMilliseconds: 1000
});
```

#### `startRandomMode(config?)`

启动随机设备广播模式。

**参数**:
- `config` (object, 可选）: 配置选项

**示例**:
```javascript
await evilAppleJuice.startRandomMode({
  delayMilliseconds: 5000
});
```

#### `stop()`

停止所有广播服务。

**示例**:
```javascript
await evilAppleJuice.stop();
```

#### `getStatus()`

获取当前运行状态。

**返回**:
```javascript
{
  isRunning: boolean,           // 是否正在运行
  bluetoothState: string,       // 蓝牙状态
  mode: 'single' | 'random' | null,  // 当前模式
  selectedDevice: string | null,     // 选中的设备
  broadcastCount: number,       // 广播次数
  startTime: number | null,     // 启动时间戳
  currentDeviceData: object | null,  // 当前设备数据
  config: object                // 当前配置
}
```

#### `getAvailableDevices()`

获取所有可用设备列表。

**返回**:
```javascript
{
  devices: Array,               // 长距离设备列表
  shortDevices: Array,          // 短距离设备列表
  totalDevices: number,         // 长距离设备数量
  totalShortDevices: number     // 短距离设备数量
}
```

#### `getDeviceDataByName(name)`

根据名称获取设备数据。

**参数**:
- `name` (string): 设备名称

**返回**: 设备对象或 `null`

#### `getRandomDeviceData()`

获取随机设备数据。

**返回**: 随机选择的设备对象

### 配置选项

```javascript
const config = {
  delayMilliseconds: 3000,        // 广播持续时间（毫秒）
  stopDelayMilliseconds: 1000     // 停止后延迟（毫秒）
};
```

**参数说明**:

| 参数 | 类型 | 默认值 | 范围 | 说明 |
|------|------|--------|------|------|
| `delayMilliseconds` | number | 3000 | 100-60000 | 每次广播持续时间 |
| `stopDelayMilliseconds` | number | 1000 | 100-30000 | 两次广播间隔 |

### 日志系统

```javascript
// 注册日志监听器
const unsubscribe = evilAppleJuice.logger.onLog((entry) => {
  console.log(`[${entry.timestamp.toLocaleTimeString()}] ${entry.type}: ${entry.message}`);
});

// 取消监听
unsubscribe();
```

**日志类型**:
- `info`: 普通信息
- `warning`: 警告信息
- `error`: 错误信息
- `success`: 成功信息

### 状态管理

```javascript
// 监听状态变化
evilAppleJuice.stateManager.onStateChange((newState, oldState) => {
  console.log('状态变更：', {
    from: oldState,
    to: newState
  });
});

// 获取特定状态
const isRunning = evilAppleJuice.stateManager.get('isRunning');
```

---

## 🛠️ 开发指南

### 项目结构

```
EvilAppleJuice-js/
├── src/                    # 源代码
│   ├── main.js            # 核心模块（基础版）
│   ├── main-enhanced.js   # 增强版核心（多模式支持）
│   ├── cli.js             # CLI 交互界面
│   ├── tui.js             # TUI 图形界面
│   ├── logger.js          # 日志管理器
│   └── stateManager.js    # 状态管理器
├── lib/                    # 导出模块
│   └── index.js           # 主入口
├── tests/                  # 测试文件
│   └── test.js            # 单元测试
├── examples/               # 示例代码
│   └── examples.js        # 使用示例
├── docs/                   # 详细文档
│   ├── USAGE_GUIDE.md     # 使用指南
│   ├── CLI_IMPROVEMENTS.md # CLI 改进说明
│   ├── TUI_IMPROVEMENTS.md # TUI 改进说明
│   ├── EXIT_FIXES.md      # 退出机制修复
│   └── TROUBLESHOOTING_MACOS.md # macOS 问题排查
├── devices.js              # 设备数据库
├── package.json            # 项目配置
└── README.md               # 本文档
```

### 本地开发

```bash
# 1. 克隆仓库
git clone https://github.com/yourusername/EvilAppleJuice-js.git
cd EvilAppleJuice-js

# 2. 安装依赖
npm install

# 3. 运行测试
npm test

# 4. 开发模式
npm run dev

# 5. 运行示例
npm run examples
```

### 添加新设备

编辑 `devices.js` 文件：

```javascript
// 添加到长距离设备列表
module.exports.DEVICES.push({
  name: 'My Custom Device',
  data: [
    0x1e, 0xff, 0x4c, 0x00,  // Apple 厂商 ID
    // ... 其他字节
  ]
});

// 或添加到短距离设备列表
module.exports.SHORT_DEVICES.push({
  name: 'My Short Range Device',
  data: [
    // ... 设备数据
  ]
});
```

### 调试技巧

```bash
# 启用详细日志
DEBUG=* node index.js

# 检查蓝牙状态
hciconfig -a                    # Linux
system_profiler SPBluetoothDataType  # macOS

# 监控 BLE 流量
sudo hcidump -t -x             # Linux
```

---

## ❓ 故障排除

### 常见问题

#### 1. "Permission denied" 错误

**Linux**:
```bash
sudo setcap cap_net_raw+eip $(eval readlink -f `which node`)
```

**macOS**:
在系统偏好设置中授予终端蓝牙访问权限：
- 系统偏好设置 → 安全性与隐私 → 隐私 → 蓝牙

#### 2. "Bluetooth not powered on"

**Linux**:
```bash
sudo systemctl start bluetooth
sudo hciconfig hci0 up
```

**macOS**:
检查菜单栏蓝牙图标，确保蓝牙已开启。

**Windows**:
- 检查设备管理器中的蓝牙适配器
- 确保驱动程序已正确安装

#### 3. macOS 上无法触发配对弹窗

这是**系统限制**，无法通过软件解决。

**原因**: CoreBluetooth 框架不允许发送自定义 EIR 数据。

**解决方案**: 使用 Linux 系统。

详见：[TROUBLESHOOTING_MACOS.md](docs/TROUBLESHOOTING_MACOS.md)

#### 4. xpc-connection 编译错误

**错误信息**:
```
Error: Cannot find module 'xpc-connection'
```

**原因**: 原始 bleno 包与 Node.js 16+ 不兼容。

**解决方案**: 本项目已使用 `@stoprocent/bleno`，无需额外配置。

#### 5. TUI 界面显示异常

**乱码问题**:
```bash
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
```

**窗口大小**: 确保终端窗口足够大（至少 80x24）。

#### 6. 广播无效果

**检查清单**:
- [ ] 蓝牙适配器支持 BLE 4.0+
- [ ] 目标设备是 Apple 设备
- [ ] 目标设备蓝牙已开启
- [ ] 距离在有效范围内（通常 < 10 米）
- [ ] Linux 系统（macOS 不支持）

### 性能优化

#### 减少广播频率

```javascript
// 增加间隔时间
await evilAppleJuice.startSingleMode('AirPods Pro', {
  delayMilliseconds: 5000,      // 增加到 5 秒
  stopDelayMilliseconds: 2000   // 增加到 2 秒
});
```

#### 使用外部适配器

内置蓝牙可能功率不足，建议使用外部 USB BLE 适配器。

#### 关闭其他蓝牙应用

避免与其他蓝牙应用冲突。

---

## 🤝 贡献指南

欢迎贡献！请遵循以下步骤：

1. **Fork** 本仓库
2. **创建分支**: `git checkout -b feature/YourFeature`
3. **提交更改**: `git commit -am 'Add some feature'`
4. **推送分支**: `git push origin feature/YourFeature`
5. **提交 Pull Request**

### 开发规范

- 使用 2 空格缩进
- 遵循 ESLint 规则
- 添加必要的注释
- 编写测试用例
- 更新文档

### 报告问题

请在 GitHub Issues 中报告问题，包含：

- 操作系统和版本
- Node.js 版本
- 蓝牙适配器型号
- 详细的错误信息
- 复现步骤

---

## 📄 许可证

本项目采用 **ISC License**。

详见 [LICENSE](LICENSE) 文件。

---

## 🙏 致谢

感谢以下开源项目：

- **[noble/bleno](https://github.com/noble/bleno)** - Node.js BLE 库
- **[@stoprocent/bleno](https://github.com/stoprocent/bleno)** - 活跃维护的 bleno 分支
- **[blessed](https://github.com/chjj/blessed)** - TUI 框架
- **[blessed-contrib](https://github.com/yaronn/blessed-contrib)** - TUI 组件库
- **[inquirer](https://github.com/SBoudrias/Inquirer.js)** - 交互式命令行
- **[chalk](https://github.com/chalk/chalk)** - 终端字符串样式

---

## ⚠️ 法律免责声明

### 允许用途

✅ 安全研究  
✅ 教育目的  
✅ 授权渗透测试  
✅ BLE 协议学习  
✅ 学术研究  

### 禁止用途

❌ 未经授权的攻击  
❌ 骚扰他人  
❌ 任何非法活动  
❌ 商业用途（未经明确授权）  

### 责任声明

使用者需遵守当地法律法规。**作者不对任何滥用行为负责**。

使用本软件即表示您同意：
1. 仅用于合法的安全研究和教育目的
2. 不在未经授权的系统上使用
3. 遵守所有适用的法律法规

---

<div align="center">

**Made with ❤️ for security research**

[⬆ 返回顶部](#evilapplejuice)

</div>
