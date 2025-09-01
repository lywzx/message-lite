/**
 * API不支持错误
 */
export function ApiUnSupport(): Promise<never> {
  return Promise.reject(new Error('API not supported in declaration'));
}
