/**
 * 报错
 * @param message
 */
export function throwException(message: string) {
  throw new Error(message);
}

/**
 * 报异步消息
 * @param message
 */
export function throwExceptionAsync(message: string) {
  return Promise.reject(new Error(message));
}
