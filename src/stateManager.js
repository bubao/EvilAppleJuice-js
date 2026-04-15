/**
 * 状态管理器 - 集中管理应用状态
 */

class StateManager {
  constructor() {
    this.state = {
      // 服务状态
      isRunning: false,
      bluetoothState: 'unknown',
      
      // 当前模式
      mode: null, // 'single', 'random', null
      
      // 设备相关
      selectedDevice: null,
      currentDeviceData: null,
      
      // 统计信息
      broadcastCount: 0,
      startTime: null,
      lastBroadcastTime: null,
      
      // 配置
      config: {
        delayMilliseconds: 3000,
        stopDelayMilliseconds: 1000,
      },
    };

    this.listeners = [];
  }

  /**
   * 更新状态
   */
  update(updates) {
    const oldState = { ...this.state };
    this.state = { ...this.state, ...updates };
    
    // 通知监听器
    this.notifyListeners(this.state, oldState);
  }

  /**
   * 获取状态
   */
  getState() {
    return { ...this.state };
  }

  /**
   * 获取特定字段
   */
  get(key) {
    return this.state[key];
  }

  /**
   * 添加监听器
   */
  onChange(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  /**
   * 通知所有监听器
   */
  notifyListeners(newState, oldState) {
    this.listeners.forEach(callback => {
      try {
        callback(newState, oldState);
      } catch (err) {
        console.error('State listener error:', err);
      }
    });
  }

  /**
   * 重置状态
   */
  reset() {
    this.state = {
      isRunning: false,
      bluetoothState: 'unknown',
      mode: null,
      selectedDevice: null,
      currentDeviceData: null,
      broadcastCount: 0,
      startTime: null,
      lastBroadcastTime: null,
      config: {
        delayMilliseconds: 3000,
        stopDelayMilliseconds: 1000,
      },
    };
    
    this.notifyListeners(this.state, {});
  }

  /**
   * 增加广播计数
   */
  incrementBroadcastCount() {
    this.state.broadcastCount++;
    this.state.lastBroadcastTime = new Date();
    this.notifyListeners({ ...this.state }, { ...this.state, broadcastCount: this.state.broadcastCount - 1 });
  }

  /**
   * 计算运行时长
   */
  getUptime() {
    if (!this.state.startTime || !this.state.isRunning) {
      return 0;
    }
    return Date.now() - this.state.startTime;
  }

  /**
   * 格式化运行时长
   */
  getFormattedUptime() {
    const uptime = this.getUptime();
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}

// 单例实例
const stateManager = new StateManager();

module.exports = stateManager;
