import { NextResponse } from "next/server";

const FILES_KEY = "my_crust_files";
const FOLDERS_KEY = "cc_folders";

interface UpstashResponse {
  result?: unknown;
  error?: string;
}

async function upstashCommand(command: unknown[]): Promise<unknown> {
  const upstashUrl = process.env.UPSTASH_URL;
  const upstashToken = process.env.UPSTASH_TOKEN;

  if (!upstashUrl || !upstashToken) {
    throw new Error("Upstash配置缺失");
  }

  const response = await fetch(upstashUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${upstashToken}`,
    },
    body: JSON.stringify(command),
  });

  const data: UpstashResponse = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error || `Upstash错误: ${response.status}`);
  }

  return data.result;
}

function verifyAuth(request: Request): boolean {
  const authHeader = request.headers.get("x-auth-token");
  const expectedPassword = process.env.ADMIN_PASSWORD;
  return authHeader === expectedPassword;
}

export async function GET(request: Request) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  try {
    switch (action) {
      case "load_files": {
        const result = await upstashCommand(["LRANGE", FILES_KEY, "0", "-1"]);
        const files = Array.isArray(result)
          ? result
              .map((item) => {
                try {
                  return JSON.parse(item as string);
                } catch {
                  return null;
                }
              })
              .filter(Boolean)
          : [];
        return NextResponse.json({ success: true, data: files });
      }

      case "load_folders": {
        const result = await upstashCommand(["HGETALL", FOLDERS_KEY]);
        const folders: unknown[] = [];
        if (Array.isArray(result)) {
          for (let i = 0; i < result.length; i += 2) {
            try {
              const folder = JSON.parse(result[i + 1] as string);
              folders.push(folder);
            } catch {
              // skip invalid folder
            }
          }
        }
        if (folders.length === 0) {
          const defaultFolder = {
            id: "default",
            name: "默认文件夹",
            parentId: null,
            createdAt: new Date().toLocaleString(),
          };
          await upstashCommand([
            "HSET",
            FOLDERS_KEY,
            "default",
            JSON.stringify(defaultFolder),
          ]);
          folders.push(defaultFolder);
        }
        return NextResponse.json({ success: true, data: folders });
      }

      case "db_stats": {
        const [filesCount, foldersCount] = await Promise.all([
          upstashCommand(["LLEN", FILES_KEY]),
          upstashCommand(["HLEN", FOLDERS_KEY]),
        ]);
        return NextResponse.json({
          success: true,
          data: {
            keys: {
              files: { count: Number(filesCount) || 0 },
              folders: { count: Number(foldersCount) || 0 },
            },
          },
        });
      }

      default:
        return NextResponse.json({ error: "未知操作" }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "操作失败" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  try {
    const body = await request.json();

    switch (action) {
      case "save_file": {
        await upstashCommand(["LPUSH", FILES_KEY, JSON.stringify(body)]);
        return NextResponse.json({ success: true });
      }

      case "delete_file": {
        const files = await upstashCommand(["LRANGE", FILES_KEY, "0", "-1"]);
        if (Array.isArray(files)) {
          const index = files.findIndex((item) => {
            try {
              const file = JSON.parse(item as string);
              return file.id === body.fileId;
            } catch {
              return false;
            }
          });
          if (index >= 0) {
            await upstashCommand(["LREM", FILES_KEY, 0, files[index]]);
          }
        }
        return NextResponse.json({ success: true });
      }

      case "create_folder": {
        const folder = {
          id: body.id || Date.now().toString(),
          name: body.name,
          parentId: body.parentId || null,
          createdAt: new Date().toLocaleString(),
        };
        await upstashCommand([
          "HSET",
          FOLDERS_KEY,
          folder.id,
          JSON.stringify(folder),
        ]);
        return NextResponse.json({ success: true, data: folder });
      }

      default:
        return NextResponse.json({ error: "未知操作" }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "操作失败" },
      { status: 500 }
    );
  }
}
