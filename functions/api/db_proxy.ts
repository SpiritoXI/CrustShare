import type { FileRecord, Folder, ApiResponse } from "../../types";

const FILES_KEY = "my_crust_files";
const FOLDERS_KEY = "cc_folders";

interface Env {
  UPSTASH_URL: string;
  UPSTASH_TOKEN: string;
  ADMIN_PASSWORD: string;
}

interface Context {
  request: Request;
  env: Env;
}

async function upstashCommand<T = unknown>(
  upstashUrl: string,
  upstashToken: string,
  command: (string | number)[]
): Promise<T> {
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

  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error || `Upstash错误: ${response.status}`);
  }

  return data.result;
}

function verifyAuth(request: Request, env: Env): boolean {
  const authHeader = request.headers.get("x-auth-token");
  const expectedPassword = env.ADMIN_PASSWORD;
  return authHeader === expectedPassword;
}

export async function onRequestGet(context: Context): Promise<Response> {
  const { request, env } = context;

  if (!verifyAuth(request, env)) {
    return new Response(
      JSON.stringify({ error: "未授权" } as ApiResponse),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const url = new URL(request.url);
  const action = url.searchParams.get("action");

  try {
    switch (action) {
      case "load_files": {
        const result = await upstashCommand<(string | null)[]>(
          env.UPSTASH_URL,
          env.UPSTASH_TOKEN,
          ["LRANGE", FILES_KEY, "0", "-1"]
        );
        const files: FileRecord[] = Array.isArray(result)
          ? result
              .map((item) => {
                try {
                  return item ? (JSON.parse(item) as FileRecord) : null;
                } catch {
                  return null;
                }
              })
              .filter((item): item is FileRecord => item !== null)
          : [];
        return new Response(
          JSON.stringify({ success: true, data: files } as ApiResponse<FileRecord[]>),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      case "load_folders": {
        const result = await upstashCommand<string[]>(
          env.UPSTASH_URL,
          env.UPSTASH_TOKEN,
          ["HGETALL", FOLDERS_KEY]
        );
        const folders: Folder[] = [];
        if (Array.isArray(result)) {
          for (let i = 0; i < result.length; i += 2) {
            try {
              const folder = JSON.parse(result[i + 1]) as Folder;
              folders.push(folder);
            } catch {
              // skip invalid folder
            }
          }
        }
        if (folders.length === 0) {
          const defaultFolder: Folder = {
            id: "default",
            name: "默认文件夹",
            parentId: null,
            createdAt: new Date().toLocaleString(),
          };
          await upstashCommand(
            env.UPSTASH_URL,
            env.UPSTASH_TOKEN,
            ["HSET", FOLDERS_KEY, "default", JSON.stringify(defaultFolder)]
          );
          folders.push(defaultFolder);
        }
        return new Response(
          JSON.stringify({ success: true, data: folders } as ApiResponse<Folder[]>),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      case "db_stats": {
        const [filesCount, foldersCount] = await Promise.all([
          upstashCommand<number>(env.UPSTASH_URL, env.UPSTASH_TOKEN, ["LLEN", FILES_KEY]),
          upstashCommand<number>(env.UPSTASH_URL, env.UPSTASH_TOKEN, ["HLEN", FOLDERS_KEY]),
        ]);
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              keys: {
                files: { count: Number(filesCount) || 0 },
                folders: { count: Number(foldersCount) || 0 },
              },
            },
          } as ApiResponse),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "未知操作" } as ApiResponse),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "操作失败";
    return new Response(
      JSON.stringify({ error: errorMessage } as ApiResponse),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

interface SaveFileBody extends FileRecord {}
interface DeleteFileBody {
  fileId: string | number;
}
interface CreateFolderBody {
  id?: string;
  name: string;
  parentId?: string | null;
}
interface AddCidBody {
  cid: string;
  name: string;
  size?: number;
  folderId?: string;
}
interface MoveFilesBody {
  fileIds: (string | number)[];
  folderId: string;
}
interface CopyFilesBody {
  fileIds: (string | number)[];
  folderId: string;
}

export async function onRequestPost(context: Context): Promise<Response> {
  const { request, env } = context;

  if (!verifyAuth(request, env)) {
    return new Response(
      JSON.stringify({ error: "未授权" } as ApiResponse),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const url = new URL(request.url);
  const action = url.searchParams.get("action");

  try {
    const body = (await request.json()) as
      | SaveFileBody
      | DeleteFileBody
      | CreateFolderBody
      | AddCidBody
      | MoveFilesBody
      | CopyFilesBody;

    switch (action) {
      case "save_file": {
        await upstashCommand(
          env.UPSTASH_URL,
          env.UPSTASH_TOKEN,
          ["LPUSH", FILES_KEY, JSON.stringify(body)]
        );
        return new Response(
          JSON.stringify({ success: true } as ApiResponse),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      case "delete_file": {
        const deleteBody = body as DeleteFileBody;
        const files = await upstashCommand<string[]>(
          env.UPSTASH_URL,
          env.UPSTASH_TOKEN,
          ["LRANGE", FILES_KEY, "0", "-1"]
        );
        if (Array.isArray(files)) {
          const index = files.findIndex((item) => {
            try {
              const file = JSON.parse(item) as FileRecord;
              return file.id === deleteBody.fileId;
            } catch {
              return false;
            }
          });
          if (index >= 0) {
            await upstashCommand(
              env.UPSTASH_URL,
              env.UPSTASH_TOKEN,
              ["LREM", FILES_KEY, 0, files[index]]
            );
          }
        }
        return new Response(
          JSON.stringify({ success: true } as ApiResponse),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      case "create_folder": {
        const createBody = body as CreateFolderBody;
        const folder: Folder = {
          id: createBody.id || Date.now().toString(),
          name: createBody.name,
          parentId: createBody.parentId || null,
          createdAt: new Date().toLocaleString(),
        };
        await upstashCommand(
          env.UPSTASH_URL,
          env.UPSTASH_TOKEN,
          ["HSET", FOLDERS_KEY, folder.id, JSON.stringify(folder)]
        );
        return new Response(
          JSON.stringify({ success: true, data: folder } as ApiResponse<Folder>),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      case "add_cid": {
        const addCidBody = body as AddCidBody;
        const file: FileRecord = {
          id: Date.now().toString(),
          cid: addCidBody.cid,
          name: addCidBody.name,
          size: Number(addCidBody.size) || 0,
          folder_id: addCidBody.folderId || "default",
          date: new Date().toLocaleString(),
          verified: false,
        };
        await upstashCommand(
          env.UPSTASH_URL,
          env.UPSTASH_TOKEN,
          ["LPUSH", FILES_KEY, JSON.stringify(file)]
        );
        return new Response(
          JSON.stringify({ success: true, data: file } as ApiResponse<FileRecord>),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      case "move_files": {
        const moveBody = body as MoveFilesBody;
        const files = await upstashCommand<string[]>(
          env.UPSTASH_URL,
          env.UPSTASH_TOKEN,
          ["LRANGE", FILES_KEY, "0", "-1"]
        );

        let movedCount = 0;
        if (Array.isArray(files)) {
          for (let i = 0; i < files.length; i++) {
            try {
              const file = JSON.parse(files[i]) as FileRecord;
              if (moveBody.fileIds.includes(file.id)) {
                // 更新文件的 folder_id
                const updatedFile = { ...file, folder_id: moveBody.folderId };
                // 删除旧记录
                await upstashCommand(
                  env.UPSTASH_URL,
                  env.UPSTASH_TOKEN,
                  ["LREM", FILES_KEY, 0, files[i]]
                );
                // 添加更新后的记录
                await upstashCommand(
                  env.UPSTASH_URL,
                  env.UPSTASH_TOKEN,
                  ["LPUSH", FILES_KEY, JSON.stringify(updatedFile)]
                );
                movedCount++;
              }
            } catch {
              // 跳过无效文件
            }
          }
        }

        return new Response(
          JSON.stringify({ success: true, data: { moved: movedCount } } as ApiResponse<{ moved: number }>),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      case "copy_files": {
        const copyBody = body as CopyFilesBody;
        const files = await upstashCommand<string[]>(
          env.UPSTASH_URL,
          env.UPSTASH_TOKEN,
          ["LRANGE", FILES_KEY, "0", "-1"]
        );

        let copiedCount = 0;
        if (Array.isArray(files)) {
          for (const fileStr of files) {
            try {
              const file = JSON.parse(fileStr) as FileRecord;
              if (copyBody.fileIds.includes(file.id)) {
                // 创建文件副本，使用新的ID
                const copiedFile: FileRecord = {
                  ...file,
                  id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                  folder_id: copyBody.folderId,
                  date: new Date().toLocaleString(),
                };
                await upstashCommand(
                  env.UPSTASH_URL,
                  env.UPSTASH_TOKEN,
                  ["LPUSH", FILES_KEY, JSON.stringify(copiedFile)]
                );
                copiedCount++;
              }
            } catch {
              // 跳过无效文件
            }
          }
        }

        return new Response(
          JSON.stringify({ success: true, data: { copied: copiedCount } } as ApiResponse<{ copied: number }>),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "未知操作" } as ApiResponse),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "操作失败";
    return new Response(
      JSON.stringify({ error: errorMessage } as ApiResponse),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
