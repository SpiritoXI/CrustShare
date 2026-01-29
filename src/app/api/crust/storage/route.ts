import { NextResponse } from 'next/server';
import { getCrustClient, formatStorageSize } from '@/lib/crust';

export async function GET() {
  try {
    const crustClient = getCrustClient();

    // 获取存储信息
    const storageInfo = await crustClient.getStorageInfo();

    return NextResponse.json({
      success: true,
      ...storageInfo,
      formatted: {
        used: formatStorageSize(storageInfo.used),
        limit: formatStorageSize(storageInfo.limit),
        available: formatStorageSize(storageInfo.available),
        usagePercent: (storageInfo.used / storageInfo.limit) * 100,
      },
    });
  } catch (error) {
    console.error('获取存储信息失败:', error);
    return NextResponse.json(
      { error: '获取存储信息失败', message: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
