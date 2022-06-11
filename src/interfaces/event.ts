/**
 * event callback
 */
export type IEventCallback = (...args: any[]) => any;

/**
 * evente interface
 */
export interface IEvent {
  /**
   * 监听事件
   */
  on(name: string, callback: IEventCallback, once?: boolean): void;

  /**
   * 取消监听事件
   * @param name
   * @param callback
   * @param once
   */
  off(name: string, callback: IEventCallback, once?: boolean): void;

  /**
   * 监听单次事件
   * @param name
   * @param callback
   * @param once
   */
  once(name: string, callback: IEventCallback): void;

  /**
   * 触发事件
   * @param name
   * @param args
   */
  emit(name: string, ...args: any[]): void;

  /**
   * 清除所有事件
   */
  dispose(): void;
}
