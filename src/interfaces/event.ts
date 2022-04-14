/**
 * evente interface
 */
export interface IEvent {
  /**
   * 监听事件
   */
  on(name: string, callback: (...args: any[]) => any): void;

  /**
   * 取消监听事件
   * @param name
   * @param callback
   */
  off(name: string, callback: (...args: any[]) => any): void;

  /**
   * 监听单次事件
   * @param name
   * @param callback
   */
  once(name: string, callback: (...args: any[]) => any): void;

  /**
   * 触发事件
   * @param name
   * @param callback
   */
  emit(name: string, callback: (...args: any[]) => any): void;

  /**
   * 清除所有事件
   */
  dispose(): void;
}
