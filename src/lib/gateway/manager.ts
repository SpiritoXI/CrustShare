/**
 * 网关管理器
 * 管理多个第三方下载网关，实现智能调度和健康检测
 */

import { GatewayConfig, GatewayState, GatewayStatus, GatewayType, GatewayHealthCheckResult, GatewaySelectorOptions } from './types';
import { cache, CacheKeys, CacheTTL } from '@/lib/cache';

export class GatewayManager {
  private gateways: Map<string, GatewayConfig>;
  private states: Map<string, GatewayState>;
  private checkInterval: NodeJS.Timeout | null = null;
  private checkFrequency: number; // 检测频率（毫秒）
  private isChecking: boolean = false;

  constructor(checkFrequency: number = 20000) {
    this.gateways = new Map();
    this.states = new Map();
    this.checkFrequency = checkFrequency;
  }

  /**
   * 添加网关
   */
  addGateway(config: GatewayConfig): void {
    this.gateways.set(config.id, config);

    // 初始化状态
    this.states.set(config.id, {
      id: config.id,
      status: GatewayStatus.AVAILABLE,
      lastCheckTime: new Date(),
      responseTime: 0,
      successRate: 1.0,
      totalChecks: 0,
      successChecks: 0,
      failChecks: 0,
      consecutiveFails: 0,
      consecutiveSuccesses: 0,
    });

    console.log(`[GatewayManager] 添加网关: ${config.name} (${config.url})`);
  }

  /**
   * 移除网关
   */
  removeGateway(id: string): void {
    this.gateways.delete(id);
    this.states.delete(id);
    console.log(`[GatewayManager] 移除网关: ${id}`);
  }

  /**
   * 更新网关配置
   */
  updateGateway(id: string, updates: Partial<GatewayConfig>): void {
    const config = this.gateways.get(id);
    if (config) {
      const updated = { ...config, ...updates };
      this.gateways.set(id, updated);
      console.log(`[GatewayManager] 更新网关: ${id}`, updates);
    }
  }

  /**
   * 获取所有网关配置
   */
  getAllGateways(): GatewayConfig[] {
    return Array.from(this.gateways.values());
  }

  /**
   * 获取启用的网关
   */
  getEnabledGateways(): GatewayConfig[] {
    return this.getAllGateways().filter(g => g.enabled);
  }

  /**
   * 获取网关配置
   */
  getGateway(id: string): GatewayConfig | undefined {
    return this.gateways.get(id);
  }

  /**
   * 获取网关状态
   */
  getState(id: string): GatewayState | undefined {
    return this.states.get(id);
  }

  /**
   * 获取所有状态
   */
  getAllStates(): GatewayState[] {
    return Array.from(this.states.values());
  }

  /**
   * 获取可用网关
   */
  getAvailableGateways(): GatewayConfig[] {
    return this.getEnabledGateways().filter(g => {
      const state = this.states.get(g.id);
      return state?.status === GatewayStatus.AVAILABLE;
    });
  }

  /**
   * 智能选择最优网关
   */
  selectBestGateway(options?: GatewaySelectorOptions): GatewayConfig | null {
    let candidates = this.getAvailableGateways();

    // 应用筛选条件
    if (options?.excludeIds?.length) {
      candidates = candidates.filter(g => !options.excludeIds!.includes(g.id));
    }

    if (options?.requireAuth) {
      candidates = candidates.filter(g => g.authRequired);
    }

    if (options?.maxResponseTime) {
      candidates = candidates.filter(g => {
        const state = this.states.get(g.id);
        return state !== undefined && state.responseTime <= options.maxResponseTime!;
      });
    }

    if (options?.minSuccessRate) {
      candidates = candidates.filter(g => {
        const state = this.states.get(g.id);
        return state !== undefined && state.successRate >= options.minSuccessRate!;
      });
    }

    if (candidates.length === 0) {
      console.warn('[GatewayManager] 没有可用的网关');
      return null;
    }

    // 按优先级排序（数字越小优先级越高）
    candidates.sort((a, b) => a.priority - b.priority);

    // 进一步按成功率和响应时间排序
    candidates.sort((a, b) => {
      const stateA = this.states.get(a.id)!;
      const stateB = this.states.get(b.id)!;

      // 优先选择成功率高的
      if (Math.abs(stateA.successRate - stateB.successRate) > 0.1) {
        return stateB.successRate - stateA.successRate;
      }

      // 成功率相近时，选择响应时间短的
      return stateA.responseTime - stateB.responseTime;
    });

    return candidates[0];
  }

