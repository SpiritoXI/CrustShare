import { NextRequest, NextResponse } from 'next/server';
import { getCrustClient } from '@/lib/crust';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: '未找到文件' },
        { status: 400 }
      );
    }

    // 将文件转换为 Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 获取 Crust 客户端
    const crustClient = getCrustClient();

    // 上传到 Crust Network
    const result = await crustClient.uploadFile(
      buffer,
      file.name,
      file.size
    );

    return NextResponse.json({
      success: true,
      cid: result.cid,
      dealId: result.dealId,
      status: result.status,
      fileName: file.name,
      fileSize: file.size,
    });
  } catch (error) {
    console.error('Crust 上传失败:', error);
    return NextResponse.json(
      { error: '上传失败', message: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
