const bleno = require('@stoprocent/bleno');

const devices = require('./devices');
const deviceList = [devices.SHORT_DEVICES, devices.DEVICES];

// 默认配置
const DEFAULT_CONFIG = {
  delayMilliseconds: 3000,
  stopDelayMilliseconds: 1000,
};

let isRunning = false;
let advertisingTimeout = null;
let stopTimeout = null;

/**
 * 生成随机 MAC 地址
 * @returns {Buffer} 6字节的 MAC 地址
 */
const fakeRandomMac = () => {
  const dummyAddr = Buffer.alloc(6);
  for (let i = 0; i < 6; i++) {
    dummyAddr[i] = Math.floor(Math.random() * 256);
    if (i === 0) {
      dummyAddr[i] |= 0xF0;
    }
  }
  return dummyAddr;
};

/**
 * 获取随机设备数据
 * @returns {Array} 设备广播数据数组
 */
const getRandomDeviceData = () => {
  const listIndex = Math.floor(Math.random() * deviceList.length);
  const deviceIndex = Math.floor(Math.random() * deviceList[listIndex].length);
  return deviceList[listIndex][deviceIndex];
};

/**
 * 开始广播
 * @param {Object} config - 配置对象
 * @param {number} config.delayMilliseconds - 广播持续时间（毫秒）
 * @param {number} config.stopDelayMilliseconds - 停止间隔时间（毫秒）
 */
const startAdvertising = (config = {}) => {
  const { delayMilliseconds, stopDelayMilliseconds } = { ...DEFAULT_CONFIG, ...config };
  
  if (!isRunning) {
    console.warn('Advertising is not running. Call start() first.');
    return;
  }

  const dummyAddr = fakeRandomMac();
  const advertisementData = Buffer.from(getRandomDeviceData());
  console.log('Advertisement Data:', advertisementData);
  
  // macOS 不支持 startAdvertisingWithEIRData，需要使用替代方案
  const platform = process.platform;
  
  if (platform === 'darwin') {
    // macOS: 使用 iBeacon 格式或其他兼容方式
    console.warn('Warning: macOS does not support startAdvertisingWithEIRData');
    console.warn('Using alternative advertising method...');
    
    // 尝试使用标准的 startAdvertising（虽然效果可能不同）
    bleno.startAdvertising('Apple Device', [], (err) => {
      if (err) {
        console.error('startAdvertising error:', err);
      }
    });
  } else {
    // Linux/Windows: 使用 EIR 数据
    bleno.startAdvertisingWithEIRData(advertisementData, dummyAddr, (err) => {
      if (err) {
        console.error('startAdvertisingWithEIRData error:', err);
      }
    });
  }

  console.log('Sending Advertisement...');

  // 设置停止广播的定时器
  advertisingTimeout = setTimeout(() => {
    bleno.stopAdvertising();
    
    // 如果仍在运行状态，则继续下一次广播
    if (isRunning) {
      stopTimeout = setTimeout(() => {
        startAdvertising({ delayMilliseconds, stopDelayMilliseconds });
      }, stopDelayMilliseconds);
    }
  }, delayMilliseconds);
};

/**
 * 启动 BLE 广告广播服务
 * @param {Object} options - 启动选项
 * @param {number} options.delayMilliseconds - 广播持续时间（毫秒）
 * @param {number} options.stopDelayMilliseconds - 停止间隔时间（毫秒）
 * @param {boolean} options.verbose - 是否显示详细日志
 * @returns {Promise} 返回 Promise 对象
 */
const start = (options = {}) => {
  return new Promise((resolve, reject) => {
    if (isRunning) {
      console.warn('Advertising is already running');
      resolve();
      return;
    }

    const config = {
      delayMilliseconds: options.delayMilliseconds || DEFAULT_CONFIG.delayMilliseconds,
      stopDelayMilliseconds: options.stopDelayMilliseconds || DEFAULT_CONFIG.stopDelayMilliseconds,
    };

    if (options.verbose !== false) {
      console.log('Initializing BLE advertising service...');
    }

    // 设置事件监听器
    const stateChangeHandler = (state) => {
      if (state === 'poweredOn') {
        if (options.verbose !== false) {
          console.log('Bluetooth powered on, starting advertising...');
        }
        isRunning = true;
        startAdvertising(config);
        resolve();
      } else {
        if (options.verbose !== false) {
          console.log(`Bluetooth state changed to: ${state}`);
        }
        if (state !== 'poweredOn') {
          isRunning = false;
        }
      }
    };

    const advertisingStartHandler = (error) => {
      if (!error) {
        if (options.verbose !== false) {
          console.log('Advertising started successfully');
        }
      } else {
        console.error('Error starting advertising:', error);
        reject(error);
      }
    };

    const advertisingStopHandler = () => {
      if (options.verbose !== false) {
        console.log('Advertising stopped');
      }
    };

    // 注册事件监听器
    bleno.on('stateChange', stateChangeHandler);
    bleno.on('advertisingStart', advertisingStartHandler);
    bleno.on('advertisingStop', advertisingStopHandler);

    // 检查当前蓝牙状态
    const currentState = bleno.state;
    if (currentState === 'poweredOn') {
      isRunning = true;
      startAdvertising(config);
      resolve();
    }
  });
};

/**
 * 停止 BLE 广告广播服务
 * @returns {Promise} 返回 Promise 对象
 */
const stop = () => {
  return new Promise((resolve) => {
    if (!isRunning) {
      console.warn('Advertising is not running');
      resolve();
      return;
    }

    isRunning = false;
    
    // 清除所有定时器
    if (advertisingTimeout) {
      clearTimeout(advertisingTimeout);
      advertisingTimeout = null;
    }
    if (stopTimeout) {
      clearTimeout(stopTimeout);
      stopTimeout = null;
    }

    bleno.stopAdvertising();
    console.log('BLE advertising service stopped');
    resolve();
  });
};

/**
 * 获取当前运行状态
 * @returns {boolean} 是否正在运行
 */
const getStatus = () => {
  return {
    isRunning,
    bluetoothState: bleno.state,
  };
};

/**
 * 获取可用的设备列表
 * @returns {Object} 包含 SHORT_DEVICES 和 DEVICES 的对象
 */
const getAvailableDevices = () => {
  return {
    shortDevices: devices.SHORT_DEVICES,
    devices: devices.DEVICES,
    totalShortDevices: devices.SHORT_DEVICES.length,
    totalDevices: devices.DEVICES.length,
  };
};

// 导出模块
module.exports = {
  start,
  stop,
  getStatus,
  getAvailableDevices,
  fakeRandomMac,
  getRandomDeviceData,
};