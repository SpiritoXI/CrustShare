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
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: '未找到文件' },
        { status: 400 }
      );
    }

    // 生成安全的文件名（去除特殊字符）
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._/-]/g, '_');
    const timestamp = Date.now();
    const fileName = `crustshare/${timestamp}_${safeFileName}`;

    // 将文件转换为 Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 上传文件到对象存储
    const fileKey = await storage.uploadFile({
      fileContent: buffer,
      fileName: fileName,
      contentType: file.type,
    });

    // 生成下载链接（有效期 7 天）
    const downloadUrl = await storage.generatePresignedUrl({
      key: fileKey,
      expireTime: 604800, // 7 天
    });

    return NextResponse.json({
      success: true,
      fileKey,
      downloadUrl,
      fileName: file.name,
      size: file.size,
      contentType: file.type,
    });
  } catch (error) {
    console.error('上传失败:', error);
    return NextResponse.json(
      { error: '上传失败', message: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
