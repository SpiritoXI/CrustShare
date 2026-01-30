/**
 * 统一错误处理模块
 * 提供应用级别的错误处理和日志记录
 */

import type { ApiResponse } from "@/types";

/**
 * 应用错误类型
 */
export type ErrorType = 
  | 'API_ERROR'           // API 请求错误
  | 'AUTH_ERROR'          // 认证错误
  | 'VALIDATION_ERROR'    // 验证错误
  | 'NETWORK_ERROR'       // 网络错误
  | 'FILE_ERROR'          // 文件操作错误
  | 'UPLOAD_ERROR'        // 上传错误
  | 'UNKNOWN_ERROR';      // 未知错误

/**
 * 应用错误类
 */
export class AppError extends Error {
  constructor(
    message: string,
    public type: ErrorType,
    public statusCode: number = 500,
    public details?: unknown,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'AppError';
  }

  /**
   * 获取用户友好的错误消息
   */
  getUserMessage(): string {
    const messages: Record<ErrorType, string> = {
      API_ERROR: '服务器请求失败，请稍后重试',
      AUTH_ERROR: '认证失败，请重新登录',
      VALIDATION_ERROR: '输入数据不正确，请检查后重试',
      NETWORK_ERROR: '网络连接失败，请检查网络设置',
      FILE_ERROR: '文件操作失败',
      UPLOAD_ERROR: '文件上传失败，请重试',
      UNKNOWN_ERROR: '发生未知错误，请稍后重试',
    };
    return messages[this.type] || this.message;
  }
}

/**
 * API 错误类
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * 将任意错误转换为 AppError
 */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof ApiError) {
    return new AppError(
      error.message,
      error.status === 401 ? 'AUTH_ERROR' : 'API_ERROR',
      error.status,
      error.code,
      error
    );
  }

  if (error instanceof Error) {
    // 根据错误消息判断类型
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return new AppError(error.message, 'NETWORK_ERROR', 0, undefined, error);
    }
    if (error.message.includes('upload')) {
      return new AppError(error.message, 'UPLOAD_ERROR', 500, undefined, error);
    }
    return new AppError(error.message, 'UNKNOWN_ERROR', 500, undefined, error);
  }

  return new AppError('未知错误', 'UNKNOWN_ERROR', 500, error);
}

/**
 * 错误处理选项
 */
interface ErrorHandlerOptions {
  showToast?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  logError?: boolean;
  rethrow?: boolean;
}

/**
 * 处理错误
 */
export function handleError(
  error: unknown,
  options: ErrorHandlerOptions = {}
): AppError {
  const { showToast, logError = true, rethrow = false } = options;
  const appError = toAppError(error);

  // 记录错误
  if (logError) {
    console.error(`[${appError.type}]`, appError.message, {
      statusCode: appError.statusCode,
      details: appError.details,
      originalError: appError.originalError,
    });
  }

  // 显示错误提示
  if (showToast) {
    showToast(appError.getUserMessage(), 'error');
  }

  // 重新抛出错误
  if (rethrow) {
    throw appError;
  }

  return appError;
}

/**
 * 包装异步函数，自动处理错误
 */
export function withErrorHandling<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  options: ErrorHandlerOptions = {}
): (...args: Parameters<T>) => Promise<ReturnType<T> | undefined> {
  return async (...args: Parameters<T>) => {
    try {
      return await fn(...args) as ReturnType<T>;
    } catch (error) {
      handleError(error, options);
      return undefined;
    }
  };
}

/**
 * 创建 API 响应错误
 */
export function createApiError(message: string, status: number = 500): Response {
  const response: ApiResponse = {
    success: false,
    error: message,
  };

  return new Response(JSON.stringify(response), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

/**
 * 创建 API 成功响应
 */
export function createApiResponse<T>(data: T): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * 验证请求体
 */
export function validateRequestBody<T>(
  body: unknown,
  validator: (data: unknown) => data is T
): T | null {
  if (!body || typeof body !== 'object') {
    return null;
  }

  if (!validator(body)) {
    return null;
  }

  return body as T;
}

/**
 * 验证必填字段
 */
export function validateRequiredFields(
  data: Record<string, unknown>,
  fields: string[]
): string | null {
  for (const field of fields) {
    const value = data[field];
    if (value === undefined || value === null || value === '') {
      return `缺少必填字段: ${field}`;
    }
  }
  return null;
}
