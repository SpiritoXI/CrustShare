/**
 * 网关下载映射管理
 * 管理 IPFS CID 到第三方网关的映射关系
 */

import { GatewayDownloadMapping } from './types';
import { getGatewayManager } from './manager';
import { cache, CacheKeys, CacheTTL } from '@/lib/cache';

export class GatewayMapper {
  private mappings: Map<string, GatewayDownloadMapping>;

  constructor() {
    this.mappings = new Map();
  }

  /**
   * 创建下载映射
   */
  createMapping(
    fileId: string,
    cid: string,
    gatewayId?: string
  ): GatewayDownloadMapping {
    const manager = getGatewayManager();

    // 如果没有指定网关 ID，自动选择最优网关
    const selectedGatewayId = gatewayId || manager.selectBestGateway()?.id;

    if (!selectedGatewayId) {
      throw new Error('没有可用的网关');
    }

    const gateway = manager.getGateway(selectedGatewayId);
    if (!gateway) {
      throw new Error(`网关 ${selectedGatewayId} 不存在`);
    }

    // 生成下载 URL
    const downloadUrl = this.buildDownloadUrl(gateway.url, cid, gateway.authToken);

    const mapping: GatewayDownloadMapping = {
      fileId,
      cid,
      gatewayId: selectedGatewayId,
      downloadUrl,
      accessToken: gateway.authToken,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24小时后过期
    };

    this.mappings.set(fileId, mapping);
    this.cacheMapping(fileId, mapping);

    console.log(`[GatewayMapper] 创建映射: ${fileId} -> ${selectedGatewayId}`);

    return mapping;
  }

  /**
   * 获取下载映射
   */
  getMapping(fileId: string): GatewayDownloadMapping | undefined {
    return this.mappings.get(fileId);
  }

  /**
   * 通过 CID 获取映射
   */
  getMappingByCID(cid: string): GatewayDownloadMapping | undefined {
    for (const mapping of this.mappings.values()) {
      if (mapping.cid === cid) {
        return mapping;
      }
    }
    return undefined;
  }

  /**
   * 获取或创建下载映射
   */
  getOrCreateMapping(fileId: string, cid: string, gatewayId?: string): GatewayDownloadMapping {
    let mapping = this.mappings.get(fileId);

    // 如果映射不存在或已过期，创建新的映射
    if (!mapping || (mapping.expiresAt && mapping.expiresAt < new Date())) {
      mapping = this.createMapping(fileId, cid, gatewayId);
    }

    return mapping;
  }

  /**
   * 更新映射（重新选择网关）
   */
  updateMapping(fileId: string, gatewayId?: string): GatewayDownloadMapping {
    const mapping = this.mappings.get(fileId);
    if (!mapping) {
      throw new Error(`文件 ${fileId} 的映射不存在`);
    }

    // 重新选择网关
    const manager = getGatewayManager();
    const selectedGatewayId = gatewayId || manager.selectBestGateway({ excludeIds: [mapping.gatewayId] })?.id;

    if (!selectedGatewayId) {
      throw new Error('没有可用的备用网关');
    }

    const gateway = manager.getGateway(selectedGatewayId);
    if (!gateway) {
      throw new Error(`网关 ${selectedGatewayId} 不存在`);
    }

    // 生成新的下载 URL
    const downloadUrl = this.buildDownloadUrl(gateway.url, mapping.cid, gateway.authToken);

    const newMapping: GatewayDownloadMapping = {
      ...mapping,
      gatewayId: selectedGatewayId,
      downloadUrl,
      accessToken: gateway.authToken,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };

    this.mappings.set(fileId, newMapping);
    this.cacheMapping(fileId, newMapping);

    console.log(`[GatewayMapper] 更新映射: ${fileId} -> ${selectedGatewayId}`);

    return newMapping;
  }

  /**
   * 删除映射
   */
  removeMapping(fileId: string): void {
    this.mappings.delete(fileId);
    cache.remove(CacheKeys.GATEWAY_MAPPING + ':' + fileId);
    console.log(`[GatewayMapper] 删除映射: ${fileId}`);
  }

  /**
   * 获取所有映射
   */
  getAllMappings(): GatewayDownloadMapping[] {
    return Array.from(this.mappings.values());
  }

  /**
   * 清理过期映射
   */
  cleanExpiredMappings(): number {
    let cleaned = 0;
    const now = new Date();

    for (const [fileId, mapping] of this.mappings.entries()) {
      if (mapping.expiresAt && mapping.expiresAt < now) {
        this.removeMapping(fileId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[GatewayMapper] 清理了 ${cleaned} 个过期映射`);
    }

    return cleaned;
  }

  /**
   * 构建下载 URL
   */
  private buildDownloadUrl(gatewayUrl: string, cid: string, authToken?: string): string {
    let url = `${gatewayUrl}/ipfs/${cid}`;

    // 如果需要认证，添加访问令牌
    if (authToken) {
      const urlObj = new URL(url);
      urlObj.searchParams.append('token', authToken);
      url = urlObj.toString();
    }

    return url;
  }

  /**
   * 缓存映射
   */
  private cacheMapping(fileId: string, mapping: GatewayDownloadMapping): void {
    try {
      cache.set(
        `${CacheKeys.GATEWAY_MAPPING}:${fileId}`,
        JSON.stringify(mapping),
        CacheTTL.GATEWAY_MAPPING
      );
    } catch (error) {
      console.error('[GatewayMapper] 缓存映射失败:', error);
    }
  }

  /**
   * 从缓存加载映射
   */
  loadMappingFromCache(fileId: string): GatewayDownloadMapping | undefined {
    try {
      const cached = cache.get<string>(`${CacheKeys.GATEWAY_MAPPING}:${fileId}`);
      if (cached) {
        const mapping = JSON.parse(cached) as GatewayDownloadMapping;
        // 检查是否过期
        if (!mapping.expiresAt || new Date(mapping.expiresAt) > new Date()) {
          this.mappings.set(fileId, mapping);
          return mapping;
        }
      }
    } catch (error) {
      console.error('[GatewayMapper] 加载缓存映射失败:', error);
    }
    return undefined;
  }

  /**
   * 批量加载映射
   */
  loadMappingsFromCache(fileIds: string[]): void {
    fileIds.forEach(fileId => {
      this.loadMappingFromCache(fileId);
    });
  }

  /**
   * 导出映射（不包含敏感信息）
   */
  exportMappings(fileId?: string): Omit<GatewayDownloadMapping, 'accessToken'>[] {
    const mappings = fileId
      ? [this.getMapping(fileId)].filter(Boolean) as GatewayDownloadMapping[]
      : this.getAllMappings();

    return mappings.map(({ accessToken, ...mapping }) => mapping);
  }
}

// 创建默认实例
let defaultMapper: GatewayMapper | null = null;

/**
 * 获取默认网关映射器
 */
export function getGatewayMapper(): GatewayMapper {
  if (!defaultMapper) {
    defaultMapper = new GatewayMapper();
  }
  return defaultMapper;
}

/**
 * 重置默认网关映射器
 */
export function resetGatewayMapper(): void {
  defaultMapper = null;
}
