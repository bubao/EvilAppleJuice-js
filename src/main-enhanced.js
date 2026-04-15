const bleno = require('@stoprocent/bleno');
const devices = require('./devices');
const logger = require('./logger');
const stateManager = require('./stateManager');

const deviceList = [devices.SHORT_DEVICES, devices.DEVICES];
const deviceNames = [
  // DEVICES (long-range)
  'AirPods', 'AirPods Pro', 'AirPods Max', 'AirPods Gen 2', 'AirPods Gen 3',
  'AirPods Pro Gen 2', 'Power Beats', 'Power Beats Pro', 'Beats Solo Pro',
  'Beats Studio Buds', 'Beats Flex', 'Beats X', 'Beats Solo 3', 'Beats Studio 3',
  'Beats Studio Pro', 'Beats Fit Pro', 'Beats Studio Buds Plus',
  // SHORT_DEVICES
  'AppleTV Setup', 'AppleTV Pair', 'AppleTV New User', 'AppleTV AppleID Setup',
  'AppleTV Wireless Audio Sync', 'AppleTV Homekit Setup', 'AppleTV Keyboard Setup',
  'AppleTV Connecting', 'Homepod Setup', 'Setup New Phone', 'Transfer Number', 'TV Color Balance'
];

let advertisingTimeout = null;
let stopTimeout = null;
let randomInterval = null;
let macosWarningShown = false; // 标记是否已显示过 macOS 警告

/**
 * 生成随机 MAC 地址
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
 */
const getRandomDeviceData = () => {
  const listIndex = Math.floor(Math.random() * deviceList.length);
  const deviceIndex = Math.floor(Math.random() * deviceList[listIndex].length);
  return {
    data: deviceList[listIndex][deviceIndex],
    name: deviceNames[listIndex === 0 ? deviceIndex + 17 : deviceIndex]
  };
};

/**
 * 获取指定设备数据
 */
const getDeviceDataByName = (deviceName) => {
  const index = deviceNames.indexOf(deviceName);
  if (index === -1) {
    return null;
  }
  
  const listIndex = index < 17 ? 1 : 0; // SHORT_DEVICES or DEVICES
  const deviceIndex = index < 17 ? index : index - 17;
  
  return {
    data: deviceList[listIndex][deviceIndex],
    name: deviceName
  };
};

/**
 * 执行单次广播
 */
const performBroadcast = (deviceData, config) => {
  // 检查是否仍在运行
  if (!stateManager.get('isRunning')) {
    return;
  }

  // 检查蓝牙状态
  if (stateManager.get('bluetoothState') !== 'poweredOn') {
    logger.warn(`Bluetooth not ready, state: ${stateManager.get('bluetoothState')}`);
    return;
  }

  const dummyAddr = fakeRandomMac();
  const advertisementData = Buffer.from(deviceData.data);
  
  stateManager.update({ currentDeviceData: deviceData });
  logger.info(`Broadcasting: ${deviceData.name}`);
  
  const platform = process.platform;
  
  if (platform === 'darwin') {
    // 只显示一次 macOS 警告
    if (!macosWarningShown) {
      logger.warn('macOS detected: Using standard advertising mode');
      logger.warn('Note: Custom EIR data broadcasting is not supported on macOS');
      logger.warn('This is a system limitation, not a bug.');
      macosWarningShown = true;
    }
    
    bleno.startAdvertising(deviceData.name || 'Apple Device', [], (err) => {
      if (err) {
        logger.error(`Advertising error: ${err.message}`);
      }
    });
  } else {
    bleno.startAdvertisingWithEIRData(advertisementData, dummyAddr, (err) => {
      if (err) {
        logger.error(`EIR Advertising error: ${err.message}`);
      }
    });
  }

  stateManager.incrementBroadcastCount();

  // 停止广播
  setTimeout(() => {
    // 再次检查是否仍在运行
    if (!stateManager.get('isRunning')) {
      return;
    }
    
    try {
      bleno.stopAdvertising();
    } catch (err) {
      logger.warn(`Stop advertising warning: ${err.message}`);
    }
    
    if (stateManager.get('isRunning')) {
      setTimeout(() => {
        if (!stateManager.get('isRunning')) {
          return;
        }
        
        if (stateManager.get('mode') === 'single' && deviceData) {
          // 单设备模式：继续广播同一设备
          performBroadcast(deviceData, config);
        } else if (stateManager.get('mode') === 'random') {
          // 随机模式已在 interval 中处理
        }
      }, config.stopDelayMilliseconds);
    }
  }, config.delayMilliseconds);
};

