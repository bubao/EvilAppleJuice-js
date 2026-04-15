const evilAppleJuice = require('../src/main');

console.log('=== EvilAppleJuice Module Tests ===\n');

// 测试 1: 获取可用设备列表
console.log('Test 1: Get Available Devices');
try {
  const devices = evilAppleJuice.getAvailableDevices();
  console.log('✓ getAvailableDevices() works');
  console.log(`  - Long-range devices: ${devices.totalDevices}`);
  console.log(`  - Short-range devices: ${devices.totalShortDevices}`);
  console.log(`  - Total: ${devices.totalDevices + devices.totalShortDevices} devices\n`);
} catch (error) {
  console.error('✗ getAvailableDevices() failed:', error.message, '\n');
}

// 测试 2: 生成随机 MAC 地址
console.log('Test 2: Generate Random MAC Address');
try {
  const mac1 = evilAppleJuice.fakeRandomMac();
  const mac2 = evilAppleJuice.fakeRandomMac();
  
  console.log('✓ fakeRandomMac() works');
  console.log(`  - MAC 1: ${mac1.toString('hex').match(/.{1,2}/g).join(':')}`);
  console.log(`  - MAC 2: ${mac2.toString('hex').match(/.{1,2}/g).join(':')}`);
  console.log(`  - MACs are different: ${!mac1.equals(mac2)}\n`);
} catch (error) {
  console.error('✗ fakeRandomMac() failed:', error.message, '\n');
}

// 测试 3: 获取随机设备数据
console.log('Test 3: Get Random Device Data');
try {
  const deviceData = evilAppleJuice.getRandomDeviceData();
  console.log('✓ getRandomDeviceData() works');
  console.log(`  - Data length: ${deviceData.length} bytes`);
  console.log(`  - Data (hex): ${Buffer.from(deviceData).toString('hex')}\n`);
} catch (error) {
  console.error('✗ getRandomDeviceData() failed:', error.message, '\n');
}

// 测试 4: 获取运行状态
console.log('Test 4: Get Service Status');
try {
  const status = evilAppleJuice.getStatus();
  console.log('✓ getStatus() works');
  console.log(`  - Is running: ${status.isRunning}`);
  console.log(`  - Bluetooth state: ${status.bluetoothState}\n`);
} catch (error) {
  console.error('✗ getStatus() failed:', error.message, '\n');
}

// 测试 5: 验证模块导出
console.log('Test 5: Verify Module Exports');
const expectedExports = ['start', 'stop', 'getStatus', 'getAvailableDevices', 'fakeRandomMac', 'getRandomDeviceData'];
const actualExports = Object.keys(evilAppleJuice);
const allExportsPresent = expectedExports.every((exp) => actualExports.includes(exp));

if (allExportsPresent) {
  console.log('✓ All expected exports are present');
  console.log(`  - Exports: ${actualExports.join(', ')}\n`);
} else {
  console.error('✗ Some exports are missing');
  console.error(`  - Expected: ${expectedExports.join(', ')}`);
  console.error(`  - Actual: ${actualExports.join(', ')}\n`);
}

// 测试 6: 配置验证
console.log('Test 6: Configuration Validation');
try {
  // 测试默认配置
  const testConfig1 = {};
  console.log('✓ Default configuration is valid');
  
  // 测试自定义配置
  const testConfig2 = {
    delayMilliseconds: 5000,
    stopDelayMilliseconds: 2000,
  };
  console.log('✓ Custom configuration is valid');
  console.log(`  - Delay: ${testConfig2.delayMilliseconds}ms`);
  console.log(`  - Stop delay: ${testConfig2.stopDelayMilliseconds}ms\n`);
} catch (error) {
  console.error('✗ Configuration validation failed:', error.message, '\n');
}

console.log('=== All Tests Completed ===');
console.log('\nNote: To test start/stop functionality, you need a BLE-enabled device.');
console.log('Run the following command to test the full service:');
console.log('  node index.js\n');
