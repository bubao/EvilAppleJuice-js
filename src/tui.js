#!/usr/bin/env node

const blessed = require('blessed');
const contrib = require('blessed-contrib');
const evilAppleJuice = require('./main-enhanced');
const logger = evilAppleJuice.logger;
const stateManager = evilAppleJuice.stateManager;

// 创建屏幕
const screen = blessed.screen({
  smartCSR: true,
  fullUnicode: true,
  dockBorders: true,
});

screen.title = 'EvilAppleJuice - BLE Spoofer';

// 创建网格布局
const grid = new contrib.grid({ rows: 12, cols: 12, screen: screen });

// 状态面板（左上）
const statusBox = grid.set(0, 0, 4, 6, blessed.box, {
  label: ' 📊 Status ',
  tags: true,
  border: { type: 'line' },
  style: {
    border: { fg: 'cyan' },
  },
});

// 统计面板（右上）
const statsBox = grid.set(0, 6, 4, 6, blessed.box, {
  label: ' 📈 Statistics ',
  tags: true,
  border: { type: 'line' },
  style: {
    border: { fg: 'green' },
  },
});

// 设备选择面板（左中）
const deviceBox = grid.set(4, 0, 5, 6, blessed.list, {
  label: ' 📱 Select Device (↑/↓ to navigate, Enter to select) ',
  keys: true,
  vi: true,
  mouse: true,
  border: { type: 'line' },
  style: {
    selected: { bg: 'blue', fg: 'white' },
    border: { fg: 'yellow' },
  },
  items: [],
});

// 控制说明（右中）
const helpBox = grid.set(4, 6, 5, 6, blessed.box, {
  label: ' ⌨️ Controls ',
  tags: true,
  border: { type: 'line' },
  style: {
    border: { fg: 'magenta' },
  },
  content: `{yellow-fg}Mode Selection:{/yellow-fg}
  {green-fg}1{/green-fg} - Single Device Mode
  {green-fg}2{/green-fg} - Random Mode
  
{yellow-fg}Actions:{/yellow-fg}
  {green-fg}Space{/green-fg} - Start/Stop
  {green-fg}r{/green-fg} - Reset Stats
  {green-fg}q{/green-fg} - Quit
  
{yellow-fg}Navigation:{/yellow-fg}
  {green-fg}↑/↓{/green-fg} - Move in device list
  {green-fg}Enter{/green-fg} - Select device`,
});

// 日志面板（底部）
const logBox = grid.set(9, 0, 3, 12, blessed.log, {
  label: ' 📝 Logs ',
  tags: true,
  border: { type: 'line' },
  scrollable: true,
  alwaysScroll: true,
  vi: true, // 启用 vi 风格滚动
  mouse: true, // 启用鼠标滚动
  scrollbar: {
    ch: ' ',
    track: { bg: 'grey' },
    style: { inverse: true },
  },
  style: {
    border: { fg: 'blue' },
  },
  height: '30%',
  keys: true, // 启用键盘控制
});

// 更新状态显示
const updateStatus = () => {
  const status = evilAppleJuice.getStatus();
  const modeColors = {
    single: 'green',
    random: 'yellow',
    null: 'red',
  };
  
  const modeColor = modeColors[status.mode] || 'red';
  const runningStatus = status.isRunning ? '{green-fg}● Running{/green-fg}' : '{red-fg}○ Stopped{/red-fg}';
  
  statusBox.setContent(
    `{bold}Status:{/bold} ${runningStatus}\n` +
    `{bold}Mode:{/bold} {${modeColor}-fg}${status.mode || 'None'}{/${modeColor}-fg}\n` +
    `{bold}Bluetooth:{/bold} ${status.bluetoothState}\n` +
    `{bold}Device:{/bold} ${status.selectedDevice || 'N/A'}\n` +
    `{bold}Uptime:{/bold} ${status.uptime}`
  );
  
  screen.render();
};

// 更新统计显示
const updateStats = () => {
  const status = evilAppleJuice.getStatus();
  const devices = evilAppleJuice.getAvailableDevices();
  
  statsBox.setContent(
    `{bold}Broadcasts:{/bold} {green-fg}${status.broadcastCount}{/green-fg}\n` +
    `{bold}Total Devices:{/bold} ${devices.totalDevices + devices.totalShortDevices}\n` +
    `{bold}Long-range:{/bold} ${devices.totalDevices}\n` +
    `{bold}Short-range:{/bold} ${devices.totalShortDevices}\n` +
    `{bold}Platform:{/bold} ${process.platform}`
  );
  
  screen.render();
};

// 添加日志
let tuiMode = true;

// 启用 logger 静默模式
logger.silent = true;

logger.onLog((entry) => {
  if (entry.type === 'clear') {
    // blessed.log 没有 clearItems 方法，使用 setContent 清空
    logBox.setContent('');
  } else {
    const time = entry.timestamp.toLocaleTimeString();
    const colors = {
      info: 'cyan',
      warning: 'yellow',
      error: 'red',
      success: 'green',
    };
    
    const color = colors[entry.type] || 'white';
    const prefix = {
      info: 'ℹ',
      warning: '⚠',
      error: '✖',
      success: '✔',
    };
    
    const logLine = `{${color}-fg}[${time}] ${prefix[entry.type]} ${entry.message}{/${color}-fg}`;
    logBox.add(logLine);
    
    // 自动滚动到底部
    logBox.setScrollPerc(100);
  }
  
  screen.render();
});

// 监听状态变化
stateManager.onChange(() => {
  updateStatus();
  updateStats();
});

