import { IEventer } from '../interfaces';
import { EventEmitter } from './event-emitter';

/**
 * 事件发射器实现（基于EventEmitter）
 */
export class Eventer<T = any> implements IEventer<T> {
  private eventEmitter = new EventEmitter();
  private readonly EVENT_NAME = '__eventer_data__';

  /**
   * 监听事件
   */
  on(listener: (data: T) => void): () => void {
    this.eventEmitter.on(this.EVENT_NAME, listener);
    
    // 返回取消监听函数
    return () => {
      this.eventEmitter.off(this.EVENT_NAME, listener);
    };
  }

  /**
   * 触发事件
   */
  emit(data: T): void {
    this.eventEmitter.emit(this.EVENT_NAME, data);
  }

  /**
   * 清除所有监听器
   */
  clear(): void {
    this.eventEmitter.removeAllListeners(this.EVENT_NAME);
  }
}
