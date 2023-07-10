/**
 * event callback
 */
export type IEventCallback<V = any> = (...args: V[]) => any;

/**
 * evente interface
 */
export interface IEvent<T extends Record<any, any> = any> {
  /**
   * 监听事件
   */
  on<K extends keyof T>(name: K, callback: IEventCallback<T[K]>, once?: boolean): void;

  /**
   * 取消监听事件
   * @param name
   * @param callback
   * @param once
   */
  off<K extends keyof T>(name: K, callback?: IEventCallback<T[K]>, once?: boolean): void;

  /**
   * 监听单次事件
   * @param name
   * @param callback
   * @param once
   */
  once<K extends keyof T>(name: K, callback: IEventCallback<T[K]>): void;

  /**
   * 触发事件
   * @param name
   * @param args
   */
  emit<K extends keyof T>(name: K, ...args: Array<T[K]>): void;

  /**
   * 清除所有事件
   */
  dispose(): void;
}

export interface IEventConstructor<T = any> {
  new (): IEvent<T>;
}
