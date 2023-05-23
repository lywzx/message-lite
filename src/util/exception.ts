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

export interface IErrorToPlainObject {
  name: string;
  message: string;
  stack?: string;
}

/**
 * 将异常转成纯对象
 * @param error
 */
export function errorToPlain(error: any): IErrorToPlainObject | undefined {
  if (error && (error.name || error.message || error.stack)) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
}

/**
 * 普通对象转换error对象
 * @param errorData
 */
export function plainToError(errorData: IErrorToPlainObject): Error {
  const error = Object.create(Error.prototype);
  (Object.getOwnPropertyNames(errorData) as Array<keyof IErrorToPlainObject>).forEach((key) => {
    error[key] = errorData[key];
  });
  return error;
}
