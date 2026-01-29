import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const expectedPassword = process.env.ADMIN_PASSWORD_HASH;

    if (!expectedPassword) {
      return NextResponse.json(
        { error: "服务器配置错误" },
        { status: 500 }
      );
    }

    if (password === expectedPassword) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: "密码错误" },
        { status: 401 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "请求处理失败" },
      { status: 400 }
    );
  }
}
