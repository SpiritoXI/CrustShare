import type { FileRecord, Folder, ApiResponse, Env, Context } from "../../types";

const FILES_KEY = "my_crust_files";
const FOLDERS_KEY = "cc_folders";

// 内存缓存作为 Redis 降级方案
const memoryCache = new Map<string, unknown>();
let useMemoryCache = false;

async function upstashCommand<T = unknown>(
  upstashUrl: string,
  upstashToken: string,
  command: (string | number)[],
  retryCount = 3
): Promise<T> {
  if (!upstashUrl || !upstashToken) {
    throw new Error("Upstash配置缺失");
  }

  // 如果已经切换到内存缓存模式，直接操作内存
  if (useMemoryCache) {
    return memoryCacheCommand<T>(command);
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retryCount; attempt++) {
    try {
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
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // 如果不是最后一次尝试，等待后重试
      if (attempt < retryCount - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  // 所有重试都失败后，切换到内存缓存模式
  console.warn(`Redis连接失败，切换到内存缓存模式: ${lastError?.message}`);
  useMemoryCache = true;
  return memoryCacheCommand<T>(command);
}

// 内存缓存命令处理
function memoryCacheCommand<T>(command: (string | number)[]): Promise<T> {
  const cmd = String(command[0]).toUpperCase();
  const key = String(command[1]);

  return new Promise((resolve, reject) => {
    switch (cmd) {
      case "LPUSH": {
        const value = String(command[2]);
        const existing = (memoryCache.get(key) as string[]) || [];
        existing.unshift(value);
        memoryCache.set(key, existing);
        resolve(existing.length as T);
        break;
      }
      case "LRANGE": {
        const list = (memoryCache.get(key) as string[]) || [];
        resolve(list as T);
        break;
      }
      case "LREM": {
        const value = String(command[3]);
        const existing = (memoryCache.get(key) as string[]) || [];
        const filtered = existing.filter(item => item !== value);
        memoryCache.set(key, filtered);
        resolve(filtered.length as T);
        break;
      }
      case "HSET": {
        const field = String(command[2]);
        const value = String(command[3]);
        const existing = (memoryCache.get(key) as Record<string, string>) || {};
        existing[field] = value;
        memoryCache.set(key, existing);
        resolve(1 as T);
        break;
      }
      case "HGET": {
        const field = String(command[2]);
        const hash = (memoryCache.get(key) as Record<string, string>) || {};
        resolve((hash[field] || null) as T);
        break;
      }
      case "HGETALL": {
        const hash = (memoryCache.get(key) as Record<string, string>) || {};
        const result: string[] = [];
        Object.entries(hash).forEach(([k, v]) => {
          result.push(k, v);
        });
        resolve(result as T);
        break;
      }
      case "HDEL": {
        const field = String(command[2]);
        const hash = (memoryCache.get(key) as Record<string, string>) || {};
        delete hash[field];
        memoryCache.set(key, hash);
        resolve(1 as T);
        break;
      }
      case "HLEN": {
        const hash = (memoryCache.get(key) as Record<string, string>) || {};
        resolve(Object.keys(hash).length as T);
        break;
      }
      case "LLEN": {
        const list = (memoryCache.get(key) as string[]) || [];
        resolve(list.length as T);
        break;
      }
      default:
        reject(new Error(`不支持的命令: ${cmd}`));
    }
  });
}

/**
 * 验证认证 - 使用明文密码
 */
async function verifyAuth(request: Request, env: Env): Promise<boolean> {
  const authHeader = request.headers.get("x-auth-token");

  if (!authHeader) {
    return false;
  }

  // 明文密码比较
  return authHeader === env.ADMIN_PASSWORD;
}

export async function onRequestGet(context: Context): Promise<Response> {
  const { request, env } = context;

  // 调试日志：检查环境变量
  console.log('Environment check:', {
    hasUpstashUrl: !!env.UPSTASH_URL,
    hasUpstashToken: !!env.UPSTASH_TOKEN,
    upstashUrlLength: env.UPSTASH_URL?.length,
    upstashTokenLength: env.UPSTASH_TOKEN?.length,
  });

  if (!(await verifyAuth(request, env))) {
    return new Response(
      JSON.stringify({ success: false, error: "未授权" } as ApiResponse),
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
                  if (!item) return null;
                  const parsed = JSON.parse(item) as FileRecord;
                  // 规范化数据：确保 size 是数字类型
                  if (parsed.size !== undefined) {
                    parsed.size = Number(parsed.size) || 0;
                  }
                  return parsed;
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
          JSON.stringify({ success: false, error: "未知操作" } as ApiResponse),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "操作失败";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage } as ApiResponse),
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
interface RenameFolderBody {
  folderId: string;
  newName: string;
}
interface RenameFileBody {
  fileId: string | number;
  newName: string;
}
interface UpdateFileBody {
  fileId: string | number;
  updates: Partial<FileRecord>;
}

export async function onRequestPost(context: Context): Promise<Response> {
  const { request, env } = context;

  if (!(await verifyAuth(request, env))) {
    return new Response(
      JSON.stringify({ success: false, error: "未授权" } as ApiResponse),
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
      | CopyFilesBody
      | RenameFolderBody
      | RenameFileBody
      | UpdateFileBody;

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

      case "update_file": {
        const updateBody = body as UpdateFileBody;
        const files = await upstashCommand<string[]>(
          env.UPSTASH_URL,
          env.UPSTASH_TOKEN,
          ["LRANGE", FILES_KEY, "0", "-1"]
        );

        let updated = false;
        if (Array.isArray(files)) {
          for (let i = 0; i < files.length; i++) {
            try {
              const file = JSON.parse(files[i]) as FileRecord;
              if (file.id === updateBody.fileId) {
                const updatedFile = { ...file, ...updateBody.updates };
                await upstashCommand(
                  env.UPSTASH_URL,
                  env.UPSTASH_TOKEN,
                  ["LREM", FILES_KEY, 0, files[i]]
                );
                await upstashCommand(
                  env.UPSTASH_URL,
                  env.UPSTASH_TOKEN,
                  ["LPUSH", FILES_KEY, JSON.stringify(updatedFile)]
                );
                updated = true;
                break;
              }
            } catch {
            }
          }
        }

        if (!updated) {
          return new Response(
            JSON.stringify({ success: false, error: "文件不存在" } as ApiResponse),
            { status: 404, headers: { "Content-Type": "application/json" } }
          );
        }

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

      case "rename_folder": {
        const renameFolderBody = body as RenameFolderBody;
        const folderData = await upstashCommand<string | null>(
          env.UPSTASH_URL,
          env.UPSTASH_TOKEN,
          ["HGET", FOLDERS_KEY, renameFolderBody.folderId]
        );

        if (!folderData) {
          return new Response(
            JSON.stringify({ success: false, error: "文件夹不存在" } as ApiResponse),
            { status: 404, headers: { "Content-Type": "application/json" } }
          );
        }

        const folder = JSON.parse(folderData) as Folder;
        folder.name = renameFolderBody.newName;

        await upstashCommand(
          env.UPSTASH_URL,
          env.UPSTASH_TOKEN,
          ["HSET", FOLDERS_KEY, folder.id, JSON.stringify(folder)]
        );

        return new Response(
          JSON.stringify({ success: true } as ApiResponse),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      case "rename_file": {
        const renameFileBody = body as RenameFileBody;
        const files = await upstashCommand<string[]>(
          env.UPSTASH_URL,
          env.UPSTASH_TOKEN,
          ["LRANGE", FILES_KEY, "0", "-1"]
        );

        let renamed = false;
        if (Array.isArray(files)) {
          for (let i = 0; i < files.length; i++) {
            try {
              const file = JSON.parse(files[i]) as FileRecord;
              if (file.id === renameFileBody.fileId) {
                // 更新文件名
                const updatedFile = { ...file, name: renameFileBody.newName };
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
                renamed = true;
                break;
              }
            } catch {
              // 跳过无效文件
            }
          }
        }

        if (!renamed) {
          return new Response(
            JSON.stringify({ success: false, error: "文件不存在" } as ApiResponse),
            { status: 404, headers: { "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true } as ApiResponse),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: "未知操作" } as ApiResponse),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "操作失败";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage } as ApiResponse),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
