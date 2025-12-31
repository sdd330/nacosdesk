/**
 * 错误处理工具
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string | number
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function handleError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return '未知错误'
}

