import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const authHeader = request.headers.get("x-auth-token");
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!authHeader || authHeader !== expectedPassword) {
    return NextResponse.json(
      { error: "未授权" },
      { status: 401 }
    );
  }

  const crustToken = process.env.CRUST_TOKEN;
  if (!crustToken) {
    return NextResponse.json(
      { error: "CRUST_TOKEN未配置" },
      { status: 500 }
    );
  }

  return NextResponse.json({ token: crustToken });
}
