/**
 * Promise的defer内容
 */
export interface IPromiseDefer<T> {
  // 对应的promise方法
  promise: Promise<T>;
  // 对应的resolve方法
  resolve: (it?: T | PromiseLike<T>) => void;
  // reject的错误信息
  reject: (it?: any) => void;
}

/**
 * 生成promise的defer对象
 */
export function defer<T>(
  timeout: number | undefined = undefined,
  exception: (timeout?: number) => Error = (timeout) => new Error(`defer waiting timeout, ${timeout}ms`)
): IPromiseDefer<T> {
  let resolve: (value?: T | PromiseLike<T>) => void;
  let reject: (it?: any) => void;
  let timer: any;
  const wrapResolveOrReject = function (fn: (...args: any) => any) {
    return function (this: any, ...args: any[]) {
      if (typeof timer !== 'undefined') {
        clearTimeout(timer);
        timer = undefined;
      }
      fn.call(this, ...args);
    };
  };
  const promise = new Promise<T>((r, j) => {
    resolve = wrapResolveOrReject(r);
    reject = wrapResolveOrReject(j);
    if (typeof timeout === 'number') {
      timer = setTimeout(() => {
        timer = undefined;
        reject(exception(timeout));
      }, timeout);
    }
  });

  return {
    promise,
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    resolve,
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    reject,
  };
}
