import { NextRequest, NextResponse } from 'next/server';
import { getDefaultClient, CrustFilesClient } from '@/lib/crustfiles';

/**
 * 文件上传 API 路由
 * 通过 CrustFiles.io 网关上传文件
 */
export async function POST(request: NextRequest) {
  try {
    // 获取表单数据
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: '未找到文件' },
        { status: 400 }
      );
    }

    // 检查文件大小（限制：1GB）
    const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: '文件大小超过限制（最大 1GB）' },
        { status: 400 }
      );
    }

    // 获取 CrustFiles 客户端
    const client = getDefaultClient();
    if (!client) {
      return NextResponse.json(
        { success: false, error: 'CrustFiles 配置未完成' },
        { status: 500 }
      );
    }

    // 转换文件为 ArrayBuffer，然后转换为 Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 上传文件
    const result = await client.uploadFile(buffer, {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        cid: result.cid,
        name: result.name,
        size: result.size,
        url: result.url,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error || '上传失败' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('文件上传错误:', error);
    console.error('错误详情:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}

/**
 * 获取文件下载 URL
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cid = searchParams.get('cid');

    if (!cid) {
      return NextResponse.json(
        { success: false, error: '缺少 CID 参数' },
        { status: 400 }
      );
    }

    // 验证 CID 格式
    if (!CrustFilesClient.isValidCID(cid)) {
      return NextResponse.json(
        { success: false, error: '无效的 CID 格式' },
        { status: 400 }
      );
    }

    // 获取文件 URL
    const baseUrl = process.env.CRUSTFILES_BASE_URL || 'https://crustfiles.io';
    const fileUrl = `${baseUrl}/ipfs/${cid}`;

    return NextResponse.json({
      success: true,
      url: fileUrl,
      cid,
    });
  } catch (error) {
    console.error('获取文件 URL 错误:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}
