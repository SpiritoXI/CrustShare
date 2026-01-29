import { NextRequest, NextResponse } from 'next/server';
import { verifyPasswordHash, getPasswordHash } from '@/lib/auth';

/**
 * 登录 API 路由
 * 验证用户密码
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { success: false, error: '密码不能为空' },
        { status: 400 }
      );
    }

    // 获取正确的哈希值
    const correctHash = getPasswordHash();

    // 验证密码
    const isValid = verifyPasswordHash(password, correctHash);

    if (isValid) {
      return NextResponse.json({
        success: true,
        message: '登录成功',
      });
    } else {
      return NextResponse.json(
        { success: false, error: '密码错误' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('登录错误:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}