// 填充设备列表
const devices = evilAppleJuice.getAvailableDevices();
const deviceItems = devices.devices.map(d => `${d.type === 'long-range' ? '🎧' : '📺'} ${d.name}`);
deviceBox.setItems(deviceItems);

// 初始渲染
updateStatus();
updateStats();

// 显示平台信息
const platform = process.platform;
if (platform === 'darwin') {
  logger.warn('═══════════════════════════════════════');
  logger.warn('macOS Platform Detected');
  logger.warn('═══════════════════════════════════════');
  logger.warn('⚠️  Custom EIR broadcasting is NOT supported');
  logger.warn('⚠️  Apple pairing spoofing will NOT work');
  logger.warn('ℹ️  This is a macOS system limitation');
  logger.warn('ℹ️  Use Linux for full functionality');
  logger.warn('═══════════════════════════════════════');
}

logger.info('TUI initialized. Press 1 or 2 to select mode.');
logger.info(`Current Bluetooth state: ${stateManager.get('bluetoothState')}`);

// 监听蓝牙状态变化
const bleno = require('@stoprocent/bleno');
bleno.on('stateChange', (state) => {
  stateManager.update({ bluetoothState: state });
  if (state === 'poweredOn') {
    logger.success('Bluetooth is ready! You can now start broadcasting.');
  } else {
    logger.warn(`Bluetooth state changed to: ${state}`);
  }
  updateStatus();
  screen.render();
});

// 键盘事件处理
let selectedMode = null;
let selectedDeviceIndex = 0;

screen.key(['q', 'C-c'], async () => {
  // 立即恢复控制台输出
  logger.silent = false;
  
  try {
    const status = evilAppleJuice.getStatus();
    if (status.isRunning) {
      await evilAppleJuice.stop();
    }
  } catch (err) {
    // 忽略错误
  }
  
  // 先销毁 screen
  try {
    screen.destroy();
  } catch (e) {
    // 忽略
  }
  
  // 完全禁用 stdout/stderr 输出
  const originalStdoutWrite = process.stdout.write;
  const originalStderrWrite = process.stderr.write;
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  
  process.stdout.write = () => true;
  process.stderr.write = () => true;
  console.log = () => {};
  console.error = () => {};
  
  // 使用 nextTick 确保清理完成
  process.nextTick(() => {
    // 不恢复，直接退出
    process.exit(0);
  });
});

screen.key(['1'], () => {
  selectedMode = 'single';
  logger.info('Mode: Single Device (select a device and press Space to start)');
  deviceBox.focus();
  screen.render();
});

screen.key(['2'], () => {
  selectedMode = 'random';
  logger.info('Mode: Random (press Space to start)');
  screen.render();
});

screen.key(['space'], async () => {
  const status = evilAppleJuice.getStatus();
  
  if (status.isRunning) {
    // 停止
    await evilAppleJuice.stop();
    logger.success('Service stopped');
  } else {
    // 检查蓝牙状态
    if (status.bluetoothState !== 'poweredOn') {
      logger.warn(`Bluetooth not ready. Current state: ${status.bluetoothState}`);
      logger.info('Please ensure Bluetooth is enabled on your system');
      screen.render();
      return;
    }
    
    // 启动
    try {
      if (selectedMode === 'single') {
        const selectedIndex = deviceBox.selected;
        const deviceName = devices.devices[selectedIndex].name;
        logger.info(`Starting single mode with: ${deviceName}`);
        await evilAppleJuice.startSingleMode(deviceName);
      } else if (selectedMode === 'random') {
        logger.info('Starting random mode');
        await evilAppleJuice.startRandomMode();
      } else {
        logger.warn('Please select a mode first (1 or 2)');
      }
    } catch (err) {
      logger.error(`Failed to start: ${err.message}`);
    }
  }
  
  screen.render();
});

screen.key(['r'], () => {
  stateManager.reset();
  logBox.setContent(''); // 使用 setContent 清空日志
  logger.info('Stats reset');
  updateStatus();
  updateStats();
  screen.render();
});

// 聚焦到设备列表
deviceBox.focus();

// 处理设备选择
deviceBox.on('select', (item, index) => {
  selectedDeviceIndex = index;
  const deviceName = devices.devices[index].name;
  logger.info(`Selected device: ${deviceName}`);
  screen.render();
});

// 定时刷新
setInterval(() => {
  if (stateManager.get('isRunning')) {
    updateStatus();
  }
}, 1000);

// 渲染屏幕
screen.render();

// 添加进程级别的信号处理
process.on('SIGINT', async () => {
  logger.silent = false;
  try {
    const status = evilAppleJuice.getStatus();
    if (status.isRunning) {
      await evilAppleJuice.stop();
    }
  } catch (err) {
    // 忽略错误
  } finally {
    try {
      screen.destroy();
    } catch (e) {
      // 忽略销毁错误
    }
    
    // 完全禁用输出
    process.stdout.write = () => true;
    process.stderr.write = () => true;
    console.log = () => {};
    console.error = () => {};
    
    process.nextTick(() => {
      process.exit(0);
    });
  }
});

process.on('SIGTERM', async () => {
  logger.silent = false;
  try {
    const status = evilAppleJuice.getStatus();
    if (status.isRunning) {
      await evilAppleJuice.stop();
    }
  } catch (err) {
    // 忽略错误
  } finally {
    try {
      screen.destroy();
    } catch (e) {
      // 忽略销毁错误
    }
    
    // 完全禁用输出
    process.stdout.write = () => true;
    process.stderr.write = () => true;
    console.log = () => {};
    console.error = () => {};
    
    process.nextTick(() => {
      process.exit(0);
    });
  }
});