  /**
   * 开始健康检测
   */
  startHealthCheck(): void {
    if (this.checkInterval) {
      console.log('[GatewayManager] 健康检测已在运行');
      return;
    }

    console.log(`[GatewayManager] 启动健康检测，频率: ${this.checkFrequency}ms`);

    this.checkInterval = setInterval(() => {
      this.checkAllGateways();
    }, this.checkFrequency);

    // 立即执行一次检测
    this.checkAllGateways();
  }

  /**
   * 停止健康检测
   */
  stopHealthCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('[GatewayManager] 停止健康检测');
    }
  }

  /**
   * 检测所有网关
   */
  private async checkAllGateways(): Promise<void> {
    if (this.isChecking) {
      console.log('[GatewayManager] 检测正在进行中，跳过本次');
      return;
    }

    this.isChecking = true;
    const gateways = this.getEnabledGateways();

    console.log(`[GatewayManager] 开始检测 ${gateways.length} 个网关`);

    const promises = gateways.map(gateway => this.checkGateway(gateway.id));
    const results = await Promise.allSettled(promises);

    // 更新缓存
    this.cacheStates();

    this.isChecking = false;
  }

  /**
   * 检测单个网关
   */
  private async checkGateway(id: string): Promise<GatewayHealthCheckResult> {
    const config = this.gateways.get(id);
    if (!config) {
      throw new Error(`网关 ${id} 不存在`);
    }

    const startTime = Date.now();
    let status: GatewayStatus;
    let error: string | undefined;

    try {
      // 构建检测 URL
      const checkUrl = `${config.url}/ipfs/QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67uvA3Nn`; // IPFS 官方测试文件

      // 构建请求头
      const headers: HeadersInit = {
        'User-Agent': 'CrustShare Gateway Health Check',
      };

      if (config.authToken) {
        headers['Authorization'] = `Bearer ${config.authToken}`;
      }

      if (config.headers) {
        Object.entries(config.headers).forEach(([key, value]) => {
          headers[key] = value;
        });
      }

      // 发送检测请求
      const response = await fetch(checkUrl, {
        method: 'HEAD',
        headers,
        signal: AbortSignal.timeout(config.timeout || 5000),
      });

      const responseTime = Date.now() - startTime;

      // 判断状态
      if (response.ok) {
        if (responseTime > 3000) {
          status = GatewayStatus.DEGRADED;
        } else {
          status = GatewayStatus.AVAILABLE;
        }
      } else if (response.status >= 500) {
        status = GatewayStatus.UNAVAILABLE;
        error = `HTTP ${response.status}`;
      } else if (response.status === 404) {
        // 404 可能是测试文件不存在，但网关可用
        status = GatewayStatus.AVAILABLE;
      } else if (response.status === 503) {
        status = GatewayStatus.MAINTENANCE;
      } else {
        status = GatewayStatus.UNAVAILABLE;
        error = `HTTP ${response.status}`;
      }

      // 更新状态
      this.updateState(id, {
        status,
        responseTime,
        lastCheckTime: new Date(),
        lastError: error,
      });

      return {
        gatewayId: id,
        status,
        responseTime,
        error,
        timestamp: new Date(),
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : '未知错误';
      status = GatewayStatus.UNAVAILABLE;

      // 更新状态
      this.updateState(id, {
        status,
        responseTime: Date.now() - startTime,
        lastCheckTime: new Date(),
        lastError: error,
      });

      return {
        gatewayId: id,
        status,
        responseTime: Date.now() - startTime,
        error,
        timestamp: new Date(),
      };
    }
  }

  /**
   * 更新网关状态
   */
  private updateState(id: string, updates: Partial<GatewayState>): void {
    const state = this.states.get(id);
    if (!state) return;

    const newState = { ...state, ...updates };

    // 更新统计信息
    if (updates.status !== undefined) {
      newState.totalChecks++;

      if (updates.status === GatewayStatus.AVAILABLE) {
        newState.successChecks++;
        newState.consecutiveSuccesses++;
        newState.consecutiveFails = 0;
      } else {
        newState.failChecks++;
        newState.consecutiveFails++;
        newState.consecutiveSuccesses = 0;
      }

      // 计算成功率（使用指数移动平均）
      newState.successRate = (newState.successChecks / newState.totalChecks) * 100;
    }

    this.states.set(id, newState);
  }

  /**
   * 缓存状态
   */
  private cacheStates(): void {
    try {
      const states = Array.from(this.states.entries());
      cache.set(CacheKeys.GATEWAY_STATES, JSON.stringify(states), CacheTTL.GATEWAY_STATE);
      console.log(`[GatewayManager] 缓存 ${states.length} 个网关状态`);
    } catch (error) {
      console.error('[GatewayManager] 缓存状态失败:', error);
    }
  }

  /**
   * 从缓存加载状态
   */
  loadStatesFromCache(): void {
    try {
      const cached = cache.get<string>(CacheKeys.GATEWAY_STATES);
      if (cached) {
        const states = JSON.parse(cached);
        states.forEach(([id, state]: [string, GatewayState]) => {
          if (this.gateways.has(id)) {
            this.states.set(id, state);
          }
        });
        console.log(`[GatewayManager] 从缓存加载 ${states.length} 个网关状态`);
      }
    } catch (error) {
      console.error('[GatewayManager] 加载缓存状态失败:', error);
    }
  }

  /**
   * 获取网关统计信息
   */
  getStatistics() {
    const states = this.getAllStates();
    const gateways = this.getAllGateways();

    return {
      total: gateways.length,
      enabled: this.getEnabledGateways().length,
      available: states.filter(s => s.status === GatewayStatus.AVAILABLE).length,
      unavailable: states.filter(s => s.status === GatewayStatus.UNAVAILABLE).length,
      degraded: states.filter(s => s.status === GatewayStatus.DEGRADED).length,
      maintenance: states.filter(s => s.status === GatewayStatus.MAINTENANCE).length,
      averageResponseTime: states.length > 0
        ? states.reduce((sum, s) => sum + s.responseTime, 0) / states.length
        : 0,
      averageSuccessRate: states.length > 0
        ? states.reduce((sum, s) => sum + s.successRate, 0) / states.length
        : 0,
    };
  }

  /**
   * 导出配置
   */
  exportConfigs(): GatewayConfig[] {
    return this.getAllGateways();
  }

  /**
   * 清理资源
   */
  destroy(): void {
    this.stopHealthCheck();
    this.gateways.clear();
    this.states.clear();
    console.log('[GatewayManager] 已清理');
  }
}

// 创建默认实例
let defaultManager: GatewayManager | null = null;

/**
 * 获取默认网关管理器
 */
export function getGatewayManager(): GatewayManager {
  if (!defaultManager) {
    defaultManager = new GatewayManager(20000); // 20秒检测一次
  }
  return defaultManager;
}

/**
 * 重置默认网关管理器
 */
export function resetGatewayManager(): void {
  if (defaultManager) {
    defaultManager.destroy();
    defaultManager = null;
  }
}
