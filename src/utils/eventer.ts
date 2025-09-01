import { IEventer } from '../interfaces';

/**
 * 事件发射器实现
 */
export class Eventer<T = any> implements IEventer<T> {
  private listeners: Set<(data: T) => void> = new Set();

  /**
   * 监听事件
   */
  on(listener: (data: T) => void): () => void {
    this.listeners.add(listener);
    
    // 返回取消监听函数
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * 触发事件
   */
  emit(data: T): void {
    this.listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });
  }

  /**
   * 清除所有监听器
   */
  clear(): void {
    this.listeners.clear();
  }
}
