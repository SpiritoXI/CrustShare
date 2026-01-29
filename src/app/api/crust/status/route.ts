import { NextRequest, NextResponse } from 'next/server';
import { getCrustClient } from '@/lib/crust';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cid = searchParams.get('cid');

    if (!cid) {
      return NextResponse.json(
        { error: '缺少 CID 参数' },
        { status: 400 }
      );
    }

    const crustClient = getCrustClient();

    // 获取文件状态
    const status = await crustClient.getFileStatus(cid);

    return NextResponse.json({
      success: true,
      ...status,
    });
  } catch (error) {
    console.error('获取文件状态失败:', error);
    return NextResponse.json(
      { error: '获取文件状态失败', message: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
