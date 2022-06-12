import { createDefer } from '../../src/util';

/**
 * sleep
 * @param timeout
 */
export function sleep(timeout = 10) {
  return createDefer(timeout).promise.catch(() => {
    // no thing
  });
}
