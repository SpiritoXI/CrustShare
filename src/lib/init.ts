/**
 * 应用初始化
 * 在应用启动时初始化网关管理器等核心功能
 */

import { initializeGatewayManager } from '@/lib/gateway/config';
import { getGatewayMapper } from '@/lib/gateway/mapper';
import logger, { LogType } from '@/lib/logger';

export function initializeApp() {
  try {
    // 初始化网关管理器
    initializeGatewayManager();

    // 清理过期的下载映射
    const mapper = getGatewayMapper();
    const cleaned = mapper.cleanExpiredMappings();
    if (cleaned > 0) {
      logger.info(LogType.GATEWAY, `清理了 ${cleaned} 个过期下载映射`);
    }

    console.log('[App] 应用初始化完成');
  } catch (error) {
    console.error('[App] 应用初始化失败:', error);
    logger.error(LogType.SYSTEM, '应用初始化失败', { error });
  }
}

// 在浏览器环境自动初始化
if (typeof window !== 'undefined') {
  // 延迟初始化，等待其他依赖加载完成
  setTimeout(initializeApp, 100);
}
