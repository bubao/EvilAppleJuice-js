#!/usr/bin/env node

const inquirer = require('inquirer');
const chalk = require('chalk');
const figlet = require('figlet');
const evilAppleJuice = require('./main-enhanced');

// 显示欢迎横幅
const showBanner = () => {
  console.log(
    chalk.cyan(
      figlet.textSync('EvilApple', {
        font: 'Standard',
        horizontalLayout: 'default',
        verticalLayout: 'default',
      })
    )
  );
  console.log(chalk.gray('Apple BLE Proximity Pairing Message Spoofing Tool\n'));
  
  // 显示平台警告
  if (process.platform === 'darwin') {
    console.log(chalk.bgYellow.black(' ⚠️  macOS Platform Warning '));
    console.log(chalk.yellow('Custom EIR broadcasting is NOT supported on macOS'));
    console.log(chalk.yellow('Apple pairing spoofing will NOT work'));
    console.log(chalk.gray('This is a system limitation, not a bug.\n'));
  }
};

// 主菜单
const showMainMenu = async () => {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: chalk.yellow('请选择操作:'),
      choices: [
        {
          name: chalk.green('🚀 启动单设备模式'),
          value: 'start_single',
        },
        {
          name: chalk.blue('🎲 启动随机模式'),
          value: 'start_random',
        },
        {
          name: chalk.cyan('ℹ️  查看设备信息'),
          value: 'info',
        },
        {
          name: chalk.magenta('⚙️  配置参数'),
          value: 'config',
        },
        {
          name: chalk.red('❌ 退出'),
          value: 'exit',
        },
      ],
    },
  ]);

  return action;
};

// 显示设备信息
const showDeviceInfo = () => {
  const devices = evilAppleJuice.getAvailableDevices();
  
  console.log('\n' + chalk.bold.yellow('=== 可用设备信息 ===\n'));
  console.log(chalk.cyan('长距离设备 (AirPods/Beats):'), chalk.white(devices.totalDevices));
  console.log(chalk.cyan('短距离设备 (Apple TV/HomePod):'), chalk.white(devices.totalShortDevices));
  console.log(chalk.cyan('总计:'), chalk.green(devices.totalDevices + devices.totalShortDevices));
  console.log('\n' + chalk.gray('按回车键返回主菜单...'));
  
  return new Promise((resolve) => {
    // 使用 readline 等待用户输入
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    
    rl.question('', () => {
      rl.close();
      resolve();
    });
  });
};

// 选择设备
const selectDevice = async () => {
  const devices = evilAppleJuice.getAvailableDevices();
  
  const { deviceName } = await inquirer.prompt([
    {
      type: 'list',
      name: 'deviceName',
      message: chalk.yellow('选择要模拟的设备:'),
      choices: devices.devices.map(d => ({
        name: d.name,
        value: d.name,
      })),
      pageSize: 15,
    },
  ]);
  
  return deviceName;
};

// 配置参数
const configureParams = async () => {
  const answers = await inquirer.prompt([
    {
      type: 'number',
      name: 'delayMilliseconds',
      message: chalk.yellow('广播持续时间 (毫秒):'),
      default: 3000,
      validate: (value) => {
        if (value < 100) return '最小值为 100ms';
        if (value > 60000) return '最大值为 60000ms';
        return true;
      },
    },
    {
      type: 'number',
      name: 'stopDelayMilliseconds',
      message: chalk.yellow('停止间隔时间 (毫秒):'),
      default: 1000,
      validate: (value) => {
        if (value < 100) return '最小值为 100ms';
        if (value > 30000) return '最大值为 30000ms';
        return true;
      },
    },
  ]);

  return answers;
};

// 启动单设备模式
const startSingleMode = async (config) => {
  try {
    // 选择设备
    const deviceName = await selectDevice();
    
    console.log('\n' + chalk.bold.green('正在启动单设备模式...\n'));
    console.log(chalk.cyan('设备:'), chalk.white(deviceName));
    console.log(chalk.cyan('广播持续时间:'), chalk.white(`${config.delayMilliseconds}ms`));
    console.log(chalk.cyan('停止间隔:'), chalk.white(`${config.stopDelayMilliseconds}ms`));
    console.log('');

    // 检查蓝牙状态
    const status = evilAppleJuice.getStatus();
    if (status.bluetoothState !== 'poweredOn') {
      console.log(chalk.red('\n✗ 蓝牙未就绪！当前状态:'), chalk.white(status.bluetoothState));
      console.log(chalk.yellow('\n请确保：'));
      console.log(chalk.yellow('1. 蓝牙已开启'));
      console.log(chalk.yellow('2. 系统已授予蓝牙权限'));
      console.log(chalk.yellow('3. 稍等片刻让蓝牙初始化\n'));
      return; // 返回菜单
    }

    // 启动服务
    await evilAppleJuice.startSingleMode(deviceName, config);
    
    console.log(chalk.bgGreen.black(' ✓ 服务已启动 '));
    console.log(chalk.gray('\n提示: 按 Ctrl+C 停止服务\n'));

    // 显示实时状态
    const statusInterval = setInterval(() => {
      const status = evilAppleJuice.getStatus();
      if (status.isRunning) {
        process.stdout.write(`\r${chalk.cyan('广播次数:')} ${chalk.white(status.broadcastCount)} | ${chalk.cyan('运行时间:')} ${chalk.white(Math.floor((Date.now() - status.startTime) / 1000))}s`);
      }
    }, 1000);

    // 保持进程运行，等待 Ctrl+C
    return new Promise((resolve) => {
      // 临时覆盖全局处理器
      const originalListeners = process.listeners('SIGINT');
      process.removeAllListeners('SIGINT');
      
      const handleExit = async () => {
        clearInterval(statusInterval);
        console.log('\n\n' + chalk.yellow('正在停止服务...'));
        
        try {
          await evilAppleJuice.stop();
          console.log(chalk.green('服务已停止\n'));
        } catch (err) {
          console.log(chalk.red('停止服务时出错:'), err.message);
        }
        
        // 恢复原始监听器
        originalListeners.forEach(listener => {
          process.on('SIGINT', listener);
        });
        
        resolve();
      };

      process.once('SIGINT', handleExit);
    });
  } catch (error) {
    console.error(chalk.red('\n✗ 启动失败:'), error.message);
    throw error;
  }
};

