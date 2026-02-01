/**
 * Hooks 统一导出
 */

// 原有的 hooks
export { useDashboard } from "./use-dashboard";
export { useSharePage } from "./use-share-page";

// 新拆分的 hooks
export { useFileOperations } from "./use-file-operations";
export type { FileOperations, FileOperationsState } from "./use-file-operations";

export { useFolderOperations } from "./use-folder-operations";
export type { FolderOperations, FolderOperationsState } from "./use-folder-operations";

export { useUpload } from "./use-upload";
export type { UploadState, UploadOperations } from "./use-upload";

export { useGateway } from "./use-gateway";
export type { GatewayState, GatewayOperations } from "./use-gateway";

// 流媒体优化 hook
export { useStreamingOptimizer } from "./use-streaming-optimizer";
export type {
  NetworkQuality,
  NetworkStatus,
  PreloadStrategy,
  PreloadConfig,
  BitrateLevel,
} from "./use-streaming-optimizer";

// 自动修复 hook
export { useAutoRepair } from "./use-auto-repair";
export type {
  UseAutoRepairReturn,
} from "./use-auto-repair";
