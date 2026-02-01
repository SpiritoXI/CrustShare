/**
 * 文件上传 Hook
 * 处理文件上传逻辑
 */

"use client";

import { useState, useCallback } from "react";
import { api, uploadApi, propagationApi } from "@/lib/api";
import { CONFIG } from "@/lib/config";
import { useFileStore, useUIStore, useGatewayStore } from "@/lib/store";
import { generateId } from "@/lib/utils";
import { isAllowedFileType, isSafeFilename, sanitizeFilename, calculateFileHash } from "@/lib/security";
import { getAutoRepairService } from "@/lib/auto-repair";
import { handleError } from "@/lib/error-handler";
import type { FileRecord } from "@/types";

export interface UploadState {
  isUploading: boolean;
  uploadProgress: number;
  currentFile: File | null;
}

export interface UploadOperations {
  handleFileUpload: (fileList: FileList | null) => Promise<void>;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  cancelUpload: () => void;
}

interface UseUploadOptions {
  currentFolderId: string | null;
  onUploadSuccess?: (file: FileRecord) => void;
}

export function useUpload(options: UseUploadOptions): UploadState & UploadOperations {
  const { currentFolderId, onUploadSuccess } = options;
  const { files, setFiles } = useFileStore();
  const { showToast } = useUIStore();
  const { gateways } = useGatewayStore();
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // 验证文件
  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    // 文件大小检查
    if (file.size > CONFIG.UPLOAD.MAX_SIZE) {
      return { valid: false, error: `文件 ${file.name} 超过1GB限制` };
    }
    
    // 文件名安全检查
    if (!isSafeFilename(file.name)) {
      return { valid: false, error: `文件 ${file.name} 包含非法字符` };
    }
    
    // MIME 类型检查
    if (file.type && !isAllowedFileType(file.type)) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      const allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'pdf', 'txt', 'md', 'json', 'mp4', 'webm', 'mp3', 'wav', 'zip', 'rar'];
      if (ext && !allowedExts.includes(ext)) {
        return { valid: false, error: `文件 ${file.name} 类型不支持` };
      }
    }
    
    return { valid: true };
  }, []);

  // 处理文件上传
  const handleFileUpload = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;

      const filesArray = Array.from(fileList);
      
      // 验证所有文件
      const validFiles: File[] = [];
      for (const file of filesArray) {
        const validation = validateFile(file);
        if (validation.valid) {
          validFiles.push(file);
        } else {
          showToast(validation.error!, "error");
        }
      }

      if (validFiles.length === 0) return;

      setIsUploading(true);
      const controller = new AbortController();
      setAbortController(controller);

      try {
        const token = await api.getToken();

        for (const file of validFiles) {
          if (controller.signal.aborted) break;

          setCurrentFile(file);
          setUploadProgress(0);

          try {
            // 步骤 1: 上传前计算文件 Hash
            showToast(`正在计算文件 ${file.name} 的校验值...`, "info");
            const localHash = await calculateFileHash(file, (hashProgress) => {
              setUploadProgress(Math.round(hashProgress * 0.2)); // Hash 计算占 20% 进度
            });

            // 步骤 2: 上传文件到 Crust
            const result = await uploadApi.uploadToCrust(file, token, (progress) => {
              setUploadProgress(20 + Math.round(progress * 0.6)); // 上传占 60% 进度
            });

            // 步骤 3: 验证上传结果
            if (!result.cid || !result.hash) {
              throw new Error("上传响应缺少必要信息");
            }

            // 步骤 4: 使用安全的文件名
            const safeName = sanitizeFilename(file.name);

            // 步骤 5: 创建文件记录（包含本地计算的 hash）
            const fileRecord: FileRecord = {
              id: generateId(),
              name: safeName,
              size: result.size,
              cid: result.cid,
              date: new Date().toLocaleString(),
              folder_id: currentFolderId || "default",
              hash: localHash, // 使用本地计算的 hash
              verified: false,
              verify_status: "pending",
              uploadedAt: Date.now(),
            };

            await api.saveFile(fileRecord);
            setFiles((prev) => [fileRecord, ...prev]);

            // 步骤 6: 后台完整性验证
            setUploadProgress(80);
            uploadApi.verifyFileWithHash(result.cid, localHash, file.size).then((verifyResult) => {
              const updatedFile: FileRecord = {
                ...fileRecord,
                verified: verifyResult.verified,
                verify_status: verifyResult.status,
                verify_message: verifyResult.message,
              };

              // 更新本地状态
              setFiles((prev) =>
                prev.map((f) => (f.id === fileRecord.id ? updatedFile : f))
              );

              // 保存验证结果到服务器
              api.saveFile(updatedFile).catch((err) => {
                console.error("保存验证结果失败:", err);
              });

              // 根据验证结果显示提示
              if (verifyResult.verified) {
                showToast(`文件 ${safeName} 完整性验证通过`, "success");
              } else if (verifyResult.status === "failed") {
                showToast(`文件 ${safeName} 完整性验证失败: ${verifyResult.message}`, "error");

                // 自动添加到修复队列
                const repairService = getAutoRepairService();
                repairService.addTask(updatedFile);
                console.log(`[Upload] 文件已添加到自动修复队列: ${safeName}`);
              }
            }).catch((err) => {
              console.error("文件验证过程出错:", err);

              // 验证出错时也添加到修复队列
              const repairService = getAutoRepairService();
              repairService.addTask(fileRecord);
            });

            // 步骤 7: 后台静默传播文件到其他网关
            if (gateways.length > 0) {
              propagationApi.backgroundPropagate(result.cid, gateways, {
                maxGateways: 8,
                timeout: 15000,
                onComplete: (propResult) => {
                  if (propResult.success.length > 0) {
                    console.log(`文件已传播到 ${propResult.success.length} 个网关`);
                  }
                },
              });
            }

            setUploadProgress(100);
            showToast(`文件 ${safeName} 上传成功`, "success");
            onUploadSuccess?.(fileRecord);
          } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
              showToast("上传已取消", "info");
              break;
            }
            handleError(error, { showToast });
          }
        }
      } catch (error) {
        handleError(error, { showToast });
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
        setCurrentFile(null);
        setAbortController(null);
      }
    },
    [currentFolderId, setFiles, showToast, validateFile, onUploadSuccess, gateways]
  );

  // 拖拽处理
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileUpload(files);
      }
    },
    [handleFileUpload]
  );

  // 取消上传
  const cancelUpload = useCallback(() => {
    if (abortController) {
      abortController.abort();
    }
  }, [abortController]);

  return {
    // 状态
    isUploading,
    uploadProgress,
    currentFile,
    // 操作
    handleFileUpload,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    cancelUpload,
  };
}