/**
 * 模式1: 选择设备后持续发送
 */
const startSingleMode = (deviceName, config = {}) => {
  const fullConfig = { ...stateManager.get('config'), ...config };
  const deviceData = getDeviceDataByName(deviceName);
  
  if (!deviceData) {
    logger.error(`Device not found: ${deviceName}`);
    throw new Error(`Device not found: ${deviceName}`);
  }

  logger.success(`Starting single mode: ${deviceName}`);
  stateManager.update({
    isRunning: true,
    mode: 'single',
    selectedDevice: deviceName,
    startTime: Date.now(),
    config: fullConfig
  });

  performBroadcast(deviceData, fullConfig);
};

/**
 * 模式2: 间隔随机发送
 */
const startRandomMode = (config = {}) => {
  const fullConfig = { ...stateManager.get('config'), ...config };
  
  logger.success('Starting random mode');
  stateManager.update({
    isRunning: true,
    mode: 'random',
    selectedDevice: null,
    startTime: Date.now(),
    config: fullConfig
  });

  // 立即执行一次
  const deviceData = getRandomDeviceData();
  performBroadcast(deviceData, fullConfig);

  // 设置随机间隔
  const intervalTime = fullConfig.delayMilliseconds + fullConfig.stopDelayMilliseconds;
  randomInterval = setInterval(() => {
    if (stateManager.get('isRunning') && stateManager.get('bluetoothState') === 'poweredOn') {
      const randomDevice = getRandomDeviceData();
      performBroadcast(randomDevice, fullConfig);
    }
  }, intervalTime);
};

/**
 * 启动服务（兼容旧API）
 */
const start = (options = {}) => {
  return new Promise((resolve, reject) => {
    if (stateManager.get('isRunning')) {
      logger.warn('Service is already running');
      resolve();
      return;
    }

    logger.info('Initializing BLE service...');
    
    const stateChangeHandler = (state) => {
      stateManager.update({ bluetoothState: state });
      
      if (state === 'poweredOn') {
        logger.success('Bluetooth powered on');
        
        // 默认使用随机模式
        const mode = options.mode || 'random';
        if (mode === 'single' && options.deviceName) {
          startSingleMode(options.deviceName, options);
        } else {
          startRandomMode(options);
        }
        
        resolve();
      } else {
        logger.warn(`Bluetooth state: ${state}`);
      }
    };

    bleno.on('stateChange', stateChangeHandler);

    // 检查当前状态
    if (bleno.state === 'poweredOn') {
      stateManager.update({ bluetoothState: 'poweredOn' });
      const mode = options.mode || 'random';
      if (mode === 'single' && options.deviceName) {
        startSingleMode(options.deviceName, options);
      } else {
        startRandomMode(options);
      }
      resolve();
    }
  });
};

/**
 * 停止服务
 */
const stop = () => {
  return new Promise((resolve) => {
    if (!stateManager.get('isRunning')) {
      logger.warn('Service is not running');
      resolve();
      return;
    }

    logger.info('Stopping service...');
    
    // 立即设置状态为未运行，阻止新的广播
    stateManager.update({ isRunning: false, mode: null });

    // 清除所有定时器
    if (advertisingTimeout) {
      clearTimeout(advertisingTimeout);
      advertisingTimeout = null;
    }
    if (stopTimeout) {
      clearTimeout(stopTimeout);
      stopTimeout = null;
    }
    if (randomInterval) {
      clearInterval(randomInterval);
      randomInterval = null;
    }

    // 尝试停止广播，忽略错误
    try {
      bleno.stopAdvertising();
    } catch (err) {
      logger.warn(`Stop advertising warning (ignored): ${err.message}`);
    }
    
    // 重置 macOS 警告标志，下次启动时可以再次显示
    macosWarningShown = false;
    
    logger.success('Service stopped');
    resolve();
  });
};

/**
 * 获取状态
 */
const getStatus = () => {
  return {
    ...stateManager.getState(),
    uptime: stateManager.getFormattedUptime(),
  };
};

/**
 * 获取可用设备列表
 */
const getAvailableDevices = () => {
  return {
    devices: deviceNames.map((name, index) => ({
      name,
      type: index < 17 ? 'short-range' : 'long-range',
      index
    })),
    totalShortDevices: 12,
    totalDevices: 17,
  };
};

// 导出模块
module.exports = {
  start,
  stop,
  getStatus,
  getAvailableDevices,
  startSingleMode,
  startRandomMode,
  fakeRandomMac,
  getRandomDeviceData,
  getDeviceDataByName,
  logger,
  stateManager,
};
