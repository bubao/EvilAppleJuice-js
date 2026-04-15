/**
 * 日志管理器 - 分离状态和日志
 */

class LogManager {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000;
    this.listeners = [];
    this.silent = false; // 静默模式
  }

  /**
   * 添加日志
   */
  log(message, type = 'info') {
    const entry = {
      timestamp: new Date(),
      message,
      type, // 'info', 'warning', 'error', 'success'
    };

    this.logs.push(entry);

    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // 通知监听器
    this.notifyListeners(entry);

    // 控制台输出（如果未静默）
    this.consoleOutput(entry);
  }

  /**
   * 信息日志
   */
  info(message) {
    this.log(message, 'info');
  }

  /**
   * 警告日志
   */
  warn(message) {
    this.log(message, 'warning');
  }

  /**
   * 错误日志
   */
  error(message) {
    this.log(message, 'error');
  }

  /**
   * 成功日志
   */
  success(message) {
    this.log(message, 'success');
  }

  /**
   * 获取所有日志
   */
  getLogs() {
    return this.logs;
  }

  /**
   * 获取最近的 N 条日志
   */
  getRecentLogs(count = 50) {
    return this.logs.slice(-count);
  }

  /**
   * 清空日志
   */
  clear() {
    this.logs = [];
    this.notifyListeners({ type: 'clear' });
  }

  /**
   * 添加监听器
   */
  onLog(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  /**
   * 通知所有监听器
   */
  notifyListeners(entry) {
    this.listeners.forEach(callback => {
      try {
        callback(entry);
      } catch (err) {
        console.error('Log listener error:', err);
      }
    });
  }

  /**
   * 控制台输出
   */
  consoleOutput(entry) {
    // 如果处于静默模式，不输出到控制台
    if (this.silent) {
      return;
    }

    const prefix = {
      info: 'ℹ️ ',
      warning: '⚠️ ',
      error: '❌',
      success: '✅',
    };

    const colors = {
      info: '\x1b[36m',    // cyan
      warning: '\x1b[33m', // yellow
      error: '\x1b[31m',   // red
      success: '\x1b[32m', // green
    };

    const reset = '\x1b[0m';
    const time = entry.timestamp.toLocaleTimeString();
    
    console.log(`${colors[entry.type]}[${time}] ${prefix[entry.type]} ${entry.message}${reset}`);
  }
}

// 单例实例
const logger = new LogManager();

module.exports = logger;