// 启动随机模式
const startRandomMode = async (config) => {
  try {
    console.log('\n' + chalk.bold.green('正在启动随机模式...\n'));
    console.log(chalk.cyan('广播持续时间:'), chalk.white(`${config.delayMilliseconds}ms`));
    console.log(chalk.cyan('停止间隔:'), chalk.white(`${config.stopDelayMilliseconds}ms`));
    console.log(chalk.cyan('模式:'), chalk.white('随机切换设备'));
    console.log('');

    // 检查蓝牙状态
    const status = evilAppleJuice.getStatus();
    if (status.bluetoothState !== 'poweredOn') {
      console.log(chalk.red('\n✗ 蓝牙未就绪！当前状态:'), chalk.white(status.bluetoothState));
      console.log(chalk.yellow('\n请确保：'));
      console.log(chalk.yellow('1. 蓝牙已开启'));
      console.log(chalk.yellow('2. 系统已授予蓝牙权限'));
      console.log(chalk.yellow('3. 稍等片刻让蓝牙初始化\n'));
      return; // 返回菜单
    }

    // 启动服务
    await evilAppleJuice.startRandomMode(config);
    
    console.log(chalk.bgGreen.black(' ✓ 服务已启动 '));
    console.log(chalk.gray('\n提示: 按 Ctrl+C 停止服务\n'));

    // 显示实时状态
    const statusInterval = setInterval(() => {
      const status = evilAppleJuice.getStatus();
      if (status.isRunning) {
        const currentDevice = status.currentDeviceData ? status.currentDeviceData.name : 'N/A';
        process.stdout.write(`\r${chalk.cyan('广播次数:')} ${chalk.white(status.broadcastCount)} | ${chalk.cyan('当前设备:')} ${chalk.white(currentDevice)} | ${chalk.cyan('运行时间:')} ${chalk.white(Math.floor((Date.now() - status.startTime) / 1000))}s`);
      }
    }, 1000);

    // 保持进程运行，等待 Ctrl+C
    return new Promise((resolve) => {
      // 临时覆盖全局处理器
      const originalListeners = process.listeners('SIGINT');
      process.removeAllListeners('SIGINT');
      
      const handleExit = async () => {
        clearInterval(statusInterval);
        console.log('\n\n' + chalk.yellow('正在停止服务...'));
        
        try {
          await evilAppleJuice.stop();
          console.log(chalk.green('服务已停止\n'));
        } catch (err) {
          console.log(chalk.red('停止服务时出错:'), err.message);
        }
        
        // 恢复原始监听器
        originalListeners.forEach(listener => {
          process.on('SIGINT', listener);
        });
        
        resolve();
      };

      process.once('SIGINT', handleExit);
    });
  } catch (error) {
    console.error(chalk.red('\n✗ 启动失败:'), error.message);
    throw error;
  }
};

// 主函数
const main = async () => {
  showBanner();

  // 默认配置
  let config = {
    delayMilliseconds: 3000,
    stopDelayMilliseconds: 1000,
  };

  // 全局信号处理（用于菜单状态）
  const handleMenuExit = () => {
    console.log('\n' + chalk.green('再见! 👋\n'));
    process.exit(0);
  };

  // 只在启动时添加一次
  process.on('SIGINT', handleMenuExit);
  process.on('SIGTERM', handleMenuExit);

  try {
    while (true) {
      const action = await showMainMenu();

      switch (action) {
        case 'start_single':
          await startSingleMode(config);
          break;

        case 'start_random':
          await startRandomMode(config);
          break;

        case 'info':
          await showDeviceInfo();
          break;

        case 'config':
          config = await configureParams();
          console.log('\n' + chalk.bold.cyan('=== 配置已保存 ==='));
          console.log(chalk.cyan('广播持续时间:'), chalk.white(`${config.delayMilliseconds}ms`));
          console.log(chalk.cyan('停止间隔时间:'), chalk.white(`${config.stopDelayMilliseconds}ms`));
          console.log('');
          break;

        case 'exit':
          console.log('\n' + chalk.green('再见! 👋\n'));
          process.exit(0);
          break;
      }
    }
  } catch (error) {
    console.error(chalk.red('\n错误:'), error.message);
    process.exit(1);
  }
};

// 运行主函数
main();
