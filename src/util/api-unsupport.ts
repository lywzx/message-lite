import { throwExceptionAsync } from './exception';

/**
 * api decl un support
 */
export function ApiUnSupport(): Promise<any> {
  return throwExceptionAsync('api is not impl!');
}
