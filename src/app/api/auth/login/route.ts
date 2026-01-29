import { NextRequest, NextResponse } from 'next/server';
import { verifyPinCode } from '@/lib/auth';

/**
 * 登录 API 路由
 * 验证用户 PIN 码
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pin } = body;

    if (!pin) {
      return NextResponse.json(
        { success: false, error: 'PIN 码不能为空' },
        { status: 400 }
      );
    }

    // 验证 PIN 码
    const isValid = verifyPinCode(pin);

    if (isValid) {
      return NextResponse.json({
        success: true,
        message: '登录成功',
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'PIN 码错误，请重试' },
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
