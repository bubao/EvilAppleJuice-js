/**
 * EvilAppleJuice 模块使用示例
 */

const evilAppleJuice = require('../src/main');

// 示例 1: 基本使用
async function example1() {
  console.log('=== Example 1: Basic Usage ===');
  
  try {
    // 启动服务（使用默认配置）
    await evilAppleJuice.start();
    console.log('Service started with default configuration\n');
    
    // 运行 10 秒后停止
    setTimeout(async () => {
      await evilAppleJuice.stop();
      console.log('Service stopped\n');
    }, 10000);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// 示例 2: 自定义配置
async function example2() {
  console.log('=== Example 2: Custom Configuration ===');
  
  try {
    // 启动服务（使用自定义配置）
    await evilAppleJuice.start({
      delayMilliseconds: 5000,        // 广播持续 5 秒
      stopDelayMilliseconds: 2000,    // 停止间隔 2 秒
      verbose: true,                   // 显示详细日志
    });
    console.log('Service started with custom configuration\n');
    
    // 运行 15 秒后停止
    setTimeout(async () => {
      await evilAppleJuice.stop();
      console.log('Service stopped\n');
    }, 15000);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// 示例 3: 查询状态和设备信息
function example3() {
  console.log('=== Example 3: Query Status and Devices ===');
  
  // 获取当前状态
  const status = evilAppleJuice.getStatus();
  console.log('Current Status:', status);
  
  // 获取可用设备
  const devices = evilAppleJuice.getAvailableDevices();
  console.log('Available Devices:', {
    longRange: devices.totalDevices,
    shortRange: devices.totalShortDevices,
    total: devices.totalDevices + devices.totalShortDevices,
  });
  
  // 生成随机 MAC 地址
  const mac = evilAppleJuice.fakeRandomMac();
  console.log('Random MAC:', mac.toString('hex').match(/.{1,2}/g).join(':'));
  
  // 获取随机设备数据
  const deviceData = evilAppleJuice.getRandomDeviceData();
  console.log('Random Device Data Length:', deviceData.length, 'bytes\n');
}

// 示例 4: 作为库使用（编程方式）
async function example4() {
  console.log('=== Example 4: Using as a Library ===');
  
  try {
    // 可以在任何 Node.js 项目中导入使用
    const service = require('./main');
    
    // 检查状态
    console.log('Initial status:', service.getStatus());
    
    // 启动服务
    await service.start({
      delayMilliseconds: 3000,
      stopDelayMilliseconds: 1000,
      verbose: false,  // 静默模式
    });
    
    console.log('Service is running...');
    
    // 运行一段时间后停止
    setTimeout(async () => {
      await service.stop();
      console.log('Service stopped gracefully\n');
    }, 10000);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// 运行示例
console.log('EvilAppleJuice Module Examples\n');
console.log('Choose an example to run:\n');
console.log('1. Basic Usage - Start service with default config');
console.log('2. Custom Configuration - Start with custom timing');
console.log('3. Query Status - Check status and device info');
console.log('4. Library Usage - Use as a module in your code\n');

// 取消注释以下行来运行特定示例
// example1();
// example2();
example3();  // 默认运行示例 3（不需要 BLE 硬件）
// example4();

console.log('\nTo run other examples, uncomment the corresponding line in examples.js');
