/**
 * 网关状态监控 API
 * 提供网关可用性、健康状态等信息
 */

import { NextRequest, NextResponse } from 'next/server';
import { getGatewayManager } from '@/lib/gateway/manager';
import { exportGatewayConfigs } from '@/lib/gateway/config';

/**
 * 获取所有网关状态
 */
export async function GET(request: NextRequest) {
  try {
    const manager = getGatewayManager();
    const stats = manager.getStatistics();

    // 获取所有网关状态
    const gateways = manager.getAllGateways().map(config => {
      const state = manager.getState(config.id);
      return {
        ...config,
        state: state ? {
          status: state.status,
          responseTime: state.responseTime,
          successRate: state.successRate,
          lastCheckTime: state.lastCheckTime,
          lastError: state.lastError,
        } : null,
      };
    });

    return NextResponse.json({
      success: true,
      statistics: stats,
      gateways,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Gateway Status Error]', error);
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}
