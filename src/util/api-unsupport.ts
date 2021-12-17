/**
 * api decl un support
 */
export function ApiUnSupport(): Promise<never> {
  return Promise.reject(new Error('api is not impl!'));
}
