import type { ApiResponse, Env, Context } from "../../types";
import { upstashCommand, verifyAuth, corsHeaders, handleCors } from "../../lib/db/upstash";
import { hashPassword } from "../../lib/utils/security";

const SHARES_KEY = "crustshare_shares";

interface ShareInfo {
  cid: string;
  filename?: string;
  size?: number;
  password?: string;
  expiry?: string;
  createdAt: number;
  hasPassword?: boolean;
}

export async function onRequestGet(context: Context): Promise<Response> {
  const { request, env } = context;

  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  const url = new URL(request.url);
  const cid = url.searchParams.get("cid");
  const list = url.searchParams.get("list");

  if (list === "true") {
    if (!(await verifyAuth(request, env))) {
      return new Response(
        JSON.stringify({ success: false, error: "未授权" } as ApiResponse),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    try {
      const result = await upstashCommand<string[]>(
        env.UPSTASH_URL,
        env.UPSTASH_TOKEN,
        ["HGETALL", SHARES_KEY]
      );

      const shares: ShareInfo[] = [];
      if (Array.isArray(result)) {
        for (let i = 0; i < result.length; i += 2) {
          try {
            const shareInfo: ShareInfo = JSON.parse(result[i + 1]);
            if (shareInfo.expiry && shareInfo.expiry !== "0") {
              const expiryDays = parseInt(shareInfo.expiry);
              const expiryTime = shareInfo.createdAt + expiryDays * 24 * 60 * 60 * 1000;
              if (Date.now() > expiryTime) {
                await upstashCommand(
                  env.UPSTASH_URL,
                  env.UPSTASH_TOKEN,
                  ["HDEL", SHARES_KEY, shareInfo.cid]
                );
                continue;
              }
            }
            shares.push({
              cid: shareInfo.cid,
              filename: shareInfo.filename,
              size: shareInfo.size,
              expiry: shareInfo.expiry,
              createdAt: shareInfo.createdAt,
              hasPassword: !!shareInfo.password,
            });
          } catch {
            // skip invalid share
          }
        }
      }

      shares.sort((a, b) => b.createdAt - a.createdAt);

      return new Response(
        JSON.stringify({ success: true, data: shares } as ApiResponse),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "获取分享列表失败";
      return new Response(
        JSON.stringify({ success: false, error: errorMessage } as ApiResponse),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
  }

  if (!cid) {
    return new Response(
      JSON.stringify({ success: false, error: "缺少CID参数" } as ApiResponse),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    const result = await upstashCommand<string | null>(
      env.UPSTASH_URL,
      env.UPSTASH_TOKEN,
      ["HGET", SHARES_KEY, cid]
    );

    if (!result) {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            cid,
            hasPassword: false,
          },
        } as ApiResponse),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const shareInfo: ShareInfo = JSON.parse(result);

    if (shareInfo.expiry && shareInfo.expiry !== "0") {
      const expiryDays = parseInt(shareInfo.expiry);
      const expiryTime = shareInfo.createdAt + expiryDays * 24 * 60 * 60 * 1000;
      if (Date.now() > expiryTime) {
        await upstashCommand(
          env.UPSTASH_URL,
          env.UPSTASH_TOKEN,
          ["HDEL", SHARES_KEY, cid]
        );
        return new Response(
          JSON.stringify({ success: false, error: "分享已过期" } as ApiResponse),
          { status: 410, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          cid: shareInfo.cid,
          filename: shareInfo.filename,
          size: shareInfo.size,
          hasPassword: !!shareInfo.password,
          expiry: shareInfo.expiry,
        },
      } as ApiResponse),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "获取分享信息失败";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage } as ApiResponse),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
}

export async function onRequestPost(context: Context): Promise<Response> {
  const { request, env } = context;

  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  if (!(await verifyAuth(request, env))) {
    return new Response(
      JSON.stringify({ success: false, error: "未授权" } as ApiResponse),
      { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    const body = await request.json() as ShareInfo;

    if (!body.cid) {
      return new Response(
        JSON.stringify({ success: false, error: "缺少CID" } as ApiResponse),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const hashedPassword = body.password ? await hashPassword(body.password) : undefined;

    const shareInfo: ShareInfo = {
      cid: body.cid,
      filename: body.filename,
      size: body.size,
      password: hashedPassword,
      expiry: body.expiry,
      createdAt: Date.now(),
      hasPassword: !!body.password,
    };

    await upstashCommand(
      env.UPSTASH_URL,
      env.UPSTASH_TOKEN,
      ["HSET", SHARES_KEY, body.cid, JSON.stringify(shareInfo)]
    );

    return new Response(
      JSON.stringify({ success: true } as ApiResponse),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "保存分享信息失败";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage } as ApiResponse),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
}

export async function onRequestDelete(context: Context): Promise<Response> {
  const { request, env } = context;

  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  if (!(await verifyAuth(request, env))) {
    return new Response(
      JSON.stringify({ success: false, error: "未授权" } as ApiResponse),
      { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  const url = new URL(request.url);
  const cid = url.searchParams.get("cid");

  if (!cid) {
    return new Response(
      JSON.stringify({ success: false, error: "缺少CID参数" } as ApiResponse),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    await upstashCommand(
      env.UPSTASH_URL,
      env.UPSTASH_TOKEN,
      ["HDEL", SHARES_KEY, cid]
    );

    return new Response(
      JSON.stringify({ success: true } as ApiResponse),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "删除分享失败";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage } as ApiResponse),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
}
