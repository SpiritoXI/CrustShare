/**
 * 文件下载 API 路由
 * 通过第三方网关下载文件，与 CrustFiles.io 原生通道解耦
 */

import { NextRequest, NextResponse } from 'next/server';
import { getGatewayMapper } from '@/lib/gateway/mapper';
import { getGatewayManager } from '@/lib/gateway/manager';
import useStore from '@/store/useStore';

interface DownloadRequest {
  fileId: string;
  cid: string;
  fileName: string;
  gatewayId?: string;  // 可选，指定使用哪个网关
}

/**
 * 处理 GET 请求 - 生成下载 URL
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');
    const cid = searchParams.get('cid');

    if (!fileId || !cid) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 获取或创建下载映射
    const mapper = getGatewayMapper();
    let mapping;

    try {
      mapping = mapper.getOrCreateMapping(fileId, cid);
    } catch (error) {
      // 如果没有可用网关，返回错误
      const manager = getGatewayManager();
      const stats = manager.getStatistics();

      console.error('[Download] 没有可用的网关');
      return NextResponse.json(
        {
          success: false,
          error: '下载服务暂不可用',
          message: '所有网关暂时不可用，请稍后重试',
          statistics: {
            total: stats.total,
            available: stats.available,
            unavailable: stats.unavailable,
          },
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      downloadUrl: mapping.downloadUrl,
      gatewayId: mapping.gatewayId,
      expiresAt: mapping.expiresAt,
    });
  } catch (error) {
    console.error('[Download Error]', error);
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}

/**
 * 处理 POST 请求 - 更新网关（重试）
 */
export async function POST(request: NextRequest) {
  try {
    const body: DownloadRequest = await request.json();
    const { fileId, cid, gatewayId } = body;

    if (!fileId || !cid) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    const mapper = getGatewayMapper();
    let mapping;

    try {
      // 更新映射，尝试使用不同的网关
      mapping = mapper.updateMapping(fileId, gatewayId);
    } catch (error) {
      // 如果没有可用网关
      const manager = getGatewayManager();
      const stats = manager.getStatistics();

      console.error('[Download] 没有可用的备用网关');
      return NextResponse.json(
        {
          success: false,
          error: '下载服务暂不可用',
          message: '所有网关暂时不可用，请稍后重试',
          statistics: {
            total: stats.total,
            available: stats.available,
            unavailable: stats.unavailable,
          },
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      downloadUrl: mapping.downloadUrl,
      gatewayId: mapping.gatewayId,
      message: '已切换到备用网关',
    });
  } catch (error) {
    console.error('[Download Error]', error);
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}

/**
 * 处理 DELETE 请求 - 清理映射
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json(
        { success: false, error: '缺少 file ID' },
        { status: 400 }
      );
    }

    const mapper = getGatewayMapper();
    mapper.removeMapping(fileId);

    return NextResponse.json({
      success: true,
      message: '下载映射已清理',
    });
  } catch (error) {
    console.error('[Download Error]', error);
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}
