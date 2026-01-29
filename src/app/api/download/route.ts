import { NextRequest, NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';

// 初始化对象存储
const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: '',
  secretKey: '',
  bucketName: process.env.COZE_BUCKET_NAME,
  region: 'cn-beijing',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileKey } = body;

    if (!fileKey) {
      return NextResponse.json(
        { error: '缺少文件 key' },
        { status: 400 }
      );
    }

    // 检查文件是否存在
    const exists = await storage.fileExists({ fileKey });
    if (!exists) {
      return NextResponse.json(
        { error: '文件不存在' },
        { status: 404 }
      );
    }

    // 生成下载链接（有效期 1 小时）
    const downloadUrl = await storage.generatePresignedUrl({
      key: fileKey,
      expireTime: 3600, // 1 小时
    });

    return NextResponse.json({
      success: true,
      downloadUrl,
    });
  } catch (error) {
    console.error('生成下载链接失败:', error);
    return NextResponse.json(
      { error: '生成下载链接失败', message: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
