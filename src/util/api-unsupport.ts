/**
 * api decl un support
 */
export function ApiUnSupport(): Promise<any> {
  return Promise.reject(new Error('api is not impl!'));
}
